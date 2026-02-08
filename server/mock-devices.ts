/**
 * Mock ESP32 dispenser devices for local development.
 *
 * Usage:
 *   bun run mock-devices.ts              # 2 devices (default)
 *   bun run mock-devices.ts 5            # 5 devices
 */

const SERVER_URL = "ws://localhost:4444";
const STATUS_INTERVAL_MS = 2000;

interface DispenserState {
  state: "idle" | "dispensing" | "error";
  last_dispense_ts: number;
  total_dispensed: number;
  error: string | null;
}

interface MockDevice {
  id: string;
  label: string;
  ws: WebSocket | null;
  uptime_s: number;
  ball_count: number;
  servo_open_angle: number;
  servo_settle_ms: number;
  dispenser: DispenserState;
}

const MOCK_LABELS: Record<number, string> = {
  1: 'אולם ספורט ביה"ס היובל',
  2: "מרכז הקהילתי רמת גן",
};

function createDevice(index: number): MockDevice {
  return {
    id: `esp32-mock-${String(index).padStart(3, "0")}`,
    label: MOCK_LABELS[index] ?? `מכונה ${index}`,
    ws: null,
    uptime_s: 0,
    ball_count: 20,
    servo_open_angle: 60,
    servo_settle_ms: 200,
    dispenser: {
      state: "idle",
      last_dispense_ts: 0,
      total_dispensed: 0,
      error: null,
    },
  };
}

function buildStatus(d: MockDevice) {
  return JSON.stringify({
    type: "status",
    device_id: d.id,
    label: d.label,
    uptime_s: d.uptime_s,
    free_heap: 180000 + Math.floor(Math.random() * 20000),
    wifi_rssi: -40 - Math.floor(Math.random() * 30),
    ip: `192.168.1.${100 + parseInt(d.id.slice(-3))}`,
    cpu_freq_mhz: 240,
    temp_c: +(38 + Math.random() * 10).toFixed(1),
    ball_count: d.ball_count,
    servo_open_angle: d.servo_open_angle,
    servo_settle_ms: d.servo_settle_ms,
    sensor_distance_mm: d.ball_count > 0 ? 80 + Math.floor(Math.random() * 40) : 300,
    dispenser: { ...d.dispenser },
  });
}

function buildAck(d: MockDevice, cmd_id: string, success: boolean, error: string | null) {
  return JSON.stringify({
    type: "cmd_ack",
    device_id: d.id,
    cmd_id,
    success,
    error,
    data: { balls_remaining: d.ball_count },
  });
}

function buildEvent(d: MockDevice, event: string) {
  return JSON.stringify({
    type: "event",
    device_id: d.id,
    event,
    data: { ball_count: d.ball_count },
  });
}

async function handleCommand(d: MockDevice, raw: string) {
  const msg = JSON.parse(raw);
  if (msg.type !== "cmd") return;

  const { cmd_id, action, params } = msg;

  switch (action) {
    case "dispense": {
      const count = params?.count ?? 1;
      if (d.ball_count <= 0) {
        d.dispenser.state = "error";
        d.dispenser.error = "empty";
        d.ws?.send(buildAck(d, cmd_id, false, "empty"));
        return;
      }
      d.dispenser.state = "dispensing";
      // simulate dispensing delay
      await Bun.sleep(300 + Math.random() * 400);
      const dispensed = Math.min(count, d.ball_count);
      d.ball_count -= dispensed;
      d.dispenser.total_dispensed += dispensed;
      d.dispenser.last_dispense_ts = d.uptime_s;
      d.dispenser.state = "idle";
      d.dispenser.error = null;
      d.ws?.send(buildAck(d, cmd_id, true, null));

      if (d.ball_count === 0) {
        d.ws?.send(buildEvent(d, "empty"));
      } else if (d.ball_count <= 3) {
        d.ws?.send(buildEvent(d, "low_balls"));
      }
      break;
    }
    case "set_ball_count": {
      const prev = d.ball_count;
      d.ball_count = params?.count ?? 0;
      d.dispenser.state = "idle";
      d.dispenser.error = null;
      d.ws?.send(buildAck(d, cmd_id, true, null));
      if (d.ball_count > prev) {
        d.ws?.send(buildEvent(d, "refilled"));
      }
      break;
    }
    case "set_config": {
      if (params?.servo_open_angle != null) d.servo_open_angle = params.servo_open_angle;
      if (params?.servo_settle_ms != null) d.servo_settle_ms = params.servo_settle_ms;
      d.ws?.send(buildAck(d, cmd_id, true, null));
      break;
    }
    case "ping": {
      d.ws?.send(buildStatus(d));
      d.ws?.send(buildAck(d, cmd_id, true, null));
      break;
    }
    default:
      d.ws?.send(buildAck(d, cmd_id, false, "unknown_action"));
  }
}

function connect(d: MockDevice) {
  const ws = new WebSocket(SERVER_URL);

  ws.addEventListener("open", () => {
    console.log(`[${d.id}] connected`);
    d.ws = ws;
    ws.send(buildStatus(d));
  });

  ws.addEventListener("message", (ev) => {
    handleCommand(d, String(ev.data));
  });

  ws.addEventListener("close", () => {
    console.log(`[${d.id}] disconnected, reconnecting in 3s...`);
    d.ws = null;
    setTimeout(() => connect(d), 3000);
  });

  ws.addEventListener("error", () => {
    // close handler will fire next and reconnect
  });
}

// --- main ---

const count = parseInt(process.argv[2] || "2", 10);
const devices: MockDevice[] = [];

for (let i = 1; i <= count; i++) {
  devices.push(createDevice(i));
}

console.log(`Starting ${count} mock dispenser(s)...`);

for (const d of devices) {
  connect(d);

  // status heartbeat
  setInterval(() => {
    d.uptime_s += STATUS_INTERVAL_MS / 1000;
    if (d.ws?.readyState === WebSocket.OPEN) {
      d.ws.send(buildStatus(d));
    }
  }, STATUS_INTERVAL_MS);
}
