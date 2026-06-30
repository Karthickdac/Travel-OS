import { useState, useCallback } from "react";

interface UploadMetadata {
  name: string;
  size: number;
  contentType: string;
}

interface UploadResponse {
  uploadURL: string;
  objectPath: string;
  metadata?: UploadMetadata;
}

interface UseUploadOptions {
  /** Base path where object storage routes are mounted (default: "/api/storage") */
  basePath?: string;
  onSuccess?: (response: UploadResponse) => void;
  onError?: (error: Error) => void;
}

/**
 * React hook for handling file uploads with presigned URLs.
 *
 * Two-step flow:
 * 1. Request a presigned URL from the backend (JSON metadata, NOT the file).
 * 2. Upload the file bytes directly to the presigned URL (Google Cloud Storage).
 */
export function useUpload(options: UseUploadOptions = {}) {
  const basePath = options.basePath ?? "/api/storage";
  const { onSuccess, onError } = options;
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);

  const uploadFile = useCallback(
    async (file: File): Promise<UploadResponse | null> => {
      setIsUploading(true);
      setError(null);
      setProgress(0);

      try {
        setProgress(10);
        const token = localStorage.getItem("token") ?? "";
        const res = await fetch(`${basePath}/uploads/request-url`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            name: file.name,
            size: file.size,
            contentType: file.type || "application/octet-stream",
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to get upload URL");
        }
        const uploadResponse: UploadResponse = await res.json();

        setProgress(40);
        const put = await fetch(uploadResponse.uploadURL, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type || "application/octet-stream" },
        });
        if (!put.ok) throw new Error("Failed to upload file to storage");

        setProgress(100);
        onSuccess?.(uploadResponse);
        return uploadResponse;
      } catch (err) {
        const e = err instanceof Error ? err : new Error("Upload failed");
        setError(e);
        onError?.(e);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [basePath, onSuccess, onError],
  );

  return { uploadFile, isUploading, error, progress };
}

/** Construct the public serving URL for a stored objectPath. */
export function objectServingUrl(objectPath: string): string {
  return `/api/storage${objectPath}`;
}
