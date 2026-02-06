#include "hardware.h"
#include "config.h"
#include <ESP32Servo.h>

static Servo servo;
static DispenserStatus status;
static ServoConfig servoConfig;
static int prevBallCount = 0;

// Forward declaration for event sending (implemented in comms.cpp)
extern void sendEvent(const char* event, int ballCount);

void initHardware() {
    servo.attach(PIN_SERVO);
    servo.write(SERVO_CLOSED_ANGLE);
    pinMode(PIN_BALL_SENSOR, INPUT_PULLUP);

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

        // Open the gate
        servo.write(servoConfig.openAngle);
        delay(servoConfig.settleMs);

        // // Wait for ball to pass sensor (sensor goes LOW when ball passes)
        // unsigned long start = millis();
        // bool ballPassed = false;
        // while (millis() - start < DISPENSE_TIMEOUT_MS) {
        //     if (digitalRead(PIN_BALL_SENSOR) == LOW) {
        //         ballPassed = true;
        //         break;
        //     }
        //     delay(10);
        // }

        // Close the gate
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
