import { NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { GEMMA_4_31B_IT } from "@/lib/models";
import { logToFile } from "@/lib/logger";
import { getPineconeContext } from "@/lib/rag";
import {
  SYSTEM_INSTRUCTION,
  BANNED_PHRASES,
  MAX_WORD_LIMIT,
  getUserProfileContext,
  processQueryAndGenerateSearchQuery,
} from "@/lib/coaching";

export type StreamEvent =
  | { type: "status"; message: string }
  | { type: "text"; content: string }
  | { type: "error"; error: string };

export async function POST(req: NextRequest) {
  try {
    // 1. Authentication Check
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return new Response(
        JSON.stringify({ error: "Authentication required to access DARC services" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Dynamic Client Instantiation using server-side API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Gemini API Key not configured on server" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const { message, chatId } = await req.json();

    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const wordCount = message.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount > MAX_WORD_LIMIT) {
      return new Response(
        JSON.stringify({
          error: `Message is too long. Please keep your message under ${MAX_WORD_LIMIT} words.`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. Fetch Postgres chat history (sliding window of last 20 messages)
    let contents = [];
    if (chatId) {
      const dbMessages = await db.message.findMany({
        where: { chat_id: chatId, chat: { user_id: session.user.id } },
        orderBy: { createdAt: "desc" },
        take: 20,
      });
      dbMessages.reverse();

      contents = dbMessages.map((m) => ({
        role: m.role === "USER" ? "user" : "model",
        parts: [{ text: m.text }],
      }));

      const hasCurrentMessage =
        contents.length > 0 &&
        contents[contents.length - 1].role === "user" &&
        contents[contents.length - 1].parts[0].text === message;

      if (!hasCurrentMessage) {
        contents.push({ role: "user", parts: [{ text: message }] });
      }
    } else {
      contents = [{ role: "user", parts: [{ text: message }] }];
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (data: StreamEvent) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
          // 4. Process translation & search query generation
          sendEvent({ type: "status", message: "Analyzing query & context" });
          const { englishMessage, searchQuery } = await processQueryAndGenerateSearchQuery(
            ai,
            contents
          );

          // 5. Fetch user details & profile context
          const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: {
              id: true,
              name: true,
              email: true,
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
              dailyLimit: true,
              chatsUsed: true,
              profileSummary: true,
            },
          });

          const profileContext = await getUserProfileContext(user, ai);

          // 6. Check daily limit and increment usage
          const startOfDay = new Date();
          startOfDay.setUTCHours(0, 0, 0, 0);

          const lastUserMessage = await db.message.findFirst({
            where: {
              chat: { user_id: session.user.id },
              role: "USER",
            },
            orderBy: { createdAt: "desc" },
          });

          if (!lastUserMessage || lastUserMessage.createdAt < startOfDay) {
            await db.user.update({
              where: { id: session.user.id },
              data: { chatsUsed: 0 },
            });
            if (user) {
              user.chatsUsed = 0;
            }
          }

          if (user && user.chatsUsed >= user.dailyLimit) {
            sendEvent({
              type: "error",
              error: `You have reached your daily limit of ${user.dailyLimit} prompts. Please try again tomorrow.`,
            });
            controller.close();
            return;
          }

          await db.user.update({
            where: { id: session.user.id },
            data: { chatsUsed: { increment: 1 } },
          });

          // 7. Vector context retrieval
          let context = "";
          if (searchQuery) {
            sendEvent({ type: "status", message: "Retrieving coaching insights" });
            context = await getPineconeContext(searchQuery);
          }

          // 8. Formulate dynamic system instruction with context and user profile
          let dynamicSystemInstruction = SYSTEM_INSTRUCTION;
          if (profileContext) {
            dynamicSystemInstruction = `${dynamicSystemInstruction}\n\n${profileContext}`;
          }
          if (context) {
            dynamicSystemInstruction = `${dynamicSystemInstruction}\n\nYou have access to the following relevant context retrieved from your coaching resource base (transcripts of your videos). Use this context to answer the user's query if it is relevant. Do not mention search, databases, or context. Maintain your persona and tone as DaRC.\n\nRetrieved Context:\n${context}`;
          }

          // Update the last user prompt in contents with the translated English message for Gemini generation
          if (contents.length > 0 && contents[contents.length - 1].role === "user") {
            contents[contents.length - 1] = {
              role: "user",
              parts: [{ text: englishMessage }],
            };
          }

          // 9. Log Execution
          logToFile(`\n--- [DARC Execution Log] ---`);
          logToFile(`[USER PROMPT]\n${message}\n`);
          logToFile(`[ENGLISH TRANSLATION]\n${englishMessage}\n`);
          logToFile(
            `[VECTOR DB RETRIEVAL]\nGenerated Query: ${
              searchQuery ? `"${searchQuery}"` : "NONE"
            }\nRetrieved Context Included: ${context ? "YES" : "NO"}\n`
          );
          logToFile(
            `[OVERALL AI PROMPT]\n--- System Instruction ---\n${dynamicSystemInstruction}\n\n--- Contents ---\n${JSON.stringify(
              contents,
              null,
              2
            )}\n`
          );

          // 10. Stream response with Gemini 3.1 Flash Lite
          sendEvent({ type: "status", message: "Formulating response" });

          const streamResponse = await ai.models.generateContentStream({
            model: GEMMA_4_31B_IT,
            contents,
            config: {
              systemInstruction: dynamicSystemInstruction,
              temperature: 1.15,
              topP: 0.95,
              topK: 40,
            },
          });

          let fullBuffer = "";
          let originalResponseBuffer = "";
          for await (const chunk of streamResponse) {
            const chunkText = chunk.text || "";
            originalResponseBuffer += chunkText;
            fullBuffer += chunkText.toLowerCase();
            if (BANNED_PHRASES.some((phrase) => fullBuffer.includes(phrase))) {
              logToFile(
                `[GENERATED RESPONSE]\n🛑 Stream terminated early due to banned phrase.\n${originalResponseBuffer}\n`
              );
              controller.close();
              return;
            }
            sendEvent({ type: "text", content: chunkText });
          }
          logToFile(`[GENERATED RESPONSE]\n${originalResponseBuffer}\n`);
          controller.close();
        } catch (streamError: unknown) {
          console.error("[DARC Stream Error]", streamError);
          sendEvent({ type: "error", error: "An unexpected error occurred." });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error: unknown) {
    console.error("[DARC API Error]", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
