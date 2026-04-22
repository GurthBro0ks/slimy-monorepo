"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

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
    textAlign: "center" as const,
  },
  loadingText: {
    color: "#39ff14",
    fontSize: "22px",
    textShadow: "0 0 6px #39ff14",
    marginBottom: "12px",
  },
  errorText: {
    color: "#ff4444",
    fontSize: "20px",
    textShadow: "0 0 6px #ff4444",
    marginBottom: "12px",
  },
  mutedText: {
    color: "#8a4baf",
    fontSize: "14px",
    marginBottom: "8px",
  },
  link: {
    color: "#8a4baf",
    fontSize: "14px",
    textDecoration: "none",
  },
  spinner: {
    display: "inline-block",
    width: "24px",
    height: "24px",
    border: "3px solid #3d2c5e",
    borderTopColor: "#39ff14",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto 16px",
  },
};

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("No verification token provided.");
      return;
    }

    window.location.href = `/api/session/verify?token=${encodeURIComponent(token)}`;
  }, [token]);

  if (status === "error") {
    return (
      <div style={styles.container}>
        <div style={styles.window}>
          <div style={styles.titleBar}>
            <span style={styles.titleText}>✗ Verification Failed</span>
          </div>
          <div style={styles.body}>
            <p style={styles.errorText}>{errorMessage}</p>
            <p style={styles.mutedText}>
              The link may be invalid or expired.
            </p>
            <a href="/" style={styles.link}>
              ← Back to home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.window}>
        <div style={styles.titleBar}>
          <span style={styles.titleText}>📋 Email Verification</span>
        </div>
        <div style={styles.body}>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Verifying your email...</p>
          <p style={styles.mutedText}>You&apos;ll be redirected shortly.</p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div style={styles.container}>
          <div style={styles.window}>
            <div style={styles.titleBar}>
              <span style={styles.titleText}>📋 Email Verification</span>
            </div>
            <div style={styles.body}>
              <p style={styles.mutedText}>Loading...</p>
            </div>
          </div>
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
