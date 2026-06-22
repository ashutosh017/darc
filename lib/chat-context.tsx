"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { getUserChats, getUserDailyLimitStats } from "@/app/actions";
import { useSession } from "@/lib/auth-client";

interface Chat {
    id: string;
    title: string | null;
    createdAt: Date;
}

interface LimitStats {
    chatsUsed: number;
    dailyLimit: number;
}

interface ChatContextType {
    currentChatId: string | null;
    setCurrentChatId: (id: string | null) => void;
    chats: Chat[];
    refreshChats: () => Promise<void>;
    isLoadingChats: boolean;
    limitStats: LimitStats | null;
    refreshLimitStats: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const [chats, setChats] = useState<Chat[]>([]);
    const [isLoadingChats, setIsLoadingChats] = useState(false);
    const [limitStats, setLimitStats] = useState<LimitStats | null>(null);

    const refreshChats = async () => {
        if (!session) {
            setChats([]);
            return;
        }
        setIsLoadingChats(true);
        try {
            const userChats = await getUserChats();
            setChats(userChats);
        } catch (error) {
            console.error("Failed to fetch chats:", error);
        } finally {
            setIsLoadingChats(false);
        }
    };

    const refreshLimitStats = async () => {
        if (!session) {
            setLimitStats(null);
            return;
        }
        try {
            const stats = await getUserDailyLimitStats();
            setLimitStats(stats);
        } catch (error) {
            console.error("Failed to fetch limit stats:", error);
        }
    };

    useEffect(() => {
        refreshChats();
        refreshLimitStats();
    }, [session?.user?.id]);

    return (
        <ChatContext.Provider value={{ 
            currentChatId, 
            setCurrentChatId, 
            chats, 
            refreshChats, 
            isLoadingChats,
            limitStats,
            refreshLimitStats
        }}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChat() {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error("useChat must be used within a ChatProvider");
    }
    return context;
}
