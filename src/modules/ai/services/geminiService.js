/**
 * @file        geminiService.js
 * @module      AI
 * @purpose     Integrates Google Gemini API with real-time MedChem Firestore data.
 *              Retrieves current database state before prompt generation,
 *              formats strict factual ground truth, and calls the Gemini REST endpoint.
 * @dependencies fetchFirestoreContextForQuestion, aiConstants
 */

import { fetchFirestoreContextForQuestion } from "./aiDataService";
import { AI_SYSTEM_INSTRUCTION, AI_MESSAGES, GEMINI_CONFIG } from "../constants/aiConstants";

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
 * Sends a natural-language question to Google Gemini with injected Firestore ground truth.
 * 
 * @param {string} userQuestion - The question asked by the user
 * @param {Array} chatHistory - Previous message history for conversational context
 * @returns {Promise<string>} The generated natural language answer
 */
export const askMedChemAssistant = async (userQuestion, chatHistory = []) => {
  const trimmedQuestion = (userQuestion || "").trim();
  if (!trimmedQuestion) {
    throw new Error("Question cannot be empty.");
  }

  // 1. Validate API Key
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return AI_MESSAGES.CONFIG_MISSING;
  }

  // 2. Fetch fresh, real-time Firestore data for this question
  let firestoreResult;
  try {
    firestoreResult = await fetchFirestoreContextForQuestion(trimmedQuestion);
  } catch (dbError) {
    console.error("Error fetching Firestore context for Gemini:", dbError);
    return "Failed to access live Firestore data. Please verify your database connection.";
  }

  const { category, summaryContext } = firestoreResult;

  // 3. Construct strictly grounded prompt with fresh Firestore data
  const promptContext = `
${AI_SYSTEM_INSTRUCTION}

==================================================
CURRENT MEDCHEM FIRESTORE DATABASE DATA (REAL-TIME SNAPSHOT)
==================================================
Detected Intent Category: ${category}
Database Records:
${JSON.stringify(summaryContext, null, 2)}
==================================================

USER QUESTION:
"${trimmedQuestion}"

INSTRUCTIONS FOR ANSWER:
1. Answer the user's question directly and concisely based strictly on the Database Records above.
2. If the user asks about quantities or counts, quote the exact numbers from the data.
3. If no matching records exist in the database data, reply honestly: "${AI_MESSAGES.NO_DATA_FOUND}".
4. Do NOT speculate, hallucinate or fabricate information.
5. Format key items or medicine names cleanly (bullet points or bold if helpful).
`;

  // 4. Helper to call Gemini REST API
  const callGeminiModel = async (modelName) => {
    const cleanModel = modelName.replace(/^models\//, "");
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${apiKey}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(GEMINI_CONFIG.REQUEST_TIMEOUT_MS || 15000),
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: promptContext }],
          },
        ],
        generationConfig: {
          temperature: GEMINI_CONFIG.TEMPERATURE,
          maxOutputTokens: GEMINI_CONFIG.MAX_OUTPUT_TOKENS,
        },
      }),
    });

    return response;
  };

  try {
    const userConfiguredModel = import.meta.env.VITE_GEMINI_MODEL;
    const candidateModels = Array.from(
      new Set(
        [
          userConfiguredModel,
          GEMINI_CONFIG.PRIMARY_MODEL,
          ...(GEMINI_CONFIG.FALLBACK_MODELS || [])
        ].filter(Boolean)
      )
    );

    let lastErrorMessage = "";
    let data = null;

    for (let i = 0; i < candidateModels.length; i++) {
      const currentModel = candidateModels[i];
      try {
        const response = await callGeminiModel(currentModel);

        if (response.ok) {
          data = await response.json();
          break;
        }

        const errorData = await response.json().catch(() => ({}));
        lastErrorMessage = errorData?.error?.message || response.statusText;
        console.warn(`Gemini call to ${currentModel} failed (${response.status}):`, lastErrorMessage);

        // If API suggests a specific model in the error message, try that immediately
        const suggestedMatch = lastErrorMessage.match(/models\/([a-zA-Z0-9.-]+)/);
        if (suggestedMatch && suggestedMatch[1] && !candidateModels.includes(suggestedMatch[1])) {
          const suggestedModel = suggestedMatch[1];
          try {
            const retryResp = await callGeminiModel(suggestedModel);
            if (retryResp.ok) {
              data = await retryResp.json();
              break;
            }
          } catch (retryErr) {
            console.warn(`Retry with suggested model ${suggestedModel} failed:`, retryErr);
          }
        }

        // If invalid API key, fail immediately without trying other models
        if (response.status === 400 && lastErrorMessage.toLowerCase().includes("key")) {
          return "⚠️ Invalid Gemini API Key. Please verify the `VITE_GEMINI_API_KEY` in your `.env` file.";
        }
        if (response.status === 429) {
          return "⚠️ Gemini API rate limit reached. Please wait a few moments and try again.";
        }
      } catch (err) {
        lastErrorMessage = err.name === "TimeoutError"
          ? `Request to ${currentModel} timed out.`
          : err.message;
        console.warn(`Call to ${currentModel} encountered error:`, lastErrorMessage);
      }
    }

    if (!data) {
      return `AI service error: ${lastErrorMessage || AI_MESSAGES.ERROR_GENERIC}`;
    }

    const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      return AI_MESSAGES.NO_DATA_FOUND;
    }

    return generatedText.trim();
  } catch (networkError) {
    console.error("Network or execution error calling Gemini API:", networkError);
    return "Network error contacting Google Gemini API. Please check your internet connection.";
  }
};
