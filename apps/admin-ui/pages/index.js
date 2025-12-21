import Head from "next/head";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";

export default function Home() {
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const configuredRedirectUri = useMemo(
    () => String(process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI || "").trim(),
    [],
  );
  const configuredApiBase = useMemo(
    () => String(process.env.NEXT_PUBLIC_ADMIN_API_BASE || "").trim(),
    [],
  );

  return (
    <Layout hideSidebar>
      <Head>
        <title>slimy.ai – Admin Panel</title>
      </Head>
      <div className="hero">
        <div className="hero__logo">
          <Image
            src="/slimy-admin-logo.svg"
            alt="slimy admin logo"
            width={96}
            height={96}
            priority
          />
        </div>

        <h1 className="hero__title">slimy.ai – Admin Panel</h1>
        <p className="hero__tagline">
          fueled by <span>adhd</span> — driven by <span>feet</span> — motivated by <span>ducks</span>
        </p>

        <a className="hero__cta" href="/api/auth/discord/authorize-url">
          LOGIN WITH DISCORD
        </a>
      </div>

      <div
        style={{
          position: "fixed",
          left: 12,
          bottom: 12,
          zIndex: 50,
          maxWidth: 560,
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
loginEndpoint: /api/auth/discord/authorize-url
env.NEXT_PUBLIC_DISCORD_REDIRECT_URI: ${configuredRedirectUri || "(unset)"}
env.NEXT_PUBLIC_ADMIN_API_BASE: ${configuredApiBase || "(unset)"}`}
	      </div>

      <footer className="hero__footer">
        UI is online on port 3081 behind Caddy.
      </footer>
    </Layout>
  );
}
