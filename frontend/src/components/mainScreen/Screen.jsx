import React from 'react'
import styles from './Screen.module.css'
import Sidebar from '../Sidebar/Sidebar'
import ChatInput from './ChatInput'
import ChatWindow from './ChatWindow'
import { Menu } from 'lucide-react'

function Screen() {
    return (
        <div className={styles['main-screen']}>
            <Sidebar open={true} />

            <div className={styles['screen-content']}>
                <div className={styles['top-bar']}>
                    <button className={styles['sidebar-toggle']} aria-label="Toggle sidebar">
                        <Menu size={16} />
                        <span>New chat</span>
                    </button>
                    <div className={styles['current-chat']}>
                        Static UI
                    </div>
                </div>

                <ChatWindow />
                <ChatInput />
            </div>
        </div>
    )
}

export default Screen