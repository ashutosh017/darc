"use client";

import React, { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Plus,
  User,
  X,
  LogOut,
  LogIn,
  SlidersHorizontal,
  MoreVertical,
  Share2,
  Pencil,
  Trash2,
} from "lucide-react";
import { motion } from "framer-motion";
import { useSession, signIn, signOut } from "@/lib/auth-client";
import { useChat } from "@/lib/chat-context";
import { useRouter } from "next/navigation";
import { deleteChat } from "@/app/actions";

interface SidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isMobile, onClose }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeMenuChatId, setActiveMenuChatId] = useState<string | null>(null);
  const { data: session, isPending } = useSession();
  const { chats, currentChatId, refreshChats, isLoadingChats, limitStats } =
    useChat();
  const router = useRouter();

  // Load state on mount
  useEffect(() => {
    if (isMobile) {
      setIsCollapsed(false);
      return;
    }
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null) {
      setIsCollapsed(JSON.parse(saved));
    }
  }, [isMobile]);

  const handleToggleCollapse = (collapsed: boolean) => {
    if (isMobile) return;
    setIsCollapsed(collapsed);
    localStorage.setItem("sidebar-collapsed", JSON.stringify(collapsed));
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveMenuChatId(null);
    };
    if (activeMenuChatId) {
      document.addEventListener("click", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, [activeMenuChatId]);

  const handleDeleteChat = async (chatId: string) => {
    try {
      await deleteChat(chatId);
      await refreshChats();
      if (currentChatId === chatId) {
        if (
          typeof window !== "undefined" &&
          window.location.pathname !== "/chat"
        ) {
          window.location.href = "/chat";
        } else {
          router.push("/chat");
        }
      }
    } catch (error) {
      console.error("Failed to delete chat:", error);
    }
  };

  const handleAuth = async () => {
    if (session) {
      await signOut();
    } else {
      await signIn.social({
        provider: "google",
        callbackURL: "/chat",
      });
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full text-stone-50">
      {/* Header & Hamburger/Close */}
      <div
        className={cn(
          "flex items-center h-16 px-4 shrink-0",
          isCollapsed ? "justify-center" : "justify-between",
        )}
      >
        {isCollapsed ? (
          <button
            onClick={() => handleToggleCollapse(false)}
            className="p-2 text-stone-400 hover:text-stone-50 transition-all duration-200 group rounded-full hover:bg-stone-800/40 flex items-center justify-center"
          >
            <div className="flex flex-col gap-1.5 justify-center items-start w-5 h-4">
              <span className="block h-[2px] w-5 rounded-full bg-current transition-all duration-300 group-hover:translate-x-0.5" />
              <span className="block h-[2px] w-3 rounded-full bg-current transition-all duration-300 group-hover:w-5" />
            </div>
          </button>
        ) : (
          <>
            <div className="flex items-center gap-2 ml-2 select-none">
              <img
                src="/darc_logo.png"
                alt="DARC Logo"
                className="w-6 h-6 object-contain rounded-lg"
              />
              <span className="text-xl font-bold tracking-tight">DARC</span>
            </div>
            <button
              onClick={() =>
                isMobile ? onClose?.() : handleToggleCollapse(true)
              }
              className="p-2 text-stone-400 hover:text-stone-50 hover:bg-stone-800 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </>
        )}
      </div>

      {/* New Chat Button */}
      <div
        className={cn(
          "px-4 py-2 mb-4",
          isCollapsed ? "flex justify-center" : "",
        )}
      >
        <button
          onClick={() => {
            if (
              typeof window !== "undefined" &&
              window.location.pathname !== "/chat"
            ) {
              window.location.href = "/chat";
            } else {
              router.push("/chat");
            }
            if (isMobile) onClose?.();
          }}
          className={cn(
            "flex items-center gap-3 h-10 transition-all duration-200 shadow-sm",
            isCollapsed
              ? "w-10 justify-center rounded-full bg-stone-900 hover:bg-stone-800"
              : "px-4 rounded-full bg-stone-900 hover:bg-stone-800 min-w-[120px]",
          )}
        >
          <Plus size={20} className="text-stone-50" />
          {!isCollapsed && (
            <span className="text-sm font-medium">New Chat</span>
          )}
        </button>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-3 space-y-1">
        {!isCollapsed && (
          <div className="px-3 py-2">
            <span className="text-xs font-medium text-stone-400">Recent</span>
          </div>
        )}

        {chats.map((chat, index) => {
          if (isCollapsed) return null;
          return (
            <div
              key={chat.id}
              onClick={() => {
                router.push(`/chat/${chat.id}`);
                if (isMobile) onClose?.();
              }}
              title={chat.title || "Untitled Chat"}
              className={cn(
                "flex items-center w-full px-3 py-2.5 rounded-full transition-all duration-200 group relative cursor-pointer",
                currentChatId === chat.id
                  ? "bg-stone-800 text-stone-50"
                  : "text-stone-50 hover:bg-stone-800",
              )}
            >
              <span className="text-sm truncate pr-8">
                {chat.title || "Untitled Chat"}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenuChatId(
                    activeMenuChatId === chat.id ? null : chat.id,
                  );
                }}
                className={cn(
                  "absolute right-3 p-1 rounded-full text-stone-400 hover:text-stone-50 hover:bg-stone-800/50 transition-all z-20",
                  activeMenuChatId === chat.id
                    ? "opacity-100"
                    : "opacity-100 md:opacity-0 md:group-hover:opacity-100",
                )}
              >
                <MoreVertical size={14} />
              </button>

              {/* Dropdown Menu */}
              {activeMenuChatId === chat.id && (
                <div
                  className={cn(
                    "absolute right-3 z-50 bg-stone-800 border border-stone-800/30 rounded-xl shadow-lg py-1.5 min-w-[120px]",
                    index < 3 ? "top-full mt-1" : "bottom-full mb-1",
                  )}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuChatId(null);
                    }}
                    className="flex items-center w-full gap-2 px-3 py-2 text-xs text-left text-stone-50 hover:bg-stone-800/50 transition-colors"
                  >
                    <Share2 size={14} className="text-stone-400" />
                    <span>Share</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuChatId(null);
                    }}
                    className="flex items-center w-full gap-2 px-3 py-2 text-xs text-left text-stone-50 hover:bg-stone-800/50 transition-colors"
                  >
                    <Pencil size={14} className="text-stone-400" />
                    <span>Rename</span>
                  </button>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      await handleDeleteChat(chat.id);
                      setActiveMenuChatId(null);
                    }}
                    className="flex items-center w-full gap-2 px-3 py-2 text-xs text-left text-rose-500 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 size={14} className="text-rose-500" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {isLoadingChats && !isCollapsed && (
          <div className="px-6 py-2 text-xs text-stone-400 animate-pulse">
            Loading...
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="mt-auto p-3 border-t border-stone-800/30 flex flex-col gap-2 shrink-0">
        {/* Daily Limit Stats */}
        {limitStats &&
          (isCollapsed ? (() => {
            const remaining = Math.max(0, limitStats.dailyLimit - limitStats.chatsUsed);
            const pct = remaining / limitStats.dailyLimit;
            const circumference = 2 * Math.PI * 16; // r=16
            return (
              <div
                className="flex justify-center py-2 cursor-default select-none shrink-0"
                title={`${remaining} of ${limitStats.dailyLimit} prompts remaining`}
              >
                <div className="relative w-10 h-10 flex items-center justify-center">
                  <svg className="w-10 h-10" viewBox="0 0 40 40">
                    <defs>
                      <linearGradient
                        id="limitRingGradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#f43f5e" />
                      </linearGradient>
                    </defs>
                    {/* Background track */}
                    <circle
                      cx="20"
                      cy="20"
                      r="16"
                      className="stroke-stone-800/40"
                      strokeWidth="2.5"
                      fill="transparent"
                    />
                    {/* Remaining ring — depletes as prompts are used */}
                    <circle
                      cx="20"
                      cy="20"
                      r="16"
                      stroke={remaining === 0 ? "#44403c" : "url(#limitRingGradient)"}
                      strokeWidth="2.5"
                      fill="transparent"
                      strokeDasharray={circumference}
                      strokeDashoffset={circumference - circumference * pct}
                      strokeLinecap="round"
                      className="transform -rotate-90 origin-center"
                      style={{ transition: "stroke-dashoffset 0.3s ease" }}
                    />
                  </svg>
                  <span className={`absolute text-[11px] font-bold ${remaining === 0 ? "text-stone-500" : "text-stone-50"}`}>
                    {remaining}
                  </span>
                </div>
              </div>
            );
          })() : (
            <div className="px-4 py-3 bg-stone-900 border border-stone-800/20 rounded-2xl flex flex-col gap-2 select-none">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-400 font-medium">Remaining</span>
                <span className="text-amber-500 font-bold">
                  {Math.max(0, limitStats.dailyLimit - limitStats.chatsUsed)}/{limitStats.dailyLimit}
                </span>
              </div>
              <div className="w-full bg-stone-800/30 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-rose-500 h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, ((limitStats.dailyLimit - limitStats.chatsUsed) / limitStats.dailyLimit) * 100)}%`,
                  }}
                />
              </div>
            </div>
          ))}

        {session ? (
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                router.push("/settings");
                if (isMobile) onClose?.();
              }}
              className={cn(
                "flex items-center gap-3 w-full px-3 py-2.5 rounded-full text-stone-50 hover:bg-stone-800 transition-colors",
                isCollapsed && "justify-center",
              )}
            >
              <SlidersHorizontal size={18} className="text-stone-400" />
              {!isCollapsed && <span className="text-sm">Settings</span>}
            </button>
            <div
              onClick={() => {
                router.push("/profile");
                if (isMobile) onClose?.();
              }}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-full hover:bg-stone-800 cursor-pointer transition-colors",
                isCollapsed && "justify-center",
              )}
            >
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name}
                  className="w-6 h-6 rounded-full"
                />
              ) : (
                <User size={18} className="text-stone-400" />
              )}
              {!isCollapsed && (
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-medium truncate">
                    {session.user.name}
                  </span>
                </div>
              )}
              {!isCollapsed && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAuth();
                  }}
                  title="Sign Out"
                >
                  <LogOut
                    size={16}
                    className="text-stone-400 hover:text-rose-500"
                  />
                </button>
              )}
            </div>
          </div>
        ) : (
          <button
            onClick={handleAuth}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-2.5 rounded-full text-stone-50 hover:bg-stone-800 transition-colors",
              isCollapsed && "justify-center",
            )}
          >
            <LogIn size={18} className="text-stone-400" />
            {!isCollapsed && (
              <span className="text-sm font-medium">
                {isPending ? "Loading..." : "Sign In"}
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="flex flex-col h-full bg-[#1C1917]/30 backdrop-blur-xl">
        {sidebarContent}
      </div>
    );
  }

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? "68px" : "280px" }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className={cn(
        "h-[100dvh] hidden md:flex flex-col transition-all z-30 overflow-hidden",
        isCollapsed
          ? "absolute left-0 top-0 bottom-0 bg-transparent backdrop-blur-none"
          : "relative bg-[#1C1917]/30 backdrop-blur-xl",
      )}
    >
      {sidebarContent}
    </motion.aside>
  );
}
