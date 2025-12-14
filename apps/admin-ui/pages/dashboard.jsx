import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import Layout from "../components/Layout";

function normalizeFirst(value) {
  if (!value) return "";
  return Array.isArray(value) ? value[0] : value;
}

function getProto(req) {
  const xfProto = normalizeFirst(req?.headers?.["x-forwarded-proto"]);
  const proto = String(xfProto).split(",")[0].trim().toLowerCase();
  if (proto) return proto;
  return req?.socket?.encrypted ? "https" : "http";
}

export async function getServerSideProps(ctx) {
  const proto = getProto(ctx.req);
  const hostHeader = normalizeFirst(ctx.req?.headers?.host) || "localhost";
  const hostname = String(hostHeader).split(",")[0].trim().split(":")[0];
  const localPort = ctx.req?.socket?.localPort;
  const port = localPort ? String(localPort) : String(process.env.PORT || "").trim();
  const host = port ? `${hostname}:${port}` : hostname;
  const cookie = ctx.req?.headers?.cookie || "";

  try {
    const meRes = await fetch(`${proto}://${host}/api/admin-api/api/auth/me`, {
      headers: {
        accept: "application/json",
        cookie,
      },
    });

    if (meRes.status === 401) {
      return {
        redirect: {
          destination: "/status?returnTo=%2Fdashboard",
          permanent: false,
        },
      };
    }

    if (!meRes.ok) {
      return {
        props: {
          user: null,
          meError: `HTTP ${meRes.status}`,
        },
      };
    }

    const user = await meRes.json().catch(() => null);
    return { props: { user, meError: null } };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { props: { user: null, meError: message } };
  }
}

export default function DashboardPage({ user, meError }) {
  const [health, setHealth] = useState({ loading: true, data: null, error: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin-api/api/health");
        const json = await res.json().catch(() => null);
        if (cancelled) return;
        if (!res.ok) {
          setHealth({ loading: false, data: json, error: `HTTP ${res.status}` });
          return;
        }
        setHealth({ loading: false, data: json, error: null });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (!cancelled) setHealth({ loading: false, data: null, error: message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const displayName =
    user?.globalName || user?.username || user?.name || user?.discordId || user?.id || "Unknown";
  const guilds = Array.isArray(user?.sessionGuilds) ? user.sessionGuilds : Array.isArray(user?.guilds) ? user.guilds : [];

  return (
    <Layout title="Dashboard">
      <Head>
        <title>slimy.ai – Dashboard</title>
      </Head>

      <div style={{ maxWidth: 1100, margin: "0 auto", width: "100%", display: "grid", gap: "1rem" }}>
        {meError ? (
          <div className="card">
            <div style={{ color: "#fca5a5", fontWeight: 800 }}>Auth Error</div>
            <div style={{ opacity: 0.8 }}>{meError}</div>
            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href="/status?returnTo=%2Fdashboard" legacyBehavior>
                <a className="btn">Go to Status</a>
              </Link>
            </div>
          </div>
        ) : null}

        <div className="card-grid">
          <div className="card">
            <div className="panel-header" style={{ marginBottom: 12, paddingBottom: 10 }}>
              Session
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              <div>
                Logged in as <strong>{displayName}</strong>
              </div>
              {user?.discordId || user?.id ? (
                <div style={{ opacity: 0.8 }}>
                  ID:{" "}
                  <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace" }}>
                    {user?.discordId || user?.id}
                  </span>
                </div>
              ) : null}
              {user?.role ? (
                <div style={{ opacity: 0.8 }}>
                  Role: <strong>{String(user.role).toUpperCase()}</strong>
                </div>
              ) : null}
            </div>
            <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href="/guilds" legacyBehavior>
                <a className="btn">Select a Guild</a>
              </Link>
              <Link href="/status?returnTo=%2Fdashboard" legacyBehavior>
                <a className="btn outline">Status</a>
              </Link>
            </div>
          </div>

          <div className="card">
            <div className="panel-header" style={{ marginBottom: 12, paddingBottom: 10 }}>
              Admin API
            </div>
            {health.loading ? (
              <div style={{ opacity: 0.8 }}>Checking…</div>
            ) : health.error ? (
              <div style={{ color: "#fca5a5", fontWeight: 800 }}>{health.error}</div>
            ) : (
              <div style={{ display: "grid", gap: 6 }}>
                <div>
                  Status:{" "}
                  <strong style={{ color: health.data?.status === "ok" ? "#86efac" : "#fca5a5" }}>
                    {health.data?.status || "unknown"}
                  </strong>
                </div>
                {typeof health.data?.uptime === "number" ? (
                  <div style={{ opacity: 0.8 }}>Uptime: {health.data.uptime}s</div>
                ) : null}
                {health.data?.timestamp ? (
                  <div style={{ opacity: 0.8 }}>TS: {health.data.timestamp}</div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {guilds.length ? (
          <div className="card">
            <div className="panel-header" style={{ marginBottom: 12, paddingBottom: 10 }}>
              Guilds
            </div>
            <div style={{ opacity: 0.75, marginBottom: 12 }}>
              Click a guild from <Link href="/guilds">/guilds</Link> to open its dashboard.
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {guilds.slice(0, 12).map((g) => (
                <div
                  key={g?.id || JSON.stringify(g)}
                  className="card"
                  style={{
                    padding: "0.9rem 1rem",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700 }}>{g?.name || "Unknown guild"}</div>
                    <div style={{ opacity: 0.75, fontSize: "0.85rem" }}>
                      <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace" }}>
                        {g?.id || "-"}
                      </span>
                    </div>
                  </div>
                  <div style={{ opacity: 0.8, textAlign: "right" }}>
                    {Array.isArray(g?.roles) && g.roles.length ? g.roles.join(", ") : g?.role ? String(g.role) : "member"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </Layout>
  );
}
