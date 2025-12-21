import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

const LOGIN_ENDPOINT = "/api/auth/discord/authorize-url";

export default function Login() {
  const router = useRouter();
  const { returnTo } = router.query;
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const loginUrl = returnTo
    ? `${LOGIN_ENDPOINT}?returnTo=${encodeURIComponent(returnTo)}`
    : LOGIN_ENDPOINT;

  const configuredApiBase = useMemo(
    () => String(process.env.NEXT_PUBLIC_ADMIN_API_BASE || "").trim(),
    [],
  );

  return (
    <main style={{ padding: 48, textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ marginBottom: "1rem" }}>Login Required</h1>
      <p style={{ marginBottom: "2rem", opacity: 0.8 }}>
        Please sign in with Discord to access the admin panel.
      </p>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" }}>
        <a
          href={loginUrl}
          style={{
            display: "inline-block",
            padding: "12px 24px",
            backgroundColor: "#5865F2",
            color: "white",
            textDecoration: "none",
            borderRadius: "6px",
            fontWeight: 600,
            fontSize: "1.1rem",
            boxShadow: "0 4px 14px 0 rgba(88,101,242,0.39)",
          }}
        >
          Login with Discord
        </a>

        <Link href="/" legacyBehavior>
          <a style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9rem", textDecoration: "underline" }}>
            Return to Splash Page
          </a>
        </Link>
      </div>

      <div
        style={{
          position: "fixed",
          left: 12,
          bottom: 12,
          zIndex: 50,
          maxWidth: 720,
          padding: "10px 12px",
          borderRadius: 10,
          background: "rgba(0,0,0,0.55)",
          border: "1px solid rgba(255,255,255,0.12)",
          color: "rgba(255,255,255,0.9)",
          fontFamily:
            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          fontSize: 12,
          lineHeight: 1.4,
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
        }}
      >
        {`origin: ${origin || "(loading...)"}
loginEndpoint: ${LOGIN_ENDPOINT}
loginUrl: ${loginUrl}
env.NEXT_PUBLIC_ADMIN_API_BASE: ${configuredApiBase || "(unset)"}`}
      </div>
    </main>
  );
}
