import { Chat } from "../../models/chats.js";
import mongoose from "mongoose";

/**
 * Tool to retrieve conversation history from MongoDB
 * @param {Object} params
 * @param {string} params.chatId - The conversation ID
 * @param {number} [params.limit=10] - Number of previous messages to fetch
 */
export const getConversationHistory = async ({ chatId, limit = 10 }) => {
  try {
    if (!chatId || !mongoose.Types.ObjectId.isValid(chatId)) {
      return "No prior conversation found for this session.";
    }

    const chats = await Chat.find({ chat: chatId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    if (!chats || chats.length === 0) {
      return "No prior messages recorded in this conversation.";
    }

    // Reverse to chronological order
    const chronologicalChats = chats.reverse();

    const formattedHistory = chronologicalChats
      .map((entry, idx) => {
        const userMsg = entry.user?.input || "";
        const botMsg = entry.assistant?.answer || "";
        return `[Turn ${idx + 1}]\nUser: ${userMsg}\nAssistant: ${botMsg}`;
      })
      .join("\n\n");

    return formattedHistory;
  } catch (err) {
    console.error("Error in getConversationHistory tool:", err);
    return `Failed to retrieve conversation history: ${err.message}`;
  }
};
