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
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
  },
  { timestamps: true },
);

export const Conversation = mongoose.model("Conversation", chatInfoSchema);
