import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Login.module.css";

function LoginForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const apiUrl = useMemo(() => import.meta.env.VITE_API_URL || "api/", []);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [statusMessage, setStatusMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatusMessage("");
    setLoading(true);
    // validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setStatusMessage("Invalid email format.");
      setLoading(false);
      return;
    }
    // validate password format
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      setStatusMessage(
        "Invalid password format. Must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.",
      );
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${apiUrl}users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
        credentials: "include", //include cookies in the request
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "Login failed.");
      }

      localStorage.setItem("token", result.token || "");
      setStatusMessage("Login successful.");
      navigate("/chat/new");
    } catch (error) {
      setStatusMessage(error.message || "Unable to login right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.formCard} onSubmit={handleSubmit}>
      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="login-email">
          Email
        </label>
        <input
          className={styles.input}
          type="email"
          name="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="login-password">
          Password
        </label>
        <input
          minLength={8}
          maxLength={128}
          className={styles.input}
          type="password"
          name="password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={handleChange}
          required
        />
      </div>

      {statusMessage ? (
        <p className={styles.statusText}>{statusMessage}</p>
      ) : null}

      <button className={styles.primaryButton} type="submit" disabled={loading}>
        {loading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}

export default LoginForm;
