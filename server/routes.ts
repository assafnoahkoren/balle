import { getAllDevices, getDevice } from "./state";
import { sendCommand } from "./commands";
import type { DeviceState } from "./types";

function serializeDevice(d: DeviceState) {
  const { ws, ...rest } = d;
  return rest;
}

export async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const { pathname } = url;
  const method = req.method;

  // GET /api/health
  if (method === "GET" && pathname === "/api/health") {
    return Response.json({ status: "ok", uptime_s: process.uptime() });
  }

  // GET /api/devices
  if (method === "GET" && pathname === "/api/devices") {
    return Response.json(getAllDevices().map(serializeDevice));
  }

  // GET /api/devices/:id
  const deviceMatch = pathname.match(/^\/api\/devices\/([^/]+)$/);
  if (method === "GET" && deviceMatch) {
    const device = getDevice(deviceMatch[1]!);
    if (!device)
      return Response.json({ error: "device_not_found" }, { status: 404 });
    return Response.json(serializeDevice(device));
  }

  // POST /api/devices/:id/dispense
  const dispenseMatch = pathname.match(/^\/api\/devices\/([^/]+)\/dispense$/);
  if (method === "POST" && dispenseMatch) {
    const deviceId = dispenseMatch[1]!;
    let body: { count?: number } = {};
    try {
      body = await req.json();
    } catch {
      /* default to count=1 */
    }
    const count = body.count ?? 1;

    try {
      const ack = await sendCommand(deviceId, "dispense", { count });
      return Response.json({
        success: ack.success,
        error: ack.error,
        data: ack.data,
      });
    } catch (err: any) {
      return errorResponse(err);
    }
  }

  // POST /api/devices/:id/command
  const commandMatch = pathname.match(/^\/api\/devices\/([^/]+)\/command$/);
  if (method === "POST" && commandMatch) {
    const deviceId = commandMatch[1]!;
    let body: { action: string; params?: Record<string, unknown> };
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "invalid_body" }, { status: 400 });
    }

    try {
      const ack = await sendCommand(
        deviceId,
        body.action as any,
        body.params ?? {}
      );
      return Response.json({
        success: ack.success,
        error: ack.error,
        data: ack.data,
      });
    } catch (err: any) {
      return errorResponse(err);
    }
  }

  return Response.json({ error: "not_found" }, { status: 404 });
}

function errorResponse(err: Error): Response {
  switch (err.message) {
    case "device_not_found":
      return Response.json({ error: "device_not_found" }, { status: 404 });
    case "device_offline":
      return Response.json({ error: "device_offline" }, { status: 503 });
    case "command_timeout":
      return Response.json({ error: "command_timeout" }, { status: 504 });
    default:
      return Response.json({ error: err.message }, { status: 500 });
  }
}
