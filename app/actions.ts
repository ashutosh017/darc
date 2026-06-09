"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Role } from "@/lib/generated/prisma";
import { GoogleGenAI } from "@google/genai";

export async function getSession() {
  return await auth.api.getSession({
    headers: await headers(),
  });
}

export async function createChat(title?: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  let chatTitle = title || "New Chat"
  if (title) {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const ai = new GoogleGenAI({ apiKey });
      const gen_title = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: `Create a short, concise, min(2 words) max(10 words) title for a relationship chat started with this message: "${title}". Return ONLY the title text, with no quotes, prefixes, or punctuation.`,
      });
      if (gen_title?.text) {
        chatTitle = gen_title.text.trim().replace(/^["']|["']$/g, '');
      }
    } catch (error) {
      console.error("[createChat] Failed to generate AI title:", error);
      chatTitle = title.slice(0, 30) + (title.length > 30 ? "..." : "");
    }
  }

  return await db.chat.create({
    data: {
      title: chatTitle,
      user_id: session.user.id,
    },
  });
}

export async function saveMessage(chatId: string, text: string, role: Role) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  // Verify chat ownership
  const chat = await db.chat.findUnique({
    where: { id: chatId, user_id: session.user.id },
  });
  if (!chat) throw new Error("Chat not found");

  return await db.message.create({
    data: {
      text,
      role,
      chat_id: chatId,
    },
  });
}

export async function getChatMessages(chatId: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  return await db.message.findMany({
    where: {
      chat_id: chatId,
      chat: { user_id: session.user.id },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getUserChats() {
  const session = await getSession();
  if (!session) return [];

  return await db.chat.findMany({
    where: { user_id: session.user.id },
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteChat(chatId: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  return await db.chat.delete({
    where: { id: chatId, user_id: session.user.id },
  });
}
