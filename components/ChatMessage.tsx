"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { User, Copy, Check, ThumbsUp, ThumbsDown } from "lucide-react";
import { useSession } from "@/lib/auth-client";

interface ChatMessageProps {
  role: "user" | "coach";
  content: string;
  isComplete?: boolean;
}

export function ChatMessage({ role, content, isComplete }: ChatMessageProps) {
  const isCoach = role === "coach";
  const { data: session } = useSession();
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
      className={cn(
        "flex w-full mb-10 gap-4 md:gap-8",
        isCoach ? "flex-row" : "flex-row-reverse"
      )}
    >
      {/* Avatar */}
      <div className="shrink-0 pt-1 hidden md:flex">
        {isCoach ? (
          <div className="w-9 h-9 rounded-full bg-[#1e1f20] flex items-center justify-center border border-[#3c4043]/30 shadow-sm">
            <div className="w-5.5 h-5.5 rounded-full bg-gradient-to-tr from-[#4285f4] via-[#9b72cb] to-[#d96570] opacity-90 animate-shimmer bg-[length:200%_100%]" />
          </div>
        ) : (
          <div className="w-9 h-9 rounded-full overflow-hidden bg-[#1e1f20] flex items-center justify-center border border-[#3c4043]/30 shadow-sm">
            {session?.user.image ? (
              <img src={session.user.image} alt="User" className="w-full h-full object-cover" />
            ) : (
              <User size={20} className="text-[#b4b4b4]" />
            )}
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className={cn(
        "flex-1 max-w-full md:max-w-[calc(100%-3rem)] min-w-0",
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
