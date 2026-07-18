import React, { useCallback, useEffect, useMemo, useRef } from "react";
import styles from "./Screen.module.css";

function ChatWindow({ messages }) {
  // console.log({ messages });
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  const Messages = messages.map((message, index) => {
    const hasAssistantAnswer =
      typeof message?.assistant?.answer === "string" &&
      message.assistant.answer.trim() !== "";

    return (
      <React.Fragment key={index}>
        {message?.user?.input !== "" && (
          <div className={`${styles.message} ${styles.user}`}>
            <div className={styles.messageBody}>
              <p className={styles.messageParagraph}>
                {" "}
                {message?.user?.input}{" "}
              </p>
            </div>
          </div>
        )}

        {hasAssistantAnswer ? (
          <div className={`${styles.message} ${styles.assistant}`}>
            <div className={styles.messageActions}>
              <span className={styles.roleLabel}>Assistant</span>
            </div>
            <div className={styles.messageBody}>
              <p className={styles.messageParagraph}>
                {" "}
                {message?.assistant?.answer}{" "}
              </p>
            </div>
          </div>
        ) : (
          <div className={`${styles.message} ${styles.assistant}`}>
            <div className={styles.messageActions}>
              <span className={styles.roleLabel}>Assistant</span>
            </div>
            <div className={styles.messageBody}>
              <p className={styles.messageParagraph}>AI is typing...</p>
            </div>
          </div>
        )}
      </React.Fragment>
    );
  });

  return (
    <>
      <div className={styles["chat-win"]}>
        {/* <div className={styles['initial-text']}>
                This is a static interface preview. The chat experience has been simplified to keep the layout visible.
            </div> */}

        {Messages}
      </div>

      <div
        style={{
          width: "0px",
          height: "0px",
          margin: "0px",
          padding: "0px",
          top: "-10px",
        }}
        ref={bottomRef}
      ></div>
    </>
  );
}
export default ChatWindow;
