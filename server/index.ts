import type { WsData } from "./types";
import { handleOpen, handleMessage, handleClose } from "./ws-handler";
import { handleRequest } from "./routes";

const server = Bun.serve<WsData>({
  port: parseInt(process.env.PORT || "4444"),
  fetch(req, server) {
    if (server.upgrade(req, { data: { device_id: null } })) return;
    return handleRequest(req);
  },
  websocket: {
    open: handleOpen,
    message: handleMessage,
    close: handleClose,
  },
});

console.log(`Server listening on http://0.0.0.0:${server.port}`);
console.log(`  WebSocket: ws://0.0.0.0:${server.port}`);
console.log(`  REST API:  http://0.0.0.0:${server.port}/api/`);
