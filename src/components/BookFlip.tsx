"use client";
import { useEffect, useRef, useState } from "react";
import { useNavigationLock } from "@/context/NavigationLockContext";

export default function BookFlip({ pages }: { pages: string[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 420, height: 600 });
  const [FlipComp, setFlipComp] = useState<any>(null);
  const { isLocked } = useNavigationLock();

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
      const maxW = Math.min(520, Math.max(300, Math.floor(el.clientWidth / 2) - 16));
      const width = maxW;
      const height = Math.floor(width * 1.414); // ~A5 portrait
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
            <div key={i} className="bg-white p-6 shadow border border-black/10">
              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const HTMLFlipBook: any = FlipComp;

  // FlipComp yüklendiğinde: hem flip hem statik görünümü aynı anda render et,
  // kilit durumuna göre sadece biri görünür olsun; böylece sayfa state'i korunur.
  return (
    <div ref={containerRef} className="w-full flex justify-center">
      <div className="w-full max-w-5xl flex justify-center">
        <div className={isLocked ? "hidden" : "block"}>
          <HTMLFlipBook
            width={size.width}
            height={size.height}
            className="shadow-xl rounded-md"
            showCover={false}
            mobileScrollSupport={true}
            maxShadowOpacity={0.3}
            useMouseEvents={true}
          >
            {pages.map((html, i) => (
              <div key={i} className="bg-white p-6 font-serif text-[var(--color-brown)]">
                <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
              </div>
            ))}
          </HTMLFlipBook>
        </div>

        <div className={isLocked ? "block" : "hidden"}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {pages.slice(0, 2).map((html, i) => (
              <div key={i} className="bg-white p-6 shadow border border-black/10">
                <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
