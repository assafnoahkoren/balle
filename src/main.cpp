#include <Arduino.h>
#include <WiFi.h>
#include "config.h"
#include "hardware.h"
#include "comms.h"

static unsigned long lastStatusSend = 0;
static unsigned long lastSensorCheck = 0;

void setup() {
    Serial.begin(115200);
    delay(1000);

    Serial.print("Connecting to WiFi");
    WiFi.begin(WIFI_SSID, WIFI_PASS);
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println();
    Serial.print("Connected! IP: ");
    Serial.println(WiFi.localIP());

    initHardware();
    initWebSocket();
}

void loop() {
    unsigned long now = millis();

    pollWebSocket();
    handleReconnect();

    if (now - lastStatusSend >= STATUS_INTERVAL_MS) {
        lastStatusSend = now;
        sendStatus();
    }

    if (now - lastSensorCheck >= SENSOR_CHECK_MS) {
        lastSensorCheck = now;
        checkSensor();
    }
}
