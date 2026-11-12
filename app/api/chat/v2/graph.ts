import { Annotation, StateGraph, START, END } from "@langchain/langgraph";
import { GoogleGenAI } from "@google/genai";
import { db } from "@/lib/db";
import { logChatTurn } from "@/lib/logger";
import { getPineconeContext } from "@/lib/rag";
import {
  SYSTEM_INSTRUCTION,
  BANNED_PHRASES,
  getUserProfileContext,
  processQueryAndGenerateSearchQuery,
} from "@/lib/coaching";
import { GEMINI_2_5_FLASH } from "@/lib/models";
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

// Step 1: Fast-fail daily limit enforcement & reset tracking (runs immediately to prevent wasted compute)
async function checkDailyLimitNode(state: GraphStateType) {
  const { userId } = state;

  try {
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);

    const [user, lastUserMessage] = await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        select: {
          chatsUsed: true,
          dailyLimit: true,
        },
      }),
      db.message.findFirst({
        where: {
          chat: { user_id: userId },
          role: "USER",
        },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
    ]);

    let chatsUsed = user?.chatsUsed ?? 0;
    const dailyLimit = user?.dailyLimit ?? 10;

    if (!lastUserMessage || lastUserMessage.createdAt < startOfDay) {
      await db.user.update({
        where: { id: userId },
        data: { chatsUsed: 0 },
      });
      chatsUsed = 0;
    }

    if (user && chatsUsed >= dailyLimit) {
      const errorMsg = `You have reached your daily limit of ${dailyLimit} prompts. Please try again tomorrow.`;
      return {
        dailyLimitExceeded: true,
        dailyLimitError: errorMsg,
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

// Step 1b: Limit exceeded handler node
async function limitExceededNode(
  state: GraphStateType,
  config?: { configurable?: { sendEvent?: (data: StreamEvent) => void } }
) {
  const sendEvent = config?.configurable?.sendEvent;

  await logChatTurn(
    {
      userPrompt: state.message,
      searchQuery: null,
      retrievedContext: null,
      attachedComponents: ["User's Query"],
      statusNotice: "Daily prompt quota reached. Request halted.",
      finalResponse: state.dailyLimitError || "Daily prompt limit reached.",
      chatId: state.chatId,
    },
    { chatId: state.chatId }
  );

  if (sendEvent && state.dailyLimitError) {
    sendEvent({ type: "error", error: state.dailyLimitError });
  }
  return {};
}

// Step 2a: Load history from database
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

      // Normalize turns to ensure valid alternating user <-> model roles
      const normalizedContents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
      for (const item of contents) {
        if (normalizedContents.length === 0) {
          if (item.role === "user") {
            normalizedContents.push(item);
          }
        } else {
          const prev = normalizedContents[normalizedContents.length - 1];
          if (prev.role === item.role) {
            prev.parts[0].text += `\n${item.parts[0].text}`;
          } else {
            normalizedContents.push(item);
          }
        }
      }
      contents =
        normalizedContents.length > 0
          ? normalizedContents
          : [{ role: "user", parts: [{ text: message }] }];
    } else {
      contents = [{ role: "user", parts: [{ text: message }] }];
    }
  } catch (err) {
    console.error("[loadHistoryNode Error]", err);
    contents = [{ role: "user", parts: [{ text: message }] }];
  }

  return { contents };
}

// Step 2b: Fetch user profile & synthesize profile context
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

// Step 2 (Parallel Fan-Out): Concurrently loads history & user profile in parallel with Promise.all
async function loadContextNode(state: GraphStateType) {
  const [historyRes, profileRes] = await Promise.all([
    loadHistoryNode(state),
    getUserProfileNode(state),
  ]);

  return {
    ...historyRes,
    ...profileRes,
  };
}

// Step 3: Analyze query for single-pass translation & search query generation (with 0ms fast-path & Flash Lite)
async function analyzeQueryNode(
  state: GraphStateType,
  config?: { configurable?: { sendEvent?: (data: StreamEvent) => void } }
) {
  const sendEvent = config?.configurable?.sendEvent;
  if (sendEvent) {
    sendEvent({ type: "status", message: "Reading your message..." });
  }

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

// Step 4: Retrieve coaching insights from Pinecone vector DB (with singleton client and topK=3)
async function retrieveVectorContextNode(
  state: GraphStateType,
  config?: { configurable?: { sendEvent?: (data: StreamEvent) => void } }
) {
  const sendEvent = config?.configurable?.sendEvent;
  const { searchQuery } = state;
  let retrievedContext = "";

  if (searchQuery) {
    if (sendEvent) {
      sendEvent({ type: "status", message: "Checking coaching notes..." });
    }
    try {
      retrievedContext = await getPineconeContext(searchQuery);
    } catch (err) {
      console.error("[retrieveVectorContextNode Error]", err);
      retrievedContext = "";
    }
  }

  return { retrievedContext };
}

// Step 5: Synthesize dynamic system prompt and contents
async function formulatePromptNode(state: GraphStateType) {
  const { profileContext, retrievedContext, contents, englishMessage } = state;

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

  return { dynamicSystemInstruction, contents: updatedContents };
}

// Step 6: Stream response generation with thinkingBudget: 0 to eliminate initial latency
async function generateResponseNode(
  state: GraphStateType,
  config?: { configurable?: { sendEvent?: (data: StreamEvent) => void } }
) {
  const sendEvent = config?.configurable?.sendEvent;
  if (sendEvent) {
    sendEvent({ type: "status", message: "Writing a response for you..." });
  }

  const { ai, contents, dynamicSystemInstruction, chatId, message, searchQuery, retrievedContext, profileContext } = state;

  // Compile list of attached components (names only)
  const attachedComponents: string[] = [
    "System Prompt (DaRC Persona Guidelines)",
  ];
  if (profileContext) {
    attachedComponents.push("User Profile Context");
  }
  if (retrievedContext) {
    attachedComponents.push("Additional Context (Video Transcripts)");
  }
  if (contents.length > 1) {
    attachedComponents.push(`Conversation History (${contents.length - 1} turns)`);
  }
  attachedComponents.push("User's Query");

  try {
    const streamResponse = await ai.models.generateContentStream({
      model: GEMINI_2_5_FLASH,
      contents,
      config: {
        systemInstruction: dynamicSystemInstruction,
        temperature: 1.15,
        topP: 0.95,
        topK: 40,
        thinkingConfig: {
          thinkingBudget: 0,
        },
      },
    });

    let fullBuffer = "";
    let originalResponseBuffer = "";

    for await (const chunk of streamResponse) {
      const chunkText = chunk.text || "";
      originalResponseBuffer += chunkText;
      fullBuffer += chunkText.toLowerCase();

      if (BANNED_PHRASES.some((phrase) => fullBuffer.includes(phrase))) {
        await logChatTurn(
          {
            userPrompt: message,
            searchQuery,
            retrievedContext,
            attachedComponents,
            statusNotice: "🛑 Policy constraint: Stream terminated early due to banned phrase.",
            finalResponse: originalResponseBuffer,
            chatId,
          },
          { chatId }
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

    // Clean, structured log for the chat turn
    await logChatTurn(
      {
        userPrompt: message,
        searchQuery,
        retrievedContext,
        attachedComponents,
        finalResponse: originalResponseBuffer,
        chatId,
      },
      { chatId }
    );

    return {};
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "An unexpected error occurred during response generation.";
    console.error("[generateResponseNode Error]", err);

    await logChatTurn(
      {
        userPrompt: message,
        searchQuery,
        retrievedContext,
        attachedComponents,
        statusNotice: "Stream error during response generation.",
        finalResponse: `Error: ${errorMessage}`,
        chatId,
      },
      { chatId }
    );

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
  return "loadContext";
}

// Build and compile the LangGraph graph with native RetryPolicy on nodes
export function createDarcChatGraph() {
  const workflow = new StateGraph(GraphState)
    .addNode("checkDailyLimit", checkDailyLimitNode)
    .addNode("limitExceeded", limitExceededNode)
    .addNode("loadContext", loadContextNode, { retryPolicy: defaultRetryPolicy })
    .addNode("analyzeQuery", analyzeQueryNode, { retryPolicy: defaultRetryPolicy })
    .addNode("retrieveVectorContext", retrieveVectorContextNode, { retryPolicy: defaultRetryPolicy })
    .addNode("formulatePrompt", formulatePromptNode)
    .addNode("generateResponse", generateResponseNode, { retryPolicy: defaultRetryPolicy })
    .addEdge(START, "checkDailyLimit")
    .addConditionalEdges("checkDailyLimit", routeAfterDailyLimit, {
      limitExceeded: "limitExceeded",
      loadContext: "loadContext",
    })
    .addEdge("limitExceeded", END)
    .addEdge("loadContext", "analyzeQuery")
    .addEdge("analyzeQuery", "retrieveVectorContext")
    .addEdge("retrieveVectorContext", "formulatePrompt")
    .addEdge("formulatePrompt", "generateResponse")
    .addEdge("generateResponse", END);

  return workflow.compile();
}

export const darcChatGraph = createDarcChatGraph();
