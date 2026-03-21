"use client";

import { useState, FormEvent } from "react";

export default function RegisterPage() {
  const [inviteCode, setInviteCode] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const formatInviteCode = (value: string) => {
    const cleaned = value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    return cleaned.slice(0, 16).replace(/(.{4})(?=.)/g, "$1-");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    if (!usernameRegex.test(username)) {
      setError("Username must be 3-20 characters (letters, numbers, _ or -).");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/session/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invite_code: inviteCode,
          email: email.trim(),
          username,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed.");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={styles.container}>
        <div style={styles.window}>
          <div style={styles.titleBar}>
            <span style={styles.titleText}>✓ Registration Complete</span>
          </div>
          <div style={styles.body}>
            <p style={styles.successText}>Account created!</p>
            <p style={styles.mutedText}>Check your email to verify your account. You must verify before you can log in.</p>
            <a href="/" style={styles.link}>← Back to home</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.window}>
        <div style={styles.titleBar}>
          <span style={styles.titleText}>📋 Register — SlimyAI</span>
        </div>
        <div style={styles.body}>
          <p style={styles.subtitle}>Invite-only registration</p>

          <form onSubmit={handleSubmit}>
            <label style={styles.label}>Invite Code</label>
            <input
              type="text"
              placeholder="XXXX-XXXX-XXXX-XXXX"
              value={inviteCode}
              onChange={(e) => setInviteCode(formatInviteCode(e.target.value))}
              style={styles.input}
              required
            />

            <label style={{ ...styles.label, marginTop: "12px" }}>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              required
            />

            <label style={{ ...styles.label, marginTop: "12px" }}>Username</label>
            <input
              type="text"
              placeholder="3-20 chars, letters/numbers/_/-"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={styles.input}
              required
            />

            <label style={{ ...styles.label, marginTop: "12px" }}>Password</label>
            <input
              type="password"
              placeholder="Min 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              minLength={8}
              required
            />

            <label style={{ ...styles.label, marginTop: "12px" }}>Confirm Password</label>
            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={styles.input}
              minLength={8}
              required
            />

            {error && <p style={styles.errorText}>{error}</p>}

            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? "Creating account..." : "Register"}
            </button>
          </form>

          <div style={styles.footer}>
            <a href="/" style={styles.link}>← Back to home</a>
            <span style={styles.mutedText}> | </span>
            <a href="/auth/forgot-password" style={styles.link}>Forgot password?</a>
          </div>
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
  subtitle: {
    color: "#8a4baf",
    fontSize: "16px",
    marginBottom: "16px",
  },
  label: {
    display: "block",
    color: "#d6b4fc",
    fontSize: "16px",
    marginBottom: "4px",
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
  },
  mutedText: {
    color: "#8a4baf",
    fontSize: "14px",
  },
  link: {
    color: "#8a4baf",
    fontSize: "14px",
    textDecoration: "none",
  },
  footer: {
    marginTop: "16px",
    textAlign: "center" as const,
  },
};
