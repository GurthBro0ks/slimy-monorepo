import Head from "next/head";
import { useEffect, useState } from "react";
import Layout from "../components/Layout";

export default function StatusPage() {
  const [state, setState] = useState({
    loading: true,
    health: null,
    diag: null,
    error: null,
  });

  async function refresh() {
    try {
      setState({ loading: true, health: null, diag: null, error: null });

      const [healthRes, diagRes] = await Promise.all([
        fetch("/api/admin-api/api/health"),
        fetch("/api/admin-api/api/diag"),
      ]);

      const [healthJson, diagJson] = await Promise.all([
        healthRes.json().catch(() => null),
        diagRes.json().catch(() => null),
      ]);

      const error = !healthRes.ok
        ? `Health HTTP ${healthRes.status}`
        : !diagRes.ok
          ? `Diag HTTP ${diagRes.status}`
          : null;

      setState({
        loading: false,
        health: healthJson,
        diag: diagJson,
        error,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setState({ loading: false, health: null, diag: null, error: message });
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const adminApiOk = Boolean(
    state.health && (state.health.status === "ok" || state.health.ok === true),
  );
  const authenticated = Boolean(state.diag && state.diag.authenticated === true);
  const authStatus = state.diag
    ? authenticated
      ? "Logged in"
      : "Logged out"
    : "Unknown";

  function handleLogin() {
    window.location.href = "/login";
  }

  async function handleLogout() {
    try {
      await fetch("/api/admin-api/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    } finally {
      refresh();
    }
  }

  return (
    <Layout title="Status">
      <Head>
        <title>slimy.ai – Admin Status</title>
      </Head>
      <div style={{ maxWidth: 980, margin: "0 auto", width: "100%", display: "grid", gap: "1rem" }}>
        <div className="card" style={{ display: "grid", gap: "0.75rem" }}>
          <div style={{ opacity: 0.8 }}>
            Checks the Admin UI → Admin API bridge at{" "}
            <code>/api/admin-api/api/health</code> and <code>/api/admin-api/api/diag</code>.
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <button className="btn" onClick={refresh} disabled={state.loading}>
              {state.loading ? "Checking…" : "Refresh"}
            </button>
            <button className="btn" onClick={handleLogin} disabled={state.loading}>
              Login
            </button>
            {authenticated ? (
              <button className="btn outline" onClick={handleLogout} disabled={state.loading}>
                Logout
              </button>
            ) : null}
            {state.error ? (
              <span style={{ color: "#fca5a5", fontWeight: 700 }}>{state.error}</span>
            ) : null}
          </div>
        </div>

        <div className="card-grid">
          <div className="card">
            <div style={{ fontFamily: "var(--font-pixel)", opacity: 0.8, marginBottom: 6 }}>Admin API</div>
            <div style={{ fontSize: "1.4rem", fontWeight: 900, color: adminApiOk ? "#86efac" : "#fca5a5" }}>
              {adminApiOk ? "OK" : "FAIL"}
            </div>
          </div>
          <div className="card">
            <div style={{ fontFamily: "var(--font-pixel)", opacity: 0.8, marginBottom: 6 }}>Auth</div>
            <div style={{ fontSize: "1.4rem", fontWeight: 900, color: authenticated ? "#86efac" : "rgba(255,255,255,0.82)" }}>
              {authStatus}
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ fontFamily: "var(--font-pixel)", opacity: 0.8, marginBottom: 10 }}>Raw JSON</div>
          <pre style={{ margin: 0, overflowX: "auto" }}>
            {state.health || state.diag
              ? JSON.stringify({ health: state.health, diag: state.diag }, null, 2)
              : "No data yet."}
          </pre>
        </div>
      </div>
    </Layout>
  );
}
