#include "comms.h"
#include "config.h"
#include "protocol.h"
#include "hardware.h"
#include <ArduinoWebsockets.h>

using namespace websockets;

static WebsocketsClient client;
static bool wsConnected = false;
static unsigned long lastReconnectAttempt = 0;

static void onMessage(WebsocketsMessage message) {
    ParsedCommand cmd;
    if (!parseCommand(message.data().c_str(), cmd)) {
        Serial.println("[comms] Ignored non-command message");
        return;
    }

    Serial.printf("[comms] Command: action=%s cmd_id=%s\n", cmd.action, cmd.cmd_id);

    if (strcmp(cmd.action, "dispense") == 0) {
        int count = cmd.doc["params"]["count"] | 1;
        bool ok = dispense(count);
        DispenserStatus& ds = getDispenserStatus();
        sendAck(cmd.cmd_id, ok, ds.error, ds.ballCount);

    } else if (strcmp(cmd.action, "set_ball_count") == 0) {
        int count = cmd.doc["params"]["count"] | 0;
        DispenserStatus& ds = getDispenserStatus();
        ds.ballCount = count;
        ds.state = DISP_IDLE;
        ds.error[0] = '\0';
        sendAck(cmd.cmd_id, true, "", ds.ballCount);

    } else if (strcmp(cmd.action, "ping") == 0) {
        sendStatus();
        DispenserStatus& ds = getDispenserStatus();
        sendAck(cmd.cmd_id, true, "", ds.ballCount);

    } else if (strcmp(cmd.action, "set_config") == 0) {
        ServoConfig& sc = getServoConfig();
        if (cmd.doc["params"].containsKey("servo_open_angle")) {
            sc.openAngle = cmd.doc["params"]["servo_open_angle"] | sc.openAngle;
        }
        if (cmd.doc["params"].containsKey("servo_settle_ms")) {
            sc.settleMs = cmd.doc["params"]["servo_settle_ms"] | sc.settleMs;
        }
        DispenserStatus& ds = getDispenserStatus();
        sendAck(cmd.cmd_id, true, "", ds.ballCount);

    } else {
        DispenserStatus& ds = getDispenserStatus();
        sendAck(cmd.cmd_id, false, "unknown_action", ds.ballCount);
    }
}

static void onEvent(WebsocketsEvent event, String data) {
    if (event == WebsocketsEvent::ConnectionOpened) {
        Serial.println("[comms] WebSocket connected");
        wsConnected = true;
    } else if (event == WebsocketsEvent::ConnectionClosed) {
        Serial.println("[comms] WebSocket disconnected");
        wsConnected = false;
    }
}

void initWebSocket() {
    client.onMessage(onMessage);
    client.onEvent(onEvent);
    client.connect(WS_URL);
}

void pollWebSocket() {
    if (wsConnected) {
        client.poll();
    }
}

void handleReconnect() {
    if (!wsConnected && millis() - lastReconnectAttempt > RECONNECT_INTERVAL_MS) {
        lastReconnectAttempt = millis();
        Serial.println("[comms] Reconnecting...");
        client = WebsocketsClient();
        client.onMessage(onMessage);
        client.onEvent(onEvent);
        client.connect(WS_URL);
    }
}

void sendStatus() {
    if (!wsConnected) return;
    DispenserStatus& ds = getDispenserStatus();
    String json = buildStatusJson(ds);
    client.send(json);
    Serial.println("[comms] Status sent");
}

void sendAck(const char* cmd_id, bool success, const char* error, int ballsRemaining) {
    if (!wsConnected) return;
    String json = buildAckJson(cmd_id, success, error, ballsRemaining);
    client.send(json);
    Serial.printf("[comms] Ack sent: cmd_id=%s success=%d\n", cmd_id, success);
}

void sendEvent(const char* event, int ballCount) {
    if (!wsConnected) return;
    String json = buildEventJson(event, ballCount);
    client.send(json);
    Serial.printf("[comms] Event sent: %s balls=%d\n", event, ballCount);
}
