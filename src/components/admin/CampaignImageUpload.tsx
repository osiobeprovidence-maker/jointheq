import { useState, useRef, useCallback } from "react";
import { Upload, X, ImageIcon, AlertCircle, CheckCircle2 } from "lucide-react";
import { uploadCampaignImage, validateImage } from "../../lib/storage";

interface CampaignImageUploadProps {
  label: string;
  currentUrl?: string;
  onUpload: (url: string) => void;
  onRemove: () => void;
  onUploadStart?: () => void;
  generateUploadUrl: () => Promise<string>;
  resolveUploadUrl: (args: { storageId: string }) => Promise<string>;
}

export function CampaignImageUpload({
  label,
  currentUrl,
  onUpload,
  onRemove,
  onUploadStart,
  generateUploadUrl,
  resolveUploadUrl,
}: CampaignImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const hasImage = preview || currentUrl;

  const handleFileSelect = useCallback(async (file: File | null) => {
    setError(null);
    setSuccess(null);

    if (!file) return;

    const validationError = validateImage(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setPreview(URL.createObjectURL(file));
    setUploading(true);
    setProgress(0);
    onUploadStart?.();

    try {
      const url = await uploadCampaignImage(
        file,
        generateUploadUrl,
        resolveUploadUrl,
        setProgress,
      );
      onUpload(url);
      setSuccess("Uploaded successfully");
      setUploading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setPreview(null);
      setUploading(false);
      setProgress(0);
    }
  }, [generateUploadUrl, resolveUploadUrl, onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    handleFileSelect(file);
  }, [handleFileSelect]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files?.[0] ?? null);
  };

  const handleRemove = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setProgress(0);
    setError(null);
    setSuccess(null);
    onRemove();
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
        {label}
      </label>

      {hasImage && !uploading ? (
        <div className="relative rounded-xl border border-black/10 overflow-hidden group">
          <img
            src={preview || currentUrl}
            alt={label}
            className="w-full h-40 object-cover"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="h-9 px-4 rounded-xl bg-white text-zinc-900 text-[10px] font-black hover:bg-zinc-100 transition-colors"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="h-9 w-9 rounded-xl bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
          {success && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full">
              <CheckCircle2 size={10} /> {success}
            </div>
          )}
        </div>
      ) : uploading ? (
        <div className="rounded-xl border border-black/10 bg-zinc-50 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full border-2 border-zinc-300 border-t-zinc-900 animate-spin" />
            <div>
              <div className="text-xs font-bold text-zinc-700">Uploading...</div>
              <div className="text-[10px] font-semibold text-zinc-400">{progress}%</div>
            </div>
          </div>
          <div className="w-full h-1.5 bg-zinc-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-zinc-900 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => inputRef.current?.click()}
          className="rounded-xl border-2 border-dashed border-black/10 hover:border-black/30 bg-zinc-50 hover:bg-zinc-100 transition-colors cursor-pointer p-8 text-center"
        >
          <ImageIcon size={28} className="mx-auto mb-2 text-zinc-300" />
          <div className="text-sm font-bold text-zinc-500">
            Drag & drop or click to upload
          </div>
          <div className="text-[10px] font-semibold text-zinc-400 mt-1">
            JPG, JPEG, PNG, WebP (max 5MB)
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-red-500 text-[10px] font-black">
          <AlertCircle size={12} /> {error}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
}
