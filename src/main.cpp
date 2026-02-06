#include <Arduino.h>
#include <WiFi.h>

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
}

void loop() {
    delay(2000);
}
