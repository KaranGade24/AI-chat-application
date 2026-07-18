import { MessageSquareOff } from "lucide-react";
import styles from "./ChatNotFound.module.css";

function ChatNotFound({
  message = "The chat you're looking for doesn't exist or may have been deleted.",
}) {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconContainer}>
          <MessageSquareOff size={42} />
        </div>

        <h2 className={styles.title}>Chat Not Found</h2>

        <p className={styles.message}>{message}</p>

        <button
          className={styles.button}
          onClick={() => (window.location.href = "/")}
        >
          Back to Chats
        </button>
      </div>
    </div>
  );
}

export default ChatNotFound;
