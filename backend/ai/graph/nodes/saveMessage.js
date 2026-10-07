import { Conversation } from "../../../models/conversation.js";
import { Chat } from "../../../models/chats.js";
import mongoose from "mongoose";

/**
 * Node: saveMessage
 * Persists the user message, assistant answer, and conversation metadata to MongoDB.
 */
export const saveMessageNode = async (state) => {
  const { userId, message, response, chatId, title } = state;

  if (!response || !response.trim()) {
    return { savedConversation: null, savedChat: null };
  }

  // Attempt transaction if MongoDB replica set is available, otherwise graceful fallback
  let session = null;
  let useTransaction = false;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
    useTransaction = true;
  } catch {
    // Standalone MongoDB without replica set
    session = null;
    useTransaction = false;
  }

  try {
    const sessionOption = useTransaction ? { session } : {};

    let conversation = null;

    if (chatId && mongoose.Types.ObjectId.isValid(chatId)) {
      const updateData = {};
      if (title) {
        updateData["chat.title"] = title;
      }

      conversation = await Conversation.findByIdAndUpdate(
        chatId,
        { $set: updateData },
        {
          returnDocument: "after",
          runValidators: true,
          ...sessionOption,
        },
      );
    }

    // If conversation doesn't exist yet, create a new one
    if (!conversation) {
      const convPayload = {
        chat: {
          userId,
          interactionID: `langgraph_${Date.now()}`,
          title: title || "New Conversation",
        },
      };

      if (useTransaction) {
        const created = await Conversation.create([convPayload], sessionOption);
        conversation = created[0];
      } else {
        conversation = await Conversation.create(convPayload);
      }
    }

    // Create the chat message record
    const chatPayload = {
      user: {
        input: message,
      },
      assistant: {
        answer: response,
      },
      chat: conversation._id,
    };

    let savedChat = null;
    if (useTransaction) {
      const createdChats = await Chat.create([chatPayload], sessionOption);
      savedChat = createdChats[0];
      await session.commitTransaction();
    } else {
      savedChat = await Chat.create(chatPayload);
    }

    return {
      savedConversation: conversation,
      savedChat,
      chatId: conversation._id.toString(),
      title: conversation?.chat?.title || title,
    };
  } catch (err) {
    if (useTransaction && session) {
      await session.abortTransaction();
    }
    console.error("Error saving chat to MongoDB in saveMessageNode:", err);
    return {
      error: `Failed to save chat: ${err.message}`,
    };
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};
