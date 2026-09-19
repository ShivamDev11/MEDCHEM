/**
 * @file        geminiService.js
 * @module      AI
 * @purpose     Two-phase intelligent pharmacy assistant using Google Gemini API.
 *              Phase 1: Generates a structured query plan via Gemini (with safe fallback).
 *              Phase 2: Application validates and executes plan on live Firestore data.
 *              Phase 3: Gemini converts pre-filtered minimal context into natural English.
 * @dependencies aiDataService, aiConstants
 */

import { executeQueryPlan, validateAndSanitizePlan, getLastMedicineFromHistory } from "./aiDataService";
import {
  AI_SYSTEM_INSTRUCTION,
  AI_QUERY_PLANNER_INSTRUCTION,
  AI_MESSAGES,
  GEMINI_CONFIG,
} from "../constants/aiConstants";

/**
 * Retrieves the Gemini API key from Vite environment variables.
 */
export const getGeminiApiKey = () => {
  const key = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;
  if (!key || key.trim() === "" || key.trim() === "YOUR_GEMINI_API_KEY_HERE") {
    return null;
  }
  return key.trim();
};

/**
 * Checks if a valid API key has been configured.
 */
export const isGeminiKeyConfigured = () => {
  return Boolean(getGeminiApiKey());
};

/**
 * Executes a call to the Gemini REST endpoint with candidate fallback models.
 */
const callGeminiWithModels = async ({
  apiKey,
  promptText,
  temperature = GEMINI_CONFIG.TEMPERATURE,
  maxOutputTokens = GEMINI_CONFIG.MAX_OUTPUT_TOKENS,
  timeoutMs = GEMINI_CONFIG.REQUEST_TIMEOUT_MS || 15000,
}) => {
  const userConfiguredModel = import.meta.env.VITE_GEMINI_MODEL;
  const candidateModels = Array.from(
    new Set(
      [
        userConfiguredModel,
        GEMINI_CONFIG.PRIMARY_MODEL,
        ...(GEMINI_CONFIG.FALLBACK_MODELS || []),
      ].filter(Boolean)
    )
  );

  let lastErrorMessage = "";
  let data = null;

  for (let i = 0; i < candidateModels.length; i++) {
    const currentModel = candidateModels[i];
    const cleanModel = currentModel.replace(/^models\//, "");
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(timeoutMs),
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: promptText }],
            },
          ],
          generationConfig: {
            temperature,
            maxOutputTokens,
          },
        }),
      });

      if (response.ok) {
        data = await response.json();
        break;
      }

      const errorData = await response.json().catch(() => ({}));
      lastErrorMessage = errorData?.error?.message || response.statusText;
      console.warn(`Gemini call to ${currentModel} failed (${response.status}):`, lastErrorMessage);

      // Handle suggested model in error response
      const suggestedMatch = lastErrorMessage.match(/models\/([a-zA-Z0-9.-]+)/);
      if (suggestedMatch && suggestedMatch[1] && !candidateModels.includes(suggestedMatch[1])) {
        const suggestedModel = suggestedMatch[1];
        try {
          const retryEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${suggestedModel}:generateContent?key=${apiKey}`;
          const retryResp = await fetch(retryEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: AbortSignal.timeout(timeoutMs),
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: promptText }] }],
              generationConfig: { temperature, maxOutputTokens },
            }),
          });
          if (retryResp.ok) {
            data = await retryResp.json();
            break;
          }
        } catch (retryErr) {
          console.warn(`Retry with suggested model ${suggestedModel} failed:`, retryErr);
        }
      }

      if (response.status === 400 && lastErrorMessage.toLowerCase().includes("key")) {
        throw new Error("INVALID_KEY");
      }
      if (response.status === 429) {
        throw new Error("RATE_LIMIT");
      }
    } catch (err) {
      if (err.message === "INVALID_KEY" || err.message === "RATE_LIMIT") {
        throw err;
      }
      lastErrorMessage = err.name === "TimeoutError"
        ? `Request to ${currentModel} timed out.`
        : err.message;
      console.warn(`Call to ${currentModel} encountered error:`, lastErrorMessage);
    }
  }

  if (!data) {
    throw new Error(lastErrorMessage || "All Gemini candidate models failed.");
  }

  const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  return generatedText ? generatedText.trim() : "";
};

// ─────────────────────────────────────────────────────────────────────────────
// SAFE FALLBACK QUERY PLANNER
// Used if Phase 1 Gemini call experiences network error, timeout, or invalid JSON.
// ─────────────────────────────────────────────────────────────────────────────
export const buildFallbackPlan = (userQuestion, chatHistory = []) => {
  const q = String(userQuestion || "").toLowerCase().trim();

  // Greetings
  if (/^(hi|hello|hey|namaste|namaskar|help|what can you do)/i.test(q)) {
    return validateAndSanitizePlan({ aggregationType: "greeting" });
  }

  // Pronoun / follow-up check
  const isPronounQuery = /\b(it|this|that|its|iska|iski|uska|uski|same medicine)\b/i.test(q);
  const wordCount = q.split(/\s+/).length;
  const isShortFollowUp = wordCount <= 4 && /\b(stock|expiry|expir|price|rate|manufacturer|supplier|category|batch|details?)\b/i.test(q);

  if (isPronounQuery || isShortFollowUp) {
    const lastMed = getLastMedicineFromHistory(chatHistory);
    if (lastMed) {
      const fieldMatch = q.match(/\b(expiry|expir|stock|price|rate|manufacturer|supplier|category|batch|details?|info)\b/i);
      const field = fieldMatch ? (fieldMatch[1].startsWith("exp") ? "expiryDate" : fieldMatch[1]) : "stock";
      return validateAndSanitizePlan({
        needsMedicines: true,
        medicineNameQuery: lastMed,
        resolveFromContext: true,
        requestedMedicineFields: [field],
        aggregationType: "single_medicine",
      });
    }
  }

  // Top selling
  if (/\b(sold the most|sells the most|best selling|top selling|most sold|sabse jyada)\b/i.test(q)) {
    return validateAndSanitizePlan({
      needsSaleItems: true,
      aggregationType: "top_selling",
    });
  }

  // Revenue
  if (/\b(revenue|income|earnings?|turnover|kitna kamaya)\b/i.test(q)) {
    let dateRange = null;
    if (q.includes("last month")) dateRange = "lastMonth";
    else if (q.includes("this month")) dateRange = "thisMonth";
    else if (q.includes("today")) dateRange = "today";
    else if (q.includes("this week")) dateRange = "thisWeek";

    return validateAndSanitizePlan({
      needsSales: true,
      salesFilters: { dateRange },
      aggregationType: "revenue",
    });
  }

  // Sales count
  if (/\b(how many sales|total sales|kitni sale|sales count)\b/i.test(q)) {
    let dateRange = null;
    if (q.includes("last month")) dateRange = "lastMonth";
    else if (q.includes("this month")) dateRange = "thisMonth";
    else if (q.includes("today")) dateRange = "today";

    return validateAndSanitizePlan({
      needsSales: true,
      salesFilters: { dateRange },
      aggregationType: "sales_count",
    });
  }

  // Total medicines
  if (/\b(total medicine|kitni medicine|inventory count|how many products|how many medicines)\b/i.test(q)) {
    return validateAndSanitizePlan({
      needsMedicines: true,
      aggregationType: "count",
    });
  }

  // Out of stock
  if (/\b(out of stock|zero stock|stock khatam|khatam)\b/i.test(q)) {
    return validateAndSanitizePlan({
      needsMedicines: true,
      medicineFilters: { outOfStock: true },
      aggregationType: "list",
    });
  }

  // Low stock
  if (/\b(low stock|kam stock|running low|almost finished|shortage)\b/i.test(q)) {
    return validateAndSanitizePlan({
      needsMedicines: true,
      medicineFilters: { lowStock: true },
      aggregationType: "list",
    });
  }

  // Expired
  if (/\b(expired|expire ho gayi|expiry nikal gayi)\b/i.test(q)) {
    return validateAndSanitizePlan({
      needsMedicines: true,
      medicineFilters: { expiredOnly: true },
      aggregationType: "list",
    });
  }

  // Expiring soon
  if (/\b(expiring soon|jaldi expire|near expiry|about to expire)\b/i.test(q)) {
    return validateAndSanitizePlan({
      needsMedicines: true,
      medicineFilters: { expiringSoonDays: 30 },
      aggregationType: "list",
    });
  }

  // Specific medicine candidate extraction
  const cleanTokens = q
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => !/^(how|much|many|is|are|the|what|when|which|who|where|ka|ki|ke|hai|hain|kya|kitna|kitni|batao|tell|me|about|show|check|find|available|left|stock|expiry|expired|price|cost|rate|units?|pieces?)$/i.test(w));

  if (cleanTokens.length > 0) {
    const candidateName = cleanTokens.join(" ");
    let requestedField = "stock";
    if (/\b(expiry|expire|kab expire)\b/i.test(q)) requestedField = "expiryDate";
    if (/\b(price|cost|rate|daam|mrp)\b/i.test(q)) requestedField = "sellingPrice";
    if (/\b(manufacturer|company|banata)\b/i.test(q)) requestedField = "manufacturer";
    if (/\b(supplier|vendor)\b/i.test(q)) requestedField = "supplier";
    if (/\b(all|details|info|jankari|sab)\b/i.test(q)) requestedField = "all";

    return validateAndSanitizePlan({
      needsMedicines: true,
      medicineNameQuery: candidateName,
      requestedMedicineFields: [requestedField],
      aggregationType: "single_medicine",
    });
  }

  return validateAndSanitizePlan({ aggregationType: "overview" });
};

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 1: GENERATE QUERY PLAN (Gemini NLP or fallback)
const generateQueryPlan = async (userQuestion, chatHistory, apiKey) => {
  // Format previous chat turns for pronoun / follow-up resolution (excluding current question)
  const previousTurns = (chatHistory || []).filter(
    (msg, idx) => idx !== chatHistory.length - 1 || msg.role !== "user" || msg.text !== userQuestion
  );
  const recentTurns = previousTurns.slice(-4).map((msg) => {
    const role = msg.role === "user" ? "User" : "Assistant";
    return `${role}: "${msg.text || ""}"`;
  }).join("\n");

  const plannerPrompt = `
${AI_QUERY_PLANNER_INSTRUCTION}

Recent Conversation History:
${recentTurns || "(None)"}

Current User Question:
"${userQuestion}"

Return strictly valid JSON only:
`;

  try {
    const rawOutput = await callGeminiWithModels({
      apiKey,
      promptText: plannerPrompt,
      temperature: 0.0, // Zero temperature for deterministic structured JSON
      maxOutputTokens: 300,
      timeoutMs: 8000, // Fast timeout for planner phase
    });

    // Strip codeblock backticks if present
    const cleanJson = rawOutput.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    const parsed = JSON.parse(cleanJson);
    return validateAndSanitizePlan(parsed);
  } catch (err) {
    console.warn("[geminiService] Gemini query planner fallback invoked:", err.message);
    return buildFallbackPlan(userQuestion, chatHistory);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT: ASK MEDCHEM ASSISTANT
// Full 3-phase execution:
// 1. Planner (Gemini) → Validated Query Plan
// 2. Application Firestore Retrieval & JS Calculation → Filtered Minimal Context
// 3. Response Generation (Gemini) → Clear English Output
// ─────────────────────────────────────────────────────────────────────────────
export const askMedChemAssistant = async (userQuestion, chatHistory = []) => {
  const trimmedQuestion = (userQuestion || "").trim();
  if (!trimmedQuestion) {
    throw new Error("Question cannot be empty.");
  }

  // Validate API Key
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return AI_MESSAGES.CONFIG_MISSING;
  }

  // Phase 1: Natural Language Understanding & Query Planning
  const queryPlan = await generateQueryPlan(trimmedQuestion, chatHistory, apiKey);

  // Phase 2: Execute Query Plan (Application fetches Firestore data & calculates metrics)
  let firestoreResult;
  try {
    firestoreResult = await executeQueryPlan(queryPlan, chatHistory);
  } catch (dbError) {
    console.error("[geminiService] Error executing query plan on Firestore:", dbError);
    return "Failed to access live Firestore data. Please verify your database connection.";
  }

  const { category, summaryContext, detectedMedicine } = firestoreResult;

  // Annotate detected medicine onto current user message for upcoming follow-up turns
  if (detectedMedicine && chatHistory.length > 0) {
    const lastMsg = chatHistory[chatHistory.length - 1];
    if (lastMsg && lastMsg.role === "user") {
      lastMsg._detectedMedicine = detectedMedicine;
    }
  }

  // If clarification is needed, return question directly without invoking Gemini
  if (category === "CLARIFICATION" && summaryContext.clarificationQuestion) {
    return summaryContext.clarificationQuestion;
  }

  // Phase 3: Construct Minimal Grounded Context & Call Gemini for Natural Response
  const promptContext = `
${AI_SYSTEM_INSTRUCTION}

==================================================
PHARMACY DATA CONTEXT (real-time Firestore — pre-filtered for this question)
==================================================
Intent Category: ${category}
Data:
${JSON.stringify(summaryContext, null, 2)}
==================================================

USER QUESTION: "${trimmedQuestion}"

Respond using ONLY the data shown above. Do not add any information not present in the data.
`;

  try {
    const generatedAnswer = await callGeminiWithModels({
      apiKey,
      promptText: promptContext,
      temperature: GEMINI_CONFIG.TEMPERATURE,
      maxOutputTokens: GEMINI_CONFIG.MAX_OUTPUT_TOKENS,
      timeoutMs: GEMINI_CONFIG.REQUEST_TIMEOUT_MS || 15000,
    });

    return generatedAnswer || AI_MESSAGES.NO_DATA_FOUND;
  } catch (err) {
    if (err.message === "INVALID_KEY") {
      return "⚠️ Invalid Gemini API Key. Please verify the `VITE_GEMINI_API_KEY` in your `.env` file.";
    }
    if (err.message === "RATE_LIMIT") {
      return "⚠️ Gemini API rate limit reached. Please wait a few moments and try again.";
    }
    console.error("[geminiService] Error generating response from Gemini:", err);
    return `AI service error: ${err.message || AI_MESSAGES.ERROR_GENERIC}`;
  }
};
