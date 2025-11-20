"use client";

export default function ServiceStatusCard({ service, status, details, error, timestamp }) {
  const getStatusColor = (status) => {
    switch (status) {
      case "ok":
      case "healthy":
        return "#10b981"; // green
      case "degraded":
        return "#f59e0b"; // amber
      case "down":
      case "unhealthy":
        return "#ef4444"; // red
      default:
        return "#6b7280"; // gray
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "ok":
      case "healthy":
        return "✓";
      case "degraded":
        return "⚠";
      case "down":
      case "unhealthy":
        return "✗";
      default:
        return "?";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "ok":
      case "healthy":
        return "OK";
      case "degraded":
        return "Degraded";
      case "down":
      case "unhealthy":
        return "Down";
      default:
        return "Unknown";
    }
  };

  const statusColor = getStatusColor(status);
  const statusIcon = getStatusIcon(status);
  const statusLabel = getStatusLabel(status);

  return (
    <div
      style={{
        padding: "1.5rem",
        borderRadius: 12,
        border: `1px solid ${statusColor}40`,
        background: "rgba(12, 17, 29, 0.9)",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600 }}>{service}</h3>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.25rem 0.75rem",
            borderRadius: 20,
            background: `${statusColor}20`,
            border: `1px solid ${statusColor}`,
            color: statusColor,
            fontSize: "0.85rem",
            fontWeight: 600,
          }}
        >
          <span>{statusIcon}</span>
          <span>{statusLabel}</span>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: "0.75rem",
            borderRadius: 8,
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            marginBottom: "0.75rem",
          }}
        >
          <div style={{ fontSize: "0.85rem", color: "#fca5a5", fontWeight: 500 }}>
            Error:
          </div>
          <div style={{ fontSize: "0.8rem", color: "#fecaca", marginTop: "0.25rem" }}>
            {error}
          </div>
        </div>
      )}

      {details && Object.keys(details).length > 0 && (
        <div style={{ fontSize: "0.85rem", opacity: 0.85 }}>
          {Object.entries(details).map(([key, value]) => (
            <div
              key={key}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "0.4rem 0",
                borderBottom: "1px solid rgba(148, 163, 184, 0.1)",
              }}
            >
              <span style={{ opacity: 0.75 }}>{key}:</span>
              <span style={{ fontWeight: 500 }}>{value}</span>
            </div>
          ))}
        </div>
      )}

      {timestamp && (
        <div
          style={{
            marginTop: "0.75rem",
            fontSize: "0.75rem",
            opacity: 0.6,
            textAlign: "right",
          }}
        >
          Last checked: {new Date(timestamp).toLocaleString()}
        </div>
      )}
    </div>
  );
}
