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

  const adminApiPublicBase =
    process.env.NEXT_PUBLIC_ADMIN_API_PUBLIC_URL || "http://localhost:3080";

  async function refresh() {
    try {
      setState({ loading: true, health: null, diag: null, error: null });

      const [healthRes, diagRes] = await Promise.all([
        fetch("/api/admin-api/health"),
        fetch("/api/admin-api/diag"),
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

  function handleLogin() {
    const returnTo = `${window.location.origin}/status`;
    window.location.href = `${adminApiPublicBase}/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`;
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    } finally {
      refresh();
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const adminApiOk = Boolean(state.health && state.health.ok);
  const authenticated = Boolean(state.diag && state.diag.ok && state.diag.upstream?.authenticated);
  const authStatus = state.diag
    ? authenticated
      ? "Logged in"
      : "Logged out"
    : "Unknown";

  return (
    <Layout>
      <Head>
        <title>slimy.ai – Admin Status</title>
      </Head>
      <div className="wrap">
        <h1>Admin Status</h1>
        <p className="muted">
          Checks the Admin UI → Admin API bridge at <code>/api/admin-api/health</code> and{" "}
          <code>/api/admin-api/diag</code>.
        </p>
        <div className="kpis">
          <div className="kpi">
            <div className="k">Admin API</div>
            <div className={adminApiOk ? "v ok" : "v bad"}>{adminApiOk ? "OK" : "FAIL"}</div>
          </div>
          <div className="kpi">
            <div className="k">Auth</div>
            <div className={authenticated ? "v ok" : "v"}>{authStatus}</div>
          </div>
        </div>
        <div className="row">
          <button className="btn" onClick={refresh} disabled={state.loading}>
            {state.loading ? "Checking…" : "Refresh"}
          </button>
          <button className="btn" onClick={handleLogin} disabled={state.loading}>
            Login
          </button>
          {authenticated ? (
            <button className="btn" onClick={handleLogout} disabled={state.loading}>
              Logout
            </button>
          ) : null}
          {state.error ? <span className="err">{state.error}</span> : null}
        </div>
        <pre className="box">
          {state.health || state.diag
            ? JSON.stringify({ health: state.health, diag: state.diag }, null, 2)
            : "No data yet."}
        </pre>
      </div>
      <style jsx>{`
        .wrap {
          max-width: 900px;
          margin: 0 auto;
          padding: 24px 20px 48px;
        }
        h1 {
          margin: 0 0 8px;
          font-size: 1.35rem;
        }
        .muted {
          margin: 0 0 16px;
          opacity: 0.75;
        }
        .kpis {
          display: flex;
          gap: 12px;
          margin: 12px 0 14px;
          flex-wrap: wrap;
        }
        .kpi {
          flex: 0 0 auto;
          min-width: 160px;
          padding: 10px 12px;
          border-radius: 12px;
          background: rgba(15, 23, 42, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .k {
          font-size: 0.75rem;
          opacity: 0.7;
          margin-bottom: 4px;
        }
        .v {
          font-weight: 900;
        }
        .v.ok {
          color: #86efac;
        }
        .v.bad {
          color: #fca5a5;
        }
        .row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 12px 0 16px;
          flex-wrap: wrap;
        }
        .btn {
          padding: 8px 12px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(15, 23, 42, 0.45);
          color: #fff;
          cursor: pointer;
          font-weight: 700;
        }
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .err {
          color: #fca5a5;
          font-weight: 700;
        }
        .box {
          padding: 14px;
          border-radius: 12px;
          background: rgba(15, 23, 42, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.08);
          overflow: auto;
        }
      `}</style>
    </Layout>
  );
}
