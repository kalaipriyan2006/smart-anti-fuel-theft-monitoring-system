import React, { useState, useEffect } from 'react';
import { useFleet } from '../../contexts/FleetContext.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { api } from '../../services/api.js';
import {
  MapPin,
  Radio,
  Navigation,
  Compass,
  AlertTriangle,
  Layers,
  RefreshCw,
  Clock,
  Shield,
  Activity
} from 'lucide-react';
import { GpsReading, Alert, Incident, Geofence } from '../../types/index.js';

export const GpsPage: React.FC = () => {
  const { selectedVehicle, latestGps, refreshFleetData } = useFleet();
  const [gpsHistory, setGpsHistory] = useState<GpsReading[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [mapType, setMapType] = useState<'street' | 'satellite'>('street');

  useEffect(() => {
    const loadGpsData = async () => {
      if (!selectedVehicle) {
        setGpsHistory([]);
        setLoading(false);
        return;
      }
      try {
        const [history, alertsList, geofenceList] = await Promise.all([
          api.getGpsHistory(selectedVehicle.id),
          api.getAlerts(selectedVehicle.id),
          api.getGeofences()
        ]);
        setGpsHistory(history);
        setAlerts(alertsList);
        setGeofences(geofenceList);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadGpsData();
  }, [selectedVehicle]);

  const currentGps = latestGps || (gpsHistory.length > 0 ? gpsHistory[gpsHistory.length - 1] : null);
  const theftAlerts = alerts.filter(a => a.type === 'THEFT_DETECTED' && a.latitude && a.longitude);

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-400" />
            Live Fleet GPS Positioning & Incident Map
          </h1>
          <p className="text-xs text-zinc-400">
            Real NEO-6M satellite fix coordinates, travel tracks, and correlated theft location tags
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMapType(mapType === 'street' ? 'satellite' : 'street')}
            className="px-3 py-2 text-xs font-medium bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-700 rounded-xl transition flex items-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Map Style: {mapType === 'street' ? 'Dark Street' : 'Satellite Grid'}</span>
          </button>
        </div>
      </div>

      {/* GPS Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-1">
          <span className="text-[11px] text-zinc-500 uppercase font-semibold">GPS Fix Status</span>
          <div className="pt-1">
            <StatusBadge type="gps" status={currentGps && currentGps.gpsFix ? 'CONNECTED' : 'NO_FIX'} />
          </div>
          <div className="text-[10px] text-zinc-500 mt-1">
            {currentGps?.satellites !== undefined ? `${currentGps.satellites} Satellites in view` : 'Searching'}
          </div>
        </div>

        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-1">
          <span className="text-[11px] text-zinc-500 uppercase font-semibold">Latitude</span>
          <div className="text-lg font-bold text-zinc-100 font-mono">
            {currentGps && currentGps.gpsFix ? currentGps.latitude.toFixed(6) : 'GPS NO FIX'}
          </div>
          <div className="text-xs text-zinc-400">Decimal degrees</div>
        </div>

        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-1">
          <span className="text-[11px] text-zinc-500 uppercase font-semibold">Longitude</span>
          <div className="text-lg font-bold text-zinc-100 font-mono">
            {currentGps && currentGps.gpsFix ? currentGps.longitude.toFixed(6) : 'GPS NO FIX'}
          </div>
          <div className="text-xs text-zinc-400">Decimal degrees</div>
        </div>

        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-1">
          <span className="text-[11px] text-zinc-500 uppercase font-semibold">Speed Telemetry</span>
          <div className="text-xl font-bold text-emerald-400 font-mono">
            {currentGps?.speedKmh !== undefined ? `${currentGps.speedKmh.toFixed(1)} km/h` : '0.0 km/h'}
          </div>
          <div className="text-xs text-zinc-400">
            {currentGps?.speedKmh && currentGps.speedKmh > 5 ? 'Vehicle Moving' : 'Vehicle Stationary / Idle'}
          </div>
        </div>
      </div>

      {/* Interactive Map Visualizer */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              LIVE LOCATION
            </span>
            <span className="text-zinc-600">•</span>
            <span className="flex items-center gap-1.5 text-xs text-rose-400 font-semibold">
              <AlertTriangle className="w-3.5 h-3.5" />
              THEFT LOCATIONS ({theftAlerts.length})
            </span>
            <span className="text-zinc-600">•</span>
            <span className="flex items-center gap-1.5 text-xs text-blue-400 font-semibold">
              <Compass className="w-3.5 h-3.5" />
              GEOFENCES ({geofences.length})
            </span>
          </div>

          <div className="text-xs font-mono text-zinc-400">
            {currentGps ? new Date(currentGps.timestamp).toLocaleTimeString() : 'N/A'}
          </div>
        </div>

        {/* Map Canvas / Visualizer */}
        <div className="h-96 w-full rounded-xl bg-zinc-950 border border-zinc-800 relative overflow-hidden flex items-center justify-center">
          {/* Subtle Grid Styling */}
          <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />

          {/* Compass Rose */}
          <div className="absolute top-4 right-4 p-2 bg-zinc-900/80 border border-zinc-800 rounded-lg text-zinc-400 text-[10px] font-mono flex flex-col items-center">
            <span className="text-emerald-400 font-bold">N</span>
            <Navigation className="w-4 h-4 text-zinc-500 my-0.5" />
            <span>S</span>
          </div>

          {currentGps && currentGps.gpsFix ? (
            <div className="relative z-10 flex flex-col items-center gap-3">
              {/* Geofence Overlay Circles */}
              <div className="absolute w-72 h-72 rounded-full border border-blue-500/30 bg-blue-500/5 animate-pulse pointer-events-none" />

              {/* Vehicle Location Marker */}
              <div className="relative flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-950 animate-bounce">
                  <MapPin className="w-6 h-6 fill-emerald-500 text-zinc-950" />
                </div>
                <div className="mt-2 px-3 py-1 bg-zinc-900/90 border border-zinc-700 rounded-lg text-xs font-semibold text-zinc-100 shadow-xl">
                  {selectedVehicle?.vehicleNumber || 'Vehicle'} • {currentGps.latitude.toFixed(4)}, {currentGps.longitude.toFixed(4)}
                </div>
              </div>

              {/* Tagged Theft Incidents */}
              {theftAlerts.length > 0 && (
                <div className="mt-4 p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-xs text-rose-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Theft tagged at: {theftAlerts[0].latitude?.toFixed(4)}, {theftAlerts[0].longitude?.toFixed(4)}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="relative z-10 text-center space-y-2">
              <Radio className="w-10 h-10 text-zinc-600 animate-pulse mx-auto" />
              <div className="text-xs font-semibold text-zinc-400">GPS UNAVAILABLE / GPS NO FIX</div>
              <div className="text-[11px] text-zinc-500 max-w-sm mx-auto">
                Ensure the NEO-6M GPS antenna has a clear line of sight to open sky.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
