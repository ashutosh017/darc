import { Annotation, StateGraph, START, END } from "@langchain/langgraph";
import { GoogleGenAI } from "@google/genai";
import { db } from "@/lib/db";
import { logToFile } from "@/lib/logger";
import { getPineconeContext } from "@/lib/rag";
import {
  SYSTEM_INSTRUCTION,
  BANNED_PHRASES,
  getUserProfileContext,
  processQueryAndGenerateSearchQuery,
} from "@/lib/coaching";
import { GEMMA_4_31B_IT } from "@/lib/models";
import { User } from "@/lib/generated/prisma";

export type StreamEvent =
  | { type: "status"; message: string }
  | { type: "text"; content: string }
  | { type: "error"; error: string };

// LangGraph Retry Policy configuration for automatic fault tolerance on transient failures
const defaultRetryPolicy = {
  maxAttempts: 3,
  initialInterval: 1000,
  backoffFactor: 2,
};

// Define graph state structure using LangGraph Annotation
export const GraphState = Annotation.Root({
  userId: Annotation<string>,
  message: Annotation<string>,
  chatId: Annotation<string | undefined>,
  ai: Annotation<GoogleGenAI>,
  contents: Annotation<Array<{ role: string; parts: Array<{ text: string }> }>>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  englishMessage: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  searchQuery: Annotation<string | null>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  userProfile: Annotation<User | null>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  profileContext: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  retrievedContext: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  dynamicSystemInstruction: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  dailyLimitExceeded: Annotation<boolean>({
    reducer: (x, y) => y ?? x,
    default: () => false,
  }),
  dailyLimitError: Annotation<string | undefined>({
    reducer: (x, y) => y ?? x,
    default: () => undefined,
  }),
  error: Annotation<string | null>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
});

export type GraphStateType = typeof GraphState.State;

// Node 1: Fetch sliding window chat history from Prisma DB with fallback error handling
async function loadHistoryNode(state: GraphStateType) {
  const { chatId, userId, message } = state;
  let contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

  try {
    if (chatId) {
      const dbMessages = await db.message.findMany({
        where: { chat_id: chatId, chat: { user_id: userId } },
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
  } catch (err) {
    console.error("[loadHistoryNode Error]", err);
    contents = [{ role: "user", parts: [{ text: message }] }];
  }

  return { contents };
}

// Node 2: Analyze query for single-pass translation & search query generation with fallback error handling
async function analyzeQueryNode(state: GraphStateType) {
  const { ai, contents, message } = state;
  try {
    const { englishMessage, searchQuery } = await processQueryAndGenerateSearchQuery(
      ai,
      contents
    );
    return { englishMessage, searchQuery };
  } catch (err) {
    console.error("[analyzeQueryNode Error]", err);
    return { englishMessage: message, searchQuery: null };
  }
}

// Node 3: Fetch user profile & generate summary context with fallback error handling
async function getUserProfileNode(state: GraphStateType) {
  const { userId, ai } = state;

  try {
    const user = await db.user.findUnique({
      where: { id: userId },
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
    return { userProfile: user, profileContext };
  } catch (err) {
    console.error("[getUserProfileNode Error]", err);
    return { userProfile: null, profileContext: "" };
  }
}

// Node 4: Daily limit enforcement & reset tracking with fallback error handling
async function checkDailyLimitNode(state: GraphStateType) {
  const { userId, userProfile } = state;

  try {
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);

    const lastUserMessage = await db.message.findFirst({
      where: {
        chat: { user_id: userId },
        role: "USER",
      },
      orderBy: { createdAt: "desc" },
    });

    let chatsUsed = userProfile?.chatsUsed ?? 0;
    const dailyLimit = userProfile?.dailyLimit ?? 10;

    if (!lastUserMessage || lastUserMessage.createdAt < startOfDay) {
      await db.user.update({
        where: { id: userId },
        data: { chatsUsed: 0 },
      });
      chatsUsed = 0;
    }

    if (userProfile && chatsUsed >= dailyLimit) {
      return {
        dailyLimitExceeded: true,
        dailyLimitError: `You have reached your daily limit of ${dailyLimit} prompts. Please try again tomorrow.`,
      };
    }

    await db.user.update({
      where: { id: userId },
      data: { chatsUsed: { increment: 1 } },
    });

    return { dailyLimitExceeded: false };
  } catch (err) {
    console.error("[checkDailyLimitNode Error]", err);
    return { dailyLimitExceeded: false };
  }
}

// Node 5: Handle limit exceeded state
async function limitExceededNode(
  state: GraphStateType,
  config?: { configurable?: { sendEvent?: (data: StreamEvent) => void } }
) {
  const sendEvent = config?.configurable?.sendEvent;
  if (sendEvent && state.dailyLimitError) {
    sendEvent({ type: "error", error: state.dailyLimitError });
  }
  return {};
}

// Node 6: Retrieve coaching insights from Pinecone vector DB with fallback error handling
async function retrieveVectorContextNode(state: GraphStateType) {
  const { searchQuery } = state;
  let retrievedContext = "";

  if (searchQuery) {
    try {
      retrievedContext = await getPineconeContext(searchQuery);
    } catch (err) {
      console.error("[retrieveVectorContextNode Error]", err);
      retrievedContext = "";
    }
  }

  return { retrievedContext };
}

// Node 7: Synthesize dynamic system prompt and contents
async function formulatePromptNode(state: GraphStateType) {
  const { profileContext, retrievedContext, contents, englishMessage, message, searchQuery } = state;

  let dynamicSystemInstruction = SYSTEM_INSTRUCTION;
  if (profileContext) {
    dynamicSystemInstruction = `${dynamicSystemInstruction}\n\n${profileContext}`;
  }
  if (retrievedContext) {
    dynamicSystemInstruction = `${dynamicSystemInstruction}\n\nYou have access to the following relevant context retrieved from your coaching resource base (transcripts of your videos). Use this context to answer the user's query if it is relevant. Do not mention search, databases, or context. Maintain your persona and tone as DaRC.\n\nRetrieved Context:\n${retrievedContext}`;
  }

  const updatedContents = [...contents];
  if (updatedContents.length > 0 && updatedContents[updatedContents.length - 1].role === "user") {
    updatedContents[updatedContents.length - 1] = {
      role: "user",
      parts: [{ text: englishMessage }],
    };
  }

  // Log Execution
  logToFile(`\n--- [DARC LangGraph Execution Log] ---`);
  logToFile(`[USER PROMPT]\n${message}\n`);
  logToFile(`[ENGLISH TRANSLATION]\n${englishMessage}\n`);
  logToFile(
    `[VECTOR DB RETRIEVAL]\nGenerated Query: ${
      searchQuery ? `"${searchQuery}"` : "NONE"
    }\nRetrieved Context Included: ${retrievedContext ? "YES" : "NO"}\n`
  );
  logToFile(
    `[OVERALL AI PROMPT]\n--- System Instruction ---\n${dynamicSystemInstruction}\n\n--- Contents ---\n${JSON.stringify(
      updatedContents,
      null,
      2
    )}\n`
  );

  return { dynamicSystemInstruction, contents: updatedContents };
}

// Node 8: Stream response generation with error handling and SSE error notification
async function generateResponseNode(
  state: GraphStateType,
  config?: { configurable?: { sendEvent?: (data: StreamEvent) => void } }
) {
  const sendEvent = config?.configurable?.sendEvent;
  const { ai, contents, dynamicSystemInstruction } = state;

  try {
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
        if (sendEvent) {
          sendEvent({
            type: "error",
            error: "Stream terminated due to policy constraint.",
          });
        }
        return { error: "Banned phrase detected" };
      }

      if (sendEvent) {
        sendEvent({ type: "text", content: chunkText });
      }
    }

    logToFile(`[GENERATED RESPONSE]\n${originalResponseBuffer}\n`);
    return {};
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "An unexpected error occurred during response generation.";
    console.error("[generateResponseNode Error]", err);
    if (sendEvent) {
      sendEvent({ type: "error", error: errorMessage });
    }
    return { error: errorMessage };
  }
}

// Conditional routing function after daily limit check
function routeAfterDailyLimit(state: GraphStateType) {
  if (state.dailyLimitExceeded) {
    return "limitExceeded";
  }
  return "retrieveVectorContext";
}

// Build and compile the LangGraph graph with native RetryPolicy on nodes
export function createDarcChatGraph() {
  const workflow = new StateGraph(GraphState)
    .addNode("loadHistory", loadHistoryNode)
    .addNode("analyzeQuery", analyzeQueryNode, { retryPolicy: defaultRetryPolicy })
    .addNode("getUserProfile", getUserProfileNode, { retryPolicy: defaultRetryPolicy })
    .addNode("checkDailyLimit", checkDailyLimitNode)
    .addNode("limitExceeded", limitExceededNode)
    .addNode("retrieveVectorContext", retrieveVectorContextNode, { retryPolicy: defaultRetryPolicy })
    .addNode("formulatePrompt", formulatePromptNode)
    .addNode("generateResponse", generateResponseNode, { retryPolicy: defaultRetryPolicy })
    .addEdge(START, "loadHistory")
    .addEdge("loadHistory", "analyzeQuery")
    .addEdge("analyzeQuery", "getUserProfile")
    .addEdge("getUserProfile", "checkDailyLimit")
    .addConditionalEdges("checkDailyLimit", routeAfterDailyLimit, {
      limitExceeded: "limitExceeded",
      retrieveVectorContext: "retrieveVectorContext",
    })
    .addEdge("limitExceeded", END)
    .addEdge("retrieveVectorContext", "formulatePrompt")
    .addEdge("formulatePrompt", "generateResponse")
    .addEdge("generateResponse", END);

  return workflow.compile();
}

export const darcChatGraph = createDarcChatGraph();
