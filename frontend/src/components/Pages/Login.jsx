import { useState } from "react";
import LoginForm from "../Login/Login";
import SignUpForm from "../Login/SignUp";
import styles from "../Login/Login.module.css";

function LoginPage() {
  const [isLoginTab, setIsLoginTab] = useState(true);

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.authPanel}>
        <div className={styles.header}>
          <span className={styles.badge}>AI Chat</span>
          <h1>{isLoginTab ? "Welcome back" : "Create your account"}</h1>
          <p>
            {isLoginTab
              ? "Sign in to continue your conversations."
              : "Register to start using the chat application."}
          </p>
        </div>

        <div className={styles.toggleBar}>
          <button
            type="button"
            className={isLoginTab ? styles.activeTab : styles.tabButton}
            onClick={() => setIsLoginTab(true)}
          >
            Login
          </button>
          <button
            type="button"
            className={isLoginTab ? styles.tabButton : styles.activeTab}
            onClick={() => setIsLoginTab(false)}
          >
            Register
          </button>
        </div>

        {isLoginTab ? <LoginForm /> : <SignUpForm />}
      </div>
    </div>
  );
}

export default LoginPage;
