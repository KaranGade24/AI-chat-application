import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import chatRoutes from "./routes/chat.routes.js";
import { initializeAI } from "./config/geminiAPI_config.js";
import { connectDB } from "./config/DB.js";

// Create an Express application
const app = express();

export const ai = initializeAI();

app.use(express.static("public", "dist"));

// Middleware
app.use(
  cors({
    origin: "*",
  }),
);
app.use(express.json());

// DB connection
// connectDB();

// Routes
app.get("/", (req, res) => {
  res.send("Hello from the backend!");
});

// Use the chat routes
app.use("/api/chats", chatRoutes);

app.use("*", express.static("public", "dist"));

const server = app.listen(8080, () => {
  console.log("Server is running on http://localhost:8080");
});
