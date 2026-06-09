"use client";

import React, { Suspense } from "react";
import { useParams } from "next/navigation";
import { ChatInterface } from "@/components/chat/ChatInterface";

export default function ChatDetailPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <Suspense fallback={null}>
      <ChatInterface chatId={id} />
    </Suspense>
  );
}
