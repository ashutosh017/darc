"use client";

import React, { useState, useRef, useEffect } from "react";
import { ArrowUp, Mic, Image as ImageIcon, Plus } from "lucide-react";
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
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4">
      <div className="relative flex flex-col bg-[#1e1f20] rounded-[32px] p-2 transition-all duration-300 shadow-lg border border-transparent focus-within:border-[#3c4043]">
        <div className="flex items-end gap-2 px-2">
          {/* Optional: Add a plus or upload button like Gemini */}
          {/* <button className="p-3 text-[#b4b4b4] hover:text-[#e3e3e3] hover:bg-[#282a2c] rounded-full transition-colors mb-1">
            <Plus size={20} />
          </button> */}
          
          <textarea
            ref={textareaRef}
            rows={1}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask DARC..."
            disabled={disabled}
            className="w-full bg-transparent border-none focus:ring-0 text-[#e3e3e3] resize-none py-3 px-4 max-h-[200px] overflow-y-auto scrollbar-hide text-[16px] leading-relaxed placeholder:text-[#b4b4b4]"
          />
          
          <div className="flex items-center gap-1 mb-1.5">
            {/* <button className="p-3 text-[#b4b4b4] hover:text-[#e3e3e3] hover:bg-[#282a2c] rounded-full transition-colors">
              <Mic size={20} />
            </button> */}
            <button
              onClick={handleSend}
              disabled={!message.trim() || disabled}
              className={cn(
                "p-3 rounded-full transition-all duration-300",
                message.trim() && !disabled
                  ? "bg-[#e3e3e3] text-[#131314] hover:bg-white scale-100"
                  : "bg-transparent text-[#3c4043] cursor-not-allowed"
              )}
            >
              <ArrowUp size={20} />
            </button>
          </div>
        </div>
      </div>
      <p className="text-center text-[11px] text-[#b4b4b4] mt-3 px-4">
        DARC may display inaccurate info, so double-check its coaching insights.
      </p>
    </div>
  );
}
