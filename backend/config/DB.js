import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

export const connectDB = async () => {
  if (!mongoUri) {
    console.error("MongoDB Connection Error: MONGODB_URI or MONGO_URI must be set.");
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(`${mongoUri}`);

    console.log("MongoDB Connected");
    console.log("Host:", conn.connection.host);
    console.log("Database:", conn.connection.name);
  } catch (error) {
    console.error("MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};
