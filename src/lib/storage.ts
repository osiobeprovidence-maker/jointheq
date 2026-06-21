const ALLOWED_TYPES = ["image/jpg", "image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;

export function validateImage(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Invalid file type. Allowed: JPG, JPEG, PNG, WebP";
  }
  if (file.size > MAX_SIZE) {
    return "File too large. Maximum size: 5MB";
  }
  return null;
}

export async function uploadCampaignImage(
  file: File,
  generateUploadUrl: () => Promise<string>,
  resolveUploadUrl: (args: { storageId: string }) => Promise<string>,
  onProgress?: (progress: number) => void,
): Promise<string> {
  const validationError = validateImage(file);
  if (validationError) throw new Error(validationError);

  const postUrl = await generateUploadUrl();

  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const { storageId } = JSON.parse(xhr.responseText);
          const publicUrl = await resolveUploadUrl({ storageId });
          resolve(publicUrl);
        } catch {
          reject(new Error("Failed to resolve upload URL"));
        }
      } else {
        reject(new Error("Upload failed"));
      }
    };

    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.ontimeout = () => reject(new Error("Upload timed out"));

    xhr.open("POST", postUrl);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.send(file);
  });
}
