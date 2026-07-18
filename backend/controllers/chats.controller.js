import { ai } from "../index.js";
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
    const systemInstruction = `At the beginning of every response, include the chat title in this exact format:

  **title: <chat title>**

  Then leave one blank line and continue with the normal response.

  Rules:

  * Include the title only once.
  * The title should summarize the overall conversation.
  * If the conversation is still on the same topic, keep the existing title.
  * If the topic changes significantly, update the title.
  * Do not mention that you are generating or updating the title.
  * Do not use any other title format.
  `;

    const response = await ai.interactions.create({
      model: "gemini-3.1-flash-lite",
      input: message,
      stream: true,
      previous_interaction_id: previousId,
      system_instruction: systemInstruction,
    });

    let streamedText = "";
    let interactionId = null;
    let title = null;
    let titleExtracted = false;
    let buffer = "";
    let savedConversation = null;
    let savedChat = null;

    for await (const event of response) {
      if (event.event_type === "interaction.created") {
        interactionId = event.interaction.id;
        console.log("Interaction:", interactionId);
        continue;
      }

      if (event.event_type !== "step.delta") continue;
      if (event.delta.type !== "text") continue;

      const textChunk = event.delta.text ?? "";
      process.stdout.write(textChunk);
      if (!textChunk) continue;

      if (!titleExtracted) {
        buffer += textChunk;
        const match = buffer.match(/^\s*\*\*title:\s*(.*?)\*\*\s*/i);
        if (!match) {
          continue;
        }

        title = match[1].trim();
        titleExtracted = true;

        console.log("Title:", title);

        const remaining = buffer.replace(match[0], "");

        if (remaining) {
          streamedText = remaining;
          res.write(
            `event: message\n` +
              `data: ${JSON.stringify({
                type: "chunk",
                text: remaining,
              })}\n\n`,
          );
        }

        buffer = "";
        continue;
      }
      streamedText += textChunk;
      res.write(
        `event: message\n` +
          `data: ${JSON.stringify({
            type: "chunk",
            text: textChunk,
          })}\n\n`,
      );
    }
    const userId = req.user.id;
    if (streamedText.trim()) {
      const result = await saveChatToDB({
        userId,
        userMessage: message,
        assistantMessage: streamedText,
        interactionID: interactionId,
        title,
        chatId,
      });
      savedConversation = result.conversation;
      savedChat = result.savedChat;
    }
    res.write(
      `event: done\ndata: ${JSON.stringify({ type: "done", interactionId, title, text: streamedText, conversation: savedConversation, savedChat })}\n\n`,
    );
    res.end();
  } catch (error) {
    console.error(
      "Error in server-side context execution:",
      error?.stack || error,
    );
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ error: error?.message || "Internal server error" });
    }
    res.write(
      `event: error\ndata: ${JSON.stringify({ error: error?.message || "Internal server error" })}\n\n`,
    );
    res.end();
  }
};

const saveChatToDB = async ({
  userId,
  userMessage,
  assistantMessage,
  interactionID,
  title,
  chatId,
}) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    let conversation;

    if (chatId && !mongoose.Types.ObjectId.isValid(chatId)) {
      throw new Error("Invalid conversation id.");
    }

    if (chatId) {
      conversation = await Conversation.findByIdAndUpdate(
        chatId,
        {
          $set: {
            "chat.interactionID": interactionID,
            "chat.title": title,
          },
        },
        {
          returnDocument: "after",
          session,
          runValidators: true,
        },
      );

      if (!conversation) {
        throw new Error("Conversation not found.");
      }
    } else {
      const conversations = await Conversation.create(
        [
          {
            chat: {
              userId,
              interactionID,
              title,
            },
          },
        ],
        { session },
      );

      conversation = conversations[0];
    }

    const chats = await Chat.create(
      [
        {
          user: {
            input: userMessage,
          },
          assistant: {
            answer: assistantMessage,
          },
          chat: conversation._id,
        },
      ],
      { session },
    );

    const savedChat = chats[0];

    await session.commitTransaction();

    return {
      conversation,
      savedChat,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
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
