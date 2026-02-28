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

      setStatus("✅ Captured and developing! Thank you!");
      e.target.value = "";
    } catch (err: any) {
      if (err && err.message.includes("Wrong passphrase")) {
        setStatus("❌ Wrong passcode. Please check and try again.");
      } else {
        setStatus(`❌ ${err?.message ?? "Upload failed"}`);
      }
    } finally {
      setIsUploading(false);
    }
  }

  const hasCode = passphrase.trim().length > 0;
  const canUpload = hasCode && !isUploading;

  return (
    <main
      style={{
        maxWidth: 520,
        margin: "60px auto",
        padding: 24,
      }}
    >
      <div
        style={{
          background: "var(--color-peach-50)",
          border: `1px solid var(--color-pink-75)`,
          borderRadius: 20,
          padding: 28,
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: 42,
            marginBottom: 6,
            color: "#111",
            fontFamily: "var(--font-norway)",
          }}
        >
          Through Your Eyes
        </h1>

        <p
          style={{
            marginTop: 0,
            marginBottom: 20,
            color: "#666",
            fontSize: 15,
          }}
        >
          We’d love to see this day through your lens. Upload as many photos as
          you’d like.
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
            marginBottom: 10,
            borderRadius: 12,
            border: "1px solid #ddd",
            fontSize: 14,
            outline: "none",
            color: "#333",
            opacity: isUploading ? 0.7 : 1,
            background: isUploading ? "#f9f9f9" : "#fff",
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
          disabled={!canUpload}
        />

        {!hasCode && (
          <p
            style={{
              fontSize: 13,
              color: "#333",
              marginBottom: 10,
            }}
          >
            Enter the event passcode to upload photos.
          </p>
        )}

        {/* Styled button */}
        <label
          htmlFor={canUpload ? "file-upload" : undefined}
          style={{
            display: "inline-block",
            padding: "14px 22px",
            borderRadius: 14,
            background: canUpload ? "var(--color-coral-75)" : "#ddd",
            color: canUpload ? "#111" : "#888",
            fontWeight: 500,
            cursor: canUpload ? "pointer" : "not-allowed",
            fontSize: 15,
            transition: "all 0.2s ease",
            opacity: canUpload ? 1 : 0.7,
            userSelect: "none",
            width: "100%",
          }}
          aria-disabled={!canUpload}
        >
          {isUploading ? "Uploading…" : "Select Photos"}
        </label>

        {/* Status */}
        {status && (
          <div
            style={{
              marginTop: 18,
              minHeight: 24,
              fontSize: 14,
              color: status.startsWith("❌") ? "#c0392b" : "#333",
              wordBreak: "break-word",
              fontWeight: 500,
            }}
          >
            {status}
          </div>
        )}
      </div>
    </main>
  );
}
