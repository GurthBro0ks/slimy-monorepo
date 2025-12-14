import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Layout from "../../../components/Layout";
import { apiFetch } from "../../../lib/api";

export default function GuildSettingsPage(){
  const router = useRouter();
  const guildId = router.query.guildId?.toString() || "";
  const [state, setState] = useState({ loading: true, error: null, settings: null, saving: false });

  useEffect(() => {
    if (!guildId) return;
    (async () => {
      try {
        const res = await apiFetch(`/api/guilds/${guildId}/settings`);
        setState({ loading: false, error: null, settings: res.settings, saving: false });
      } catch (e) {
        setState({ loading: false, error: e.message || "failed", settings: null, saving: false });
      }
    })();
  }, [guildId]);

  const s = state.settings || {};

  async function save(patch){
    setState(x => ({ ...x, saving: true }));
    try {
      const res = await apiFetch(`/api/guilds/${guildId}/settings`, {
        method: "PUT",
        body: JSON.stringify(patch),
      });
      setState({ loading: false, error: null, settings: res.settings, saving: false });
    } catch(e) {
      setState(x => ({ ...x, saving: false, error: e.message || "save_failed" }));
    }
  }

  return (
    <Layout guildId={guildId} title="Club Settings">
      <div className="card" style={{ marginBottom: "1rem" }}>
        <div style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: "1rem" }}>Guild Settings</div>
        {state.loading && <div>Loading…</div>}
        {state.error && <div style={{ color:"#f88", marginBottom: "1rem" }}>Error: {state.error}</div>}

        {!state.loading && !state.error && (
          <>
            <div className="grid cols-2">
              <div className="form-row">
                <label>Sheet ID</label>
                <input
                  type="text"
                  className="input"
                  defaultValue={s.sheet_id || ""}
                  onBlur={(e)=> save({ sheet_id: e.target.value })}
                />
              </div>

              <div className="form-row">
                <label>Default Tab (e.g., Baseline (10-24-25))</label>
                <input
                  type="text"
                  className="input"
                  defaultValue={s.sheet_tab || ""}
                  onBlur={(e)=> save({ sheet_tab: e.target.value })}
                />
              </div>

              <div className="form-row">
                <label>Default View</label>
                <select
                  className="select"
                  defaultValue={s.view_mode || "baseline"}
                  onChange={(e)=> save({ view_mode: e.target.value })}
                >
                  <option value="baseline">Baseline</option>
                  <option value="latest">Latest</option>
                </select>
              </div>

              <div className="form-row">
                <label>Allow Public Stats (/stats)</label>
                <input
                  type="checkbox"
                  defaultChecked={!!s.allow_public}
                  onChange={(e)=> save({ allow_public: e.target.checked })}
                />
              </div>
            </div>

            <div style={{ marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(255,255,255,.1)" }}>
              <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "1rem" }}>Screenshot Upload Settings</div>
              <div className="grid cols-2">
                <div className="form-row">
                  <label>Screenshot Channel ID</label>
                  <input
                    type="text"
                    className="input"
                    defaultValue={s.screenshot_channel_id || ""}
                    onBlur={(e)=> save({ screenshot_channel_id: e.target.value })}
                    placeholder="Pick from Channels tab or paste ID"
                  />
                </div>

                <div className="form-row">
                  <label>Enable Uploads</label>
                  <input
                    type="checkbox"
                    defaultChecked={s.uploads_enabled !== undefined ? !!s.uploads_enabled : true}
                    onChange={(e)=> save({ uploads_enabled: e.target.checked })}
                  />
                </div>

                <div className="form-row" style={{ gridColumn: "1 / -1" }}>
                  <label>Notes</label>
                  <textarea
                    className="textarea"
                    defaultValue={s.notes || ""}
                    onBlur={(e)=> save({ notes: e.target.value })}
                    rows={4}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
