"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Menu, Heart, Key } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export function MobileHeader({ onKeyClick }: { onKeyClick?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <header className="md:hidden flex items-center justify-between px-4 py-3 glass-panel border-b border-border/50 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Heart className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tighter">DARC</span>
        </div>
        
        <div className="flex items-center gap-1">
          {onKeyClick && (
            <button
              onClick={onKeyClick}
              className="p-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <Key size={20} />
            </button>
          )}
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Menu size={24} />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 md:hidden"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-[280px] glass-panel z-50 md:hidden border-r border-border/50"
            >
              <Sidebar isMobile onClose={() => setIsOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
