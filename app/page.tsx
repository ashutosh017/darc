"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChatInput } from "@/components/ChatInput";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatHero, TypingIndicator } from "@/components/ChatStatus";
import { ApiKeyModal } from "@/components/ApiKeyModal";
import { MobileHeader } from "@/components/MobileHeader";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Key, LogIn } from "lucide-react";
import { useSession, signIn } from "@/lib/auth-client";
import { saveMessage, getChatMessages, createChat } from "@/app/actions";
import { useChat } from "@/lib/chat-context";

interface Message {
  id: string;
  role: "USER" | "DARC";
  text: string;
  isComplete?: boolean;
}

const STORAGE_KEY = "darc_gemini_api_key";

export default function ChatPage() {
  const { data: session, isPending: isSessionPending } = useSession();
  const { currentChatId, setCurrentChatId, refreshChats } = useChat();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  // const [apiKey, setApiKey] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load API key on mount
  /*
  useEffect(() => {
    const savedKey = localStorage.getItem(STORAGE_KEY);
    if (savedKey) setApiKey(savedKey);
    else setIsKeyModalOpen(true);
  }, []);
  */

  // Fetch messages when chat changes
  useEffect(() => {
    if (currentChatId) {
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
  }, [currentChatId]);

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

  /*
  const handleSaveKey = (key: string) => {
    localStorage.setItem(STORAGE_KEY, key);
    setApiKey(key);
    setIsKeyModalOpen(false);
  };
  */

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;
    
    if (!session) {
      setError("Please sign in to chat with DARC.");
      return;
    }

    /*
    if (!apiKey) {
      setIsKeyModalOpen(true);
      return;
    }
    */

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

      const history = messages.map(m => ({
        role: m.role === "USER" ? "user" : "model",
        parts: [{ text: m.text }]
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          // "X-Gemini-API-Key": apiKey || ""
        },
        body: JSON.stringify({ message: content, history }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        /*
        if (response.status === 401) {
          setIsKeyModalOpen(true);
          throw new Error(data.error || "Invalid or missing API Key.");
        }
        */
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
    <div className="flex flex-col h-full overflow-hidden relative">
      <MobileHeader /* onKeyClick={() => setIsKeyModalOpen(true)} */ />
      
      {/* 
      <ApiKeyModal 
        isOpen={isKeyModalOpen} 
        onSave={handleSaveKey} 
        onClose={() => setIsKeyModalOpen(false)}
        initialValue={apiKey || ""}
      />
      */}

      {/* Settings Update: Tiny Key Icon (Top Right) - Commented out */}
      {/* 
      <div className="absolute top-6 right-6 z-30 hidden md:block">
        <button
          onClick={() => setIsKeyModalOpen(true)}
          className="p-2.5 rounded-xl glass-panel text-muted-foreground hover:text-primary hover:border-primary/50 transition-all active:scale-95 group"
          title="Update API Key"
        >
          <Key className="w-5 h-5 group-hover:rotate-12 transition-transform" />
        </button>
      </div>
      */}

      <div className="flex-1 relative overflow-hidden">
        <div 
          ref={scrollRef}
          className="h-full overflow-y-auto scrollbar-hide px-4 md:px-0"
        >
          <div className="max-w-4xl mx-auto pt-8 pb-20 md:py-24">
            <AnimatePresence mode="popLayout">
              {!session ? (
                <motion.div 
                  key="auth-gate"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center min-h-[60vh] text-center"
                >
                  <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
                    <LogIn className="w-10 h-10 text-primary" />
                  </div>
                  <h1 className="text-3xl font-bold mb-4 tracking-tight">Welcome to DARC</h1>
                  <p className="text-muted-foreground max-w-sm mb-8">
                    Your personal relationship coach is ready. Please sign in to start your session.
                  </p>
                  <button
                    onClick={() => signIn.social({ provider: "google" })}
                    className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-primary/20"
                  >
                    Get Started
                  </button>
                </motion.div>
              ) : messages.length === 0 ? (
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
                  className="mt-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-3 text-destructive"
                >
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="relative z-20 pb-4">
        <ChatInput onSendMessage={handleSendMessage} disabled={isTyping || !session} />
      </div>
    </div>
  );
}
