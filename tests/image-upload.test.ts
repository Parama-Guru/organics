import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import test from "node:test";
import { Writable } from "node:stream";
import { spawnSync } from "node:child_process";
import { v2 as cloudinary, type UploadApiOptions, type UploadResponseCallback } from "cloudinary";
import sharp from "sharp";
import { assertCloudinaryBudget, MAX_IMAGE_BYTES, MAX_SOURCE_BYTES, optimizeUploadImage } from "../src/lib/image-upload";
import { uploadOptimizedImage } from "../src/lib/cloudinary-images";

test("upload budget fails closed and reserves headroom below half the free plan", () => {
  assert.doesNotThrow(() => assertCloudinaryBudget({ credits: { usage: 11.9, limit: 25, used_percent: 47.6 } }));
  assert.throws(() => assertCloudinaryBudget({ credits: { usage: 12, limit: 25 } }), /budget reached/);
  assert.throws(() => assertCloudinaryBudget({ credits: { usage: 12, limit: 100 } }), /budget reached/);
  assert.throws(() => assertCloudinaryBudget({ credits: { usage: 4.5, limit: 10 } }), /budget reached/);
  for (const usage of [null, {}, { credits: { used: 0, limit: 25 } },
    { credits: { usage: NaN, limit: 25 } }, { credits: { usage: -1, limit: 25 } },
    { credits: { usage: 0, limit: 0 } }, { credits: { usage: 0, limit: Infinity } }]) {
    assert.throws(() => assertCloudinaryBudget(usage), /Cannot verify/);
  }
});

test("large images become bounded WebP without changing aspect ratio", async () => {
  const source = await sharp({ create: { width: 3000, height: 2000, channels: 3, background: "#268d55" } })
    .png().toBuffer();
  const output = await optimizeUploadImage(source);
  const metadata = await sharp(output).metadata();
  assert.equal(metadata.format, "webp");
  assert.equal(metadata.width, 1600);
  assert.equal(metadata.height, 1067);
  assert.ok(output.length <= MAX_IMAGE_BYTES);
});

test("small transparent images are not enlarged and metadata is removed", async () => {
  const source = await sharp({ create: { width: 120, height: 80, channels: 4, background: "#00000000" } })
    .withMetadata().png().toBuffer();
  const metadata = await sharp(await optimizeUploadImage(source)).metadata();
  assert.equal(metadata.width, 120);
  assert.equal(metadata.height, 80);
  assert.equal(metadata.hasAlpha, true);
  assert.equal(metadata.exif, undefined);
});

test("invalid and excessive inputs are rejected", async () => {
  await assert.rejects(optimizeUploadImage(Buffer.alloc(0)), /nonempty/);
  await assert.rejects(optimizeUploadImage(Buffer.alloc(MAX_SOURCE_BYTES + 1)), /10 MB/);
  await assert.rejects(optimizeUploadImage(Buffer.from("not an image")));
  await assert.rejects(optimizeUploadImage(Buffer.from('<svg width="10" height="10"></svg>')), /Use a JPEG/);
});

test("complex images are rejected instead of exceeding the budget or lowering quality further", async () => {
  const source = await sharp(randomBytes(1800 * 1200 * 3), { raw: { width: 1800, height: 1200, channels: 3 } })
    .png().toBuffer();
  await assert.rejects(optimizeUploadImage(source), /quality floor/);
});

test("EXIF orientation is applied before resizing and private metadata is stripped", async () => {
  const source = await sharp({ create: { width: 240, height: 120, channels: 3, background: "#268d55" } })
    .withMetadata({ orientation: 6 }).jpeg().toBuffer();
  const metadata = await sharp(await optimizeUploadImage(source)).metadata();
  assert.equal(metadata.width, 120);
  assert.equal(metadata.height, 240);
  assert.equal(metadata.orientation, undefined);
  assert.equal(metadata.exif, undefined);
});

test("actual pixel count is bounded before decoding", async () => {
  const source = await sharp({ create: { width: 6500, height: 6500, channels: 3, background: "#268d55" } })
    .png().toBuffer();
  assert.ok(source.length < MAX_SOURCE_BYTES);
  await assert.rejects(optimizeUploadImage(source), /pixel limit/);
});

test("Cloudinary stream receives only optimized bytes and rejects failed or unexpected responses", async (context) => {
  const source = await sharp({ create: { width: 120, height: 80, channels: 3, background: "#268d55" } })
    .png().toBuffer();
  const optimized = await optimizeUploadImage(source);
  const valid = {
    secure_url: "https://res.cloudinary.com/test-cloud/image/upload/v1/ossil/product/test.webp",
    public_id: "ossil/product/test", version: 1, format: "webp", resource_type: "image",
    type: "upload", bytes: optimized.length, width: 120, height: 80,
  };
  let usage: unknown = { credits: { usage: 0, limit: 25 } };
  let failUsage = false;
  let behavior = "success";
  let response = { ...valid };
  let uploads = 0;
  const received: Buffer[] = [];
  const optionsSeen: UploadApiOptions[] = [];
  context.mock.method(cloudinary.api, "usage", async () => {
    if (failUsage) throw new Error("SECRET_DO_NOT_LOG");
    return usage;
  });
  context.mock.method(cloudinary.uploader, "upload_stream", (options: UploadApiOptions, callback: UploadResponseCallback) => {
    uploads += 1;
    optionsSeen.push(options);
    return new Writable({
      write(chunk: Buffer, _encoding, done) {
        received.push(Buffer.from(chunk));
        if (behavior === "stream-error") done(new Error("SECRET_DO_NOT_LOG"));
        else done();
      },
      final(done) {
        if (behavior === "callback-error") callback({ message: "SECRET_DO_NOT_LOG", name: "Error", http_code: 401 });
        else if (behavior === "no-response") callback(undefined, undefined);
        else callback(undefined, response as Parameters<UploadResponseCallback>[1]);
        done();
      },
    });
  });
  for (const kind of ["product", "farmer", "store"] as const) {
    assert.equal((await uploadOptimizedImage(optimized, kind, "test-cloud")).secure_url, valid.secure_url);
    assert.equal(optionsSeen.at(-1)?.folder, `ossil/${kind}`);
    assert.equal(optionsSeen.at(-1)?.overwrite, false);
    assert.equal(optionsSeen.at(-1)?.resource_type, "image");
    assert.equal(optionsSeen.at(-1)?.timeout, 30000);
    assert.deepEqual(optionsSeen.at(-1)?.allowed_formats, ["webp"]);
    assert.deepEqual(received.at(-1), optimized);
  }
  const before = uploads;
  await assert.rejects(uploadOptimizedImage(source, "product", "test-cloud"), /Only optimized/);
  usage = { credits: { usage: 12, limit: 25 } };
  await assert.rejects(uploadOptimizedImage(optimized, "product", "test-cloud"), /budget reached/);
  usage = {};
  await assert.rejects(uploadOptimizedImage(optimized, "product", "test-cloud"), /Cannot verify/);
  failUsage = true;
  await assert.rejects(uploadOptimizedImage(optimized, "product", "test-cloud"), /usage check failed/);
  assert.equal(uploads, before);
  failUsage = false;
  usage = { credits: { usage: 0, limit: 25 } };
  for (behavior of ["stream-error", "callback-error", "no-response"]) {
    await assert.rejects(uploadOptimizedImage(optimized, "product", "test-cloud"), (error: Error) => {
      assert.match(error.message, /upload failed/);
      assert.ok(!error.message.includes("SECRET_DO_NOT_LOG"));
      return true;
    });
  }
  behavior = "success";
  for (const secure_url of [
    valid.secure_url.replace("https:", "http:"),
    valid.secure_url.replace("test-cloud", "other-cloud"),
    valid.secure_url.replace("res.cloudinary.com", "res.cloudinary.com.evil.example"),
    valid.secure_url.replace("/v1/", "/"),
    `${valid.secure_url}?unexpected=1`,
    `${valid.secure_url}#unexpected`,
    "not a URL",
  ]) {
    response = { ...valid, secure_url };
    await assert.rejects(uploadOptimizedImage(optimized, "product", "test-cloud"), /unexpected image/);
  }
  for (const invalid of [{ bytes: MAX_IMAGE_BYTES + 1 }, { format: "png" }, { width: 121 }, { version: 0 }]) {
    response = { ...valid, ...invalid };
    await assert.rejects(uploadOptimizedImage(optimized, "product", "test-cloud"), /unexpected image/);
  }
});

test("CLI help and missing-credential checks are safe without any account or database writes", () => {
  const env = { ...process.env, CLOUDINARY_CLOUD_NAME: "", CLOUDINARY_API_KEY: "", CLOUDINARY_API_SECRET: "" };
  const run = (flag: string) => spawnSync(process.execPath, ["--import", "tsx", "scripts/upload-image.mts", flag], {
    env, encoding: "utf8", timeout: 15000,
  });
  const help = run("--help");
  assert.equal(help.status, 0, help.stderr);
  assert.match(help.stdout, /--check/);
  const check = run("--check");
  assert.equal(check.status, 1);
  assert.match(check.stderr, /Set CLOUDINARY_CLOUD_NAME/);
});

test("Cloudinary configuration supports the tracked template and environment overrides without exposing secrets", () => {
  const code = `
    import assert from 'node:assert/strict';
    import { loadConfig } from './conf/config';
    const config = loadConfig().cloudinary;
    assert.ok(config.cloud_name === 'test-cloud');
    assert.ok(config.api_key === 'test-key');
    assert.ok(config.api_secret === 'test-secret');
    console.log('Cloudinary configuration: PASS');
  `;
  for (const configPath of ["", "conf/config.example.yaml"]) {
    const result = spawnSync(process.execPath, ["--import", "tsx", "--input-type=module", "-e", code], {
      encoding: "utf8", timeout: 15000,
      env: {
        ...process.env, CONFIG_PATH: configPath,
        CLOUDINARY_CLOUD_NAME: "test-cloud", CLOUDINARY_API_KEY: "test-key", CLOUDINARY_API_SECRET: "test-secret",
      },
    });
    assert.equal(result.status, 0, "Cloudinary configuration override failed");
    assert.match(result.stdout, /configuration: PASS/);
  }
});