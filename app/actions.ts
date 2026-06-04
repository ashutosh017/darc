"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Role } from "@prisma/client";

export async function getSession() {
    return await auth.api.getSession({
        headers: await headers(),
    });
}

export async function createChat(title?: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    return await db.chat.create({
        data: {
            title: title || "New Chat",
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
            chat: { user_id: session.user.id }
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
