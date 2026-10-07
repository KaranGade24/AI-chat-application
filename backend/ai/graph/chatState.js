import { Annotation } from "@langchain/langgraph";

/**
 * ChatStateAnnotation defines the state schema for our LangGraph workflow.
 * State flows between nodes:
 * START -> getHistory -> analyzeMessage -> (executeTool)? -> generateResponse -> saveMessage -> END
 */
export const ChatStateAnnotation = Annotation.Root({
  // Incoming request properties
  message: Annotation({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => "",
  }),
  chatId: Annotation({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => null,
  }),
  userId: Annotation({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => null,
  }),
  isNewChat: Annotation({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => false,
  }),

  // Conversation metadata
  title: Annotation({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => null,
  }),

  // Message history (LangChain BaseMessage objects)
  history: Annotation({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => [],
  }),

  // Detected user intent
  intent: Annotation({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => "normal_question",
  }),

  // Tool execution parameters & outputs
  toolInput: Annotation({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => null,
  }),
  toolResults: Annotation({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => null,
  }),

  // AI Generated response
  response: Annotation({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => "",
  }),

  // MongoDB persisted records
  savedConversation: Annotation({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => null,
  }),
  savedChat: Annotation({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => null,
  }),

  // Error handling
  error: Annotation({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => null,
  }),
});
