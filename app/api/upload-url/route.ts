import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { filename, contentType, passphrase } = body ?? {};

    // Optional passcode gate (if you set it)
    if (
      process.env.UPLOAD_PASSPHRASE &&
      passphrase !== process.env.UPLOAD_PASSPHRASE
    ) {
      return NextResponse.json({ error: "Wrong passphrase" }, { status: 401 });
    }

    if (!filename || typeof filename !== "string") {
      return NextResponse.json({ error: "Missing filename" }, { status: 400 });
    }

    const safeName = filename.replace(/[^\w.\-()]/g, "_");
    const key = `${process.env.UPLOAD_PREFIX ?? ""}${crypto.randomUUID()}_${safeName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: key,
      ContentType: contentType || "application/octet-stream",
      // (Optional) helps prevent browser caching weirdness if you ever serve objects
      // CacheControl: "no-store",
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 60 });
    return NextResponse.json({ key, url });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Failed to create signed URL" },
      { status: 500 },
    );
  }
}
