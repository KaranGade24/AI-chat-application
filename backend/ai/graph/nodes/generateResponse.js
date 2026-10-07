import { chatModel } from "../../config/model.js";
import { SYSTEM_ASSISTANT_PROMPT } from "../../prompts/chatPrompt.js";
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";

/**
 * Node: generateResponse
 * Generates conversational AI response using chatModel, incorporating
 * memory history, tool results, and streaming chunks in real-time.
 * Ensures strict Gemini API compliance: exactly ONE SystemMessage at index 0,
 * and strictly alternating Human / AI messages.
 */
export const generateResponseNode = async (state, config) => {
  const { message, history, toolResults, intent } = state;
  const onChunk = config?.configurable?.onChunk;

  // 1. Single consolidated SystemMessage at index 0
  let systemContent = SYSTEM_ASSISTANT_PROMPT;
  if (toolResults) {
    systemContent += `\n\n[Tool Execution Result (${intent})]:\n${toolResults}\n\nUse this context to provide an accurate, helpful answer to the user.`;
  }

  const messages = [new SystemMessage(systemContent)];

  // 2. Prepare conversation history with strictly alternating message roles
  const dialogue = [];

  if (Array.isArray(history) && history.length > 0) {
    const recentHistory = history.slice(-10);

    for (const msg of recentHistory) {
      const isHuman =
        (typeof msg._getType === "function" && msg._getType() === "human") ||
        msg.role === "user";

      const content = typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content);
      if (!content || !content.trim()) continue;

      if (dialogue.length === 0) {
        dialogue.push(isHuman ? new HumanMessage(content) : new AIMessage(content));
      } else {
        const lastMsg = dialogue[dialogue.length - 1];
        const lastIsHuman =
          typeof lastMsg._getType === "function"
            ? lastMsg._getType() === "human"
            : lastMsg.role === "user";

        if (lastIsHuman === isHuman) {
          // Merge consecutive same-author messages to satisfy Gemini alternation constraint
          lastMsg.content = `${lastMsg.content}\n\n${content}`;
        } else {
          dialogue.push(isHuman ? new HumanMessage(content) : new AIMessage(content));
        }
      }
    }
  }

  // 3. Add current user message
  if (dialogue.length > 0) {
    const lastMsg = dialogue[dialogue.length - 1];
    const lastIsHuman =
      typeof lastMsg._getType === "function"
        ? lastMsg._getType() === "human"
        : lastMsg.role === "user";

    if (lastIsHuman) {
      lastMsg.content = `${lastMsg.content}\n\n${message}`;
    } else {
      dialogue.push(new HumanMessage(message));
    }
  } else {
    dialogue.push(new HumanMessage(message));
  }

  messages.push(...dialogue);

  try {
    let fullResponse = "";

    // Stream chunks directly from the chat model
    const stream = await chatModel.stream(messages);

    for await (const chunk of stream) {
      let textChunk = "";
      if (typeof chunk.content === "string") {
        textChunk = chunk.content;
      } else if (Array.isArray(chunk.content)) {
        textChunk = chunk.content
          .map((part) => (typeof part === "string" ? part : part?.text || ""))
          .join("");
      }

      if (textChunk) {
        fullResponse += textChunk;
        if (typeof onChunk === "function") {
          onChunk(textChunk);
        }
      }
    }

    return { response: fullResponse };
  } catch (err) {
    console.error("Error generating response with Gemini model:", err);
    const fallbackError = `I apologize, but I encountered an issue generating a response: ${err.message}`;
    if (typeof onChunk === "function") {
      onChunk(fallbackError);
    }
    return {
      response: fallbackError,
      error: err.message,
    };
  }
};
