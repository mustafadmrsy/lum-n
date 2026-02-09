import Image from "next/image";

export default function Footer() {
  return (
    <footer className="border-t border-black/10 bg-[#800020]/95 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-5">
        <div className="grid gap-6 sm:grid-cols-3 sm:items-center">
          <div className="text-center sm:text-left">
            <div className="font-serif text-[15px] text-white/95">Dergi Lumin</div>
            <div className="mt-1 text-[11px] text-white/70">© 2025 • Tüm hakları saklıdır.</div>
          </div>

          <div className="flex items-center justify-center gap-3 text-center">
            <Image
              src="/logos/lumin-logo.jpg"
              alt="Dergi Lumin"
              width={32}
              height={32}
              className="h-8 w-8 rounded-lg object-cover"
              priority={false}
            />
            <div className="text-[11px] text-white/75 leading-5">
              Minimal dergi deneyimi • Sayılar ve özel içerikler.
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 sm:justify-end">
            <a
              href="https://www.instagram.com/lumindergi/"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              title="Instagram"
              className="group inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 transition hover:bg-white/10 hover:border-white/25 focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              <Image src="/icon/instagram.svg" alt="" width={18} height={18} className="h-[18px] w-[18px]" />
            </a>

            <a
              href="https://www.tiktok.com/@dergi.lumin"
              target="_blank"
              rel="noreferrer"
              aria-label="TikTok"
              title="TikTok"
              className="group inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 transition hover:bg-white/10 hover:border-white/25 focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              <Image src="/icon/tiktok.svg" alt="" width={18} height={18} className="h-[18px] w-[18px]" />
            </a>

            <a
              href="mailto:lumindergi@gmail.com"
              aria-label="Mail"
              title="Mail"
              className="group inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 transition hover:bg-white/10 hover:border-white/25 focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              <Image src="/icon/gmail.svg" alt="" width={18} height={18} className="h-[18px] w-[18px]" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
