#include <Arduino.h>
#include <WiFi.h>
#include <ArduinoWebsockets.h>

using namespace websockets;

const char* WIFI_SSID = "Asaf";
const char* WIFI_PASS = "122122122";
const char* WS_URL = "ws://10.0.0.6:4444";

WebsocketsClient client;
bool connected = false;
int counter = 0;
unsigned long lastReconnectAttempt = 0;

void onMessageCallback(WebsocketsMessage message) {
    Serial.print("Got command: ");
    Serial.println(message.data());
}

void onEventsCallback(WebsocketsEvent event, String data) {
    if (event == WebsocketsEvent::ConnectionOpened) {
        Serial.println("WebSocket connected!");
        connected = true;
    } else if (event == WebsocketsEvent::ConnectionClosed) {
        Serial.println("WebSocket disconnected!");
        connected = false;
    }
}

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

    client.onMessage(onMessageCallback);
    client.onEvent(onEventsCallback);
    client.connect(WS_URL);
}

void loop() {
    if (connected) {
        client.poll();
        client.send("Message #" + String(counter));
        Serial.println("Sent: Message #" + String(counter));
        counter++;
    } else if (millis() - lastReconnectAttempt > 3000) {
        lastReconnectAttempt = millis();
        Serial.println("Reconnecting...");
        client = WebsocketsClient();
        client.onMessage(onMessageCallback);
        client.onEvent(onEventsCallback);
        client.connect(WS_URL);
    }

    delay(2000);
}
