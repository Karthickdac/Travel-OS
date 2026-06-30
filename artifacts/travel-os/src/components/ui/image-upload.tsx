import { useRef } from "react";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUpload, objectServingUrl } from "@/lib/use-upload";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  /** Current stored value (serving URL). Empty string when unset. */
  value: string;
  /** Called with the new serving URL after a successful upload, or "" when cleared. */
  onChange: (url: string) => void;
  className?: string;
  /** Visual size of the preview thumbnail. */
  previewClassName?: string;
  /** Accepted file types. Defaults to images. */
  accept?: string;
  disabled?: boolean;
}

export function ImageUpload({
  value,
  onChange,
  className,
  previewClassName,
  accept = "image/*",
  disabled,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { uploadFile, isUploading } = useUpload({
    onSuccess: (res) => onChange(objectServingUrl(res.objectPath)),
    onError: (err) =>
      toast({ variant: "destructive", title: "Upload failed", description: err.message }),
  });

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ variant: "destructive", title: "File too large", description: "Maximum size is 10 MB." });
      return;
    }
    await uploadFile(file);
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "relative flex items-center justify-center rounded-lg border border-input bg-muted/40 overflow-hidden flex-shrink-0",
          previewClassName ?? "h-16 w-24",
        )}
      >
        {value ? (
          <img
            src={value}
            alt="Uploaded preview"
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <ImageIcon className="h-5 w-5 text-muted-foreground" />
        )}
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleFile}
          disabled={disabled || isUploading}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading…
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" /> {value ? "Replace" : "Upload"}
            </>
          )}
        </Button>
        {value && !isUploading && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive h-7 px-2"
            onClick={() => onChange("")}
          >
            <X className="mr-1 h-3.5 w-3.5" /> Remove
          </Button>
        )}
      </div>
    </div>
  );
}
