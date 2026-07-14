import { User } from "../models/user.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const isEmailValid = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
const isPasswordValid = (password) => {
  // Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
};

export const createUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required" });
    }
    if (!isEmailValid(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }
    if (!isPasswordValid(password)) {
      return res.status(400).json({
        message:
          "Invalid password format, must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const token = jwt.sign({ name, email }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    const user = new User({ name, email, password: hashedPassword });

    await user.save();
    // res.cookie("token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production" });
    res.cookie("token", token);
    res.status(201).json({ user, token });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(400).json({ message: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    const token = jwt.sign(
      { name: user.name, email: user.email },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      },
    );

    res.cookie("token", token);
    res.json({ user, token });
  } catch (error) {
    console.error("Error logging in user:", error);
    res.status(400).json({ message: error.message });
  }
};

export const logoutUser = (req, res) => {
  try {
    res.clearCookie("token");
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error logging out user:", error);
    res.status(400).json({ message: error.message });
  }
};
