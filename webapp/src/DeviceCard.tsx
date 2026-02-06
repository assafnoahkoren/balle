import { useState } from "react";
import type { DeviceStatus } from "./types";

export function DeviceCard({ device }: { device: DeviceStatus }) {
  const [dispensing, setDispensing] = useState(false);
  const s = device.status;

  async function handleDispense() {
    setDispensing(true);
    try {
      await fetch(`/api/devices/${device.device_id}/dispense`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 1 }),
      });
    } finally {
      setDispensing(false);
    }
  }

  const stateClass = !device.online
    ? "offline"
    : s?.dispenser.state === "error"
      ? "error"
      : "online";

  return (
    <div className={`device-card ${stateClass}`}>
      <div className="card-header">
        <span className={`status-dot ${stateClass}`} />
        <h2>{device.device_id}</h2>
        <span className="status-label">
          {device.online ? "Online" : "Offline"}
        </span>
      </div>

      {s ? (
        <>
          <div className="card-body">
            <div className="stat-row">
              <span className="stat-label">Balls</span>
              <span className="stat-value ball-count">{s.ball_count}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Dispensed</span>
              <span className="stat-value">{s.dispenser.total_dispensed}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">State</span>
              <span className={`stat-value state-${s.dispenser.state}`}>
                {s.dispenser.state}
              </span>
            </div>
            {s.dispenser.error && (
              <div className="stat-row">
                <span className="stat-label">Error</span>
                <span className="stat-value error-text">
                  {s.dispenser.error}
                </span>
              </div>
            )}
            <hr />
            <div className="stat-row">
              <span className="stat-label">IP</span>
              <span className="stat-value">{s.ip}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">WiFi</span>
              <span className="stat-value">{s.wifi_rssi} dBm</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Uptime</span>
              <span className="stat-value">{formatUptime(s.uptime_s)}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Heap</span>
              <span className="stat-value">
                {(s.free_heap / 1024).toFixed(0)} KB
              </span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Temp</span>
              <span className="stat-value">{s.temp_c.toFixed(1)}°C</span>
            </div>
          </div>

          <button
            className="dispense-btn"
            onClick={handleDispense}
            disabled={dispensing || !device.online}
          >
            {dispensing ? "Dispensing..." : "Dispense Ball"}
          </button>
        </>
      ) : (
        <div className="card-body">
          <p className="no-data">Awaiting first status...</p>
        </div>
      )}
    </div>
  );
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
