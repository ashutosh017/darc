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
          "text-[16px] leading-[1.65]",
          isCoach 
            ? "bg-gradient-to-br from-stone-900 to-stone-800 border border-stone-800 border-l-amber-500/30 border-l-2 text-stone-300 rounded-2xl rounded-bl-md shadow-inner px-6 py-5 w-full" 
            : "bg-stone-800 text-stone-100 rounded-2xl rounded-br-md px-6 py-3.5 inline-block max-w-full shadow-sm whitespace-pre-wrap"
        )}>
          {isCoach ? (
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
                strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="text-stone-300">{children}</li>,
                h1: ({ children }) => <h1 className="text-xl font-bold mb-4 mt-6 text-stone-50">{children}</h1>,
                h2: ({ children }) => <h2 className="text-lg font-bold mb-3 mt-5 text-stone-50">{children}</h2>,
                h3: ({ children }) => <h3 className="text-base font-bold mb-2 mt-4 text-stone-50">{children}</h3>,
                code: ({ children }) => <code className="bg-stone-800 px-1.5 py-0.5 rounded text-sm font-mono text-amber-500">{children}</code>,
                pre: ({ children }) => <pre className="bg-stone-900 p-4 rounded-xl border border-stone-800 overflow-x-auto my-4 font-mono text-sm">{children}</pre>,
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
                "p-2.5 rounded-full transition-colors hover:bg-stone-800",
                feedback === "up" ? "text-amber-500 bg-amber-500/10" : "text-stone-400"
              )}
              title="Good response"
            >
              <ThumbsUp size={16} />
            </button>
            <button
              onClick={() => setFeedback(feedback === "down" ? null : "down")}
              className={cn(
                "p-2.5 rounded-full transition-colors hover:bg-stone-800",
                feedback === "down" ? "text-rose-500 bg-rose-500/10" : "text-stone-400"
              )}
              title="Bad response"
            >
              <ThumbsDown size={16} />
            </button>
            <div className="w-px h-4 bg-stone-700 mx-1.5" />
            <button
              onClick={copyMessage}
              className="flex items-center gap-2 p-2.5 rounded-full text-stone-400 hover:bg-stone-800 transition-colors"
              title="Copy response"
            >
              {copied ? <Check size={16} className="text-amber-500" /> : <Copy size={16} />}
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
