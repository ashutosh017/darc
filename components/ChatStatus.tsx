"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "@/lib/auth-client";

export function ChatHero() {
  const { data: session } = useSession();
  
  const firstName = session?.user?.name
    ? session.user.name.trim().split(/\s+/)[0]
    : "Friend";

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-3xl mx-auto text-center px-4 relative">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="flex flex-col items-center relative z-10"
      >
        <h1 className="text-5xl md:text-6xl font-semibold tracking-tight mb-4 text-stone-50">
          Hello, {firstName}
        </h1>
        
        <p className="text-stone-400 text-xl md:text-2xl max-w-2xl font-medium leading-tight">
          How can I help you navigate your relationships today?
        </p>
      </motion.div>
    </div>
  );
}

export function TypingIndicator({ status }: { status?: string }) {
  const [statusIndex, setStatusIndex] = React.useState(0);
  const humanStatuses = React.useMemo(
    () => [
      "Hmm, let me think about this...",
      "Looking through my notes...",
      "Alright, here's what I think...",
    ],
    []
  );

  const currentStatus = status || humanStatuses[statusIndex];

  React.useEffect(() => {
    if (status) return;
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev < humanStatuses.length - 1 ? prev + 1 : prev));
    }, 2500);
    return () => clearInterval(interval);
  }, [status, humanStatuses.length]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex items-center gap-3 mb-8 pl-1"
    >
      {/* Animated Bars — minimal equalizer / waveform */}
      <div className="flex items-center gap-[3px] h-4">
        {[0, 1, 2, 3].map((i) => (
          <motion.span
            key={i}
            className="w-[2.5px] rounded-full bg-amber-500/70"
            animate={{
              height: ["4px", "16px", "8px", "14px", "4px"],
              opacity: [0.5, 1, 0.7, 1, 0.5],
            }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Status Label — clean crossfade */}
      <div className="relative h-5 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.span
            key={currentStatus}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="block text-[13px] font-medium text-stone-500 tracking-wide select-none"
          >
            {currentStatus}
          </motion.span>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
