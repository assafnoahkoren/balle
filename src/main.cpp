#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>

const char* WIFI_SSID = "Asaf";
const char* WIFI_PASS = "122122122";

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
    Serial.println("Connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());

    HTTPClient http;
    http.begin("https://webhook.site/81614a16-577c-4ac6-bcd7-0732ed262830");
    http.addHeader("Content-Type", "application/json");

    int httpCode = http.POST("{\"device\":\"ESP32-S3\",\"message\":\"Hello from ESP32!\",\"uptime_ms\":" + String(millis()) + "}");

    Serial.print("HTTP response: ");
    Serial.println(httpCode);

    http.end();
}

void loop() {
    delay(2000);
}
