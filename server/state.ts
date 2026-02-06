import type { DeviceState, PendingCommand, CmdAckMessage } from "./types";

const devices = new Map<string, DeviceState>();
const pendingCommands = new Map<string, PendingCommand>();

const COMMAND_HISTORY_LIMIT = 50;

export function getDevice(id: string): DeviceState | undefined {
  return devices.get(id);
}

export function getAllDevices(): DeviceState[] {
  return Array.from(devices.values());
}

export function upsertDevice(id: string, partial: Partial<DeviceState>): DeviceState {
  const existing = devices.get(id);
  if (existing) {
    Object.assign(existing, partial);
    return existing;
  }
  const device: DeviceState = {
    device_id: id,
    online: false,
    last_seen: Date.now(),
    ws: null,
    status: null,
    command_history: [],
    ...partial,
  };
  devices.set(id, device);
  return device;
}

export function addPendingCommand(cmd: PendingCommand): void {
  pendingCommands.set(cmd.cmd_id, cmd);
}

export function resolvePendingCommand(cmd_id: string, ack: CmdAckMessage): boolean {
  const pending = pendingCommands.get(cmd_id);
  if (!pending) return false;
  clearTimeout(pending.timeout);
  pendingCommands.delete(cmd_id);
  pending.resolve(ack);
  return true;
}

export function rejectPendingCommandsForDevice(device_id: string): void {
  for (const [id, cmd] of pendingCommands) {
    if (cmd.device_id === device_id) {
      clearTimeout(cmd.timeout);
      pendingCommands.delete(id);
      cmd.reject(new Error("device_disconnected"));
    }
  }
}
