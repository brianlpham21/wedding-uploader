import { NextResponse } from "next/server";
import { S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import crypto from "crypto";

const MAX_FILE_MB = Number(process.env.MAX_FILE_MB ?? "12");
const MAX_BYTES = MAX_FILE_MB * 1024 * 1024;

const s3 = new S3Client({
  region: "auto", // R2 uses region "auto" for S3 API compatibility :contentReference[oaicite:5]{index=5}
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { filename, contentType, passphrase } = body ?? {};

  // Optional “sign on the poster” passcode
  if (
    process.env.UPLOAD_PASSPHRASE &&
    passphrase !== process.env.UPLOAD_PASSPHRASE
  ) {
    return NextResponse.json({ error: "Wrong passphrase" }, { status: 401 });
  }

  if (!filename || !contentType) {
    return NextResponse.json(
      { error: "Missing filename/contentType" },
      { status: 400 },
    );
  }

  // Simple allowlist (adjust if you want video)
  const ok = ["image/jpeg", "image/png", "image/webp", "image/heic"];
  if (!ok.includes(contentType)) {
    return NextResponse.json(
      { error: "Unsupported file type" },
      { status: 400 },
    );
  }

  const safeName = String(filename).replace(/[^\w.\-()]/g, "_");
  const id = crypto.randomUUID();
  const key = `${process.env.UPLOAD_PREFIX ?? ""}${id}_${safeName}`;

  const presigned = await createPresignedPost(s3, {
    Bucket: process.env.R2_BUCKET!,
    Key: key,
    Conditions: [
      ["content-length-range", 1, MAX_BYTES],
      ["starts-with", "$Content-Type", ""],
    ],
    Fields: { "Content-Type": contentType },
    Expires: 60,
  });

  return NextResponse.json({ key, ...presigned });
}
