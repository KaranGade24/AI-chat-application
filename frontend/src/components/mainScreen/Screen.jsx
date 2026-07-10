import React, { useEffect, useState } from "react";
import styles from "./Screen.module.css";
import Sidebar from "../Sidebar/Sidebar";
import ChatInput from "./ChatInput";
import ChatWindow from "./ChatWindow";
import { Menu } from "lucide-react";
import { useMemo } from "react";

function Screen() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [interactionID, setInteractionID] = useState(null);
  const [messages, setMessages] = useState([]);
  const [titles, setTtiles] = useState([]);
  const [isNewChat, setIsNewChat] = useState(true);
  const [conversationId, setConversationId] = useState(null);
  const apiUrl = useMemo(() => import.meta.env.VITE_API_URL || "api/", []);
  const handleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };
  const handleNewChat = () => {
    setMessages([]);
    setInteractionID(null);
    setSidebarOpen(false);
    setAiResponse("");
  };
  console.log("API URL:", apiUrl);
  const getSavedMessages = async () => {
    try {
      const response = await fetch(`${apiUrl}chats/saved`, {
        method: "GET",
      });
      if (response.ok) {
        const result = await response.json();
        console.log(result);
        setMessages(result.chats);
      }
    } catch (err) {
      console.error("Error in getting the chat", err);
    }
  };

  const saveChats = async () => {
    try {
      const chats = messages;
      const response = await fetch(`${apiUrl}chats/save`, {
        body: JSON.stringify({ chats }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (response.ok) {
        const result = await response.json();
        console.log({ result });
      }
    } catch (err) {
      console.error("Error in saveing the chats", err);
    }
  };

  const sendQueryToAI = async (
    chatInput = null,
    previousId = null,
    isNewChat = false,
  ) => {
    try {
      const data = { message: chatInput, previousId, isNewChat };
      console.log("Sending to AI:", data);
      const response = await fetch(`${apiUrl}chats/new`, {
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok || !response.body) {
        throw new Error(`AI request failed with status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let buffer = "";
      let answer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const event of events) {
          const lines = event.split("\n");

          let eventName = "";
          let json = null;

          for (const line of lines) {
            if (line.startsWith("event:")) {
              eventName = line.replace("event:", "").trim();
            }

            if (line.startsWith("data:")) {
              const raw = line.replace("data:", "").trim();
              try {
                json = JSON.parse(raw);
              } catch (err) {
                console.warn("Invalid SSE payload:", raw, err);
              }
            }
          }

          if (!json) continue;

          if (eventName === "message") {
            const textChunk = json.text ?? "";
            if (!textChunk) continue;

            answer += textChunk;
            setAiResponse(answer);

            setMessages((prev) => {
              if (prev.length === 0) return prev;

              const updated = [...prev];
              const lastIndex = updated.length - 1;

              updated[lastIndex] = {
                ...updated[lastIndex],
                assistant: {
                  ...updated[lastIndex].assistant,
                  answer,
                },
              };

              return updated;
            });
          }

          if (eventName === "done") {
            console.log("Interaction ID:", json.interactionId);
            console.log("Title:", json.title);

            setMessages((prev) => {
              if (prev.length === 0) return prev;

              const updated = [...prev];
              const lastIndex = updated.length - 1;

              updated[lastIndex] = {
                ...updated[lastIndex],
                assistant: {
                  ...updated[lastIndex].assistant,
                  answer: json.text ?? updated[lastIndex].assistant?.answer,
                },
                chat: {
                  ...updated[lastIndex].chat,
                  interactionID:
                    json.interactionId ??
                    updated[lastIndex].chat?.interactionID,
                  title: json.title ?? updated[lastIndex].chat?.title,
                },
              };

              return updated;
            });

            setInteractionID((prev) => json.interactionId ?? prev);
          }
        }
      }
    } catch (err) {
      console.log("error in seding to AI", err);
    }
  };

  const handleSubmit = async (e) => {
    if (e?.type === "click" || (e?.key === "Enter" && !e?.shiftKey)) {
      e?.preventDefault?.();

      const input = chatInput.trim();
      if (!input) return;

      // const isNewChat =
      //   messages.length === 0 ||
      //   !messages[messages.length - 1]?.chat?.interactionID;
      const newMessage = {
        user: {
          input,
        },
        assistant: {
          answer: "",
        },
        chat: { title: "", interactionID: Date.now() },
      };

      if (isNewChat) {
        setMessages([newMessage]);
        setAiResponse("");
      } else {
        setMessages((prev) => [...prev, newMessage]);
      }

      setChatInput("");

      const previousId =
        !isNewChat && messages.length > 0
          ? messages[messages.length - 1].chat?.interactionID
          : null;

      await sendQueryToAI(input, previousId, isNewChat);
    }
  };

  useEffect(() => {
    messages.length === 0 ? setIsNewChat(true) : setIsNewChat(false);

    if (messages.length === 0) return;
    const titles = messages
      .map((msg) => msg?.chat?.title)
      .filter((title) => title && title.trim() !== "");

    setTtiles(titles);
  }, [messages]);

  useEffect(() => {
    getSavedMessages();
  }, [conversationId]);

  useEffect(() => {
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    const interactionId = lastMessage?.chat?.interactionID;
    const title = lastMessage?.chat?.title;

    if (
      typeof interactionId === "string" &&
      interactionId.trim() !== "" &&
      typeof title === "string" &&
      title.trim() !== ""
    ) {
      saveChats();
    }
  }, [messages]);

  return (
    <div className={styles["main-screen"]}>
      <Sidebar
        open={sidebarOpen}
        handleSidebar={handleSidebar}
        titles={titles}
        handleNewChat={handleNewChat}
      />

      <div className={styles["screen-content"]}>
        <div className={styles["top-bar"]}>
          <button
            className={styles["sidebar-toggle"]}
            aria-label="Toggle sidebar"
            onClick={handleSidebar}
          >
            <Menu size={16} />
            {/* <span>New chat</span> */}
          </button>
          <div className={styles["current-chat"]}>Static UI</div>
        </div>

        <ChatWindow messages={messages} />
        <ChatInput
          setChatInput={setChatInput}
          chatInput={chatInput}
          handleSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}

export default Screen;
