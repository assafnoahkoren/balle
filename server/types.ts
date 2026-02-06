import type { ServerWebSocket } from "bun";

// --- ESP -> Server messages ---

export interface StatusMessage {
  type: "status";
  device_id: string;
  uptime_s: number;
  free_heap: number;
  wifi_rssi: number;
  ip: string;
  cpu_freq_mhz: number;
  temp_c: number;
  ball_count: number;
  servo_open_angle: number;
  servo_settle_ms: number;
  dispenser: {
    state: "idle" | "dispensing" | "error";
    last_dispense_ts: number;
    total_dispensed: number;
    error: string | null;
  };
}

export interface CmdAckMessage {
  type: "cmd_ack";
  device_id: string;
  cmd_id: string;
  success: boolean;
  error: string | null;
  data: Record<string, unknown>;
}

export interface EventMessage {
  type: "event";
  device_id: string;
  event: string;
  data: Record<string, unknown>;
}

export type EspMessage = StatusMessage | CmdAckMessage | EventMessage;

// --- Server -> ESP messages ---

export interface CommandMessage {
  type: "cmd";
  cmd_id: string;
  action: "dispense" | "set_ball_count" | "ping" | "set_config";
  params: Record<string, unknown>;
}

// --- Server internal state ---

export interface DeviceState {
  device_id: string;
  online: boolean;
  last_seen: number;
  ws: ServerWebSocket<WsData> | null;
  status: StatusMessage | null;
  command_history: CommandHistoryEntry[];
}

export interface CommandHistoryEntry {
  cmd_id: string;
  action: string;
  sent_at: number;
  ack: CmdAckMessage | null;
  acked_at: number | null;
}

export interface PendingCommand {
  cmd_id: string;
  device_id: string;
  action: string;
  sent_at: number;
  resolve: (ack: CmdAckMessage) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
}

// --- WebSocket per-connection data ---

export interface WsData {
  device_id: string | null;
}
