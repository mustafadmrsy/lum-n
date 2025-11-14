"use client";
import { useEffect, useMemo, useState } from "react";
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
  type SimplePage = { id: number; layers: TextLayer[] };
  const [pages, setPages] = useState<SimplePage[]>([
    { id: 1, layers: [] },
    { id: 2, layers: [] },
  ]);
  const [spreadIndex, setSpreadIndex] = useState(0); // for potential future two-page navigation (kept for UI text)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [FlipBook, setFlipBook] = useState<any>(null);
  const [selected, setSelected] = useState<{ pageId: number | null; layerId: number | null }>({ pageId: null, layerId: null });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"typography" | "arrange">("typography");

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

  const addPage = () => setPages((p) => [...p, { id: Date.now(), layers: [] }]);
  const removeLastPage = () => setPages((p) => (p.length > 2 ? p.slice(0, -1) : p));

  const selectedLayer = useMemo(() => {
    if (!selected.pageId || !selected.layerId) return null;
    const page = pages.find((p) => p.id === selected.pageId);
    if (!page) return null;
    return page.layers.find((l) => l.id === selected.layerId) || null;
  }, [pages, selected]);

  const updateSelectedLayer = (patch: Partial<TextLayer>) => {
    if (!selected.pageId || !selected.layerId) return;
    setPages((arr) =>
      arr.map((p) =>
        p.id === selected.pageId
          ? { ...p, layers: p.layers.map((l) => (l.id === selected.layerId ? { ...l, ...patch } : l)) }
          : p
      )
    );
  };

  const addTextToCurrent = () => {
    const targetPageId = selected.pageId ?? pages[0]?.id;
    if (!targetPageId) return;
    const id = Date.now();
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
    setPages((arr) => arr.map((p) => (p.id === targetPageId ? { ...p, layers: [...p.layers, newLayer] } : p)));
    setSelected({ pageId: targetPageId, layerId: id });
  };

  const removeSelectedLayer = () => {
    if (!selected.pageId || !selected.layerId) return;
    setPages((arr) =>
      arr.map((p) => (p.id === selected.pageId ? { ...p, layers: p.layers.filter((l) => l.id !== selected.layerId) } : p))
    );
    setSelected({ pageId: selected.pageId, layerId: null });
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
                <div className="fixed left-4 top-36 z-40 w-40 h-[480px] rounded-xl border border-black/10 bg-white/95 shadow-xl backdrop-blur overflow-y-auto">
                  <div className="flex border-b border-black/10">
                    <button className={`flex-1 px-3 py-2 text-sm ${activeTab === "typography" ? "bg-black/5" : ""}`} onClick={() => setActiveTab("typography")}>Yazı</button>
                    <button className={`flex-1 px-3 py-2 text-sm ${activeTab === "arrange" ? "bg-black/5" : ""}`} onClick={() => setActiveTab("arrange")}>Düzen</button>
                  </div>
                  <div className="p-3 space-y-2" data-toolbar>
                    <div className="flex gap-2">
                      <button type="button" className="rounded-full border border-black/10 px-3 py-1 text-sm" onClick={addTextToCurrent}>Metin Ekle</button>
                      <button type="button" className="rounded-full border border-black/10 px-3 py-1 text-sm disabled:opacity-50" onClick={removeSelectedLayer} disabled={!selectedLayer}>Metni Sil</button>
                    </div>
                    {activeTab === "typography" && (
                      <div className="space-y-2">
                        <select className="w-full rounded border border-black/10 px-2 py-1 text-sm" value={selectedLayer?.fontFamily || "serif"} onChange={(e) => updateSelectedLayer({ fontFamily: e.target.value })}>
                          <option value="serif">Serif</option>
                          <option value="sans-serif">Sans</option>
                          <option value="monospace">Mono</option>
                        </select>
                        <input type="number" className="w-full rounded border border-black/10 px-2 py-1 text-sm" min={8} max={96} value={selectedLayer?.fontSize || 18} onChange={(e) => updateSelectedLayer({ fontSize: Number(e.target.value || 18) })} />
                        <div className="flex gap-2">
                          <button type="button" className={`rounded border border-black/10 px-2 py-1 text-sm ${selectedLayer?.bold ? "bg-black/5" : ""}`} onClick={() => updateSelectedLayer({ bold: !selectedLayer?.bold })}>B</button>
                          <button type="button" className={`rounded border border-black/10 px-2 py-1 text-sm ${selectedLayer?.italic ? "bg-black/5" : ""}`} onClick={() => updateSelectedLayer({ italic: !selectedLayer?.italic })}>I</button>
                        </div>
                        <input type="color" className="h-8 w-10 rounded border border-black/10 p-0" value={selectedLayer?.color || "#3a2e2a"} onChange={(e) => updateSelectedLayer({ color: e.target.value })} />
                        <select className="w-full rounded border border-black/10 px-2 py-1 text-sm" value={selectedLayer?.align || "left"} onChange={(e) => updateSelectedLayer({ align: e.target.value as any })}>
                          <option value="left">Sol</option>
                          <option value="center">Orta</option>
                          <option value="right">Sağ</option>
                        </select>
                      </div>
                    )}
                    {activeTab === "arrange" && (
                      <div className="space-y-2 text-sm">
                        <div className="text-[var(--color-brown)]/70">Yerleşim araçları yakında</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <button type="button" className="fixed left-4 top-28 z-50 rounded-full border border-black/10 bg-white/90 px-3 py-1 text-sm backdrop-blur" onClick={() => setSidebarOpen((v) => !v)}>
                {sidebarOpen ? "Paneli Gizle" : "Paneli Göster"}
              </button>
              <div className="flex justify-center py-2">
                <div className="rounded-xl border border-black/10 bg-white shadow-2xl">
                  {!FlipBook ? (
                    <div className="h-[700px] w-[560px] rounded-xl bg-white grid place-items-center text-sm text-[var(--color-brown)]/70">
                      Yükleniyor...
                    </div>
                  ) : (
                    <div className="relative">
                      {/* Flip görünümü - her zaman DOM'da, kilit durumuna göre gizleniyor */}
                      <div className={isLocked ? "hidden" : "block"}>
                        <FlipBook
                          width={560}
                          height={700}
                          size="fixed"
                          usePortrait={false}
                          showCover={false}
                          useMouseEvents={!isLocked}
                          className="flip-book-root"
                          onFlip={(e: any) => {
                            const page = typeof e?.data === "number" ? e.data : 0;
                            const left = page % 2 === 0 ? page : page - 1;
                            setSpreadIndex(left);
                          }}
                        >
                          {pages.map((p) => {
                            const innerW = 560 - 24 * 2;
                            const innerH = 700 - 24 * 2;
                            return (
                              <div key={p.id} className="relative bg-white p-6 rounded-lg border border-black/10">
                                <TextLayerEditor
                                  pageId={p.id}
                                  width={innerW}
                                  height={innerH}
                                  layers={p.layers}
                                  onChange={(next) =>
                                    setPages((arr) => arr.map((x) => (x.id === p.id ? { ...x, layers: next } : x)))
                                  }
                                  onSelectedChange={(info) => setSelected(info)}
                                  hideToolbar
                                />
                              </div>
                            );
                          })}
                        </FlipBook>
                      </div>

                      {/* Kilitliyken gösterilen statik çift sayfa görünümü - aktif spreadIndex'e göre */}
                      <div className={isLocked ? "block" : "hidden"}>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 p-6">
                          {pages.slice(spreadIndex, spreadIndex + 2).map((p) => {
                            const innerW = 560 - 24 * 2;
                            const innerH = 700 - 24 * 2;
                            return (
                              <div key={p.id} className="relative bg-white p-6 rounded-lg border border-black/10">
                                <TextLayerEditor
                                  pageId={p.id}
                                  width={innerW}
                                  height={innerH}
                                  layers={p.layers}
                                  onChange={(next) =>
                                    setPages((arr) => arr.map((x) => (x.id === p.id ? { ...x, layers: next } : x)))
                                  }
                                  onSelectedChange={(info) => setSelected(info)}
                                  hideToolbar
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
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

