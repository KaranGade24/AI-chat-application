import { runChatGraphStream } from "../ai/index.js";
import { Conversation } from "../models/conversation.js";
import { Chat } from "../models/chats.js";
import mongoose from "mongoose";

export const createChat = async (req, res) => {
  try {
    console.log("Received request body:", req.body);
    let { message, previousId, isNewChat, chatId } = req.body;
    console.log({ message, previousId, isNewChat });

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message cannot be empty" });
    }
    message = message.trim();

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const userId = req.user?.id;

    // Stream LLM chunks to SSE client in real time via LangGraph workflow
    const result = await runChatGraphStream({
      message,
      chatId,
      userId,
      isNewChat: Boolean(isNewChat),
      onChunk: (textChunk) => {
        res.write(
          `event: message\n` +
            `data: ${JSON.stringify({
              type: "chunk",
              text: textChunk,
            })}\n\n`,
        );
      },
    });

    const interactionId =
      result.savedConversation?.chat?.interactionID ||
      previousId ||
      `graph_${Date.now()}`;

    // Emit the done event payload conforming to frontend contract
    res.write(
      `event: done\ndata: ${JSON.stringify({
        type: "done",
        interactionId,
        title: result.title,
        text: result.response,
        conversation: result.savedConversation,
        savedChat: result.savedChat,
      })}\n\n`,
    );
    res.end();
  } catch (error) {
    console.error(
      "Error in server-side LangGraph execution:",
      error?.stack || error,
    );
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ error: error?.message || "Internal server error" });
    }
    res.write(
      `event: error\ndata: ${JSON.stringify({
        error: error?.message || "Internal server error",
      })}\n\n`,
    );
    res.end();
  }
};


export const getSavedChats = async (req, res) => {
  try {
    console.log("fetching saved chats");

    const userId = req.user?.id;
    console.log({ userId });
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const conversations = await Conversation.find({
      "chat.userId": userId,
    }).sort({ updatedAt: -1 });

    // console.log({ conversations });
    conversations.map((conversation) => {
      console.log(conversation);
    });

    return res.json({ conversations });
  } catch (error) {
    console.error("Error fetching saved chats:", error);
    return res.status(500).json({ error: "Failed to fetch saved chats" });
  }
};

export const getChatById = async (req, res) => {
  try {
    const { chatId } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid chat ID.",
      });
    }

    const chats = await Chat.find({ chat: chatId }).populate("chat");

    if (!chats.length) {
      return res.status(404).json({
        success: false,
        error: "No messages found for this chat.",
      });
    }

    return res.status(200).json({
      success: true,
      chats,
    });
  } catch (error) {
    console.error("Error fetching chat:", error);

    return res.status(500).json({
      success: false,
      error: "Something went wrong. Please try again later.",
    });
  }
};

export const deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid chat id",
      });
    }

    await Chat.deleteMany({
      chat: chatId,
    });

    await Conversation.findByIdAndDelete(chatId);

    return res.json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
