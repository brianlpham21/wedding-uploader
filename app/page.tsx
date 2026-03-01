"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type PresignedPutResponse = {
  url: string;
  key: string;
};

type PreviewItem = {
  id: string;
  file: File;
  url: string; // object URL for preview
};

export default function Home() {
  const [status, setStatus] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // ✅ Preview state
  const [selected, setSelected] = useState<PreviewItem[]>([]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      selected.forEach((p) => URL.revokeObjectURL(p.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // ✅ Instead of uploading immediately, we store previews first
  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    // Prevent accidental double uploads (e.g., double-tap / re-trigger while uploading)
    if (isUploading) {
      setStatus("Upload already in progress—please wait…");
      e.target.value = "";
      return;
    }

    const items: PreviewItem[] = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      url: URL.createObjectURL(file),
    }));

    // Replace selection (feel free to change to append if you want)
    // If replacing, revoke previous URLs to avoid leaks
    selected.forEach((p) => URL.revokeObjectURL(p.url));

    setSelected(items);
    setStatus("");
    e.target.value = "";
  }

  // ✅ Confirm upload
  async function onUploadConfirm() {
    if (!selected.length) return;

    if (isUploading) {
      setStatus("Upload already in progress—please wait…");
      return;
    }

    setIsUploading(true);

    try {
      for (let i = 0; i < selected.length; i++) {
        setStatus(
          `Uploading ${i + 1}/${selected.length}: ${selected[i].file.name}`,
        );
        await uploadOne(selected[i].file);
      }

      setStatus("✅ Captured and developing! Thank you!");

      // Clear selection after successful upload
      selected.forEach((p) => URL.revokeObjectURL(p.url));
      setSelected([]);
    } catch (err: any) {
      if (err && err.message?.includes("Wrong passphrase")) {
        setStatus("❌ Wrong passcode. Please check and try again.");
      } else {
        setStatus(`❌ ${err?.message ?? "Upload failed"}`);
      }
    } finally {
      setIsUploading(false);
    }
  }

  function clearSelection() {
    selected.forEach((p) => URL.revokeObjectURL(p.url));
    setSelected([]);
    setStatus("");
  }

  function removeOne(id: string) {
    setSelected((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item) URL.revokeObjectURL(item.url);
      return prev.filter((p) => p.id !== id);
    });
  }

  // const hasCode = passphrase.trim().length > 0;
  const canUpload = !isUploading;

  const thumb = "clamp(84px, 28vw, 120px)";

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
        <div>
          <div
            style={{
              fontSize: 15,
              marginBottom: 1,
              color: "#111",
              textTransform: "uppercase",
            }}
          >
            The wedding of
          </div>
          <h3
            style={{
              fontSize: 45,
              color: "#111",
              fontFamily: "var(--font-brother)",
            }}
          >
            Mio & Brian
          </h3>
        </div>
        <div
          style={{
            height: 1,
            width: "100%",
            backgroundColor: "#999",
            margin: "10px 0 20px 0",
            opacity: 0.25,
          }}
        />

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
            marginBottom: 5,
            color: "#666",
            fontSize: 15,
          }}
        >
          We’d love to see this day through your lens. Upload as many moments as
          you’d like.
        </p>

        <div
          style={{
            width: "100%",
            height: 50,
            margin: "0 auto",
            display: "flex",
            justifyContent: "center", // horizontal center
            alignItems: "center", // vertical center
            marginBottom: 10,
          }}
        >
          <Image src="/heart.png" alt="heart" width={25} height={25} />
        </div>

        {/* Passphrase input */}
        {/* <input
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
        /> */}

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

        {/* {!hasCode && (
          <p
            style={{
              fontSize: 13,
              color: "#333",
              marginBottom: 10,
            }}
          >
            Enter the event passcode to upload photos.
          </p>
        )} */}

        {/* Styled button */}
        {selected.length === 0 && (
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
            Take or Select Photos
          </label>
        )}

        {/* ✅ Preview + Confirm UI */}
        {selected.length > 0 && (
          <div style={{ textAlign: "left" }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 500,
                color: "#555",
                marginBottom: 10,
              }}
            >
              Preview ({selected.length})
            </div>

            <div
              style={{
                display: "flex",
                gap: 12,
                overflowX: "auto",
                paddingBottom: 6,
                scrollSnapType: "x mandatory",
              }}
            >
              {selected.map((p) => (
                <div
                  key={p.id}
                  style={{
                    position: "relative",
                    width: thumb, // controls thumbnail size
                    height: thumb,
                    borderRadius: 16,
                    overflow: "hidden",
                    border: "1px solid rgba(0,0,0,0.08)",
                    background: "#fff",
                    flexShrink: 0,
                    scrollSnapAlign: "start",
                  }}
                >
                  <img
                    src={p.url}
                    alt={p.file.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => removeOne(p.id)}
                    disabled={isUploading}
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      borderRadius: 999,
                      border: "none",
                      width: 40,
                      height: 40,
                      cursor: isUploading ? "not-allowed" : "pointer",
                      background: "rgba(0,0,0,0.65)",
                      color: "#fff",
                      fontSize: 20,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <button
                type="button"
                onClick={clearSelection}
                disabled={isUploading}
                style={{
                  flex: 1,
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1px solid rgba(0,0,0,0.15)",
                  background: "#999",
                  cursor: isUploading ? "not-allowed" : "pointer",
                  fontWeight: 500,
                  color: "#fff",
                }}
              >
                Clear
              </button>

              <button
                type="button"
                onClick={onUploadConfirm}
                disabled={isUploading || selected.length === 0}
                style={{
                  flex: 2,
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "none",
                  background:
                    isUploading || selected.length === 0
                      ? "#bbb"
                      : "var(--color-coral-75)",
                  color: isUploading || selected.length === 0 ? "#666" : "#111",
                  cursor:
                    isUploading || selected.length === 0
                      ? "not-allowed"
                      : "pointer",
                  fontWeight: 500,
                }}
              >
                {isUploading ? "Uploading…" : "Upload Photos"}
              </button>
            </div>
          </div>
        )}

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
