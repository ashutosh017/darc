"use client";

import React, { useState, useRef, useEffect } from "react";
import { ArrowUp, Mic, Image as ImageIcon, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSendMessage,
  disabled,
  placeholder,
}: ChatInputProps) {
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
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-1">
      <div className="relative flex flex-col bg-stone-900 rounded-[32px] p-2 transition-[border-color,box-shadow] duration-200 shadow-lg border border-transparent focus-within:border-amber-500/50 focus-within:ring-1 focus-within:ring-amber-500/20">
        <div className="flex items-end gap-2 px-2">
          {/* Optional: Add a plus or upload button like Gemini */}
          {/* <button className="p-3 text-stone-400 hover:text-stone-50 hover:bg-stone-800 rounded-full transition-colors mb-1">
            <Plus size={20} />
          </button> */}

          <textarea
            ref={textareaRef}
            rows={1}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || "Ask DARC..."}
            disabled={disabled}
            className="w-full bg-transparent border-none focus:ring-0 outline-none text-stone-50 resize-none py-3 px-4 max-h-[200px] overflow-y-auto scrollbar-hide text-[16px] leading-relaxed placeholder:text-stone-500"
          />

          <div className="flex items-center gap-1 mb-1.5">
            {/* <button className="p-3 text-stone-400 hover:text-stone-50 hover:bg-stone-800 rounded-full transition-colors">
              <Mic size={20} />
            </button> */}
            <button
              onClick={handleSend}
              disabled={!message.trim() || disabled}
              className={cn(
                "p-3 rounded-full transition-all duration-300",
                message.trim() && !disabled
                  ? "bg-amber-500 text-[#0C0A09] hover:bg-amber-400 scale-100"
                  : "bg-transparent text-stone-700 cursor-not-allowed",
              )}
            >
              <ArrowUp size={20} />
            </button>
          </div>
        </div>
      </div>
      <p className="hidden md:block text-center text-[11px] text-stone-500 mt-3 px-4">
        DARC may display inaccurate info, so double-check its coaching insights.
      </p>
    </div>
  );
}
