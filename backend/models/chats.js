import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    user: {
      input: {
        type: String,
        required: true,
      },
    },

    assistant: {
      answer: {
        type: String,
        default: "",
      },
    },

    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export const Chat = mongoose.model("Chat", chatSchema);
