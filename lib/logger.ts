import fs from "fs/promises";
import path from "path";

/**
 * Appends execution log entries to `darc-execution.log` in non-production environments.
 */
export async function logToFile(message: string) {
  if (process.env.NODE_ENV === "production") return;
  try {
    const logPath = path.join(process.cwd(), "darc-execution.log");
    await fs.appendFile(logPath, `${message}\n`, "utf-8");
  } catch (err) {
    console.error("[logToFile] Error in logToFile:", err);
  }
}
