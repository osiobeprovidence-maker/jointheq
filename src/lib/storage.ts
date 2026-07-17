const ALLOWED_TYPES = ["image/jpg", "image/jpeg", "image/png", "image/webp", "image/svg+xml"];
const MAX_SIZE = 5 * 1024 * 1024;

export function validateImage(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Invalid file type. Allowed: JPG, JPEG, PNG, WebP, SVG";
  }
  if (file.size > MAX_SIZE) {
    return "File too large. Maximum size: 5MB";
  }
  return null;
}

async function retryGenerateUploadUrl(
  generateUploadUrl: () => Promise<string>,
  maxRetries = 3,
): Promise<string> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await generateUploadUrl();
    } catch (err) {
      lastError = err;
      console.warn(`generateUploadUrl attempt ${attempt}/${maxRetries} failed:`, err);
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, attempt * 1000));
      }
    }
  }
  console.error("generateUploadUrl failed after", maxRetries, "attempts:", lastError);
  throw new Error("Unable to prepare file upload. Image upload service is temporarily unavailable.");
}

export async function uploadCampaignImage(
  file: File,
  generateUploadUrl: () => Promise<string>,
  resolveUploadUrl: (args: { storageId: string }) => Promise<string>,
  onProgress?: (progress: number) => void,
): Promise<string> {
  const validationError = validateImage(file);
  if (validationError) throw new Error(validationError);

  const postUrl = await retryGenerateUploadUrl(generateUploadUrl);

  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.timeout = 60000;

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

    xhr.onerror = () => reject(new Error("Network error while uploading image."));
    xhr.ontimeout = () => reject(new Error("Upload failed. Please try again."));

    xhr.open("POST", postUrl);
    xhr.send(file);
  });
}
