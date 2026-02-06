const server = Bun.serve({
  port: 4444,
  fetch(req, server) {
    if (server.upgrade(req)) return;
    return new Response("WebSocket server running");
  },
  websocket: {
    open(ws) {
      console.log("ESP32 connected!");
    },
    message(ws, message) {
      console.log("Received:", message);
      ws.send(`echo: ${message}`);
    },
    close(ws) {
      console.log("ESP32 disconnected");
    },
  },
});

console.log(`WebSocket server listening on ws://10.0.0.6:${server.port}`);
