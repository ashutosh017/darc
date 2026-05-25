"use client";

import React, { useState, useRef, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage("");
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6">
      <div className="relative flex glass-panel rounded-2xl p-1 input-glow transition-all duration-300">
        <textarea
          ref={textareaRef}
          rows={1}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask DARC about your relationship..."
          disabled={disabled}
          className="w-full bg-transparent border-none focus:ring-0 text-foreground resize-none py-3 px-4 max-h-[200px] overflow-y-auto scrollbar-hide text-sm md:text-base leading-relaxed placeholder:text-muted-foreground/50"
        />
        <div className="flex items-center justify-between px-3 pb-2 pt-1">
          {/* <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
            {message.length} characters
          </div> */}
          <button
            onClick={handleSend}
            disabled={!message.trim() || disabled}
            className={cn(
              "p-2 rounded-xl transition-all duration-300",
              message.trim() && !disabled
                ? "bg-primary text-primary-foreground hover:scale-105 active:scale-95"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </div>
      <p className="hidden md:block text-center text-[10px] text-muted-foreground/40 mt-3 font-medium tracking-tight">
        DARC provides AI-driven relationship coaching. Please consider professional therapy for complex emotional needs.
      </p>
    </div>
  );
}
