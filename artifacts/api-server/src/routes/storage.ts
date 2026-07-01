import { Router, type IRouter, type Request, type Response } from "express";
import { Readable } from "stream";
import {
  RequestUploadUrlBody,
  RequestUploadUrlResponse,
} from "@workspace/api-zod";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage";

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB

/** Pipe a WHATWG Response (from the storage backend) to the Express response. */
function pipeResponse(response: globalThis.Response, res: Response): void {
  res.status(response.status);
  response.headers.forEach((value, key) => res.setHeader(key, value));
  if (response.body) {
    Readable.fromWeb(response.body as ReadableStream<Uint8Array>).pipe(res);
  } else {
    res.end();
  }
}

/**
 * POST /storage/uploads/request-url
 *
 * Request an upload URL for a file. The client sends JSON metadata (name, size,
 * contentType) — NOT the file — then PUTs the bytes to the returned URL.
 * On Replit the URL is a GCS presigned URL; on a self-hosted VPS
 * (STORAGE_BACKEND=local) it points back at this server's upload-target route.
 */
router.post("/storage/uploads/request-url", async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = RequestUploadUrlBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Missing or invalid required fields" });
    return;
  }

  try {
    const { name, size, contentType } = parsed.data;

    if (!contentType || !contentType.startsWith("image/")) {
      res.status(400).json({ error: "Only image uploads are allowed" });
      return;
    }
    if (typeof size === "number" && size > MAX_UPLOAD_BYTES) {
      res.status(400).json({ error: "File exceeds the 10MB size limit" });
      return;
    }

    const { uploadURL, objectPath } = await objectStorageService.getUploadDescriptor(req);

    res.json(
      RequestUploadUrlResponse.parse({
        uploadURL,
        objectPath,
        metadata: { name, size, contentType },
      }),
    );
  } catch (error) {
    req.log.error({ err: error }, "Error generating upload URL");
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
});

/**
 * PUT /storage/upload-target/*
 *
 * Receives file bytes for the local filesystem backend (self-hosted VPS).
 * Authorized by the short-lived HMAC signature minted in request-url.
 * On the Replit/GCS backend this route is unused (uploads go straight to GCS).
 */
router.put("/storage/upload-target/*uploadPath", async (req: Request, res: Response) => {
  try {
    const raw = req.params.uploadPath;
    const uploadPath = Array.isArray(raw) ? raw.join("/") : raw;
    await objectStorageService.acceptUpload(uploadPath, req.query as Record<string, unknown>, req);
    res.status(200).json({ ok: true });
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    req.log.error({ err: error }, "Error accepting upload");
    res.status(400).json({ error: (error as Error).message || "Upload failed" });
  }
});

/**
 * GET /storage/public-objects/*
 *
 * Serve public assets. Unconditionally public — no authentication or ACL checks.
 */
router.get("/storage/public-objects/*filePath", async (req: Request, res: Response) => {
  try {
    const raw = req.params.filePath;
    const filePath = Array.isArray(raw) ? raw.join("/") : raw;
    const response = await objectStorageService.servePublicObject(filePath);
    if (!response) {
      res.status(404).json({ error: "File not found" });
      return;
    }
    pipeResponse(response, res);
  } catch (error) {
    req.log.error({ err: error }, "Error serving public object");
    res.status(500).json({ error: "Failed to serve public object" });
  }
});

/**
 * GET /storage/objects/*
 *
 * Serve uploaded object entities.
 */
router.get("/storage/objects/*path", async (req: Request, res: Response) => {
  try {
    const raw = req.params.path;
    const wildcardPath = Array.isArray(raw) ? raw.join("/") : raw;
    const response = await objectStorageService.serveObjectEntity(`/objects/${wildcardPath}`);
    pipeResponse(response, res);
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      req.log.warn({ err: error }, "Object not found");
      res.status(404).json({ error: "Object not found" });
      return;
    }
    req.log.error({ err: error }, "Error serving object");
    res.status(500).json({ error: "Failed to serve object" });
  }
});

export default router;
