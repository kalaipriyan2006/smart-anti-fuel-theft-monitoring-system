import { db } from './db.js';
import { Alert, Incident, NotificationItem, SensorStatus } from '../src/types/index.js';

interface PendingTheftConfirmation {
  deviceId: string;
  vehicleId: string;
  firstDropTimestamp: number;
  initialLiters: number;
  readings: { liters: number; adc: number; timestamp: number }[];
}

// In-memory tracker for multi-reading confirmation
const pendingConfirmations = new Map<string, PendingTheftConfirmation>();
const lastAlertTimestamp = new Map<string, number>();

export function processDevicePacket(params: {
  deviceId: string;
  timestamp: string;
  rawAdc: number;
  wifiRSSI?: number;
  firmwareVersion?: string;
  gps?: {
    latitude: number;
    longitude: number;
    speedKmh?: number;
    satellites?: number;
    gpsFix: boolean;
  };
  sensorStatus?: SensorStatus;
}) {
  const { deviceId, timestamp, rawAdc, wifiRSSI, firmwareVersion, gps, sensorStatus } = params;

  const device = db.devices.get(deviceId);
  if (!device) {
    throw new Error('Device not found or unauthorized');
  }

  // Update device heartbeat & connection metadata
  const now = new Date();
  device.lastHeartbeat = now.toISOString();
  device.lastCommunication = now.toISOString();
  device.status = 'ONLINE';
  if (wifiRSSI !== undefined) device.wifiRSSI = wifiRSSI;
  if (firmwareVersion) device.firmwareVersion = firmwareVersion;
  device.sensorStatus = sensorStatus || 'NORMAL';
  if (gps) {
    device.gpsStatus = gps.gpsFix ? 'CONNECTED' : 'NO_FIX';
  }

  // Calculate Health Score dynamically from real parameters
  let health = 100;
  if (device.sensorStatus !== 'NORMAL') health -= 30;
  if (device.gpsStatus !== 'CONNECTED') health -= 20;
  if (device.wifiRSSI && device.wifiRSSI < -80) health -= 15;
  device.healthScore = Math.max(10, Math.min(100, health));

  if (!device.vehicleId) {
    return { status: 'OK', device, message: 'Device unassigned to vehicle' };
  }

  const vehicle = db.vehicles.get(device.vehicleId);
  if (!vehicle) {
    return { status: 'OK', device, message: 'Vehicle record missing' };
  }

  // Calculate calibrated fuel
  const fuelCalc = db.calculateFuelLiters(vehicle.id, rawAdc);
  const currentLiters = fuelCalc.liters;
  const currentPercentage = fuelCalc.percentage;

  // Retrieve previous fuel reading for this device/vehicle
  const previousReadings = db.fuelReadings.filter(r => r.vehicleId === vehicle.id);
  const lastReading = previousReadings.length > 0 ? previousReadings[previousReadings.length - 1] : null;

  let fuelReduction = 0;
  let reductionRate = 0; // L / min

  if (lastReading) {
    const timeDiffMinutes = (new Date(timestamp).getTime() - new Date(lastReading.timestamp).getTime()) / 60000;
    if (timeDiffMinutes > 0) {
      const drop = lastReading.fuelLiters - currentLiters;
      if (drop > 0) {
        fuelReduction = Math.round(drop * 10) / 10;
        reductionRate = Math.round((fuelReduction / timeDiffMinutes) * 10) / 10;
      }
    }
  }

  // Record fuel reading
  const readingId = `fr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  db.fuelReadings.push({
    id: readingId,
    deviceId: device.id,
    vehicleId: vehicle.id,
    timestamp,
    rawAdc,
    fuelLiters: currentLiters,
    fuelPercentage: currentPercentage,
    fuelReduction,
    reductionRate,
    sensorStatus: fuelCalc.status
  });

  // Keep fuel readings bounded
  if (db.fuelReadings.length > 2000) {
    db.fuelReadings.splice(0, 500);
  }

  // Process GPS if available
  let latestGpsPoint = null;
  if (gps && gps.gpsFix && gps.latitude && gps.longitude) {
    latestGpsPoint = {
      id: `gps_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      deviceId: device.id,
      vehicleId: vehicle.id,
      timestamp,
      latitude: gps.latitude,
      longitude: gps.longitude,
      speedKmh: gps.speedKmh || 0,
      satellites: gps.satellites || 0,
      gpsFix: gps.gpsFix
    };
    db.gpsReadings.push(latestGpsPoint);

    // Geofence checks
    checkGeofences(vehicle.id, vehicle.userId, gps.latitude, gps.longitude, vehicle.vehicleNumber);
  }

  // Rule-Based Multi-Stage Theft Detection Engine
  evaluateTheftRules({
    device,
    vehicle,
    currentLiters,
    rawAdc,
    lastReading,
    fuelReduction,
    reductionRate,
    gpsPoint: latestGpsPoint
  });

  return {
    status: 'OK',
    deviceId: device.id,
    vehicleId: vehicle.id,
    fuelLiters: currentLiters,
    fuelPercentage: currentPercentage,
    fuelReduction,
    buzzerCommand: db.deviceCommands.get(device.id)?.buzzer || false
  };
}

function evaluateTheftRules(context: {
  device: any;
  vehicle: any;
  currentLiters: number;
  rawAdc: number;
  lastReading: any;
  fuelReduction: number;
  reductionRate: number;
  gpsPoint: any;
}) {
  const { device, vehicle, currentLiters, rawAdc, lastReading, fuelReduction, reductionRate, gpsPoint } = context;
  const settings = db.settings;
  const nowMs = Date.now();

  // Cooldown check to avoid duplicate rapid alerts
  const lastAlertTime = lastAlertTimestamp.get(vehicle.id) || 0;
  if (nowMs - lastAlertTime < settings.alertCooldownSeconds * 1000) {
    return;
  }

  // Stage 1: Detect potential drop above threshold
  if (fuelReduction >= settings.theftThresholdLiters || reductionRate >= settings.reductionRateThreshold) {
    let pending = pendingConfirmations.get(vehicle.id);
    if (!pending) {
      pending = {
        deviceId: device.id,
        vehicleId: vehicle.id,
        firstDropTimestamp: nowMs,
        initialLiters: lastReading ? lastReading.fuelLiters : currentLiters + fuelReduction,
        readings: [{ liters: currentLiters, adc: rawAdc, timestamp: nowMs }]
      };
      pendingConfirmations.set(vehicle.id, pending);
      return; // Wait for confirmation reading
    }

    // Stage 2: Confirm sustained drop with second reading
    pending.readings.push({ liters: currentLiters, adc: rawAdc, timestamp: nowMs });
    const totalDrop = pending.initialLiters - currentLiters;

    if (
      pending.readings.length >= settings.confirmationReadingsRequired &&
      totalDrop >= settings.theftThresholdLiters
    ) {
      // Confirmed theft!
      pendingConfirmations.delete(vehicle.id);
      lastAlertTimestamp.set(vehicle.id, nowMs);

      // 1. Set Hardware Buzzer Command on ESP32
      if (settings.autoBuzzerEnabled) {
        db.deviceCommands.set(device.id, {
          buzzer: true,
          buzzerDuration: settings.buzzerDurationSeconds,
          timestamp: new Date().toISOString()
        });
      }

      // 2. Create Alert
      const alertId = `alt_theft_${Date.now()}`;
      const alertTime = new Date().toISOString();
      const alertItem: Alert = {
        id: alertId,
        vehicleId: vehicle.id,
        vehicleNumber: vehicle.vehicleNumber,
        vehicleName: vehicle.vehicleName,
        deviceId: device.id,
        type: 'THEFT_DETECTED',
        severity: 'CRITICAL',
        title: 'CRITICAL FUEL THEFT DETECTED',
        description: `Rapid fuel drop of ${Math.round(totalDrop * 10) / 10} Liters detected within ${(settings.detectionWindowSeconds)}s window.`,
        fuelChangeLiters: -Math.round(totalDrop * 10) / 10,
        fuelBeforeLiters: Math.round(pending.initialLiters * 10) / 10,
        fuelAfterLiters: currentLiters,
        latitude: gpsPoint ? gpsPoint.latitude : undefined,
        longitude: gpsPoint ? gpsPoint.longitude : undefined,
        timestamp: alertTime,
        status: 'ACTIVE',
        buzzerTriggered: settings.autoBuzzerEnabled
      };
      db.alerts.unshift(alertItem);

      // 3. Create Incident with Timeline
      const incidentId = `inc_${Date.now()}_${vehicle.id.slice(-4)}`;
      const incident: Incident = {
        id: incidentId,
        alertId: alertItem.id,
        vehicleId: vehicle.id,
        vehicleNumber: vehicle.vehicleNumber,
        vehicleName: vehicle.vehicleName,
        deviceId: device.id,
        timestamp: alertTime,
        fuelBeforeLiters: Math.round(pending.initialLiters * 10) / 10,
        fuelAfterLiters: currentLiters,
        fuelReductionLiters: Math.round(totalDrop * 10) / 10,
        latitude: gpsPoint ? gpsPoint.latitude : undefined,
        longitude: gpsPoint ? gpsPoint.longitude : undefined,
        locationAddress: gpsPoint ? `GPS Coordinates: ${gpsPoint.latitude.toFixed(5)}, ${gpsPoint.longitude.toFixed(5)}` : 'Location unavailable',
        severity: 'CRITICAL',
        status: 'OPEN',
        timeline: [
          {
            time: new Date(pending.firstDropTimestamp).toISOString(),
            event: `Initial fuel drop observed (${Math.round(pending.initialLiters * 10) / 10}L -> ${currentLiters}L)`
          },
          {
            time: alertTime,
            event: `Rule Engine confirmed sustained reduction of ${Math.round(totalDrop * 10) / 10}L > threshold ${settings.theftThresholdLiters}L`
          },
          {
            time: alertTime,
            event: `ESP32 On-board Active Buzzer (GPIO25) command activated for ${settings.buzzerDurationSeconds}s`
          },
          {
            time: alertTime,
            event: 'Real-time alert broadcast to web dashboard and notification center'
          }
        ],
        createdAt: alertTime,
        updatedAt: alertTime
      };
      db.incidents.unshift(incident);

      // 4. Create Notification
      const notif: NotificationItem = {
        id: `notif_${Date.now()}`,
        userId: vehicle.userId,
        type: 'THEFT_DETECTED',
        title: `CRITICAL FUEL THEFT: ${vehicle.vehicleNumber}`,
        message: `${Math.round(totalDrop * 10) / 10} Liters stolen from ${vehicle.vehicleName}. Local buzzer activated.`,
        severity: 'CRITICAL',
        isRead: false,
        createdAt: alertTime,
        linkUrl: '/alerts'
      };
      db.notifications.unshift(notif);

      // 5. Audit Log
      db.logAudit(
        vehicle.userId,
        'SYSTEM_ENGINE',
        'THEFT_DETECTED_TRIGGERED',
        'Alert',
        alertId,
        'SUCCESS',
        { dropLiters: totalDrop, vehicleId: vehicle.id, deviceId: device.id }
      );
    }
  } else {
    // Normal reading; clear any expired pending confirmation
    const pending = pendingConfirmations.get(vehicle.id);
    if (pending && nowMs - pending.firstDropTimestamp > settings.detectionWindowSeconds * 1000) {
      pendingConfirmations.delete(vehicle.id);
    }
  }
}

// Distance calculator (Haversine formula in meters)
function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

const geofenceState = new Map<string, boolean>(); // geofenceId_vehicleId -> isInside

function checkGeofences(vehicleId: string, userId: string, lat: number, lng: number, vehicleNumber: string) {
  const geofences = db.geofences.filter(g => g.userId === userId && (!g.vehicleId || g.vehicleId === vehicleId));
  const now = new Date().toISOString();

  for (const fence of geofences) {
    const dist = getDistanceMeters(lat, lng, fence.centerLat, fence.centerLng);
    const isInside = dist <= fence.radiusMeters;
    const key = `${fence.id}_${vehicleId}`;
    const previousInside = geofenceState.get(key);

    if (previousInside !== undefined) {
      if (previousInside && !isInside && fence.alertOnExit) {
        // Vehicle exited geofence
        const alert: Alert = {
          id: `alt_geo_exit_${Date.now()}`,
          vehicleId,
          vehicleNumber,
          vehicleName: fence.name,
          deviceId: '',
          type: 'GEOFENCE_EXIT',
          severity: 'WARNING',
          title: `Geofence Exit: ${fence.name}`,
          description: `Vehicle ${vehicleNumber} exited ${fence.name} boundary (${dist.toFixed(0)}m from center).`,
          latitude: lat,
          longitude: lng,
          timestamp: now,
          status: 'ACTIVE',
          buzzerTriggered: false
        };
        db.alerts.unshift(alert);
        db.notifications.unshift({
          id: `notif_geo_${Date.now()}`,
          userId,
          type: 'GEOFENCE_EXIT',
          title: `Geofence Exit: ${vehicleNumber}`,
          message: `Vehicle exited ${fence.name}`,
          severity: 'WARNING',
          isRead: false,
          createdAt: now,
          linkUrl: '/geofences'
        });
      } else if (!previousInside && isInside && fence.alertOnEntry) {
        // Vehicle entered geofence
        const alert: Alert = {
          id: `alt_geo_enter_${Date.now()}`,
          vehicleId,
          vehicleNumber,
          vehicleName: fence.name,
          deviceId: '',
          type: 'GEOFENCE_ENTRY',
          severity: 'INFO',
          title: `Geofence Entry: ${fence.name}`,
          description: `Vehicle ${vehicleNumber} entered ${fence.name}.`,
          latitude: lat,
          longitude: lng,
          timestamp: now,
          status: 'ACTIVE',
          buzzerTriggered: false
        };
        db.alerts.unshift(alert);
      }
    }
    geofenceState.set(key, isInside);
  }
}
