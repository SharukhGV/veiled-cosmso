#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>
#include <AccelStepper.h>

// ================= WIFI =================
const char* ssid = "SkyViewPro_GoTo";
const char* password = "astronomy-sky";

WebServer server(80);

// ================= PINS =================
#define RA_STEP_PIN 12
#define RA_DIR_PIN  14
#define DEC_STEP_PIN 27
#define DEC_DIR_PIN  26
#define RA_ENABLE_PIN 33
#define DEC_ENABLE_PIN 25

AccelStepper stepperRA(AccelStepper::DRIVER, RA_STEP_PIN, RA_DIR_PIN);
AccelStepper stepperDEC(AccelStepper::DRIVER, DEC_STEP_PIN, DEC_DIR_PIN);

// ================= MOUNT MODEL =================
float raScale = 19200;      // steps per hour
float decScale = 1280;      // steps per degree
float raOffset = 0;
float decOffset = 0;

bool calibrated = false;

// Tracking
bool tracking = false;
float siderealSpeed = 0;    // steps per second

// ================= STATE =================
bool motorsEnabled = true;
unsigned long lastMoveTime = 0;

// ================= FUNCTIONS =================
void updateSiderealRate() {
  siderealSpeed = raScale / 3600.0;   // correct: steps per hour → steps per second
}

void setRAScale(float newRAScale) {
  raScale = newRAScale;
  if (tracking) {
    updateSiderealRate();
    stepperRA.setSpeed(siderealSpeed);
  }
}

// ================= SETUP =================
void setup() {
  Serial.begin(115200);

  pinMode(RA_ENABLE_PIN, OUTPUT);
  pinMode(DEC_ENABLE_PIN, OUTPUT);
  digitalWrite(RA_ENABLE_PIN, LOW);   // enable motors (active LOW)
  digitalWrite(DEC_ENABLE_PIN, LOW);

  stepperRA.setMaxSpeed(5000);
  stepperRA.setAcceleration(2000);
  stepperDEC.setMaxSpeed(5000);
  stepperDEC.setAcceleration(2000);

  WiFi.mode(WIFI_AP);
  WiFi.setSleep(false);
  WiFi.softAP(ssid, password);
  Serial.print("AP IP address: ");
  Serial.println(WiFi.softAPIP());

  // -------- CORS headers for all responses ----------
  server.onNotFound([]() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
    if (server.method() == HTTP_OPTIONS) {
      server.send(200);
    } else {
      server.send(404);
    }
  });

  // -------- STATUS (GET) --------
  server.on("/status", HTTP_GET, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    JsonDocument doc;
    doc["ra_steps"] = stepperRA.currentPosition();
    doc["dec_steps"] = stepperDEC.currentPosition();
    doc["tracking"] = tracking;
    doc["moving"] = (stepperRA.distanceToGo() != 0) || (stepperDEC.distanceToGo() != 0);
    String res;
    serializeJson(doc, res);
    server.send(200, "application/json", res);
  });

  // -------- SLEW (POST) --------
  server.on("/slew", HTTP_POST, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    if (!server.hasArg("plain")) {
      server.send(400, "application/json", "{\"error\":\"no body\"}");
      return;
    }
    JsonDocument doc;
    DeserializationError error = deserializeJson(doc, server.arg("plain"));
    if (error) {
      server.send(400, "application/json", "{\"error\":\"bad json\"}");
      return;
    }
    if (!doc["lha"].is<float>() || !doc["dec"].is<float>()) {
      server.send(400, "application/json", "{\"error\":\"missing lha or dec\"}");
      return;
    }
    float lha = doc["lha"];
    float dec = doc["dec"];
    long targetRA  = (long)(raScale * lha + raOffset);
    long targetDEC = (long)(decScale * dec + decOffset);
    tracking = false;
    stepperRA.moveTo(targetRA);
    stepperDEC.moveTo(targetDEC);
    server.send(200, "application/json", "{\"status\":\"slewing\"}");
  });

  // -------- TRACK (POST) --------
  server.on("/track", HTTP_POST, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    if (!server.hasArg("plain")) {
      server.send(400, "application/json", "{\"error\":\"no body\"}");
      return;
    }
    JsonDocument doc;
    DeserializationError error = deserializeJson(doc, server.arg("plain"));
    if (error) {
      server.send(400, "application/json", "{\"error\":\"bad json\"}");
      return;
    }
    tracking = doc["on"] | false;
    if (tracking) {
      updateSiderealRate();
      stepperRA.setSpeed(siderealSpeed);
    }
    server.send(200, "application/json", "{\"status\":\"ok\"}");
  });

  // -------- MOVE RA RELATIVE (POST) --------
server.on("/move_ra", HTTP_POST, []() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  if (!server.hasArg("plain")) {
    server.send(400, "application/json", "{\"error\":\"no body\"}");
    return;
  }
  JsonDocument doc;
  DeserializationError error = deserializeJson(doc, server.arg("plain"));
  if (error || !doc["steps"].is<int>()) {
    server.send(400, "application/json", "{\"error\":\"bad json or missing steps\"}");
    return;
  }
  int steps = doc["steps"];
  long current = stepperRA.currentPosition();
  stepperRA.moveTo(current + steps);
  tracking = false;   // stop tracking during manual move
  server.send(200, "application/json", "{\"status\":\"moving_ra\"}");
});

// -------- MOVE DEC RELATIVE (POST) --------
// -------- MOVE DEC RELATIVE (POST) --------
server.on("/move_dec", HTTP_POST, []() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  if (!server.hasArg("plain")) {
    server.send(400, "application/json", "{\"error\":\"no body\"}");
    return;
  }
  JsonDocument doc;
  DeserializationError error = deserializeJson(doc, server.arg("plain"));
  if (error || !doc["steps"].is<int>()) {
    server.send(400, "application/json", "{\"error\":\"bad json or missing steps\"}");
    return;
  }
  int steps = doc["steps"];
  long current = stepperDEC.currentPosition();
  stepperDEC.moveTo(current + steps);
  tracking = false;   // stop tracking during manual move
  server.send(200, "application/json", "{\"status\":\"moving_dec\"}");
});

  // -------- STOP (POST) --------
  server.on("/stop", HTTP_POST, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    tracking = false;
    stepperRA.stop();
    stepperDEC.stop();
    server.send(200, "application/json", "{\"status\":\"stopped\"}");
  });

  // -------- HOME (POST) --------
  server.on("/home", HTTP_POST, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    tracking = false;
    stepperRA.moveTo(0);
    stepperDEC.moveTo(0);
    server.send(200, "application/json", "{\"status\":\"homing\"}");
  });

  // -------- SET STAR HOME (POST) --------
  server.on("/set_star_home", HTTP_POST, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    if (!server.hasArg("plain")) {
      server.send(400, "application/json", "{\"error\":\"no body\"}");
      return;
    }
    JsonDocument doc;
    DeserializationError error = deserializeJson(doc, server.arg("plain"));
    if (error) {
      server.send(400, "application/json", "{\"error\":\"bad json\"}");
      return;
    }
    float lha = doc["lha"];
    float dec = doc["dec"];
    long raSteps = doc["ra_steps"];
    long decSteps = doc["dec_steps"];
    raOffset = raSteps - (raScale * lha);
    decOffset = decSteps - (decScale * dec);
    calibrated = true;
    server.send(200, "application/json", "{\"status\":\"home_set\"}");
  });

  // -------- CALIBRATION (POST) --------
  server.on("/calibration", HTTP_POST, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    if (!server.hasArg("plain")) {
      server.send(400, "application/json", "{\"error\":\"no body\"}");
      return;
    }
    JsonDocument doc;
    DeserializationError error = deserializeJson(doc, server.arg("plain"));
    if (error) {
      server.send(400, "application/json", "{\"error\":\"bad json\"}");
      return;
    }
    if (doc["reset"].is<bool>() && doc["reset"]) {
      setRAScale(19200);
      decScale = 1280;
      raOffset = 0;
      decOffset = 0;
      calibrated = false;
      server.send(200, "application/json", "{\"status\":\"reset\"}");
      return;
    }
    if (doc["raScale"].is<float>()) setRAScale(doc["raScale"]);
    if (doc["raOffset"].is<float>()) raOffset = doc["raOffset"];
    if (doc["decScale"].is<float>()) decScale = doc["decScale"];
    if (doc["decOffset"].is<float>()) decOffset = doc["decOffset"];
    calibrated = true;
    server.send(200, "application/json", "{\"status\":\"calibrated\"}");
  });

  server.begin();
}

// ================= LOOP =================
void loop() {
  server.handleClient();   // handle incoming HTTP requests
  yield();

  bool moving = false;

  // RA movement (slew or tracking)
  if (stepperRA.distanceToGo() != 0) {
    stepperRA.run();
    moving = true;
  } else if (tracking) {
    stepperRA.runSpeed();
    moving = true;
  }

  // DEC movement (slew only)
  if (stepperDEC.distanceToGo() != 0) {
    stepperDEC.run();
    moving = true;
  }

  // Auto power-down after 10 seconds of inactivity
  if (moving) {
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