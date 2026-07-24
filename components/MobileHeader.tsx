"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { AnimatePresence, motion } from "framer-motion";

export function MobileHeader() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <header className="md:hidden flex items-center justify-between px-4 h-12 bg-stone-900/30 backdrop-blur-xl border border-white/10 rounded-full fixed top-3 left-4 right-4 z-40 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 text-stone-400 hover:text-stone-50 transition-all duration-200 group rounded-full hover:bg-stone-800/40 flex items-center justify-center"
        >
          <div className="flex flex-col gap-1.5 justify-center items-start w-5 h-4">
            <span className="block h-[2px] w-5 rounded-full bg-current transition-all duration-300 group-hover:translate-x-0.5" />
            <span className="block h-[2px] w-3 rounded-full bg-current transition-all duration-300 group-hover:w-5" />
          </div>
        </button>
        
        <div className="flex items-center gap-2">
          <span className="text-xl font-medium tracking-tight text-stone-50">DARC</span>
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
              className="fixed inset-y-0 left-0 w-[280px] bg-[#1C1917] z-50 md:hidden border-r border-stone-800/30 shadow-2xl"
            >
              <Sidebar isMobile onClose={() => setIsOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
