import { StateGraph, START, END } from "@langchain/langgraph";
import { ChatStateAnnotation } from "./chatState.js";
import { getHistoryNode } from "./nodes/getHistory.js";
import { analyzeMessageNode } from "./nodes/analyzeMessage.js";
import { executeToolNode } from "./nodes/executeTool.js";
import { generateResponseNode } from "./nodes/generateResponse.js";
import { saveMessageNode } from "./nodes/saveMessage.js";

/**
 * Conditional routing logic based on detected user intent
 */
const routeAfterAnalysis = (state) => {
  const toolIntents = [
    "calculator",
    "web_search",
    "conversation_history",
    "summarize",
  ];

  if (toolIntents.includes(state.intent)) {
    return "executeTool";
  }
  return "generateResponse";
};

/**
 * Build and compile the LangGraph chat workflow
 */
const workflow = new StateGraph(ChatStateAnnotation)
  .addNode("getHistory", getHistoryNode)
  .addNode("analyzeMessage", analyzeMessageNode)
  .addNode("executeTool", executeToolNode)
  .addNode("generateResponse", generateResponseNode)
  .addNode("saveMessage", saveMessageNode)
  // Define Graph Edges
  .addEdge(START, "getHistory")
  .addEdge("getHistory", "analyzeMessage")
  .addConditionalEdges("analyzeMessage", routeAfterAnalysis, {
    executeTool: "executeTool",
    generateResponse: "generateResponse",
  })
  .addEdge("executeTool", "generateResponse")
  .addEdge("generateResponse", "saveMessage")
  .addEdge("saveMessage", END);

export const chatGraph = workflow.compile();

/**
 * Helper to run the LangGraph workflow with real-time SSE chunk streaming
 * @param {Object} params
 * @param {string} params.message
 * @param {string|null} params.chatId
 * @param {string} params.userId
 * @param {boolean} [params.isNewChat=false]
 * @param {Function} [params.onChunk]
 */
export const runChatGraphStream = async ({
  message,
  chatId = null,
  userId = null,
  isNewChat = false,
  onChunk,
}) => {
  const initialState = {
    message,
    chatId,
    userId,
    isNewChat,
    history: [],
    intent: "normal_question",
    toolInput: null,
    toolResults: null,
    response: "",
    savedConversation: null,
    savedChat: null,
    error: null,
  };

  const finalState = await chatGraph.invoke(initialState, {
    configurable: {
      onChunk,
    },
  });

  return finalState;
};

/**
 * Helper to run the LangGraph workflow synchronously / non-streaming
 */
export const runChatGraph = async ({
  message,
  chatId = null,
  userId = null,
  isNewChat = false,
}) => {
  return runChatGraphStream({
    message,
    chatId,
    userId,
    isNewChat,
    onChunk: null,
  });
};
