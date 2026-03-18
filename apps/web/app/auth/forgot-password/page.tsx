"use client";

import { useState, FormEvent } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/session/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong.");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.window}>
        <div style={styles.titleBar}>
          <span style={styles.titleText}>📧 Forgot Password — SlimyAI</span>
        </div>
        <div style={styles.body}>
          {submitted ? (
            <>
              <p style={styles.successText}>Check your email!</p>
              <p style={styles.mutedText}>If that email is registered, a reset link has been sent. Check your spam folder too.</p>
              <a href="/" style={styles.link}>← Back to home</a>
            </>
          ) : (
            <>
              <p style={styles.label}>Enter your email address and we'll send a reset link.</p>
              <form onSubmit={handleSubmit}>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={styles.input}
                  required
                />

                {error && <p style={styles.errorText}>{error}</p>}

                <button type="submit" disabled={loading} style={styles.button}>
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>
              <a href="/" style={styles.link}>← Back to home</a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "60vh",
    padding: "40px 16px",
  },
  window: {
    width: "100%",
    maxWidth: "420px",
    background: "#1a0b2e",
    borderTop: "2px solid #d6b4fc",
    borderLeft: "2px solid #8a4baf",
    borderRight: "4px solid #0f0518",
    borderBottom: "4px solid #0f0518",
    boxShadow: "0 0 0 2px #2d0b4e, 0 0 20px rgba(138, 75, 175, 0.4)",
    fontFamily: '"VT323", monospace',
  },
  titleBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "4px 8px",
    background: "#2d0b4e",
    borderBottom: "2px solid #0f0518",
  },
  titleText: {
    color: "#d6b4fc",
    fontSize: "20px",
    letterSpacing: "1px",
  },
  body: {
    padding: "20px",
  },
  label: {
    color: "#d6b4fc",
    fontSize: "18px",
    marginBottom: "12px",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    background: "#0a0412",
    border: "2px solid #3d2c5e",
    borderTopColor: "#000",
    borderLeftColor: "#000",
    color: "#39ff14",
    fontFamily: '"VT323", monospace',
    fontSize: "18px",
    outline: "none",
    boxSizing: "border-box" as const,
  },
  button: {
    width: "100%",
    marginTop: "16px",
    padding: "10px",
    background: "#2d0b4e",
    border: "2px solid #39ff14",
    color: "#39ff14",
    fontFamily: '"VT323", monospace',
    fontSize: "22px",
    cursor: "pointer",
    letterSpacing: "2px",
    textShadow: "0 0 4px #39ff14",
    boxShadow: "0 0 10px rgba(57, 255, 20, 0.2)",
  },
  errorText: {
    color: "#ff4444",
    fontSize: "16px",
    marginTop: "8px",
  },
  successText: {
    color: "#39ff14",
    fontSize: "22px",
    textShadow: "0 0 6px #39ff14",
    marginBottom: "8px",
  },
  mutedText: {
    color: "#8a4baf",
    fontSize: "16px",
    marginTop: "4px",
  },
  link: {
    display: "inline-block",
    marginTop: "16px",
    color: "#8a4baf",
    fontSize: "16px",
    textDecoration: "none",
  },
};
