import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DARC | Dating and Relationship Coach",
  description: "AI-powered relationship coaching for the modern age.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="mesh-background" />
        <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden">
          <Sidebar />
          <main className="flex-1 relative overflow-hidden">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
