"use client";

import { useEffect, useState } from "react";
import type { TextLayer } from "@/components/TextLayerEditor";
import { fontOptions } from "./fontOptions";

export default function EditorSidebar({
  sidebarOpen,
  spreadIndex,
  activeSide,
  setActiveSide,
  activeToolTab,
  setActiveToolTab,
  undo,
  redo,
  canUndo,
  canRedo,
  activePage,
  selected,
  setSelected,
  selectedLayer,
  updateSelectedLayer,
  setPages,
  updateActivePage,
  addTextToCurrent,
  removeSelectedLayer,
  gridEnabled,
  setGridEnabled,
  snapEnabled,
  setSnapEnabled,
  guidesEnabled,
  setGuidesEnabled,
}: {
  sidebarOpen: boolean;
  spreadIndex: number;
  activeSide: "left" | "right";
  setActiveSide: (s: "left" | "right") => void;
  activeToolTab: "general" | "layers" | "page" | "media" | "text" | "layout";
  setActiveToolTab: (t: "general" | "layers" | "page" | "media" | "text" | "layout") => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  activePage: { id: number; layers: TextLayer[]; backgroundColor?: string } | null;
  selected: { pageId: number | null; layerId: number | null };
  setSelected: (s: { pageId: number | null; layerId: number | null }) => void;
  selectedLayer: TextLayer | null;
  updateSelectedLayer: (patch: Partial<TextLayer>) => void;
  setPages: (updater: (prev: any[]) => any[]) => void;
  updateActivePage: (patch: Partial<{ backgroundColor?: string }>) => void;
  addTextToCurrent: () => void;
  removeSelectedLayer: () => void;
  gridEnabled: boolean;
  setGridEnabled: (updater: (v: boolean) => boolean) => void;
  snapEnabled: boolean;
  setSnapEnabled: (updater: (v: boolean) => boolean) => void;
  guidesEnabled: boolean;
  setGuidesEnabled: (updater: (v: boolean) => boolean) => void;
}) {
  if (!sidebarOpen) return null;

  const [fontSizeDraft, setFontSizeDraft] = useState<string>("");

  useEffect(() => {
    if (!selectedLayer) {
      setFontSizeDraft("");
      return;
    }
    setFontSizeDraft(String(selectedLayer.fontSize ?? 18));
  }, [selectedLayer?.id, selectedLayer?.fontSize]);

  return (
    <div className="fixed left-4 top-32 z-40 w-52 max-h-[520px] rounded-2xl border border-black/10 bg-white/95 shadow-xl backdrop-blur overflow-hidden">
      <div className="px-3 pt-3 pb-2 border-b border-black/10 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-[var(--color-brown)]/60">Panel</div>
          <div className="mt-0.5 text-xs font-semibold text-[var(--color-brown)]">Sayfa {spreadIndex + (activeSide === "left" ? 1 : 2)}</div>
        </div>
        <div className="flex rounded-full border border-black/10 overflow-hidden text-[10px]">
          <button
            className={`px-2 py-1 ${activeSide === "left" ? "bg-[var(--color-purple)] text-white" : "bg-white text-[var(--color-brown)]/70"}`}
            onClick={() => setActiveSide("left")}
            title="Sol sayfa"
          >
            ← Sol
          </button>
          <button
            className={`px-2 py-1 ${activeSide === "right" ? "bg-[var(--color-purple)] text-white" : "bg-white text-[var(--color-brown)]/70"}`}
            onClick={() => setActiveSide("right")}
            title="Sağ sayfa"
          >
            Sağ →
          </button>
        </div>
      </div>

      <div className="flex border-b border-black/10 text-[11px] bg-[rgba(0,0,0,0.01)]">
        <button
          className={`flex-1 px-2 py-2 flex flex-col items-center gap-0.5 border-b-2 transition-colors ${
            activeToolTab === "general"
              ? "text-[var(--color-purple)] font-semibold border-[var(--color-purple)] bg-white"
              : "text-[var(--color-brown)]/60 border-transparent bg-[rgba(0,0,0,0.01)]"
          }`}
          onClick={() => setActiveToolTab("general")}
        >
          <span className="h-5 w-5 rounded-full border border-black/15 grid place-items-center text-[11px]">⚙️</span>
          <span>Genel</span>
        </button>
        <button
          className={`flex-1 px-2 py-2 flex flex-col items-center gap-0.5 border-b-2 transition-colors ${
            activeToolTab === "layers"
              ? "text-[var(--color-purple)] font-semibold border-[var(--color-purple)] bg-white"
              : "text-[var(--color-brown)]/60 border-transparent bg-[rgba(0,0,0,0.01)]"
          }`}
          onClick={() => setActiveToolTab("layers")}
        >
          <span className="h-5 w-5 rounded-full border border-black/15 grid place-items-center text-[11px]">☰</span>
          <span>Katmanlar</span>
        </button>
        <button
          className={`flex-1 px-2 py-2 flex flex-col items-center gap-0.5 border-b-2 transition-colors ${
            activeToolTab === "page"
              ? "text-[var(--color-purple)] font-semibold border-[var(--color-purple)] bg-white"
              : "text-[var(--color-brown)]/60 border-transparent bg-[rgba(0,0,0,0.01)]"
          }`}
          onClick={() => setActiveToolTab("page")}
        >
          <span className="h-5 w-5 rounded-full border border-black/15 grid place-items-center text-[11px]">📄</span>
          <span>Sayfa</span>
        </button>
      </div>

      <div className="flex border-b border-black/10 text-[11px] bg-[rgba(0,0,0,0.01)]">
        <button
          className={`flex-1 px-2 py-2 flex flex-col items-center gap-0.5 border-b-2 transition-colors ${
            activeToolTab === "media"
              ? "text-[var(--color-purple)] font-semibold border-[var(--color-purple)] bg-white"
              : "text-[var(--color-brown)]/60 border-transparent bg-[rgba(0,0,0,0.01)]"
          }`}
          onClick={() => setActiveToolTab("media")}
        >
          <span className="h-5 w-5 rounded-full border border-black/15 grid place-items-center text-[11px]">🖼️</span>
          <span>Görsel</span>
        </button>
        <button
          className={`flex-1 px-2 py-2 flex flex-col items-center gap-0.5 border-b-2 transition-colors ${
            activeToolTab === "text"
              ? "text-[var(--color-purple)] font-semibold border-[var(--color-purple)] bg-white"
              : "text-[var(--color-brown)]/60 border-transparent bg-[rgba(0,0,0,0.01)]"
          }`}
          onClick={() => setActiveToolTab("text")}
        >
          <span className="h-5 w-5 rounded-full border border-black/15 grid place-items-center text-[11px]">✏️</span>
          <span>Metin</span>
        </button>
        <button
          className={`flex-1 px-2 py-2 flex flex-col items-center gap-0.5 border-b-2 transition-colors ${
            activeToolTab === "layout"
              ? "text-[var(--color-purple)] font-semibold border-[var(--color-purple)] bg-white"
              : "text-[var(--color-brown)]/60 border-transparent bg-[rgba(0,0,0,0.01)]"
          }`}
          onClick={() => setActiveToolTab("layout")}
        >
          <span className="h-5 w-5 rounded-full border border-black/15 grid place-items-center text-[11px]">📐</span>
          <span>Yerleşim</span>
        </button>
      </div>

      <div className="p-3 space-y-3 text-[11px] text-[var(--color-brown)]/80 overflow-y-auto" data-toolbar>
        {activeToolTab === "general" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                className="flex-1 rounded-full border border-black/10 bg-white px-3 py-1 text-xs disabled:opacity-40"
                onClick={undo}
                disabled={!canUndo}
              >
                ↶ Geri al
              </button>
              <button
                type="button"
                className="flex-1 rounded-full border border-black/10 bg-white px-3 py-1 text-xs disabled:opacity-40"
                onClick={redo}
                disabled={!canRedo}
              >
                ↷ Yinele
              </button>
            </div>
            <div className="text-[10px] text-[var(--color-brown)]/60">
              Düzenlemeler bu oturumda kaydedilir. Kaydet/Taslak butonlarıyla Firestore'a yazılır.
            </div>
          </div>
        )}

        {activeToolTab === "layers" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-[var(--color-brown)]">Katmanlar</span>
              <span className="text-[10px] text-[var(--color-brown)]/60">{activePage?.layers.length || 0} adet</span>
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {(activePage?.layers || []).map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setSelected({ pageId: activePage?.id || null, layerId: l.id })}
                  className={`w-full rounded-lg border px-2 py-1 text-left text-[11px] flex items-center justify-between gap-2 ${
                    selected.pageId === activePage?.id && selected.layerId === l.id
                      ? "border-[var(--color-purple)] bg-[var(--color-purple)]/5"
                      : "border-black/10 bg-white"
                  }`}
                >
                  <span className="truncate">{l.text ? l.text.slice(0, 18) : "(Boş metin)"}</span>
                  <span className="text-[9px] text-[var(--color-brown)]/60">id:{l.id.toString().slice(-4)}</span>
                </button>
              ))}
              {!activePage?.layers.length && (
                <div className="text-[10px] text-[var(--color-brown)]/60">
                  Bu sayfada henüz metin yok. "Metin" sekmesinden yeni metin ekleyebilirsin.
                </div>
              )}
            </div>
          </div>
        )}

        {activeToolTab === "page" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-[var(--color-brown)]">Sayfa rengi</span>
            </div>
            <div className="flex items-center justify-between gap-2 rounded-lg bg-black/5 px-2 py-1">
              <span>Arka plan</span>
              <input
                type="color"
                className="h-7 w-10 rounded border border-black/10 p-0 bg-white"
                value={activePage?.backgroundColor || "#ffffff"}
                onChange={(e) => updateActivePage({ backgroundColor: e.target.value })}
              />
            </div>
          </div>
        )}

        {activeToolTab === "media" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-[var(--color-brown)]">Görseller</span>
            </div>
            <button
              type="button"
              className="w-full rounded-full border border-dashed border-black/20 bg-white px-3 py-1.5 text-xs text-[var(--color-brown)]/80 hover:border-[var(--color-purple)] hover:text-[var(--color-purple)] transition-colors"
            >
              Sayfaya görsel ekle
            </button>
            <div className="text-[10px] text-[var(--color-brown)]/60">Cloudflare yükleme ve medya yönetimi sonra eklenecek.</div>
          </div>
        )}

        {activeToolTab === "text" && (
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold text-[var(--color-brown)]">Metin blokları</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="flex-1 rounded-full border border-black/10 bg-white px-3 py-1 text-xs"
                  onClick={addTextToCurrent}
                >
                  Metin ekle
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-full border border-black/10 bg-white px-3 py-1 text-xs disabled:opacity-50"
                  onClick={removeSelectedLayer}
                  disabled={!selectedLayer}
                >
                  Metni sil
                </button>
              </div>
            </div>

            <div className="space-y-2 border-t border-black/10 pt-2">
              <div className="flex gap-1">
                <button
                  type="button"
                  className={`flex-1 rounded-full border px-2 py-1 text-[10px] transition-colors ${
                    selectedLayer && selectedLayer.fontSize === 28 && selectedLayer.bold
                      ? "border-[var(--color-purple)] bg-[var(--color-purple)]/10"
                      : "border-black/10 bg-white"
                  }`}
                  onClick={() => selectedLayer && updateSelectedLayer({ fontSize: 28, bold: true })}
                >
                  H1 Başlık
                </button>
                <button
                  type="button"
                  className={`flex-1 rounded-full border px-2 py-1 text-[10px] transition-colors ${
                    selectedLayer && selectedLayer.fontSize === 22 && selectedLayer.bold
                      ? "border-[var(--color-purple)] bg-[var(--color-purple)]/10"
                      : "border-black/10 bg-white"
                  }`}
                  onClick={() => selectedLayer && updateSelectedLayer({ fontSize: 22, bold: true })}
                >
                  H2 Alt başlık
                </button>
              </div>
              <button
                type="button"
                className={`w-full rounded-full border px-2 py-1 text-[10px] transition-colors ${
                  selectedLayer && selectedLayer.fontSize === 16 && !selectedLayer.bold
                    ? "border-[var(--color-purple)] bg-[var(--color-purple)]/10"
                    : "border-black/10 bg-white"
                }`}
                onClick={() => selectedLayer && updateSelectedLayer({ fontSize: 16, bold: false })}
              >
                Paragraf
              </button>
              <select
                className="w-full rounded border border-black/10 bg-white px-2 py-1 text-xs"
                value={selectedLayer?.fontFamily || "serif"}
                onChange={(e) => updateSelectedLayer({ fontFamily: e.target.value })}
              >
                {fontOptions.map((f) => (
                  <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                    {f.label} — AaBb
                  </option>
                ))}
              </select>
              <input
                type="number"
                className="w-full rounded border border-black/10 bg-white px-2 py-1 text-xs"
                min={1}
                max={256}
                value={fontSizeDraft}
                onChange={(e) => {
                  const raw = e.target.value;
                  setFontSizeDraft(raw);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    (e.currentTarget as HTMLInputElement).blur();
                  }
                }}
                onBlur={() => {
                  if (!selectedLayer) return;
                  const raw = fontSizeDraft.trim();
                  if (raw === "") {
                    setFontSizeDraft(String(selectedLayer.fontSize ?? 18));
                    return;
                  }
                  const n = Number(raw);
                  if (!Number.isFinite(n)) {
                    setFontSizeDraft(String(selectedLayer.fontSize ?? 18));
                    return;
                  }
                  const clamped = Math.min(256, Math.max(1, Math.round(n)));
                  setFontSizeDraft(String(clamped));
                  updateSelectedLayer({ fontSize: clamped });
                }}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  className={`flex-1 rounded border border-black/10 bg-white px-2 py-1 text-xs ${selectedLayer?.bold ? "bg-black/5" : ""}`}
                  onClick={() => updateSelectedLayer({ bold: !selectedLayer?.bold })}
                >
                  B
                </button>
                <button
                  type="button"
                  className={`flex-1 rounded border border-black/10 bg-white px-2 py-1 text-xs ${selectedLayer?.italic ? "bg-black/5" : ""}`}
                  onClick={() => updateSelectedLayer({ italic: !selectedLayer?.italic })}
                >
                  I
                </button>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-[var(--color-brown)]/70">Metin rengi</span>
                <input
                  type="color"
                  className="h-7 w-10 rounded border border-black/10 p-0 bg-white"
                  defaultValue={selectedLayer?.color || "#3a2e2a"}
                  onChange={(e) => {
                    if (!selected.pageId || !selected.layerId) return;
                    const newColor = e.target.value;
                    const update = () =>
                      setPages((arr) =>
                        arr.map((p: any) =>
                          p.id === selected.pageId
                            ? { ...p, layers: p.layers.map((l: any) => (l.id === selected.layerId ? { ...l, color: newColor } : l)) }
                            : p
                        )
                      );
                    if (typeof window !== "undefined" && window.requestAnimationFrame) {
                      window.requestAnimationFrame(update);
                    } else {
                      update();
                    }
                  }}
                />
              </div>
              <div className="flex w-full rounded-full border border-black/10 bg-white text-[11px] overflow-hidden">
                <button
                  type="button"
                  className={`flex-1 px-2 py-1 border-r border-black/10 ${
                    (selectedLayer?.align || "left") === "left"
                      ? "bg-[var(--color-purple)]/10 text-[var(--color-purple)]"
                      : "text-[var(--color-brown)]/70"
                  }`}
                  onClick={() => updateSelectedLayer({ align: "left" as any })}
                >
                  ☰ Sol
                </button>
                <button
                  type="button"
                  className={`flex-1 px-2 py-1 border-r border-black/10 ${
                    selectedLayer?.align === "center"
                      ? "bg-[var(--color-purple)]/10 text-[var(--color-purple)]"
                      : "text-[var(--color-brown)]/70"
                  }`}
                  onClick={() => updateSelectedLayer({ align: "center" as any })}
                >
                  ☰ Orta
                </button>
                <button
                  type="button"
                  className={`flex-1 px-2 py-1 ${
                    selectedLayer?.align === "right"
                      ? "bg-[var(--color-purple)]/10 text-[var(--color-purple)]"
                      : "text-[var(--color-brown)]/70"
                  }`}
                  onClick={() => updateSelectedLayer({ align: "right" as any })}
                >
                  ☰ Sağ
                </button>
              </div>
            </div>
          </div>
        )}

        {activeToolTab === "layout" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-[var(--color-brown)]">Yerleşim</span>
            </div>
            <div className="space-y-1 text-[10px] text-[var(--color-brown)]/70">
              <div>Sayfa ızgarası, yapışma (snap) ve hizalama çizgileri burada yönetilecek.</div>
            </div>

            <div className="space-y-2 border-t border-black/10 pt-2">
              <div className="flex items-center justify-between text-[11px]">
                <span>Izgara çizgileri</span>
                <button
                  type="button"
                  className={`rounded-full border px-2 py-0.5 text-[10px] ${
                    gridEnabled
                      ? "border-[var(--color-purple)] bg-[var(--color-purple)]/10 text-[var(--color-purple)]"
                      : "border-black/10 bg-white text-[var(--color-brown)]/70"
                  }`}
                  onClick={() => setGridEnabled((v) => !v)}
                >
                  {gridEnabled ? "Açık" : "Kapalı"}
                </button>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span>Snap (yapışma)</span>
                <button
                  type="button"
                  className={`rounded-full border px-2 py-0.5 text-[10px] ${
                    snapEnabled
                      ? "border-[var(--color-purple)] bg-[var(--color-purple)]/10 text-[var(--color-purple)]"
                      : "border-black/10 bg-white text-[var(--color-brown)]/70"
                  }`}
                  onClick={() => setSnapEnabled((v) => !v)}
                >
                  {snapEnabled ? "Açık" : "Kapalı"}
                </button>
              </div>
              <div className="space-y-1 text-[10px] text-[var(--color-brown)]/60">
                <div>Metin kutuları kenarlara ve birbirine hizalanırken bu ayarlar kullanılacak.</div>
              </div>
            </div>

            <div className="space-y-2 border-t border-black/10 pt-2">
              <div className="flex items-center justify-between text-[11px]">
                <span>Yardımcı hizalama çizgileri</span>
                <button
                  type="button"
                  className={`rounded-full border px-2 py-0.5 text-[10px] ${
                    guidesEnabled
                      ? "border-[var(--color-purple)] bg-[var(--color-purple)]/10 text-[var(--color-purple)]"
                      : "border-black/10 bg-white text-[var(--color-brown)]/70"
                  }`}
                  onClick={() => setGuidesEnabled((v) => !v)}
                >
                  {guidesEnabled ? "Gösteriliyor" : "Kapalı"}
                </button>
              </div>
              <div className="space-y-1 text-[10px] text-[var(--color-brown)]/60">
                <div>Orta hat, sütun çizgileri ve marjin çizgileri burada açılıp kapatılacak.</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
