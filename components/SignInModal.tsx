"use client";

import React from "react";
import { motion } from "framer-motion";
import { LogIn, Sparkles } from "lucide-react";
import { signIn } from "@/lib/auth-client";

export function SignInModal() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#131314]/80 backdrop-blur-sm" />
      
      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-md bg-[#1e1f20] border border-[#3c4043]/30 rounded-[32px] p-8 md:p-12 shadow-2xl overflow-hidden"
      >
        {/* Decorative background element */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#8ab4f8]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#d96570]/10 rounded-full blur-3xl" />

        <div className="relative flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#131314] flex items-center justify-center mb-8 border border-[#3c4043]/30 shadow-inner">
            <img 
              src="/darc-ai-logo.png" 
              alt="DARC Logo" 
              className="w-10 h-10 object-contain"
            />
          </div>
          
          <h2 className="text-3xl font-semibold text-[#e3e3e3] mb-4 tracking-tight">
            Unlock DARC
          </h2>
          
          <p className="text-[#b4b4b4] text-lg mb-10 leading-relaxed">
            Sign in to start your personalized relationship coaching journey.
          </p>
          
          <button
            onClick={() => signIn.social({ provider: "google", callbackURL: "/chat" })}
            className="flex items-center justify-center gap-3 w-full py-4 bg-[#e3e3e3] text-[#131314] rounded-full font-semibold hover:bg-white transition-all active:scale-[0.98] shadow-lg group"
          >
            <LogIn size={20} className="transition-transform group-hover:translate-x-1" />
            Continue with Google
          </button>
          
          <div className="mt-8 flex items-center gap-2 text-[#b4b4b4] text-sm">
            <Sparkles size={14} className="text-[#8ab4f8]" />
            <span>AI-powered coaching for modern intimacy</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
