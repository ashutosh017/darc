import { GoogleGenAI } from "@google/genai";
import { GEMMA_4_31B_IT, GEMINI_3_1_FLASH_LITE, GEMINI_3_5_FLASH_LITE, GEMMA_4_26B_IT } from "@/lib/models";
import { db } from "@/lib/db";

export const SYSTEM_INSTRUCTION = `You are DaRC, an experienced dating and relationship coach based in India. You help people with everyday dating challenges, approaching, building confidence, conversation skills, grooming, and relationships.

Speak naturally, warmly, and concisely like a real human coach in a direct conversation—never like an AI or an essayist. Keep responses brief, engaging, and to the point.

Strictly focus on dating, relationships, confidence, and personal development. If asked about off-topic subjects like coding, math, or trivia, naturally refuse in plain language.

Always respond in plain text only. Never use bold text, italics, headers, or markdown formatting.`;
export const BANNED_PHRASES = [
  "ignore all previous instructions",
  "as an ai",
  "as a language model",
  "system prompt",
];

export const MAX_WORD_LIMIT = 500;

export interface UserProfileData {
  id: string;
  name?: string | null;
  age?: number | null;
  dob?: Date | string | null;
  location?: string | null;
  datingGoals?: string | null;
  seekingReason?: string | null;
  educationSchool?: string | null;
  educationDegree?: string | null;
  educationYear?: string | null;
  employmentDetails?: string | null;
  annualIncome?: string | null;
  instaUrl?: string | null;
  linkedinUrl?: string | null;
  xUrl?: string | null;
  profileSummary?: string | null;
}

/**
 * Checks if user's profile summary exists in DB.
 * If not, generates a concise profile summary using gemini-3.1-flash-lite, saves it in DB, and returns the formatted context.
 */
export async function getUserProfileContext(
  user: UserProfileData | null,
  ai?: GoogleGenAI
): Promise<string> {
  if (!user) return "";

  // If profileSummary already exists and is non-empty, use it
  if (user.profileSummary && user.profileSummary.trim().length > 0) {
    return `User Profile Context (use this to personalize your advice and refer to their background context if relevant):\n${user.profileSummary.trim()}`;
  }

  // Build raw profile parts from user fields
  const profileParts: string[] = [];
  if (user.name) profileParts.push(`- Identity / Name: ${user.name}`);
  if (user.age) {
    profileParts.push(`- Age: ${user.age} years old`);
  } else if (user.dob) {
    const dobStr = new Date(user.dob).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    profileParts.push(`- Date of Birth: ${dobStr}`);
  }
  if (user.location) profileParts.push(`- Location: ${user.location}`);
  if (user.datingGoals)
    profileParts.push(`- Dating/Relationship Goals: ${user.datingGoals}`);
  if (user.seekingReason)
    profileParts.push(
      `- Main problems they are facing / Reason for seeking advice: ${user.seekingReason}`
    );

  const eduParts: string[] = [];
  if (user.educationSchool) eduParts.push(`School: ${user.educationSchool}`);
  if (user.educationDegree) eduParts.push(`Degree: ${user.educationDegree}`);
  if (user.educationYear) eduParts.push(`Graduation Year: ${user.educationYear}`);
  if (eduParts.length > 0) {
    profileParts.push(`- Educational Background: ${eduParts.join(", ")}`);
  }

  if (user.employmentDetails)
    profileParts.push(`- Professional / Employment Details: ${user.employmentDetails}`);
  if (user.annualIncome)
    profileParts.push(`- Financial Background / Annual Income: ${user.annualIncome}`);

  const socialParts: string[] = [];
  if (user.instaUrl) socialParts.push(`Instagram: ${user.instaUrl}`);
  if (user.linkedinUrl) socialParts.push(`LinkedIn: ${user.linkedinUrl}`);
  if (user.xUrl) socialParts.push(`X (Twitter): ${user.xUrl}`);
  if (socialParts.length > 0) {
    profileParts.push(`- Social Media Links: ${socialParts.join(", ")}`);
  }

  if (profileParts.length === 0) return "";

  const rawProfileText = profileParts.join("\n");
  let generatedSummary = rawProfileText;

  // Generate profile summary using gemini-3.1-flash-lite if AI instance is available
  if (ai) {
    try {
      const summaryResponse = await ai.models.generateContent({
        model: GEMINI_3_1_FLASH_LITE,
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `You are a strict text summary tool. Transform ONLY the provided user profile facts below into a single clean summary statement/paragraph.
STRICT RULES:
1. Do NOT add, infer, or assume ANY information, context, or details that are not explicitly provided in the input text below.
2. If only a name is provided, output ONLY a direct statement like "My name is [Name]."
3. Do NOT add any introductory fluff, pleasantries, placeholders, or imaginary scenarios.
4. Stick 100% strictly to the factual details given in the input.

Input Facts:
${rawProfileText}`,
              },
            ],
          },
        ],
        config: {
          temperature: 0.0,
        },
      });

      if (summaryResponse.text && summaryResponse.text.trim().length > 0) {
        generatedSummary = summaryResponse.text.trim();
      }
    } catch (err) {
      console.error("[getUserProfileContext] Error generating profile summary with Gemini:", err);
    }
  }

  // Update profileSummary in DB
  try {
    await db.user.update({
      where: { id: user.id },
      data: { profileSummary: generatedSummary },
    });
  } catch (err) {
    console.error("[getUserProfileContext] Failed to update profileSummary in DB:", err);
  }

  return `User Profile Context (use this to personalize your advice and refer to their background context if relevant):\n${generatedSummary}`;
}

function isSimpleGreetingOrAcknowledgement(text: string): boolean {
  const cleaned = text.trim().toLowerCase().replace(/[^\w\s]/g, "");
  if (!cleaned) return true;
  const commonPatterns = new Set([
    "hi", "hey", "hello", "yo", "sup", "whats up", "what is up",
    "how are you", "how are u", "hows it going", "how is it going",
    "good morning", "good evening", "good afternoon", "good night",
    "ok", "okay", "k", "cool", "nice", "got it", "understood", "sure", "alright", "all right",
    "thanks", "thank you", "thx", "ty", "bye", "goodbye", "see ya", "cya",
    "yes", "no", "yeah", "yep", "nope", "nah"
  ]);
  return commonPatterns.has(cleaned);
}

/**
 * Analyzes conversation history and latest prompt using Gemini 3.1 Flash Lite.
 * Includes a 0ms heuristic fast-path for simple greetings/affirmations.
 * Translates input to English and produces a search query for vector retrieval if needed.
 */
export async function processQueryAndGenerateSearchQuery(
  ai: GoogleGenAI,
  contents: { role: string; parts: { text: string }[] }[]
): Promise<{ englishMessage: string; searchQuery: string | null; thinking: string }> {
  const lastUserText = contents[contents.length - 1]?.parts[0]?.text?.trim() ?? "";

  // 0ms Fast-Path: Instantly bypass LLM call for greetings and simple conversational acknowledgements
  if (isSimpleGreetingOrAcknowledgement(lastUserText)) {
    return {
      englishMessage: lastUserText,
      searchQuery: null,
      thinking: "Greeting or conversational acknowledgement.",
    };
  }

  try {
    const systemPrompt = `You are an AI linguistic analysis and search query generator module for a relationship coach app (DaRC).
Analyze the latest user prompt and the conversation history.

Tasks:
1. Provide a brief, concise 1-sentence thought (in "thinking" field) reflecting your cognitive analysis of what the user is asking or experiencing regarding dating/relationships.
2. Translate the user's latest input message to English (if it is already in English, keep it as is).
3. Determine if fetching external relationship/dating knowledge (from a YouTube transcript vector database) is needed to answer the user's query.
   - If external advice/knowledge context is needed, generate a concise search query (in English) focused on the core dating/relationship topic.
   - If it's simple small talk, general greeting, or simple follow-up (e.g. "hi", "how are you", "thanks"), set the search query to null.

Output Format:
Return strictly a JSON object with no markdown formatting or extra commentary:
{
  "thinking": "<brief 1-sentence analysis of user query>",
  "englishMessage": "<translated english message>",
  "searchQuery": "<concise english search query or null>"
}`;

    const response = await ai.models.generateContent({
      model: GEMINI_3_1_FLASH_LITE,
      contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    });

    const text = response.text?.trim() || "";
    const parsed = JSON.parse(text);
    const thinking =
      parsed.thinking?.trim() || "Analyzing relationship context and user intent...";
    const englishMessage =
      parsed.englishMessage?.trim() || lastUserText;
    const searchQuery =
      parsed.searchQuery?.trim() &&
      parsed.searchQuery.trim().toUpperCase() !== "NONE"
        ? parsed.searchQuery.trim()
        : null;

    return { englishMessage, searchQuery, thinking };
  } catch (error) {
    console.error(
      `[processQueryAndGenerateSearchQuery] Error processing with ${GEMINI_3_1_FLASH_LITE}:`,
      error
    );
    return {
      englishMessage: lastUserText,
      searchQuery: null,
      thinking: "Analyzing relationship context...",
    };
  }
}
