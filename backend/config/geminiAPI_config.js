import { GoogleGenAI } from "@google/genai"

console.log("GOOGLE_API_KEY:", process.env.GOOGLE_API_KEY);

export const initializeAI = () => {
    const ai = new GoogleGenAI({
        apiKey: process.env.GOOGLE_API_KEY,
    });

    return ai;
}

