"use client";

import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import ServiceStatusCard from "../components/ServiceStatusCard";
import { apiFetch, fmtDuration } from "../lib/api";

const REFRESH_INTERVAL = 30_000; // 30 seconds

export default function SystemDiagnostics() {
  const [services, setServices] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [overallStatus, setOverallStatus] = useState("unknown");

  const fetchDiagnostics = async () => {
    const results = {};
    const timestamp = new Date().toISOString();

    // Fetch Admin API diagnostics
    try {
      const adminDiag = await apiFetch("/api/diag");
      if (adminDiag.ok) {
        results.adminApi = {
          status: "ok",
          details: {
            Uptime: fmtDuration(adminDiag.admin?.uptimeSec || 0),
            "Memory (RSS)": `${adminDiag.admin?.memory?.rssMb || 0} MB`,
            "Heap Used": `${adminDiag.admin?.memory?.heapUsedMb || 0} MB`,
            "Node Version": adminDiag.admin?.node || "—",
            Hostname: adminDiag.admin?.hostname || "—",
            "Uploads Today": adminDiag.uploads?.today || 0,
            "Total Uploads": adminDiag.uploads?.total || 0,
          },
          timestamp,
        };
      } else {
        results.adminApi = {
          status: "down",
          error: "Failed to fetch admin API diagnostics",
          timestamp,
        };
      }
    } catch (error) {
      results.adminApi = {
        status: "down",
        error: error.message || "Unable to reach admin API",
        timestamp,
      };
    }

    // Fetch detailed diagnostics (with cache)
    try {
      const detailedDiag = await apiFetch("/api/diagnostics");
      if (detailedDiag.ok) {
        results.adminApiCache = {
          status: "ok",
          details: {
            "Cache Age": detailedDiag.generatedAt
              ? `${Math.floor((Date.now() - new Date(detailedDiag.generatedAt).getTime()) / 1000)}s ago`
              : "—",
            "Process PID": detailedDiag.pid || "—",
            "Heap Total": `${detailedDiag.memory?.heapTotalMB || 0} MB`,
            "External Memory": `${detailedDiag.memory?.externalMB || 0} MB`,
          },
          timestamp: detailedDiag.generatedAt || timestamp,
        };
      }
    } catch (error) {
      results.adminApiCache = {
        status: "degraded",
        error: "Cached diagnostics unavailable",
        timestamp,
      };
    }

    // Check Web App Health (if accessible from admin-ui)
    try {
      const webHealthResponse = await fetch(`${process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000'}/api/codes/health`, {
        signal: AbortSignal.timeout(5000),
      });
      if (webHealthResponse.ok) {
        const webHealth = await webHealthResponse.json();
        results.webApp = {
          status: webHealth.status === "healthy" ? "ok" : "degraded",
          details: {
            Service: webHealth.service || "codes",
            Status: webHealth.status || "—",
          },
          timestamp: webHealth.timestamp || timestamp,
        };
      } else {
        results.webApp = {
          status: "degraded",
          error: `HTTP ${webHealthResponse.status}`,
          timestamp,
        };
      }
    } catch (error) {
      results.webApp = {
        status: "down",
        error: error.name === "TimeoutError" ? "Request timeout" : "Unable to reach web app",
        timestamp,
      };
    }

    // Check Database connectivity (via admin API upload stats as proxy)
    try {
      const adminDiag = await apiFetch("/api/diag");
      const hasUploadStats = adminDiag?.uploads && typeof adminDiag.uploads.total === "number";
      results.database = {
        status: hasUploadStats ? "ok" : "degraded",
        details: {
          Connection: hasUploadStats ? "Connected" : "Unknown",
          "Upload Records": hasUploadStats ? adminDiag.uploads.total : "—",
        },
        timestamp,
      };
    } catch (error) {
      results.database = {
        status: "down",
        error: "Unable to verify database connection",
        timestamp,
      };
    }

    // Check UI Diagnostics endpoint
    try {
      const uiDiag = await fetch("/api/diagnostics");
      if (uiDiag.ok) {
        const data = await uiDiag.json();
        results.adminUi = {
          status: data.ok ? "ok" : "degraded",
          details: {
            Message: data.message || "—",
          },
          timestamp,
        };
      } else {
        results.adminUi = {
          status: "degraded",
          error: "UI diagnostics endpoint error",
          timestamp,
        };
      }
    } catch (error) {
      results.adminUi = {
        status: "down",
        error: "UI diagnostics unavailable",
        timestamp,
      };
    }

    // Calculate overall status
    const statuses = Object.values(results).map((s) => s.status);
    if (statuses.every((s) => s === "ok")) {
      setOverallStatus("ok");
    } else if (statuses.some((s) => s === "down")) {
      setOverallStatus("degraded");
    } else {
      setOverallStatus("degraded");
    }

    setServices(results);
    setLastUpdate(new Date());
    setLoading(false);
  };

  useEffect(() => {
    fetchDiagnostics();
    const interval = setInterval(fetchDiagnostics, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const getOverallStatusColor = () => {
    switch (overallStatus) {
      case "ok":
        return "#10b981";
      case "degraded":
        return "#f59e0b";
      case "down":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  return (
    <Layout title="System Diagnostics">
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            marginBottom: "2rem",
            padding: "1.5rem",
            borderRadius: 12,
            background: `linear-gradient(135deg, ${getOverallStatusColor()}20, ${getOverallStatusColor()}10)`,
            border: `1px solid ${getOverallStatusColor()}40`,
          }}
        >
          <h1 style={{ margin: 0, marginBottom: "0.5rem", fontSize: "2rem" }}>
            System Diagnostics
          </h1>
          <div style={{ fontSize: "1rem", opacity: 0.85 }}>
            Overall Status:{" "}
            <strong style={{ color: getOverallStatusColor() }}>
              {overallStatus.toUpperCase()}
            </strong>
          </div>
          {lastUpdate && (
            <div style={{ fontSize: "0.85rem", opacity: 0.65, marginTop: "0.5rem" }}>
              Last updated: {lastUpdate.toLocaleString()} (Auto-refresh every 30s)
            </div>
          )}
        </div>

        {/* Status Legend */}
        <div
          style={{
            marginBottom: "2rem",
            padding: "1rem",
            borderRadius: 8,
            background: "rgba(12, 17, 29, 0.5)",
            border: "1px solid rgba(148, 163, 184, 0.18)",
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Status Legend:</div>
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", fontSize: "0.85rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ color: "#10b981" }}>✓</span>
              <span><strong>OK:</strong> Service operating normally</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ color: "#f59e0b" }}>⚠</span>
              <span><strong>Degraded:</strong> Service partially available or slow</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ color: "#ef4444" }}>✗</span>
              <span><strong>Down:</strong> Service unreachable or failing</span>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: "center", padding: "3rem", opacity: 0.6 }}>
            Loading diagnostics...
          </div>
        )}

        {/* Service Status Cards */}
        {!loading && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {services.adminApi && (
              <ServiceStatusCard
                service="Admin API"
                status={services.adminApi.status}
                details={services.adminApi.details}
                error={services.adminApi.error}
                timestamp={services.adminApi.timestamp}
              />
            )}

            {services.adminUi && (
              <ServiceStatusCard
                service="Admin UI"
                status={services.adminUi.status}
                details={services.adminUi.details}
                error={services.adminUi.error}
                timestamp={services.adminUi.timestamp}
              />
            )}

            {services.webApp && (
              <ServiceStatusCard
                service="Web App (Codes)"
                status={services.webApp.status}
                details={services.webApp.details}
                error={services.webApp.error}
                timestamp={services.webApp.timestamp}
              />
            )}

            {services.database && (
              <ServiceStatusCard
                service="Database"
                status={services.database.status}
                details={services.database.details}
                error={services.database.error}
                timestamp={services.database.timestamp}
              />
            )}

            {services.adminApiCache && (
              <ServiceStatusCard
                service="Diagnostics Cache"
                status={services.adminApiCache.status}
                details={services.adminApiCache.details}
                error={services.adminApiCache.error}
                timestamp={services.adminApiCache.timestamp}
              />
            )}
          </div>
        )}

        {/* Refresh Button */}
        <div style={{ marginTop: "2rem", textAlign: "center" }}>
          <button
            onClick={fetchDiagnostics}
            disabled={loading}
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: 8,
              background: "#3b82f6",
              color: "white",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 600,
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Refreshing..." : "Refresh Now"}
          </button>
        </div>
      </div>
    </Layout>
  );
}
