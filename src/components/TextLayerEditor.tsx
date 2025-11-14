"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
  onSelectedChange?: (info: { pageId: number; layerId: number | null }) => void;
  hideToolbar?: boolean;
  selectedIdExternal?: number | null;
};

export default function TextLayerEditor({ pageId, width, height, layers, onChange, onSelectedChange, hideToolbar, selectedIdExternal }: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const dragOffset = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const editorsRef = useRef<Map<number, HTMLDivElement>>(new Map());
  const saveTimersRef = useRef<Map<number, number>>(new Map());
  const editingBufferRef = useRef<Map<number, string>>(new Map());
  const prevSelectedRef = useRef<number | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");

  const selected = useMemo(() => layers.find((l) => l.id === selectedId) || null, [layers, selectedId]);

  const updateLayer = useCallback(
    (id: number, patch: Partial<TextLayer>) => {
      onChange(layers.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    },
    [layers, onChange]
  );

  const addText = useCallback(() => {
    const id = Date.now();
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
    (e: React.MouseEvent) => {
      if (!draggingId) return;
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const nx = Math.max(0, Math.min(width, e.clientX - rect.left - dragOffset.current.dx));
      const ny = Math.max(0, Math.min(height, e.clientY - rect.top - dragOffset.current.dy));
      updateLayer(draggingId, { x: Math.round(nx), y: Math.round(ny) });
    },
    [draggingId, height, width, updateLayer]
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
      const rect = container.getBoundingClientRect();
      const nx = Math.max(0, Math.min(width, e.clientX - rect.left - dragOffset.current.dx));
      const ny = Math.max(0, Math.min(height, e.clientY - rect.top - dragOffset.current.dy));
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
  }, [draggingId, height, width, updateLayer]);

  const setPropSelected = useCallback(
    (patch: Partial<TextLayer>) => {
      if (!selected) return;
      updateLayer(selected.id, patch);
    },
    [selected, updateLayer]
  );

  const lastEmittedRef = useRef<{ pageId: number; layerId: number | null } | null>(null);
  useEffect(() => {
    if (!onSelectedChange) return;
    const next = { pageId, layerId: selectedId };
    const prev = lastEmittedRef.current;
    if (!prev || prev.pageId !== next.pageId || prev.layerId !== next.layerId) {
      lastEmittedRef.current = next;
      onSelectedChange(next);
    }
  }, [pageId, selectedId, onSelectedChange]);

  // Autofocus selected editor (contentEditable mode previously)
  useEffect(() => {
    // Commit buffer when selection changes away from a layer
    const prevId = prevSelectedRef.current;
    if (prevId && prevId !== selectedId) {
      const buffered = editingBufferRef.current.get(prevId);
      if (typeof buffered === 'string') {
        updateLayer(prevId, { text: buffered });
        editingBufferRef.current.delete(prevId);
      }
    }
    prevSelectedRef.current = selectedId;

    // Initialize textarea value when a layer is selected
    if (!selectedId) return;
    const curr = layers.find((l) => l.id === selectedId);
    if (curr) setEditingValue(editingBufferRef.current.get(selectedId) ?? curr.text);
  }, [selectedId, layers]);

  // Sync external selection from parent
  useEffect(() => {
    if (selectedIdExternal == null) return;
    if (selectedIdExternal === selectedId) return;
    const exists = layers.some((l) => l.id === selectedIdExternal);
    if (exists) setSelectedId(selectedIdExternal);
  }, [selectedIdExternal, selectedId, layers]);

  return (
    <div
      ref={containerRef}
      className="relative bg-white z-40 pointer-events-auto select-text"
      style={{ width, height }}
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
                if (isHandle || (e.altKey && isEditable)) {
                  onMouseDownLayer(e, l.id);
                } else {
                  // allow native focus & typing
                  setSelectedId(l.id);
                }
              }}
            >
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
                  className="outline-none z-50 bg-transparent resize-none"
                  data-editable
                  value={editingValue}
                  onChange={(e) => {
                    setEditingValue(e.target.value);
                    editingBufferRef.current.set(l.id, e.target.value);
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
                    minWidth: "8px",
                    background: "transparent",
                    border: "none",
                    outline: "none",
                  }}
                  onBlur={() => {
                    editingBufferRef.current.set(l.id, editingValue);
                    updateLayer(l.id, { text: editingValue });
                  }}
                />
              ) : (
                <div className="outline-none select-text z-50" data-editable style={{ whiteSpace: "pre-wrap" }} onMouseDown={() => setSelectedId(l.id)}>
                  {l.text}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}
