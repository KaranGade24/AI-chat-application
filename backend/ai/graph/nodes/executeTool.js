import { calculate } from "../../tools/calculatorTool.js";
import { searchWeb } from "../../tools/webSearchTool.js";
import { getConversationHistory } from "../../tools/chatHistoryTool.js";

/**
 * Node: executeTool
 * Executes selected tool based on detected intent and populates toolResults in state.
 */
export const executeToolNode = async (state) => {
  const { intent, toolInput, message, chatId } = state;
  let toolResults = null;

  try {
    switch (intent) {
      case "calculator": {
        const expr = toolInput || message;
        toolResults = calculate(expr);
        break;
      }

      case "web_search": {
        const query = toolInput || message;
        toolResults = await searchWeb(query);
        break;
      }

      case "conversation_history":
      case "summarize": {
        toolResults = await getConversationHistory({ chatId, limit: 20 });
        break;
      }

      default:
        toolResults = null;
    }

    return { toolResults };
  } catch (err) {
    console.error(`Error in executeToolNode (${intent}):`, err);
    return {
      toolResults: `Tool execution failed: ${err.message}`,
    };
  }
};
