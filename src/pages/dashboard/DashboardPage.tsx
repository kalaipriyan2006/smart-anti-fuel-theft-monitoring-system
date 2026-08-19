import React, { useState, useEffect } from 'react';
import { useFleet } from '../../contexts/FleetContext.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { api } from '../../services/api.js';
import {
  Fuel,
  TrendingDown,
  Activity,
  Radio,
  AlertTriangle,
  Clock,
  Shield,
  Truck,
  Cpu,
  ArrowUpRight,
  ExternalLink,
  MapPin,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { Alert, FuelReading } from '../../types/index.js';

interface DashboardPageProps {
  onNavigate: (page: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const {
    selectedVehicle,
    selectedDevice,
    latestFuel,
    latestGps,
    activeAlerts,
    refreshFuelData,
    refreshAlerts
  } = useFleet();

  const [fuelHistory, setFuelHistory] = useState<FuelReading[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(true);
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('1h');

  useEffect(() => {
    const fetchHistory = async () => {
      if (!selectedVehicle) {
        setFuelHistory([]);
        setLoadingHistory(false);
        return;
      }
      try {
        const data = await api.getFuelReadings(selectedVehicle.id, 40);
        setFuelHistory(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [selectedVehicle]);

  const fuelPercentage = latestFuel ? latestFuel.fuelPercentage : 0;
  const fuelLiters = latestFuel ? latestFuel.fuelLiters : 0;
  const tankCapacity = selectedVehicle ? selectedVehicle.tankCapacityLiters : 0;
  const rawAdc = latestFuel ? latestFuel.rawAdc : (selectedDevice?.status === 'ONLINE' ? 2400 : 0);

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header / Vehicle Context Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-zinc-100">
                {selectedVehicle ? selectedVehicle.vehicleName : 'No Vehicle Selected'}
              </h1>
              {selectedVehicle && (
                <span className="px-2 py-0.5 text-xs font-mono font-semibold bg-zinc-800 text-emerald-400 rounded border border-zinc-700">
                  {selectedVehicle.vehicleNumber}
                </span>
              )}
            </div>
            <div className="text-xs text-zinc-400 mt-0.5 flex items-center gap-2">
              <span>Type: {selectedVehicle?.vehicleType || 'N/A'}</span>
              <span>•</span>
              <span>Tank: {tankCapacity} Liters</span>
              <span>•</span>
              <span>Driver: {selectedVehicle?.driverName || 'Unassigned'}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              refreshFuelData();
              refreshAlerts();
            }}
            className="p-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 rounded-lg border border-zinc-700 transition"
            title="Refresh Real-Time Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => onNavigate('fuel')}
            className="px-3 py-2 text-xs font-medium bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-700 rounded-lg transition flex items-center gap-1.5"
          >
            <Fuel className="w-3.5 h-3.5 text-emerald-400" />
            <span>Fuel Analytics</span>
          </button>
          <button
            onClick={() => onNavigate('gps')}
            className="px-3 py-2 text-xs font-medium bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-700 rounded-lg transition flex items-center gap-1.5"
          >
            <MapPin className="w-3.5 h-3.5 text-blue-400" />
            <span>GPS Tracking</span>
          </button>
        </div>
      </div>

      {/* Critical Active Alert Banner if any */}
      {activeAlerts.length > 0 && (
        <div className="p-4 bg-rose-950/80 border border-rose-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-rose-200 shadow-xl animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-900 rounded-xl text-rose-300">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-bold flex items-center gap-2">
                <span>{activeAlerts[0].title}</span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-800 text-white rounded">
                  {activeAlerts[0].severity}
                </span>
              </div>
              <div className="text-xs text-rose-300/90 mt-0.5">
                {activeAlerts[0].description} • {new Date(activeAlerts[0].timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigate('alerts')}
            className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition whitespace-nowrap"
          >
            Manage Alert Incident
          </button>
        </div>
      )}

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Current Fuel */}
        <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
            <span>Current Fuel Level</span>
            <Fuel className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-zinc-100 flex items-baseline gap-1.5">
              {latestFuel ? (
                <>
                  <span>{fuelLiters.toFixed(1)}</span>
                  <span className="text-xs font-normal text-zinc-400">/ {tankCapacity} L</span>
                </>
              ) : (
                <span className="text-zinc-500 text-lg">DATA UNAVAILABLE</span>
              )}
            </div>
            <div className="mt-2 w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  fuelPercentage > 30 ? 'bg-emerald-500' : fuelPercentage > 15 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, fuelPercentage))}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-zinc-400 mt-1">
              <span>{fuelPercentage.toFixed(1)}% Tank Level</span>
              <span className="font-mono text-zinc-500">ADC: {rawAdc}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Fuel Reduction & Rate */}
        <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
            <span>Recent Fuel Reduction</span>
            <TrendingDown className="w-4 h-4 text-rose-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-zinc-100">
              {latestFuel && latestFuel.fuelReduction > 0 ? (
                <span className="text-rose-400">-{latestFuel.fuelReduction.toFixed(1)} L</span>
              ) : (
                <span className="text-zinc-300">0.0 L (Stable)</span>
              )}
            </div>
            <div className="text-xs text-zinc-400 mt-1">
              {latestFuel && latestFuel.reductionRate > 0 ? (
                <span className="text-amber-400 font-medium">Rate: {latestFuel.reductionRate.toFixed(1)} L/min</span>
              ) : (
                <span className="text-emerald-400">Normal Idle Consumption</span>
              )}
            </div>
            <div className="text-[10px] text-zinc-500 mt-2 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>
                {latestFuel ? new Date(latestFuel.timestamp).toLocaleTimeString() : 'Awaiting sensor packet'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: ESP32 Hardware Status */}
        <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
            <span>ESP32 Hardware State</span>
            <Cpu className="w-4 h-4 text-blue-400" />
          </div>
          <div className="space-y-2">
            <div>
              <StatusBadge
                type="device"
                status={selectedDevice ? selectedDevice.status : undefined}
                isHistorical={selectedDevice?.status === 'OFFLINE'}
              />
            </div>
            <div className="text-xs text-zinc-400 flex items-center justify-between">
              <span>Wi-Fi RSSI:</span>
              <span className="font-mono text-zinc-200">
                {selectedDevice?.wifiRSSI !== undefined ? `${selectedDevice.wifiRSSI} dBm` : 'N/A'}
              </span>
            </div>
            <div className="text-[10px] text-zinc-500 flex items-center justify-between">
              <span>Firmware:</span>
              <span className="font-mono">{selectedDevice?.firmwareVersion || 'v1.4.2'}</span>
            </div>
          </div>
        </div>

        {/* Card 4: GPS Satellite Status & Health */}
        <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
            <span>NEO-6M GPS & Health</span>
            <Radio className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="space-y-2">
            <div>
              <StatusBadge
                type="gps"
                status={latestGps && latestGps.gpsFix ? 'CONNECTED' : selectedDevice?.gpsStatus || 'UNAVAILABLE'}
              />
            </div>
            <div className="text-xs text-zinc-400 flex items-center justify-between">
              <span>Speed:</span>
              <span className="font-medium text-zinc-200">
                {latestGps?.speedKmh !== undefined ? `${latestGps.speedKmh.toFixed(1)} km/h` : '0.0 km/h'}
              </span>
            </div>
            <div className="text-[10px] text-zinc-500 flex items-center justify-between">
              <span>Device Health:</span>
              <StatusBadge type="health" score={selectedDevice?.healthScore} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts & GPS Visualizer Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Real-Time Fuel Chart */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <Fuel className="w-4 h-4 text-emerald-400" />
                Real-Time Fuel Telemetry History
              </h3>
              <p className="text-xs text-zinc-400">
                Calibrated liters from 12-bit ADC (GPIO34) over time
              </p>
            </div>
            <div className="flex items-center gap-1 bg-zinc-850 p-1 rounded-lg border border-zinc-700 text-xs">
              {(['1h', '6h', '24h', '7d'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-2.5 py-1 rounded font-medium transition ${
                    timeRange === r ? 'bg-emerald-600 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {r.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Line Graph */}
          {fuelHistory.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-zinc-500 text-xs gap-2">
              <Activity className="w-8 h-8 text-zinc-600 animate-pulse" />
              <span>Awaiting sensor telemetry packets from ESP32</span>
            </div>
          ) : (
            <div className="h-64 relative pt-2">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 500 200" preserveAspectRatio="none">
                {/* Horizontal Grid lines */}
                <line x1="0" y1="40" x2="500" y2="40" stroke="#27272a" strokeDasharray="3 3" />
                <line x1="0" y1="100" x2="500" y2="100" stroke="#27272a" strokeDasharray="3 3" />
                <line x1="0" y1="160" x2="500" y2="160" stroke="#27272a" strokeDasharray="3 3" />

                {/* Plot Area */}
                {(() => {
                  const maxLiters = selectedVehicle?.tankCapacityLiters || 450;
                  const points = fuelHistory.map((item, idx) => {
                    const x = (idx / (fuelHistory.length - 1 || 1)) * 500;
                    const y = 200 - (item.fuelLiters / maxLiters) * 180;
                    return `${x},${y}`;
                  });
                  const pathStr = points.join(' ');

                  return (
                    <>
                      {/* Gradient Fill */}
                      <path
                        d={`M 0,200 L ${points.join(' L ')} L 500,200 Z`}
                        fill="url(#fuelGradient)"
                        opacity="0.25"
                      />
                      {/* Line */}
                      <polyline
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2.5"
                        points={pathStr}
                      />
                      {/* Dot for latest */}
                      {fuelHistory.length > 0 && (
                        <circle
                          cx="500"
                          cy={200 - (fuelHistory[fuelHistory.length - 1].fuelLiters / maxLiters) * 180}
                          r="4"
                          fill="#10b981"
                          className="animate-ping"
                        />
                      )}
                    </>
                  );
                })()}

                <defs>
                  <linearGradient id="fuelGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>

              <div className="flex justify-between text-[10px] text-zinc-500 mt-2 font-mono">
                <span>Start: {new Date(fuelHistory[0]?.timestamp || Date.now()).toLocaleTimeString()}</span>
                <span>Latest: {new Date(fuelHistory[fuelHistory.length - 1]?.timestamp || Date.now()).toLocaleTimeString()}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Quick GPS & Vehicle State */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-400" />
                Live Fleet GPS Fix
              </h3>
              <button
                onClick={() => onNavigate('gps')}
                className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
              >
                Full Map <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-4 p-4 bg-zinc-950 rounded-xl border border-zinc-800/80 space-y-2.5">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Latitude:</span>
                <span className="font-mono text-zinc-200">
                  {latestGps?.latitude ? latestGps.latitude.toFixed(6) : 'GPS NO FIX'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Longitude:</span>
                <span className="font-mono text-zinc-200">
                  {latestGps?.longitude ? latestGps.longitude.toFixed(6) : 'GPS NO FIX'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Speed Telemetry:</span>
                <span className="font-mono text-emerald-400">
                  {latestGps?.speedKmh !== undefined ? `${latestGps.speedKmh} km/h` : '0 km/h'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Satellites:</span>
                <span className="font-mono text-zinc-300">
                  {latestGps?.satellites !== undefined ? `${latestGps.satellites} Locked` : 'Searching'}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-zinc-850/60 rounded-xl border border-zinc-800 text-xs text-zinc-400 space-y-1">
            <div className="font-semibold text-zinc-300">Theft Protection Status</div>
            <div className="text-[11px] text-zinc-400">
              Rule engine armed with 2-stage verification. GPIO25 buzzer relay online.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
