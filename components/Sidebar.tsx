"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { 
  Plus, 
  Menu,
  User,
  X,
  LogOut,
  LogIn,
  MessageSquare,
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
import { deleteChat } from "@/app/actions";

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
        router.push("/");
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
            onClick={() => setIsCollapsed(false)}
            className="p-2 hover:bg-[#282a2c] rounded-full transition-colors text-[#b4b4b4] hover:text-[#e3e3e3]"
          >
            <Menu size={24} />
          </button>
        ) : (
          <>
            <span className="text-xl font-medium tracking-tight ml-2">DARC</span>
            <button 
              onClick={() => (isMobile ? onClose?.() : setIsCollapsed(true))}
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
            router.push("/");
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
        
        {chats.map((chat, index) => (
          <div
            key={chat.id}
            onClick={() => {
              router.push(`/chat/${chat.id}`);
              if (isMobile) onClose?.();
            }}
            title={chat.title || "Untitled Chat"}
            className={cn(
              "flex items-center w-full gap-3 px-3 py-2.5 rounded-full transition-all duration-200 group relative cursor-pointer",
              currentChatId === chat.id 
                ? "bg-[#000000/20] text-[#e3e3e3]" 
                : "text-[#e3e3e3] hover:bg-[#282a2c]"
            )}
          >
            <MessageSquare size={18} className="shrink-0 text-[#b4b4b4] group-hover:text-[#e3e3e3]" />
            {!isCollapsed && (
              <span className="text-sm truncate pr-8">
                {chat.title || "Untitled Chat"}
              </span>
            )}
            {!isCollapsed && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenuChatId(activeMenuChatId === chat.id ? null : chat.id);
                }}
                className="absolute right-3 p-1 rounded-full text-[#b4b4b4] hover:text-[#e3e3e3] hover:bg-[#3c4043]/50 transition-colors z-20 opacity-100"
              >
                <MoreVertical size={14} />
              </button>
            )}

            {/* Dropdown Menu */}
            {!isCollapsed && activeMenuChatId === chat.id && (
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
        ))}

        {isLoadingChats && !isCollapsed && (
          <div className="px-6 py-2 text-xs text-[#b4b4b4] animate-pulse">
            Loading...
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="mt-auto p-3 border-t border-[#3c4043]/30">
        {session ? (
          <div className="flex flex-col gap-1">
            <button
              className={cn(
                "flex items-center gap-3 w-full px-3 py-2.5 rounded-full text-[#e3e3e3] hover:bg-[#282a2c] transition-colors",
                isCollapsed && "justify-center"
              )}
            >
              <Settings size={18} className="text-[#b4b4b4]" />
              {!isCollapsed && <span className="text-sm">Settings</span>}
            </button>
            <div className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-full hover:bg-[#282a2c] cursor-pointer transition-colors mt-1",
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
