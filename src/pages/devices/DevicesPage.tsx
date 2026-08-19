import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useFleet } from '../../contexts/FleetContext.js';
import { useAuth } from '../../contexts/AuthContext.js';
import { api } from '../../services/api.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { DeviceTesterModal } from '../../components/common/DeviceTesterModal.js';
import { HardwareDiagnosticModal } from '../../components/ai/HardwareDiagnosticModal.js';
import {
  Cpu,
  Plus,
  Key,
  Download,
  Wifi,
  Radio,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Terminal,
  X,
  RefreshCw,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { ESP32Device } from '../../types/index.js';

export const DevicesPage: React.FC = () => {
  const { devices, vehicles, refreshFleetData } = useFleet();
  const { user } = useAuth();

  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);
  const [isTesterOpen, setIsTesterOpen] = useState<boolean>(false);
  const [selectedDiagnosticDevice, setSelectedDiagnosticDevice] = useState<ESP32Device | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  const [deviceId, setDeviceId] = useState<string>('ESP32-FT-');
  const [name, setName] = useState<string>('');
  const [vehicleId, setVehicleId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!deviceId || !name) {
      setError('Please provide a unique Device ID and name');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.registerDevice({
        deviceId,
        name,
        userId: user.id,
        vehicleId: vehicleId || undefined
      });
      await refreshFleetData();
      setIsRegisterModalOpen(false);
      setDeviceId('ESP32-FT-');
      setName('');
      setVehicleId('');
    } catch (err: any) {
      setError(err.message || 'Failed to register ESP32 device');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyKey = (key: string, id: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleDownloadFirmware = (device: ESP32Device) => {
    window.open(`/api/devices/${device.id}/firmware-code`, '_blank');
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-400" />
            ESP32 Device Management & Provisioning
          </h1>
          <p className="text-xs text-zinc-400">
            Provision authenticated ESP32 hardware units, manage secret API keys, and download custom Arduino firmware
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsTesterOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-700 rounded-xl transition"
          >
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>Hardware Test Terminal</span>
          </button>
          <button
            onClick={() => {
              setDeviceId(`ESP32-FT-${Math.floor(10000 + Math.random() * 90000)}`);
              setIsRegisterModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-zinc-950 rounded-xl transition shadow-md shadow-emerald-950"
          >
            <Plus className="w-4 h-4" />
            <span>Register ESP32 Unit</span>
          </button>
        </div>
      </div>

      {/* Devices List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {devices.length === 0 ? (
          <div className="col-span-full p-12 bg-zinc-900 border border-zinc-800 rounded-2xl text-center text-zinc-500 text-xs">
            No ESP32 microcontrollers registered. Click "Register ESP32 Unit" to provision hardware.
          </div>
        ) : (
          devices.map((dev) => {
            const linkedVeh = vehicles.find((v) => v.id === dev.vehicleId || v.deviceId === dev.id);

            return (
              <div
                key={dev.id}
                className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4 shadow-lg hover:border-zinc-700 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-emerald-400">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-zinc-100">{dev.name}</h3>
                        <span className="font-mono text-xs text-emerald-400 font-semibold px-2 py-0.5 bg-zinc-950 rounded border border-zinc-800">
                          {dev.id}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400 mt-0.5">
                        Vehicle:{' '}
                        <span className="text-zinc-200 font-medium">
                          {linkedVeh ? `${linkedVeh.vehicleNumber} (${linkedVeh.vehicleName})` : 'Unassigned'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <StatusBadge type="device" status={dev.status} isHistorical={dev.status === 'OFFLINE'} />
                </div>

                {/* Secret Key Field */}
                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-amber-400" />
                      Hardware Authentication Token (X-ESP32-Secret-Key)
                    </span>
                    <button
                      onClick={() => handleCopyKey(dev.secretKey, dev.id)}
                      className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      {copiedKeyId === dev.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Copy Key
                        </>
                      )}
                    </button>
                  </div>
                  <div className="font-mono text-xs text-zinc-300 truncate bg-zinc-900 px-2.5 py-1.5 rounded border border-zinc-800">
                    {dev.secretKey}
                  </div>
                </div>

                {/* Telemetry Matrix */}
                <div className="grid grid-cols-3 gap-2 text-xs bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase">Wi-Fi RSSI</span>
                    <span className="font-mono text-zinc-200">
                      {dev.wifiRSSI !== undefined ? `${dev.wifiRSSI} dBm` : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase">GPS Fix</span>
                    <span className="text-zinc-200">{dev.gpsStatus}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase">Health Score</span>
                    <span className="font-bold text-emerald-400">{dev.healthScore || 50}%</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                  <div className="text-[11px] text-zinc-500 font-mono">
                    Last Heartbeat:{' '}
                    {dev.lastHeartbeat ? new Date(dev.lastHeartbeat).toLocaleTimeString() : 'Never'}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedDiagnosticDevice(dev)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/80 rounded-lg transition"
                      title="Run Gemini Microcontroller AI Diagnostics"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>AI Diagnostics</span>
                    </button>
                    <button
                      onClick={() => handleDownloadFirmware(dev)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-zinc-800 hover:bg-zinc-750 text-emerald-400 border border-zinc-700 rounded-lg transition"
                      title="Download C++ Arduino Source Code (.ino)"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Firmware (.ino)</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Provisioning Modal */}
      {isRegisterModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/85 backdrop-blur-md p-4 flex min-h-screen items-center justify-center">
          <div className="relative bg-zinc-900 border border-zinc-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 my-auto max-h-[85vh] overflow-y-auto modal-scrollbar animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-zinc-100">Provision ESP32 Microcontroller</h3>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-950/50 border border-rose-800 text-xs text-rose-300 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Unique Hardware Device ID</label>
                <input
                  type="text"
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value.toUpperCase())}
                  placeholder="e.g. ESP32-FT-84920"
                  required
                  className="w-full px-3 py-2 bg-zinc-850 border border-zinc-700 rounded-xl text-sm text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Device Friendly Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Volvo FH16 Main Fuel ESP32"
                  required
                  className="w-full px-3 py-2 bg-zinc-850 border border-zinc-700 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Assign to Fleet Vehicle (Optional)</label>
                <select
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-850 border border-zinc-700 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Assign Later --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vehicleNumber} ({v.vehicleName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
                <div className="font-semibold text-zinc-300 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Cryptographic Key Generation
                </div>
                <div>
                  Registering generates a unique 256-bit token. The token must be compiled into the ESP32 C++ firmware.
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-800 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-zinc-950 rounded-xl transition disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Provisioning...' : 'Provision Device'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      <DeviceTesterModal isOpen={isTesterOpen} onClose={() => setIsTesterOpen(false)} />
      <HardwareDiagnosticModal
        isOpen={!!selectedDiagnosticDevice}
        onClose={() => setSelectedDiagnosticDevice(null)}
        device={selectedDiagnosticDevice}
      />
    </div>
  );
};
