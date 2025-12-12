"use client";

import TextLayerEditor, { type TextLayer } from "@/components/TextLayerEditor";

export default function EditorCanvas({
  sidebarOpen,
  setSidebarOpen,
  FlipBook,
  isLocked,
  spreadIndex,
  setSpreadIndex,
  pages,
  applyPages,
  setPages,
  selected,
  handleSelectedChange,
  gridEnabled,
  snapEnabled,
  guidesEnabled,
}: {
  sidebarOpen: boolean;
  setSidebarOpen: (v: (prev: boolean) => boolean) => void;
  FlipBook: any;
  isLocked: boolean;
  spreadIndex: number;
  setSpreadIndex: (n: number) => void;
  pages: { id: number; layers: TextLayer[]; backgroundColor?: string }[];
  applyPages: (updater: (prev: any[]) => any[]) => void;
  setPages: (updater: (prev: any[]) => any[]) => void;
  selected: { pageId: number | null; layerId: number | null };
  handleSelectedChange: (info: { pageId: number; layerId: number | null }) => void;
  gridEnabled: boolean;
  snapEnabled: boolean;
  guidesEnabled: boolean;
}) {
  return (
    <>
      <button
        type="button"
        className="fixed left-4 top-28 z-50 rounded-full border border-black/10 bg-white/90 px-3 py-1 text-sm backdrop-blur"
        onClick={() => setSidebarOpen((v) => !v)}
      >
        {sidebarOpen ? "Paneli Gizle" : "Paneli Göster"}
      </button>

      <div className={`flex justify-center py-2 ${sidebarOpen ? "ml-48" : ""}`}>
        <div className="rounded-xl border border-black/10 bg-white shadow-2xl">
          {!FlipBook ? (
            <div className="h-[700px] w-[560px] rounded-xl bg-white grid place-items-center text-sm text-[var(--color-brown)]/70">Yükleniyor...</div>
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
                      <div key={p.id} className="relative rounded-lg border border-black/10" style={{ width: pageW, height: pageH }}>
                        <div className="absolute inset-0 p-6 rounded-lg" style={{ backgroundColor: p.backgroundColor || "#ffffff" }}>
                          <TextLayerEditor
                            pageId={p.id}
                            width={innerW}
                            height={innerH}
                            layers={p.layers}
                            onChange={(next) =>
                              applyPages((arr) => arr.map((x: any) => (x.id === p.id ? { ...x, layers: next } : x)))
                            }
                            onChangeNoHistory={(next) =>
                              setPages((arr) => arr.map((x: any) => (x.id === p.id ? { ...x, layers: next } : x)))
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
                        style={{ backgroundColor: p.backgroundColor || "#ffffff", width: pageW, height: pageH }}
                      >
                        <TextLayerEditor
                          pageId={p.id}
                          width={innerW}
                          height={innerH}
                          layers={p.layers}
                          onChange={(next) =>
                            applyPages((arr) => arr.map((x: any) => (x.id === p.id ? { ...x, layers: next } : x)))
                          }
                          onChangeNoHistory={(next) =>
                            setPages((arr) => arr.map((x: any) => (x.id === p.id ? { ...x, layers: next } : x)))
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
    </>
  );
}
