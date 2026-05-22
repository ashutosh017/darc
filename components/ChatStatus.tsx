"use client";

import React from "react";
import { Heart, Sparkles, MessageCircle } from "lucide-react";
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
    <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto text-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center mb-8 shadow-2xl shadow-primary/30 relative"
      >
        <Heart className="w-10 h-10 text-primary-foreground" />
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute -top-2 -right-2 bg-accent p-1.5 rounded-lg border border-border shadow-lg"
        >
          <Sparkles className="w-4 h-4 text-accent-foreground" />
        </motion.div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-4xl md:text-5xl font-bold tracking-tighter mb-4 bg-gradient-to-b from-foreground to-muted-foreground bg-clip-text text-transparent"
      >
        Meet DARC.
      </motion.h1>
      
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-muted-foreground text-lg mb-12 max-w-md font-medium leading-relaxed"
      >
        Your specialized Dating and Relationship Coach. Ready to help you navigate modern intimacy.
      </motion.p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        {suggestedPrompts.map((prompt, index) => (
          <motion.button
            key={prompt}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            onClick={() => onPromptClick(prompt)}
            className="group flex items-center gap-3 p-4 rounded-2xl glass-panel text-left hover:bg-accent/50 hover:border-accent transition-all duration-300 active:scale-[0.98]"
          >
            <div className="p-2 rounded-xl bg-muted group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <MessageCircle className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground">
              {prompt}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 mb-8"
    >
      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
        <Heart className="w-4 h-4 text-primary-foreground" />
      </div>
      <div className="bg-muted/30 border border-border/50 px-5 py-3 rounded-2xl flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ y: [0, -4, 0] }}
            transition={{ 
              duration: 0.6, 
              repeat: Infinity, 
              delay: i * 0.15,
              ease: "easeInOut"
            }}
            className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40"
          />
        ))}
        <span className="ml-2 text-xs font-medium text-muted-foreground/60">DARC is thinking...</span>
      </div>
    </motion.div>
  );
}
