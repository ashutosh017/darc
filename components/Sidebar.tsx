"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { 
  Heart, 
  MessageSquarePlus, 
  ChevronLeft, 
  ChevronRight,
  User,
  X,
  LogOut,
  LogIn,
  MessageSquare,
  Settings
} from "lucide-react";
import { motion } from "framer-motion";
import { useSession, signIn, signOut } from "@/lib/auth-client";
import { useChat } from "@/lib/chat-context";

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  collapsed?: boolean;
  onClick?: () => void;
  className?: string;
}

const SidebarItem = ({ icon: Icon, label, active, collapsed, onClick, className }: SidebarItemProps) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center w-full gap-3 px-3 py-2 rounded-lg transition-all duration-200 group",
      active 
        ? "bg-primary text-primary-foreground" 
        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      className
    )}
  >
    <Icon className="w-5 h-5 shrink-0" />
    {!collapsed && (
      <span className="text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis">
        {label}
      </span>
    )}
  </button>
);

interface SidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isMobile, onClose }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("new");
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
    <>
      <div className={cn(
        "flex items-center mb-8",
        isCollapsed ? "justify-center mt-4" : "gap-3 px-2 justify-between"
      )}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Heart className="w-5 h-5 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <span className="text-xl font-bold tracking-tighter">DARC</span>
          )}
        </div>
        
        {isMobile && (
          <button 
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="flex-1 flex flex-col gap-2 overflow-y-auto scrollbar-hide">
        <SidebarItem 
          icon={MessageSquarePlus} 
          label="New Session" 
          active={!currentChatId && activeTab === "new"}
          collapsed={isCollapsed}
          onClick={() => {
            setCurrentChatId(null);
            setActiveTab("new");
            if (isMobile) onClose?.();
          }}
        />
        
        {!isCollapsed && chats.length > 0 && (
          <div className="mt-4 mb-2 px-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
              Recent Chats
            </span>
          </div>
        )}

        <div className="flex flex-col gap-1">
          {chats.map((chat) => (
            <SidebarItem
              key={chat.id}
              icon={MessageSquare}
              label={chat.title || "Untitled Chat"}
              active={currentChatId === chat.id}
              collapsed={isCollapsed}
              onClick={() => {
                setCurrentChatId(chat.id);
                setActiveTab("history");
                if (isMobile) onClose?.();
              }}
            />
          ))}
          {isLoadingChats && !isCollapsed && (
            <div className="px-3 py-2 text-xs text-muted-foreground animate-pulse">
              Loading history...
            </div>
          )}
        </div>

        <div className="mt-4">
          <SidebarItem 
            icon={Settings} 
            label="Coach Settings" 
            active={activeTab === "settings"}
            collapsed={isCollapsed}
            onClick={() => {
              setActiveTab("settings");
              if (isMobile) onClose?.();
            }}
          />
        </div>
      </nav>

      <div className="mt-auto pt-4 border-t border-border/50 flex flex-col gap-2">
        {session ? (
          <>
            <div className={cn(
              "flex items-center gap-3 px-3 py-2",
              isCollapsed && "justify-center"
            )}>
              {session.user.image ? (
                <img 
                  src={session.user.image} 
                  alt={session.user.name} 
                  className="w-6 h-6 rounded-full"
                />
              ) : (
                <User className="w-5 h-5 text-muted-foreground" />
              )}
              {!isCollapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium truncate">{session.user.name}</span>
                  <span className="text-xs text-muted-foreground truncate">{session.user.email}</span>
                </div>
              )}
            </div>
            <SidebarItem 
              icon={LogOut} 
              label="Sign Out" 
              collapsed={isCollapsed}
              onClick={handleAuth}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            />
          </>
        ) : (
          <SidebarItem 
            icon={LogIn} 
            label={isPending ? "Loading..." : "Sign In"} 
            collapsed={isCollapsed}
            onClick={handleAuth}
          />
        )}
      </div>

      {!isMobile && (
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full glass-panel flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors border border-border"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      )}
    </>
  );

  if (isMobile) {
    return (
      <div className="flex flex-col h-full p-4">
        {sidebarContent}
      </div>
    );
  }

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? "80px" : "260px" }}
      className={cn(
        "h-screen glass-panel hidden md:flex flex-col transition-all duration-300 ease-in-out relative z-30",
        isCollapsed ? "items-center" : "p-4"
      )}
    >
      {sidebarContent}
    </motion.aside>
  );
}
