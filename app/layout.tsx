import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://darc.fun"),
  title: {
    default: "DARC | AI Dating & Relationship Coach",
    template: "%s | DARC",
  },
  description: "DARC is your personal AI Dating and Relationship Coach. Get expert, personalized relationship advice, communication tips, and dating guidance instantly.",
  keywords: [
    "dating coach",
    "relationship advice",
    "dating assistant",
    "relationship coach AI",
    "dating tips",
    "dating help",
    "communication coach",
    "dating AI",
    "relationship help",
    "DARC AI"
  ],
  authors: [{ name: "DARC Team" }],
  creator: "DARC Team",
  publisher: "DARC",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "DARC | AI Dating & Relationship Coach",
    description: "Get expert, personalized relationship advice, communication tips, and dating guidance instantly with DARC, your AI coach.",
    url: "https://darc.fun",
    siteName: "DARC",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "DARC | AI Dating & Relationship Coach",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DARC | AI Dating & Relationship Coach",
    description: "Get expert, personalized relationship advice, communication tips, and dating guidance instantly with DARC, your AI coach.",
    images: ["/og-image.png"],
    creator: "@darc_ai",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#131314] text-[#e3e3e3]`}
      >
        {children}
      </body>
    </html>
  );
}
