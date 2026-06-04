"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { User, Copy, Check, ThumbsUp, ThumbsDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useSession } from "@/lib/auth-client";

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
    <div className="my-6 overflow-hidden rounded-2xl border border-[#3c4043]/30 bg-[#1e1f20] shadow-sm font-mono text-[13px] md:text-[14px]">
      <div className="flex items-center justify-between px-5 py-2.5 bg-[#1a1a1c] border-b border-[#3c4043]/30">
        <span className="text-[11px] uppercase tracking-wider font-semibold text-[#b4b4b4]">
          {language || "code"}
        </span>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-2 text-[11px] font-semibold text-[#b4b4b4] hover:text-[#e3e3e3] transition-colors group"
        >
          {copied ? (
            <span className="text-[#8ab4f8] flex items-center gap-1.5">
              <Check size={12} /> Copied
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <Copy size={12} className="group-hover:scale-110 transition-transform" /> Copy
            </span>
          )}
        </button>
      </div>
      <div className="p-5 overflow-x-auto text-[#e3e3e3] leading-[1.6] scrollbar-hide">
        <code className="block">{value}</code>
      </div>
    </div>
  );
};

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
          "text-[16px] leading-[1.65] text-[#e3e3e3]",
          isCoach ? "w-full" : "bg-[#1e1f20] px-6 py-3.5 rounded-[24px] inline-block max-w-full whitespace-pre-wrap shadow-sm"
        )}>
          {isCoach ? (
            <ReactMarkdown
              components={{
                p: ({ children }) => (
                  <p className="mb-5 last:mb-0 text-[#e3e3e3] font-normal">
                    {children}
                  </p>
                ),
                h1: ({ children }) => (
                  <h1 className="text-[24px] font-semibold text-white mt-10 mb-5 tracking-tight">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-[20px] font-semibold text-white mt-9 mb-4 tracking-tight">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-[18px] font-semibold text-white mt-8 mb-3 tracking-tight">
                    {children}
                  </h3>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-outside space-y-2.5 mb-6 ml-6 text-[#e3e3e3]">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-outside space-y-2.5 mb-6 ml-6 text-[#e3e3e3]">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="pl-1">
                    {children}
                  </li>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-white">
                    {children}
                  </strong>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-[3px] border-[#8ab4f8] bg-[#1e1f20]/50 px-6 py-4 my-6 rounded-r-xl text-[#b4b4b4] italic font-medium">
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
                        "bg-[#282a2c] text-[#8ab4f8] px-1.5 py-0.5 rounded-md text-[14px] font-mono border border-[#3c4043]/30",
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
