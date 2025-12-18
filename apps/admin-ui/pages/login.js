import { useEffect } from "react";

export default function LoginRedirect() {
  useEffect(() => {
    window.location.href = "/api/auth/discord/authorize-url";
  }, []);

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <p>Opening Discord login…</p>
      <p style={{ fontSize: "0.875rem", opacity: 0.6, marginTop: "1rem" }}>
        If you are not redirected, go back to <a href="/">the login page</a>.
      </p>
    </main>
  );
}
