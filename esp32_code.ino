#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>
#include <AccelStepper.h>

// ================= WIFI CONFIG =================
const char* ssid = "SkyViewPro_GoTo"; 
const char* password = "astronomy-sky";

WebServer server(80);

// ================= PIN DEFINITIONS =================
#define RA_STEP_PIN 12
#define RA_DIR_PIN  14
#define DEC_STEP_PIN 27
#define DEC_DIR_PIN  26
#define RA_ENABLE_PIN 33
#define DEC_ENABLE_PIN 25

AccelStepper stepperRA(AccelStepper::DRIVER, RA_STEP_PIN, RA_DIR_PIN);
AccelStepper stepperDEC(AccelStepper::DRIVER, DEC_STEP_PIN, DEC_DIR_PIN);

// ================= BACKLASH CONFIG =================
// Only RA requires backlash based on your testing
const int RA_BACKLASH_STEPS = 150; 
int lastRaDir = 0; 

// ================= MOUNT SCALING =================
float raScale = 19200;      // steps per hour
float decScale = 1280;      // steps per degree
float raOffset = 0;
float decOffset = 0;

// Tracking state
bool tracking = false;
float siderealSpeed = 0;    

// Inactivity Power Management
bool motorsEnabled = true;
unsigned long lastMoveTime = 0;

// ================= CORE FUNCTIONS =================

void updateSiderealRate() {
  siderealSpeed = raScale / 3600.0;
}

void applyBacklash(AccelStepper &stepper, int &lastDir, long targetPos, int backlashAmount) {
  long currentPos = stepper.currentPosition();
  if (targetPos == currentPos) return;

  int newDir = (targetPos > currentPos) ? 1 : -1;

  // If direction changed, "jump" the motor to engage the gears on the other side
  if (lastDir != 0 && newDir != lastDir) {
    stepper.setCurrentPosition(currentPos - (newDir * backlashAmount));
  }
  lastDir = newDir;
}

// ================= API HANDLERS =================

void handleStatus() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  JsonDocument doc;
  doc["ra_steps"] = (long)stepperRA.currentPosition();
  doc["dec_steps"] = (long)stepperDEC.currentPosition();
  doc["tracking"] = tracking;
  doc["moving"] = (stepperRA.distanceToGo() != 0) || (stepperDEC.distanceToGo() != 0);
  
  String res;
  serializeJson(doc, res);
  server.send(200, "application/json", res);
}

void handleSlew() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  if (!server.hasArg("plain")) {
    server.send(400, "application/json", "{\"error\":\"no body\"}");
    return;
  }
  JsonDocument doc;
  deserializeJson(doc, server.arg("plain"));

  float lha = doc["lha"];
  float dec = doc["dec"];

  long targetRA  = (long)(raScale * lha + raOffset);
  long targetDEC = (long)(decScale * dec + decOffset);

  tracking = false; // Stop tracking during slew

  // Apply Backlash to RA only
  applyBacklash(stepperRA, lastRaDir, targetRA, RA_BACKLASH_STEPS);

  stepperRA.moveTo(targetRA);
  stepperDEC.moveTo(targetDEC);

  server.send(200, "application/json", "{\"status\":\"slewing\"}");
}

// ================= SETUP =================

void setup() {
  Serial.begin(115200);

  pinMode(RA_ENABLE_PIN, OUTPUT);
  pinMode(DEC_ENABLE_PIN, OUTPUT);
  digitalWrite(RA_ENABLE_PIN, LOW); // Active LOW
  digitalWrite(DEC_ENABLE_PIN, LOW);

  stepperRA.setMaxSpeed(5000);
  stepperRA.setAcceleration(2000);
  stepperDEC.setMaxSpeed(5000);
  stepperDEC.setAcceleration(2000);

  WiFi.mode(WIFI_AP);
  WiFi.softAP(ssid, password);

  // CORS Preflight
  server.onNotFound([]() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.sendHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
    if (server.method() == HTTP_OPTIONS) server.send(200);
    else server.send(404);
  });

  server.on("/status", HTTP_GET, handleStatus);
  server.on("/slew", HTTP_POST, handleSlew);

  server.on("/track", HTTP_POST, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    JsonDocument doc;
    deserializeJson(doc, server.arg("plain"));
    tracking = doc["on"] | false;
    if (tracking) {
      updateSiderealRate();
      lastRaDir = 1; // Engage gears in tracking direction
      stepperRA.setSpeed(siderealSpeed);
    }
    server.send(200, "application/json", "{\"status\":\"ok\"}");
  });

  server.on("/move_ra", HTTP_POST, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    JsonDocument doc;
    deserializeJson(doc, server.arg("plain"));
    int steps = doc["steps"];
    long target = stepperRA.currentPosition() + steps;
    applyBacklash(stepperRA, lastRaDir, target, RA_BACKLASH_STEPS);
    stepperRA.moveTo(target);
    tracking = false;
    server.send(200, "application/json", "{\"status\":\"moving\"}");
  });

  server.on("/move_dec", HTTP_POST, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    JsonDocument doc;
    deserializeJson(doc, server.arg("plain"));
    int steps = doc["steps"];
    stepperDEC.moveTo(stepperDEC.currentPosition() + steps);
    tracking = false;
    server.send(200, "application/json", "{\"status\":\"moving\"}");
  });

  server.on("/stop", HTTP_POST, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    tracking = false;
    stepperRA.stop();
    stepperDEC.stop();
    server.send(200, "application/json", "{\"status\":\"stopped\"}");
  });

  server.on("/home", HTTP_POST, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    tracking = false;
    stepperRA.moveTo(0);
    stepperDEC.moveTo(0);
    server.send(200, "application/json", "{\"status\":\"homing\"}");
  });

  server.on("/set_star_home", HTTP_POST, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    JsonDocument doc;
    deserializeJson(doc, server.arg("plain"));
    float lha = doc["lha"];
    float dec = doc["dec"];
    long raSteps = doc["ra_steps"];
    long decSteps = doc["dec_steps"];
    raOffset = raSteps - (raScale * lha);
    decOffset = decSteps - (decScale * dec);
    server.send(200, "application/json", "{\"status\":\"home_set\"}");
  });

  server.on("/calibration", HTTP_POST, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    JsonDocument doc;
    deserializeJson(doc, server.arg("plain"));
    if (doc["reset"]) {
      raScale = 19200; decScale = 1280; raOffset = 0; decOffset = 0;
    } else {
      if (doc["raScale"]) raScale = doc["raScale"];
      if (doc["decScale"]) decScale = doc["decScale"];
      if (doc["raOffset"]) raOffset = doc["raOffset"];
      if (doc["decOffset"]) decOffset = doc["decOffset"];
    }
    server.send(200, "application/json", "{\"status\":\"calibrated\"}");
  });

  server.begin();
}

void loop() {
  server.handleClient();

  bool isMoving = false;

  // RA Logic
  if (stepperRA.distanceToGo() != 0) {
    stepperRA.run();
    isMoving = true;
  } else if (tracking) {
    stepperRA.runSpeed();
    isMoving = true;
  }

  // DEC Logic
  if (stepperDEC.distanceToGo() != 0) {
    stepperDEC.run();
    isMoving = true;
  }

  // Power management
  if (isMoving) {
    lastMoveTime = millis();
    if (!motorsEnabled) {
      digitalWrite(RA_ENABLE_PIN, LOW);
      digitalWrite(DEC_ENABLE_PIN, LOW);
      motorsEnabled = true;
    }
  } else if (millis() - lastMoveTime > 10000) {
    if (motorsEnabled) {
      digitalWrite(RA_ENABLE_PIN, HIGH);
      digitalWrite(DEC_ENABLE_PIN, HIGH);
      motorsEnabled = false;
    }
  }
}