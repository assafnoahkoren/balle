#include "hardware.h"
#include "config.h"
#include <ESP32Servo.h>
#include <Wire.h>
#include <VL53L0X.h>

static Servo servo;
static VL53L0X distSensor;
static DispenserStatus status;
static ServoConfig servoConfig;
static int prevBallCount = 0;
static int lastDistance = 0;

// Forward declaration for event sending (implemented in comms.cpp)
extern void sendEvent(const char* event, int ballCount);

// Read a smoothed distance (average of a few samples to reduce noise)
static int readDistance() {
    int sum = 0;
    const int samples = 3;
    for (int i = 0; i < samples; i++) {
        int d = distSensor.readRangeContinuousMillimeters();
        if (distSensor.timeoutOccurred()) return -1;
        sum += d;
        delay(5);
    }
    lastDistance = sum / samples;
    return lastDistance;
}

// Take a stable baseline reading (average of more samples)
static int readBaseline() {
    int sum = 0;
    const int samples = 5;
    for (int i = 0; i < samples; i++) {
        int d = distSensor.readRangeContinuousMillimeters();
        if (distSensor.timeoutOccurred()) return -1;
        sum += d;
        delay(10);
    }
    return sum / samples;
}

void initHardware() {
    servo.attach(PIN_SERVO);
    servo.write(SERVO_CLOSED_ANGLE);

    Wire.begin(8, 9);
    distSensor.setTimeout(500);
    if (!distSensor.init()) {
        Serial.println("[hw] VL53L0X not detected!");
    } else {
        distSensor.startContinuous();
        Serial.println("[hw] VL53L0X ready");
    }

    status.state = DISP_IDLE;
    status.lastDispenseTs = 0;
    status.totalDispensed = 0;
    status.ballCount = INITIAL_BALL_COUNT;
    status.error[0] = '\0';
    prevBallCount = INITIAL_BALL_COUNT;

    servoConfig.openAngle = SERVO_OPEN_ANGLE;
    servoConfig.settleMs = 200;
}

DispenserStatus& getDispenserStatus() {
    return status;
}

ServoConfig& getServoConfig() {
    return servoConfig;
}

int getLastDistance() {
    return lastDistance;
}

bool dispense(int count) {
    if (status.ballCount <= 0) {
        strlcpy(status.error, "empty", sizeof(status.error));
        status.state = DISP_ERROR;
        return false;
    }

    status.state = DISP_DISPENSING;
    status.error[0] = '\0';

    for (int i = 0; i < count; i++) {
        if (status.ballCount <= 0) {
            strlcpy(status.error, "empty", sizeof(status.error));
            status.state = DISP_ERROR;
            return false;
        }

        // 1. Read baseline distance (ball sitting in front of sensor)
        int baseline = readBaseline();
        if (baseline < 0) {
            strlcpy(status.error, "sensor_timeout", sizeof(status.error));
            status.state = DISP_ERROR;
            return false;
        }
        // Departure threshold: distance must rise by >50% above baseline
        int departThreshold = baseline + (baseline / 2);

        Serial.printf("[hw] Baseline=%dmm, depart threshold=%dmm\n", baseline, departThreshold);

        // 2. Open the gate
        servo.write(servoConfig.openAngle);

        // 3. Wait for ball to depart (distance rises well above baseline)
        unsigned long start = millis();
        bool departed = false;
        while (millis() - start < DISPENSE_TIMEOUT_MS) {
            int d = readDistance();
            if (d > departThreshold) {
                departed = true;
                Serial.printf("[hw] Ball departed, dist=%dmm\n", d);
                break;
            }
            delay(10);
        }

        if (!departed) {
            // Keep gate open — ball may be stuck, don't crush it
            strlcpy(status.error, "no_departure", sizeof(status.error));
            status.state = DISP_ERROR;
            return false;
        }

        // 4. Brief delay for ball to physically clear the gate
        delay(200);

        // 5. Close the gate
        servo.write(SERVO_CLOSED_ANGLE);
        delay(servoConfig.settleMs);

        status.ballCount--;
        status.totalDispensed++;
        status.lastDispenseTs = millis() / 1000;
    }

    status.state = DISP_IDLE;
    return true;
}

void checkSensor() {
    // Keep lastDistance updated for status reports
    readDistance();

    // Detect ball count changes and fire events
    if (status.ballCount != prevBallCount) {
        if (status.ballCount == 0) {
            sendEvent("empty", status.ballCount);
        } else if (status.ballCount <= LOW_BALL_THRESHOLD && prevBallCount > LOW_BALL_THRESHOLD) {
            sendEvent("low_balls", status.ballCount);
        } else if (status.ballCount > prevBallCount) {
            sendEvent("refilled", status.ballCount);
        }
        prevBallCount = status.ballCount;
    }
}
