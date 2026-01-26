"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigationLock } from "@/context/NavigationLockContext";

export type TextLayer = {
  id: number;
  x: number; // px relative to canvas
  y: number; // px relative to canvas
  text: string;
  fontFamily: string;
  fontSize: number; // px
  bold: boolean;
  italic: boolean;
  color: string;
  align: "left" | "center" | "right";
};

type Props = {
  pageId: number;
  width: number;
  height: number;
  layers: TextLayer[];
  onChange: (next: TextLayer[]) => void;
  onChangeNoHistory?: (next: TextLayer[]) => void;
  onSelectedChange?: (info: { pageId: number; layerId: number | null }) => void;
  hideToolbar?: boolean;
  selectedIdExternal?: number | null;
  showGrid?: boolean;
  snapToGrid?: boolean;
  showGuides?: boolean;
};

export default function TextLayerEditor({ pageId, width, height, layers, onChange, onChangeNoHistory, onSelectedChange, hideToolbar, selectedIdExternal, showGrid, snapToGrid, showGuides }: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const dragOffset = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { isLocked, setLocked } = useNavigationLock();
  const prevLockRef = useRef<boolean | null>(null);

  const selected = useMemo(() => layers.find((l) => l.id === selectedId) || null, [layers, selectedId]);

  const updateLayer = useCallback(
    (id: number, patch: Partial<TextLayer>) => {
      const next = layers.map((l) => (l.id === id ? { ...l, ...patch } : l));
      const isPositionPatch = "x" in patch || "y" in patch;
      // Sürükleme sırasında yapılan pozisyon güncellemeleri history'e girmesin
      if (draggingId && onChangeNoHistory && isPositionPatch) {
        onChangeNoHistory(next);
        return;
      }
      onChange(next);
    },
    [layers, onChange, onChangeNoHistory, draggingId]
  );

  const addText = useCallback(() => {
    const id = Date.now() + Math.floor(Math.random() * 100000);
    const base: TextLayer = {
      id,
      x: Math.round(width * 0.1),
      y: Math.round(height * 0.1),
      text: "Yeni metin",
      fontFamily: "serif",
      fontSize: 18,
      bold: false,
      italic: false,
      color: "#3a2e2a",
      align: "left",
    };
    onChange([...layers, base]);
    setSelectedId(id);
  }, [height, width, layers, onChange]);

  const removeSelected = useCallback(() => {
    if (!selectedId) return;
    onChange(layers.filter((l) => l.id !== selectedId));
    setSelectedId(null);
  }, [layers, onChange, selectedId]);

  const onMouseDownLayer = useCallback(
    (e: React.MouseEvent, id: number) => {
      e.preventDefault();
      e.stopPropagation();
      setSelectedId(id);
      const target = e.currentTarget as HTMLDivElement;
      const rect = target.getBoundingClientRect();
      dragOffset.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top };
      setDraggingId(id);
    },
    []
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!draggingId) return;
      const container = containerRef.current;
      if (!container) return;
      let nx = Math.min(Math.max(0, e.clientX - container.getBoundingClientRect().left - dragOffset.current.dx), width - 40);
      let ny = Math.min(Math.max(0, e.clientY - container.getBoundingClientRect().top - dragOffset.current.dy), height - 24);

      if (snapToGrid) {
        const grid = 24; // daha belirgin snap için daha geniş ızgara
        nx = Math.round(nx / grid) * grid;
        ny = Math.round(ny / grid) * grid;
      }
      updateLayer(draggingId, { x: Math.round(nx), y: Math.round(ny) });
    },
    [draggingId, height, width, updateLayer, snapToGrid]
  );

  const onMouseUp = useCallback(() => {
    setDraggingId(null);
  }, []);

  // Window-level drag to avoid flipbook swallowing events
  useEffect(() => {
    if (!draggingId) return;
    function onWinMove(e: MouseEvent) {
      const id = draggingId as number;
      const container = containerRef.current;
      if (!container) return;
      let nx = Math.min(Math.max(0, e.clientX - container.getBoundingClientRect().left - dragOffset.current.dx), width - 40);
      let ny = Math.min(Math.max(0, e.clientY - container.getBoundingClientRect().top - dragOffset.current.dy), height - 24);

      if (snapToGrid) {
        const grid = 8;
        nx = Math.round(nx / grid) * grid;
        ny = Math.round(ny / grid) * grid;
      }
      updateLayer(id, { x: Math.round(nx), y: Math.round(ny) });
    }
    function onWinUp() {
      setDraggingId(null);
    }
    window.addEventListener("mousemove", onWinMove, true);
    window.addEventListener("mouseup", onWinUp, true);
    return () => {
      window.removeEventListener("mousemove", onWinMove, true);
      window.removeEventListener("mouseup", onWinUp, true);
    };
  }, [draggingId, height, width, updateLayer, snapToGrid]);

  const setPropSelected = useCallback(
    (patch: Partial<TextLayer>) => {
      if (!selected) return;
      updateLayer(selected.id, patch);
    },
    [selected, updateLayer]
  );

  // Dışarıdan seçim senkronizasyonu dışında ekstra buffer tutmuyoruz

  // Sync external selection from parent
  useEffect(() => {
    if (selectedIdExternal == null) return;
    if (selectedIdExternal === selectedId) return;
    const exists = layers.some((l) => l.id === selectedIdExternal);
    if (exists) setSelectedId(selectedIdExternal);
  }, [selectedIdExternal, selectedId, layers]);

  useEffect(() => {
    if (!onSelectedChange) return;
    // Avoid redundant emits when parent is the source of truth
    if (selectedIdExternal === selectedId) return;
    onSelectedChange({ pageId, layerId: selectedId });
  }, [onSelectedChange, pageId, selectedId, selectedIdExternal]);

  useEffect(() => {
    if (!selectedId) return;
    const el = activeTextareaRef.current;
    if (!el) return;
    // Make sure focus survives FlipBook re-renders
    requestAnimationFrame(() => {
      try {
        el.focus({ preventScroll: true } as any);
      } catch {
        el.focus();
      }
    });
  }, [selectedId, layers]);

  const backgroundStyle: React.CSSProperties = {};
  if (showGrid) {
    const gridSize = 32;
    backgroundStyle.backgroundImage = `
      linear-gradient(to right, rgba(0,0,0,0.06) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(0,0,0,0.06) 1px, transparent 1px)
    `;
    backgroundStyle.backgroundSize = `${gridSize}px ${gridSize}px`;
  }
  if (showGuides) {
    backgroundStyle.boxShadow = "inset 0 0 0 2px rgba(128,0,32,0.4)";
  }

  return (
    <div
      ref={containerRef}
      className="relative bg-transparent z-40 pointer-events-auto select-text"
      style={{ width, height, ...backgroundStyle }}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onMouseDown={(e) => {
        const t = e.target as HTMLElement | null;
        // If clicking inside a layer or its editable, do NOT clear selection
        if (t && (t.closest('[data-draggable]') || t.closest('[data-editable]'))) return;
        setSelectedId(null);
        if (onSelectedChange) {
          onSelectedChange({ pageId, layerId: null });
        }
      }}
    >
      {showGuides && (
        <>
          {/* Dikey orta çizgi */}
          <div
            className="pointer-events-none absolute top-0 bottom-0 border-l border-[rgba(128,0,32,0.35)]"
            style={{ left: width / 2 }}
          />
          {/* Yatay orta çizgi */}
          <div
            className="pointer-events-none absolute left-0 right-0 border-t border-[rgba(128,0,32,0.35)]"
            style={{ top: height / 2 }}
          />
        </>
      )}
      {/* İç toolbar (opsiyonel) */}
      {!hideToolbar && (
        <div
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex flex-col items-stretch gap-2 rounded-xl border border-black/10 bg-white/90 px-3 py-3 backdrop-blur"
          data-toolbar
        >
          <button type="button" className="rounded-full border border-black/10 px-3 py-1 text-sm" onClick={addText}>
            Metin Ekle
          </button>
          <button
            type="button"
            className="rounded-full border border-black/10 px-3 py-1 text-sm disabled:opacity-50"
            onClick={removeSelected}
            disabled={!selected}
          >
            Metni Sil
          </button>
          <select
            className="rounded border border-black/10 px-2 py-1 text-sm"
            value={selected?.fontFamily || "serif"}
            onChange={(e) => setPropSelected({ fontFamily: e.target.value })}
          >
            <option value="serif">Serif</option>
            <option value="sans-serif">Sans</option>
            <option value="monospace">Mono</option>
          </select>
          <input
            type="number"
            className="w-20 rounded border border-black/10 px-2 py-1 text-sm"
            min={8}
            max={96}
            value={selected?.fontSize || 18}
            onChange={(e) => setPropSelected({ fontSize: Number(e.target.value || 18) })}
          />
          <div className="flex gap-2">
            <button
              type="button"
              className={`rounded border border-black/10 px-2 py-1 text-sm ${selected?.bold ? "bg-black/5" : ""}`}
              onClick={() => setPropSelected({ bold: !selected?.bold })}
            >
              B
            </button>
            <button
              type="button"
              className={`rounded border border-black/10 px-2 py-1 text-sm ${selected?.italic ? "bg-black/5" : ""}`}
              onClick={() => setPropSelected({ italic: !selected?.italic })}
            >
              I
            </button>
          </div>
          <input
            type="color"
            className="h-8 w-10 rounded border border-black/10 p-0"
            value={selected?.color || "#3a2e2a"}
            onChange={(e) => setPropSelected({ color: e.target.value })}
          />
          <select
            className="rounded border border-black/10 px-2 py-1 text-sm"
            value={selected?.align || "left"}
            onChange={(e) => setPropSelected({ align: e.target.value as any })}
          >
            <option value="left">Sol</option>
            <option value="center">Orta</option>
            <option value="right">Sağ</option>
          </select>
        </div>
      )}

        {layers.map((l) => {
          const style: React.CSSProperties = {
            left: l.x,
            top: l.y,
            color: l.color,
            fontFamily: l.fontFamily,
            fontWeight: l.bold ? 700 : 400,
            fontStyle: l.italic ? "italic" : "normal",
            fontSize: l.fontSize,
            textAlign: l.align as any,
            cursor: draggingId === l.id ? "grabbing" : "grab",
          };
          const isSelected = selectedId === l.id;
          return (
            <div
              key={l.id}
              className={`absolute max-w-[90%] z-50 pointer-events-auto ${isSelected ? "outline outline-2 outline-[var(--color-purple)]/50" : ""}`}
              style={style}
              data-draggable
              onMouseDown={(e) => {
                const target = e.target as HTMLElement | null;
                const isHandle = !!target?.closest('[data-handle]');
                const isEditable = !!target?.closest('[data-editable]');
                if (isHandle) {
                  onMouseDownLayer(e, l.id);
                  if (onSelectedChange) onSelectedChange({ pageId, layerId: l.id });
                  return;
                }

                if (isEditable) {
                  if (e.altKey) {
                    onMouseDownLayer(e, l.id);
                    if (onSelectedChange) onSelectedChange({ pageId, layerId: l.id });
                  } else {
                    // textarea içine normal tıklama: sadece seç / odakla
                    setSelectedId(l.id);
                    if (onSelectedChange) onSelectedChange({ pageId, layerId: l.id });
                  }
                  return;
                }

                // Çerçevenin boş alanına tıklama: sürükle
                onMouseDownLayer(e, l.id);
                if (onSelectedChange) onSelectedChange({ pageId, layerId: l.id });
              }}
            >
              <div className="relative inline-block px-2 py-1">
                <div
                  className="absolute -top-3 -left-3 z-50 h-6 w-6 rounded-full bg-white/90 border border-black/10 shadow grid place-items-center cursor-grab"
                  title="Taşı"
                  data-handle
                  onMouseDown={(e) => onMouseDownLayer(e as any, l.id)}
                >
                  ≡
                </div>
                {isSelected ? (
                  <textarea
                    className="z-50 max-w-full resize rounded-xl border border-black/10 bg-white/95 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-purple)] focus:border-transparent"
                    data-editable
                    ref={activeTextareaRef}
                    value={l.text}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setSelectedId(l.id);
                      if (onSelectedChange) onSelectedChange({ pageId, layerId: l.id });
                    }}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setSelectedId(l.id);
                      if (onSelectedChange) onSelectedChange({ pageId, layerId: l.id });
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedId(l.id);
                      if (onSelectedChange) onSelectedChange({ pageId, layerId: l.id });
                    }}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                    }}
                    onFocus={() => {
                      if (prevLockRef.current == null) prevLockRef.current = isLocked;
                      setLocked(true);
                    }}
                    onBlur={() => {
                      const prev = prevLockRef.current;
                      prevLockRef.current = null;
                      if (prev != null) setLocked(prev);
                    }}
                    onChange={(e) => {
                      updateLayer(l.id, { text: e.target.value });
                    }}
                    autoFocus
                    style={{
                      color: l.color,
                      fontFamily: l.fontFamily as any,
                      fontWeight: l.bold ? 700 : 400,
                      fontStyle: l.italic ? "italic" : "normal",
                      fontSize: l.fontSize,
                      textAlign: l.align as any,
                      whiteSpace: "pre-wrap",
                      width: "max-content",
                      minWidth: "120px",
                    }}
                  />
                ) : (
                  <div
                    className="outline-none select-text z-50"
                    data-editable
                    style={{ whiteSpace: "pre-wrap" }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setSelectedId(l.id);
                      if (onSelectedChange) onSelectedChange({ pageId, layerId: l.id });
                    }}
                  >
                    {l.text}
                  </div>
                )}
              </div>
            </div>
          );
        })}
    </div>
  );
}
