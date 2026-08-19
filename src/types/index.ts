// Shared Types for Smart Anti-Fuel Theft Monitoring System

export type UserRole = 'ADMIN' | 'VEHICLE_OWNER' | 'SUPPORT_AGENT';

export interface User {
  id: string;
  fullName: string;
  email: string;
  mobile: string;
  role: UserRole;
  createdAt: string;
  avatarUrl?: string;
  lastLogin?: string;
  status: 'ACTIVE' | 'SUSPENDED';
}

export type DeviceStatus = 'ONLINE' | 'OFFLINE';
export type SensorStatus = 'NORMAL' | 'ERROR' | 'UNAVAILABLE';
export type GpsStatus = 'CONNECTED' | 'NO_FIX' | 'UNAVAILABLE';
export type CloudStatus = 'CONNECTED' | 'ERROR';

export interface ESP32Device {
  id: string; // Unique Device ID (e.g. ESP32-FT-84920)
  deviceId?: string; // Alias for id
  name: string;
  secretKey: string; // Authentication token for ESP32 HTTP headers
  vehicleId?: string; // Linked vehicle
  vehicleNumber?: string; // Linked vehicle number
  userId: string;
  firmwareVersion: string;
  latestFirmwareVersion: string;
  lastHeartbeat?: string;
  lastCommunication?: string;
  status: DeviceStatus;
  wifiRSSI?: number; // dBm e.g. -65
  sensorStatus: SensorStatus;
  gpsStatus: GpsStatus;
  cloudStatus: CloudStatus;
  healthScore?: number; // 0-100 derived from real data
  hardwareConfig: {
    adcPin: number; // 34
    gpsRxPin: number; // 16
    gpsTxPin: number; // 17
    oledSdaPin: number; // 21
    oledSclPin: number; // 22
    buzzerPin: number; // 25
  };
  createdAt: string;
}

export type Device = ESP32Device;

export interface Vehicle {
  id: string;
  userId: string;
  vehicleNumber: string; // e.g. "CA-8921-TRK"
  vehicleName: string; // e.g. "Volvo FH16 Longhaul"
  vehicleType: 'TRUCK' | 'TANKER' | 'BUS' | 'CAR' | 'GENERATOR' | 'HEAVY_EQUIPMENT';
  tankCapacityLiters: number; // e.g. 400
  fuelCapacityLiters?: number;
  currentFuelLiters?: number;
  currentFuelPercentage?: number;
  lastUpdated?: string;
  driverName?: string;
  driverPhone?: string;
  deviceId?: string; // Linked ESP32 Device ID
  status: 'ACTIVE' | 'IN_TRANSIT' | 'MAINTENANCE' | 'ARCHIVED';
  createdAt: string;
}

export interface CalibrationStage {
  stage: 'EMPTY' | 'LOW' | 'HALF' | 'HIGH' | 'FULL';
  adcValue: number; // 0-4095
  fuelLiters: number;
}

export interface CalibrationProfile {
  id: string;
  vehicleId: string;
  deviceId: string;
  adcMin: number; // ADC when empty
  adcMax: number; // ADC when full
  fuelMinLiters: number;
  fuelMaxLiters: number;
  tankCapacityLiters: number;
  stages: CalibrationStage[];
  notes?: string;
  updatedAt: string;
  updatedBy: string;
}

export interface FuelReading {
  id: string;
  deviceId: string;
  vehicleId: string;
  timestamp: string;
  rawAdc: number;
  fuelLiters: number;
  fuelPercentage: number;
  fuelReduction: number; // Difference from previous reading
  reductionRate: number; // Liters per minute
  sensorStatus: SensorStatus;
}

export interface GpsReading {
  id: string;
  deviceId: string;
  vehicleId: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  speedKmh?: number;
  satellites?: number;
  gpsFix: boolean;
}

export type AlertSeverity = 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';
export type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
export type AlertType = 
  | 'THEFT_DETECTED' 
  | 'SUSPICIOUS_FUEL_DROP' 
  | 'LOW_FUEL' 
  | 'SENSOR_MALFUNCTION' 
  | 'ESP32_OFFLINE' 
  | 'GEOFENCE_EXIT' 
  | 'GEOFENCE_ENTRY' 
  | 'GPS_LOST';

export interface Alert {
  id: string;
  vehicleId: string;
  vehicleNumber: string;
  vehicleName: string;
  deviceId: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  fuelChangeLiters?: number;
  fuelBeforeLiters?: number;
  fuelAfterLiters?: number;
  latitude?: number;
  longitude?: number;
  timestamp: string;
  status: AlertStatus;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  notes?: string;
  buzzerTriggered: boolean;
}

export type IncidentStatus = 'OPEN' | 'INVESTIGATING' | 'CONFIRMED' | 'RESOLVED' | 'CLOSED';

export interface Incident {
  id: string;
  alertId?: string;
  vehicleId: string;
  vehicleNumber: string;
  vehicleName: string;
  deviceId: string;
  timestamp: string;
  fuelBeforeLiters: number;
  fuelAfterLiters: number;
  fuelReductionLiters: number;
  latitude?: number;
  longitude?: number;
  locationAddress?: string;
  severity: AlertSeverity;
  status: IncidentStatus;
  timeline: {
    time: string;
    event: string;
  }[];
  assignedAgent?: string;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Geofence {
  id: string;
  userId: string;
  vehicleId?: string; // empty means all user's vehicles
  name: string;
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
  zoneType: 'DEPOT' | 'PARKING' | 'HOME' | 'OFFICE' | 'RESTRICTED';
  activeTimeStart?: string;
  activeTimeEnd?: string;
  alertOnExit: boolean;
  alertOnEntry: boolean;
  createdAt: string;
}

export interface Trip {
  id: string;
  vehicleId: string;
  deviceId: string;
  startTime: string;
  endTime?: string;
  startLatitude: number;
  startLongitude: number;
  endLatitude?: number;
  endLongitude?: number;
  distanceKm: number;
  durationMinutes: number;
  fuelStartLiters: number;
  fuelEndLiters?: number;
  fuelConsumedLiters?: number;
  averageSpeedKmh?: number;
  waypoints: {
    lat: number;
    lng: number;
    timestamp: string;
    speed?: number;
    fuelLiters?: number;
  }[];
}

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_FOR_USER' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TicketCategory =
  | 'ACCOUNT'
  | 'ESP32_HARDWARE'
  | 'FUEL_SENSOR'
  | 'GPS_TRACKING'
  | 'DEVICE_OFFLINE'
  | 'WRONG_FUEL_READING'
  | 'FALSE_ALERT'
  | 'THEFT_INCIDENT'
  | 'CLOUD_CONNECTION'
  | 'WEBSITE_ISSUE';

export interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  message: string;
  timestamp: string;
  attachmentUrl?: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  vehicleId?: string;
  deviceId?: string;
  category: TicketCategory;
  subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  assignedAgent?: string;
  assignedAgentName?: string;
  messages: TicketMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: AlertType | 'SYSTEM' | 'SUPPORT';
  title: string;
  message: string;
  severity: AlertSeverity;
  isRead: boolean;
  createdAt: string;
  linkUrl?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  result: 'SUCCESS' | 'FAILURE';
  ipAddress?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface DetectionSettings {
  theftThresholdLiters: number; // e.g. 5.0 L drop
  reductionRateThreshold: number; // e.g. 2.0 L/min drop
  detectionWindowSeconds: number; // e.g. 30s
  sensorToleranceAdc: number; // e.g. 15 ADC
  confirmationReadingsRequired: number; // e.g. 2 readings
  alertCooldownSeconds: number; // e.g. 120s
  autoBuzzerEnabled: boolean;
  buzzerDurationSeconds: number;
}
