"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Key, ExternalLink, ShieldCheck, X, Eye, EyeOff } from "lucide-react";

interface ApiKeyModalProps {
  isOpen: boolean;
  onSave: (key: string) => void;
  onClose?: () => void;
  initialValue?: string;
}

export function ApiKeyModal({ isOpen, onSave, onClose, initialValue = "" }: ApiKeyModalProps) {
  const [key, setKey] = useState(initialValue);
  const [showKey, setShowKey] = useState(false);

  // Synchronize internal state with prop changes when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setKey(initialValue);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialValue]);

  const handleSave = () => {
    if (key.trim()) {
      onSave(key.trim());
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md glass-panel rounded-3xl p-8 shadow-2xl border border-white/10"
          >
            {/* Close Button - Only visible if we have a key or onClose is explicitly allowed */}
            {onClose && initialValue && (
              <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 text-zinc-500 hover:text-zinc-300 hover:bg-white/5 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            )}

            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
                <Key className="w-8 h-8 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight mb-2">Connect your Gemini API Key</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                DARC now operates on a Bring Your Own Key model. Your key is stored locally in your browser and never sent to our servers.
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 block pl-1">
                  Gemini API Key
                </label>
                <div className="relative group">
                  <input
                    type={showKey ? "text" : "password"}
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="paste your key here..."
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 px-4 pr-12 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-zinc-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  <div className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 group-focus-within:opacity-100 pointer-events-none transition-opacity" />
                </div>
              </div>

              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors group"
              >
                Get your free Gemini API Key from Google AI Studio
                <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>

              <button
                onClick={handleSave}
                disabled={!key.trim()}
                className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
              >
                Save Key & Start Coaching
              </button>
              
              <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                Secured Local Storage
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
