import "dotenv/config";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { parseArgs } from "node:util";
import { loadConfig } from "../conf/config";
import { MAX_SOURCE_BYTES, optimizeUploadImage } from "../src/lib/image-upload";
import { checkCloudinaryBudget, configureCloudinary, ImageUploadError, uploadOptimizedImage } from "../src/lib/cloudinary-images";

const { values } = parseArgs({
  options: {
    kind: { type: "string" },
    slug: { type: "string" },
    file: { type: "string" },
    help: { type: "boolean" },
    check: { type: "boolean" },
  },
});

async function main() {
  if (values.help) {
    console.log("npm run images:upload -- --kind product|farmer|store --slug SLUG --file PATH");
    console.log("Uploads a public image and replaces the selected record's main image URL.");
    console.log("Converts to WebP, at most 1600px and 200 KiB; rejects images above the quality floor's size budget.");
    console.log("npm run images:upload -- --check validates account access and quota without uploading or touching the database.");
    return;
  }
  if (values.check) {
    configureCloudinary();
    await checkCloudinaryBudget();
    console.log("Cloudinary account access and upload budget: OK. Nothing uploaded or changed.");
    return;
  }
  const { kind, slug, file } = values;
  if ((kind !== "product" && kind !== "farmer" && kind !== "store") || !slug || !file) {
    throw new ImageUploadError("Provide --kind product|farmer|store, --slug and --file (see --help)");
  }
  const cloudName = configureCloudinary();
  const imagePath = resolve(file);
  if (![".jpg", ".jpeg", ".png", ".webp", ".avif"].includes(extname(imagePath).toLowerCase())) {
    throw new ImageUploadError("Use a JPEG, PNG, WebP or AVIF image");
  }
  const info = await stat(imagePath);
  if (!info.isFile() || info.size === 0 || info.size > MAX_SOURCE_BYTES) {
    throw new ImageUploadError("Image must be a nonempty file no larger than 10 MB");
  }
  const optimized = await optimizeUploadImage(await readFile(imagePath)).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Image optimization failed");
    throw new Error("Image was not uploaded");
  });
  console.log(`Image prepared: ${(info.size / 1024).toFixed(1)} KB -> ${(optimized.length / 1024).toFixed(1)} KB WebP`);
  const postgres = loadConfig().database.postgres;
  process.env.DATABASE_URL ||= postgres.url;
  process.env.DIRECT_URL ||= postgres.direct_url || postgres.url;
  const { prisma } = await import("../src/lib/prisma");
  try {
    const where = { slug };
    const select = { id: true };
    const record = kind === "product"
      ? await prisma.product.findUnique({ where, select })
      : kind === "farmer"
        ? await prisma.farmer.findUnique({ where, select })
        : await prisma.organicStore.findUnique({ where, select });
    if (!record) throw new ImageUploadError("No matching record; nothing uploaded");
    const uploaded = await uploadOptimizedImage(optimized, kind, cloudName);
    try {
      const imageUrl = uploaded.secure_url;
      const recordWhere = { id: record.id };
      if (kind === "product") {
        await prisma.product.update({ where: recordWhere, data: { imageUrl } });
      } else if (kind === "farmer") {
        await prisma.farmer.update({ where: recordWhere, data: { photoUrl: imageUrl } });
      } else {
        await prisma.organicStore.update({ where: recordWhere, data: { photoUrl: imageUrl } });
      }
    } catch {
      console.error(`Database update failed. Uploaded asset retained for recovery: ${uploaded.public_id}`);
      throw new Error("Image URL was not saved; inspect the record before retrying");
    }
    console.log(`Updated ${kind} ${slug}: ${uploaded.secure_url}`);
    console.log("Cached catalogue pages refresh within five minutes. Previous images were not deleted.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof ImageUploadError ? error.message : "Image upload failed. Check arguments, credentials, file and database access. Use --help for syntax.");
  process.exitCode = 1;
});