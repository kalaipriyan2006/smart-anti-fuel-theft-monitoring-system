import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.js';
import { processDevicePacket } from './server/detectionEngine.js';
import {
  askFleetCopilot,
  analyzeTheftIncidentWithAI,
  generateFleetFuelIntelligenceReport,
  diagnoseHardwareWithAI,
  draftSupportResolutionWithAI
} from './server/ai.js';
const PORT = 3000;

process.on('uncaughtException', (err) => {
  console.error('Process uncaughtException caught:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Process unhandledRejection caught:', reason);
});

export async function createApp() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Root and Ingress Health check endpoints (REQUIRED for Cloud Run and Load Balancers)
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use(express.json());

  // CORS and custom headers for ESP32 and browser
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-ESP32-Device-ID, X-ESP32-Secret-Key');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Check and update offline status periodically (if heartbeat > 45s => OFFLINE)
  setInterval(() => {
    const now = Date.now();
    for (const [id, dev] of db.devices.entries()) {
      if (dev.lastHeartbeat) {
        const diffMs = now - new Date(dev.lastHeartbeat).getTime();
        if (diffMs > 45000 && dev.status === 'ONLINE') {
          dev.status = 'OFFLINE';
          dev.healthScore = Math.max(10, (dev.healthScore || 50) - 40);
        }
      }
    }
  }, 10000);

  // SSE client connections
  const sseClients: Response[] = [];

  function broadcastRealtime(event: string, data: any) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (let i = sseClients.length - 1; i >= 0; i--) {
      try {
        const client = sseClients[i];
        if (!client.writableEnded && !client.destroyed) {
          client.write(payload);
        } else {
          sseClients.splice(i, 1);
        }
      } catch (err) {
        sseClients.splice(i, 1);
      }
    }
  }

  // Periodic SSE keepalive ping to prevent proxy/ingress socket timeouts
  setInterval(() => {
    broadcastRealtime('ping', { time: new Date().toISOString() });
  }, 25000);

  // SSE Endpoint
  app.get('/api/realtime/stream', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    sseClients.push(res);

    const cleanup = () => {
      const idx = sseClients.indexOf(res);
      if (idx !== -1) sseClients.splice(idx, 1);
    };

    req.on('close', cleanup);
    req.on('error', cleanup);
    res.on('close', cleanup);
    res.on('error', cleanup);

    // Initial ping
    try {
      res.write(`event: ping\ndata: ${JSON.stringify({ time: new Date().toISOString() })}\n\n`);
    } catch {
      cleanup();
    }
  });

  // ==========================================
  // ESP32 HARDWARE INGESTION ENDPOINTS
  // ==========================================

  // ESP32 Authentication Middleware / Check
  function verifyEsp32Auth(req: Request, res: Response): { device: any } | null {
    const deviceId = (req.headers['x-esp32-device-id'] as string) || req.body.deviceId;
    const secretKey = (req.headers['x-esp32-secret-key'] as string) || req.body.secretKey;

    if (!deviceId) {
      res.status(401).json({ error: 'Missing X-ESP32-Device-ID header or parameter' });
      return null;
    }

    const device = db.devices.get(deviceId);
    if (!device) {
      res.status(403).json({ error: 'Unregistered ESP32 Device' });
      return null;
    }

    if (secretKey && device.secretKey !== secretKey) {
      res.status(403).json({ error: 'Invalid ESP32 Secret Key Authentication' });
      return null;
    }

    return { device };
  }

  // 1. ESP32 Handshake / Authentication
  app.post('/api/device/authenticate', (req: Request, res: Response) => {
    const auth = verifyEsp32Auth(req, res);
    if (!auth) return;

    const { device } = auth;
    device.status = 'ONLINE';
    device.lastCommunication = new Date().toISOString();
    device.lastHeartbeat = new Date().toISOString();

    db.logAudit(
      device.userId,
      'ESP32_HARDWARE',
      'ESP32_AUTHENTICATED',
      'ESP32Device',
      device.id,
      'SUCCESS',
      { ip: req.ip }
    );

    res.json({
      status: 'AUTHENTICATED',
      deviceId: device.id,
      serverTime: new Date().toISOString(),
      config: {
        heartbeatIntervalSeconds: 15,
        readingIntervalSeconds: 5,
        adcPin: device.hardwareConfig.adcPin,
        gpsBaudRate: 9600
      }
    });
  });

  // 2. ESP32 Heartbeat
  app.post('/api/device/heartbeat', (req: Request, res: Response) => {
    const auth = verifyEsp32Auth(req, res);
    if (!auth) return;

    const { device } = auth;
    const { wifiRSSI, firmwareVersion, sensorStatus, gpsStatus } = req.body;

    device.status = 'ONLINE';
    device.lastHeartbeat = new Date().toISOString();
    device.lastCommunication = new Date().toISOString();
    if (wifiRSSI !== undefined) device.wifiRSSI = wifiRSSI;
    if (firmwareVersion) device.firmwareVersion = firmwareVersion;
    if (sensorStatus) device.sensorStatus = sensorStatus;
    if (gpsStatus) device.gpsStatus = gpsStatus;

    // Check if buzzer command is pending
    const cmd = db.deviceCommands.get(device.id);
    const buzzerActive = cmd ? cmd.buzzer : false;

    // Broadcast device update
    broadcastRealtime('device_heartbeat', { deviceId: device.id, status: 'ONLINE', wifiRSSI: device.wifiRSSI });

    res.json({
      status: 'HEARTBEAT_ACK',
      timestamp: new Date().toISOString(),
      commands: {
        triggerBuzzer: buzzerActive,
        buzzerDurationSeconds: cmd ? cmd.buzzerDuration : 0
      }
    });

    // Reset buzzer command once acknowledged
    if (cmd && cmd.buzzer) {
      cmd.buzzer = false;
    }
  });

  // 3. Unified Real-Time ESP32 Packet (Fuel + GPS + Telemetry)
  app.post('/api/device/packet', (req: Request, res: Response) => {
    const auth = verifyEsp32Auth(req, res);
    if (!auth) return;

    const { device } = auth;
    const { rawAdc, gps, wifiRSSI, firmwareVersion, sensorStatus } = req.body;

    try {
      const result = processDevicePacket({
        deviceId: device.id,
        timestamp: new Date().toISOString(),
        rawAdc: Number(rawAdc) || 0,
        wifiRSSI: wifiRSSI ? Number(wifiRSSI) : undefined,
        firmwareVersion,
        gps,
        sensorStatus: sensorStatus || 'NORMAL'
      });

      broadcastRealtime('fuel_reading', {
        deviceId: device.id,
        vehicleId: device.vehicleId,
        fuelLiters: result.fuelLiters,
        fuelPercentage: result.fuelPercentage,
        fuelReduction: result.fuelReduction,
        rawAdc
      });

      if (gps && gps.gpsFix) {
        broadcastRealtime('gps_update', {
          deviceId: device.id,
          vehicleId: device.vehicleId,
          latitude: gps.latitude,
          longitude: gps.longitude,
          speedKmh: gps.speedKmh
        });
      }

      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // 4. Standalone Fuel Reading
  app.post('/api/device/fuel-reading', (req: Request, res: Response) => {
    const auth = verifyEsp32Auth(req, res);
    if (!auth) return;

    const { device } = auth;
    const { rawAdc, wifiRSSI, sensorStatus } = req.body;

    try {
      const result = processDevicePacket({
        deviceId: device.id,
        timestamp: new Date().toISOString(),
        rawAdc: Number(rawAdc),
        wifiRSSI,
        sensorStatus
      });
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // 5. Standalone GPS
  app.post('/api/device/gps', (req: Request, res: Response) => {
    const auth = verifyEsp32Auth(req, res);
    if (!auth) return;

    const { device } = auth;
    const { latitude, longitude, altitude, speedKmh, satellites, gpsFix } = req.body;

    if (!device.vehicleId) {
      return res.status(400).json({ error: 'Device not assigned to vehicle' });
    }

    const gpsPoint = {
      id: `gps_${Date.now()}`,
      deviceId: device.id,
      vehicleId: device.vehicleId,
      timestamp: new Date().toISOString(),
      latitude: Number(latitude),
      longitude: Number(longitude),
      altitude: Number(altitude) || 0,
      speedKmh: Number(speedKmh) || 0,
      satellites: Number(satellites) || 0,
      gpsFix: Boolean(gpsFix)
    };

    db.gpsReadings.push(gpsPoint);
    device.gpsStatus = gpsFix ? 'CONNECTED' : 'NO_FIX';

    broadcastRealtime('gps_update', gpsPoint);
    res.json({ status: 'GPS_SAVED', gpsPoint });
  });

  // 6. Device Hardware Event
  app.post('/api/device/event', (req: Request, res: Response) => {
    const auth = verifyEsp32Auth(req, res);
    if (!auth) return;

    const { device } = auth;
    const { eventType, eventMessage, metadata } = req.body;

    db.logAudit(
      device.userId,
      'ESP32_EVENT',
      eventType || 'HARDWARE_EVENT',
      'ESP32Device',
      device.id,
      'SUCCESS',
      { eventMessage, metadata }
    );

    res.json({ status: 'EVENT_LOGGED' });
  });

  // 7. Get Device Status
  app.get('/api/device/:id/status', (req: Request, res: Response) => {
    const device = db.devices.get(req.params.id);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    res.json(device);
  });

  // ==========================================
  // AUTHENTICATION & USER MANAGEMENT
  // ==========================================

  app.post('/api/auth/register', (req: Request, res: Response) => {
    const { fullName, email, mobile, password, role } = req.body;
    if (!fullName || !email || !mobile || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check duplicate
    for (const u of db.users.values()) {
      if (u.email.toLowerCase() === email.toLowerCase()) {
        return res.status(409).json({ error: 'Email already registered' });
      }
    }

    const newUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      fullName,
      email: email.toLowerCase(),
      mobile,
      role: (role as any) || 'VEHICLE_OWNER',
      createdAt: new Date().toISOString(),
      status: 'ACTIVE' as const
    };

    db.users.set(newUser.id, newUser);
    db.passwords.set(newUser.email, password);

    db.logAudit(newUser.id, newUser.email, 'USER_REGISTERED', 'User', newUser.id, 'SUCCESS');

    res.json({
      user: newUser,
      token: `token_${newUser.id}_${Date.now()}`
    });
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const storedPass = db.passwords.get(email.toLowerCase());
    let user = null;
    for (const u of db.users.values()) {
      if (u.email.toLowerCase() === email.toLowerCase()) {
        user = u;
        break;
      }
    }

    if (!user || storedPass !== password) {
      db.logAudit('anonymous', email, 'LOGIN_FAILED', 'Auth', undefined, 'FAILURE');
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    user.lastLogin = new Date().toISOString();
    db.logAudit(user.id, user.email, 'LOGIN_SUCCESS', 'Auth', user.id, 'SUCCESS');

    res.json({
      user,
      token: `token_${user.id}_${Date.now()}`
    });
  });

  app.get('/api/auth/me', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const parts = authHeader.replace('Bearer ', '').split('_');
    const userId = parts[1];
    const user = db.users.get(userId);

    if (!user) {
      return res.status(401).json({ error: 'Session expired or invalid' });
    }

    res.json({ user });
  });

  app.post('/api/auth/update-profile', (req: Request, res: Response) => {
    const { userId, fullName, mobile } = req.body;
    const user = db.users.get(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (fullName) user.fullName = fullName;
    if (mobile) user.mobile = mobile;

    db.logAudit(user.id, user.email, 'PROFILE_UPDATED', 'User', user.id, 'SUCCESS');
    res.json({ user });
  });

  app.post('/api/auth/change-password', (req: Request, res: Response) => {
    const { userId, currentPassword, newPassword } = req.body;
    const user = db.users.get(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const stored = db.passwords.get(user.email);
    if (stored !== currentPassword) {
      return res.status(400).json({ error: 'Current password incorrect' });
    }

    db.passwords.set(user.email, newPassword);
    db.logAudit(user.id, user.email, 'PASSWORD_CHANGED', 'User', user.id, 'SUCCESS');
    res.json({ status: 'PASSWORD_UPDATED' });
  });

  // ==========================================
  // VEHICLES MANAGEMENT
  // ==========================================

  app.get('/api/vehicles', (req: Request, res: Response) => {
    const userId = req.query.userId as string;
    let list = Array.from(db.vehicles.values());
    if (userId) {
      list = list.filter(v => v.userId === userId);
    }
    res.json(list);
  });

  app.post('/api/vehicles', (req: Request, res: Response) => {
    const { userId, vehicleNumber, vehicleName, vehicleType, tankCapacityLiters, driverName, driverPhone, deviceId } = req.body;

    if (!userId || !vehicleNumber || !vehicleName || !tankCapacityLiters) {
      return res.status(400).json({ error: 'Missing vehicle parameters' });
    }

    const vehicleId = `veh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const vehicle = {
      id: vehicleId,
      userId,
      vehicleNumber: vehicleNumber.toUpperCase().trim(),
      vehicleName,
      vehicleType: vehicleType || 'TRUCK',
      tankCapacityLiters: Number(tankCapacityLiters),
      driverName,
      driverPhone,
      deviceId,
      status: 'ACTIVE' as const,
      createdAt: new Date().toISOString()
    };

    db.vehicles.set(vehicle.id, vehicle);

    // If device assigned, link it
    if (deviceId) {
      const dev = db.devices.get(deviceId);
      if (dev) dev.vehicleId = vehicle.id;
    }

    // Create default calibration curve
    const calib = {
      id: `calib_${vehicle.id}`,
      vehicleId: vehicle.id,
      deviceId: deviceId || '',
      adcMin: 300,
      adcMax: 3900,
      fuelMinLiters: 0,
      fuelMaxLiters: Number(tankCapacityLiters),
      tankCapacityLiters: Number(tankCapacityLiters),
      stages: [
        { stage: 'EMPTY' as const, adcValue: 300, fuelLiters: 0 },
        { stage: 'LOW' as const, adcValue: 1200, fuelLiters: Number(tankCapacityLiters) * 0.25 },
        { stage: 'HALF' as const, adcValue: 2100, fuelLiters: Number(tankCapacityLiters) * 0.5 },
        { stage: 'HIGH' as const, adcValue: 3000, fuelLiters: Number(tankCapacityLiters) * 0.75 },
        { stage: 'FULL' as const, adcValue: 3900, fuelLiters: Number(tankCapacityLiters) }
      ],
      notes: 'Initial standard calibration curve.',
      updatedAt: new Date().toISOString(),
      updatedBy: 'System'
    };
    db.calibrations.set(vehicle.id, calib);

    db.logAudit(userId, 'USER', 'VEHICLE_CREATED', 'Vehicle', vehicle.id, 'SUCCESS', { vehicleNumber });

    res.json(vehicle);
  });

  app.put('/api/vehicles/:id', (req: Request, res: Response) => {
    const vehicle = db.vehicles.get(req.params.id);
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    const { vehicleNumber, vehicleName, vehicleType, tankCapacityLiters, driverName, driverPhone, deviceId, status } = req.body;

    if (vehicleNumber) vehicle.vehicleNumber = vehicleNumber;
    if (vehicleName) vehicle.vehicleName = vehicleName;
    if (vehicleType) vehicle.vehicleType = vehicleType;
    if (tankCapacityLiters) vehicle.tankCapacityLiters = Number(tankCapacityLiters);
    if (driverName !== undefined) vehicle.driverName = driverName;
    if (driverPhone !== undefined) vehicle.driverPhone = driverPhone;
    if (status) vehicle.status = status;

    if (deviceId !== undefined) {
      // Unlink previous device if changed
      if (vehicle.deviceId && vehicle.deviceId !== deviceId) {
        const oldDev = db.devices.get(vehicle.deviceId);
        if (oldDev) oldDev.vehicleId = undefined;
      }
      vehicle.deviceId = deviceId;
      if (deviceId) {
        const newDev = db.devices.get(deviceId);
        if (newDev) newDev.vehicleId = vehicle.id;
      }
    }

    db.logAudit(vehicle.userId, 'USER', 'VEHICLE_UPDATED', 'Vehicle', vehicle.id, 'SUCCESS');
    res.json(vehicle);
  });

  app.delete('/api/vehicles/:id', (req: Request, res: Response) => {
    const vehicle = db.vehicles.get(req.params.id);
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    if (vehicle.deviceId) {
      const dev = db.devices.get(vehicle.deviceId);
      if (dev) dev.vehicleId = undefined;
    }

    db.vehicles.delete(vehicle.id);
    db.calibrations.delete(vehicle.id);
    db.logAudit(vehicle.userId, 'USER', 'VEHICLE_DELETED', 'Vehicle', vehicle.id, 'SUCCESS');

    res.json({ status: 'DELETED' });
  });

  // ==========================================
  // ESP32 DEVICE MANAGEMENT
  // ==========================================

  app.get('/api/devices', (req: Request, res: Response) => {
    const userId = req.query.userId as string;
    let list = Array.from(db.devices.values());
    if (userId) {
      list = list.filter(d => d.userId === userId);
    }
    res.json(list);
  });

  app.post('/api/devices/register', (req: Request, res: Response) => {
    const { deviceId, name, userId, vehicleId } = req.body;

    if (!deviceId || !name || !userId) {
      return res.status(400).json({ error: 'Device ID, Name and User ID required' });
    }

    const cleanDeviceId = deviceId.trim().toUpperCase();
    if (db.devices.has(cleanDeviceId)) {
      return res.status(409).json({ error: 'Device ID already registered in platform' });
    }

    const secretKey = `sec_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;

    const newDevice = {
      id: cleanDeviceId,
      name,
      secretKey,
      vehicleId: vehicleId || undefined,
      userId,
      firmwareVersion: 'v1.4.2',
      latestFirmwareVersion: 'v1.4.2',
      status: 'OFFLINE' as const,
      sensorStatus: 'UNAVAILABLE' as const,
      gpsStatus: 'UNAVAILABLE' as const,
      cloudStatus: 'CONNECTED' as const,
      healthScore: 50,
      hardwareConfig: {
        adcPin: 34,
        gpsRxPin: 16,
        gpsTxPin: 17,
        oledSdaPin: 21,
        oledSclPin: 22,
        buzzerPin: 25
      },
      createdAt: new Date().toISOString()
    };

    db.devices.set(newDevice.id, newDevice);

    if (vehicleId) {
      const veh = db.vehicles.get(vehicleId);
      if (veh) veh.deviceId = newDevice.id;
    }

    db.logAudit(userId, 'USER', 'DEVICE_REGISTERED', 'ESP32Device', newDevice.id, 'SUCCESS');
    res.json(newDevice);
  });

  app.post('/api/devices/link', (req: Request, res: Response) => {
    const { deviceId, vehicleId } = req.body;
    const device = db.devices.get(deviceId);
    const vehicle = db.vehicles.get(vehicleId);

    if (!device || !vehicle) {
      return res.status(404).json({ error: 'Device or Vehicle not found' });
    }

    device.vehicleId = vehicle.id;
    vehicle.deviceId = device.id;

    db.logAudit(device.userId, 'USER', 'DEVICE_LINKED', 'ESP32Device', device.id, 'SUCCESS', { vehicleId });
    res.json({ status: 'LINKED', device, vehicle });
  });

  app.post('/api/devices/unlink', (req: Request, res: Response) => {
    const { deviceId } = req.body;
    const device = db.devices.get(deviceId);
    if (!device) return res.status(404).json({ error: 'Device not found' });

    if (device.vehicleId) {
      const veh = db.vehicles.get(device.vehicleId);
      if (veh) veh.deviceId = undefined;
      device.vehicleId = undefined;
    }

    db.logAudit(device.userId, 'USER', 'DEVICE_UNLINKED', 'ESP32Device', device.id, 'SUCCESS');
    res.json({ status: 'UNLINKED' });
  });

  // Download / Generate Complete Arduino ESP32 C++ Firmware Source
  app.get('/api/devices/:id/firmware-code', (req: Request, res: Response) => {
    const device = db.devices.get(req.params.id);
    if (!device) return res.status(404).json({ error: 'Device not found' });

    const serverHost = req.get('host') || 'localhost:3000';
    const protocol = req.protocol || 'http';

    const firmwareSource = `/*
 * SMART ANTI-FUEL THEFT MONITORING SYSTEM - ESP32 EMBEDDED FIRMWARE
 * Target: ESP32 DevKit V1
 * Device ID: ${device.id}
 * Firmware Version: ${device.firmwareVersion}
 *
 * HARDWARE PINOUTS:
 * - Fuel Level Sensor OUT -> GPIO34 (ADC1_CH6)
 * - NEO-6M GPS TX -> GPIO16 (ESP32 RX2)
 * - NEO-6M GPS RX -> GPIO17 (ESP32 TX2)
 * - 0.96" I2C OLED SDA -> GPIO21
 * - 0.96" I2C OLED SCL -> GPIO22
 * - 5V Active Buzzer Base -> 1K Resistor -> 2N2222 Transistor -> GPIO25
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <TinyGPS++.h>

// Wi-Fi Credentials
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// IoT Cloud API Credentials
const char* SERVER_URL = "${protocol}://${serverHost}/api/device/packet";
const char* HEARTBEAT_URL = "${protocol}://${serverHost}/api/device/heartbeat";
const char* DEVICE_ID = "${device.id}";
const char* SECRET_KEY = "${device.secretKey}";

// Pin Configurations
#define PIN_FUEL_ADC 34
#define PIN_BUZZER 25
#define GPS_RX_PIN 16
#define GPS_TX_PIN 17
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);
TinyGPSPlus gps;
HardwareSerial gpsSerial(2);

unsigned long lastTelemetryTime = 0;
unsigned long lastHeartbeatTime = 0;
const unsigned long TELEMETRY_INTERVAL = 5000; // 5 seconds
const unsigned long HEARTBEAT_INTERVAL = 15000; // 15 seconds

void setup() {
  Serial.begin(115200);
  gpsSerial.begin(9600, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);

  pinMode(PIN_BUZZER, OUTPUT);
  digitalWrite(PIN_BUZZER, LOW);
  analogReadResolution(12); // 0-4095 ADC

  Wire.begin(21, 22);
  if (display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(WHITE);
    display.setCursor(0, 0);
    display.println("ANTI-FUEL THEFT");
    display.println("ID: ${device.id}");
    display.println("Connecting WiFi...");
    display.display();
  }

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 20) {
    delay(500);
    Serial.print(".");
    retries++;
  }
  Serial.println("\\nWiFi Connected: " + WiFi.localIP().toString());
}

void loop() {
  while (gpsSerial.available() > 0) {
    gps.encode(gpsSerial.read());
  }

  unsigned long currentMillis = millis();

  // Send Telemetry Packet
  if (currentMillis - lastTelemetryTime >= TELEMETRY_INTERVAL) {
    lastTelemetryTime = currentMillis;
    sendTelemetryPacket();
  }

  // Send Heartbeat
  if (currentMillis - lastHeartbeatTime >= HEARTBEAT_INTERVAL) {
    lastHeartbeatTime = currentMillis;
    sendHeartbeat();
  }
}

void sendTelemetryPacket() {
  if (WiFi.status() != WL_CONNECTED) return;

  // Oversample ADC for noise immunity
  long adcSum = 0;
  for (int i = 0; i < 16; i++) {
    adcSum += analogRead(PIN_FUEL_ADC);
    delay(5);
  }
  int rawAdc = adcSum / 16;

  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-ESP32-Device-ID", DEVICE_ID);
  http.addHeader("X-ESP32-Secret-Key", SECRET_KEY);

  String payload = "{";
  payload += "\\"deviceId\\":\\"" + String(DEVICE_ID) + "\\",";
  payload += "\\"rawAdc\\":" + String(rawAdc) + ",";
  payload += "\\"wifiRSSI\\":" + String(WiFi.RSSI()) + ",";
  payload += "\\"firmwareVersion\\":\\"${device.firmwareVersion}\\",";
  payload += "\\"sensorStatus\\":\\"" + String((rawAdc > 50 && rawAdc < 4090) ? "NORMAL" : "ERROR") + "\\",";

  if (gps.location.isValid()) {
    payload += "\\"gps\\":{";
    payload += "\\"latitude\\":" + String(gps.location.lat(), 6) + ",";
    payload += "\\"longitude\\":" + String(gps.location.lng(), 6) + ",";
    payload += "\\"speedKmh\\":" + String(gps.speed.kmph(), 1) + ",";
    payload += "\\"satellites\\":" + String(gps.satellites.value()) + ",";
    payload += "\\"gpsFix\\":true}";
  } else {
    payload += "\\"gps\\":{\\"gpsFix\\":false,\\"latitude\\":0,\\"longitude\\":0}";
  }
  payload += "}";

  int httpCode = http.POST(payload);
  if (httpCode > 0) {
    String response = http.getString();
    Serial.println("Telemetry Code: " + String(httpCode) + " Response: " + response);

    // Check if server commanded buzzer activation
    if (response.indexOf("\\"buzzerCommand\\":true") > 0) {
      triggerLocalAlarm(15);
    }
  }
  http.end();

  // Update OLED Display
  display.clearDisplay();
  display.setCursor(0, 0);
  display.println("ANTI-FUEL THEFT");
  display.println("ADC: " + String(rawAdc) + " | RSSI: " + String(WiFi.RSSI()));
  display.println("GPS Fix: " + String(gps.location.isValid() ? "YES" : "NO FIX"));
  if (gps.location.isValid()) {
    display.println("Lat: " + String(gps.location.lat(), 4));
  }
  display.display();
}

void sendHeartbeat() {
  if (WiFi.status() != WL_CONNECTED) return;
  HTTPClient http;
  http.begin(HEARTBEAT_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-ESP32-Device-ID", DEVICE_ID);
  http.addHeader("X-ESP32-Secret-Key", SECRET_KEY);

  String payload = "{\\"wifiRSSI\\":" + String(WiFi.RSSI()) + ",\\"firmwareVersion\\":\\"${device.firmwareVersion}\\"}";
  int httpCode = http.POST(payload);
  if (httpCode > 0) {
    String resp = http.getString();
    if (resp.indexOf("\\"triggerBuzzer\\":true") > 0) {
      triggerLocalAlarm(15);
    }
  }
  http.end();
}

void triggerLocalAlarm(int durationSeconds) {
  Serial.println("ALARM TRIGGERED: SOUNDING BUZZER");
  for (int i = 0; i < durationSeconds * 2; i++) {
    digitalWrite(PIN_BUZZER, HIGH);
    delay(300);
    digitalWrite(PIN_BUZZER, LOW);
    delay(200);
  }
}
`;

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${device.id}_firmware.ino"`);
    res.send(firmwareSource);
  });

  // ==========================================
  // FUEL READINGS & CALIBRATION
  // ==========================================

  app.get('/api/fuel/readings', (req: Request, res: Response) => {
    const vehicleId = req.query.vehicleId as string;
    const limit = Number(req.query.limit) || 100;

    let readings = db.fuelReadings;
    if (vehicleId) {
      readings = readings.filter(r => r.vehicleId === vehicleId);
    }

    res.json(readings.slice(-limit));
  });

  app.get('/api/fuel/calibration/:vehicleId', (req: Request, res: Response) => {
    const profile = db.calibrations.get(req.params.vehicleId);
    if (!profile) {
      return res.status(404).json({ error: 'Calibration profile not found' });
    }
    res.json(profile);
  });

  app.post('/api/fuel/calibration/:vehicleId', (req: Request, res: Response) => {
    const { adcMin, adcMax, stages, notes, userEmail } = req.body;
    const vehicle = db.vehicles.get(req.params.vehicleId);
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    let profile = db.calibrations.get(vehicle.id);
    if (!profile) {
      profile = {
        id: `calib_${vehicle.id}`,
        vehicleId: vehicle.id,
        deviceId: vehicle.deviceId || '',
        adcMin: Number(adcMin) || 300,
        adcMax: Number(adcMax) || 3900,
        fuelMinLiters: 0,
        fuelMaxLiters: vehicle.tankCapacityLiters,
        tankCapacityLiters: vehicle.tankCapacityLiters,
        stages: stages || [],
        notes: notes || '',
        updatedAt: new Date().toISOString(),
        updatedBy: userEmail || 'Owner'
      };
      db.calibrations.set(vehicle.id, profile);
    } else {
      if (adcMin !== undefined) profile.adcMin = Number(adcMin);
      if (adcMax !== undefined) profile.adcMax = Number(adcMax);
      if (stages) profile.stages = stages;
      if (notes !== undefined) profile.notes = notes;
      profile.updatedAt = new Date().toISOString();
      profile.updatedBy = userEmail || 'Owner';
    }

    db.logAudit(vehicle.userId, userEmail || 'USER', 'CALIBRATION_PROFILE_UPDATED', 'CalibrationProfile', profile.id, 'SUCCESS', {
      stagesCount: profile.stages.length,
      adcMin: profile.adcMin,
      adcMax: profile.adcMax
    });

    res.json(profile);
  });

  // ==========================================
  // ALERTS & INCIDENT MANAGEMENT
  // ==========================================

  app.get('/api/alerts', (req: Request, res: Response) => {
    const vehicleId = req.query.vehicleId as string;
    const severity = req.query.severity as string;
    const status = req.query.status as string;

    let list = db.alerts;
    if (vehicleId) list = list.filter(a => a.vehicleId === vehicleId);
    if (severity) list = list.filter(a => a.severity === severity);
    if (status) list = list.filter(a => a.status === status);

    res.json(list);
  });

  app.post('/api/alerts/:id/acknowledge', (req: Request, res: Response) => {
    const alert = db.alerts.find(a => a.id === req.params.id);
    if (!alert) return res.status(404).json({ error: 'Alert not found' });

    alert.status = 'ACKNOWLEDGED';
    alert.acknowledgedBy = req.body.userName || 'Operator';
    alert.acknowledgedAt = new Date().toISOString();

    db.logAudit(req.body.userId || 'admin', req.body.userName || 'Operator', 'ALERT_ACKNOWLEDGED', 'Alert', alert.id, 'SUCCESS');
    broadcastRealtime('alert_updated', alert);
    res.json(alert);
  });

  app.post('/api/alerts/:id/resolve', (req: Request, res: Response) => {
    const alert = db.alerts.find(a => a.id === req.params.id);
    if (!alert) return res.status(404).json({ error: 'Alert not found' });

    alert.status = 'RESOLVED';
    alert.resolvedBy = req.body.userName || 'Operator';
    alert.resolvedAt = new Date().toISOString();
    alert.notes = req.body.notes || '';

    db.logAudit(req.body.userId || 'admin', req.body.userName || 'Operator', 'ALERT_RESOLVED', 'Alert', alert.id, 'SUCCESS', { notes: req.body.notes });
    broadcastRealtime('alert_updated', alert);
    res.json(alert);
  });

  app.get('/api/incidents', (req: Request, res: Response) => {
    const vehicleId = req.query.vehicleId as string;
    let list = db.incidents;
    if (vehicleId) list = list.filter(i => i.vehicleId === vehicleId);
    res.json(list);
  });

  app.put('/api/incidents/:id/status', (req: Request, res: Response) => {
    const incident = db.incidents.find(i => i.id === req.params.id);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });

    const { status, assignedAgent, resolutionNotes, userName } = req.body;
    if (status) incident.status = status;
    if (assignedAgent) incident.assignedAgent = assignedAgent;
    if (resolutionNotes) incident.resolutionNotes = resolutionNotes;
    incident.updatedAt = new Date().toISOString();

    incident.timeline.push({
      time: new Date().toISOString(),
      event: `Status updated to ${status} by ${userName || 'Investigator'}`
    });

    db.logAudit(req.body.userId || 'admin', userName || 'Admin', 'INCIDENT_UPDATED', 'Incident', incident.id, 'SUCCESS', { status });
    res.json(incident);
  });

  app.post('/api/incidents/:id/timeline', (req: Request, res: Response) => {
    const incident = db.incidents.find(i => i.id === req.params.id);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });

    const { event, userName } = req.body;
    if (!event) return res.status(400).json({ error: 'Event text required' });

    incident.timeline.push({
      time: new Date().toISOString(),
      event: `[${userName || 'Investigator'}]: ${event}`
    });
    incident.updatedAt = new Date().toISOString();

    res.json(incident);
  });

  // ==========================================
  // GPS, GEOFENCES & TRIPS
  // ==========================================

  app.get('/api/gps/latest', (req: Request, res: Response) => {
    const vehicleId = req.query.vehicleId as string;
    let readings = db.gpsReadings;
    if (vehicleId) {
      readings = readings.filter(g => g.vehicleId === vehicleId);
    }
    const latest = readings.length > 0 ? readings[readings.length - 1] : null;
    res.json(latest);
  });

  app.get('/api/gps/history', (req: Request, res: Response) => {
    const vehicleId = req.query.vehicleId as string;
    let readings = db.gpsReadings;
    if (vehicleId) {
      readings = readings.filter(g => g.vehicleId === vehicleId);
    }
    res.json(readings.slice(-300));
  });

  app.get('/api/geofences', (req: Request, res: Response) => {
    const userId = req.query.userId as string;
    let list = db.geofences;
    if (userId) list = list.filter(g => g.userId === userId);
    res.json(list);
  });

  app.post('/api/geofences', (req: Request, res: Response) => {
    const { userId, vehicleId, name, centerLat, centerLng, radiusMeters, zoneType, alertOnExit, alertOnEntry } = req.body;

    if (!userId || !name || centerLat === undefined || centerLng === undefined || !radiusMeters) {
      return res.status(400).json({ error: 'Missing geofence parameters' });
    }

    const fence = {
      id: `geo_${Date.now()}`,
      userId,
      vehicleId: vehicleId || undefined,
      name,
      centerLat: Number(centerLat),
      centerLng: Number(centerLng),
      radiusMeters: Number(radiusMeters),
      zoneType: zoneType || 'DEPOT',
      alertOnExit: alertOnExit !== undefined ? alertOnExit : true,
      alertOnEntry: alertOnEntry !== undefined ? alertOnEntry : false,
      createdAt: new Date().toISOString()
    };

    db.geofences.push(fence);
    db.logAudit(userId, 'USER', 'GEOFENCE_CREATED', 'Geofence', fence.id, 'SUCCESS', { name });
    res.json(fence);
  });

  app.delete('/api/geofences/:id', (req: Request, res: Response) => {
    const idx = db.geofences.findIndex(g => g.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Geofence not found' });

    const fence = db.geofences[idx];
    db.geofences.splice(idx, 1);
    db.logAudit(fence.userId, 'USER', 'GEOFENCE_DELETED', 'Geofence', fence.id, 'SUCCESS');
    res.json({ status: 'DELETED' });
  });

  app.get('/api/trips', (req: Request, res: Response) => {
    const vehicleId = req.query.vehicleId as string;
    let list = db.trips;
    if (vehicleId) list = list.filter(t => t.vehicleId === vehicleId);
    res.json(list);
  });

  // ==========================================
  // ANALYTICS
  // ==========================================

  app.get('/api/analytics', (req: Request, res: Response) => {
    const vehicleId = req.query.vehicleId as string;
    let readings = db.fuelReadings;
    let alerts = db.alerts;
    let incidents = db.incidents;

    if (vehicleId) {
      readings = readings.filter(r => r.vehicleId === vehicleId);
      alerts = alerts.filter(a => a.vehicleId === vehicleId);
      incidents = incidents.filter(i => i.vehicleId === vehicleId);
    }

    if (readings.length === 0) {
      return res.json({
        hasData: false,
        message: 'INSUFFICIENT DATA'
      });
    }

    const totalLiters = readings.reduce((acc, curr) => acc + curr.fuelLiters, 0);
    const avgFuel = Math.round((totalLiters / readings.length) * 10) / 10;
    const theftCount = alerts.filter(a => a.type === 'THEFT_DETECTED').length;
    const suspiciousCount = alerts.filter(a => a.type === 'SUSPICIOUS_FUEL_DROP').length;
    const totalTheftLiters = incidents.reduce((acc, i) => acc + (i.fuelReductionLiters || 0), 0);

    res.json({
      hasData: true,
      totalReadings: readings.length,
      averageFuelLiters: avgFuel,
      theftCount,
      suspiciousCount,
      totalTheftLiters: Math.round(totalTheftLiters * 10) / 10,
      activeAlertsCount: alerts.filter(a => a.status === 'ACTIVE').length,
      resolvedIncidentsCount: incidents.filter(i => i.status === 'RESOLVED' || i.status === 'CLOSED').length
    });
  });

  // ==========================================
  // SUPPORT TICKETS & CUSTOMER CARE
  // ==========================================

  app.get('/api/support/tickets', (req: Request, res: Response) => {
    const userId = req.query.userId as string;
    const role = req.query.role as string;

    let list = db.supportTickets;
    if (role === 'VEHICLE_OWNER' && userId) {
      list = list.filter(t => t.userId === userId);
    }
    res.json(list);
  });

  app.post('/api/support/tickets', (req: Request, res: Response) => {
    const { userId, userEmail, userName, vehicleId, deviceId, category, subject, description, priority } = req.body;

    if (!userId || !userEmail || !subject || !description) {
      return res.status(400).json({ error: 'Missing required ticket fields' });
    }

    const ticket: any = {
      id: `tkt_${Date.now()}`,
      userId,
      userEmail,
      userName: userName || 'Vehicle Owner',
      vehicleId,
      deviceId,
      category: category || 'ESP32_HARDWARE',
      subject,
      description,
      priority: priority || 'MEDIUM',
      status: 'OPEN',
      messages: [
        {
          id: `msg_${Date.now()}`,
          senderId: userId,
          senderName: userName || 'Vehicle Owner',
          senderRole: 'VEHICLE_OWNER',
          message: description,
          timestamp: new Date().toISOString()
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.supportTickets.unshift(ticket);
    db.logAudit(userId, userEmail, 'TICKET_CREATED', 'SupportTicket', ticket.id, 'SUCCESS');
    res.json(ticket);
  });

  app.post('/api/support/tickets/:id/message', (req: Request, res: Response) => {
    const ticket = db.supportTickets.find(t => t.id === req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    const { senderId, senderName, senderRole, message, attachmentUrl } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });

    const msg = {
      id: `msg_${Date.now()}`,
      senderId: senderId || 'unknown',
      senderName: senderName || 'User',
      senderRole: senderRole || 'VEHICLE_OWNER',
      message,
      attachmentUrl,
      timestamp: new Date().toISOString()
    };

    ticket.messages.push(msg);
    ticket.updatedAt = new Date().toISOString();
    if (senderRole === 'SUPPORT_AGENT' || senderRole === 'ADMIN') {
      ticket.status = 'WAITING_FOR_USER';
    } else {
      ticket.status = 'IN_PROGRESS';
    }

    res.json(ticket);
  });

  app.put('/api/support/tickets/:id/status', (req: Request, res: Response) => {
    const ticket = db.supportTickets.find(t => t.id === req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    const { status, assignedAgent, assignedAgentName } = req.body;
    if (status) ticket.status = status;
    if (assignedAgent) ticket.assignedAgent = assignedAgent;
    if (assignedAgentName) ticket.assignedAgentName = assignedAgentName;
    ticket.updatedAt = new Date().toISOString();

    res.json(ticket);
  });

  // ==========================================
  // NOTIFICATIONS & AUDIT LOGS
  // ==========================================

  app.get('/api/notifications', (req: Request, res: Response) => {
    const userId = req.query.userId as string;
    let list = db.notifications;
    if (userId) list = list.filter(n => n.userId === userId);
    res.json(list);
  });

  app.post('/api/notifications/mark-read', (req: Request, res: Response) => {
    const { notifId } = req.body;
    const notif = db.notifications.find(n => n.id === notifId);
    if (notif) notif.isRead = true;
    res.json({ status: 'OK' });
  });

  app.post('/api/notifications/mark-all-read', (req: Request, res: Response) => {
    const { userId } = req.body;
    for (const n of db.notifications) {
      if (!userId || n.userId === userId) n.isRead = true;
    }
    res.json({ status: 'OK' });
  });

  app.get('/api/audit-logs', (req: Request, res: Response) => {
    const limit = Number(req.query.limit) || 100;
    res.json(db.auditLogs.slice(0, limit));
  });

  // ==========================================
  // ADMIN PANEL & SYSTEM HEALTH
  // ==========================================

  app.get('/api/admin/overview', (req: Request, res: Response) => {
    const totalUsers = db.users.size;
    const totalVehicles = db.vehicles.size;
    const devicesList = Array.from(db.devices.values());
    const connectedDevices = devicesList.filter(d => d.status === 'ONLINE').length;
    const offlineDevices = devicesList.filter(d => d.status === 'OFFLINE').length;
    const activeAlerts = db.alerts.filter(a => a.status === 'ACTIVE').length;
    const confirmedThefts = db.alerts.filter(a => a.type === 'THEFT_DETECTED').length;
    const openTickets = db.supportTickets.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;

    res.json({
      totalUsers,
      totalVehicles,
      connectedDevices,
      offlineDevices,
      activeAlerts,
      confirmedThefts,
      openTickets,
      systemHealth: 'HEALTHY'
    });
  });

  app.get('/api/admin/system-health', (req: Request, res: Response) => {
    const now = Date.now();
    res.json({
      timestamp: new Date().toISOString(),
      services: {
        apiGateway: { status: 'HEALTHY', latencyMs: 1.2 },
        deviceIngestion: { status: 'HEALTHY', activeSockets: sseClients.length },
        database: { status: 'HEALTHY', memoryEntries: db.fuelReadings.length + db.gpsReadings.length },
        theftRuleEngine: { status: 'HEALTHY', confirmationStages: 2 },
        realtimeBroadcast: { status: 'HEALTHY', connectedClients: sseClients.length },
        authentication: { status: 'HEALTHY', activeUsers: db.users.size }
      }
    });
  });

  app.get('/api/admin/users', (req: Request, res: Response) => {
    const users = Array.from(db.users.values());
    res.json(users);
  });

  app.put('/api/admin/users/:id/role', (req: Request, res: Response) => {
    const user = db.users.get(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.role = req.body.role;
    res.json(user);
  });

  app.get('/api/admin/detection-settings', (req: Request, res: Response) => {
    res.json(db.settings);
  });

  app.put('/api/admin/detection-settings', (req: Request, res: Response) => {
    Object.assign(db.settings, req.body);
    db.logAudit('admin', 'ADMIN', 'DETECTION_SETTINGS_UPDATED', 'Settings', 'theft_rules', 'SUCCESS', req.body);
    res.json(db.settings);
  });

  // ==========================================
  // GEMINI AI ASSISTANT & FORENSICS ENDPOINTS
  // ==========================================

  app.post('/api/ai/copilot', async (req: Request, res: Response) => {
    try {
      const { prompt, vehicleId } = req.body;
      if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

      // Gather live fleet context to ground Gemini responses
      const contextData = {
        totalVehicles: db.vehicles.size,
        vehicles: Array.from(db.vehicles.values()).map(v => {
          const latestReading = db.fuelReadings.filter(r => r.vehicleId === v.id).slice(-1)[0];
          return {
            id: v.id,
            vehicleNumber: v.vehicleNumber,
            vehicleName: v.vehicleName,
            fuelCapacityLiters: v.tankCapacityLiters,
            currentFuelLiters: latestReading ? latestReading.fuelLiters : 0,
            currentFuelPercentage: latestReading ? latestReading.fuelPercentage : 0,
            status: v.status,
            driverName: v.driverName,
            lastUpdated: latestReading ? latestReading.timestamp : v.createdAt
          };
        }),
        recentAlerts: db.alerts.slice(0, 8),
        devices: Array.from(db.devices.values()).map(d => {
          const linkedVeh = d.vehicleId ? db.vehicles.get(d.vehicleId) : null;
          return {
            id: d.id,
            deviceId: d.id,
            vehicleNumber: linkedVeh ? linkedVeh.vehicleNumber : 'Unassigned',
            status: d.status,
            healthScore: d.healthScore || 100,
            sensorStatus: d.sensorStatus,
            gpsStatus: d.gpsStatus,
            wifiRSSI: d.wifiRSSI,
            lastHeartbeat: d.lastHeartbeat
          };
        }),
        activeTheftSettings: db.settings,
        focusedVehicleId: vehicleId
      };

      const reply = await askFleetCopilot(prompt, contextData);
      res.json({ reply });
    } catch (err: any) {
      console.error('AI Copilot error:', err);
      res.status(500).json({ error: err.message || 'AI Copilot service unavailable' });
    }
  });

  app.post('/api/ai/theft-analysis', async (req: Request, res: Response) => {
    try {
      const { alertId, vehicleId } = req.body;
      let alert = db.alerts.find(a => a.id === alertId);
      const vehicle = vehicleId ? db.vehicles.get(vehicleId) : (alert ? db.vehicles.get(alert.vehicleId) : null);
      const telemetryTrail = vehicle ? db.fuelReadings.filter(r => r.vehicleId === vehicle.id).slice(-10) : [];

      const incidentContext = {
        alert,
        vehicle,
        telemetryTrail,
        theftRules: db.settings
      };

      const analysis = await analyzeTheftIncidentWithAI(incidentContext);
      res.json({ analysis });
    } catch (err: any) {
      console.error('AI Theft Analysis error:', err);
      res.status(500).json({ error: err.message || 'Failed to generate AI theft analysis' });
    }
  });

  app.post('/api/ai/fuel-intelligence', async (req: Request, res: Response) => {
    try {
      const { period = '7d', vehicleId } = req.body;
      const readings = vehicleId ? db.fuelReadings.filter(r => r.vehicleId === vehicleId) : db.fuelReadings;
      const alerts = vehicleId ? db.alerts.filter(a => a.vehicleId === vehicleId) : db.alerts;

      const stats = {
        totalReadingsTracked: readings.length,
        theftAlertsRecorded: alerts.filter(a => a.type === 'THEFT_DETECTED').length,
        suspiciousDropsRecorded: alerts.filter(a => a.type === 'SUSPICIOUS_FUEL_DROP').length,
        sensorAnomaliesRecorded: alerts.filter(a => a.type === 'SENSOR_MALFUNCTION').length,
        vehicles: Array.from(db.vehicles.values()).map(v => {
          const latest = db.fuelReadings.filter(r => r.vehicleId === v.id).slice(-1)[0];
          return {
            name: v.vehicleName,
            number: v.vehicleNumber,
            fuelLevelLiters: latest ? latest.fuelLiters : 0,
            capacity: v.tankCapacityLiters
          };
        })
      };

      const report = await generateFleetFuelIntelligenceReport(period, stats);
      res.json({ report });
    } catch (err: any) {
      console.error('AI Fuel Intelligence error:', err);
      res.status(500).json({ error: err.message || 'Failed to generate fuel report' });
    }
  });

  app.post('/api/ai/hardware-diagnostics', async (req: Request, res: Response) => {
    try {
      const { deviceId } = req.body;
      let device = Array.from(db.devices.values()).find(d => d.id === deviceId || d.deviceId === deviceId);
      if (!device && db.devices.size > 0) {
        device = Array.from(db.devices.values())[0];
      }

      const recentReadings = device ? db.fuelReadings.filter(r => r.deviceId === device.id).slice(-5) : [];

      const hardwareContext = {
        device,
        recentReadings,
        pinMappings: {
          GPIO34: 'Analog Fuel Level Sensor (ADC1_CH6, 0-3.3V)',
          GPIO16: 'NEO-6M GPS RX2 (UART 9600 Baud)',
          GPIO17: 'NEO-6M GPS TX2 (UART 9600 Baud)',
          GPIO25: 'Piezoelectric Siren Transistor Relay Trigger'
        }
      };

      const diagnostics = await diagnoseHardwareWithAI(hardwareContext);
      res.json({ diagnostics });
    } catch (err: any) {
      console.error('AI Hardware Diagnostics error:', err);
      res.status(500).json({ error: err.message || 'Failed to perform AI diagnostic' });
    }
  });

  app.post(['/api/ai/draft-ticket-response', '/api/ai/draft-ticket-reply'], async (req: Request, res: Response) => {
    try {
      const { ticketId, ticketSubject, ticketDescription, ticketCategory, latestUserMessage } = req.body;
      let ticketPayload: any;
      if (ticketId) {
        const ticket = db.supportTickets.find(t => t.id === ticketId);
        if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
        ticketPayload = ticket;
      } else {
        ticketPayload = {
          subject: ticketSubject,
          description: ticketDescription,
          category: ticketCategory,
          latestUserMessage
        };
      }

      const draft = await draftSupportResolutionWithAI(ticketPayload);
      res.json({ draft });
    } catch (err: any) {
      console.error('AI Draft Response error:', err);
      res.status(500).json({ error: err.message || 'Failed to draft AI response' });
    }
  });

  // ==========================================
  // DATA EXPORT
  // ==========================================

  app.get('/api/export/:type', (req: Request, res: Response) => {
    const type = req.params.type;
    const vehicleId = req.query.vehicleId as string;

    if (type === 'fuel') {
      let data = db.fuelReadings;
      if (vehicleId) data = data.filter(d => d.vehicleId === vehicleId);

      let csv = 'Timestamp,DeviceID,VehicleID,RawADC,FuelLiters,Percentage,ReductionLiters,SensorStatus\n';
      data.forEach(r => {
        csv += `${r.timestamp},${r.deviceId},${r.vehicleId},${r.rawAdc},${r.fuelLiters},${r.fuelPercentage}%,${r.fuelReduction},${r.sensorStatus}\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="fuel_data_${Date.now()}.csv"`);
      return res.send(csv);
    }

    if (type === 'alerts') {
      let data = db.alerts;
      if (vehicleId) data = data.filter(d => d.vehicleId === vehicleId);

      let csv = 'AlertID,Timestamp,VehicleNumber,DeviceID,Type,Severity,Status,FuelChangeLiters,Latitude,Longitude\n';
      data.forEach(a => {
        csv += `${a.id},${a.timestamp},${a.vehicleNumber},${a.deviceId},${a.type},${a.severity},${a.status},${a.fuelChangeLiters || 0},${a.latitude || ''},${a.longitude || ''}\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="alerts_export_${Date.now()}.csv"`);
      return res.send(csv);
    }

    res.status(400).json({ error: 'Unsupported export type' });
  });

  // ==========================================
  // VITE CLIENT MIDDLEWARE OR STATIC PRODUCTION
  // ==========================================

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = fs.existsSync(path.join(process.cwd(), 'dist'))
      ? path.join(process.cwd(), 'dist')
      : (fs.existsSync(path.resolve(__dirname, 'dist')) ? path.resolve(__dirname, 'dist') : __dirname);
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      const indexFile = path.join(distPath, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(200).send('<!DOCTYPE html><html><head><title>Anti-Fuel Theft Monitoring</title></head><body><div id="root">App Loading...</div></body></html>');
      }
    });
  }

  // Global Express error handler
  app.use((err: any, req: Request, res: Response, next: any) => {
    console.error('Unhandled Express Error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error', details: err?.message || 'Server error' });
    }
  });

  return app;
}

if (!process.env.VERCEL) {
  createApp().then(app => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Smart Anti-Fuel Theft Monitoring System Server running at http://0.0.0.0:${PORT}`);
    });
  }).catch(err => {
    console.error('Failed to start server:', err);
  });
}
