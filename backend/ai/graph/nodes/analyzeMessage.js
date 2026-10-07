import { fastModel } from "../../config/model.js";
import { INTENT_ANALYSIS_PROMPT } from "../../prompts/chatPrompt.js";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";

/**
 * Node: analyzeMessage
 * Inspects the user's prompt and past context to identify intent,
 * required tools, and chat title.
 */
export const analyzeMessageNode = async (state) => {
  const { message, history, title, isNewChat } = state;

  if (!message || !message.trim()) {
    return {
      intent: "normal_question",
      toolInput: null,
    };
  }

  // Quick heuristic pre-checks for instant detection
  const lowerMsg = message.toLowerCase().trim();

  // If user asks for calculation specifically
  const mathRegex = /^(calculate|what is|compute|solve)?\s*([0-9+\-*/(). ,^%×÷]+)$/i;
  if (mathRegex.test(lowerMsg)) {
    return {
      intent: "calculator",
      toolInput: message.replace(/^(calculate|what is|compute|solve)\s*/i, "").trim(),
      title: title || (isNewChat ? "Math Calculation" : null),
    };
  }

  try {
    const recentHistorySummary = history.slice(-4).map((m) => {
      const role = m._getType() === "human" ? "User" : "Assistant";
      return `${role}: ${m.content}`;
    }).join("\n");

    const promptText = `
${recentHistorySummary ? `Recent Conversation History:\n${recentHistorySummary}\n` : ""}
Latest User Message: "${message}"
Current Title: ${title || "None"}
Is New Conversation: ${isNewChat}
`;

    const response = await fastModel.invoke([
      new SystemMessage(INTENT_ANALYSIS_PROMPT),
      new HumanMessage(promptText),
    ]);

    let parsed = null;
    try {
      const cleaned = response.content.toString().replace(/```json|```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      // Fallback if parsing failed
      parsed = {
        intent: "normal_question",
        toolInput: null,
        suggestedTitle: null,
      };
    }

    const detectedIntent = parsed.intent || "normal_question";
    const detectedToolInput = parsed.toolInput || null;
    const finalTitle = title || parsed.suggestedTitle || (isNewChat ? generateFallbackTitle(message) : null);

    return {
      intent: detectedIntent,
      toolInput: detectedToolInput,
      title: finalTitle,
    };
  } catch (err) {
    console.warn("Intent analysis node warning, falling back to default:", err.message);
    return {
      intent: "normal_question",
      toolInput: null,
      title: title || (isNewChat ? generateFallbackTitle(message) : null),
    };
  }
};

function generateFallbackTitle(message) {
  const words = message.trim().split(/\s+/).slice(0, 5).join(" ");
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : "New Conversation";
}
