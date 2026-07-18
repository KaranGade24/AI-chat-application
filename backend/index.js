import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
dotenv.config();
import chatRoutes from "./routes/chat.routes.js";
import userRoutes from "./routes/user.routes.js";
import { initializeAI } from "./config/geminiAPI_config.js";
import { connectDB } from "./config/DB.js";
import path from "path";
import cookieParser from "cookie-parser";
import authMiddleware from "./middleware/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create an Express application
const app = express();

export const ai = initializeAI();

app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public", "dist")));

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://ai-chat-application-8t31.onrender.com",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true, // Allow cookies to be sent
  }),
);
app.use(express.json());

// DB connection
connectDB();

// Routes
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Backend is running",
  });
});

// Use the chat routes
app.use("/api/chats", authMiddleware, chatRoutes);

// Use the user routes
app.use("/api/users", userRoutes);

// React routes
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "public", "dist", "index.html"));
});

// Start the server

const server = app.listen(8080, () => {
  console.log("Server is running on http://localhost:8080");
});
