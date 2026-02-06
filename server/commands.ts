import type { CommandMessage, CmdAckMessage } from "./types";
import { getDevice, addPendingCommand } from "./state";

const COMMAND_TIMEOUT_MS = 10_000;

function generateCmdId(): string {
  return crypto.randomUUID().slice(0, 8);
}

export function sendCommand(
  deviceId: string,
  action: CommandMessage["action"],
  params: Record<string, unknown> = {}
): Promise<CmdAckMessage> {
  const device = getDevice(deviceId);
  if (!device) throw new Error("device_not_found");
  if (!device.online || !device.ws) throw new Error("device_offline");

  const cmd_id = generateCmdId();
  const message: CommandMessage = { type: "cmd", cmd_id, action, params };

  return new Promise<CmdAckMessage>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("command_timeout"));
    }, COMMAND_TIMEOUT_MS);

    addPendingCommand({
      cmd_id,
      device_id: deviceId,
      action,
      sent_at: Date.now(),
      resolve,
      reject,
      timeout,
    });

    device.ws!.send(JSON.stringify(message));

    device.command_history.push({
      cmd_id,
      action,
      sent_at: Date.now(),
      ack: null,
      acked_at: null,
    });
    if (device.command_history.length > 50) {
      device.command_history.shift();
    }
  });
}
