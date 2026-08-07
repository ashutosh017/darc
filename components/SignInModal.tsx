"use client";

import React from "react";
import { motion } from "framer-motion";
import { signIn } from "@/lib/auth-client";

export function SignInModal() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#0C0A09]/80 backdrop-blur-sm" />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-sm"
      >
        {/* Outer gradient glow */}
        <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-b from-stone-700/50 via-stone-800/20 to-transparent pointer-events-none" />

        <div className="relative bg-[#161412] rounded-3xl p-10 overflow-hidden">
          {/* Subtle ambient light */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-amber-500/8 rounded-full blur-[80px]" />

          <div className="relative flex flex-col items-center text-center">
            {/* Logo */}
            <div className="w-14 h-14 rounded-2xl bg-[#0C0A09] flex items-center justify-center mb-8 border border-stone-800/40">
              <img
                src="/darc_logo.png"
                alt="DARC Logo"
                className="w-9 h-9 object-contain"
              />
            </div>

            {/* Heading */}
            <h2 className="text-2xl font-semibold text-stone-50 mb-2 tracking-tight">
              Sign in to DARC
            </h2>

            <p className="text-stone-500 text-sm mb-10 leading-relaxed max-w-[260px]">
              Your personal relationship coach, always ready to talk.
            </p>

            {/* Google Sign In */}
            <button
              onClick={() =>
                signIn.social({ provider: "google", callbackURL: "/chat" })
              }
              className="flex items-center justify-center gap-3 w-full py-3.5 bg-stone-50 text-[#0C0A09] rounded-full font-medium text-sm hover:bg-white transition-all active:scale-[0.98]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            {/* Footer note */}
            <p className="mt-8 text-stone-600 text-[11px] leading-relaxed">
              Private &amp; confidential. Your data stays yours.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
