import Head from "next/head";
import { useEffect, useState } from "react";
import Layout from "../components/Layout";

const ENDPOINT = "/api/auth/me";

export default function AuthMePage() {
  const [state, setState] = useState({
    loading: true,
    status: null,
    data: null,
    error: null,
  });

  async function refresh() {
    setState({ loading: true, status: null, data: null, error: null });
    try {
      const res = await fetch(ENDPOINT);
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setState({
          loading: false,
          status: res.status,
          data: json,
          error: `HTTP ${res.status}`,
        });
        return;
      }

      setState({ loading: false, status: res.status, data: json, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setState({ loading: false, status: null, data: null, error: message });
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function handleLogin() {
    window.location.href = "/login";
  }

  const isUnauthorized = state.status === 401;
  const guilds = Array.isArray(state.data?.sessionGuilds)
    ? state.data.sessionGuilds
    : Array.isArray(state.data?.guilds)
      ? state.data.guilds
      : null;

  return (
    <Layout>
      <Head>
        <title>slimy.ai – Auth Me</title>
      </Head>
      <div className="wrap">
        <h1>Auth: /me</h1>
        <p className="muted">
          Calls <code>{ENDPOINT}</code>. This endpoint requires auth.
        </p>

        <div className="row">
          <button className="btn" onClick={refresh} disabled={state.loading}>
            {state.loading ? "Loading…" : "Refresh"}
          </button>
          <button className="btn" onClick={() => (window.location.href = "/status")} disabled={state.loading}>
            Status
          </button>
          {isUnauthorized ? (
            <button className="btn" onClick={handleLogin} disabled={state.loading}>
              Login
            </button>
          ) : null}
          {state.error ? <span className="err">{state.error}</span> : null}
        </div>

        {isUnauthorized ? (
          <div className="callout">
            <strong>Please login.</strong> This request returned 401.
          </div>
        ) : null}

        {Array.isArray(guilds) ? (
          <div className="table-grid">
            <div className="thead">
              <div>ID</div>
              <div>Name</div>
              <div>Installed</div>
              <div>Roles</div>
            </div>
            {guilds.map((g) => (
              <div key={g?.id || JSON.stringify(g)} className="trow">
                <div className="mono">{g?.id || "-"}</div>
                <div>{g?.name || "-"}</div>
                <div>{String(Boolean(g?.installed))}</div>
                <div className="mono">
                  {Array.isArray(g?.roles) ? g.roles.join(", ") : g?.roles ? String(g.roles) : "-"}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <pre className="box">{state.data ? JSON.stringify(state.data, null, 2) : "No data yet."}</pre>
      </div>
    </Layout>
  );
}
