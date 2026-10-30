import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import dotenv from "dotenv";

dotenv.config();

const primaryModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";

// Priority list of Gemini models to fallback across
const candidateModels = [
  primaryModel,
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
].filter(Boolean);

export const FALLBACK_MODELS = [...new Set(candidateModels)];

/**
 * Factory to get configured ChatGoogleGenerativeAI instance for a specific model.
 */
export const getChatModel = (temperature = 0.7, model = primaryModel) => {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("⚠️ Warning: GOOGLE_API_KEY is not set. Please set it in your backend .env file.");
  }

  return new ChatGoogleGenerativeAI({
    model,
    apiKey: apiKey || "dummy-key-for-initialization",
    temperature,
  });
};

/**
 * Streams chat responses with automatic fallback across models if quota is exhausted (429) or model unavailable (404).
 */
export const streamChatModel = async function* (messages, temperature = 0.7) {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  let lastErr = null;

  for (const model of FALLBACK_MODELS) {
    let hasYieldedChunk = false;
    try {
      const instance = new ChatGoogleGenerativeAI({
        model,
        apiKey: apiKey || "dummy-key-for-initialization",
        temperature,
      });
      const stream = await instance.stream(messages);

      for await (const chunk of stream) {
        hasYieldedChunk = true;
        yield chunk;
      }

      return;
    } catch (err) {
      if (hasYieldedChunk) {
        throw err;
      }

      console.warn(`[Model] Model ${model} stream error: ${err.message}. Trying next fallback...`);
      lastErr = err;
    }
  }

  throw lastErr || new Error("All configured Gemini models failed.");
};

/**
 * Invokes chat model with automatic fallback across models.
 */
export const invokeChatModel = async (messages, temperature = 0.1) => {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  let lastErr = null;

  for (const model of FALLBACK_MODELS) {
    try {
      const instance = new ChatGoogleGenerativeAI({
        model,
        apiKey: apiKey || "dummy-key-for-initialization",
        temperature,
      });
      return await instance.invoke(messages);
    } catch (err) {
      console.warn(`[Model] Model ${model} invoke error: ${err.message}. Trying next fallback...`);
      lastErr = err;
    }
  }

  throw lastErr || new Error("All configured Gemini models failed.");
};

/**
 * Primary Chat Model Proxy with resilient streaming and invocation
 */
export const chatModel = new Proxy({}, {
  get(target, prop) {
    if (prop === "stream") {
      return (messages) => streamChatModel(messages, 0.7);
    }
    if (prop === "invoke") {
      return (messages) => invokeChatModel(messages, 0.7);
    }
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
    if (prop === "invoke") {
      return (messages) => invokeChatModel(messages, 0.1);
    }
    if (prop === "stream") {
      return (messages) => streamChatModel(messages, 0.1);
    }
    const instance = getChatModel(0.1);
    const value = instance[prop];
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
