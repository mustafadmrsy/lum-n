"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { collection, doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { User } from "firebase/auth";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { TextLayer } from "@/components/TextLayerEditor";

export type SimplePage = { id: number; layers: TextLayer[]; backgroundColor?: string };

export function useMagazineEditor({
  docId,
  router,
  authUser,
}: {
  docId: string | null;
  router: AppRouterInstance;
  authUser: User | null | undefined;
}) {
  const [pages, setPages] = useState<SimplePage[]>([
    { id: 1, layers: [], backgroundColor: "#ffffff" },
    { id: 2, layers: [], backgroundColor: "#ffffff" },
  ]);
  const [spreadIndex, setSpreadIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(false);

  useEffect(() => {
    if (!docId) {
      setEditingId(null);
      return;
    }
    setEditingId(docId);
    let cancelled = false;
    const run = async () => {
      setLoadingExisting(true);
      try {
        const ref = doc(db, "dergi", docId);
        const snap = await getDoc(ref);
        if (!snap.exists()) return;
        const data = snap.data() as any;
        if (!cancelled) {
          if (typeof data?.title === "string") setTitle(data.title);
          if (typeof data?.category === "string") {
            setCategory(data.category);
          } else if (Array.isArray(data?.categories) && typeof data.categories[0] === "string") {
            setCategory(data.categories[0]);
          }
          if (typeof data?.coverImageUrl === "string") setCoverImageUrl(data.coverImageUrl);
          const rawPages =
            data?.editorPages ??
            data?.editor_pages ??
            data?.pages ??
            data?.editorPageData ??
            null;

          const incomingPages =
            Array.isArray(rawPages)
              ? rawPages
              : typeof rawPages === "string"
                ? (() => {
                    try {
                      const parsed = JSON.parse(rawPages);
                      return Array.isArray(parsed) ? parsed : null;
                    } catch {
                      return null;
                    }
                  })()
                : null;
          if (incomingPages && incomingPages.length) {
            const normalized = incomingPages.map((p: any) => ({
              id: p?.id ?? Date.now(),
              backgroundColor: p?.backgroundColor || "#ffffff",
              layers: Array.isArray(p?.layers) ? p.layers : [],
            }));
            while (normalized.length < 2) {
              normalized.push({ id: Date.now() + normalized.length, layers: [], backgroundColor: "#ffffff" });
            }
            setPages(normalized);
            setSelected({ pageId: normalized[0]?.id ?? null, layerId: null });
          }
        }
      } finally {
        if (!cancelled) setLoadingExisting(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [docId]);

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

  const addPage = () => setPages((p) => [...p, { id: Date.now(), layers: [], backgroundColor: "#ffffff" }]);
  const removeLastPage = () => setPages((p) => (p.length > 2 ? p.slice(0, -1) : p));

  const activePageId = useMemo(() => {
    const offset = activeSide === "left" ? 0 : 1;
    const idx = spreadIndex + offset;
    return pages[idx]?.id ?? null;
  }, [pages, spreadIndex, activeSide]);

  const selectedLayer = useMemo(() => {
    if (!selected.pageId || !selected.layerId) return null;
    if (!activePageId || selected.pageId !== activePageId) return null;
    const page = pages.find((p) => p.id === selected.pageId);
    if (!page) return null;
    return page.layers.find((l) => l.id === selected.layerId) || null;
  }, [pages, selected, activePageId]);

  const handleSelectedChange = useCallback((info: { pageId: number; layerId: number | null }) => {
    setSelected(info);
  }, []);

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

  const updateActivePage = (patch: Partial<SimplePage>) => {
    if (!activePageId) return;
    applyPages((arr) => arr.map((p) => (p.id === activePageId ? { ...p, ...patch } : p)));
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

  const onSave = async (publish = true) => {
    setLoading(true);
    setError(null);
    try {
      const col = collection(db, "dergi");
      const refDoc = editingId ? doc(db, "dergi", editingId) : doc(col);
      const pageWidth = 560;
      const pageHeight = 700;
      const padding = 24;
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
          const bg = p.backgroundColor || "#ffffff";
          return `<div class=\"page\" style=\"position:relative;width:${pageWidth}px;height:${pageHeight}px;padding:${padding}px;box-sizing:border-box;background:${bg};\">${layersHtml}</div>`;
        })
        .join('<hr class="page-break" />');

      const excerpt = content.slice(0, 300);
      const nowTitle = title.trim() || "Başlıksız Yazı";
      const baseSlug =
        nowTitle
          .toLowerCase()
          .replace(/[^a-z0-9ığüşöç\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "") || "yazi";

      const authorId = authUser?.uid || "anonymous";
      const authorName = authUser?.displayName || authUser?.email || "Bilinmeyen";
      const lastEditedById = authorId;
      const lastEditedByName = authorName;
      const status = publish ? "published" : "draft";

      const categoryValue = category.trim();

      const payload: any = {
        title: nowTitle,
        slug: baseSlug,
        status,
        category: categoryValue || null,
        coverImageUrl: coverImageUrl.trim() || null,
        content,
        excerpt,
        editorPages: pages.map((p) => ({
          id: p.id,
          backgroundColor: p.backgroundColor || "#ffffff",
          layers: p.layers,
        })),
        authorId,
        authorName,
        lastEditedById,
        lastEditedByName,
        categories: categoryValue ? [categoryValue] : [],
        tags: [],
        editorNotes: [],
        media: [],
        updatedAt: serverTimestamp(),
        publishedAt: publish ? serverTimestamp() : null,
        scheduledAt: null,
      };

      if (editingId) {
        await updateDoc(refDoc, payload);
      } else {
        await setDoc(refDoc, { ...payload, createdAt: serverTimestamp() });
      }

      router.replace("/admin");
    } catch (e: any) {
      setError(e?.message ?? "Kaydetme hatası");
    } finally {
      setLoading(false);
    }
  };

  return {
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
    activeTab,
    setActiveTab,
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
    category,
    setCategory,
    coverImageUrl,
    setCoverImageUrl,
    loadingExisting,
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
  };
}
