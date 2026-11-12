import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import { AsyncLocalStorage } from "node:async_hooks";

export interface LogOptions {
  chatId?: string;
  step?: string;
  logFilePath?: string;
}

export interface ChatTurnLogData {
  userPrompt: string;
  searchQuery?: string | null;
  retrievedContext?: string | null;
  attachedComponents: string[];
  finalResponse: string;
  chatId?: string;
  statusNotice?: string;
}

interface ChatStore {
  chatId?: string;
  userId?: string;
  logFilePath: string;
}

const chatLogStorage = new AsyncLocalStorage<ChatStore>();

const LOGS_DIR = path.join(process.cwd(), "logs");
const DUMP_LOG_PATH = path.join(process.cwd(), "darc-execution.log");

// Map chatId -> assigned log file path in logs/
const chatLogFileMap = new Map<string, string>();
// Map filePath -> associated chatId (to avoid clobbering in race conditions)
const filePathToChatIdMap = new Map<string, string>();

let lastActiveLogPath: string | null = null;
let logsDirEnsured = false;

async function ensureLogsDir(): Promise<void> {
  if (logsDirEnsured) return;
  try {
    await fs.mkdir(LOGS_DIR, { recursive: true });
    logsDirEnsured = true;
  } catch (err) {
    console.error("[logger] Failed to create logs directory:", err);
  }
}

/**
 * Formats a Date into `YYYY-MM-DD_HH-mm-ss`.
 */
export function formatCreationTimestamp(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const mins = pad(date.getMinutes());
  const secs = pad(date.getSeconds());
  return `${year}-${month}-${day}_${hours}-${mins}-${secs}`;
}

/**
 * Resolves or initializes the dedicated log file path for a chat in `logs/`.
 * Named with creation date, time, mins, secs (e.g. `YYYY-MM-DD_HH-mm-ss.log`).
 */
export async function resolveChatLogPath(
  chatId?: string,
  chatCreatedAt?: Date
): Promise<string> {
  if (chatId && chatLogFileMap.has(chatId)) {
    return chatLogFileMap.get(chatId)!;
  }

  await ensureLogsDir();

  let createdAt = chatCreatedAt;
  if (!createdAt && chatId) {
    try {
      const { db } = await import("@/lib/db");
      const chat = await db.chat.findUnique({
        where: { id: chatId },
        select: { createdAt: true },
      });
      if (chat?.createdAt) {
        createdAt = new Date(chat.createdAt);
      }
    } catch {
      // Fallback to current time if DB lookup fails
    }
  }

  const dateToUse = createdAt ?? new Date();
  const baseName = formatCreationTimestamp(dateToUse);
  let fileName = `${baseName}.log`;
  let fullPath = path.join(LOGS_DIR, fileName);

  // Avoid clobbering if a file with the same timestamp already belongs to another chat
  let counter = 1;
  while (
    fsSync.existsSync(fullPath) &&
    filePathToChatIdMap.has(fullPath) &&
    filePathToChatIdMap.get(fullPath) !== (chatId ?? "default")
  ) {
    fileName = `${baseName}_${chatId ? chatId.slice(0, 6) : counter++}.log`;
    fullPath = path.join(LOGS_DIR, fileName);
    if (counter > 20) break;
  }

  if (chatId) {
    chatLogFileMap.set(chatId, fullPath);
  }
  filePathToChatIdMap.set(fullPath, chatId ?? "default");
  lastActiveLogPath = fullPath;

  // Initialize the new chat log file with a clean metadata header if it doesn't exist
  if (!fsSync.existsSync(fullPath)) {
    const header = [
      "================================================================================",
      "DARC LOCAL CHAT LOG",
      `Created At: ${dateToUse.toISOString()} (${dateToUse.toLocaleString()})`,
      `Chat ID: ${chatId ?? "Standalone / Unsaved Test"}`,
      "================================================================================\n\n",
    ].join("\n");
    await fs.writeFile(fullPath, header, "utf-8");
  }

  return fullPath;
}

/**
 * Pre-registers a newly created chat so subsequent requests immediately map to its creation timestamp log file.
 */
export async function registerNewChat(
  chatId: string,
  createdAt: Date = new Date()
): Promise<string> {
  if (process.env.NODE_ENV === "production") return "";
  return await resolveChatLogPath(chatId, createdAt);
}

/**
 * Runs an asynchronous chat execution with an isolated chat logger context in AsyncLocalStorage.
 */
export async function runWithChatLogger<T>(
  context: { chatId?: string; chatCreatedAt?: Date; userId?: string },
  fn: () => Promise<T>
): Promise<T> {
  if (process.env.NODE_ENV === "production") {
    return fn();
  }

  const logFilePath = await resolveChatLogPath(context.chatId, context.chatCreatedAt);
  return chatLogStorage.run(
    {
      chatId: context.chatId,
      userId: context.userId,
      logFilePath,
    },
    fn
  );
}

/**
 * Appends execution log entries to `darc-execution.log` AND to the chat's specific log file in `logs/`
 * in non-production environments.
 */
export async function logToFile(message: string, options?: LogOptions) {
  if (process.env.NODE_ENV === "production") return;

  try {
    const line = `${message}\n`;

    // 1. Maintain existing behavior: dump everything to darc-execution.log
    await fs.appendFile(DUMP_LOG_PATH, line, "utf-8");

    // 2. Write to the chat-specific log file in the separate logs/ folder
    let targetLogPath =
      options?.logFilePath ||
      chatLogStorage.getStore()?.logFilePath ||
      (options?.chatId ? chatLogFileMap.get(options.chatId) : undefined) ||
      lastActiveLogPath;

    if (!targetLogPath) {
      targetLogPath = await resolveChatLogPath(options?.chatId);
    }

    if (targetLogPath) {
      await fs.appendFile(targetLogPath, line, "utf-8");
    }
  } catch (err) {
    console.error("[logToFile] Error writing log:", err);
  }
}

/**
 * Logs a clean, simple view of a chat turn to both darc-execution.log
 * and the chat's dedicated log file:
 * - User prompt
 * - Context fetched along with query used
 * - Attached components (names only)
 * - Final response
 */
export async function logChatTurn(data: ChatTurnLogData, options?: LogOptions) {
  if (process.env.NODE_ENV === "production") return;

  const queryUsed = data.searchQuery && data.searchQuery.trim()
    ? `"${data.searchQuery.trim()}"`
    : "None (skipped - small talk/direct answer)";

  const contextFetched = data.retrievedContext && data.retrievedContext.trim()
    ? data.retrievedContext.trim()
    : "None";

  const componentsList = data.attachedComponents.length > 0
    ? data.attachedComponents.map((c) => `- ${c}`).join("\n")
    : "- User's Query";

  const timestamp = new Date().toISOString();

  const lines = [
    "================================================================================",
    `TIMESTAMP: ${timestamp}`,
    "",
    "[USER PROMPT]",
    data.userPrompt.trim(),
    "",
    "[RETRIEVED CONTEXT]",
    `Query Used: ${queryUsed}`,
    "Context Fetched:",
    contextFetched,
    "",
    "[ATTACHED COMPONENTS]",
    componentsList,
    "",
    data.statusNotice ? `[STATUS NOTICE]\n${data.statusNotice}\n` : null,
    "[FINAL RESPONSE]",
    data.finalResponse.trim(),
    "================================================================================\n",
  ].filter((line): line is string => line !== null);

  const formattedLog = lines.join("\n");
  await logToFile(formattedLog, options);
}

/**
 * Helper to log individual steps (kept for backward compatibility).
 */
export async function logStep(
  stepName: string,
  details: Record<string, unknown> | string,
  options?: LogOptions
) {
  if (process.env.NODE_ENV === "production") return;

  const timestamp = new Date().toISOString();
  let formattedDetails = "";

  if (typeof details === "string") {
    formattedDetails = details;
  } else {
    try {
      formattedDetails = Object.entries(details)
        .map(([key, val]) => {
          if (val === undefined) return `${key}: undefined`;
          if (val === null) return `${key}: null`;
          if (typeof val === "object") {
            return `${key}:\n${JSON.stringify(val, null, 2)}`;
          }
          return `${key}: ${val}`;
        })
        .join("\n");
    } catch {
      formattedDetails = String(details);
    }
  }

  const banner = `--------------------------------------------------------------------------------`;
  const message = `\n${banner}\n[STEP: ${stepName}] - ${timestamp}\n${banner}\n${formattedDetails}\n${banner}\n`;

  await logToFile(message, options);
}
