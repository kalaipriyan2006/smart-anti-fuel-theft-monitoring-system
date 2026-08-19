import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Vehicle, ESP32Device, FuelReading, GpsReading, Alert, NotificationItem } from '../types/index.js';
import { api } from '../services/api.js';
import { useAuth } from './AuthContext.js';

interface FleetContextType {
  vehicles: Vehicle[];
  selectedVehicleId: string | null;
  selectedVehicle: Vehicle | null;
  devices: ESP32Device[];
  selectedDevice: ESP32Device | null;
  latestFuel: FuelReading | null;
  latestGps: GpsReading | null;
  activeAlerts: Alert[];
  unreadNotifications: NotificationItem[];
  sseConnected: boolean;
  loading: boolean;
  setSelectedVehicleId: (id: string) => void;
  refreshFleetData: () => Promise<void>;
  refreshFuelData: () => Promise<void>;
  refreshAlerts: () => Promise<void>;
}

const FleetContext = createContext<FleetContextType | undefined>(undefined);

export const FleetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [devices, setDevices] = useState<ESP32Device[]>([]);
  const [latestFuel, setLatestFuel] = useState<FuelReading | null>(null);
  const [latestGps, setLatestGps] = useState<GpsReading | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<Alert[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState<NotificationItem[]>([]);
  const [sseConnected, setSseConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const selectedVehicle = useMemo(() => {
    return vehicles.find(v => v.id === selectedVehicleId) || (vehicles.length > 0 ? vehicles[0] : null);
  }, [vehicles, selectedVehicleId]);

  const selectedVehicleIdVal = selectedVehicle?.id;

  const selectedDevice = useMemo(() => {
    if (!selectedVehicle) return null;
    return devices.find(d => d.id === selectedVehicle.deviceId || d.vehicleId === selectedVehicle.id) || null;
  }, [devices, selectedVehicle]);

  const refreshFleetData = useCallback(async () => {
    if (!user) return;
    try {
      const [vehList, devList, notifs] = await Promise.all([
        api.getVehicles(user.role === 'ADMIN' ? undefined : user.id).catch(() => []),
        api.getDevices(user.role === 'ADMIN' ? undefined : user.id).catch(() => []),
        api.getNotifications(user.id).catch(() => [])
      ]);

      setVehicles(vehList);
      setDevices(devList);
      setUnreadNotifications(notifs.filter(n => !n.isRead));

      if (vehList.length > 0 && !selectedVehicleId) {
        setSelectedVehicleId(vehList[0].id);
      }
    } catch (err) {
      console.warn('Fleet data sync:', err);
    } finally {
      setLoading(false);
    }
  }, [user, selectedVehicleId]);

  const refreshFuelData = useCallback(async () => {
    if (!selectedVehicleIdVal) {
      setLatestFuel(null);
      return;
    }
    try {
      const [readings, gps] = await Promise.all([
        api.getFuelReadings(selectedVehicleIdVal, 1).catch(() => []),
        api.getLatestGps(selectedVehicleIdVal).catch(() => null)
      ]);

      if (readings && readings.length > 0) {
        setLatestFuel(readings[readings.length - 1]);
      } else {
        setLatestFuel(null);
      }

      setLatestGps(gps);
    } catch (err) {
      console.warn('Telemetry sync:', err);
    }
  }, [selectedVehicleIdVal]);

  const refreshAlerts = useCallback(async () => {
    try {
      const alerts = await api.getAlerts(selectedVehicleIdVal, undefined, 'ACTIVE').catch(() => []);
      setActiveAlerts(alerts);
    } catch (err) {
      console.warn('Alerts sync:', err);
    }
  }, [selectedVehicleIdVal]);

  useEffect(() => {
    if (user) {
      refreshFleetData();
    }
  }, [user, refreshFleetData]);

  useEffect(() => {
    if (selectedVehicleIdVal) {
      refreshFuelData();
      refreshAlerts();
    }
  }, [selectedVehicleIdVal, refreshFuelData, refreshAlerts]);

  // Real-time SSE event subscriptions
  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    try {
      unsubscribe = api.subscribeRealtime((event, data) => {
        if (!isMounted) return;
        setSseConnected(true);

        if (event === 'fuel_reading') {
          if (!selectedVehicleIdVal || data.vehicleId === selectedVehicleIdVal) {
            setLatestFuel({
              id: `fr_live_${Date.now()}`,
              deviceId: data.deviceId,
              vehicleId: data.vehicleId,
              timestamp: new Date().toISOString(),
              rawAdc: data.rawAdc,
              fuelLiters: data.fuelLiters,
              fuelPercentage: data.fuelPercentage,
              fuelReduction: data.fuelReduction || 0,
              reductionRate: 0,
              sensorStatus: 'NORMAL'
            });
          }
        } else if (event === 'gps_update') {
          if (!selectedVehicleIdVal || data.vehicleId === selectedVehicleIdVal) {
            setLatestGps({
              id: `gps_live_${Date.now()}`,
              deviceId: data.deviceId,
              vehicleId: data.vehicleId,
              timestamp: new Date().toISOString(),
              latitude: data.latitude,
              longitude: data.longitude,
              speedKmh: data.speedKmh || 0,
              gpsFix: true
            });
          }
        } else if (event === 'alert_updated' || event === 'device_heartbeat') {
          refreshAlerts();
          refreshFleetData();
        }
      });
    } catch (e) {
      console.warn('SSE subscription notice:', e);
    }

    // Fallback periodic poll every 10s
    const pollInterval = setInterval(() => {
      if (isMounted) {
        refreshFuelData();
        refreshAlerts();
      }
    }, 10000);

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
      clearInterval(pollInterval);
    };
  }, [user, selectedVehicleIdVal, refreshAlerts, refreshFuelData, refreshFleetData]);

  return (
    <FleetContext.Provider
      value={{
        vehicles,
        selectedVehicleId,
        selectedVehicle,
        devices,
        selectedDevice,
        latestFuel,
        latestGps,
        activeAlerts,
        unreadNotifications,
        sseConnected,
        loading,
        setSelectedVehicleId,
        refreshFleetData,
        refreshFuelData,
        refreshAlerts
      }}
    >
      {children}
    </FleetContext.Provider>
  );
};

export const useFleet = () => {
  const context = useContext(FleetContext);
  if (!context) {
    throw new Error('useFleet must be used within a FleetProvider');
  }
  return context;
};
