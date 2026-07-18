import React, { useEffect, useRef, useState } from "react";
import styles from "./Screen.module.css";
import Sidebar from "../Sidebar/Sidebar";
import ChatInput from "./ChatInput";
import ChatWindow from "./ChatWindow";
import { Menu, User } from "lucide-react";
import { useMemo } from "react";
import { useContext } from "react";
import { UserContext } from "../../context/UserContextProvider";
import { useNavigate } from "react-router-dom";
import ChatNotFound from "../ChatNotFound/ChatNotFound";

function Screen({ chatId }) {
  const { user } = useContext(UserContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [interactionID, setInteractionID] = useState(null);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatInfo, setChatInfo] = useState(null);
  const [titles, setTitles] = useState([]);
  const [isNewChat, setIsNewChat] = useState(chatId === "new" ? true : false);
  const [updateInfo, setUpdateInfo] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState(
    chatId === "new" ? null : chatId,
  );
  const activeConversationRef = useRef(
    chatId && chatId !== "new" ? chatId : null,
  );
  const chatInfoRef = useRef(chatInfo);
  const interactionIdRef = useRef(null);
  const navigate = useNavigate();
  const apiUrl = useMemo(
    () => import.meta.env.VITE_API_URL || `${location.origin}/api/`,
    [],
  );
  const normalizeChatInfo = (value) => {
    if (!value) return null;

    if (typeof value === "string") {
      return {
        id: value,
        interactionID: null,
        title: null,
      };
    }

    return {
      id: value?._id ?? value?.id ?? null,
      interactionID: value?.chat?.interactionID ?? value?.interactionID ?? null,
      title: value?.chat?.title ?? value?.title ?? null,
    };
  };
  const handleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };
  const handleNewChat = () => {
    setMessages([]);
    setIsNewChat(true);
    setInteractionID(null);
    setSidebarOpen(false);
    setAiResponse("");
    setChatInfo(null);
    chatInfoRef.current = null;
    interactionIdRef.current = null;
    activeConversationRef.current = null;
    navigate("/chat/new");
    setSelectedChatId(null);
  };

  const handleDeleteChat = async (chatToDelete) => {
    if (!chatToDelete) return;

    try {
      const response = await fetch(`${apiUrl}chats/delete/${chatToDelete}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result?.message || "Failed to delete chat.");
      }

      setTitles((prev) => prev.filter((item) => item._id !== chatToDelete));

      if (
        selectedChatId === chatToDelete ||
        activeConversationRef.current === chatToDelete
      ) {
        setMessages([]);
        setError("");
        setChatInfo(null);
        chatInfoRef.current = null;
        interactionIdRef.current = null;
        activeConversationRef.current = null;
        setSelectedChatId(null);
        setIsNewChat(true);
        navigate("/chat/new");
      }
    } catch (err) {
      console.error("Error deleting chat", err);
      setError(err.message || "Could not delete chat.");
    }
  };

  const getTitles = async () => {
    try {
      const response = await fetch(`${apiUrl}chats/saved`, {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const result = await response.json();

        const titles = result?.conversations.map((msg) => {
          return msg;
        });
        setTitles(titles);
      }
    } catch (err) {
      console.error("Error in getting the chat", err);
    }
  };

  const getSavedMessagesById = async (chatId) => {
    if (!chatId) return;

    setLoading(true);
    setError("");
    setMessages([]);

    try {
      const response = await fetch(`${apiUrl}chats/saved/${chatId}`, {
        method: "GET",
        credentials: "include",
      });

      let result = {};

      try {
        result = await response.json();
      } catch {
        throw new Error("Invalid response from server.");
      }

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch chat.");
      }

      setMessages(
        result.chats.map((chat) => ({
          ...chat,

          assistant: {
            ...chat.assistant,
          },

          user: {
            ...chat.user,
          },
        })),
      );
    } catch (err) {
      console.error(err);

      setMessages([]);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const saveChats = async () => {
    try {
      // add messages + chatInfo to the request body
      const chats = messages[messages.length - 1];
      const answer = chats?.assistant?.answer || "";
      if (answer === undefined || answer === null || answer.trim() === "") {
        console.info("Skipping saveChats due to empty answer");
        return;
      }

      const response = await fetch(`${apiUrl}chats/save`, {
        body: JSON.stringify({ chats, chatInfo, updateInfo }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        const result = await response.json();
      }
    } catch (err) {
      console.error("Error in saveing the chats", err);
    }
  };

  const sendQueryToAI = async (
    chatInput = null,
    previousId = null,
    isNewChat = false,
    messageIndex,
  ) => {
    const activeChatId = activeConversationRef.current;
    try {
      const data = {
        message: chatInput,
        previousId,
        isNewChat,
        chatId: activeChatId,
      };
      const response = await fetch(`${apiUrl}chats/new`, {
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
        credentials: "include",
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

              updated[messageIndex] = {
                ...updated[messageIndex],
                assistant: {
                  ...updated[messageIndex].assistant,
                  answer,
                },
              };

              return updated;
            });
          }

          if (eventName === "done") {
            setMessages((prev) => {
              if (prev.length === 0) return prev;

              const updated = [...prev];

              updated[messageIndex] = {
                ...updated[messageIndex],
                assistant: {
                  ...updated[messageIndex].assistant,
                  answer: json.text ?? updated[messageIndex].assistant?.answer,
                },
              };

              return updated;
            });

            if (chatInfo?.title === json.title) {
              setUpdateInfo(false);
            } else {
              if (!isNewChat) {
                setUpdateInfo(true);
              }
            }

            const conversation = json.conversation;
            const nextInteractionId =
              json.interactionId ?? conversation?.chat?.interactionID ?? null;
            const nextChatInfo = normalizeChatInfo({
              _id: conversation?._id ?? null,
              chat: {
                interactionID: nextInteractionId,
                title: conversation?.chat?.title ?? json.title ?? null,
              },
            });

            setChatInfo((prev) => ({ ...(prev ?? {}), ...nextChatInfo }));
            chatInfoRef.current = nextChatInfo;
            interactionIdRef.current = nextChatInfo?.interactionID ?? null;
            activeConversationRef.current = nextChatInfo?.id ?? null;

            setIsNewChat(false);
            if (conversation?._id) {
              navigate(`/chat/${conversation._id}`);
              setSelectedChatId(conversation._id);
            }

            setTitles((prev) => {
              if (!conversation) return prev;

              // Remove the conversation if it already exists
              const filtered = prev.filter(
                (item) => item._id !== conversation._id,
              );

              // Add it back to the top
              return [conversation, ...filtered];
            });

            // Optional
            setInteractionID(conversation?.chat?.interactionID ?? null);
          }
        }
      }
    } catch (err) {
      console.error("error in seding to AI", err);
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
      };

      const currentChatId = activeConversationRef.current;
      const shouldAppendToExistingChat = Boolean(
        currentChatId && currentChatId !== "new",
      );
      const updatedMessages = shouldAppendToExistingChat
        ? [...messages, newMessage]
        : [newMessage];

      setMessages(updatedMessages);

      setAiResponse("");
      setChatInput("");

      const previousId =
        shouldAppendToExistingChat && interactionIdRef.current
          ? interactionIdRef.current
          : shouldAppendToExistingChat && chatInfoRef.current?.interactionID
            ? chatInfoRef.current.interactionID
            : null;

      await sendQueryToAI(
        input,
        previousId,
        !shouldAppendToExistingChat,
        updatedMessages.length - 1,
      );
    }
  };

  useEffect(() => {
    const url = location.href.includes("chat/new");
    if (url) {
      setSelectedChatId(null);
    }
  }, [location.href]);

  useEffect(() => {
    getTitles();
  }, [user]);

  useEffect(() => {
    if (chatId === "new") {
      setIsNewChat(true);
      setMessages([]);
      setLoading(false);
      setChatInfo(null);
      chatInfoRef.current = null;
      interactionIdRef.current = null;
      activeConversationRef.current = null;
      return;
    }

    if (!selectedChatId) return;
    const chat = titles.find((item) => item._id === selectedChatId);

    if (chat) {
      const normalizedChat = normalizeChatInfo(chat);
      setChatInfo(normalizedChat);
      chatInfoRef.current = normalizedChat;
      interactionIdRef.current = normalizedChat?.interactionID ?? null;
    }

    setMessages([]);
    setLoading(true);
    getSavedMessagesById(selectedChatId);
  }, [selectedChatId, chatId, titles]);

  // useEffect(() => {
  //   if (messages.length === 0) return;

  //   const interactionId = chatInfo?.interactionID;
  //   const title = chatInfo?.title;

  //   if (
  //     typeof interactionId === "string" &&
  //     interactionId.trim() !== "" &&
  //     typeof title === "string" &&
  //     title.trim() !== ""
  //   ) {
  //     saveChats();
  //   }
  // }, [messages]);

  useEffect(() => {
    activeConversationRef.current =
      selectedChatId ||
      chatInfo?.id ||
      (chatId && chatId !== "new" ? chatId : null);
    chatInfoRef.current = chatInfo;
    if (chatInfo?.interactionID) {
      interactionIdRef.current = chatInfo.interactionID;
    }
  }, [selectedChatId, chatInfo, chatId]);

  return (
    <div className={styles["main-screen"]}>
      <Sidebar
        open={sidebarOpen}
        handleSidebar={handleSidebar}
        titles={titles}
        handleNewChat={handleNewChat}
        selectedChatId={selectedChatId}
        setSelectedChatId={setSelectedChatId}
        onDeleteChat={handleDeleteChat}
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

        {loading && !messages.length && !error ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <span>Loading conversation...</span>
          </div>
        ) : error ? (
          <ChatNotFound message={error} />
        ) : (
          <ChatWindow messages={messages} />
        )}

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
