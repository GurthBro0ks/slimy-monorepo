import { useRouter } from "next/router";
import Link from "next/link";

export default function Login() {
  const router = useRouter();
  const { returnTo } = router.query;

  const loginUrl = returnTo
    ? `/api/auth/discord/authorize-url?returnTo=${encodeURIComponent(returnTo)}`
    : "/api/auth/discord/authorize-url";

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
    </main>
  );
}
