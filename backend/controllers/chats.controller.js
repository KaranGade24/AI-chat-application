import { stdout } from "process";
import { ai } from "../index.js";
let savedChats = [];
import { writeFileSync, readFileSync, existsSync } from "fs";

export const createChat = async (req, res) => {
  try {
    console.log("Received request body:", req.body);
    let { message, previousId, isNewChat } = req.body;
    console.log({ message, previousId, isNewChat });
    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message cannot be empty" });
    }
    message = message.trim();
    const prompt = isNewChat
      ? `You are an AI assistant.

The user's first message is:
"${message}"

Respond ONLY in this JSON format:

{
  "title": "Short chat title under 6 words",
  "answer": "Your complete answer"
}`
      : message;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    const systemInstruction = `At the beginning of every response, include the chat title in this exact format:

**title: <chat title>**

Then leave one blank line and continue with the normal response.

Rules:

* Include the title only once.
* The title should summarize the overall conversation.
* If the conversation is still on the same topic, keep the existing title.
* If the topic changes significantly, update the title.
* Do not mention that you are generating or updating the title.
* Do not use any other title format.
`;

    const response = await ai.interactions.create({
      model: "gemini-3.1-flash-lite",
      input: message,
      stream: true,
      previous_interaction_id: previousId,
      system_instruction: systemInstruction,
    });

    let streamedText = "";
    let interactionId = null;
    let title = null;
    let titleExtracted = false;
    let buffer = "";

    for await (const event of response) {
      if (event.event_type === "interaction.created") {
        interactionId = event.interaction.id;
        console.log("Interaction:", interactionId);
        continue;
      }

      if (event.event_type !== "step.delta") continue;
      if (event.delta.type !== "text") continue;

      const textChunk = event.delta.text ?? "";
      process.stdout.write(textChunk);
      if (!textChunk) continue;

      if (!titleExtracted) {
        buffer += textChunk;
        const match = buffer.match(/^\*\*title:\s*(.*?)\*\*\s*\n?/i);

        if (!match) {
          continue;
        }

        title = match[1].trim();
        titleExtracted = true;

        console.log("Title:", title);

        const remaining = buffer.replace(match[0], "");

        if (remaining) {
          streamedText = remaining;
          res.write(
            `event: message\n` +
              `data: ${JSON.stringify({
                type: "chunk",
                text: remaining,
              })}\n\n`,
          );
        }

        buffer = "";
        continue;
      }
      streamedText += textChunk;
      res.write(
        `event: message\n` +
          `data: ${JSON.stringify({
            type: "chunk",
            text: textChunk,
          })}\n\n`,
      );
    }

    res.write(
      `event: done\ndata: ${JSON.stringify({ type: "done", interactionId, title, text: streamedText })}\n\n`,
    );
    res.end();
  } catch (error) {
    console.error(
      "Error in server-side context execution:",
      error?.stack || error,
    );
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ error: error?.message || "Internal server error" });
    }
    res.write(
      `event: error\ndata: ${JSON.stringify({ error: error?.message || "Internal server error" })}\n\n`,
    );
    res.end();
  }
};

export const saveChats = async (req, res) => {
  try {
    const { chats } = req.body;
    console.log({ chats });
    if (!Array.isArray(chats)) {
      return res.status(400).json({ error: "Invalid chats payload" });
    }
    savedChats = chats;

    writeFileSync(
      "savedChats.json",
      JSON.stringify(savedChats, null, 2) + "\n",
      "utf-8",
    );

    // console.log("Saved chats received from frontend:", JSON.stringify(savedChats, null, 2));
    return res.json({ success: true });
  } catch (error) {
    console.error("Error saving chats:", error);
    return res.status(500).json({ error: "Failed to save chats" });
  }
};

export const getSavedChats = async (req, res) => {
  try {
    if (!existsSync("savedChats.json")) {
      return res.json({ chats: [] });
    }
    console.log("fetching saved chats");
    const chats = JSON.parse(readFileSync("savedChats.json", "utf8"));
    // console.log({ chats });
    return res.json({ chats });
  } catch (error) {
    console.error("Error fetching saved chats:", error);
    return res.status(500).json({ error: "Failed to fetch saved chats" });
  }
};
