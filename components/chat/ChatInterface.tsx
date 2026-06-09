"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { ChatInput } from "@/components/ChatInput";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatHero, TypingIndicator } from "@/components/ChatStatus";
import { MobileHeader } from "@/components/MobileHeader";
import { SignInModal } from "@/components/SignInModal";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { saveMessage, getChatMessages, createChat } from "@/app/actions";
import { useChat } from "@/lib/chat-context";
import { useRouter, useSearchParams } from "next/navigation";

interface Message {
  id: string;
  role: "USER" | "DARC";
  text: string;
  isComplete?: boolean;
}

export function ChatInterface({ chatId }: { chatId: string | null }) {
  const { data: session, isPending: isSessionPending } = useSession();
  const { setCurrentChatId, refreshChats } = useChat();
  
  // Track the current chat ID locally to support seamless transitions
  const [localChatId, setLocalChatId] = useState<string | null>(chatId);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const skipNextFetchRef = useRef(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Sync localChatId when the chatId prop changes
  useEffect(() => {
    setLocalChatId(chatId);
  }, [chatId]);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;
    
    if (!session) {
      return;
    }

    setError(null);
    let activeChatId = localChatId;

    // Create a temporary ID for the user message to show it immediately
    const userMessageId = "temp-user-" + Date.now();
    const userMessage: Message = {
      id: userMessageId,
      role: "USER",
      text: content
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      // 1. Create chat if it doesn't exist (i.e. on the landing page)
      if (!activeChatId) {
        const newChat = await createChat(content.slice(0, 30) + "...");
        activeChatId = newChat.id;
        skipNextFetchRef.current = true; // Prevent clearing/reloading messages on local ID update
        setLocalChatId(activeChatId);
      }

      // 2. Save User Message to DB
      const userMsg = await saveMessage(activeChatId, content, "USER");
      
      // Update temporary user message with actual DB ID
      setMessages((prev) => 
        prev.map((msg) => 
          msg.id === userMessageId 
            ? { ...msg, id: userMsg.id } 
            : msg
        )
      );

      // 3. Hit chat API with message and chatId
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: content, chatId: activeChatId }),
      });

      if (!response.ok) {
        throw new Error("Connection interrupted. Please try rephrasing your relationship query.");
      }

      const coachMessageId = "temp-" + Date.now();
      const coachMessage: Message = {
        id: coachMessageId,
        role: "DARC",
        text: "",
        isComplete: false
      };

      setMessages((prev) => [...prev, coachMessage]);
      setIsTyping(false);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) throw new Error("No reader available");

      let fullCoachText = "";
      while (true) {
        const { value, done: doneReading } = await reader.read();
        if (doneReading) break;

        const chunkValue = decoder.decode(value, { stream: true });
        fullCoachText += chunkValue;
        
        setMessages((prev) => 
          prev.map((msg) => 
            msg.id === coachMessageId 
              ? { ...msg, text: msg.text + chunkValue } 
              : msg
          )
        );
      }

      // 4. Save Coach Message to DB
      const savedCoachMsg = await saveMessage(activeChatId, fullCoachText, "DARC");

      setMessages((prev) => 
        prev.map((msg) => 
          msg.id === coachMessageId 
            ? { ...msg, id: savedCoachMsg.id, isComplete: true } 
            : msg
        )
      );

      // 5. If we started on the landing page (chatId was null), redirect now that streaming is complete
      if (!chatId) {
        await refreshChats();
        router.replace(`/chat/${activeChatId}`);
      }
    } catch (err: unknown) {
      console.error("[DARC Error]", err);
      const errorMessage = err instanceof Error ? err.message : "Connection interrupted.";
      setError(errorMessage);
      setIsTyping(false);
    }
  }, [chatId, localChatId, session, refreshChats, router]);

  // Set current chat ID for sidebar highlighting
  useEffect(() => {
    setCurrentChatId(localChatId);
  }, [localChatId, setCurrentChatId]);

  // Fetch messages when chat changes
  useEffect(() => {
    let active = true;
    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false;
      return;
    }
    if (localChatId && session) {
      getChatMessages(localChatId).then((msgs) => {
        if (active) {
          setMessages(msgs.map(m => ({
            id: m.id,
            role: m.role as "USER" | "DARC",
            text: m.text,
            isComplete: true
          })));
        }
      });
    } else {
      if (active) {
        setMessages([]);
      }
    }
    return () => {
      active = false;
    };
  }, [localChatId, session]);

  // Handle message parameter passed during redirect
  const initMsg = searchParams?.get("msg");
  useEffect(() => {
    if (initMsg && localChatId) {
      // Clear query params to prevent resending on reload
      const newUrl = window.location.pathname;
      window.history.replaceState(null, "", newUrl);
      handleSendMessage(initMsg);
    }
  }, [initMsg, localChatId, handleSendMessage]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  if (isSessionPending) return null;

  return (
    <div className="flex flex-col h-full bg-[#131314] text-[#e3e3e3]">
      <MobileHeader />
      
      {!session && <SignInModal />}
      
      <div className="flex-1 relative overflow-hidden">
        <div 
          ref={scrollRef}
          className="h-full overflow-y-auto scrollbar-hide px-4 md:px-0"
        >
          <div className="max-w-3xl mx-auto pt-8 pb-32 md:pt-12">
            <AnimatePresence mode="popLayout">
              {messages.length === 0 ? (
                <ChatHero key="hero" onPromptClick={handleSendMessage} />
              ) : (
                <div key="messages" className="flex flex-col">
                  {messages.map((message) => (
                    <ChatMessage 
                      key={message.id} 
                      role={message.role === "USER" ? "user" : "coach"} 
                      content={message.text} 
                      isComplete={message.isComplete}
                    />
                  ))}
                  {isTyping && <TypingIndicator key="typing" />}
                </div>
              )}
            </AnimatePresence>
            
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="mt-6 p-4 rounded-2xl bg-[#f28b82]/10 border border-[#f28b82]/20 flex items-center gap-3 text-[#f28b82]"
                >
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {session && (
        <div className="relative z-20 pb-2 md:pb-6 bg-gradient-to-t from-[#131314] via-[#131314] to-transparent pt-8">
          <ChatInput onSendMessage={handleSendMessage} disabled={isTyping} />
        </div>
      )}
    </div>
  );
}
