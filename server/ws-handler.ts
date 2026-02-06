import type { ServerWebSocket } from "bun";
import type { WsData, EspMessage } from "./types";
import {
  upsertDevice,
  getDevice,
  resolvePendingCommand,
  rejectPendingCommandsForDevice,
} from "./state";

export function handleOpen(ws: ServerWebSocket<WsData>): void {
  console.log("[ws] Connection opened, awaiting device identification...");
  ws.data.device_id = null;
}

export function handleMessage(
  ws: ServerWebSocket<WsData>,
  raw: string | Buffer
): void {
  const text = typeof raw === "string" ? raw : raw.toString();
  let msg: EspMessage;
  try {
    msg = JSON.parse(text);
  } catch {
    console.error("[ws] Invalid JSON:", text);
    return;
  }

  switch (msg.type) {
    case "status":
      if (!ws.data.device_id) {
        ws.data.device_id = msg.device_id;
        console.log(`[ws] Device identified: ${msg.device_id}`);
      }
      upsertDevice(msg.device_id, {
        online: true,
        last_seen: Date.now(),
        ws,
        status: msg,
      });
      break;

    case "cmd_ack": {
      console.log(
        `[ws] Ack for cmd ${msg.cmd_id}: success=${msg.success}`
      );
      resolvePendingCommand(msg.cmd_id, msg);
      const device = getDevice(msg.device_id);
      if (device) {
        const entry = device.command_history.find(
          (h) => h.cmd_id === msg.cmd_id
        );
        if (entry) {
          entry.ack = msg;
          entry.acked_at = Date.now();
        }
      }
      break;
    }

    case "event":
      console.log(
        `[ws] Event from ${msg.device_id}: ${msg.event}`,
        msg.data
      );
      break;

    default:
      console.warn("[ws] Unknown message type:", (msg as any).type);
  }
}

export function handleClose(ws: ServerWebSocket<WsData>): void {
  const deviceId = ws.data.device_id;
  if (deviceId) {
    console.log(`[ws] Device disconnected: ${deviceId}`);
    upsertDevice(deviceId, { online: false, ws: null });
    rejectPendingCommandsForDevice(deviceId);
  }
}
