#pragma once

void initWebSocket();
void pollWebSocket();
void handleReconnect();
void sendStatus();
void sendAck(const char* cmd_id, bool success, const char* error, int ballsRemaining);
void sendEvent(const char* event, int ballCount);
