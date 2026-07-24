"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ChatProvider } from "@/lib/chat-context";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [viewportHeight, setViewportHeight] = useState("100dvh");

  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;

    const handleResize = () => {
      // Set the height to match the actual visual viewport (excluding keyboard)
      setViewportHeight(`${window.visualViewport.height}px`);
    };

    window.visualViewport.addEventListener("resize", handleResize);
    window.visualViewport.addEventListener("scroll", handleResize);
    
    // Initial call
    handleResize();

    return () => {
      window.visualViewport?.removeEventListener("resize", handleResize);
      window.visualViewport?.removeEventListener("scroll", handleResize);
    };
  }, []);

  return (
    <ChatProvider>
      <div 
        style={{ height: viewportHeight }}
        className="flex flex-col md:flex-row w-full overflow-hidden"
      >
        <Sidebar />
        <main className="flex-1 relative overflow-hidden bg-[#0C0A09]">
          {children}
        </main>
      </div>
    </ChatProvider>
  );
}
