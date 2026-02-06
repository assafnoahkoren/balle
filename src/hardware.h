#pragma once

#include <Arduino.h>

enum DispenserStateEnum { DISP_IDLE = 0, DISP_DISPENSING = 1, DISP_ERROR = 2 };

struct DispenserStatus {
    DispenserStateEnum state;
    unsigned long lastDispenseTs;
    int totalDispensed;
    int ballCount;
    char error[32];
};

void initHardware();
DispenserStatus& getDispenserStatus();
bool dispense(int count);
void checkSensor();
