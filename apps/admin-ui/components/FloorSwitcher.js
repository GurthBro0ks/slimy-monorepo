"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

export default function FloorSwitcher({ currentFloor }) {
  const router = useRouter();
  const [floors, setFloors] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/floors.json")
      .then((res) => res.json())
      .then((data) => {
        setFloors(data.floors || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load floors:", err);
        setLoading(false);
      });
  }, []);

  const currentFloorData = floors.find((f) => f.id === currentFloor) || floors[0];

  const handleFloorChange = (floorId) => {
    const floor = floors.find((f) => f.id === floorId);
    if (floor && floor.url) {
      window.location.href = floor.url;
    }
    setIsOpen(false);
  };

  if (loading || floors.length === 0) {
    return null;
  }

  return (
    <div className="floor-switcher" style={{ position: "relative" }}>
      <button
        className="floor-switcher-trigger"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 12px",
          background: "rgba(61, 255, 140, 0.1)",
          border: "1px solid rgba(61, 255, 140, 0.3)",
          borderRadius: "6px",
          color: "#3dfc8c",
          fontSize: "12px",
          fontWeight: 600,
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
        aria-label="Switch floor"
      >
        <span style={{ opacity: 0.7 }}>🏢</span>
        <span>{currentFloorData?.name || "Select Floor"}</span>
        <span style={{ opacity: 0.7, fontSize: "10px" }}>▼</span>
      </button>

      {isOpen && (
        <div
          className="floor-switcher-dropdown"
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: "4px",
            background: "rgba(15, 23, 42, 0.98)",
            border: "1px solid rgba(148, 163, 184, 0.2)",
            borderRadius: "8px",
            padding: "4px",
            minWidth: "200px",
            zIndex: 9999,
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
          }}
        >
          {floors.map((floor) => (
            <button
              key={floor.id}
              onClick={() => handleFloorChange(floor.id)}
              style={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                padding: "10px 12px",
                background:
                  floor.id === currentFloor
                    ? "rgba(61, 255, 140, 0.15)"
                    : "transparent",
                border: "none",
                borderRadius: "6px",
                color: floor.id === currentFloor ? "#3dfc8c" : "#e2e8f0",
                fontSize: "13px",
                fontWeight: floor.id === currentFloor ? 600 : 400,
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s ease",
              }}
            >
              <span style={{ fontWeight: 600 }}>{floor.name}</span>
              <span
                style={{
                  fontSize: "11px",
                  opacity: 0.6,
                  marginTop: "2px",
                }}
              >
                {floor.description}
              </span>
            </button>
          ))}
        </div>
      )}

      {isOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9998,
          }}
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
