import React from "react";
import styles from "./Sidebar.module.css";
import { Plus, X } from "lucide-react";

export default function Sidebar({
  open,
  handleSidebar,
  titles,
  handleNewChat,
}) {
  const titleOfConversations = titles.map((title, index) => {
    return (
      <button key={index} className={styles.chatItem}>
        {title}
      </button>
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
    </aside>
  );
}
