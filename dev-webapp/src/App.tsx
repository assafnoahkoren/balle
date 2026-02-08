import { useEffect, useState } from "react";
import type { DeviceStatus } from "./types";
import { DeviceCard } from "./DeviceCard";
import "./App.css";

function App() {
  const [devices, setDevices] = useState<DeviceStatus[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function poll() {
      while (active) {
        try {
          const res = await fetch("/api/devices");
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data: DeviceStatus[] = await res.json();
          setDevices(data);
          setError(null);
        } catch (e: any) {
          setError(e.message);
        }
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    poll();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="app">
      <h1>Balle Dispensary</h1>
      {error && <div className="error-banner">Server unreachable: {error}</div>}
      {devices.length === 0 && !error && (
        <p className="empty">No devices connected</p>
      )}
      <div className="device-grid">
        {devices.map((d) => (
          <DeviceCard key={d.device_id} device={d} />
        ))}
      </div>
    </div>
  );
}

export default App;
