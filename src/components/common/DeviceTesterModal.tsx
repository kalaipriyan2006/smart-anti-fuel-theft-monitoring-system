import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFleet } from '../../contexts/FleetContext.js';
import { api } from '../../services/api.js';
import { Terminal, Send, CheckCircle2, AlertTriangle, Shield, Cpu, RefreshCw, X, Sliders, Radio, Activity, ChevronDown, ChevronUp } from 'lucide-react';

interface DeviceTesterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeviceTesterModal: React.FC<DeviceTesterModalProps> = ({ isOpen, onClose }) => {
  const { selectedDevice, selectedVehicle, refreshFuelData, refreshAlerts } = useFleet();
  const [adcValue, setAdcValue] = useState<number>(2400);
  const [lat, setLat] = useState<number>(37.7749);
  const [lng, setLng] = useState<number>(-122.4194);
  const [speed, setSpeed] = useState<number>(0);
  const [satellites, setSatellites] = useState<number>(8);
  const [gpsFix, setGpsFix] = useState<boolean>(true);
  const [rssi, setRssi] = useState<number>(-65);
  const [sensorStatus, setSensorStatus] = useState<string>('NORMAL');
  const [loading, setLoading] = useState<boolean>(false);
  const [responseLog, setResponseLog] = useState<any>(null);
  const [errorLog, setErrorLog] = useState<string | null>(null);
  const [showJsonRaw, setShowJsonRaw] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'telemetry' | 'theft' | 'logs'>('telemetry');

  if (!isOpen) return null;

  const handleSendPacket = async () => {
    if (!selectedDevice) {
      setErrorLog('No ESP32 device selected or linked.');
      return;
    }

    setLoading(true);
    setErrorLog(null);
    try {
      const res = await api.sendDevicePacket({
        deviceId: selectedDevice.id,
        secretKey: selectedDevice.secretKey,
        rawAdc: Number(adcValue),
        wifiRSSI: Number(rssi),
        firmwareVersion: selectedDevice.firmwareVersion,
        sensorStatus,
        gps: {
          latitude: Number(lat),
          longitude: Number(lng),
          speedKmh: Number(speed),
          satellites: Number(satellites),
          gpsFix: Boolean(gpsFix)
        }
      });
      setResponseLog(res);
      setActiveTab('logs');
      await refreshFuelData();
      await refreshAlerts();
    } catch (err: any) {
      setErrorLog(err.message || 'Failed to dispatch device packet');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateFuelDrop = async (dropLiters: number) => {
    const dropAdc = Math.round(dropLiters * 7.5);
    const newAdc = Math.max(200, adcValue - dropAdc);
    setAdcValue(newAdc);

    if (!selectedDevice) {
      setErrorLog('Please select a device first to test theft triggers.');
      return;
    }
    setLoading(true);
    setErrorLog(null);
    try {
      const res = await api.sendDevicePacket({
        deviceId: selectedDevice.id,
        secretKey: selectedDevice.secretKey,
        rawAdc: newAdc,
        wifiRSSI: Number(rssi),
        firmwareVersion: selectedDevice.firmwareVersion,
        sensorStatus: 'NORMAL',
        gps: {
          latitude: Number(lat),
          longitude: Number(lng),
          speedKmh: 0,
          satellites: 9,
          gpsFix: true
        }
      });
      setResponseLog(res);
      setActiveTab('logs');
      await refreshFuelData();
      await refreshAlerts();
    } catch (err: any) {
      setErrorLog(err.message);
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/85 backdrop-blur-md p-3 sm:p-6 flex min-h-screen items-center justify-center">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] my-auto animate-in fade-in zoom-in-95">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-zinc-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-zinc-100 flex items-center gap-2">
                ESP32 Ingestion & Testing Suite
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                  HTTP REST
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-zinc-400">Dispatch physical IoT sensor telemetry to the live processing engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Device & Protocol Bar */}
        <div className="px-5 py-2 bg-zinc-950 border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 text-[11px]">Target Device:</span>
            <span className="font-mono font-medium text-emerald-400 px-2 py-0.5 bg-emerald-950/50 border border-emerald-800/60 rounded-md text-[11px]">
              {selectedDevice ? selectedDevice.id : 'No Device Selected'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 text-[11px]">Vehicle:</span>
            <span className="font-medium text-zinc-200 text-[11px]">
              {selectedVehicle ? selectedVehicle.vehicleNumber : 'Unassigned'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-blue-400 font-mono text-[11px]">
            <Radio className="w-3 h-3" />
            POST /api/device/packet
          </div>
        </div>

        {/* View Mode Navigation Tabs */}
        <div className="flex border-b border-zinc-800 px-5 bg-zinc-900/60 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('telemetry')}
            className={`flex items-center gap-1.5 py-2 px-3 text-xs font-medium border-b-2 transition cursor-pointer ${
              activeTab === 'telemetry'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Sensor & GPS Telemetry
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('theft')}
            className={`flex items-center gap-1.5 py-2 px-3 text-xs font-medium border-b-2 transition cursor-pointer ${
              activeTab === 'theft'
                ? 'border-rose-500 text-rose-400 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Theft Rule Simulator
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-1.5 py-2 px-3 text-xs font-medium border-b-2 transition cursor-pointer ${
              activeTab === 'logs'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Pipeline Response
            {responseLog && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
        </div>

        {/* Modal Body with Custom Scroll */}
        <div className="overflow-y-auto modal-scrollbar flex-1 min-h-0 p-4 sm:p-5 space-y-4">
          
          {/* TAB 1: Sensor & GPS Telemetry */}
          {activeTab === 'telemetry' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Fuel Sensor ADC */}
                <div className="space-y-1.5 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-zinc-200">Fuel Level ADC (0 - 4095)</label>
                    <span className="text-[11px] font-mono text-emerald-400 font-semibold">{adcValue}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={4095}
                    step={10}
                    value={adcValue}
                    onChange={(e) => setAdcValue(Number(e.target.value))}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setAdcValue(3850)}
                      className="flex-1 py-1 text-[11px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded border border-zinc-700 transition"
                    >
                      Full (3850)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdcValue(2000)}
                      className="flex-1 py-1 text-[11px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded border border-zinc-700 transition"
                    >
                      Half (2000)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdcValue(400)}
                      className="flex-1 py-1 text-[11px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded border border-zinc-700 transition"
                    >
                      Empty (400)
                    </button>
                  </div>
                </div>

                {/* Wi-Fi RSSI */}
                <div className="space-y-1.5 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-zinc-200">Wi-Fi RSSI (dBm)</label>
                    <span className="text-[11px] font-mono text-zinc-300">{rssi} dBm</span>
                  </div>
                  <input
                    type="number"
                    value={rssi}
                    onChange={(e) => setRssi(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-100 font-mono focus:border-emerald-500 focus:outline-none"
                  />
                  <div className="text-[11px] text-zinc-400 flex items-center justify-between pt-0.5">
                    <span>Signal Quality:</span>
                    <span className={rssi > -70 ? 'text-emerald-400 font-medium' : rssi > -85 ? 'text-amber-400' : 'text-rose-400'}>
                      {rssi > -70 ? 'Excellent (-65 dBm)' : rssi > -85 ? 'Fair' : 'Weak'}
                    </span>
                  </div>
                </div>

                {/* GPS Coordinates */}
                <div className="space-y-1.5 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80">
                  <label className="text-xs font-medium text-zinc-200">GPS Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={lat}
                    onChange={(e) => setLat(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-100 font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80">
                  <label className="text-xs font-medium text-zinc-200">GPS Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={lng}
                    onChange={(e) => setLng(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-100 font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Speed & Sensor Status */}
                <div className="space-y-1.5 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80">
                  <label className="text-xs font-medium text-zinc-200">Vehicle Speed (km/h)</label>
                  <input
                    type="number"
                    min={0}
                    max={180}
                    value={speed}
                    onChange={(e) => setSpeed(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-100 font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80">
                  <label className="text-xs font-medium text-zinc-200">Sensor Operational State</label>
                  <select
                    value={sensorStatus}
                    onChange={(e) => setSensorStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="NORMAL">NORMAL (Operational)</option>
                    <option value="ERROR">ERROR (Broken wire / Sensor Fault)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Theft Rule Simulator */}
          {activeTab === 'theft' && (
            <div className="space-y-4">
              <div className="p-4 bg-rose-950/20 border border-rose-800/50 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-rose-400">
                  <AlertTriangle className="w-5 h-5" />
                  <h4 className="text-sm font-semibold">Multi-Stage Theft Rule Engine Verification</h4>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Test the server's slope-detection algorithm. The rule engine validates rapid negative drops while parked (Speed = 0 km/h) across two consecutive sensor packets to prevent false alarms, activating the GPIO25 buzzer command.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => handleSimulateFuelDrop(6)}
                    disabled={loading || !selectedDevice}
                    className="p-3 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 rounded-xl text-left transition disabled:opacity-50"
                  >
                    <div className="text-xs font-semibold text-amber-300">⚡ Trigger 6-Liter Sudden Drop</div>
                    <div className="text-[11px] text-zinc-400 mt-1">Simulates quick fuel siphon attempt</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSimulateFuelDrop(25)}
                    disabled={loading || !selectedDevice}
                    className="p-3 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 rounded-xl text-left transition disabled:opacity-50"
                  >
                    <div className="text-xs font-semibold text-rose-300">🚨 Trigger 25-Liter Major Theft</div>
                    <div className="text-[11px] text-zinc-400 mt-1">Triggers immediate high-priority alarm & buzzer</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Pipeline Ingestion Logs */}
          {activeTab === 'logs' && (
            <div className="space-y-3">
              {responseLog ? (
                <div className="space-y-3">
                  {/* Summary Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg">
                      <span className="text-zinc-500 block text-[10px]">Calculated Fuel</span>
                      <span className="text-emerald-400 font-semibold font-mono text-sm">
                        {responseLog.fuelLevelLiters?.toFixed(1)} L ({responseLog.fuelPercentage?.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg">
                      <span className="text-zinc-500 block text-[10px]">Theft Slope</span>
                      <span className={`font-semibold font-mono text-sm ${responseLog.slopeRatePerMin < -1 ? 'text-rose-400' : 'text-zinc-200'}`}>
                        {responseLog.slopeRatePerMin?.toFixed(2)} L/min
                      </span>
                    </div>
                    <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg">
                      <span className="text-zinc-500 block text-[10px]">Theft Confirmed</span>
                      <span className={`font-semibold text-sm ${responseLog.theftConfirmed ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {responseLog.theftConfirmed ? 'YES (CRITICAL)' : 'NO (SECURE)'}
                      </span>
                    </div>
                    <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg">
                      <span className="text-zinc-500 block text-[10px]">GPIO25 Siren Command</span>
                      <span className={`font-semibold text-sm ${responseLog.buzzerCommand ? 'text-rose-400 animate-pulse' : 'text-zinc-400'}`}>
                        {responseLog.buzzerCommand ? 'ACTIVE (ON)' : 'OFF'}
                      </span>
                    </div>
                  </div>

                  {/* Expandable Raw JSON */}
                  <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950">
                    <button
                      type="button"
                      onClick={() => setShowJsonRaw(!showJsonRaw)}
                      className="w-full px-3 py-2 bg-zinc-900/80 hover:bg-zinc-850 text-xs text-zinc-300 flex items-center justify-between transition"
                    >
                      <span className="font-mono text-[11px] text-zinc-400">Raw JSON Ingestion Payload</span>
                      <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                        {showJsonRaw ? 'Collapse' : 'Expand'}
                        {showJsonRaw ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </span>
                    </button>
                    {showJsonRaw && (
                      <pre className="p-3 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-48 modal-scrollbar">
                        {JSON.stringify(responseLog, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-zinc-950/40 border border-zinc-800/80 rounded-xl">
                  <Activity className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                  <p className="text-xs text-zinc-400">No packet dispatched yet in this session.</p>
                  <p className="text-[11px] text-zinc-500 mt-1">Switch to Telemetry or Theft tab and click "Send Telemetry Packet".</p>
                </div>
              )}
            </div>
          )}

          {errorLog && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorLog}</span>
            </div>
          )}
        </div>

        {/* Modal Footer Bar */}
        <div className="border-t border-zinc-800 px-5 py-3.5 bg-zinc-900/90 flex items-center justify-between gap-3">
          <div className="text-[11px] text-zinc-400 hidden sm:block">
            Hardware Endpoint: <code className="text-emerald-400 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800">/api/device/packet</code>
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl transition border border-zinc-700/60"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSendPacket}
              disabled={loading || !selectedDevice}
              className="flex items-center justify-center gap-2 px-5 py-2 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-xl transition disabled:opacity-50 shadow-lg shadow-emerald-950/50"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Send Telemetry Packet
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};
