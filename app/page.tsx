"use client";

import { useMemo, useState } from "react";

type PresignedPutResponse = {
  url: string;
  key: string;
};

export default function Home() {
  const [status, setStatus] = useState("");
  const [passphrase, setPassphrase] = useState("");

  const maxFiles = useMemo(
    () => Number(process.env.NEXT_PUBLIC_MAX_FILES ?? 15),
    [],
  );

  async function uploadOne(file: File) {
    // Step 1: ask server for presigned PUT URL
    const res = await fetch("/api/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type,
        passphrase,
      }),
    });

    if (!res.ok) throw new Error(await res.text());

    const data: PresignedPutResponse = await res.json();

    // Step 2: upload file directly with PUT
    const upload = await fetch(data.url, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
    });

    if (!upload.ok) {
      const text = await upload.text().catch(() => "");
      throw new Error(`R2 upload failed (${upload.status}): ${text}`);
    }

    return data.key;
  }

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const slice = files.slice(0, maxFiles);

    if (files.length > maxFiles) {
      setStatus(`Limiting to ${maxFiles} files per upload session…`);
    }

    try {
      for (let i = 0; i < slice.length; i++) {
        setStatus(`Uploading ${i + 1}/${slice.length}: ${slice[i].name}`);
        await uploadOne(slice[i]);
      }

      setStatus("✅ Uploaded — thank you!");
      e.target.value = "";
    } catch (err: any) {
      setStatus(`❌ ${err?.message ?? "Upload failed"}`);
    }
  }

  return (
    <main
      style={{
        maxWidth: 520,
        margin: "40px auto",
        padding: 16,
        fontFamily: "system-ui",
      }}
    >
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Share photos1 📸</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>
        Upload up to {maxFiles} photos. No login needed.
      </p>

      <input
        placeholder="Event passcode (if required)"
        value={passphrase}
        onChange={(e) => setPassphrase(e.target.value)}
        style={{ width: "100%", padding: 10, margin: "12px 0" }}
      />

      <input type="file" accept="image/*" multiple onChange={onChange} />

      <div style={{ marginTop: 16, minHeight: 24 }}>{status}</div>
    </main>
  );
}
