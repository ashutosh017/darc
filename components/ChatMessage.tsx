"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Heart, User, Copy, Check, ThumbsUp, ThumbsDown } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ChatMessageProps {
  role: "user" | "coach";
  content: string;
  isComplete?: boolean;
}

interface CodeProps extends React.HTMLAttributes<HTMLElement> {
  inline?: boolean;
}

const CodeBlock = ({ language, value }: { language: string; value: string }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950/80 shadow-2xl font-mono text-sm">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/50 border-b border-zinc-800/50">
        <span className="text-[11px] uppercase tracking-widest font-bold text-zinc-500">
          {language || "code"}
        </span>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-widest group"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-500" />
              <span className="text-emerald-500">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 group-hover:scale-110 transition-transform" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="p-4 overflow-x-auto text-zinc-200 text-[13px] leading-6 selection:bg-purple-500/30 scrollbar-hide">
        <code>{value}</code>
      </div>
    </div>
  );
};

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
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.5, 
        type: "spring", 
        stiffness: 100, 
        damping: 15 
      }}
      className={cn(
        "flex w-full mb-8 gap-4",
        isCoach ? "justify-start" : "justify-end"
      )}
    >
      {isCoach && (
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1 shadow-lg shadow-primary/20">
          <Heart className="w-4 h-4 text-primary-foreground" />
        </div>
      )}
      
      <div
        className={cn(
          "max-w-[85%] md:max-w-[70%] px-5 py-4 rounded-2xl text-sm md:text-base leading-relaxed shadow-sm",
          isCoach 
            ? "bg-muted/30 border border-border/50 text-foreground" 
            : "bg-primary text-primary-foreground border border-primary/20"
        )}
      >
        {isCoach ? (
          <ReactMarkdown
            components={{
              p: ({ children }) => (
                <p className="text-zinc-300 text-[15px] leading-relaxed mb-4 last:mb-0">
                  {children}
                </p>
              ),
              h1: ({ children }) => (
                <h1 className="font-semibold text-zinc-100 mt-6 mb-2 tracking-tight text-xl">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="font-semibold text-zinc-100 mt-6 mb-2 tracking-tight text-lg">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="font-semibold text-zinc-100 mt-6 mb-2 tracking-tight text-base">
                  {children}
                </h3>
              ),
              ul: ({ children }) => (
                <ul className="list-disc list-inside space-y-1.5 mb-4 text-zinc-300 pl-2">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside space-y-1.5 mb-4 text-zinc-300 pl-2">
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li className="inline-block w-full text-[15px] leading-relaxed">
                  {children}
                </li>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-2 border-purple-500/50 bg-purple-950/10 px-4 py-3 my-4 rounded-r text-zinc-400 italic text-[14.5px]">
                  {children}
                </blockquote>
              ),
              code({ inline, className, children, ...props }: CodeProps) {
                const match = /language-(\w+)/.exec(className || "");
                const language = match ? match[1] : "";
                const content = String(children).replace(/\n$/, "");

                if (!inline && match) {
                  return <CodeBlock language={language} value={content} />;
                }

                return (
                  <code
                    className={cn(
                      "bg-zinc-800/80 text-purple-300 px-1.5 py-0.5 rounded text-[13px] font-mono border border-zinc-700/50",
                      className
                    )}
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
            }}
          >
            {content}
          </ReactMarkdown>
        ) : (
          <div className="flex flex-col">
            <span>{content}</span>
            <div className="flex justify-end mt-2 pt-2 border-t border-primary-foreground/10">
              <button
                onClick={copyMessage}
                className="flex items-center gap-1.5 text-primary-foreground/60 hover:text-primary-foreground transition-colors group"
              >
                {copied ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <Copy className="w-3 h-3 group-hover:scale-110 transition-transform" />
                )}
                <span className="text-[9px] font-bold uppercase tracking-widest">
                  {copied ? "Copied" : "Copy"}
                </span>
              </button>
            </div>
          </div>
        )}

        {isCoach && isComplete && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mt-4 pt-4 border-t border-zinc-800/50"
          >
            <button
              onClick={() => setFeedback(feedback === "up" ? null : "up")}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                feedback === "up" ? "text-emerald-500 bg-emerald-500/10" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
              )}
            >
              <ThumbsUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => setFeedback(feedback === "down" ? null : "down")}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                feedback === "down" ? "text-rose-500 bg-rose-500/10" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
              )}
            >
              <ThumbsDown className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-zinc-800 mx-1" />
            <button
              onClick={copyMessage}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors group"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <Copy className="w-4 h-4 group-hover:scale-110 transition-transform" />
              )}
              <span className="text-[11px] font-bold uppercase tracking-widest">
                {copied ? "Copied" : "Copy"}
              </span>
            </button>
          </motion.div>
        )}
      </div>

      {!isCoach && (
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-1 border border-border/50">
          <User className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
    </motion.div>
  );
}
