#include <Arduino.h>
#include <DHT.h>
#include <Wire.h>
#include <BH1750.h>
#include <Adafruit_Sensor.h>
#include <PubSubClient.h>
#include <WiFiManager.h>
#include <ArduinoJson.h>
#include <Preferences.h>

const char* mqtt_server = "192.168.1.55";
const char* mqtt_user = "espuser";
const char* mqtt_pass = "123456";

WiFiClient espClient;
PubSubClient client(espClient);

Preferences preferences;
//Sensor

BH1750 lightMeter;
#define DHTPIN 4
#define DHTTYPE DHT11
DHT dht(DHTPIN,DHTTYPE);

#define RELAY1 25
#define RELAY2 33
#define RELAY3 32

const char* RELAY1_STATUS_TOPIC = "esp/status/relay1";
const char* RELAY2_STATUS_TOPIC = "esp/status/relay2";
const char* RELAY3_STATUS_TOPIC = "esp/status/relay3";

// =================== Khai báo prototype ===================
void controlRelay(String message);

void controlRelay(String message) {
    uint8_t pin = 0;
    uint8_t state = 0;
    const char* status_topic = nullptr;
    const char* relay_name = nullptr;
    const char* state_str = nullptr;

    if (message == "LED1 ON")      { pin = RELAY1; state = HIGH; status_topic = RELAY1_STATUS_TOPIC; relay_name = "RELAY1"; state_str = "ON"; }
    else if (message == "LED1 OFF") { pin = RELAY1; state = LOW;  status_topic = RELAY1_STATUS_TOPIC; relay_name = "RELAY1"; state_str = "OFF"; }
    else if (message == "LED2 ON")  { pin = RELAY2; state = HIGH; status_topic = RELAY2_STATUS_TOPIC; relay_name = "RELAY2"; state_str = "ON"; }
    else if (message == "LED2 OFF") { pin = RELAY2; state = LOW;  status_topic = RELAY2_STATUS_TOPIC; relay_name = "RELAY2"; state_str = "OFF"; }
    else if (message == "LED3 ON")  { pin = RELAY3; state = HIGH; status_topic = RELAY3_STATUS_TOPIC; relay_name = "RELAY3"; state_str = "ON"; }
    else if (message == "LED3 OFF") { pin = RELAY3; state = LOW;  status_topic = RELAY3_STATUS_TOPIC; relay_name = "RELAY3"; state_str = "OFF"; }

    if (pin != 0) {
        digitalWrite(pin, state);
        Serial.printf("%s state changed to %s\n", relay_name, state_str);

        // Lưu trạng thái mới vào Preferences
        preferences.begin("relay-states", false);
        preferences.putUChar(relay_name, state);
        preferences.end();

        // Gửi trạng thái mới lên MQTT
        JsonDocument statusDoc;
        char jsonStatus[64];
        statusDoc["relay"] = relay_name;
        statusDoc["state"] = state_str;
        serializeJson(statusDoc, jsonStatus);
        client.publish(status_topic, jsonStatus);
        Serial.println("Publishes status: " + String(jsonStatus));
    }
}

void callback(char* topic, byte* payload,unsigned int length)
{
    String msg ="";
    for (unsigned int i =0;i< length;i++) msg+= (char)payload[i];
    Serial.print("Received on topic ");
    Serial.print(topic);
    Serial.print(": ");
    Serial.println(msg);

    controlRelay(msg);
}

void reconnect()
{
    while (!client.connected())
    {
        Serial.print("Connecting MQTT...");
        if(client.connect("ESP32client","espuser","123456"))
        {
            Serial.println("Connected");
            client.subscribe("esp/control");
        }
        else{
            Serial.print("Failed, rc=");
            Serial.println(client.state());
            delay(2000);
        }
    }
}

void setup()
{
    Serial.begin(115200);

    pinMode(RELAY1,OUTPUT);
    pinMode(RELAY2,OUTPUT);
    pinMode(RELAY3,OUTPUT);

    // Khởi tạo Preferences và khôi phục trạng thái relay
    preferences.begin("relay-states", false); // Mở namespace "relay-states", false = read/write
    digitalWrite(RELAY1, preferences.getUChar("relay1", LOW)); // Đọc trạng thái relay1, mặc định là LOW nếu chưa có
    digitalWrite(RELAY2, preferences.getUChar("relay2", LOW)); // Đọc trạng thái relay2
    digitalWrite(RELAY3, preferences.getUChar("relay3", LOW)); // Đọc trạng thái relay3
    Serial.println("Restored relay states from Preferences.");
    Serial.printf("Initial states: R1=%d, R2=%d, R3=%d\n", digitalRead(RELAY1), digitalRead(RELAY2), digitalRead(RELAY3));
    preferences.end(); // Đóng preferences


    WiFiManager wm;

    if(!wm.autoConnect("ESP32_ConfifAP"))
    {
        Serial.printf("Failed to connect WIFI");
        ESP.restart();
    }
    Serial.println("WiFi connected! IP: " + WiFi.localIP().toString());

    client.setServer(mqtt_server, 1883);
    client.setCallback(callback);

    Wire.begin();
    if(!lightMeter.begin(BH1750::CONTINUOUS_HIGH_RES_MODE)) Serial.println("BH1750 not detected!");
    dht.begin();
}

void loop()
{
    if(!client.connected()) reconnect();
    client.loop();

    // Phần code đọc cảm biến và gửi đi vẫn giữ nguyên

    float lux = lightMeter.readLightLevel();
    float temp = dht.readTemperature();
    float hum = dht.readHumidity();

    JsonDocument doc;

    doc["temperature"] = temp;
    doc["humidity"] = hum;
    doc["luminosity"] = lux;    

    char payload[256];
    serializeJson(doc, payload);


    client.publish("esp/sensor", payload);
    Serial.println("Publishes: "+ String(payload));

    delay(5000);
}
