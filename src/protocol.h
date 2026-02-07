#pragma once

#include <ArduinoJson.h>
#include <WiFi.h>
#include "config.h"
#include "hardware.h"

// Message type constants
const char* const MSG_STATUS  = "status";
const char* const MSG_CMD_ACK = "cmd_ack";
const char* const MSG_EVENT   = "event";
const char* const MSG_CMD     = "cmd";

String buildStatusJson(const DispenserStatus& ds) {
    ServoConfig& sc = getServoConfig();
    JsonDocument doc;
    doc["type"] = MSG_STATUS;
    doc["device_id"] = DEVICE_ID;
    doc["uptime_s"] = millis() / 1000;
    doc["free_heap"] = ESP.getFreeHeap();
    doc["wifi_rssi"] = WiFi.RSSI();
    doc["ip"] = WiFi.localIP().toString();
    doc["cpu_freq_mhz"] = ESP.getCpuFreqMHz();
    doc["temp_c"] = temperatureRead();
    doc["ball_count"] = ds.ballCount;
    doc["servo_open_angle"] = sc.openAngle;
    doc["servo_settle_ms"] = sc.settleMs;
    doc["sensor_distance_mm"] = getLastDistance();

    JsonObject disp = doc["dispenser"].to<JsonObject>();
    const char* stateStr = (ds.state == 0) ? "idle" : (ds.state == 1) ? "dispensing" : "error";
    disp["state"] = stateStr;
    disp["last_dispense_ts"] = ds.lastDispenseTs;
    disp["total_dispensed"] = ds.totalDispensed;
    disp["error"] = ds.error[0] ? ds.error : (const char*)nullptr;

    String output;
    serializeJson(doc, output);
    return output;
}

String buildAckJson(const char* cmd_id, bool success, const char* error, int ballsRemaining) {
    JsonDocument doc;
    doc["type"] = MSG_CMD_ACK;
    doc["device_id"] = DEVICE_ID;
    doc["cmd_id"] = cmd_id;
    doc["success"] = success;
    doc["error"] = error[0] ? error : (const char*)nullptr;
    doc["data"]["balls_remaining"] = ballsRemaining;

    String output;
    serializeJson(doc, output);
    return output;
}

String buildEventJson(const char* event, int ballCount) {
    JsonDocument doc;
    doc["type"] = MSG_EVENT;
    doc["device_id"] = DEVICE_ID;
    doc["event"] = event;
    doc["data"]["ball_count"] = ballCount;

    String output;
    serializeJson(doc, output);
    return output;
}

struct ParsedCommand {
    char cmd_id[16];
    char action[24];
    JsonDocument doc;  // keeps params memory alive
};

bool parseCommand(const char* json, ParsedCommand& cmd) {
    DeserializationError err = deserializeJson(cmd.doc, json);
    if (err) {
        Serial.print("[proto] JSON parse error: ");
        Serial.println(err.c_str());
        return false;
    }
    if (strcmp(cmd.doc["type"] | "", MSG_CMD) != 0) {
        return false;
    }
    strlcpy(cmd.cmd_id, cmd.doc["cmd_id"] | "", sizeof(cmd.cmd_id));
    strlcpy(cmd.action, cmd.doc["action"] | "", sizeof(cmd.action));
    return true;
}
