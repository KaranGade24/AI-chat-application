import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Login.module.css";

function SignUpForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const apiUrl = useMemo(() => import.meta.env.VITE_API_URL || "/api/", []);
  const [formData, setFormData] = useState({
    name: "",
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

    // validate name format
    if (!formData.name.trim()) {
      setStatusMessage("Name cannot be empty.");
      setLoading(false);
      return;
    }

    // validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setStatusMessage("Invalid email format.");
      setLoading(false);
      return;
    }
    // validate password format
    // const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      setStatusMessage(
        "Invalid password format. Must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.",
      );
      setLoading(false);
      return;
    }
    console.log(formData);
    try {
      const response = await fetch(`${apiUrl}users/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "Registration failed.");
      }
      console.log("Registration successful:", result);
      localStorage.setItem("token", result.token || "");
      setStatusMessage("Account registered successfully.");
      navigate("/chat/new");
    } catch (error) {
      setStatusMessage(error.message || "Unable to register right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.formCard} onSubmit={handleSubmit}>
      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="signup-name">
          Name
        </label>
        <input
          className={styles.input}
          type="text"
          name="name"
          placeholder="Your name"
          minLength={1}
          maxLength={50}
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="signup-email">
          Email
        </label>
        <input
          className={styles.input}
          type="email"
          name="email"
          placeholder="you@example.com"
          minLength={5}
          maxLength={100}
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="signup-password">
          Password
        </label>
        <input
          className={styles.input}
          type="password"
          name="password"
          placeholder="Create a password"
          minLength={8}
          maxLength={128}
          value={formData.password}
          onChange={handleChange}
          required
        />
      </div>

      {statusMessage ? (
        <p className={styles.statusText}>{statusMessage}</p>
      ) : null}

      <button className={styles.primaryButton} type="submit" disabled={loading}>
        {loading ? "Signing Up..." : "Sign Up"}
      </button>
    </form>
  );
}

export default SignUpForm;
