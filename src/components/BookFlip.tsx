"use client";
import { useEffect, useRef, useState } from "react";
import { useNavigationLock } from "@/context/NavigationLockContext";

export default function BookFlip({ pages, mode = "toggle" }: { pages: string[]; mode?: "toggle" | "alwaysFlip" }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 520, height: 650 });
  const [FlipComp, setFlipComp] = useState<any>(null);
  const { isLocked } = useNavigationLock();

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

  useEffect(() => {
    const onResize = () => {
      const el = containerRef.current;
      if (!el) return;
      // Our editor pages are 560x700 (ratio 1.25). Width prop is single-page width.
      // We aim for a two-page spread, so we base the page width on half container.
      const pageMaxW = Math.min(560, Math.max(320, Math.floor(el.clientWidth / 2) - 16));
      const width = pageMaxW;
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
      <div ref={containerRef} className="w-full flex justify-center">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 w-full max-w-5xl">
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
    );
  }

  const HTMLFlipBook: any = FlipComp;

  const shouldShowFlip = mode === "alwaysFlip" || !isLocked;
  const flipKey = `${pages.length}-${pages[0]?.length ?? 0}-${pages[pages.length - 1]?.length ?? 0}`;

  // FlipComp yüklendiğinde: hem flip hem statik görünümü aynı anda render et,
  // kilit durumuna göre sadece biri görünür olsun; böylece sayfa state'i korunur.
  return (
    <div ref={containerRef} className="w-full flex justify-center">
      <div className="w-full max-w-5xl flex justify-center">
        <div className={shouldShowFlip ? "block" : "hidden"}>
          <HTMLFlipBook
            key={flipKey}
            width={size.width}
            height={size.height}
            className="shadow-xl rounded-md"
            showCover={true}
            usePortrait={false}
            mobileScrollSupport={true}
            maxShadowOpacity={0.3}
            useMouseEvents={true}
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
    </div>
  );
}
