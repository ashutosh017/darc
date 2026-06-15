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

export async function resetUserDailyLimit() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  // Reset the chatsUsed count in the user profile back to 0
  return await db.user.update({
    where: { id: session.user.id },
    data: { chatsUsed: 0 },
  });
}

export async function checkProfilePrompted() {
  const session = await getSession();
  if (!session) return { prompted: true }; // Don't prompt guest users

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { profilePrompted: true },
  });

  return { prompted: user?.profilePrompted ?? true };
}

export async function saveUserProfile(data: {
  dob?: string | null;
  educationSchool?: string | null;
  educationDegree?: string | null;
  educationYear?: string | null;
  employmentDetails?: string | null;
  datingGoals?: string | null;
  seekingReason?: string | null;
  location?: string | null;
  annualIncome?: string | null;
  instaUrl?: string | null;
  linkedinUrl?: string | null;
  xUrl?: string | null;
} | null) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const updateData: Record<string, string | number | null | boolean | Date> = {
    profilePrompted: true,
  };

  if (data) {
    if (data.dob !== undefined) {
      if (data.dob !== null && data.dob !== "") {
        const birthDate = new Date(data.dob);
        const today = new Date();
        let derivedAge = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          derivedAge--;
        }
        updateData.dob = birthDate;
        updateData.age = derivedAge;
      } else {
        updateData.dob = null;
        updateData.age = null;
      }
    }
    if (data.educationSchool !== undefined) updateData.educationSchool = data.educationSchool;
    if (data.educationDegree !== undefined) updateData.educationDegree = data.educationDegree;
    if (data.educationYear !== undefined) updateData.educationYear = data.educationYear;
    if (data.employmentDetails !== undefined) updateData.employmentDetails = data.employmentDetails;
    if (data.datingGoals !== undefined) updateData.datingGoals = data.datingGoals;
    if (data.seekingReason !== undefined) updateData.seekingReason = data.seekingReason;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.annualIncome !== undefined) updateData.annualIncome = data.annualIncome;
    if (data.instaUrl !== undefined) updateData.instaUrl = data.instaUrl;
    if (data.linkedinUrl !== undefined) updateData.linkedinUrl = data.linkedinUrl;
    if (data.xUrl !== undefined) updateData.xUrl = data.xUrl;
  }

  return await db.user.update({
    where: { id: session.user.id },
    data: updateData,
  });
}

export async function getUserDailyLimitStats() {
  const session = await getSession();
  if (!session) return null;

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      chatsUsed: true,
      dailyLimit: true,
    },
  });

  return user;
}

export async function getUserProfile() {
  const session = await getSession();
  if (!session) return null;

  return await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      dob: true,
      age: true,
      educationSchool: true,
      educationDegree: true,
      educationYear: true,
      employmentDetails: true,
      datingGoals: true,
      seekingReason: true,
      location: true,
      annualIncome: true,
      instaUrl: true,
      linkedinUrl: true,
      xUrl: true,
    },
  });
}
