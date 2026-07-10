import styles from "./Screen.module.css";
import { AdIcon, ArrowUp } from "lucide-react";

export default function ChatInput({ setChatInput, chatInput, handleSubmit }) {
  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(event);
    }
  };

  const handleSendClick = (event) => {
    event.preventDefault();
    handleSubmit(event);
  };

  return (
    <div className={styles["input-container"]}>
      <div className={styles["tools"]}>
        <AdIcon />
      </div>

      <textarea
        className={styles["input-area"]}
        placeholder="Type a message..."
        rows={1}
        value={chatInput}
        onChange={(event) => {
          setChatInput(event.target.value);
        }}
        onKeyDown={handleKeyDown}
      />

      <button
        type="button"
        className={`${styles.tools} ${styles.circle}`}
        aria-label="Send message"
        onClick={handleSendClick}
      >
        <ArrowUp />
      </button>
    </div>
  );
}
