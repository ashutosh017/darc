"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signIn, signOut } from "@/lib/auth-client";
import { useChat } from "@/lib/chat-context";

interface SidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isMobile, onClose }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { data: session, isPending } = useSession();
  const { chats, currentChatId, setCurrentChatId, isLoadingChats } = useChat();

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
      {/* Header & Hamburger */}
      <div className={cn(
        "flex items-center h-16 px-4 shrink-0",
        isCollapsed ? "justify-center" : "justify-between"
      )}>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-[#282a2c] rounded-full transition-colors text-[#b4b4b4] hover:text-[#e3e3e3]"
        >
          <Menu size={24} />
        </button>
        {!isCollapsed && !isMobile && (
          <span className="text-xl font-medium tracking-tight ml-2 flex-1">DARC</span>
        )}
        {isMobile && (
          <button 
            onClick={onClose}
            className="p-2 text-[#b4b4b4] hover:text-[#e3e3e3]"
          >
            <X size={24} />
          </button>
        )}
      </div>

      {/* New Chat Button */}
      <div className={cn(
        "px-4 py-2 mb-4",
        isCollapsed ? "flex justify-center" : ""
      )}>
        <button
          onClick={() => {
            setCurrentChatId(null);
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
        
        {chats.map((chat) => (
          <button
            key={chat.id}
            onClick={() => {
              setCurrentChatId(chat.id);
              if (isMobile) onClose?.();
            }}
            className={cn(
              "flex items-center w-full gap-3 px-3 py-2.5 rounded-full transition-all duration-200 group relative",
              currentChatId === chat.id 
                ? "bg-[#000000/20] text-[#e3e3e3]" 
                : "text-[#e3e3e3] hover:bg-[#282a2c]"
            )}
          >
            <MessageSquare size={18} className="shrink-0 text-[#b4b4b4] group-hover:text-[#e3e3e3]" />
            {!isCollapsed && (
              <span className="text-sm truncate pr-6">
                {chat.title || "Untitled Chat"}
              </span>
            )}
            {!isCollapsed && currentChatId === chat.id && (
              <MoreVertical size={14} className="absolute right-3 text-[#b4b4b4]" />
            )}
          </button>
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
