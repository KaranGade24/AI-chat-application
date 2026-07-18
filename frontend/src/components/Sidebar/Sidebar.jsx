import React from "react";
import styles from "./SideBar.module.css";
import { Plus, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useEffect } from "react";

export default function Sidebar({
  open,
  handleSidebar,
  titles,
  handleNewChat,
  selectedChatId,
  setSelectedChatId,
  onDeleteChat,
}) {
  const navigate = useNavigate();
  const [pendingDelete, setPendingDelete] = useState(null);

  useEffect(() => {
    if (selectedChatId != null) {
      localStorage.setItem("selectedChatId", selectedChatId);
    }

    if (selectedChatId != null) return;
    setSelectedChatId(localStorage.getItem("selectedChatId"));
  }, [selectedChatId]);

  const handleClick = (id) => {
    try {
      setSelectedChatId(id);
      // console.log({ id });
      navigate(`/chat/${id}`);
      handleSidebar();
    } catch (error) {
      console.error("Error in handling click");
    }
  };

  const titleOfConversations = titles.map((title, index) => {
    const isActive = selectedChatId === title._id;

    return (
      <div className={styles.chatRow} key={title._id ?? index}>
        <button
          onClick={() => handleClick(title._id)}
          className={`${styles.chatItem} ${isActive ? styles.active : ""}`}
          title={title.chat.title}
        >
          {title.chat.title}
        </button>
        <button
          className={styles.deleteButton}
          aria-label={`Delete ${title.chat.title}`}
          onClick={(event) => {
            event.stopPropagation();
            setPendingDelete(title);
          }}
        >
          <Trash2 size={15} />
        </button>
      </div>
    );
  });
  return (
    <aside className={`${styles.sidebar} ${open ? styles.open : ""}`}>
      <div className={styles.header}>
        <div className={styles.title}>Conversation</div>
        {/* btn to close or open the sidebar  */}
        <button
          className={styles.iconButton}
          aria-label="Close sidebar"
          onClick={handleSidebar}
        >
          <X size={18} />
        </button>
      </div>

      {/* Btn to add the new chat */}
      <button className={styles.newChat} onClick={handleNewChat}>
        <Plus size={16} />
        <span>New chat</span>
      </button>

      <div className={styles.chatList}>
        {titles.length > 0 && titleOfConversations}
        {/* <button className={styles.chatItem}>Sample conversation</button>
                <button className={styles.chatItem}>Static preview</button> */}
      </div>

      {pendingDelete && (
        <div className={styles.confirmOverlay}>
          <div className={styles.confirmBox}>
            <p>Delete this conversation?</p>
            <div className={styles.confirmActions}>
              <button
                className={styles.cancelButton}
                onClick={() => setPendingDelete(null)}
              >
                Cancel
              </button>
              <button
                className={styles.confirmButton}
                onClick={() => {
                  onDeleteChat?.(pendingDelete._id);
                  setPendingDelete(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
