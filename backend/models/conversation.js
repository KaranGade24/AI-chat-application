import mongoose from "mongoose";

const chatInfoSchema = new mongoose.Schema(
  {
    chat: {
      interactionID: {
        type: String,
        default: "",
      },
      title: {
        type: String,
        default: "",
      },
    },
  },
  { timestamps: true },
);

export const Conversation = mongoose.model("Conversation", chatInfoSchema);
