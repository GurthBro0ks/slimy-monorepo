"use client";

import { useState, FormEvent, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Missing reset token. Please use the link from your email.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/session/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Reset failed.");
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/"), 3000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div style={styles.container}>
        <div style={styles.window}>
          <div style={styles.titleBar}>
            <span style={styles.titleText}>⚠ Error</span>
          </div>
          <div style={styles.body}>
            <p style={styles.errorText}>Invalid reset link. Please request a new password reset.</p>
            <a href="/" style={styles.link}>← Back to home</a>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={styles.container}>
        <div style={styles.window}>
          <div style={styles.titleBar}>
            <span style={styles.titleText}>✓ Password Reset</span>
          </div>
          <div style={styles.body}>
            <p style={styles.successText}>Password updated successfully!</p>
            <p style={styles.mutedText}>Redirecting to login...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.window}>
        <div style={styles.titleBar}>
          <span style={styles.titleText}>🔐 Reset Password — SlimyAI</span>
        </div>
        <div style={styles.body}>
          <p style={styles.label}>Enter your new password:</p>

          <form onSubmit={handleSubmit}>
            <input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              minLength={8}
              required
            />
            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{ ...styles.input, marginTop: "8px" }}
              minLength={8}
              required
            />

            {error && <p style={styles.errorText}>{error}</p>}

            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>

          <a href="/" style={styles.link}>← Back to home</a>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div style={styles.container}>
        <div style={styles.window}>
          <div style={styles.titleBar}>
            <span style={styles.titleText}>Loading...</span>
          </div>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
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
  },
  mutedText: {
    color: "#8a4baf",
    fontSize: "16px",
    marginTop: "8px",
  },
  link: {
    display: "inline-block",
    marginTop: "16px",
    color: "#8a4baf",
    fontSize: "16px",
    textDecoration: "none",
  },
};
