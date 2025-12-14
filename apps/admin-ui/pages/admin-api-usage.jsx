import Head from "next/head";
import { useEffect, useState } from "react";
import Layout from "../components/Layout";

const ENDPOINT = "/api/admin-api/api/usage";

export default function AdminApiUsagePage() {
  const [state, setState] = useState({ loading: true, data: null, error: null });

  async function refresh() {
    setState({ loading: true, data: null, error: null });
    try {
      const res = await fetch(ENDPOINT);
      const text = await res.text();
      let json = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        json = { raw: text };
      }

      if (!res.ok) {
        setState({ loading: false, data: json, error: `HTTP ${res.status}` });
        return;
      }

      setState({ loading: false, data: json, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setState({ loading: false, data: null, error: message });
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const rows = Array.isArray(state.data) ? state.data : Array.isArray(state.data?.data) ? state.data.data : null;

  return (
    <Layout>
      <Head>
        <title>slimy.ai – Admin API Usage</title>
      </Head>
      <div className="wrap">
        <h1>Admin API Usage</h1>
        <p className="muted">
          Fetches <code>{ENDPOINT}</code> through the catch-all Admin API proxy.
        </p>

        <div className="row">
          <button className="btn" onClick={refresh} disabled={state.loading}>
            {state.loading ? "Loading…" : "Refresh"}
          </button>
          {state.error ? <span className="err">{state.error}</span> : null}
        </div>

        {rows ? (
          <div className="list">
            {rows.map((item, idx) => (
              <div key={idx} className="item">
                <div className="idx">#{idx + 1}</div>
                <pre className="pre">{JSON.stringify(item, null, 2)}</pre>
              </div>
            ))}
          </div>
        ) : null}

        <pre className="box">{state.data ? JSON.stringify(state.data, null, 2) : "No data yet."}</pre>
      </div>
    </Layout>
  );
}
