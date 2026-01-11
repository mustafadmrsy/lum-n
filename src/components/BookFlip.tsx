"use client";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { useNavigationLock } from "@/context/NavigationLockContext";

export type BookFlipHandle = {
  next: () => void;
  prev: () => void;
  goTo: (pageIndex: number) => void;
};

type Props = {
  pages: string[];
  mode?: "toggle" | "alwaysFlip";
  initialPage?: number;
  showSpreadDivider?: boolean;
  onPageChange?: (info: { page: number; total: number }) => void;
};

const BookFlip = forwardRef<BookFlipHandle, Props>(function BookFlip(
  { pages, mode = "toggle", initialPage = 0, showSpreadDivider = false, onPageChange }: Props,
  ref
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 520, height: 650 });
  const [FlipComp, setFlipComp] = useState<any>(null);
  const { isLocked } = useNavigationLock();
  const bookRef = useRef<any>(null);

  const scale = Math.min(size.width / 560, size.height / 700);
  const scaledWidth = Math.floor(560 * scale);
  const scaledHeight = Math.floor(700 * scale);

  useEffect(() => {
    let mounted = true;
    import("react-pageflip").then((m: any) => {
      if (mounted) setFlipComp(() => m.default);
    }).catch(() => setFlipComp(null));
    return () => { mounted = false; };
  }, []);

  const total = pages.length;
  const [currentPage, setCurrentPage] = useState(0);
  useEffect(() => {
    if (!onPageChange) return;
    onPageChange({ page: Math.min(Math.max(0, initialPage), Math.max(0, total - 1)), total });
  }, [onPageChange, initialPage, total]);

  const safeInitial = useMemo(() => Math.min(Math.max(0, initialPage), Math.max(0, total - 1)), [initialPage, total]);

  const shouldRenderDividerStatic = showSpreadDivider && total > 1 && safeInitial > 0 && safeInitial < total - 1;

  useEffect(() => {
    setCurrentPage(safeInitial);
  }, [safeInitial]);

  const emitPage = useCallback(
    (page: number) => {
      if (!onPageChange) return;
      const p = Math.min(Math.max(0, page), Math.max(0, total - 1));
      onPageChange({ page: p, total });
    },
    [onPageChange, total]
  );

  useImperativeHandle(
    ref,
    () => ({
      next: () => {
        try {
          bookRef.current?.pageFlip?.()?.flipNext?.();
        } catch {}
      },
      prev: () => {
        try {
          bookRef.current?.pageFlip?.()?.flipPrev?.();
        } catch {}
      },
      goTo: (pageIndex: number) => {
        try {
          bookRef.current?.pageFlip?.()?.turnToPage?.(pageIndex);
          emitPage(pageIndex);
        } catch {}
      },
    }),
    [emitPage]
  );

  useEffect(() => {
    const onResize = () => {
      const el = containerRef.current;
      if (!el) return;
      // Our editor pages are 560x700 (ratio 1.25). Width prop is single-page width.
      // We aim for a two-page spread, so we base the page width on half container.
      const availableW = el.clientWidth;
      const availableH = el.clientHeight;
      const maxByWidth = Math.floor(availableW / 2) - 16;
      const maxByHeight = Math.floor((availableH - 16) * (560 / 700));
      const pageMaxW = Math.min(560, maxByWidth, maxByHeight);
      const width = Math.max(240, pageMaxW);
      const height = Math.floor(width * (700 / 560));
      setSize({ width, height });
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Flip bileşeni henüz yüklenmemişse: eski fallback statik görünüm
  if (!FlipComp) {
    return (
      <div ref={containerRef} className="w-full h-full flex justify-center relative">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 w-full h-full max-w-5xl">
          {pages.slice(0, 2).map((html, i) => (
            <div key={i} className="bg-white shadow border border-black/10">
              <div className="flex items-start justify-center" style={{ width: size.width, height: size.height, overflow: "hidden" }}>
                <div style={{ width: scaledWidth, height: scaledHeight, overflow: "hidden" }}>
                  <div
                    className="prose max-w-none"
                    style={{ width: 560, height: 700, transform: `scale(${scale})`, transformOrigin: "top left" }}
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {shouldRenderDividerStatic ? (
          <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-full w-px bg-black/20" />
        ) : null}
      </div>
    );
  }

  const HTMLFlipBook: any = FlipComp;

  const shouldShowFlip = mode === "alwaysFlip" || !isLocked;
  const flipKey = `${pages.length}-${pages[0]?.length ?? 0}-${pages[pages.length - 1]?.length ?? 0}`;
  const coverShift = shouldShowFlip && safeInitial === 0 && currentPage === 0 ? Math.floor(size.width / 2) : 0;
  const shouldRenderDivider = showSpreadDivider && total > 1 && coverShift === 0 && currentPage > 0 && currentPage < total - 1;

  // FlipComp yüklendiğinde: hem flip hem statik görünümü aynı anda render et,
  // kilit durumuna göre sadece biri görünür olsun; böylece sayfa state'i korunur.
  return (
    <div ref={containerRef} className="w-full h-full flex justify-center relative">
      <div className="w-full h-full max-w-5xl flex justify-center">
        <div
          className={shouldShowFlip ? "block" : "hidden"}
          style={{ transform: coverShift ? `translateX(-${coverShift}px)` : undefined, transition: "transform 200ms ease" }}
        >
          <HTMLFlipBook
            key={flipKey}
            ref={bookRef}
            width={size.width}
            height={size.height}
            className="shadow-xl rounded-md"
            showCover={true}
            usePortrait={false}
            mobileScrollSupport={true}
            maxShadowOpacity={0.3}
            useMouseEvents={true}
            startPage={safeInitial}
            onFlip={(e: any) => {
              const p = typeof e?.data === "number" ? e.data : typeof e?.page === "number" ? e.page : 0;
              setCurrentPage(p);
              emitPage(p);
            }}
          >
            {pages.map((html, i) => (
              <div key={i} className="bg-white font-serif text-[var(--color-brown)]" style={{ overflow: "hidden" }}>
                <div className="flex items-start justify-center" style={{ width: size.width, height: size.height, overflow: "hidden" }}>
                  <div style={{ width: scaledWidth, height: scaledHeight, overflow: "hidden" }}>
                    <div
                      className="prose max-w-none"
                      style={{ width: 560, height: 700, transform: `scale(${scale})`, transformOrigin: "top left" }}
                      dangerouslySetInnerHTML={{ __html: html }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </HTMLFlipBook>
        </div>

        <div className={mode === "toggle" && isLocked ? "block" : "hidden"}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {pages.slice(0, 2).map((html, i) => (
              <div key={i} className="bg-white shadow border border-black/10">
                <div className="flex items-start justify-center" style={{ width: size.width, height: size.height, overflow: "hidden" }}>
                  <div style={{ width: scaledWidth, height: scaledHeight, overflow: "hidden" }}>
                    <div
                      className="prose max-w-none"
                      style={{ width: 560, height: 700, transform: `scale(${scale})`, transformOrigin: "top left" }}
                      dangerouslySetInnerHTML={{ __html: html }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {shouldRenderDivider ? (
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-full w-px bg-black/20" />
      ) : null}
    </div>
  );
});

export default BookFlip;
