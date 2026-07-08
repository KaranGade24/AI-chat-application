import React from 'react'
import styles from './Sidebar.module.css'
import { Plus, X } from 'lucide-react'

export default function Sidebar({ open }) {
    return (
        <aside className={`${styles.sidebar} ${open ? styles.open : ''}`}>
            <div className={styles.header}>
                <div className={styles.title}>Conversation</div>
                <button className={styles.iconButton} aria-label="Close sidebar">
                    <X size={18} />
                </button>
            </div>

            <button className={styles.newChat}>
                <Plus size={16} />
                <span>New chat</span>
            </button>

            <div className={styles.chatList}>
                <button className={styles.chatItem}>Sample conversation</button>
                <button className={styles.chatItem}>Static preview</button>
            </div>
        </aside>
    )
}