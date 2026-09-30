import "dotenv/config";
import assert from "node:assert/strict";
import sharp from "sharp";
import { v2 as cloudinary } from "cloudinary";
import { configureCloudinary, ImageUploadError, uploadOptimizedImage } from "../src/lib/cloudinary-images";
import { MAX_IMAGE_BYTES, optimizeUploadImage } from "../src/lib/image-upload";

async function main() {
  const base = new URL(process.env.BASE_URL ?? "http://localhost:3000");
  if (!["localhost", "127.0.0.1", "[::1]"].includes(base.hostname) || !["http:", "https:"].includes(base.protocol)) {
    throw new ImageUploadError("Run this verification against a local application server only");
  }
  const cloudName = configureCloudinary();
  const page = await fetch(new URL("/en", base), { signal: AbortSignal.timeout(60000) });
  assert.equal(page.status, 200, "Local homepage must load before testing Cloudinary");
  assert.ok(page.headers.get("content-security-policy")?.includes(`https://res.cloudinary.com/${cloudName}/image/upload/`),
    "Restart the app so its image policy reads the configured Cloudinary account");
  await page.arrayBuffer();

  const source = await sharp("public/products/a2-whole-milk.svg", { density: 144 })
    .png({ compressionLevel: 0 }).toBuffer();
  const optimized = await optimizeUploadImage(source);
  assert.ok(optimized.length <= MAX_IMAGE_BYTES);
  console.log(`Compression: ${(source.length / 1024).toFixed(1)} KiB -> ${(optimized.length / 1024).toFixed(1)} KiB WebP`);

  const uploaded = await uploadOptimizedImage(optimized, "product", cloudName);
  console.log("Signed upload, budget check and returned image validation: PASS");
  try {
    const delivered = await fetch(uploaded.secure_url, { signal: AbortSignal.timeout(30000) });
    assert.equal(delivered.status, 200, "Cloudinary CDN must serve the uploaded image");
    assert.deepEqual(Buffer.from(await delivered.arrayBuffer()), optimized);
    console.log("Cloudinary CDN bytes match the compressed upload: PASS");

    const imageUrl = new URL("/_next/image", base);
    imageUrl.search = new URLSearchParams({ url: uploaded.secure_url, w: "640", q: "75" }).toString();
    for (const pass of ["initial", "repeat"]) {
      const response = await fetch(imageUrl, {
        headers: { accept: "image/webp" }, signal: AbortSignal.timeout(60000),
      });
      assert.equal(response.status, 200, "Local optimizer must accept the configured account");
      const output = Buffer.from(await response.arrayBuffer());
      const metadata = await sharp(output).metadata();
      assert.equal(metadata.width, 640);
      assert.equal(metadata.format, "webp");
      assert.ok(output.length <= MAX_IMAGE_BYTES);
      console.log(`Local image delivery (${pass}): ${metadata.width}x${metadata.height}, ${(output.length / 1024).toFixed(1)} KiB: PASS`);
    }
    console.log(`Browser verification URL: ${imageUrl.href}`);
    imageUrl.searchParams.set("url", "https://res.cloudinary.com/unapproved-account/image/upload/v1/test.webp");
    const blocked = await fetch(imageUrl, { signal: AbortSignal.timeout(30000) });
    assert.equal(blocked.status, 400, "Other Cloudinary accounts must be rejected");
    await blocked.arrayBuffer();
    console.log("Other-account image rejection: PASS");
  } finally {
    try {
      const cleanup = await cloudinary.uploader.destroy(uploaded.public_id, {
        resource_type: "image", type: "upload", invalidate: true,
      });
      assert.equal(cleanup.result, "ok");
      console.log("Temporary verification asset deleted; catalogue unchanged: PASS");
    } catch {
      throw new ImageUploadError(`Remove temporary verification asset manually: ${uploaded.public_id}`);
    }
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof ImageUploadError ? error.message : "Cloudinary verification failed; check the last completed stage. No credentials were printed.");
  process.exitCode = 1;
});