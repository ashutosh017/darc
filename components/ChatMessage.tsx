"use client";

import React, { useState, memo } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { StreamingText } from "./StreamingText";

interface ChatMessageProps {
  role: "user" | "coach";
  content: string;
  isComplete?: boolean;
}

export const ChatMessage = memo(function ChatMessage({ role, content, isComplete }: ChatMessageProps) {
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
          "text-[16px] leading-[1.65]",
          isCoach 
            ? "bg-transparent text-stone-300 py-1 w-full" 
            : "bg-stone-800 text-stone-100 rounded-2xl rounded-br-md px-6 py-3.5 inline-block max-w-full shadow-sm whitespace-pre-wrap"
        )}>
          {isCoach ? (
            <StreamingText content={content} isComplete={isComplete} />
          ) : (
            content
          )}
        </div>

        {isCoach && isComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-1 mt-3"
          >
            <button
              onClick={() => setFeedback(feedback === "up" ? null : "up")}
              className={cn(
                "p-2 rounded-lg transition-all duration-200 hover:bg-stone-800/60",
                feedback === "up" ? "text-amber-400" : "text-stone-600 hover:text-stone-400"
              )}
              title="Helpful"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 10v12"/>
                <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/>
              </svg>
            </button>
            <button
              onClick={() => setFeedback(feedback === "down" ? null : "down")}
              className={cn(
                "p-2 rounded-lg transition-all duration-200 hover:bg-stone-800/60",
                feedback === "down" ? "text-rose-400" : "text-stone-600 hover:text-stone-400"
              )}
              title="Not helpful"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 14V2"/>
                <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"/>
              </svg>
            </button>
            <button
              onClick={copyMessage}
              className="p-2 rounded-lg text-stone-600 hover:text-stone-400 hover:bg-stone-800/60 transition-all duration-200"
              title="Copy"
            >
              {copied ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
                  <path d="M20 6 9 17l-5-5"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                </svg>
              )}
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
});
