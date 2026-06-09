"use client";

import React, { Suspense } from "react";
import { ChatInterface } from "@/components/chat/ChatInterface";

export default function ChatPage() {
  return (
    <Suspense fallback={null}>
      <ChatInterface chatId={null} />
    </Suspense>
  );
}
