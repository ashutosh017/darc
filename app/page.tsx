"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChatInput } from "@/components/ChatInput";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatHero, TypingIndicator } from "@/components/ChatStatus";
import { MobileHeader } from "@/components/MobileHeader";
import { SignInModal } from "@/components/SignInModal";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { useSession, signIn } from "@/lib/auth-client";
import { saveMessage, getChatMessages, createChat } from "@/app/actions";
import { useChat } from "@/lib/chat-context";

interface Message {
  id: string;
  role: "USER" | "DARC";
  text: string;
  isComplete?: boolean;
}

export default function ChatPage() {
  const { data: session, isPending: isSessionPending } = useSession();
  const { currentChatId, setCurrentChatId, refreshChats } = useChat();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch messages when chat changes
  useEffect(() => {
    if (currentChatId && session) {
      getChatMessages(currentChatId).then((msgs) => {
        setMessages(msgs.map(m => ({
          id: m.id,
          role: m.role as "USER" | "DARC",
          text: m.text,
          isComplete: true
        })));
      });
    } else {
      setMessages([]);
    }
  }, [currentChatId, session]);

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

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;
    
    if (!session) {
      return;
    }

    setError(null);
    let chatId = currentChatId;

    try {
      // 1. Create chat if it doesn't exist
      if (!chatId) {
        const newChat = await createChat(content.slice(0, 30) + "...");
        chatId = newChat.id;
        setCurrentChatId(chatId);
        await refreshChats();
      }

      // 2. Save User Message to DB
      const userMsg = await saveMessage(chatId, content, "USER");
      
      const userMessage: Message = {
        id: userMsg.id,
        role: "USER",
        text: content
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsTyping(true);

      // const history = messages.map(m => ({
      //   role: m.role === "USER" ? "user" : "model",
      //   parts: [{ text: m.text }]
      // }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: content }),
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

      // 3. Save Coach Message to DB
      const savedCoachMsg = await saveMessage(chatId, fullCoachText, "DARC");

      setMessages((prev) => 
        prev.map((msg) => 
          msg.id === coachMessageId 
            ? { ...msg, id: savedCoachMsg.id, isComplete: true } 
            : msg
        )
      );
    } catch (err: unknown) {
      console.error("[DARC Error]", err);
      const errorMessage = err instanceof Error ? err.message : "Connection interrupted.";
      setError(errorMessage);
      setIsTyping(false);
    }
  };

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
