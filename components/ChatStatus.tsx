"use client";

import React from "react";
import { motion } from "framer-motion";
import { useSession } from "@/lib/auth-client";

export function ChatHero() {
  const { data: session } = useSession();
  
  const firstName = session?.user?.name
    ? session.user.name.trim().split(/\s+/)[0]
    : "Friend";

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-3xl mx-auto text-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="flex flex-col items-center"
      >
        <h1 className="text-5xl md:text-6xl font-semibold tracking-tight mb-4 text-white">
          Hello, {firstName}
        </h1>
        
        <p className="text-[#b4b4b4] text-xl md:text-2xl max-w-2xl font-medium leading-tight">
          How can I help you navigate your relationships today?
        </p>
      </motion.div>
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
