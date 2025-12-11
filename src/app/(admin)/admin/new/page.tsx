"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { db } from "@/lib/firebase";
import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import TextLayerEditor, { type TextLayer } from "@/components/TextLayerEditor";
import { useNavigationLock } from "@/context/NavigationLockContext";

export default function NewMagazinePage() {
  const router = useRouter();
  const { isLocked, setLocked } = useNavigationLock();
  // Flip-style editor: array of pages; each page has positioned text layers
  type SimplePage = { id: number; layers: TextLayer[]; backgroundColor?: string };
  const [pages, setPages] = useState<SimplePage[]>([
    { id: 1, layers: [], backgroundColor: "#ffffff" },
    { id: 2, layers: [], backgroundColor: "#ffffff" },
  ]);
  const [spreadIndex, setSpreadIndex] = useState(0); // for potential future two-page navigation (kept for UI text)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [FlipBook, setFlipBook] = useState<any>(null);
  const [selected, setSelected] = useState<{ pageId: number | null; layerId: number | null }>({ pageId: null, layerId: null });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"typography" | "arrange">("typography");
  const [activeSide, setActiveSide] = useState<"left" | "right">("left");
  const [activeToolTab, setActiveToolTab] = useState<"general" | "layers" | "page" | "media" | "text" | "layout">("general");
  const [history, setHistory] = useState<SimplePage[][]>([]);
  const [future, setFuture] = useState<SimplePage[][]>([]);
  const [gridEnabled, setGridEnabled] = useState(false);
  const [snapEnabled, setSnapEnabled] = useState(false);
  const [guidesEnabled, setGuidesEnabled] = useState(false);

  const fontOptions = [
    // generic
    { value: "serif", label: "Serif" },
    { value: "sans-serif", label: "Sans" },
    { value: "monospace", label: "Monospace" },

    // web-safe serif
    { value: "Times New Roman", label: "Times New Roman" },
    { value: "Georgia", label: "Georgia" },
    { value: "Garamond", label: "Garamond" },
    { value: "Palatino", label: "Palatino" },
    { value: "Book Antiqua", label: "Book Antiqua" },
    { value: "Cambria", label: "Cambria" },
    { value: "Constantia", label: "Constantia" },
    { value: "Century Schoolbook", label: "Century Schoolbook" },
    { value: "Bookman Old Style", label: "Bookman Old Style" },

    // web-safe sans
    { value: "Arial", label: "Arial" },
    { value: "Helvetica", label: "Helvetica" },
    { value: "Verdana", label: "Verdana" },
    { value: "Tahoma", label: "Tahoma" },
    { value: "Trebuchet MS", label: "Trebuchet MS" },
    { value: "Gill Sans", label: "Gill Sans" },
    { value: "Calibri", label: "Calibri" },
    { value: "Century Gothic", label: "Century Gothic" },
    { value: "Futura", label: "Futura" },
    { value: "Franklin Gothic Medium", label: "Franklin Gothic" },
    { value: "Geneva", label: "Geneva" },
    { value: "Optima", label: "Optima" },
    { value: "Segoe UI", label: "Segoe UI" },
    { value: "Lucida Sans Unicode", label: "Lucida Sans Unicode" },

    // monospace
    { value: "Courier New", label: "Courier New" },
    { value: "Lucida Console", label: "Lucida Console" },
    { value: "Consolas", label: "Consolas" },

    // imported Google sans-serif
    { value: "Roboto", label: "Roboto" },
    { value: "Open Sans", label: "Open Sans" },
    { value: "Lato", label: "Lato" },
    { value: "Montserrat", label: "Montserrat" },
    { value: "Poppins", label: "Poppins" },
    { value: "Oswald", label: "Oswald" },
    { value: "Raleway", label: "Raleway" },
    { value: "Nunito", label: "Nunito" },
    { value: "Ubuntu", label: "Ubuntu" },
    { value: "PT Sans", label: "PT Sans" },
    { value: "Mukta", label: "Mukta" },
    { value: "Source Sans 3", label: "Source Sans 3" },
    { value: "Josefin Sans", label: "Josefin Sans" },
    { value: "Quicksand", label: "Quicksand" },
    { value: "Karla", label: "Karla" },
    { value: "Rubik", label: "Rubik" },
    { value: "Titillium Web", label: "Titillium Web" },
    { value: "Fira Sans", label: "Fira Sans" },
    { value: "Noto Sans", label: "Noto Sans" },

    // imported Google monospace
    { value: "Inconsolata", label: "Inconsolata" },
    { value: "Source Code Pro", label: "Source Code Pro" },
    { value: "Ubuntu Mono", label: "Ubuntu Mono" },

    // imported Google serif
    { value: "Merriweather", label: "Merriweather" },
    { value: "Playfair Display", label: "Playfair Display" },
    { value: "Lora", label: "Lora" },
    { value: "Noto Serif", label: "Noto Serif" },
    { value: "Crimson Text", label: "Crimson Text" },
    { value: "EB Garamond", label: "EB Garamond" },
    { value: "Cormorant Garamond", label: "Cormorant Garamond" },
    { value: "Spectral", label: "Spectral" },

    // imported Google decorative / display
    { value: "Dancing Script", label: "Dancing Script" },
    { value: "Pacifico", label: "Pacifico" },
    { value: "Great Vibes", label: "Great Vibes" },
    { value: "Bebas Neue", label: "Bebas Neue" },
    { value: "Anton", label: "Anton" },
    { value: "Play", label: "Play" },
    { value: "Righteous", label: "Righteous" },
    { value: "Cinzel", label: "Cinzel" },
  ];

  // Dynamic import to avoid SSR issues
  useEffect(() => {
    let mounted = true;
    import("react-pageflip").then((m) => {
      if (mounted) setFlipBook(() => m.default);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleSelectedChange = useCallback((info: { pageId: number; layerId: number | null }) => {
    setSelected(info);
  }, []);

  const onSave = async (publish = true) => {
    setLoading(true);
    setError(null);
    try {
      const col = collection(db, "dergi");
      const refDoc = doc(col);
      // Serialize positioned text layers to HTML per page
      const pageWidth = 560;
      const pageHeight = 700;
      const padding = 24; // matches p-6
      const content = pages
        .map((p) => {
          const layersHtml = (p.layers || [])
            .map((l) => {
              const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
              return `<div style=\"position:absolute;left:${l.x}px;top:${l.y}px;color:${l.color};font-family:${esc(
                l.fontFamily
              )};font-weight:${l.bold ? 700 : 400};font-style:${l.italic ? "italic" : "normal"};font-size:${l.fontSize}px;text-align:${l.align}\">${esc(
                l.text
              )}</div>`;
            })
            .join("");
          return `<div class=\"page\" style=\"position:relative;width:${pageWidth}px;height:${pageHeight}px;padding:${padding}px;box-sizing:border-box;background:white;\">${layersHtml}</div>`;
        })
        .join('<hr class="page-break" />');
      await setDoc(refDoc, {
        content,
        publishedAt: publish ? serverTimestamp() : null,
      });

      router.replace("/admin");
    } catch (e: any) {
      setError(e?.message ?? "Kaydetme hatası");
    } finally {
      setLoading(false);
    }
  };

  const addPage = () => setPages((p) => [...p, { id: Date.now(), layers: [], backgroundColor: "#ffffff" }]);
  const removeLastPage = () => setPages((p) => (p.length > 2 ? p.slice(0, -1) : p));

  const applyPages = (updater: (prev: SimplePage[]) => SimplePage[]) => {
    setPages((prev) => {
      const next = updater(prev);
      if (next === prev) return prev;
      setHistory((h) => [...h, prev]);
      setFuture([]);
      return next;
    });
  };

  const canUndo = history.length > 0;
  const canRedo = future.length > 0;

  const undo = () => {
    setHistory((h) => {
      if (!h.length) return h;
      const prev = h[h.length - 1];
      setFuture((f) => [pages, ...f]);
      setPages(prev);
      return h.slice(0, -1);
    });
  };

  const redo = () => {
    setFuture((f) => {
      if (!f.length) return f;
      const [next, ...rest] = f;
      setHistory((h) => [...h, pages]);
      setPages(next);
      return rest;
    });
  };

  const activePageId = useMemo(() => {
    const offset = activeSide === "left" ? 0 : 1;
    const idx = spreadIndex + offset;
    return pages[idx]?.id ?? null;
  }, [pages, spreadIndex, activeSide]);

  const activePage = useMemo(() => {
    if (!activePageId) return null;
    return pages.find((p) => p.id === activePageId) ?? null;
  }, [pages, activePageId]);

  const selectedLayer = useMemo(() => {
    if (!selected.pageId || !selected.layerId) return null;
    if (!activePageId || selected.pageId !== activePageId) return null;
    const page = pages.find((p) => p.id === selected.pageId);
    if (!page) return null;
    return page.layers.find((l) => l.id === selected.layerId) || null;
  }, [pages, selected, activePageId]);

  const updateSelectedLayer = (patch: Partial<TextLayer>) => {
    if (!selected.pageId || !selected.layerId) return;
    if (!activePageId || selected.pageId !== activePageId) return;
    applyPages((arr) =>
      arr.map((p) =>
        p.id === selected.pageId
          ? { ...p, layers: p.layers.map((l) => (l.id === selected.layerId ? { ...l, ...patch } : l)) }
          : p
      )
    );
  };

  const addTextToCurrent = () => {
    const targetPageId = activePageId ?? pages[0]?.id;
    if (!targetPageId) return;
    const id = Date.now() + Math.floor(Math.random() * 100000);
    const newLayer: TextLayer = {
      id,
      x: Math.round(560 * 0.1),
      y: Math.round(700 * 0.1),
      text: "Yeni metin",
      fontFamily: "serif",
      fontSize: 18,
      bold: false,
      italic: false,
      color: "#3a2e2a",
      align: "left",
    };
    applyPages((arr) => arr.map((p) => (p.id === targetPageId ? { ...p, layers: [...p.layers, newLayer] } : p)));
    setSelected({ pageId: targetPageId, layerId: id });
  };

  const removeSelectedLayer = () => {
    if (!selected.pageId || !selected.layerId) return;
    if (!activePageId || selected.pageId !== activePageId) return;
    applyPages((arr) =>
      arr.map((p) => (p.id === selected.pageId ? { ...p, layers: p.layers.filter((l) => l.id !== selected.layerId) } : p))
    );
    setSelected({ pageId: selected.pageId, layerId: null });
  };

  const updateActivePage = (patch: Partial<SimplePage>) => {
    if (!activePageId) return;
    applyPages((arr) => arr.map((p) => (p.id === activePageId ? { ...p, ...patch } : p)));
  };

  async function downloadPDF() {
    const book = document.querySelector(".flip-book-root") as HTMLElement | null;
    if (!book) return;
    const canvas = await html2canvas(book, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const imgProps: any = (pdf as any).getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save("dergi.pdf");
  }

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-5xl px-4 py-6">
        <h1 className="mb-6 font-serif text-3xl text-[var(--color-purple)]">Yeni Dergi Yazısı</h1>
        <div className="space-y-4">
          {/* FlipHTML5-like editor */}
          <div>
            <label className="mb-2 block text-sm text-[var(--color-brown)]">İçerik (Kitap Düzeni)</label>
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm text-[var(--color-brown)]/70">Çift sayfa düzeni • Sayfalar: {pages.length} • Gösterim: {spreadIndex + 1}–{Math.min(spreadIndex + 2, pages.length)}</div>
              <div className="flex gap-2">
                <button type="button" className="rounded-full border border-black/10 px-3 py-1 text-sm" onClick={addPage}>Sayfa Ekle</button>
                <button type="button" className="rounded-full border border-black/10 px-3 py-1 text-sm" onClick={removeLastPage} disabled={pages.length <= 2}>Son Sayfayı Sil</button>
                <button type="button" className="rounded-full border border-black/10 px-3 py-1 text-sm" onClick={downloadPDF}>PDF Olarak İndir</button>
              </div>
            </div>
            <div className="relative">
              {sidebarOpen && (
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
                              <span className="truncate">
                                {l.text ? l.text.slice(0, 18) : "(Boş metin)"}
                              </span>
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
                        <div className="text-[10px] text-[var(--color-brown)]/60">
                          Cloudflare yükleme ve medya yönetimi sonra eklenecek.
                        </div>
                      </div>
                    )}

                    {activeToolTab === "text" && (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[12px] font-semibold text-[var(--color-brown)]">Metin blokları</span>
                          </div>
                          <div className="flex gap-2">
                            <button type="button" className="flex-1 rounded-full border border-black/10 bg-white px-3 py-1 text-xs" onClick={addTextToCurrent}>Metin ekle</button>
                            <button type="button" className="flex-1 rounded-full border border-black/10 bg-white px-3 py-1 text-xs disabled:opacity-50" onClick={removeSelectedLayer} disabled={!selectedLayer}>Metni sil</button>
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
                              <option key={f.value || f.label} value={f.value || undefined}>
                                {f.label}
                              </option>
                            ))}
                          </select>
                          <input type="number" className="w-full rounded border border-black/10 bg-white px-2 py-1 text-xs" min={8} max={96} value={selectedLayer?.fontSize || 18} onChange={(e) => updateSelectedLayer({ fontSize: Number(e.target.value || 18) })} />
                          <div className="flex gap-2">
                            <button type="button" className={`flex-1 rounded border border-black/10 bg-white px-2 py-1 text-xs ${selectedLayer?.bold ? "bg-black/5" : ""}`} onClick={() => updateSelectedLayer({ bold: !selectedLayer?.bold })}>B</button>
                            <button type="button" className={`flex-1 rounded border border-black/10 bg-white px-2 py-1 text-xs ${selectedLayer?.italic ? "bg-black/5" : ""}`} onClick={() => updateSelectedLayer({ italic: !selectedLayer?.italic })}>I</button>
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
                                    arr.map((p) =>
                                      p.id === selected.pageId
                                        ? {
                                            ...p,
                                            layers: p.layers.map((l) =>
                                              l.id === selected.layerId ? { ...l, color: newColor } : l
                                            ),
                                          }
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
              )}
              <button type="button" className="fixed left-4 top-28 z-50 rounded-full border border-black/10 bg-white/90 px-3 py-1 text-sm backdrop-blur" onClick={() => setSidebarOpen((v) => !v)}>
                {sidebarOpen ? "Paneli Gizle" : "Paneli Göster"}
              </button>
              <div className={`flex justify-center py-2 ${sidebarOpen ? "ml-48" : ""}`}>
                <div className="rounded-xl border border-black/10 bg-white shadow-2xl">
                  {!FlipBook ? (
                    <div className="h-[700px] w-[560px] rounded-xl bg-white grid place-items-center text-sm text-[var(--color-brown)]/70">
                      Yükleniyor...
                    </div>
                  ) : (
                    <div className="relative">
                      {!isLocked ? (
                        <FlipBook
                          width={560}
                          height={700}
                          size="fixed"
                          usePortrait={false}
                          showCover={false}
                          useMouseEvents={!isLocked}
                          className="flip-book-root"
                          startPage={spreadIndex}
                          onFlip={(e: any) => {
                            const page = typeof e?.data === "number" ? e.data : 0;
                            const left = page % 2 === 0 ? page : page - 1;
                            setSpreadIndex(left);
                          }}
                        >
                          {pages.map((p) => {
                            const pageW = 560;
                            const pageH = 700;
                            const innerW = pageW - 24 * 2;
                            const innerH = pageH - 24 * 2;
                            return (
                              <div
                                key={p.id}
                                className="relative rounded-lg border border-black/10"
                                style={{ width: pageW, height: pageH }}
                              >
                                <div
                                  className="absolute inset-0 p-6 rounded-lg"
                                  style={{ backgroundColor: p.backgroundColor || "#ffffff" }}
                                >
                                  <TextLayerEditor
                                    pageId={p.id}
                                    width={innerW}
                                    height={innerH}
                                    layers={p.layers}
                                    onChange={(next) =>
                                      applyPages((arr) =>
                                        arr.map((x) => (x.id === p.id ? { ...x, layers: next } : x))
                                      )
                                    }
                                    onChangeNoHistory={(next) =>
                                      setPages((arr) =>
                                        arr.map((x) => (x.id === p.id ? { ...x, layers: next } : x))
                                      )
                                    }
                                    onSelectedChange={handleSelectedChange}
                                    selectedIdExternal={selected.pageId === p.id ? selected.layerId : null}
                                    showGrid={gridEnabled}
                                    snapToGrid={snapEnabled}
                                    showGuides={guidesEnabled}
                                    hideToolbar
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </FlipBook>
                      ) : (
                        <div className="flex justify-center gap-4 overflow-x-auto">
                          {pages.slice(spreadIndex, spreadIndex + 2).map((p) => {
                            const pageW = 560;
                            const pageH = 700;
                            const innerW = pageW - 24 * 2;
                            const innerH = pageH - 24 * 2;
                            return (
                              <div
                                key={p.id}
                                className="relative p-6 rounded-lg border border-black/10 flex-shrink-0"
                                style={{
                                  backgroundColor: p.backgroundColor || "#ffffff",
                                  width: pageW,
                                  height: pageH,
                                }}
                              >
                                <TextLayerEditor
                                  pageId={p.id}
                                  width={innerW}
                                  height={innerH}
                                  layers={p.layers}
                                  onChange={(next) =>
                                    applyPages((arr) =>
                                      arr.map((x) => (x.id === p.id ? { ...x, layers: next } : x))
                                    )
                                  }
                                  onChangeNoHistory={(next) =>
                                    setPages((arr) =>
                                      arr.map((x) => (x.id === p.id ? { ...x, layers: next } : x))
                                    )
                                  }
                                  onSelectedChange={handleSelectedChange}
                                  selectedIdExternal={selected.pageId === p.id ? selected.layerId : null}
                                  showGrid={gridEnabled}
                                  snapToGrid={snapEnabled}
                                  showGuides={guidesEnabled}
                                  hideToolbar
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button disabled={loading} className="rounded-full px-4 py-2 btn-primary disabled:opacity-60" onClick={() => onSave(true)}>Kaydet ve Yayınla</button>
            <button disabled={loading} className="rounded-full px-4 py-2 border border-black/10" onClick={() => onSave(false)}>Taslak Kaydet</button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

