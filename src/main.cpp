#include <Arduino.h>

void setup() {
    Serial.begin(115200);
    delay(1000);
    Serial.println("Hello World from ESP32!");
}

void loop() {
    Serial.println("Still alive...");
    delay(2000);
}
