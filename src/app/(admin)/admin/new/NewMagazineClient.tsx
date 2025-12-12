"use client";

import { useEffect, useMemo, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useNavigationLock } from "@/context/NavigationLockContext";
import { useAuthState } from "react-firebase-hooks/auth";
import CoverImageModal from "./CoverImageModal";
import SaveActions from "./SaveActions";
import { useMagazineEditor } from "./useMagazineEditor";
import EditorSidebar from "./EditorSidebar";
import EditorCanvas from "./EditorCanvas";

export default function NewMagazineClient({ docId }: { docId: string | null }) {
  const router = useRouter();
  const { isLocked } = useNavigationLock();
  const [authUser] = useAuthState(auth);
  const [FlipBook, setFlipBook] = useState<any>(null);
  const [coverModalOpen, setCoverModalOpen] = useState(false);

  const {
    pages,
    setPages,
    spreadIndex,
    setSpreadIndex,
    loading,
    error,
    selected,
    setSelected,
    sidebarOpen,
    setSidebarOpen,
    activeSide,
    setActiveSide,
    activeToolTab,
    setActiveToolTab,
    canUndo,
    canRedo,
    undo,
    redo,
    gridEnabled,
    setGridEnabled,
    snapEnabled,
    setSnapEnabled,
    guidesEnabled,
    setGuidesEnabled,
    title,
    setTitle,
    coverImageUrl,
    setCoverImageUrl,
    applyPages,
    addPage,
    removeLastPage,
    activePageId,
    selectedLayer,
    handleSelectedChange,
    updateSelectedLayer,
    updateActivePage,
    addTextToCurrent,
    removeSelectedLayer,
    onSave,
  } = useMagazineEditor({ docId, router, authUser });

  useEffect(() => {
    let mounted = true;
    import("react-pageflip").then((m) => {
      if (mounted) setFlipBook(() => m.default);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const activePage = useMemo(() => {
    if (!activePageId) return null;
    return pages.find((p) => p.id === activePageId) ?? null;
  }, [pages, activePageId]);

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
        <h1 className="mb-3 font-serif text-3xl text-[var(--color-purple)]">Yeni Dergi Yazısı</h1>
        <div className="mb-5 space-y-2">
          <label className="block text-sm text-[var(--color-brown)]">Başlık</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-pink)]"
            placeholder="Örn. Big Boss, Kapak Yazısı, Röportaj..."
          />
        </div>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm text-[var(--color-brown)]">İçerik (Kitap Düzeni)</label>
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm text-[var(--color-brown)]/70">
                Çift sayfa düzeni • Sayfalar: {pages.length} • Gösterim: {spreadIndex + 1}–
                {Math.min(spreadIndex + 2, pages.length)}
              </div>
              <div className="flex gap-2">
                <button type="button" className="rounded-full border border-black/10 px-3 py-1 text-sm" onClick={addPage}>
                  Sayfa Ekle
                </button>
                <button
                  type="button"
                  className="rounded-full border border-black/10 px-3 py-1 text-sm"
                  onClick={removeLastPage}
                  disabled={pages.length <= 2}
                >
                  Son Sayfayı Sil
                </button>
                <button type="button" className="rounded-full border border-black/10 px-3 py-1 text-sm" onClick={downloadPDF}>
                  PDF Olarak İndir
                </button>
              </div>
            </div>
            <div className="relative">
              <EditorSidebar
                sidebarOpen={sidebarOpen}
                spreadIndex={spreadIndex}
                activeSide={activeSide}
                setActiveSide={setActiveSide}
                activeToolTab={activeToolTab}
                setActiveToolTab={setActiveToolTab}
                undo={undo}
                redo={redo}
                canUndo={canUndo}
                canRedo={canRedo}
                activePage={activePage}
                selected={selected}
                setSelected={setSelected}
                selectedLayer={selectedLayer}
                updateSelectedLayer={updateSelectedLayer}
                setPages={setPages}
                updateActivePage={updateActivePage}
                addTextToCurrent={addTextToCurrent}
                removeSelectedLayer={removeSelectedLayer}
                gridEnabled={gridEnabled}
                setGridEnabled={setGridEnabled}
                snapEnabled={snapEnabled}
                setSnapEnabled={setSnapEnabled}
                guidesEnabled={guidesEnabled}
                setGuidesEnabled={setGuidesEnabled}
              />

              <EditorCanvas
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                FlipBook={FlipBook}
                isLocked={isLocked}
                spreadIndex={spreadIndex}
                setSpreadIndex={setSpreadIndex}
                pages={pages}
                applyPages={applyPages}
                setPages={setPages}
                selected={selected}
                handleSelectedChange={handleSelectedChange}
                gridEnabled={gridEnabled}
                snapEnabled={snapEnabled}
                guidesEnabled={guidesEnabled}
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <SaveActions
            loading={loading}
            onPublish={() => onSave(true)}
            onSaveDraft={() => onSave(false)}
            onOpenCover={() => setCoverModalOpen(true)}
          />
        </div>

        <CoverImageModal
          open={coverModalOpen}
          initialUrl={coverImageUrl}
          onClose={() => setCoverModalOpen(false)}
          onSave={(url) => setCoverImageUrl(url)}
        />
      </div>
    </ProtectedRoute>
  );
}
