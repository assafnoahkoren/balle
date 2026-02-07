#include <Arduino.h>
#include <Wire.h>
#include <VL53L0X.h>

VL53L0X sensor;

void setup() {
    Serial.begin(115200);
    delay(1000);
    Serial.println("VL53L0X Test");

    Wire.begin(8, 9);  // SDA=GPIO8, SCL=GPIO9

    sensor.setTimeout(500);
    if (!sensor.init()) {
        Serial.println("ERROR: VL53L0X not detected. Check wiring!");
        while (1) {}
    }

    sensor.startContinuous();
    Serial.println("Sensor ready. Reading distance...");
}

void loop() {
    int dist = sensor.readRangeContinuousMillimeters();
    if (sensor.timeoutOccurred()) {
        Serial.println("TIMEOUT");
    } else {
        Serial.print("Distance: ");
        Serial.print(dist);
        Serial.println(" mm");
    }
    delay(200);
}
