import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
const mongoUri = process.env.MONGODB_URI;

export const connectDB = async () => {
  try {
    console.log(mongoUri);
    const conn = await mongoose.connect(`${mongoUri}`);

    console.log("MongoDB Connected");
    console.log("Host:", conn.connection.host);
    console.log("Database:", conn.connection.name);
  } catch (error) {
    console.error("MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};
