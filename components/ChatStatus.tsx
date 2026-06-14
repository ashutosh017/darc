"use client";

import React from "react";
import { MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

interface ChatHeroProps {
  onPromptClick: (prompt: string) => void;
}

export function ChatHero({ onPromptClick }: ChatHeroProps) {
  const suggestedPrompts = [
    "How do I deal with an avoidant partner?",
    "What are the green flags in early dating?"
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-3xl mx-auto text-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="flex flex-col items-center"
      >
        <h1 className="text-5xl md:text-6xl font-semibold tracking-tight mb-4">
          <span className="gemini-gradient animate-shimmer bg-[length:400%_100%]">
            Hello, Friend
          </span>
        </h1>
        
        <p className="text-[#b4b4b4] text-xl md:text-2xl mb-12 max-w-2xl font-medium leading-tight">
          How can I help you navigate your relationships today?
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mt-8">
        {suggestedPrompts.map((prompt, index) => (
          <motion.button
            key={prompt}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            onClick={() => onPromptClick(prompt)}
            className="group flex flex-col justify-between p-5 rounded-2xl bg-[#1e1f20] hover:bg-[#282a2c] transition-colors text-left border-none h-32 active:scale-[0.98]"
          >
            <span className="text-base font-medium text-[#e3e3e3] group-hover:text-white leading-snug">
              {prompt}
            </span>
            <div className="self-end p-2 rounded-full bg-[#131314] group-hover:bg-[#1a1a1c] transition-colors">
              <MessageSquare size={18} className="text-[#b4b4b4]" />
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

export function TypingIndicator() {
  const [statusIndex, setStatusIndex] = React.useState(0);
  const statuses = [
    "Analyzing your situation...",
    "Retrieving relationship database insights...",
    "Synthesizing personal guidance...",
    "Formulating response..."
  ];

  React.useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev < statuses.length - 1 ? prev + 1 : prev));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-3.5 mb-8 pl-1"
    >
      <div className="flex items-center gap-3">
        {/* Glowing Spinner */}
        <div className="relative w-4.5 h-4.5 flex items-center justify-center shrink-0">
          <div className="absolute inset-0 rounded-full border-2 border-t-transparent border-[#8ab4f8] animate-spin" />
          <div className="absolute inset-0 rounded-full border-2 border-[#8ab4f8]/15 animate-pulse" />
        </div>

        {/* Status Text */}
        <span className="text-sm font-medium text-[#b4b4b4]/90 tracking-wide select-none">
          {statuses[statusIndex]}
        </span>
      </div>

      {/* Typing dots */}
      <div className="flex items-center gap-1.5 pl-7.5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity, 
              delay: i * 0.2,
              ease: "easeInOut"
            }}
            className="w-1.5 h-1.5 rounded-full bg-[#8ab4f8]/80"
          />
        ))}
      </div>
    </motion.div>
  );
}
