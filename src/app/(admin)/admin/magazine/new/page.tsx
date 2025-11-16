"use client";
import { useEffect, useMemo, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import TextLayerEditor, { type TextLayer } from "@/components/TextLayerEditor";
import { useNavigationLock } from "@/context/NavigationLockContext";
import { UserRole, MagazinePage } from "@/types/models";
import { useAuthStore } from "@/stores/useAuthStore";

export default function NewMagazinePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { isLocked } = useNavigationLock();
  
  const [pages, setPages] = useState<MagazinePage[]>([
    { id: 1, textLayers: [], imageLayers: [], backgroundColor: "#ffffff" },
    { id: 2, textLayers: [], imageLayers: [], backgroundColor: "#ffffff" },
  ]);
  
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [spreadIndex, setSpreadIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [FlipBook, setFlipBook] = useState<React.ComponentType<any> | null>(null);
  const [selected, setSelected] = useState<{ pageId: number | null; layerId: number | null }>({ 
    pageId: null, 
    layerId: null 
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"typography" | "layout" | "background">("typography");

  // Dynamic import
  useEffect(() => {
    let mounted = true;
    import("react-pageflip").then((m) => {
      if (mounted) setFlipBook(() => m.default as React.ComponentType<any>);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const onSave = async (publish = false) => {
    if (!title.trim()) {
      setError("Lütfen bir başlık girin");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/magazines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          pages,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        }),
      });

      const result = await response.json();

      if (result.success) {
        if (publish) {
          // Publish the magazine
          await fetch(`/api/magazines/${result.data.id}/publish`, {
            method: "POST",
          });
        }
        router.push("/admin");
      } else {
        setError(result.error || "Dergi kaydedilemedi");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kaydetme hatası");
    } finally {
      setLoading(false);
    }
  };

  const addPage = () => setPages((p) => [...p, { 
    id: Date.now(), 
    textLayers: [], 
    imageLayers: [],
    backgroundColor: "#ffffff"
  }]);
  
  const removeLastPage = () => setPages((p) => (p.length > 2 ? p.slice(0, -1) : p));

  const selectedPage = useMemo(() => {
    if (!selected.pageId) return null;
    return pages.find((p) => p.id === selected.pageId) || null;
  }, [pages, selected.pageId]);

  const selectedLayer = useMemo(() => {
    if (!selectedPage || !selected.layerId) return null;
    return selectedPage.textLayers.find((l) => l.id === selected.layerId) || null;
  }, [selectedPage, selected.layerId]);

  const updateSelectedLayer = (patch: Partial<TextLayer>) => {
    if (!selected.pageId || !selected.layerId) return;
    setPages((arr) =>
      arr.map((p) =>
        p.id === selected.pageId
          ? { ...p, textLayers: p.textLayers.map((l) => (l.id === selected.layerId ? { ...l, ...patch } : l)) }
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
      x: 50,
      y: 50,
      text: "Yeni metin",
      fontFamily: "serif",
      fontSize: 18,
      bold: false,
      italic: false,
      color: "#3a2e2a",
      align: "left",
    };
    setPages((arr) => 
      arr.map((p) => 
        p.id === targetPageId 
          ? { ...p, textLayers: [...p.textLayers, newLayer] } 
          : p
      )
    );
    setSelected({ pageId: targetPageId, layerId: id });
  };

  const removeSelectedLayer = () => {
    if (!selected.pageId || !selected.layerId) return;
    setPages((arr) =>
      arr.map((p) => 
        p.id === selected.pageId 
          ? { ...p, textLayers: p.textLayers.filter((l) => l.id !== selected.layerId) } 
          : p
      )
    );
    setSelected({ pageId: selected.pageId, layerId: null });
  };

  const updatePageBackground = (color: string) => {
    if (!selected.pageId) return;
    setPages((arr) =>
      arr.map((p) => (p.id === selected.pageId ? { ...p, backgroundColor: color } : p))
    );
  };

  async function downloadPDF() {
    const book = document.querySelector(".flip-book-root") as HTMLElement | null;
    if (!book) return;
    const canvas = await html2canvas(book, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${title || "dergi"}.pdf`);
  }

  return (
    <ProtectedRoute requiredRole={UserRole.WRITER}>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
        {/* Top Bar */}
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
          <div className="mx-auto max-w-7xl px-4 py-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px] space-y-2">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Dergi başlığı..."
                  className="w-full px-4 py-2 text-xl font-bold border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Etiketler (virgülle ayırın)..."
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => router.back()}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  İptal
                </button>
                <button
                  onClick={() => onSave(false)}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  {loading ? "Kaydediliyor..." : "Taslak Kaydet"}
                </button>
                <button
                  onClick={() => onSave(true)}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
                >
                  {loading ? "Yayınlanıyor..." : "Kaydet ve Yayınla"}
                </button>
              </div>
            </div>
            
            {error && (
              <div className="mt-3 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-6">
          {/* Page Info */}
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{pages.length}</span> sayfa • 
              Düzenleme: <span className="font-medium">Sayfa {spreadIndex + 1}-{Math.min(spreadIndex + 2, pages.length)}</span>
              {user && <span className="ml-3">• Yazar: <strong>{user.displayName}</strong></span>}
            </div>
            <div className="flex gap-2">
              <button
                onClick={addPage}
                className="px-3 py-1.5 text-sm font-medium text-purple-700 bg-purple-100 rounded-lg hover:bg-purple-200 transition-colors"
              >
                + Sayfa Ekle
              </button>
              <button
                onClick={removeLastPage}
                disabled={pages.length <= 2}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-40"
              >
                Son Sayfayı Sil
              </button>
              <button
                onClick={downloadPDF}
                className="px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-100 rounded-lg hover:bg-indigo-200 transition-colors"
              >
                📥 PDF İndir
              </button>
            </div>
          </div>

          <div className="flex gap-6">
            {/* Sidebar - Desktop */}
            {sidebarOpen && (
              <div className="hidden lg:block w-72 flex-shrink-0">
                <div className="sticky top-28 bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                  {/* Tabs */}
                  <div className="flex border-b border-gray-200">
                    <button
                      onClick={() => setActiveTab("typography")}
                      className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                        activeTab === "typography"
                          ? "bg-purple-50 text-purple-700 border-b-2 border-purple-600"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      Yazı
                    </button>
                    <button
                      onClick={() => setActiveTab("layout")}
                      className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                        activeTab === "layout"
                          ? "bg-purple-50 text-purple-700 border-b-2 border-purple-600"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      Düzen
                    </button>
                    <button
                      onClick={() => setActiveTab("background")}
                      className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                        activeTab === "background"
                          ? "bg-purple-50 text-purple-700 border-b-2 border-purple-600"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      Arka Plan
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
                    {activeTab === "typography" && (
                      <>
                        <div className="flex gap-2">
                          <button
                            onClick={addTextToCurrent}
                            className="flex-1 px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
                          >
                            + Metin Ekle
                          </button>
                          <button
                            onClick={removeSelectedLayer}
                            disabled={!selectedLayer}
                            className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-40 transition-colors"
                          >
                            🗑️
                          </button>
                        </div>

                        {selectedLayer && (
                          <div className="space-y-3 pt-2 border-t border-gray-200">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Font
                              </label>
                              <select
                                value={selectedLayer.fontFamily}
                                onChange={(e) => updateSelectedLayer({ fontFamily: e.target.value })}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                              >
                                <option value="serif">Serif</option>
                                <option value="sans-serif">Sans-serif</option>
                                <option value="monospace">Monospace</option>
                                <option value="Georgia">Georgia</option>
                                <option value="Times New Roman">Times New Roman</option>
                                <option value="Arial">Arial</option>
                                <option value="Helvetica">Helvetica</option>
                                <option value="Courier New">Courier New</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Boyut: {selectedLayer.fontSize}px
                              </label>
                              <input
                                type="range"
                                min="8"
                                max="96"
                                value={selectedLayer.fontSize}
                                onChange={(e) => updateSelectedLayer({ fontSize: Number(e.target.value) })}
                                className="w-full"
                              />
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => updateSelectedLayer({ bold: !selectedLayer.bold })}
                                className={`flex-1 px-3 py-2 text-sm font-bold border rounded-lg transition-colors ${
                                  selectedLayer.bold
                                    ? "bg-purple-100 border-purple-300 text-purple-700"
                                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                                }`}
                              >
                                B
                              </button>
                              <button
                                onClick={() => updateSelectedLayer({ italic: !selectedLayer.italic })}
                                className={`flex-1 px-3 py-2 text-sm italic border rounded-lg transition-colors ${
                                  selectedLayer.italic
                                    ? "bg-purple-100 border-purple-300 text-purple-700"
                                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                                }`}
                              >
                                I
                              </button>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Renk
                              </label>
                              <input
                                type="color"
                                value={selectedLayer.color}
                                onChange={(e) => updateSelectedLayer({ color: e.target.value })}
                                className="w-full h-10 rounded-lg border border-gray-200 cursor-pointer"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Hizalama
                              </label>
                              <div className="grid grid-cols-3 gap-2">
                                {(["left", "center", "right"] as const).map((align) => (
                                  <button
                                    key={align}
                                    onClick={() => updateSelectedLayer({ align })}
                                    className={`px-3 py-2 text-xs border rounded-lg transition-colors ${
                                      selectedLayer.align === align
                                        ? "bg-purple-100 border-purple-300 text-purple-700"
                                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                                    }`}
                                  >
                                    {align === "left" ? "←" : align === "center" ? "↔" : "→"}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {activeTab === "layout" && (
                      <div className="text-sm text-gray-600">
                        <p className="mb-2">Gelişmiş düzen araçları yakında...</p>
                        <ul className="space-y-1 text-xs">
                          <li>• Katman sıralaması</li>
                          <li>• Hizalama kılavuzları</li>
                          <li>• Grid sistemi</li>
                        </ul>
                      </div>
                    )}

                    {activeTab === "background" && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Arka Plan Rengi
                          </label>
                          <input
                            type="color"
                            value={selectedPage?.backgroundColor || "#ffffff"}
                            onChange={(e) => updatePageBackground(e.target.value)}
                            className="w-full h-10 rounded-lg border border-gray-200 cursor-pointer"
                          />
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {["#ffffff", "#f3f4f6", "#fef3c7", "#fce7f3", "#dbeafe", "#d1fae5"].map((color) => (
                            <button
                              key={color}
                              onClick={() => updatePageBackground(color)}
                              className="h-10 rounded-lg border-2 border-gray-200 hover:border-purple-400 transition-colors"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Editor Area */}
            <div className="flex-1 min-w-0">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
                {!FlipBook ? (
                  <div className="h-[700px] grid place-items-center text-gray-500">
                    <div className="text-center">
                      <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                      <p>Yükleniyor...</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center">
                    <FlipBook
                      width={560}
                      height={700}
                      size="fixed"
                      usePortrait={false}
                      showCover={false}
                      useMouseEvents={!isLocked}
                      className="flip-book-root shadow-2xl"
                      onFlip={(e: { data?: number }) => {
                        const page = typeof e?.data === "number" ? e.data : 0;
                        const left = page % 2 === 0 ? page : page - 1;
                        setSpreadIndex(left);
                      }}
                    >
                      {pages.map((p) => {
                        const innerW = 560 - 48;
                        const innerH = 700 - 48;
                        return (
                          <div
                            key={p.id}
                            className="relative p-6 rounded-lg border-2 border-gray-100"
                            style={{ backgroundColor: p.backgroundColor || "#ffffff" }}
                          >
                            <TextLayerEditor
                              pageId={p.id}
                              width={innerW}
                              height={innerH}
                              layers={p.textLayers}
                              onChange={(next) =>
                                setPages((arr) => arr.map((x) => (x.id === p.id ? { ...x, textLayers: next } : x)))
                              }
                              onSelectedChange={(info) => setSelected(info)}
                              hideToolbar
                            />
                          </div>
                        );
                      })}
                    </FlipBook>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Sidebar Toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all z-50"
          >
            {sidebarOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>
    </ProtectedRoute>
  );
}
