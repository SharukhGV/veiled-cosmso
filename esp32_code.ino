#include <WiFi.h>
#include <ESPAsyncWebServer.h>
#include <ArduinoJson.h>
#include <AccelStepper.h>

// --- Configuration ---
const char* ssid = "VeiledCosmos_Mount";
const char* password = "astronomy-sky";

AsyncWebServer server(80);

// Pin Definitions
#define RA_STEP_PIN 12
#define RA_DIR_PIN  14
#define DEC_STEP_PIN 27
#define DEC_DIR_PIN  26
#define RA_ENABLE_PIN 13
#define DEC_ENABLE_PIN 25

// Stepper objects
AccelStepper stepperRA(AccelStepper::DRIVER, RA_STEP_PIN, RA_DIR_PIN);
AccelStepper stepperDec(AccelStepper::DRIVER, DEC_STEP_PIN, DEC_DIR_PIN);

// Mechanical Specs
const float STEPS_PER_REV_RA  = 10000.0;
const float STEPS_PER_REV_DEC = 10000.0;
const float DEFAULT_RA_SCALE  = STEPS_PER_REV_RA  / 24.0;   // steps per hour
const float DEFAULT_DEC_SCALE = STEPS_PER_REV_DEC / 360.0;  // steps per degree

// Calibration
float raScale  = DEFAULT_RA_SCALE;
float raOffset = 0.0;
float decScale  = DEFAULT_DEC_SCALE;
float decOffset = 0.0;

// Tracking
bool tracking = false;
float siderealStepsPerSecond = 0.0;

// Motor control
bool motorsEnabled = true;

// --- Helper: recalculate sidereal speed whenever raScale changes ---
void updateSiderealRate() {
  siderealStepsPerSecond = (raScale * 15.041) / 3600.0;
}

void setupServerRoutes();

void setup() {
  Serial.begin(115200);

  // Configure enable pins (active LOW for TMC2209)
  pinMode(RA_ENABLE_PIN, OUTPUT);
  pinMode(DEC_ENABLE_PIN, OUTPUT);
  digitalWrite(RA_ENABLE_PIN, LOW);
  digitalWrite(DEC_ENABLE_PIN, LOW);

  // Configure steppers
  stepperRA.setMaxSpeed(2000.0);
  stepperRA.setAcceleration(800.0);
  stepperRA.setCurrentPosition(0);

  stepperDec.setMaxSpeed(2000.0);
  stepperDec.setAcceleration(800.0);
  stepperDec.setCurrentPosition(0);

  // Calculate initial sidereal tracking speed
  updateSiderealRate();

  // Setup WiFi Access Point
  WiFi.softAP(ssid, password);
  Serial.println("Access Point Started");
  Serial.print("IP Address: ");
  Serial.println(WiFi.softAPIP());

  setupServerRoutes();
  server.begin();
  Serial.println("HTTP server started");
}

void setupServerRoutes() {
  // Enable CORS
  DefaultHeaders::Instance().addHeader("Access-Control-Allow-Origin", "*");
  DefaultHeaders::Instance().addHeader("Access-Control-Allow-Headers", "Content-Type");
  DefaultHeaders::Instance().addHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

  // Handle OPTIONS preflight
  server.onNotFound([](AsyncWebServerRequest *request) {
    if (request->method() == HTTP_OPTIONS) {
      request->send(200);
    } else {
      request->send(404);
    }
  });

  // --- /slew ---
  server.on("/slew", HTTP_POST, [](AsyncWebServerRequest *request){}, NULL,
    [](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {
      StaticJsonDocument<200> doc;
      DeserializationError error = deserializeJson(doc, (const char*)data);

      if (error) {
        request->send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
        return;
      }

      float lha = doc["lha"];
      float dec = doc["dec"];

      // Normalize LHA to [0, 24)
      lha = fmod(lha, 24.0);
      if (lha < 0) lha += 24.0;

      long targetRASteps  = (long)(raScale  * lha + raOffset);
      long targetDecSteps = (long)(decScale * dec + decOffset);

      // Disable tracking during slew
      tracking = false;
      stepperRA.setSpeed(0);

      stepperRA.moveTo(targetRASteps);
      stepperDec.moveTo(targetDecSteps);

      request->send(200, "application/json",
        "{\"status\":\"slewing\",\"ra_target\":" + String(targetRASteps) +
        ",\"dec_target\":" + String(targetDecSteps) + "}");
    });

  // --- /stop ---
  server.on("/stop", HTTP_POST, [](AsyncWebServerRequest *request) {
    tracking = false;
    stepperRA.setSpeed(0);
    stepperRA.stop();
    stepperDec.stop();
    stepperRA.moveTo(stepperRA.currentPosition());
    stepperDec.moveTo(stepperDec.currentPosition());
    request->send(200, "application/json", "{\"status\":\"stopped\"}");
  });

  // --- /home ---
  server.on("/home", HTTP_POST, [](AsyncWebServerRequest *request) {
    tracking = false;
    stepperRA.setSpeed(0);
    stepperRA.moveTo(0);
    stepperDec.moveTo(0);
    request->send(200, "application/json", "{\"status\":\"homing\"}");
  });

  // --- /calibration ---
  server.on("/calibration", HTTP_POST, [](AsyncWebServerRequest *request){}, NULL,
    [](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {
      StaticJsonDocument<200> doc;
      DeserializationError error = deserializeJson(doc, (const char*)data);

      if (error) {
        request->send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
        return;
      }

      if (doc.containsKey("reset") && doc["reset"] == true) {
        raScale  = DEFAULT_RA_SCALE;
        raOffset = 0.0;
        decScale  = DEFAULT_DEC_SCALE;
        decOffset = 0.0;
        updateSiderealRate();  // Recalculate after reset
        request->send(200, "application/json", "{\"status\":\"reset\"}");
        return;
      }

      // Guard: only update keys that are present
      if (doc.containsKey("raScale"))  raScale  = doc["raScale"];
      if (doc.containsKey("raOffset")) raOffset = doc["raOffset"];
      if (doc.containsKey("decScale")) decScale  = doc["decScale"];
      if (doc.containsKey("decOffset")) decOffset = doc["decOffset"];

      updateSiderealRate();  // Recalculate after calibration update

      request->send(200, "application/json", "{\"status\":\"calibrated\"}");
    });

  // --- /set_star_home ---
  server.on("/set_star_home", HTTP_POST, [](AsyncWebServerRequest *request){}, NULL,
    [](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {
      StaticJsonDocument<200> doc;
      DeserializationError error = deserializeJson(doc, (const char*)data);

      if (error) {
        request->send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
        return;
      }

      float lha      = doc["lha"];
      float dec      = doc["dec"];
      long  raSteps  = doc["ra_steps"];
      long  decSteps = doc["dec_steps"];

      raOffset  = raSteps  - raScale  * lha;
      decOffset = decSteps - decScale * dec;

      request->send(200, "application/json", "{\"status\":\"home_set\"}");
    });

  // --- /track ---
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
        // Recalculate in case raScale changed since last update
        updateSiderealRate();
        stepperRA.setSpeed(siderealStepsPerSecond);
      } else {
        stepperRA.setSpeed(0);
      }

      request->send(200, "application/json",
        "{\"status\":\"tracking_" + String(tracking ? "on" : "off") + "\"}");
    });

  // --- /status ---
  server.on("/status", HTTP_GET, [](AsyncWebServerRequest *request) {
    bool moving = stepperRA.isRunning() || stepperDec.isRunning();
    long raSteps  = stepperRA.currentPosition();
    long decSteps = stepperDec.currentPosition();

    String json =
      "{\"moving\":"    + String(moving   ? "true" : "false") +
      ",\"ra_steps\":"  + String(raSteps)  +
      ",\"dec_steps\":" + String(decSteps) +
      ",\"tracking\":"  + String(tracking ? "true" : "false") +
      ",\"ra_scale\":"  + String(raScale)  +
      ",\"dec_scale\":" + String(decScale) +
      ",\"sidereal_speed\":" + String(siderealStepsPerSecond) + "}";

    request->send(200, "application/json", json);
  });
}

void loop() {
  bool isMoving = false;

  // Priority 1: Slewing to a target position
  if (stepperRA.distanceToGo() != 0) {
    stepperRA.run();
    isMoving = true;
  }
  // Priority 2: Sidereal tracking (only when not slewing)
  else if (tracking) {
    stepperRA.runSpeed();
    isMoving = true;
  }

  // DEC only moves on slew commands, never tracks
  if (stepperDec.distanceToGo() != 0) {
    stepperDec.run();
    isMoving = true;
  }

  // Power management: disable motors after 1 minute idle
  static unsigned long lastMoveTime = 0;
  if (isMoving) {
    lastMoveTime = millis();
    if (!motorsEnabled) {
      digitalWrite(RA_ENABLE_PIN, LOW);
      digitalWrite(DEC_ENABLE_PIN, LOW);
      motorsEnabled = true;
    }
  } else if (millis() - lastMoveTime > 60000UL) {
    if (motorsEnabled) {
      digitalWrite(RA_ENABLE_PIN, HIGH);
      digitalWrite(DEC_ENABLE_PIN, HIGH);
      motorsEnabled = false;
    }
  }
}