import sharp from "sharp";

export const MAX_IMAGE_BYTES = 200 * 1024;
export const MAX_IMAGE_DIMENSION = 1600;
export const MAX_SOURCE_BYTES = 10 * 1024 * 1024;

export function assertCloudinaryBudget(usage: unknown): void {
  const credits = (usage as { credits?: { usage?: unknown; limit?: unknown } } | null)?.credits;
  if (typeof credits?.usage !== "number" || !Number.isFinite(credits.usage) || credits.usage < 0 ||
      typeof credits.limit !== "number" || !Number.isFinite(credits.limit) || credits.limit <= 0) {
    throw new Error("Cannot verify Cloudinary credit usage; upload blocked");
  }
  const ceiling = Math.min(12.5, credits.limit / 2);
  if (credits.usage >= ceiling - 0.5) {
    throw new Error("Cloudinary upload budget reached; review usage before uploading more images");
  }
}

export async function optimizeUploadImage(source: Buffer): Promise<Buffer> {
  if (!source.length || source.length > MAX_SOURCE_BYTES) {
    throw new Error("Source image must be nonempty and at most 10 MB");
  }
  const image = sharp(source, { limitInputPixels: 40_000_000, failOn: "warning" });
  const metadata = await image.metadata();
  if (!metadata.format || !["jpeg", "png", "webp", "avif", "heif"].includes(metadata.format)) {
    throw new Error("Use a JPEG, PNG, WebP or AVIF image");
  }
  if ((metadata.pages ?? 1) > 1) {
    throw new Error("Animated or multi-page images are not supported");
  }
  for (const quality of [90, 85, 80]) {
    const output = await image.clone()
      .rotate()
      .resize({
        width: MAX_IMAGE_DIMENSION,
        height: MAX_IMAGE_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality, effort: 6, smartSubsample: true })
      .toBuffer();
    if (output.length <= MAX_IMAGE_BYTES) return output;
  }
  throw new Error("Image exceeds 200 KiB at the quality floor. Crop it or choose a simpler image.");
}