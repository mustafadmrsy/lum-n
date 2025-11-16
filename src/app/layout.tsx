import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { NavigationLockProvider } from "@/context/NavigationLockContext";
import NavigationGuard from "@/components/NavigationGuard";
import LockToggleButton from "@/components/LockToggleButton";
import { AuthProvider } from "@/components/AuthProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dergi Lumin",
  description: "Minimal dergi deneyimi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={`${inter.variable} ${playfair.variable} antialiased text-[color:var(--color-brown)]`}>
        <AuthProvider>
          <NavigationLockProvider>
            <NavigationGuard />
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1">
                {children}
              </main>
              <Footer />
            </div>
            <LockToggleButton />
          </NavigationLockProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
