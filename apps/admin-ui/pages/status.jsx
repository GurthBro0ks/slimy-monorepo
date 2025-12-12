import Head from "next/head";
import { useEffect, useState } from "react";
import Layout from "../components/Layout";

export default function StatusPage() {
  const [state, setState] = useState({ loading: true, data: null, error: null });

  async function refresh() {
    setState({ loading: true, data: null, error: null });
    try {
      const res = await fetch("/api/admin-api/health");
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setState({
          loading: false,
          data: json,
          error: `HTTP ${res.status}`,
        });
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

  return (
    <Layout>
      <Head>
        <title>slimy.ai – Admin Status</title>
      </Head>
      <div className="wrap">
        <h1>Admin Status</h1>
        <p className="muted">
          Checks the Admin UI → Admin API bridge at <code>/api/admin-api/health</code>.
        </p>
        <div className="row">
          <button className="btn" onClick={refresh} disabled={state.loading}>
            {state.loading ? "Checking…" : "Refresh"}
          </button>
          {state.error ? <span className="err">{state.error}</span> : null}
        </div>
        <pre className="box">{state.data ? JSON.stringify(state.data, null, 2) : "No data yet."}</pre>
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
        .row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 12px 0 16px;
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
