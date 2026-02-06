#pragma once

// ---- Network ----
const char* const WIFI_SSID = "Asaf";
const char* const WIFI_PASS = "122122122";
const char* const WS_URL    = "ws://10.0.0.6:4444";
const char* const DEVICE_ID = "esp32-001";

// ---- Pins ----
const int PIN_SERVO       = 13;
const int PIN_BALL_SENSOR = 14;  // IR break-beam digital input

// ---- Servo angles ----
const int SERVO_CLOSED_ANGLE = 0;
const int SERVO_OPEN_ANGLE   = 90;

// ---- Timing (ms) ----
const unsigned long STATUS_INTERVAL_MS    = 2000;
const unsigned long SENSOR_CHECK_MS       = 200;
const unsigned long RECONNECT_INTERVAL_MS = 3000;
const unsigned long DISPENSE_TIMEOUT_MS   = 3000;

// ---- Thresholds ----
const int LOW_BALL_THRESHOLD = 3;
const int INITIAL_BALL_COUNT = 20;

// ---- JSON buffer ----
const int JSON_DOC_SIZE = 512;
