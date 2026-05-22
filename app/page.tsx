"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChatInput } from "@/components/ChatInput";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatHero, TypingIndicator } from "@/components/ChatStatus";
import { ApiKeyModal } from "@/components/ApiKeyModal";
import { MobileHeader } from "@/components/MobileHeader";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Key } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "coach";
  content: string;
  isComplete?: boolean;
}

const STORAGE_KEY = "darc_gemini_api_key";
const MESSAGES_KEY = "darc_chat_messages";

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Phase 1.1: Initial Mount Check
  useEffect(() => {
    const savedKey = localStorage.getItem(STORAGE_KEY);
    const savedMessages = localStorage.getItem(MESSAGES_KEY);
    
    // Use setTimeout to move setState out of the synchronous execution block
    // and satisfy strict linting rules for React 18+ patterns.
    const timer = setTimeout(() => {
      if (savedKey) {
        setApiKey(savedKey);
      } else {
        setIsKeyModalOpen(true);
      }

      if (savedMessages) {
        try {
          setMessages(JSON.parse(savedMessages));
        } catch (e) {
          console.error("Failed to parse saved messages", e);
        }
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
    }
  }, [messages]);

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

  // Phase 1.3: Storage Logic
  const handleSaveKey = (key: string) => {
    localStorage.setItem(STORAGE_KEY, key);
    setApiKey(key);
    setIsKeyModalOpen(false);
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;
    
    // Check for key before sending
    if (!apiKey) {
      setIsKeyModalOpen(true);
      return;
    }

    setError(null);
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const history = messages.map(m => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }]
      }));

      // Phase 1.5: Fetch Adjustment with X-Gemini-API-Key header
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Gemini-API-Key": apiKey || ""
        },
        body: JSON.stringify({ message: content, history }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (response.status === 401) {
          setIsKeyModalOpen(true);
          throw new Error(data.error || "Invalid or missing API Key.");
        }
        throw new Error("Connection interrupted. Please try rephrasing your relationship query.");
      }

      const coachMessageId = (Date.now() + 1).toString();
      const coachMessage: Message = {
        id: coachMessageId,
        role: "coach",
        content: "",
        isComplete: false
      };

      setMessages((prev) => [...prev, coachMessage]);
      setIsTyping(false);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) throw new Error("No reader available");

      while (true) {
        const { value, done: doneReading } = await reader.read();
        if (doneReading) break;

        const chunkValue = decoder.decode(value, { stream: true });
        
        setMessages((prev) => 
          prev.map((msg) => 
            msg.id === coachMessageId 
              ? { ...msg, content: msg.content + chunkValue } 
              : msg
          )
        );
      }

      setMessages((prev) => 
        prev.map((msg) => 
          msg.id === coachMessageId 
            ? { ...msg, isComplete: true } 
            : msg
        )
      );
    } catch (err: unknown) {
      console.error("[DARC Error]", err);
      const errorMessage = err instanceof Error ? err.message : "Connection interrupted. Please try rephrasing your relationship query.";
      setError(errorMessage);
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      <MobileHeader onKeyClick={() => setIsKeyModalOpen(true)} />
      
      {/* Phase 1.2: API Key Entry Modal */}
      <ApiKeyModal 
        isOpen={isKeyModalOpen} 
        onSave={handleSaveKey} 
        onClose={() => setIsKeyModalOpen(false)}
        initialValue={apiKey || ""}
      />

      {/* Settings Update: Tiny Key Icon (Top Right) - Hidden on mobile as it's in header */}
      <div className="absolute top-6 right-6 z-30 hidden md:block">
        <button
          onClick={() => setIsKeyModalOpen(true)}
          className="p-2.5 rounded-xl glass-panel text-muted-foreground hover:text-primary hover:border-primary/50 transition-all shadow-lg active:scale-95 group"
          title="Update API Key"
        >
          <Key className="w-5 h-5 group-hover:rotate-12 transition-transform" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 relative overflow-hidden">
        <div 
          ref={scrollRef}
          className="h-full overflow-y-auto scrollbar-hide px-4 md:px-0"
        >
          <div className="max-w-4xl mx-auto py-20 md:py-24">
            <AnimatePresence mode="popLayout">
              {messages.length === 0 ? (
                <ChatHero key="hero" onPromptClick={handleSendMessage} />
              ) : (
                <div key="messages" className="flex flex-col">
                  {messages.map((message) => (
                    <ChatMessage 
                      key={message.id} 
                      role={message.role} 
                      content={message.content} 
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
        
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-background to-transparent pointer-events-none z-10" />
        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />
      </div>

      {/* Input Area */}
      <div className="relative z-20 pb-4">
        <ChatInput onSendMessage={handleSendMessage} disabled={isTyping} />
      </div>
    </div>
  );
}
