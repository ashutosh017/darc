/**
 * Gemini & Gemma Model Configurations and Specifications
 *
 * Centralized export for all Google AI models used across the application.
 * DO NOT hardcode model string identifiers anywhere in the application code. Always import from `@/lib/models`.
 */

/**
 * Gemini 2.5 Flash
 *
 * Specifications:
 * - Architecture: High-speed multimodal model supporting native live reasoning/thinking streams (`thinkingConfig: { includeThoughts: true }`).
 * - Used for real-time model reasoning generation in LangGraph v2 pipeline.
 */
export const GEMINI_2_5_FLASH = "gemini-2.5-flash";

/**
 * Gemini 3.1 Flash Lite & 3.5 Flash Lite
 *
 * Specifications:
 * - Architecture: Fast, low-latency lightweight flash model optimized for response streaming and user profile summary synthesis.
 * - Context Window Size: 1,048,576 tokens (1M tokens input), 8,192 max output tokens.
 */
export const GEMINI_3_1_FLASH_LITE = "gemini-3.1-flash-lite";
export const GEMINI_3_5_FLASH_LITE = "gemini-3.5-flash-lite";

/**
 * Gemma 4 31B IT & 26B IT
 *
 * Specifications:
 * - Architecture: 31 Billion parameter instruction-tuned dense model optimized for multi-turn reasoning, translation, and structured extraction.
 * - Context Window Size: 131,072 tokens (128k context window), 8,192 max output tokens.
 */
export const GEMMA_4_31B_IT = "gemma-4-31b-it";
export const GEMMA_4_26B_IT = "gemma-4-26b-it";
