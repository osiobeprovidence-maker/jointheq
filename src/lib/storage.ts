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

  let postUrl: string;
  try {
    postUrl = await generateUploadUrl();
  } catch {
    throw new Error("Unable to generate upload URL. Storage service unavailable.");
  }

  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.timeout = 30000;

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
        reject(new Error("Upload failed with status " + xhr.status));
      }
    };

    xhr.onerror = () => reject(new Error("Upload failed. Please check your connection."));
    xhr.ontimeout = () => reject(new Error("File upload timed out. Please try again."));

    xhr.open("POST", postUrl);
    xhr.send(file);
  });
}
