import { getAllDevices, getDevice } from "./state";
import { sendCommand } from "./commands";
import type { DeviceState } from "./types";

function serializeDevice(d: DeviceState) {
  const { ws, ...rest } = d;
  return rest;
}

function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function jsonWithCors(data: unknown, init?: ResponseInit): Response {
  const headers = { ...corsHeaders(), ...init?.headers };
  return Response.json(data, { ...init, headers });
}

export async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const { pathname } = url;
  const method = req.method;

  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  // GET /api/health
  if (method === "GET" && pathname === "/api/health") {
    return jsonWithCors({ status: "ok", uptime_s: process.uptime() });
  }

  // GET /api/devices
  if (method === "GET" && pathname === "/api/devices") {
    return jsonWithCors(getAllDevices().map(serializeDevice));
  }

  // GET /api/devices/:id
  const deviceMatch = pathname.match(/^\/api\/devices\/([^/]+)$/);
  if (method === "GET" && deviceMatch) {
    const device = getDevice(deviceMatch[1]!);
    if (!device)
      return jsonWithCors({ error: "device_not_found" }, { status: 404 });
    return jsonWithCors(serializeDevice(device));
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
      return jsonWithCors({
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
      return jsonWithCors({ error: "invalid_body" }, { status: 400 });
    }

    try {
      const ack = await sendCommand(
        deviceId,
        body.action as any,
        body.params ?? {}
      );
      return jsonWithCors({
        success: ack.success,
        error: ack.error,
        data: ack.data,
      });
    } catch (err: any) {
      return errorResponse(err);
    }
  }

  // ── Client-facing endpoints (from webapp) ──

  // POST /api/dispense  { dispensaryId, userId }
  if (method === "POST" && pathname === "/api/dispense") {
    let body: { dispensaryId?: string; userId?: string } = {};
    try {
      body = (await req.json()) as typeof body;
    } catch {
      return jsonWithCors({ error: "invalid_body" }, { status: 400 });
    }

    const { dispensaryId, userId } = body;
    if (!dispensaryId || !userId || !/^\d{9}$/.test(userId)) {
      return jsonWithCors(
        { error: "invalid_request", message: "dispensaryId and a 9-digit userId are required" },
        { status: 400 }
      );
    }

    try {
      const ack = await sendCommand(dispensaryId, "dispense", { count: 1 });
      return jsonWithCors({
        success: ack.success,
        error: ack.error,
        message: ack.success ? "Ball dispensed!" : (ack.error ?? "Dispense failed"),
        data: ack.data,
      });
    } catch (err: any) {
      return errorResponse(err);
    }
  }

  // POST /api/return  { dispensaryId, userId }
  if (method === "POST" && pathname === "/api/return") {
    let body: { dispensaryId?: string; userId?: string } = {};
    try {
      body = (await req.json()) as typeof body;
    } catch {
      return jsonWithCors({ error: "invalid_body" }, { status: 400 });
    }

    const { dispensaryId, userId } = body;
    if (!dispensaryId || !userId || !/^\d{9}$/.test(userId)) {
      return jsonWithCors(
        { error: "invalid_request", message: "dispensaryId and a 9-digit userId are required" },
        { status: 400 }
      );
    }

    const device = getDevice(dispensaryId);
    if (!device) {
      return jsonWithCors({ error: "device_not_found", message: "Machine not found" }, { status: 404 });
    }

    const currentCount = device.status?.ball_count ?? 0;

    try {
      const ack = await sendCommand(dispensaryId, "set_ball_count", {
        count: currentCount + 1,
      });
      return jsonWithCors({
        success: ack.success,
        error: ack.error,
        message: ack.success ? "Ball returned!" : (ack.error ?? "Return failed"),
        data: ack.data,
      });
    } catch (err: any) {
      return errorResponse(err);
    }
  }

  return jsonWithCors({ error: "not_found" }, { status: 404 });
}

function errorResponse(err: Error): Response {
  switch (err.message) {
    case "device_not_found":
      return jsonWithCors({ error: "device_not_found" }, { status: 404 });
    case "device_offline":
      return jsonWithCors({ error: "device_offline" }, { status: 503 });
    case "command_timeout":
      return jsonWithCors({ error: "command_timeout" }, { status: 504 });
    default:
      return jsonWithCors({ error: err.message }, { status: 500 });
  }
}
