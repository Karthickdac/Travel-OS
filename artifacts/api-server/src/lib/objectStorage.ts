import { Storage, File } from "@google-cloud/storage";
import { Readable } from "stream";
import { createReadStream, createWriteStream } from "fs";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID, createHmac, timingSafeEqual } from "crypto";
import type { Request } from "express";
import { getObjectAclPolicy } from "./objectAcl";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

// 10MB — kept in sync with the route-level guard.
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

/**
 * A storage-backend-agnostic descriptor returned to the client.
 * `uploadURL` is where the browser PUTs the file bytes; `objectPath` is the
 * canonical `/objects/...` path we persist in the database.
 */
export interface UploadDescriptor {
  uploadURL: string;
  objectPath: string;
}

/**
 * Common interface implemented by every storage backend. The route layer only
 * ever talks to this — it never knows whether bytes live in GCS or on local disk.
 */
interface StorageBackend {
  getUploadDescriptor(req: Request): Promise<UploadDescriptor>;
  serveObjectEntity(objectPath: string): Promise<Response>;
  servePublicObject(filePath: string): Promise<Response | null>;
  /**
   * Only used by the local backend to receive the PUT body. The Replit backend
   * uploads straight to GCS via a signed URL, so this throws there.
   */
  acceptUpload(uploadPath: string, query: Record<string, unknown>, req: Request): Promise<void>;
}

// ─── Replit / Google Cloud Storage backend (default) ───────────────────────

const objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token",
      },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

function parseObjectPath(p: string): { bucketName: string; objectName: string } {
  if (!p.startsWith("/")) {
    p = `/${p}`;
  }
  const pathParts = p.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }
  return {
    bucketName: pathParts[1],
    objectName: pathParts.slice(2).join("/"),
  };
}

async function signObjectURL({
  bucketName,
  objectName,
  method,
  ttlSec,
}: {
  bucketName: string;
  objectName: string;
  method: "GET" | "PUT" | "DELETE" | "HEAD";
  ttlSec: number;
}): Promise<string> {
  const request = {
    bucket_name: bucketName,
    object_name: objectName,
    method,
    expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
  };
  const response = await fetch(
    `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(30_000),
    }
  );
  if (!response.ok) {
    throw new Error(
      `Failed to sign object URL, errorcode: ${response.status}, ` +
        `make sure you're running on Replit`
    );
  }
  const { signed_url: signedURL } = (await response.json()) as { signed_url: string };
  return signedURL;
}

class ReplitStorageBackend implements StorageBackend {
  private getPublicSearchPaths(): Array<string> {
    const pathsStr = process.env.PUBLIC_OBJECT_SEARCH_PATHS || "";
    const paths = Array.from(
      new Set(
        pathsStr
          .split(",")
          .map((p) => p.trim())
          .filter((p) => p.length > 0)
      )
    );
    if (paths.length === 0) {
      throw new Error(
        "PUBLIC_OBJECT_SEARCH_PATHS not set. Create a bucket in 'Object Storage' " +
          "tool and set PUBLIC_OBJECT_SEARCH_PATHS env var (comma-separated paths)."
      );
    }
    return paths;
  }

  private getPrivateDir(): string {
    const dir = process.env.PRIVATE_OBJECT_DIR || "";
    if (!dir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' " +
          "tool and set PRIVATE_OBJECT_DIR env var."
      );
    }
    return dir;
  }

  private normalizePath(rawPath: string): string {
    if (!rawPath.startsWith("https://storage.googleapis.com/")) {
      return rawPath;
    }
    const url = new URL(rawPath);
    const rawObjectPath = url.pathname;
    let dir = this.getPrivateDir();
    if (!dir.endsWith("/")) dir = `${dir}/`;
    if (!rawObjectPath.startsWith(dir)) return rawObjectPath;
    return `/objects/${rawObjectPath.slice(dir.length)}`;
  }

  private async getEntityFile(objectPath: string): Promise<File> {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }
    const parts = objectPath.slice(1).split("/");
    if (parts.length < 2) {
      throw new ObjectNotFoundError();
    }
    const entityId = parts.slice(1).join("/");
    let entityDir = this.getPrivateDir();
    if (!entityDir.endsWith("/")) entityDir = `${entityDir}/`;
    const { bucketName, objectName } = parseObjectPath(`${entityDir}${entityId}`);
    const objectFile = objectStorageClient.bucket(bucketName).file(objectName);
    const [exists] = await objectFile.exists();
    if (!exists) throw new ObjectNotFoundError();
    return objectFile;
  }

  private async download(file: File, cacheTtlSec = 3600): Promise<Response> {
    const [metadata] = await file.getMetadata();
    const aclPolicy = await getObjectAclPolicy(file);
    const isPublic = aclPolicy?.visibility === "public";
    const webStream = Readable.toWeb(file.createReadStream()) as ReadableStream;
    const headers: Record<string, string> = {
      "Content-Type": (metadata.contentType as string) || "application/octet-stream",
      "Cache-Control": `${isPublic ? "public" : "private"}, max-age=${cacheTtlSec}`,
    };
    if (metadata.size) headers["Content-Length"] = String(metadata.size);
    return new Response(webStream, { headers });
  }

  async getUploadDescriptor(_req: Request): Promise<UploadDescriptor> {
    const objectId = randomUUID();
    const fullPath = `${this.getPrivateDir()}/uploads/${objectId}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);
    const uploadURL = await signObjectURL({ bucketName, objectName, method: "PUT", ttlSec: 900 });
    return { uploadURL, objectPath: this.normalizePath(uploadURL) };
  }

  async serveObjectEntity(objectPath: string): Promise<Response> {
    return this.download(await this.getEntityFile(objectPath));
  }

  async servePublicObject(filePath: string): Promise<Response | null> {
    for (const searchPath of this.getPublicSearchPaths()) {
      const { bucketName, objectName } = parseObjectPath(`${searchPath}/${filePath}`);
      const file = objectStorageClient.bucket(bucketName).file(objectName);
      const [exists] = await file.exists();
      if (exists) return this.download(file);
    }
    return null;
  }

  async acceptUpload(): Promise<void> {
    throw new ObjectNotFoundError();
  }
}

// ─── Local filesystem backend (for VPS / self-hosting) ─────────────────────

const CONTENT_TYPE_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".bmp": "image/bmp",
  ".avif": "image/avif",
};

function contentTypeForExt(name: string): string {
  return CONTENT_TYPE_BY_EXT[path.extname(name).toLowerCase()] || "application/octet-stream";
}

class LocalStorageBackend implements StorageBackend {
  private root(): string {
    return path.resolve(process.env.LOCAL_STORAGE_DIR || path.join(process.cwd(), "storage-data"));
  }

  private secret(): string {
    const s = process.env.SESSION_SECRET;
    if (!s) throw new Error("SESSION_SECRET is required for local storage upload signing.");
    return s;
  }

  private sign(objectId: string, exp: number): string {
    return createHmac("sha256", this.secret()).update(`${objectId}:${exp}`).digest("hex");
  }

  // Resolve a relative entity id to an absolute path, guarding against traversal.
  private resolveInside(base: string, rel: string): string {
    const resolved = path.resolve(base, rel);
    const baseResolved = path.resolve(base);
    if (resolved !== baseResolved && !resolved.startsWith(baseResolved + path.sep)) {
      throw new ObjectNotFoundError();
    }
    return resolved;
  }

  private async serveFile(absPath: string, contentType: string, isPublic: boolean): Promise<Response> {
    let stat;
    try {
      stat = await fs.stat(absPath);
    } catch {
      throw new ObjectNotFoundError();
    }
    if (!stat.isFile()) throw new ObjectNotFoundError();
    const webStream = Readable.toWeb(createReadStream(absPath)) as ReadableStream;
    return new Response(webStream, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(stat.size),
        "Cache-Control": `${isPublic ? "public" : "private"}, max-age=3600`,
      },
    });
  }

  async getUploadDescriptor(req: Request): Promise<UploadDescriptor> {
    const objectId = randomUUID();
    const exp = Date.now() + 900_000; // 15 min
    const sig = this.sign(objectId, exp);
    // The response contract requires an absolute URI. Build a same-origin URL
    // from the incoming request so the browser PUTs back to this same server.
    const proto = (req.headers["x-forwarded-proto"] as string)?.split(",")[0] || req.protocol;
    const host = req.get("host");
    const base = host ? `${proto}://${host}` : "";
    return {
      uploadURL: `${base}/api/storage/upload-target/${objectId}?exp=${exp}&sig=${sig}`,
      objectPath: `/objects/uploads/${objectId}`,
    };
  }

  async acceptUpload(uploadPath: string, query: Record<string, unknown>, req: Request): Promise<void> {
    const objectId = uploadPath.replace(/^\/+/, "");
    if (!objectId || objectId.includes("/")) throw new ObjectNotFoundError();

    const exp = Number(query.exp);
    const sig = typeof query.sig === "string" ? query.sig : "";
    if (!Number.isFinite(exp) || exp < Date.now()) {
      throw new Error("Upload URL has expired");
    }
    const expected = this.sign(objectId, exp);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new Error("Invalid upload signature");
    }

    // Reject oversized uploads up front when the client declares its size,
    // so we can return a clean 400 without writing anything to disk.
    const declaredLen = Number(req.headers["content-length"]);
    if (Number.isFinite(declaredLen) && declaredLen > MAX_UPLOAD_BYTES) {
      req.resume(); // drain the body so the response can be delivered
      throw new Error("File exceeds the 10MB size limit");
    }

    const contentType = (req.headers["content-type"] as string) || "application/octet-stream";
    const dir = path.join(this.root(), "private", "uploads");
    await fs.mkdir(dir, { recursive: true });
    const dest = path.join(dir, objectId);

    await new Promise<void>((resolve, reject) => {
      let bytes = 0;
      let settled = false;
      const out = createWriteStream(dest);

      const fail = (err: Error) => {
        if (settled) return;
        settled = true;
        req.unpipe(out);
        out.destroy();
        req.resume(); // drain remaining bytes so the socket stays usable
        fs.rm(dest, { force: true }).finally(() => reject(err));
      };

      // Backstop for chunked uploads with no declared Content-Length.
      req.on("data", (chunk: Buffer) => {
        bytes += chunk.length;
        if (bytes > MAX_UPLOAD_BYTES) fail(new Error("File exceeds the 10MB size limit"));
      });
      req.on("error", fail);
      out.on("error", fail);
      out.on("finish", () => {
        if (!settled) {
          settled = true;
          resolve();
        }
      });

      req.pipe(out);
    });

    await fs.writeFile(`${dest}.meta.json`, JSON.stringify({ contentType }));
  }

  async serveObjectEntity(objectPath: string): Promise<Response> {
    if (!objectPath.startsWith("/objects/")) throw new ObjectNotFoundError();
    const entityId = objectPath.slice("/objects/".length);
    const base = path.join(this.root(), "private");
    const absPath = this.resolveInside(base, entityId);
    let contentType = "application/octet-stream";
    try {
      const meta = JSON.parse(await fs.readFile(`${absPath}.meta.json`, "utf8"));
      if (meta?.contentType) contentType = meta.contentType;
    } catch {
      contentType = contentTypeForExt(entityId);
    }
    return this.serveFile(absPath, contentType, false);
  }

  async servePublicObject(filePath: string): Promise<Response | null> {
    const base = path.join(this.root(), "public");
    let absPath: string;
    try {
      absPath = this.resolveInside(base, filePath);
    } catch {
      return null;
    }
    try {
      return await this.serveFile(absPath, contentTypeForExt(filePath), true);
    } catch {
      return null;
    }
  }
}

// ─── Public service facade ─────────────────────────────────────────────────

function createBackend(): StorageBackend {
  return (process.env.STORAGE_BACKEND || "").toLowerCase() === "local"
    ? new LocalStorageBackend()
    : new ReplitStorageBackend();
}

export class ObjectStorageService {
  private backend: StorageBackend;

  constructor() {
    this.backend = createBackend();
  }

  getUploadDescriptor(req: Request): Promise<UploadDescriptor> {
    return this.backend.getUploadDescriptor(req);
  }

  serveObjectEntity(objectPath: string): Promise<Response> {
    return this.backend.serveObjectEntity(objectPath);
  }

  servePublicObject(filePath: string): Promise<Response | null> {
    return this.backend.servePublicObject(filePath);
  }

  acceptUpload(uploadPath: string, query: Record<string, unknown>, req: Request): Promise<void> {
    return this.backend.acceptUpload(uploadPath, query, req);
  }
}
