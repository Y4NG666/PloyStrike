import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  title: "PolyStrike | CS2 DeFi & GameFi",
  description:
    "Advanced CS2 skins derivatives trading & case opening on Polygon. Binary options meets GameFi with 100% refund guarantee.",
  keywords: ["DeFi", "GameFi", "CS2", "Polygon", "Trading", "Derivatives"],
  openGraph: {
    title: "PolyStrike",
    description: "Next-gen CS2 DeFi & GameFi platform",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geist.variable} scroll-smooth`}>
      <body className="bg-bg-primary text-white antialiased">
        <div className="flex h-screen flex-col overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
