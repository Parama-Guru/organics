import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import sharp from "sharp";
import { loadConfig } from "../../conf/config";
import { assertCloudinaryBudget, MAX_IMAGE_BYTES, MAX_IMAGE_DIMENSION } from "./image-upload";

export class ImageUploadError extends Error {}

export function configureCloudinary(): string {
  const { cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret } = loadConfig().cloudinary;
  if (!cloudName || !/^[a-zA-Z0-9_-]+$/.test(cloudName) || !apiKey || !apiSecret) {
    throw new ImageUploadError("Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in your private .env file, or cloudinary settings in conf/config.yaml");
  }
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
  return cloudName;
}

export async function checkCloudinaryBudget(): Promise<void> {
  let usage: unknown;
  try {
    usage = await cloudinary.api.usage({ timeout: 15000 });
  } catch {
    throw new ImageUploadError("Cloudinary usage check failed. Check credentials, Admin API permissions, rate limits and connectivity; nothing was uploaded");
  }
  try {
    assertCloudinaryBudget(usage);
  } catch (error) {
    throw new ImageUploadError(error instanceof Error ? error.message : "Cloudinary budget could not be checked");
  }
}

export async function uploadOptimizedImage(
  image: Buffer,
  kind: "product" | "farmer" | "store",
  cloudName: string,
): Promise<UploadApiResponse> {
  const metadata = await sharp(image).metadata();
  if (image.length > MAX_IMAGE_BYTES || metadata.format !== "webp" ||
      !metadata.width || !metadata.height || metadata.width > MAX_IMAGE_DIMENSION ||
      metadata.height > MAX_IMAGE_DIMENSION || (metadata.pages ?? 1) > 1) {
    throw new ImageUploadError("Only optimized WebP images within the size and dimension budget can be uploaded");
  }
  await checkCloudinaryBudget();
  let uploaded: UploadApiResponse;
  try {
    uploaded = await new Promise<UploadApiResponse>((resolveUpload, rejectUpload) => {
      const stream = cloudinary.uploader.upload_stream({
        resource_type: "image",
        type: "upload",
        folder: `ossil/${kind}`,
        allowed_formats: ["webp"],
        overwrite: false,
        unique_filename: true,
        use_filename: false,
        timeout: 30000,
      }, (error, result) => {
        if (error) rejectUpload(error);
        else if (!result) rejectUpload(new Error("Missing upload response"));
        else resolveUpload(result);
      });
      stream.once("error", rejectUpload);
      stream.end(image);
    });
  } catch {
    throw new ImageUploadError("Cloudinary upload failed. Check connectivity and credentials; no database update was attempted. Check the Media Library before retrying an interrupted upload");
  }
  let validUrl = false;
  try {
    const url = new URL(uploaded.secure_url);
    validUrl = url.origin === "https://res.cloudinary.com" &&
      url.pathname.startsWith(`/${cloudName}/image/upload/v${uploaded.version}/`) &&
      !url.username && !url.password && !url.search && !url.hash;
  } catch {}
  if (!validUrl || !Number.isInteger(uploaded.version) || uploaded.version <= 0 ||
      uploaded.resource_type !== "image" || uploaded.type !== "upload" || uploaded.format !== "webp" ||
      !Number.isFinite(uploaded.bytes) || uploaded.bytes <= 0 || uploaded.bytes > MAX_IMAGE_BYTES ||
      uploaded.width !== metadata.width || uploaded.height !== metadata.height) {
    throw new ImageUploadError("Cloudinary returned an unexpected image URL, format or size; no database update was attempted. Inspect the Media Library before retrying");
  }
  return uploaded;
}