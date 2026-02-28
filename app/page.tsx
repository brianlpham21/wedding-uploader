"use client";

import { useState } from "react";

type PresignedPutResponse = {
  url: string;
  key: string;
};

export default function Home() {
  const [status, setStatus] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [isUploading, setIsUploading] = useState(false);

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

    // Prevent accidental double uploads (e.g., double-tap / re-trigger while uploading)
    if (isUploading) {
      setStatus("Upload already in progress—please wait…");
      e.target.value = "";
      return;
    }

    setIsUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        setStatus(`Uploading ${i + 1}/${files.length}: ${files[i].name}`);
        await uploadOne(files[i]);
      }

      setStatus("✅ Uploaded — thank you!");
      e.target.value = "";
    } catch (err: any) {
      setStatus(`❌ ${err?.message ?? "Upload failed"}`);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: 520,
        margin: "60px auto",
        padding: 24,
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 20,
          padding: 28,
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: 30,
            marginBottom: 6,
            fontWeight: 600,
            color: "#111",
          }}
        >
          Share Photos
        </h1>

        <p
          style={{
            marginTop: 0,
            marginBottom: 20,
            color: "#666",
            fontSize: 15,
          }}
        >
          Upload as many photos as you’d like. No login needed.
        </p>

        {/* Passphrase input */}
        <input
          placeholder="Event passcode"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          disabled={isUploading}
          style={{
            width: "100%",
            padding: "12px 14px",
            marginBottom: 18,
            borderRadius: 12,
            border: "1px solid #ddd",
            fontSize: 14,
            outline: "none",
            color: "#333",
            opacity: isUploading ? 0.7 : 1,
          }}
        />

        {/* Hidden file input */}
        <input
          id="file-upload"
          type="file"
          accept="image/*"
          multiple
          onChange={onChange}
          style={{ display: "none" }}
          disabled={isUploading}
        />

        {/* Styled button */}
        <label
          htmlFor={isUploading ? undefined : "file-upload"}
          style={{
            display: "inline-block",
            padding: "14px 22px",
            borderRadius: 14,
            background: isUploading ? "#999" : "#111",
            color: "white",
            fontWeight: 500,
            cursor: isUploading ? "not-allowed" : "pointer",
            fontSize: 15,
            transition: "all 0.2s ease",
            opacity: isUploading ? 0.8 : 1,
            userSelect: "none",
          }}
          aria-disabled={isUploading}
        >
          {isUploading ? "Uploading…" : "Select Photos"}
        </label>

        {/* Status */}
        <div
          style={{
            marginTop: 18,
            minHeight: 24,
            fontSize: 14,
            color: status.startsWith("❌") ? "#c0392b" : "#333",
            wordBreak: "break-word",
          }}
        >
          {status}
        </div>
      </div>
    </main>
  );
}
