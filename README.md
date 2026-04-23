# 🔭 Veiled Cosmos: DIY ESP32 GoTo Telescope Mount

<div align="center">
  <img src="https://img.shields.io/badge/Open%20Source-Yes-green" alt="Open Source">
  <img src="https://img.shields.io/badge/License-MIT-blue" alt="License">
  <img src="https://img.shields.io/badge/Hardware-ESP32-orange" alt="Hardware">
  <img src="https://img.shields.io/badge/Software-Web%20App-lightblue" alt="Software">
</div>

---

## 🌟 Overview

**Veiled Cosmos** is an open-source hardware + software project that transforms a standard manual German Equatorial Mount (EQ) into a precision, WiFi-controlled GoTo system.

Built for lighter payloads (tested on 114 mm 900 mm Focal Length Celestron Powerseeker Telescope on a Skyview Pro 8 EQ Mount), this system uses high-torque NEMA 17 stepper motors and an ESP32 to enable automated celestial slewing, real-time sidereal tracking, and wireless control.

## ✨ Features

- 🚀 **Automated Celestial Slewing**: Precision GoTo functionality for accurate star tracking
- 🌐 **WiFi Control**: Wireless operation via web interface
- ⚡ **High-Torque Motors**: Supports payloads up to 20 lbs (9 kg)
- 🔄 **Real-Time Tracking**: Sidereal tracking for long-exposure astrophotography
- 📱 **Mobile App**: Control your telescope from any device with a browser

## ⚠️ Critical Safety Warning

> [!CAUTION]
> **NEVER** plug or unplug a stepper motor while power is **ON**.
> Doing so generates a back-EMF spike that will instantly destroy your TMC2208 drivers. Always disconnect power before modifying wiring.

## 🔧 Hardware Configuration

### 1. Wiring Pinout (ESP32 GPIO)

Connect your TMC2208 drivers to the ESP32 following this pin mapping:

| Axis    | Function | ESP32 GPIO |
|---------|----------|------------|
| RA      | STEP     | 12         |
| RA      | DIR      | 14         |
| RA      | ENABLE   | 33         |
| DEC     | STEP     | 27         |
| DEC     | DIR      | 26         |
| DEC     | ENABLE   | 25         |

### 2. Power Distribution

- **12V Rail**: Connect to VMOT and GND on the TMC2208 drivers
- **5V/USB**: Power the ESP32 via the micro-USB/USB-C port
- **Common Ground**: Ensure the ESP32 GND and the 12V Power Supply GND are connected

## 💻 Software Installation

### Step 1: Install Required Libraries

Before uploading the firmware, install the following libraries using the **Arduino Library Manager** (Sketch → Include Library → Manage Libraries):

- **AccelStepper** by Mike McCauley
- **ArduinoJson** by Benoit Blanchon

> `WiFi.h` and `WebServer.h` are part of the ESP32 board package and do not need separate installation.

### Step 2: Flash the ESP32

1. Download and install the [Arduino IDE](https://www.arduino.cc/en/software)
2. Go to **Tools > Board > Boards Manager**, search for "ESP32", and install the package
3. Select your board (e.g., DOIT ESP32 DEVKIT V1)
4. Connect your ESP32 to your PC
5. **The complete firmware code is found in the `esp32_code.ino` file.** Simply copy and paste its entire content into the Arduino IDE, then click **Upload**.

### Step 3: Launch the Web App

Once the firmware is flashed, control your mount via our web interface:

🌐 [**Launch Veiled Cosmos Web App**](https://veiledcosmos.netlify.app)

## 🤝 Support the Project

If this project helped you find the stars, consider supporting its continued development!

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/O5O4P2ZS2)

## 🔗 Community & Links

- 🌐 **Official Website**: [veiledcosmos.netlify.app](https://veiledcosmos.netlify.app)
- 📸 **Instagram**: [@veiledcosmos](https://instagram.com/veiledcosmos)

---

**License**: Open Source - See [LICENSE](LICENSE) for details.