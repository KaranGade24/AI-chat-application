import styles from './Screen.module.css'
import { AdIcon, ArrowUp } from 'lucide-react'

export default function ChatInput() {
    return (
        <div className={styles['input-container']}>
            <div className={styles['tools']}>
                <AdIcon />
            </div>

            <textarea
                className={styles['input-area']}
                placeholder="Type a message..."
                rows={1}
                defaultValue=""
                readOnly
            />

            <button type="button" className={`${styles.tools} ${styles.circle}`} aria-label="Send message">
                <ArrowUp />
            </button>
        </div>
    )
}