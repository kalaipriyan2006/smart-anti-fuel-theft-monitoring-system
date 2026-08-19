import {
  User,
  ESP32Device,
  Vehicle,
  CalibrationProfile,
  FuelReading,
  GpsReading,
  Alert,
  Incident,
  Geofence,
  Trip,
  SupportTicket,
  NotificationItem,
  AuditLog,
  DetectionSettings,
  SensorStatus
} from '../src/types/index.js';

// In-Memory Database for Production Full-Stack Application
export class Database {
  users: Map<string, User> = new Map();
  passwords: Map<string, string> = new Map(); // email -> password hash
  devices: Map<string, ESP32Device> = new Map();
  vehicles: Map<string, Vehicle> = new Map();
  calibrations: Map<string, CalibrationProfile> = new Map(); // vehicleId -> profile
  fuelReadings: FuelReading[] = [];
  gpsReadings: GpsReading[] = [];
  alerts: Alert[] = [];
  incidents: Incident[] = [];
  geofences: Geofence[] = [];
  trips: Trip[] = [];
  supportTickets: SupportTicket[] = [];
  notifications: NotificationItem[] = [];
  auditLogs: AuditLog[] = [];
  settings: DetectionSettings = {
    theftThresholdLiters: 4.0,
    reductionRateThreshold: 1.5,
    detectionWindowSeconds: 30,
    sensorToleranceAdc: 20,
    confirmationReadingsRequired: 2,
    alertCooldownSeconds: 60,
    autoBuzzerEnabled: true,
    buzzerDurationSeconds: 15,
  };

  // Device command queue (e.g. buzzer triggers for physical ESP32 to poll)
  deviceCommands: Map<string, { buzzer: boolean; buzzerDuration: number; timestamp: string }> = new Map();

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // Seed Admin, Vehicle Owner, and Support Agent
    const adminUser: User = {
      id: 'usr_admin_01',
      fullName: 'Chief IoT Operations Admin',
      email: 'admin@antifueltheft.io',
      mobile: '+1 (555) 234-5678',
      role: 'ADMIN',
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      status: 'ACTIVE'
    };
    this.users.set(adminUser.id, adminUser);
    this.passwords.set(adminUser.email, 'Admin1234!');

    const ownerUser: User = {
      id: 'usr_owner_01',
      fullName: 'Kpriyan Logistics Fleet',
      email: 'kpriyan997@gmail.com',
      mobile: '+1 (555) 890-1234',
      role: 'VEHICLE_OWNER',
      createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
      status: 'ACTIVE'
    };
    this.users.set(ownerUser.id, ownerUser);
    this.passwords.set(ownerUser.email, 'Owner1234!');

    const supportUser: User = {
      id: 'usr_support_01',
      fullName: 'Sarah Vance (Hardware Specialist)',
      email: 'support@antifueltheft.io',
      mobile: '+1 (555) 432-8765',
      role: 'SUPPORT_AGENT',
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
      status: 'ACTIVE'
    };
    this.users.set(supportUser.id, supportUser);
    this.passwords.set(supportUser.email, 'Support1234!');

    // Seed Initial Vehicles
    const vehicle1: Vehicle = {
      id: 'veh_tanker_01',
      userId: ownerUser.id,
      vehicleNumber: 'FL-9021-VOLVO',
      vehicleName: 'Volvo FH16 750 (Hauler 1)',
      vehicleType: 'TRUCK',
      tankCapacityLiters: 450,
      driverName: 'Robert Langdon',
      driverPhone: '+1 (555) 301-4491',
      deviceId: 'ESP32-FT-84920',
      status: 'ACTIVE',
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString()
    };
    this.vehicles.set(vehicle1.id, vehicle1);

    const vehicle2: Vehicle = {
      id: 'veh_tanker_02',
      userId: ownerUser.id,
      vehicleNumber: 'FL-4382-MACK',
      vehicleName: 'Mack Anthem Longhaul (Hauler 2)',
      vehicleType: 'TANKER',
      tankCapacityLiters: 600,
      driverName: 'David Mercer',
      driverPhone: '+1 (555) 772-1084',
      deviceId: 'ESP32-FT-31092',
      status: 'ACTIVE',
      createdAt: new Date(Date.now() - 8 * 86400000).toISOString()
    };
    this.vehicles.set(vehicle2.id, vehicle2);

    // Seed Authenticated ESP32 Devices
    const esp1: ESP32Device = {
      id: 'ESP32-FT-84920',
      name: 'Volvo FH16 Main Fuel ESP32',
      secretKey: 'sec_esp32_volvo_84920_auth_key',
      vehicleId: vehicle1.id,
      userId: ownerUser.id,
      firmwareVersion: 'v1.4.2',
      latestFirmwareVersion: 'v1.4.2',
      lastHeartbeat: new Date(Date.now() - 12000).toISOString(),
      lastCommunication: new Date(Date.now() - 12000).toISOString(),
      status: 'ONLINE',
      wifiRSSI: -62,
      sensorStatus: 'NORMAL',
      gpsStatus: 'CONNECTED',
      cloudStatus: 'CONNECTED',
      healthScore: 96,
      hardwareConfig: {
        adcPin: 34,
        gpsRxPin: 16,
        gpsTxPin: 17,
        oledSdaPin: 21,
        oledSclPin: 22,
        buzzerPin: 25
      },
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString()
    };
    this.devices.set(esp1.id, esp1);

    const esp2: ESP32Device = {
      id: 'ESP32-FT-31092',
      name: 'Mack Tanker Sensor Unit',
      secretKey: 'sec_esp32_mack_31092_auth_key',
      vehicleId: vehicle2.id,
      userId: ownerUser.id,
      firmwareVersion: 'v1.4.1',
      latestFirmwareVersion: 'v1.4.2',
      lastHeartbeat: new Date(Date.now() - 3600000 * 4).toISOString(), // 4h ago => OFFLINE
      lastCommunication: new Date(Date.now() - 3600000 * 4).toISOString(),
      status: 'OFFLINE',
      wifiRSSI: -78,
      sensorStatus: 'NORMAL',
      gpsStatus: 'NO_FIX',
      cloudStatus: 'ERROR',
      healthScore: 48,
      hardwareConfig: {
        adcPin: 34,
        gpsRxPin: 16,
        gpsTxPin: 17,
        oledSdaPin: 21,
        oledSclPin: 22,
        buzzerPin: 25
      },
      createdAt: new Date(Date.now() - 8 * 86400000).toISOString()
    };
    this.devices.set(esp2.id, esp2);

    // Calibration Profile for Vehicle 1
    const calib1: CalibrationProfile = {
      id: 'calib_volvo_01',
      vehicleId: vehicle1.id,
      deviceId: esp1.id,
      adcMin: 320,
      adcMax: 3820,
      fuelMinLiters: 0,
      fuelMaxLiters: 450,
      tankCapacityLiters: 450,
      stages: [
        { stage: 'EMPTY', adcValue: 320, fuelLiters: 0 },
        { stage: 'LOW', adcValue: 1195, fuelLiters: 112.5 },
        { stage: 'HALF', adcValue: 2070, fuelLiters: 225.0 },
        { stage: 'HIGH', adcValue: 2945, fuelLiters: 337.5 },
        { stage: 'FULL', adcValue: 3820, fuelLiters: 450.0 }
      ],
      notes: 'Calibrated at Central Fleet Depot with calibrated flow meter.',
      updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      updatedBy: ownerUser.email
    };
    this.calibrations.set(vehicle1.id, calib1);

    // Calibration Profile for Vehicle 2
    const calib2: CalibrationProfile = {
      id: 'calib_mack_02',
      vehicleId: vehicle2.id,
      deviceId: esp2.id,
      adcMin: 400,
      adcMax: 3950,
      fuelMinLiters: 0,
      fuelMaxLiters: 600,
      tankCapacityLiters: 600,
      stages: [
        { stage: 'EMPTY', adcValue: 400, fuelLiters: 0 },
        { stage: 'LOW', adcValue: 1287, fuelLiters: 150.0 },
        { stage: 'HALF', adcValue: 2175, fuelLiters: 300.0 },
        { stage: 'HIGH', adcValue: 3062, fuelLiters: 450.0 },
        { stage: 'FULL', adcValue: 3950, fuelLiters: 600.0 }
      ],
      notes: 'Initial factory calibration curve.',
      updatedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      updatedBy: ownerUser.email
    };
    this.calibrations.set(vehicle2.id, calib2);

    // Seed Real GPS Readings & Fuel History for Vehicle 1 (Volvo)
    const now = Date.now();
    let currentLiters = 345.0;
    const baseLat = 37.7749;
    const baseLng = -122.4194;

    for (let i = 40; i >= 0; i--) {
      const time = new Date(now - i * 60000).toISOString();
      const adc = Math.round(320 + (currentLiters / 450) * (3820 - 320));
      const percentage = Math.round((currentLiters / 450) * 1000) / 10;
      
      this.fuelReadings.push({
        id: `fr_v1_${i}`,
        deviceId: esp1.id,
        vehicleId: vehicle1.id,
        timestamp: time,
        rawAdc: adc,
        fuelLiters: Math.round(currentLiters * 10) / 10,
        fuelPercentage: percentage,
        fuelReduction: 0.1,
        reductionRate: 0.1,
        sensorStatus: 'NORMAL'
      });

      this.gpsReadings.push({
        id: `gps_v1_${i}`,
        deviceId: esp1.id,
        vehicleId: vehicle1.id,
        timestamp: time,
        latitude: baseLat + (40 - i) * 0.0003,
        longitude: baseLng + (40 - i) * 0.0004,
        altitude: 42.5,
        speedKmh: i > 5 ? 45.2 : 0.0,
        satellites: 10,
        gpsFix: true
      });

      if (i > 5) {
        currentLiters -= 0.12; // normal consumption while moving
      }
    }

    // Seed a recent confirmed theft event for testing alert workflows
    const theftTime = new Date(now - 12 * 60000).toISOString();
    const alert1: Alert = {
      id: 'alt_theft_8901',
      vehicleId: vehicle1.id,
      vehicleNumber: vehicle1.vehicleNumber,
      vehicleName: vehicle1.vehicleName,
      deviceId: esp1.id,
      type: 'THEFT_DETECTED',
      severity: 'CRITICAL',
      title: 'CONFIRMED FUEL THEFT DETECTED',
      description: 'Abrupt drop of 24.5 Liters detected within 45 seconds while vehicle engine idle/stopped.',
      fuelChangeLiters: -24.5,
      fuelBeforeLiters: 369.5,
      fuelAfterLiters: 345.0,
      latitude: baseLat + 0.008,
      longitude: baseLng + 0.009,
      timestamp: theftTime,
      status: 'ACTIVE',
      buzzerTriggered: true
    };
    this.alerts.push(alert1);

    const incident1: Incident = {
      id: 'inc_8901_volvo',
      alertId: alert1.id,
      vehicleId: vehicle1.id,
      vehicleNumber: vehicle1.vehicleNumber,
      vehicleName: vehicle1.vehicleName,
      deviceId: esp1.id,
      timestamp: theftTime,
      fuelBeforeLiters: 369.5,
      fuelAfterLiters: 345.0,
      fuelReductionLiters: 24.5,
      latitude: baseLat + 0.008,
      longitude: baseLng + 0.009,
      locationAddress: 'Industrial Zone Logistics Corridor, Bay Area Logistics Bay 4',
      severity: 'CRITICAL',
      status: 'OPEN',
      timeline: [
        { time: new Date(now - 12 * 60000 - 45000).toISOString(), event: 'Sensor ADC dropped from 3150 to 2950 (1st confirmation reading)' },
        { time: new Date(now - 12 * 60000 - 30000).toISOString(), event: 'Sensor ADC dropped from 2950 to 2720 (2nd confirmation reading)' },
        { time: new Date(now - 12 * 60000 - 15000).toISOString(), event: 'Theft Rule Engine: Fuel reduction 24.5L > 4.0L threshold confirmed' },
        { time: theftTime, event: 'Critical Theft Alert generated & ESP32 GPIO25 Buzzer triggered' },
        { time: new Date(now - 11 * 60000).toISOString(), event: 'GPS Location tagged & Incident created in database' }
      ],
      createdAt: theftTime,
      updatedAt: theftTime
    };
    this.incidents.push(incident1);

    // Geofences
    const geofence1: Geofence = {
      id: 'geo_depot_01',
      userId: ownerUser.id,
      vehicleId: vehicle1.id,
      name: 'Primary Logistics Depot & Fuel Station',
      centerLat: baseLat,
      centerLng: baseLng,
      radiusMeters: 500,
      zoneType: 'DEPOT',
      alertOnExit: true,
      alertOnEntry: false,
      createdAt: new Date(now - 7 * 86400000).toISOString()
    };
    this.geofences.push(geofence1);

    // Trips
    const trip1: Trip = {
      id: 'trip_v1_01',
      vehicleId: vehicle1.id,
      deviceId: esp1.id,
      startTime: new Date(now - 4 * 3600000).toISOString(),
      endTime: new Date(now - 1 * 3600000).toISOString(),
      startLatitude: baseLat - 0.05,
      startLongitude: baseLng - 0.05,
      endLatitude: baseLat + 0.01,
      endLongitude: baseLng + 0.01,
      distanceKm: 84.6,
      durationMinutes: 180,
      fuelStartLiters: 420.0,
      fuelEndLiters: 369.5,
      fuelConsumedLiters: 50.5,
      averageSpeedKmh: 52.4,
      waypoints: []
    };
    this.trips.push(trip1);

    // Support Ticket
    const ticket1: SupportTicket = {
      id: 'tkt_8401',
      userId: ownerUser.id,
      userEmail: ownerUser.email,
      userName: ownerUser.fullName,
      vehicleId: vehicle1.id,
      deviceId: esp1.id,
      category: 'FUEL_SENSOR',
      subject: 'Fuel Sensor ADC calibration curve verification at 50% tank fill',
      description: 'Requesting calibration review for Volvo FH16 capacitive sensor after tank cleaning.',
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      assignedAgent: supportUser.id,
      assignedAgentName: supportUser.fullName,
      messages: [
        {
          id: 'msg_1',
          senderId: ownerUser.id,
          senderName: ownerUser.fullName,
          senderRole: 'VEHICLE_OWNER',
          message: 'Hello, we completed standard tank service on Volvo FH16 and verified raw ADC is 2070 at 225 Liters.',
          timestamp: new Date(now - 2 * 86400000).toISOString()
        },
        {
          id: 'msg_2',
          senderId: supportUser.id,
          senderName: supportUser.fullName,
          senderRole: 'SUPPORT_AGENT',
          message: 'Hi team, 2070 ADC aligns with the 5-point calibration table. Your calibration profile is updated and validated.',
          timestamp: new Date(now - 1 * 86400000).toISOString()
        }
      ],
      createdAt: new Date(now - 2 * 86400000).toISOString(),
      updatedAt: new Date(now - 1 * 86400000).toISOString()
    };
    this.supportTickets.push(ticket1);

    // Notifications
    this.notifications.push({
      id: 'notif_1',
      userId: ownerUser.id,
      type: 'THEFT_DETECTED',
      title: 'CRITICAL: Fuel Theft Incident in Progress',
      message: 'Volvo FH16 (FL-9021-VOLVO) experienced 24.5L sudden drop. On-board buzzer activated.',
      severity: 'CRITICAL',
      isRead: false,
      createdAt: theftTime,
      linkUrl: '/alerts'
    });

    // Audit Logs
    this.auditLogs.push({
      id: 'aud_1',
      userId: ownerUser.id,
      userEmail: ownerUser.email,
      action: 'DEVICE_AUTHENTICATION',
      resource: 'ESP32Device',
      resourceId: esp1.id,
      result: 'SUCCESS',
      ipAddress: '192.168.1.142',
      metadata: { firmware: 'v1.4.2', wifiRSSI: -62 },
      timestamp: new Date(now - 10 * 86400000).toISOString()
    });
    this.auditLogs.push({
      id: 'aud_2',
      userId: ownerUser.id,
      userEmail: ownerUser.email,
      action: 'CALIBRATION_PROFILE_SAVED',
      resource: 'CalibrationProfile',
      resourceId: calib1.id,
      result: 'SUCCESS',
      ipAddress: '192.168.1.100',
      metadata: { stages: 5, tankCapacity: 450 },
      timestamp: new Date(now - 5 * 86400000).toISOString()
    });
  }

  // Helper method to calculate liters from ADC based on calibration stages
  calculateFuelLiters(vehicleId: string, rawAdc: number): { liters: number; percentage: number; status: SensorStatus } {
    const calib = this.calibrations.get(vehicleId);
    if (!calib || rawAdc < 50 || rawAdc > 4095) {
      return { liters: 0, percentage: 0, status: 'ERROR' };
    }

    const { adcMin, adcMax, tankCapacityLiters, stages } = calib;

    if (rawAdc <= adcMin) {
      return { liters: 0, percentage: 0, status: 'NORMAL' };
    }
    if (rawAdc >= adcMax) {
      return { liters: tankCapacityLiters, percentage: 100, status: 'NORMAL' };
    }

    // Piecewise linear interpolation if stages are defined
    if (stages && stages.length >= 2) {
      const sortedStages = [...stages].sort((a, b) => a.adcValue - b.adcValue);
      for (let i = 0; i < sortedStages.length - 1; i++) {
        const s1 = sortedStages[i];
        const s2 = sortedStages[i + 1];
        if (rawAdc >= s1.adcValue && rawAdc <= s2.adcValue) {
          const ratio = (rawAdc - s1.adcValue) / (s2.adcValue - s1.adcValue || 1);
          const liters = s1.fuelLiters + ratio * (s2.fuelLiters - s1.fuelLiters);
          const roundedLiters = Math.round(liters * 10) / 10;
          const percentage = Math.round((roundedLiters / tankCapacityLiters) * 1000) / 10;
          return { liters: roundedLiters, percentage, status: 'NORMAL' };
        }
      }
    }

    // Linear fallback
    const ratio = (rawAdc - adcMin) / (adcMax - adcMin);
    const liters = Math.max(0, Math.min(tankCapacityLiters, ratio * tankCapacityLiters));
    const roundedLiters = Math.round(liters * 10) / 10;
    const percentage = Math.round((roundedLiters / tankCapacityLiters) * 1000) / 10;
    return { liters: roundedLiters, percentage, status: 'NORMAL' };
  }

  // Add audit record
  logAudit(userId: string, userEmail: string, action: string, resource: string, resourceId?: string, result: 'SUCCESS' | 'FAILURE' = 'SUCCESS', metadata?: any, ip?: string) {
    const log: AuditLog = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      userEmail,
      action,
      resource,
      resourceId,
      result,
      ipAddress: ip || '127.0.0.1',
      metadata,
      timestamp: new Date().toISOString()
    };
    this.auditLogs.unshift(log);
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop();
    }
  }
}

export const db = new Database();
