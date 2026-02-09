import type { Metadata } from "next";
import { Bodoni_Moda, EB_Garamond, Inter, Libre_Bodoni, Playfair_Display } from "next/font/google";
import "./globals.css";
import AppFrame from "@/components/AppFrame";
import { NavigationLockProvider } from "@/context/NavigationLockContext";
import NavigationGuard from "@/components/NavigationGuard";
import LockToggleButton from "@/components/LockToggleButton";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const bodoni = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin"],
});

const libreBodoni = Libre_Bodoni({
  variable: "--font-libre-bodoni",
  subsets: ["latin"],
});

const garamond = EB_Garamond({
  variable: "--font-garamond",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.xn--lumn-nza.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Dergi Lumin",
  description: "Minimal dergi deneyimi",
  icons: {
    icon: [{ url: "/logos/lumin-logo.jpg" }],
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    title: "Dergi Lumin",
    description: "Minimal dergi deneyimi",
    siteName: "Dergi Lumin",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dergi Lumin",
    description: "Minimal dergi deneyimi",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body
        className={`${inter.variable} ${playfair.variable} ${bodoni.variable} ${libreBodoni.variable} ${garamond.variable} antialiased text-[color:var(--color-brown)]`}
      >
        <NavigationLockProvider>
          <NavigationGuard />
          <AppFrame>{children}</AppFrame>
          <LockToggleButton />
        </NavigationLockProvider>
      </body>
    </html>
  );
}
