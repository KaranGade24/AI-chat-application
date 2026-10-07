import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import dotenv from "dotenv";

dotenv.config();

const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

/**
 * Factory to get configured ChatGoogleGenerativeAI instance.
 * Allows graceful startup even if GOOGLE_API_KEY is not yet in .env
 */
export const getChatModel = (temperature = 0.7) => {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("⚠️ Warning: GOOGLE_API_KEY is not set. Please set it in your backend .env file.");
  }

  return new ChatGoogleGenerativeAI({
    model: modelName,
    apiKey: apiKey || "dummy-key-for-initialization",
    temperature,
  });
};

/**
 * Primary Chat Model Proxy for responses and generation
 */
export const chatModel = new Proxy({}, {
  get(target, prop) {
    const instance = getChatModel(0.7);
    const value = instance[prop];
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

/**
 * Fast / Low-temperature Model Proxy for intent analysis & routing
 */
export const fastModel = new Proxy({}, {
  get(target, prop) {
    const instance = getChatModel(0.1);
    const value = instance[prop];
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
