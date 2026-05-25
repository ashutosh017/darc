"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { 
  Heart, 
  MessageSquarePlus, 
  History, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  User,
  X
} from "lucide-react";
import { motion } from "framer-motion";

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  collapsed?: boolean;
  onClick?: () => void;
}

const SidebarItem = ({ icon: Icon, label, active, collapsed, onClick }: SidebarItemProps) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center w-full gap-3 px-3 py-2 rounded-lg transition-all duration-200 group",
      active 
        ? "bg-primary text-primary-foreground" 
        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
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

      <nav className="flex-1 flex flex-col gap-2">
        <SidebarItem 
          icon={MessageSquarePlus} 
          label="New Session" 
          active={activeTab === "new"}
          collapsed={isCollapsed}
          onClick={() => {
            setActiveTab("new");
            if (isMobile) onClose?.();
          }}
        />
        <SidebarItem 
          icon={History} 
          label="History" 
          active={activeTab === "history"}
          collapsed={isCollapsed}
          onClick={() => {
            setActiveTab("history");
            if (isMobile) onClose?.();
          }}
        />
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
      </nav>

      <div className="mt-auto pt-4 border-t border-border/50">
        <SidebarItem 
          icon={User} 
          label="Profile" 
          collapsed={isCollapsed}
          onClick={() => {
            if (isMobile) onClose?.();
          }}
        />
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
