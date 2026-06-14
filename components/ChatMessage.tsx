"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Copy, Check, ThumbsUp, ThumbsDown } from "lucide-react";

interface ChatMessageProps {
  role: "user" | "coach";
  content: string;
  isComplete?: boolean;
}

export function ChatMessage({ role, content, isComplete }: ChatMessageProps) {
  const isCoach = role === "coach";
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);

  const copyMessage = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex w-full mb-10"
    >
      {/* Content Area */}
      <div className={cn(
        "flex-1 max-w-full min-w-0",
        !isCoach && "flex flex-col items-end"
      )}>
        <div className={cn(
          "text-[16px] leading-[1.65] text-[#e3e3e3] whitespace-pre-wrap",
          isCoach ? "w-full" : "bg-[#1e1f20] px-6 py-3.5 rounded-[24px] inline-block max-w-full shadow-sm"
        )}>
          {content.replaceAll("**", "").replaceAll("__", "")}
        </div>

        {isCoach && isComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 mt-5"
          >
            <button
              onClick={() => setFeedback(feedback === "up" ? null : "up")}
              className={cn(
                "p-2.5 rounded-full transition-colors hover:bg-[#282a2c]",
                feedback === "up" ? "text-[#8ab4f8] bg-[#8ab4f8]/10" : "text-[#b4b4b4]"
              )}
              title="Good response"
            >
              <ThumbsUp size={16} />
            </button>
            <button
              onClick={() => setFeedback(feedback === "down" ? null : "down")}
              className={cn(
                "p-2.5 rounded-full transition-colors hover:bg-[#282a2c]",
                feedback === "down" ? "text-[#f28b82] bg-[#f28b82]/10" : "text-[#b4b4b4]"
              )}
              title="Bad response"
            >
              <ThumbsDown size={16} />
            </button>
            <div className="w-px h-4 bg-[#3c4043] mx-1.5" />
            <button
              onClick={copyMessage}
              className="flex items-center gap-2 p-2.5 rounded-full text-[#b4b4b4] hover:bg-[#282a2c] transition-colors"
              title="Copy response"
            >
              {copied ? <Check size={16} className="text-[#8ab4f8]" /> : <Copy size={16} />}
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
