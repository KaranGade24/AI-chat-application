import React from 'react'
import styles from './Screen.module.css'

function ChatWindow() {
    return (
        <div className={styles['chat-win']}>
            <div className={styles['initial-text']}>
                This is a static interface preview. The chat experience has been simplified to keep the layout visible.
            </div>

            <div className={`${styles.message} ${styles.assistant}`}>
                <div className={styles.messageActions}>
                    <span className={styles.roleLabel}>Assistant</span>
                </div>
                <div className={styles.messageBody}>
                    <p className={styles.messageParagraph}>Welcome to the UI-only version.</p>
                </div>
            </div>

            <div className={`${styles.message} ${styles.user}`}>
                <div className={styles.messageBody}>
                    <p className={styles.messageParagraph}>The interactive behavior has been removed.</p>
                </div>
            </div>
        </div>
    )
}

export default ChatWindow