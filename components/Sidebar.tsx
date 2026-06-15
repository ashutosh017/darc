"use client";

import React, { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { 
  Plus, 
  Menu,
  User,
  X,
  LogOut,
  LogIn,
  Settings,
  MoreVertical,
  Share2,
  Pencil,
  Trash2,
} from "lucide-react";
import { motion } from "framer-motion";
import { useSession, signIn, signOut } from "@/lib/auth-client";
import { useChat } from "@/lib/chat-context";
import { useRouter } from "next/navigation";
import { deleteChat, getUserDailyLimitStats } from "@/app/actions";

interface SidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isMobile, onClose }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeMenuChatId, setActiveMenuChatId] = useState<string | null>(null);
  const { data: session, isPending } = useSession();
  const { chats, currentChatId, refreshChats, isLoadingChats } = useChat();
  const router = useRouter();

  const [limitStats, setLimitStats] = useState<{ chatsUsed: number; dailyLimit: number } | null>(null);

  const fetchLimitStats = useCallback(async () => {
    if (session) {
      try {
        const stats = await getUserDailyLimitStats();
        setLimitStats(stats);
      } catch (err) {
        console.error("Failed to fetch limit stats:", err);
      }
    } else {
      setLimitStats(null);
    }
  }, [session]);

  useEffect(() => {
    fetchLimitStats();
  }, [fetchLimitStats, chats]);

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
        if (typeof window !== "undefined" && window.location.pathname !== "/") {
          window.location.href = "/";
        } else {
          router.push("/");
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
        callbackURL: "/",
      });
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full text-[#e3e3e3]">
      {/* Header & Hamburger/Close */}
      <div className={cn(
        "flex items-center h-16 px-4 shrink-0",
        isCollapsed ? "justify-center" : "justify-between"
      )}>
        {isCollapsed ? (
          <button 
            onClick={() => handleToggleCollapse(false)}
            className="p-2 hover:bg-[#282a2c] rounded-full transition-colors text-[#b4b4b4] hover:text-[#e3e3e3]"
          >
            <Menu size={24} />
          </button>
        ) : (
          <>
            <div className="flex items-center gap-2.5 ml-2 select-none">
              <img 
                src="/darc-ai-logo.png" 
                alt="DARC Logo" 
                className="w-6 h-6 object-contain"
              />
              <span className="text-xl font-medium tracking-tight">DARC</span>
            </div>
            <button 
              onClick={() => (isMobile ? onClose?.() : handleToggleCollapse(true))}
              className="p-2 text-[#b4b4b4] hover:text-[#e3e3e3] hover:bg-[#282a2c] rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </>
        )}
      </div>

      {/* New Chat Button */}
      <div className={cn(
        "px-4 py-2 mb-4",
        isCollapsed ? "flex justify-center" : ""
      )}>
        <button
          onClick={() => {
            if (typeof window !== "undefined" && window.location.pathname !== "/") {
              window.location.href = "/";
            } else {
              router.push("/");
            }
            if (isMobile) onClose?.();
          }}
          className={cn(
            "flex items-center gap-3 h-10 transition-all duration-200 shadow-sm",
            isCollapsed 
              ? "w-10 justify-center rounded-full bg-[#1a1a1c] hover:bg-[#282a2c]" 
              : "px-4 rounded-full bg-[#1a1a1c] hover:bg-[#282a2c] min-w-[120px]"
          )}
        >
          <Plus size={20} className="text-[#e3e3e3]" />
          {!isCollapsed && <span className="text-sm font-medium">New Chat</span>}
        </button>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-3 space-y-1">
        {!isCollapsed && (
          <div className="px-3 py-2">
            <span className="text-xs font-medium text-[#b4b4b4]">Recent</span>
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
                  ? "bg-[#000000/20] text-[#e3e3e3]" 
                  : "text-[#e3e3e3] hover:bg-[#282a2c]"
              )}
            >
              <span className="text-sm truncate pr-8">
                {chat.title || "Untitled Chat"}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenuChatId(activeMenuChatId === chat.id ? null : chat.id);
                }}
                className={cn(
                  "absolute right-3 p-1 rounded-full text-[#b4b4b4] hover:text-[#e3e3e3] hover:bg-[#3c4043]/50 transition-all z-20",
                  activeMenuChatId === chat.id
                    ? "opacity-100"
                    : "opacity-100 md:opacity-0 md:group-hover:opacity-100"
                )}
              >
                <MoreVertical size={14} />
              </button>

              {/* Dropdown Menu */}
              {activeMenuChatId === chat.id && (
                <div className={cn(
                  "absolute right-3 z-50 bg-[#282a2c] border border-[#3c4043]/30 rounded-xl shadow-lg py-1.5 min-w-[120px]",
                  index < 3 ? "top-full mt-1" : "bottom-full mb-1"
                )}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuChatId(null);
                    }}
                    className="flex items-center w-full gap-2 px-3 py-2 text-xs text-left text-[#e3e3e3] hover:bg-[#3c4043]/50 transition-colors"
                  >
                    <Share2 size={14} className="text-[#b4b4b4]" />
                    <span>Share</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuChatId(null);
                    }}
                    className="flex items-center w-full gap-2 px-3 py-2 text-xs text-left text-[#e3e3e3] hover:bg-[#3c4043]/50 transition-colors"
                  >
                    <Pencil size={14} className="text-[#b4b4b4]" />
                    <span>Rename</span>
                  </button>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      await handleDeleteChat(chat.id);
                      setActiveMenuChatId(null);
                    }}
                    className="flex items-center w-full gap-2 px-3 py-2 text-xs text-left text-[#f28b82] hover:bg-[#f28b82]/10 transition-colors"
                  >
                    <Trash2 size={14} className="text-[#f28b82]" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {isLoadingChats && !isCollapsed && (
          <div className="px-6 py-2 text-xs text-[#b4b4b4] animate-pulse">
            Loading...
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="mt-auto p-3 border-t border-[#3c4043]/30 flex flex-col gap-2 shrink-0">
        {/* Daily Limit Stats */}
        {limitStats && (
          isCollapsed ? (
            <div 
              className="flex justify-center py-2 cursor-default select-none shrink-0" 
              title={`Daily Limit: ${limitStats.chatsUsed}/${limitStats.dailyLimit} chats used`}
            >
              <div className="relative w-10 h-10 flex items-center justify-center">
                <svg className="w-10 h-10">
                  <defs>
                    <linearGradient id="limitRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#4285f4" />
                      <stop offset="100%" stopColor="#9b72cb" />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    className="stroke-[#3c4043]/30"
                    strokeWidth="2.5"
                    fill="transparent"
                  />
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    stroke="url(#limitRingGradient)"
                    strokeWidth="2.5"
                    fill="transparent"
                    strokeDasharray={100.5}
                    strokeDashoffset={100.5 - (100.5 * Math.min(limitStats.chatsUsed, limitStats.dailyLimit)) / limitStats.dailyLimit}
                    strokeLinecap="round"
                    className="transform -rotate-90 origin-center"
                    style={{ transition: "stroke-dashoffset 0.3s ease" }}
                  />
                </svg>
                <span className="absolute text-[10px] font-bold text-[#e3e3e3]">
                  {limitStats.chatsUsed}
                </span>
              </div>
            </div>
          ) : (
            <div className="px-4 py-3 bg-[#1a1a1c] border border-[#3c4043]/20 rounded-2xl flex flex-col gap-2 select-none">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 font-medium">Daily Limit</span>
                <span className="text-[#8ab4f8] font-bold">
                  {limitStats.chatsUsed}/{limitStats.dailyLimit}
                </span>
              </div>
              <div className="w-full bg-[#3c4043]/30 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-[#4285f4] to-[#9b72cb] h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (limitStats.chatsUsed / limitStats.dailyLimit) * 100)}%` }}
                />
              </div>
            </div>
          )
        )}

        {session ? (
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                router.push("/settings");
                if (isMobile) onClose?.();
              }}
              className={cn(
                "flex items-center gap-3 w-full px-3 py-2.5 rounded-full text-[#e3e3e3] hover:bg-[#282a2c] transition-colors",
                isCollapsed && "justify-center"
              )}
            >
              <Settings size={18} className="text-[#b4b4b4]" />
              {!isCollapsed && <span className="text-sm">Settings</span>}
            </button>
            <div className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-full hover:bg-[#282a2c] cursor-pointer transition-colors",
              isCollapsed && "justify-center"
            )}>
              {session.user.image ? (
                <img 
                  src={session.user.image} 
                  alt={session.user.name} 
                  className="w-6 h-6 rounded-full"
                />
              ) : (
                <User size={18} className="text-[#b4b4b4]" />
              )}
              {!isCollapsed && (
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-medium truncate">{session.user.name}</span>
                </div>
              )}
              {!isCollapsed && (
                <button onClick={handleAuth} title="Sign Out">
                  <LogOut size={16} className="text-[#b4b4b4] hover:text-[#f28b82]" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <button 
            onClick={handleAuth}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-2.5 rounded-full text-[#e3e3e3] hover:bg-[#282a2c] transition-colors",
              isCollapsed && "justify-center"
            )}
          >
            <LogIn size={18} className="text-[#b4b4b4]" />
            {!isCollapsed && <span className="text-sm font-medium">{isPending ? "Loading..." : "Sign In"}</span>}
          </button>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="flex flex-col h-full bg-[#1e1f20]">
        {sidebarContent}
      </div>
    );
  }

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? "68px" : "280px" }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="h-screen bg-[#1e1f20] hidden md:flex flex-col transition-all relative z-30 overflow-hidden"
    >
      {sidebarContent}
    </motion.aside>
  );
}
