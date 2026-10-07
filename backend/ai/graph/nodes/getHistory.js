import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { Chat } from "../../../models/chats.js";
import { Conversation } from "../../../models/conversation.js";
import mongoose from "mongoose";

/**
 * Node: getHistory
 * Retrieves past conversation messages from MongoDB and converts them
 * into LangChain BaseMessage objects for context-aware reasoning.
 */
export const getHistoryNode = async (state) => {
  const { chatId } = state;

  if (!chatId || !mongoose.Types.ObjectId.isValid(chatId)) {
    return { history: [], title: state.title || null };
  }

  try {
    // 1. Fetch conversation details to see if there's already a title
    let existingTitle = state.title;
    if (!existingTitle) {
      const conv = await Conversation.findById(chatId).lean();
      if (conv?.chat?.title) {
        existingTitle = conv.chat.title;
      }
    }

    // 2. Fetch recent messages (e.g., last 12 messages = 6 turns)
    const chats = await Chat.find({ chat: chatId })
      .sort({ createdAt: -1 })
      .limit(12)
      .lean();

    const messages = [];
    const orderedChats = (chats || []).reverse();

    for (const entry of orderedChats) {
      if (entry.user?.input) {
        messages.push(new HumanMessage(entry.user.input));
      }
      if (entry.assistant?.answer) {
        messages.push(new AIMessage(entry.assistant.answer));
      }
    }

    return {
      history: messages,
      title: existingTitle,
    };
  } catch (err) {
    console.error("Error loading chat history from MongoDB:", err);
    return {
      history: [],
      error: `Failed to load history: ${err.message}`,
    };
  }
};
