import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "우리 만날랩?",
  description: "친구들과 모임 장소, 날짜를 쉽게 정해요",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className={`${notoSansKr.className} min-h-full bg-gray-50`}>
        <div className="mx-auto max-w-md min-h-screen bg-white shadow-sm">
          {children}
        </div>
        <Toaster />
      </body>
    </html>
  );
}
