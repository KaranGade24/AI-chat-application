import express from "express";
const router = express.Router();

import {
  createChat,
  // saveChats,
  getSavedChats,
  getChatById,
  deleteChat,
} from "../controllers/chats.controller.js";

// Route to handle chat creation
router.post("/new", createChat);

// Route to save chats
// router.post("/save", saveChats);

// Route to get saved chats
router.get("/saved", getSavedChats);

// Route to get saved chats by Id
router.get("/saved/:chatId", getChatById);

// Route to delete a conversation
router.delete("/delete/:chatId", deleteChat);

export default router;
