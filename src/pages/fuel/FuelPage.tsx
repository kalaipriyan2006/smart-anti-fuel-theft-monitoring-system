import React, { useState, useEffect } from 'react';
import { useFleet } from '../../contexts/FleetContext.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { api } from '../../services/api.js';
import {
  Fuel,
  Download,
  Calendar,
  Activity,
  Sliders,
  TrendingDown,
  Clock,
  RefreshCw,
  Cpu
} from 'lucide-react';
import { FuelReading } from '../../types/index.js';

export const FuelPage: React.FC<{ onNavigateCalibration: () => void }> = ({ onNavigateCalibration }) => {
  const { selectedVehicle, selectedDevice, latestFuel, refreshFuelData } = useFleet();
  const [readings, setReadings] = useState<FuelReading[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d' | '30d'>('1h');

  useEffect(() => {
    const loadData = async () => {
      if (!selectedVehicle) {
        setReadings([]);
        setLoading(false);
        return;
      }
      try {
        const data = await api.getFuelReadings(selectedVehicle.id, 100);
        setReadings(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [selectedVehicle]);

  const handleExportCsv = () => {
    if (!selectedVehicle) return;
    window.open(`/api/export/fuel?vehicleId=${selectedVehicle.id}`, '_blank');
  };

  const currentReading = latestFuel || (readings.length > 0 ? readings[readings.length - 1] : null);
  const tankCap = selectedVehicle ? selectedVehicle.tankCapacityLiters : 0;

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <Fuel className="w-5 h-5 text-emerald-400" />
            Real-Time Fuel Telemetry & Consumption
          </h1>
          <p className="text-xs text-zinc-400">
            High-precision capacitive sensor readings calculated via multi-point calibration curves
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onNavigateCalibration}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-700 rounded-xl transition"
          >
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span>Calibrate Sensor</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-700 rounded-xl transition"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={refreshFuelData}
            className="p-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 rounded-xl border border-zinc-700 transition"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-1">
          <span className="text-[11px] text-zinc-500 uppercase font-semibold">Current Fuel</span>
          <div className="text-2xl font-bold text-zinc-100">
            {currentReading ? (
              `${currentReading.fuelLiters.toFixed(1)} L`
            ) : (
              <span className="text-sm text-zinc-500 font-normal">DATA UNAVAILABLE</span>
            )}
          </div>
          <div className="text-xs text-emerald-400 font-medium">
            {currentReading ? `${currentReading.fuelPercentage.toFixed(1)}% Capacity` : '---'}
          </div>
        </div>

        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-1">
          <span className="text-[11px] text-zinc-500 uppercase font-semibold">Tank Capacity</span>
          <div className="text-2xl font-bold text-zinc-100">{tankCap} L</div>
          <div className="text-xs text-zinc-400">Total volume</div>
        </div>

        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-1">
          <span className="text-[11px] text-zinc-500 uppercase font-semibold">Raw 12-Bit ADC</span>
          <div className="text-2xl font-bold text-zinc-100 font-mono">
            {currentReading ? currentReading.rawAdc : '0'}
          </div>
          <div className="text-xs text-zinc-400">GPIO34 (0-4095)</div>
        </div>

        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-1">
          <span className="text-[11px] text-zinc-500 uppercase font-semibold">Sensor Status</span>
          <div className="pt-1">
            <StatusBadge type="sensor" status={currentReading ? currentReading.sensorStatus : 'NORMAL'} />
          </div>
          <div className="text-[10px] text-zinc-500 mt-1 font-mono">
            {currentReading ? new Date(currentReading.timestamp).toLocaleTimeString() : 'No timestamp'}
          </div>
        </div>
      </div>

      {/* Chart Panel */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Fuel Telemetry Historical Chart
            </h3>
            <p className="text-xs text-zinc-400">
              Interpolated volume levels derived strictly from persistent database telemetry
            </p>
          </div>

          <div className="flex items-center gap-1 bg-zinc-850 p-1 rounded-xl border border-zinc-700 text-xs">
            {(['1h', '6h', '24h', '7d', '30d'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  timeRange === r ? 'bg-emerald-600 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {readings.length === 0 ? (
          <div className="h-72 flex flex-col items-center justify-center text-zinc-500 text-xs gap-2">
            <Activity className="w-8 h-8 text-zinc-600 animate-pulse" />
            <span>DATA UNAVAILABLE — No telemetry records registered for selected vehicle</span>
          </div>
        ) : (
          <div className="h-72 relative pt-4">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 600 220" preserveAspectRatio="none">
              <line x1="0" y1="40" x2="600" y2="40" stroke="#27272a" strokeDasharray="3 3" />
              <line x1="0" y1="110" x2="600" y2="110" stroke="#27272a" strokeDasharray="3 3" />
              <line x1="0" y1="180" x2="600" y2="180" stroke="#27272a" strokeDasharray="3 3" />

              {(() => {
                const maxLiters = selectedVehicle?.tankCapacityLiters || 450;
                const pts = readings.map((r, i) => {
                  const x = (i / (readings.length - 1 || 1)) * 600;
                  const y = 220 - (r.fuelLiters / maxLiters) * 200;
                  return `${x},${y}`;
                });
                return (
                  <>
                    <path
                      d={`M 0,220 L ${pts.join(' L ')} L 600,220 Z`}
                      fill="url(#fuelFillGrad)"
                      opacity="0.2"
                    />
                    <polyline fill="none" stroke="#10b981" strokeWidth="2.5" points={pts.join(' ')} />
                  </>
                );
              })()}

              <defs>
                <linearGradient id="fuelFillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        )}
      </div>

      {/* Raw Readings Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-zinc-100">Telemetry Ingestion Log</h3>
          <span className="text-xs text-zinc-500 font-mono">Total Packets: {readings.length}</span>
        </div>

        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-zinc-950/90 backdrop-blur border-b border-zinc-800 text-zinc-400 font-medium">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Raw ADC (GPIO34)</th>
                <th className="p-3">Fuel Volume</th>
                <th className="p-3">Percentage</th>
                <th className="p-3">Drop / Reduction</th>
                <th className="p-3">Sensor Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono text-zinc-300">
              {readings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-zinc-500 font-sans">
                    DATA UNAVAILABLE
                  </td>
                </tr>
              ) : (
                [...readings].reverse().map((r) => (
                  <tr key={r.id} className="hover:bg-zinc-850/50">
                    <td className="p-3 text-zinc-400">{new Date(r.timestamp).toLocaleTimeString()}</td>
                    <td className="p-3 font-bold text-zinc-200">{r.rawAdc}</td>
                    <td className="p-3 text-emerald-400 font-bold">{r.fuelLiters.toFixed(1)} L</td>
                    <td className="p-3">{r.fuelPercentage.toFixed(1)}%</td>
                    <td className="p-3">
                      {r.fuelReduction > 0 ? (
                        <span className="text-rose-400 font-bold">-{r.fuelReduction.toFixed(1)} L</span>
                      ) : (
                        <span className="text-zinc-500">0.0 L</span>
                      )}
                    </td>
                    <td className="p-3 font-sans">
                      <StatusBadge type="sensor" status={r.sensorStatus} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
