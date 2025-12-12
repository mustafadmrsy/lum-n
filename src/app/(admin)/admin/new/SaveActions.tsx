"use client";

export default function SaveActions({
  loading,
  onPublish,
  onSaveDraft,
  onOpenCover,
}: {
  loading: boolean;
  onPublish: () => void;
  onSaveDraft: () => void;
  onOpenCover: () => void;
}) {
  return (
    <div className="flex gap-3">
      <button
        disabled={loading}
        className="rounded-full px-4 py-2 btn-primary disabled:opacity-60"
        onClick={onPublish}
      >
        Kaydet ve Yayınla
      </button>
      <button
        disabled={loading}
        className="rounded-full px-4 py-2 border border-black/10"
        onClick={onSaveDraft}
      >
        Taslak Kaydet
      </button>
      <button
        type="button"
        disabled={loading}
        className="rounded-full px-4 py-2 border border-black/10"
        onClick={onOpenCover}
      >
        Kapak Görseli
      </button>
    </div>
  );
}
