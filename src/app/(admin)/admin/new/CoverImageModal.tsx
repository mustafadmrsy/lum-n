"use client";

import { useEffect, useRef, useState } from "react";

export default function CoverImageModal({
  open,
  initialUrl,
  userEmail,
  onClose,
  onSave,
}: {
  open: boolean;
  initialUrl: string;
  userEmail: string;
  onClose: () => void;
  onSave: (url: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [draftUrl, setDraftUrl] = useState<string>(initialUrl || "");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDraftUrl(initialUrl || "");
    setPreviewUrl("");
    setError(null);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }, [open, initialUrl]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4 py-8"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-[min(92vw,660px)] max-h-[85vh] rounded-2xl bg-white shadow-2xl border border-black/10 overflow-hidden">
        <div className="px-5 py-3 border-b border-black/10 flex items-center justify-between">
          <div className="font-serif text-lg leading-tight text-[var(--color-purple)]">Kapak Görseli</div>
          <button
            type="button"
            className="rounded-full border border-black/10 px-3 py-1 text-xs text-[var(--color-brown)]/80 hover:border-[var(--color-purple)] hover:text-[var(--color-purple)] transition-colors"
            onClick={onClose}
          >
            Kapat
          </button>
        </div>

        <div className="p-5 overflow-auto">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setError(null);

              const localPreview = URL.createObjectURL(f);
              if (previewUrl) URL.revokeObjectURL(previewUrl);
              setPreviewUrl(localPreview);

              setUploading(true);
              try {
                const res = await fetch("/api/uploads/presign", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    fileName: f.name,
                    contentType: f.type,
                    size: f.size,
                    userEmail,
                  }),
                });

                if (!res.ok) {
                  const data = await res.json().catch(() => ({}));
                  throw new Error(data?.error || "Presign alınamadı");
                }

                const data = (await res.json()) as { uploadUrl: string; publicUrl: string };
                if (!data?.uploadUrl || !data?.publicUrl) throw new Error("Presign yanıtı eksik");

                const put = await fetch(data.uploadUrl, {
                  method: "PUT",
                  headers: { "Content-Type": f.type },
                  body: f,
                });

                if (!put.ok) {
                  throw new Error("Yükleme başarısız");
                }

                setDraftUrl(data.publicUrl);
              } catch (err: any) {
                setError(err?.message || "Yükleme hatası");
              } finally {
                setUploading(false);
              }
            }}
          />

          <div className="grid gap-5 sm:grid-cols-[280px_1fr]">
            <div className="sm:sticky sm:top-0">
              <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
                <div className="aspect-[3/4] w-full">
                  {previewUrl || draftUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previewUrl || draftUrl} alt="Kapak" className="h-full w-full object-cover" />
                  ) : (
                    <div className="relative h-full w-full bg-gradient-to-br from-[var(--color-pink)]/60 to-[var(--color-purple)]/70">
                      <div className="absolute inset-0 grid place-items-center p-4">
                        <div className="rounded-2xl border border-white/40 bg-white/85 px-4 py-3 text-center">
                          <div className="text-xs font-semibold text-[var(--color-brown)]">Kapak yok</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="min-w-0 sm:flex sm:items-stretch">
              <div className="w-full sm:mx-auto sm:max-w-[320px] rounded-2xl border border-black/10 bg-black/[0.02] p-4 flex flex-col justify-center">
                <div className="grid gap-2">
                  <button
                    type="button"
                    className="w-full rounded-full px-4 py-2 border border-black/10 bg-white text-sm text-[var(--color-brown)]/80 hover:border-[var(--color-purple)] hover:text-[var(--color-purple)] transition-colors"
                    onClick={() => fileRef.current?.click()}
                  >
                    {uploading ? "Yükleniyor..." : draftUrl ? "Kapağı değiştir" : "Dosya seç"}
                  </button>

                  <button
                    type="button"
                    className="w-full rounded-full px-4 py-2 border border-black/10 bg-white text-sm text-[var(--color-brown)]/80 hover:border-[var(--color-purple)] hover:text-[var(--color-purple)] transition-colors disabled:opacity-50 disabled:hover:border-black/10 disabled:hover:text-[var(--color-brown)]/80 disabled:cursor-not-allowed"
                    onClick={() => {
                      setDraftUrl("");
                      setPreviewUrl("");
                      setError(null);
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                    disabled={!draftUrl || uploading}
                  >
                    Kaldır
                  </button>
                </div>

                {error && <div className="mt-3 text-[11px] text-red-600">{error}</div>}

                <div className="mt-3 text-[11px] text-[var(--color-brown)]/60">3:4</div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-black/10 flex items-center justify-between gap-3">
          <button
            type="button"
            className="rounded-full px-4 py-2 border border-black/10 bg-white text-sm text-[var(--color-brown)]/80 hover:border-[var(--color-purple)] hover:text-[var(--color-purple)] transition-colors"
            onClick={onClose}
          >
            Vazgeç
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-full px-4 py-2 border border-black/10 bg-white text-sm text-[var(--color-brown)]/80 hover:border-[var(--color-purple)] hover:text-[var(--color-purple)] transition-colors"
              onClick={() => {
                onSave("");
                onClose();
              }}
            >
              Temizle
            </button>
            <button
              type="button"
              className="rounded-full px-4 py-2 btn-primary text-sm"
              disabled={uploading}
              onClick={() => {
                onSave(draftUrl);
                onClose();
              }}
            >
              Kaydet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
