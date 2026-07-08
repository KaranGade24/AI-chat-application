import { ai } from "../index.js";
let savedChats = []
import { writeFileSync, readFileSync, appendFileSync, existsSync } from "fs"

export const createChat = async (req, res) => {
    try {
        let { message, previousId, isNewChat } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ error: "Message cannot be empty" });
        }
        message = message.trim();

        // 1. Correct Configuration for Interactions API
        const requestConfig = {
            model: "gemini-2.5-flash",
            input: message,  // Use 'input' instead of 'contents'
            stream: true,    // Tell the API to return a stream of events
        };

        // 2. Put previous_interaction_id at the root level
        if (previousId) {
            requestConfig.previous_interaction_id = previousId;
        }

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        // 3. Initiate the interaction (stream: true makes this return an async iterable)
        const stream = await ai.interactions.create(requestConfig);

        let streamedText = "";
        let interactionId = null;

        // 4. Iterate over the stream events securely
        for await (const event of stream) {
            // Capture the interaction ID from the metadata events
            if (event.event_type === "interaction.created" || event.event_type === "interaction.completed") {
                if (event.interaction?.id) {
                    interactionId = event.interaction.id;
                }
            }

            // Capture the actual text chunks as they generate
            if (event.event_type === "step.delta" && event.delta?.type === "text") {
                const textChunk = event.delta.text ?? "";
                if (textChunk) {
                    streamedText += textChunk;
                    res.write(`event: message\ndata: ${JSON.stringify({ type: "chunk", text: textChunk })}\n\n`);
                }
            }
        }

        // Generate title AFTER streaming so the user isn't kept waiting at the start
        let title = null;
        if (isNewChat) {
            try {
                // ai.models.generateContent is correct here as a quick, stateless call
                const titleResponse = await ai.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: `Create a concise chat title for the first user message: "${message}". Keep it under 6 words.`,
                });
                title = titleResponse.text.trim().replace(/^['\"]|['\"]$/g, "");
            } catch (titleError) {
                console.warn("Failed to generate chat title:", titleError);
            }
        }

        // Finalize SSE stream
        res.write(`event: done\ndata: ${JSON.stringify({ interactionId, title, text: streamedText })}\n\n`);
        res.end();
    } catch (error) {
        console.error("Error in server-side context execution:", error);
        if (!res.headersSent) {
            return res.status(500).json({ error: "Internal server error" });
        }
        res.write(`event: error\ndata: ${JSON.stringify({ error: "Internal server error" })}\n\n`);
        res.end();
    }
};

export const saveChats = async (req, res) => {
    try {
        const { chats } = req.body;
        if (!Array.isArray(chats)) {
            return res.status(400).json({ error: "Invalid chats payload" });
        }
        savedChats = chats;
        console.log("Received chats to save:", JSON.stringify(savedChats, null, 2));
        if (existsSync("savedChats.json")) {
            appendFileSync("savedChats.json", JSON.stringify(savedChats, null, 2) + "\n", "utf-8");
        } else {
            writeFileSync("savedChats.json", JSON.stringify(savedChats, null, 2) + "\n", "utf-8");
        }

        // console.log("Saved chats received from frontend:", JSON.stringify(savedChats, null, 2));
        return res.json({ success: true });
    } catch (error) {
        console.error("Error saving chats:", error);
        return res.status(500).json({ error: "Failed to save chats" });
    }
}

export const getSavedChats = async (req, res) => {
    try {
        if (!existsSync("savedChats.json")) {
            return res.json({ chats: [] });
        }
        const lines = readFileSync("savedChats.json", "utf-8").trim().split("\n");
        if (lines.length === 0 || (lines.length === 1 && lines[0] === "")) {
            return res.json({ chats: [] });
        }
        console.log("Fetched saved chats from file:", lines, "Number of lines:", lines.length);
        savedChats = lines.map(line => JSON.parse(line));
        return res.json({ chats: savedChats });
    } catch (error) {
        console.error("Error fetching saved chats:", error);
        return res.status(500).json({ error: "Failed to fetch saved chats" });
    }
};
