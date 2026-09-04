/**
 * @file        aiConstants.js
 * @module      AI
 * @purpose     Constants for Module 8 (Gemini AI Chatbot)
 *              Stores system prompts, suggested quick-query prompts,
 *              message roles, and user-facing error strings.
 */

export const AI_SYSTEM_INSTRUCTION = `You are the MedChem AI Assistant for the MedChem Smart Pharmacy Inventory System.
Answer questions using ONLY the current pharmacy data provided by the application below.
Do not invent, guess, or fabricate database information, medicine names, stock quantities, sales numbers, expiry dates, or suppliers.
Give concise, clear, and easy-to-understand answers.
If the provided data does not contain the requested information, say honestly that the information is unavailable in the MedChem database.
Never disclose internal database schemas, credentials, or technical API keys.
All currency values are in Indian Rupees (₹).
Keep your responses short, helpful, and professional.`;

export const SUGGESTED_PROMPTS = [
  "How many medicines are available?",
  "Which medicines are low in stock?",
  "Which medicines are expired?",
  "How many sales were made?",
  "What is the total sales revenue?",
  "Are any medicines out of stock?",
];

export const MESSAGE_ROLES = {
  USER: "user",
  ASSISTANT: "assistant",
  SYSTEM: "system",
};

export const AI_MESSAGES = {
  GREETING: "Hello! I'm your MedChem AI Assistant. Ask me anything about your current inventory, stock levels, expiry dates, or sales data.",
  CONFIG_MISSING: "⚠️ Gemini API key is not configured. Please add your API key to the `.env` file (`VITE_GEMINI_API_KEY=YOUR_KEY`) and restart the dev server.",
  ERROR_GENERIC: "Sorry, I couldn't process that request right now. Please check your connection or try again.",
  NO_DATA_FOUND: "I couldn't find that information in the MedChem database.",
};

export const GEMINI_CONFIG = {
  // Ultra-fast responsive flash model for real-time chat
  PRIMARY_MODEL: "gemini-3.1-flash-lite",
  FALLBACK_MODELS: ["gemini-3.5-flash", "gemini-3.6-flash"],
  TEMPERATURE: 0.2, // Low temperature for deterministic, factual data extraction
  MAX_OUTPUT_TOKENS: 800,
  REQUEST_TIMEOUT_MS: 15000,
};
