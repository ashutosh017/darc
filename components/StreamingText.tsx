"use client";

import React, { memo } from "react";
import ReactMarkdown from "react-markdown";

interface StreamingTextProps {
  content: string;
  isComplete?: boolean;
}

export const StreamingText = memo(function StreamingText({ content, isComplete }: StreamingTextProps) {
  if (!isComplete) {
    return (
      <div className="whitespace-pre-wrap animate-[fadeIn_0.15s_ease-out]">
        {content}
      </div>
    );
  }

  return (
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
  );
});
