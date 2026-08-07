import { NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { auth } from "@/lib/auth";
import { MAX_WORD_LIMIT } from "@/lib/coaching";
import { darcChatGraph, StreamEvent } from "./graph";

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

    // 2. Server-side API key check
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
        { status: 400, headers: { "Content-Type": "application/json" }, }
      );
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (data: StreamEvent) => {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          } catch (err) {
            console.error("[DARC LangGraph Stream Controller Enqueue Error]", err);
          }
        };

        try {
          // Execute LangGraph pipeline
          await darcChatGraph.invoke(
            {
              userId: session.user.id,
              message,
              chatId,
              ai,
            },
            {
              configurable: {
                sendEvent,
              },
            }
          );

          controller.close();
        } catch (streamError: unknown) {
          console.error("[DARC LangGraph Stream Error]", streamError);
          const errorMessage =
            streamError instanceof Error && streamError.message
              ? streamError.message
              : "An unexpected error occurred.";
          sendEvent({ type: "error", error: errorMessage });
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
    console.error("[DARC v2 LangGraph API Error]", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
