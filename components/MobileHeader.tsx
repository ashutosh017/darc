"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export function MobileHeader() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <header className="md:hidden flex items-center justify-between px-4 h-16 bg-[#131314] border-b border-[#3c4043]/30 sticky top-0 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 text-[#b4b4b4] hover:text-[#e3e3e3] transition-colors"
        >
          <Menu size={24} />
        </button>
        
        <div className="flex items-center gap-2">
          <span className="text-xl font-medium tracking-tight text-[#e3e3e3]">DARC</span>
        </div>
        
        <div className="w-10" /> {/* Spacer for centering logo */}
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
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
              className="fixed inset-y-0 left-0 w-[280px] bg-[#1e1f20] z-50 md:hidden border-r border-[#3c4043]/30 shadow-2xl"
            >
              <Sidebar isMobile onClose={() => setIsOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
