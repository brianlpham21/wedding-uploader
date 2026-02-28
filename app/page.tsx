"use client";

import { useMemo, useState } from "react";

type PresignedPost = {
  url: string;
  fields: Record<string, string>;
  key: string;
};

export default function Home() {
  const [status, setStatus] = useState("");
  const [passphrase, setPassphrase] = useState("");

  const maxFiles = useMemo(
    () => Number(process.env.NEXT_PUBLIC_MAX_FILES ?? 15),
    [],
  );
  // (You can also hardcode 15 here and skip NEXT_PUBLIC env vars.)

  async function uploadOne(file: File) {
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
    const data: PresignedPost = await res.json();

    const form = new FormData();
    Object.entries(data.fields).forEach(([k, v]) => form.append(k, v));
    form.append("file", file);

    const up = await fetch(data.url, { method: "POST", body: form });
    if (!up.ok) throw new Error("Upload failed");
    return data.key;
  }

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const slice = files.slice(0, 15); // hard cap
    if (files.length > 15)
      setStatus("Limiting to 15 files per upload session…");

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
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Share photos 📸</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>
        Upload up to 15 photos. No login needed.
      </p>

      {/** Optional passcode to reduce random link abuse */}
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
