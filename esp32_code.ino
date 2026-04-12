#include <WiFi.h>
#include <ESPAsyncWebServer.h>
#include <ArduinoJson.h>
#include <AccelStepper.h>

// --- Configuration ---
const char* ssid = "VeiledCosmos_Mount";
const char* password = "astronomy-sky";

AsyncWebServer server(80);

// Pin Definitions for Adafruit ESP32 + TMC2209
// (Adjust these based on your specific wiring)
#define RA_STEP_PIN 12
#define RA_DIR_PIN  14
#define DEC_STEP_PIN 27
#define DEC_DIR_PIN  26

// Interface type 1 means a driver with Step and Direction pins
AccelStepper stepperRA(1, RA_STEP_PIN, RA_DIR_PIN);
AccelStepper stepperDec(1, DEC_STEP_PIN, DEC_DIR_PIN);

// --- Mechanical Specs ---
// Steps per revolution = (Motor Steps) * (Microsteps) * (Gear Reduction)
// Standard NEMA 17 is 200. TMC2209 default microstepping is often 16 or 64.
const float STEPS_PER_REV_RA = 10000.0;
const float STEPS_PER_REV_DEC = 10000.0;
const float DEFAULT_RA_SCALE = STEPS_PER_REV_RA / 24.0;
const float DEFAULT_DEC_SCALE = STEPS_PER_REV_DEC / 360.0;
float raScale = DEFAULT_RA_SCALE;
float raOffset = 0.0;
float decScale = DEFAULT_DEC_SCALE;
float decOffset = 0.0;
bool tracking = false;

void setup() {
  Serial.begin(115200);

  // Configure Steppers
  stepperRA.setMaxSpeed(1000);     // Adjust based on your power supply
  stepperRA.setAcceleration(500);  // Smooth start/stop
  stepperDec.setMaxSpeed(1000);
  stepperDec.setAcceleration(500);

  WiFi.softAP(ssid, password);

  // Handle the Slew Command from React
  server.on("/slew", HTTP_POST, [](AsyncWebServerRequest *request){}, NULL,
    [](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {

      StaticJsonDocument<200> doc;
      DeserializationError error = deserializeJson(doc, (const char*)data);

      if (error) {
        request->send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
        return;
      }

      float lha = doc["lha"]; // Hours
      float dec = doc["dec"]; // Degrees

      // Convert target LHA/DEC to steps using calibration parameters
      long targetRASteps = (long)(raScale * lha + raOffset);
      long targetDecSteps = (long)(decScale * dec + decOffset);

      stepperRA.moveTo(targetRASteps);
      stepperDec.moveTo(targetDecSteps);
      tracking = false; // Disable tracking during slew

      request->send(200, "application/json", "{\"status\":\"moving\"}");
  });

  // Handle Stop Command
  server.on("/stop", HTTP_POST, [](AsyncWebServerRequest *request){
    stepperRA.stop();
    stepperDec.stop();
    request->send(200, "application/json", "{\"status\":\"stopped\"}");
  });

  // Handle calibration parameter updates and reset
  server.on("/calibration", HTTP_POST, [](AsyncWebServerRequest *request){}, NULL,
    [](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {
      StaticJsonDocument<200> doc;
      DeserializationError error = deserializeJson(doc, (const char*)data);
      if (error) {
        request->send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
        return;
      }
      if (doc.containsKey("reset") && doc["reset"] == true) {
        raScale = DEFAULT_RA_SCALE;
        raOffset = 0.0;
        decScale = DEFAULT_DEC_SCALE;
        decOffset = 0.0;
        request->send(200, "application/json", "{\"status\":\"reset\"}");
        return;
      }
      raScale = doc["raScale"];
      raOffset = doc["raOffset"];
      decScale = doc["decScale"];
      decOffset = doc["decOffset"];
      request->send(200, "application/json", "{\"status\":\"calibrated\"}");
  });

  // Handle star-home reference updates
  server.on("/set_star_home", HTTP_POST, [](AsyncWebServerRequest *request){}, NULL,
    [](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {
      StaticJsonDocument<200> doc;
      DeserializationError error = deserializeJson(doc, (const char*)data);
      if (error) {
        request->send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
        return;
      }
      float lha = doc["lha"];
      float dec = doc["dec"];
      long raSteps = doc["ra_steps"];
      long decSteps = doc["dec_steps"];
      raOffset = raSteps - raScale * lha;
      decOffset = decSteps - decScale * dec;
      request->send(200, "application/json", "{\"status\":\"home_set\"}");
  });

  // Handle tracking toggle
  server.on("/track", HTTP_POST, [](AsyncWebServerRequest *request){}, NULL,
    [](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {
      StaticJsonDocument<200> doc;
      DeserializationError error = deserializeJson(doc, (const char*)data);
      if (error) {
        request->send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
        return;
      }
      tracking = doc["on"];
      if (tracking) {
        // Sidereal rate: 15 arcsec/sec = 0.004167 deg/sec
        float siderealDegPerSec = 0.004167;
        float stepsPerSec = (raScale / 24.0) * siderealDegPerSec; // raScale is steps per hour, so steps per hour / 3600 for per sec
        // Wait, raScale is steps per hour (since LHA in hours)
        // Sidereal is 15"/sec = 15/3600 deg/sec = 0.004167 deg/sec
        // So steps/sec = raScale * 0.004167
        stepperRA.setSpeed(raScale * siderealDegPerSec);
      }
      request->send(200, "application/json", "{\"status\":\"tracking_" + String(tracking ? "on" : "off") + "\"}");
  });

  // Handle Status Request
  server.on("/status", HTTP_GET, [](AsyncWebServerRequest *request){
    bool moving = stepperRA.isRunning() || stepperDec.isRunning();
    long raSteps = stepperRA.currentPosition();
    long decSteps = stepperDec.currentPosition();
    String json = "{\"moving\":" + String(moving ? "true" : "false") + ",\"ra_steps\":" + String(raSteps) + ",\"dec_steps\":" + String(decSteps) + ",\"tracking\":" + String(tracking ? "true" : "false") + "}";
    request->send(200, "application/json", json);
  });

  // Handle Home Command (assuming home is 0,0)
  server.on("/home", HTTP_POST, [](AsyncWebServerRequest *request){
    stepperRA.moveTo(0);
    stepperDec.moveTo(0);
    request->send(200, "application/json", "{\"status\":\"homing\"}");
  });

  DefaultHeaders::Instance().addHeader("Access-Control-Allow-Origin", "*");
  DefaultHeaders::Instance().addHeader("Access-Control-Allow-Headers", "Content-Type");
  DefaultHeaders::Instance().addHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

  server.begin();
}

void loop() {
  // AccelStepper needs to be called constantly to step the motors
  if (tracking) {
    stepperRA.runSpeed();
  } else {
    stepperRA.run();
  }
  stepperDec.run();
}