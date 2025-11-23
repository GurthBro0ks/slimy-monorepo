import { CommandShell } from "@/components/CommandShell";

export default function DashboardPage() {
  return (
    <CommandShell title="Command Center" breadcrumbs="Home / Dashboard" statusText="System Status: Online">
      <div className="grid-dashboard">
        <div className="panel col-span-8" style={{ minHeight: 300 }}>
          <div className="panel-header">
            <span>Live Activity</span>
            <span style={{ color: "var(--neon-pink)" }}>● Live</span>
          </div>
          <div className="panel-empty-state">
            <p>[Main Graph Placeholder – wire to stats/usage later]</p>
          </div>
        </div>

        <div className="panel col-span-4">
          <div className="panel-header">Quick Actions</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button className="panel-btn">Run OCR Scan (Snail/Club)</button>
            <button className="panel-btn">Export Logs / Usage</button>
            <button className="panel-btn">Manage Permissions</button>
          </div>
        </div>

        <div className="panel col-span-4">
          <div className="panel-header">Recent Alerts</div>
          <div className="panel-empty-state">[Alert List Placeholder]</div>
        </div>

        <div className="panel col-span-4">
          <div className="panel-header">Server Health</div>
          <div className="panel-empty-state">[API / DB Status]</div>
        </div>

        <div className="panel col-span-4">
          <div className="panel-header">Integrations</div>
          <div className="panel-empty-state">[OpenAI, Sheets, Discord]</div>
        </div>
      </div>
    </CommandShell>
  );
}
