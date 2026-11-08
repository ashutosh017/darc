"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useRef, useEffect, useCallback, startTransition } from "react";
import { ChatInput } from "@/components/ChatInput";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatHero, TypingIndicator } from "@/components/ChatStatus";
import { MobileHeader } from "@/components/MobileHeader";
import { SignInModal } from "@/components/SignInModal";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import {
  saveMessage,
  getChatMessages,
  createChat,
  checkProfilePrompted,
  getUserDailyLimitStats,
  deleteMessage,
} from "@/app/actions";
import { useChat } from "@/lib/chat-context";
import { useRouter, useSearchParams } from "next/navigation";
import { ProfilePromptModal } from "@/components/ProfilePromptModal";
import type { StreamEvent } from "@/app/api/chat/v2/graph";

interface Message {
  id: string;
  role: "USER" | "DARC";
  text: string;
  isComplete?: boolean;
}

/**
 * Safely parses raw/nested error strings (such as Google GenAI JSON errors)
 * into friendly, readable coaching messages.
 */
function formatChatErrorMessage(rawError: unknown): string {
  if (!rawError) return "Connection interrupted. Please try rephrasing your relationship query.";

  let str =
    typeof rawError === "string"
      ? rawError
      : rawError instanceof Error
      ? rawError.message
      : JSON.stringify(rawError);

  // Unpack iteratively in case of nested JSON stringification
  for (let i = 0; i < 3; i++) {
    const trimmed = str.trim();
    if (
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]"))
    ) {
      try {
        const parsed = JSON.parse(trimmed);
        if (typeof parsed === "string") {
          str = parsed;
        } else if (parsed && typeof parsed === "object") {
          if (parsed.message && typeof parsed.message === "string") {
            str = parsed.message;
          } else if (parsed.error) {
            if (typeof parsed.error === "string") {
              str = parsed.error;
            } else if (typeof parsed.error === "object" && parsed.error.message) {
              str = parsed.error.message;
            } else {
              break;
            }
          } else {
            break;
          }
        } else {
          break;
        }
      } catch {
        break;
      }
    } else {
      break;
    }
  }

  const lower = str.toLowerCase();
  if (
    lower.includes("internal error encountered") ||
    lower.includes('"code": 500') ||
    lower.includes("status: internal") ||
    lower === "internal"
  ) {
    return "DaRC is having a momentary hiccup connecting to the coaching service. Please try sending your message again in a moment.";
  }
  if (
    lower.includes("failed to fetch") ||
    lower.includes("network error") ||
    lower.includes("fetch failed")
  ) {
    return "Unable to connect. Please check your internet connection and try again.";
  }
  if (
    lower.includes("daily limit") ||
    lower.includes("limit reached")
  ) {
    return str;
  }
  if (
    lower.includes("rate limit") ||
    lower.includes("quota exceeded") ||
    lower.includes("resource has been exhausted") ||
    lower.includes("429")
  ) {
    return "The coaching service is experiencing high traffic right now. Please wait a moment and try again.";
  }

  return str;
}

export function ChatInterface({ chatId }: { chatId: string | null }) {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = useSession();
  const { setCurrentChatId, refreshChats, refreshLimitStats, limitStats } =
    useChat();

  // Track the current chat ID locally to support seamless transitions
  const [localChatId, setLocalChatId] = useState<string | null>(
    chatId === "undefined" || chatId === "null" ? null : chatId
  );

  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingStatus, setTypingStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(
    chatId !== null && chatId !== "undefined" && chatId !== "null"
  );
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check if user should be prompted for profile details
  useEffect(() => {
    if (session) {
      checkProfilePrompted().then((res) => {
        if (!res.prompted) {
          setShowOnboarding(true);
        }
      });
    }
  }, [session?.user?.id]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const skipNextFetchRef = useRef(false);
  const searchParams = useSearchParams();
  // Sync localChatId when the chatId prop changes
  useEffect(() => {
    const cleanId = chatId === "undefined" || chatId === "null" ? null : chatId;
    setLocalChatId(cleanId);
    if (cleanId !== null) {
      setIsLoadingMessages(true);
    }
  }, [chatId]);

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      if (!session) {
        return;
      }

      if (limitStats && limitStats.chatsUsed >= limitStats.dailyLimit) {
        return;
      }

      // Authoritative check against the DB before starting mutations
      const freshStats = await getUserDailyLimitStats();
      if (freshStats && freshStats.chatsUsed >= freshStats.dailyLimit) {
        await refreshLimitStats();
        return;
      }

      setError(null);
      let activeChatId = localChatId;

      // Create a temporary ID for the user message to show it immediately
      const userMessageId = "temp-user-" + Date.now();
      const userMessage: Message = {
        id: userMessageId,
        role: "USER",
        text: content,
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsTyping(true);

      let savedUserMsgId: string | null = null;
      try {
        // 1. Create chat if it doesn't exist (i.e. on the landing page)
        if (!activeChatId) {
          const newChat = await createChat(content.slice(0, 30) + "...");
          activeChatId = newChat.id;
          skipNextFetchRef.current = true; // Prevent clearing/reloading messages on local ID update
          setLocalChatId(activeChatId);
        }

        // 2. Save User Message to DB
        const userMsg = await saveMessage(activeChatId, content, "USER");
        savedUserMsgId = userMsg.id;

        // Update temporary user message with actual DB ID
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === userMessageId ? { ...msg, id: userMsg.id } : msg,
          ),
        );

        // 3. Hit chat API with message and chatId
        const response = await fetch("/api/chat/v2", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: content, chatId: activeChatId }),
        });

        if (!response.ok) {
          let errMsg =
            "Connection interrupted. Please try rephrasing your relationship query.";
          let isLimitReached = false;
          try {
            const data = await response.json();
            if (data && data.error) {
              errMsg = typeof data.error === "string" ? data.error : JSON.stringify(data.error);
              if (
                response.status === 403 ||
                errMsg.toLowerCase().includes("daily limit") ||
                errMsg.toLowerCase().includes("limit reached")
              ) {
                isLimitReached = true;
              }
            }
          } catch {
            // ignore
          }

          if (isLimitReached) {
            // Remove user message from database
            if (savedUserMsgId) {
              await deleteMessage(savedUserMsgId);
            }
            // Remove user message from UI list
            setMessages((prev) =>
              prev.filter(
                (msg) => msg.id !== savedUserMsgId && msg.id !== userMessageId,
              ),
            );
            await refreshLimitStats();
            setIsTyping(false);
            setTypingStatus("");
            return; // Exit silently
          }

          if (savedUserMsgId) {
            try {
              await deleteMessage(savedUserMsgId);
            } catch {
              // ignore
            }
          }

          setError(formatChatErrorMessage(errMsg));
          setIsTyping(false);
          setTypingStatus("");
          return;
        }

        // Refresh daily limit usage stats immediately
        refreshLimitStats();

        const coachMessageId = "temp-" + Date.now();
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) throw new Error("No reader available");

        let fullCoachText = "";
        let coachMsgCreated = false;
        let buffer = "";

        // Streaming buffer: accumulate tokens in a ref-like variable
        // and flush to React state via requestAnimationFrame for smooth rendering
        let pendingText = "";
        let rafId: number | null = null;

        const flushPendingText = () => {
          rafId = null;
          if (!pendingText) return;
          const textToFlush = pendingText;
          pendingText = "";
          startTransition(() => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === coachMessageId
                  ? { ...msg, text: msg.text + textToFlush }
                  : msg,
              ),
            );
          });
        };

        let streamError: string | null = null;

        while (true) {
          const { value, done: doneReading } = await reader.read();
          if (doneReading) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data: ")) continue;
            const eventDataStr = trimmed.slice(6);
            try {
              const event: StreamEvent = JSON.parse(eventDataStr);
              if (event.type === "text") {
                if (event.content) {
                  fullCoachText += event.content;

                  if (!coachMsgCreated && fullCoachText.trim().length > 0) {
                    coachMsgCreated = true;
                    setIsTyping(false);
                    setTypingStatus("");
                    setMessages((prev) => [
                      ...prev,
                      {
                        id: coachMessageId,
                        role: "DARC",
                        text: fullCoachText,
                        isComplete: false,
                      },
                    ]);
                    pendingText = "";
                  } else if (coachMsgCreated) {
                    pendingText += event.content;
                    if (rafId === null) {
                      rafId = requestAnimationFrame(flushPendingText);
                    }
                  }
                }
              } else if (event.type === "status") {
                if (event.message) {
                  setTypingStatus(event.message);
                }
              } else if (event.type === "error") {
                streamError = formatChatErrorMessage(event.error);
                break;
              }
            } catch {
              // Ignore incomplete JSON stream chunks
            }
          }

          if (streamError) {
            try {
              await reader.cancel();
            } catch {
              // ignore
            }
            break;
          }
        }

        // Flush any remaining buffered text after stream ends
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
        }

        if (streamError) {
          // If a coach message was partially created, remove it so there's no broken bubble
          if (coachMsgCreated) {
            setMessages((prev) => prev.filter((msg) => msg.id !== coachMessageId));
          }

          // If the message failed, clean up the orphaned user message from the database
          // so the conversation history doesn't become corrupted with consecutive USER messages
          if (savedUserMsgId) {
            try {
              await deleteMessage(savedUserMsgId);
            } catch {
              // ignore
            }
          }

          setError(streamError);
          setIsTyping(false);
          setTypingStatus("");
          return;
        }

        if (pendingText) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === coachMessageId
                ? { ...msg, text: msg.text + pendingText }
                : msg,
            ),
          );
          pendingText = "";
        }

        setIsTyping(false);
        setTypingStatus("");

        // 4. Save Coach Message to DB
        const savedCoachMsg = await saveMessage(
          activeChatId,
          fullCoachText,
          "DARC",
        );

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === coachMessageId
              ? { ...msg, id: savedCoachMsg.id, isComplete: true }
              : msg,
          ),
        );

        // 5. If we started on the landing page (chatId was null), update the URL in-place without triggering Next.js page reload/unmount
        if (!chatId) {
          await refreshChats();
          const newUrl = `/chat/${activeChatId}`;
          window.history.replaceState(
            { ...window.history.state, as: newUrl, url: newUrl },
            "",
            newUrl,
          );
        }
      } catch (err: unknown) {
        console.error("[DARC Error]", err);
        const rawMessage =
          err instanceof Error ? err.message : "Connection interrupted.";
        const formattedMessage = formatChatErrorMessage(rawMessage);

        // Do not show error on frontend if it mentions daily limit/rate limit
        if (
          rawMessage.toLowerCase().includes("daily limit") ||
          rawMessage.toLowerCase().includes("limit reached")
        ) {
          // Safe-guard to remove user message if it was somehow saved but failed later
          if (savedUserMsgId) {
            try {
              await deleteMessage(savedUserMsgId);
            } catch {
              // ignore
            }
          }
          setMessages((prev) =>
            prev.filter(
              (msg) => msg.id !== savedUserMsgId && msg.id !== userMessageId,
            ),
          );
          await refreshLimitStats();
        } else {
          // Clean up orphaned message in DB on unexpected network/server crash
          if (savedUserMsgId) {
            try {
              await deleteMessage(savedUserMsgId);
            } catch {
              // ignore
            }
          }
          setError(formattedMessage);
        }
        setIsTyping(false);
        setTypingStatus("");
      }
    },
    [chatId, localChatId, session, refreshChats, refreshLimitStats, limitStats],
  );

  // Set current chat ID for sidebar highlighting
  useEffect(() => {
    setCurrentChatId(localChatId);
  }, [localChatId, setCurrentChatId]);

  // Fetch messages when chat changes
  useEffect(() => {
    let active = true;
    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false;
      setIsLoadingMessages(false);
      return;
    }
    if (localChatId && session) {
      setIsLoadingMessages(true);
      getChatMessages(localChatId)
        .then((msgs) => {
          if (active) {
            setMessages(
              msgs.map((m) => ({
                id: m.id,
                role: m.role as "USER" | "DARC",
                text: m.text,
                isComplete: true,
              })),
            );
            setIsLoadingMessages(false);
          }
        })
        .catch((err) => {
          console.error("[getChatMessages] Error loading messages:", err);
          if (active) {
            router.push("/chat");
          }
        });
    } else {
      if (active) {
        setMessages([]);
        setIsLoadingMessages(false);
      }
    }
    return () => {
      active = false;
    };
  }, [localChatId, session?.user?.id, router]);

  // Handle message parameter passed during redirect
  const initMsg = searchParams?.get("msg");
  useEffect(() => {
    if (initMsg && localChatId) {
      // Clear query params to prevent resending on reload
      const newUrl = window.location.pathname;
      window.history.replaceState(null, "", newUrl);
      handleSendMessage(initMsg);
    }
  }, [initMsg, localChatId, handleSendMessage]);

  const scrollThrottleRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current && !scrollThrottleRef.current) {
      scrollThrottleRef.current = true;
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "instant",
      });
      setTimeout(() => {
        scrollThrottleRef.current = false;
      }, 150);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  if (isSessionPending) return null;

  return (
    <div className="flex flex-col h-full bg-[#0C0A09] text-stone-50 relative overflow-hidden">
      {/* Mobile background gradients */}
      {messages.length === 0 && (
        <div className="absolute inset-0 pointer-events-none z-0">
          <motion.div
            animate={{ x: [0, 30, -20, 0], y: [0, -40, 30, 0], scale: [1, 1.1, 0.95, 1] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-[10%] -left-[20%] w-[100vw] h-[100vw] md:w-[60vw] md:h-[60vw] rounded-full bg-gradient-to-br from-rose-500/40 to-violet-500/30 opacity-50 blur-[40px] md:blur-[60px]"
          />
          <motion.div
            animate={{ x: [0, -40, 20, 0], y: [0, 30, -30, 0], scale: [1, 0.95, 1.05, 1] }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[25%] -right-[15%] w-[90vw] h-[90vw] md:w-[55vw] md:h-[55vw] rounded-full bg-gradient-to-br from-amber-500/30 to-rose-500/35 opacity-40 blur-[35px] md:blur-[50px]"
          />
          <motion.div
            animate={{ x: [0, 20, -30, 0], y: [0, 30, 40, 0], scale: [1, 1.05, 0.95, 1] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-[10%] -left-[5%] w-[110vw] h-[110vw] md:w-[65vw] md:h-[65vw] rounded-full bg-gradient-to-br from-violet-500/40 to-amber-500/30 opacity-45 blur-[35px] md:blur-[50px]"
          />
        </div>
      )}

      <MobileHeader />

      {!session && <SignInModal />}
      {session && (
        <ProfilePromptModal
          isOpen={showOnboarding}
          onClose={() => setShowOnboarding(false)}
        />
      )}

      <div className="flex-1 relative overflow-hidden">
        <div
          ref={scrollRef}
          className={`h-full px-4 md:px-0 ${
            messages.length === 0
              ? "overflow-hidden flex flex-col justify-center"
              : "overflow-y-auto scrollbar-hide"
          }`}
        >
          <div className={`max-w-3xl mx-auto w-full ${messages.length === 0 ? "" : "pt-20 pb-8 md:pt-12"}`}>
            <AnimatePresence mode="popLayout">
              {isLoadingMessages ? (
                <div
                  key="loading"
                  className="flex items-center justify-center py-20"
                >
                  <div className="w-8 h-8 border-4 border-t-transparent border-stone-50 rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <ChatHero key="hero" />
              ) : (
                <div key="messages" className="flex flex-col">
                  {messages.map((message, index) => {
                    const isLast = index === messages.length - 1;
                    return (
                      <div key={message.id}>
                        <ChatMessage
                          role={message.role === "USER" ? "user" : "coach"}
                          content={message.text}
                          isComplete={message.isComplete}
                        />
                      </div>
                    );
                  })}
                  {isTyping && (
                    <div className="flex flex-col">
                      <TypingIndicator key="typing" status={typingStatus} />
                    </div>
                  )}
                </div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="mt-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-rose-500"
                >
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {messages.length > 0 && (
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 z-10 bg-gradient-to-t from-[#0C0A09]/50 to-transparent" />
        )}
      </div>

      {session && (
        <div className={`relative z-20 py-2 ${messages.length > 0 ? "bg-[#0C0A09]" : ""}`}>
          {limitStats && limitStats.chatsUsed >= limitStats.dailyLimit && (
            <div className="max-w-3xl mx-auto px-4 mb-3">
              <div className="py-2.5 px-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-xs text-zinc-400 text-center flex items-center justify-center gap-2">
                <span>
                  🔒 You&apos;ve used all your {limitStats.dailyLimit} free
                  prompts for today. Your daily limit resets tomorrow.
                </span>
              </div>
            </div>
          )}
          <ChatInput
            onSendMessage={handleSendMessage}
            disabled={
              isTyping ||
              (limitStats !== null &&
                limitStats.chatsUsed >= limitStats.dailyLimit)
            }
            placeholder={
              limitStats && limitStats.chatsUsed >= limitStats.dailyLimit
                ? "Daily limit reached. Let's continue tomorrow!"
                : "Ask DARC..."
            }
          />
        </div>
      )}
    </div>
  );
}
