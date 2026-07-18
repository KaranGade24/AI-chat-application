import express from "express";
import {
  createUser,
  getCurrentUser,
  loginUser,
  logoutUser,
} from "../controllers/user.controller.js";
import authMiddleware from "../middleware/auth.js";
const router = express.Router();

router.post("/register", createUser);
router.post("/login", loginUser);
router.get("/me", authMiddleware, getCurrentUser);
router.post("/logout", authMiddleware, logoutUser);

export default router;
