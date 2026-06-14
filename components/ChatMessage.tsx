"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Copy, Check, ThumbsUp, ThumbsDown } from "lucide-react";
import ReactMarkdown from "react-markdown";

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
          "text-[16px] leading-[1.65] text-[#e3e3e3]",
          isCoach ? "w-full" : "bg-[#1e1f20] px-6 py-3.5 rounded-[24px] inline-block max-w-full shadow-sm whitespace-pre-wrap"
        )}>
          {isCoach ? (
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
                strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="text-[#e3e3e3]">{children}</li>,
                h1: ({ children }) => <h1 className="text-xl font-bold mb-4 mt-6 text-white">{children}</h1>,
                h2: ({ children }) => <h2 className="text-lg font-bold mb-3 mt-5 text-white">{children}</h2>,
                h3: ({ children }) => <h3 className="text-base font-bold mb-2 mt-4 text-white">{children}</h3>,
                code: ({ children }) => <code className="bg-[#282a2c] px-1.5 py-0.5 rounded text-sm font-mono text-[#8ab4f8]">{children}</code>,
                pre: ({ children }) => <pre className="bg-[#1e1f20] p-4 rounded-xl border border-[#3c4043]/30 overflow-x-auto my-4 font-mono text-sm">{children}</pre>,
              }}
            >
              {content}
            </ReactMarkdown>
          ) : (
            content
          )}
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
