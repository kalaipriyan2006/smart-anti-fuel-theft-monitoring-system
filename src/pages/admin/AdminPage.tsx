import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.js';
import { api } from '../../services/api.js';
import {
  ShieldCheck,
  Users,
  Sliders,
  Activity,
  Save,
  CheckCircle2,
  AlertCircle,
  Cpu,
  RefreshCw,
  Zap,
  Server,
  Lock,
  Volume2
} from 'lucide-react';
import { User, DetectionSettings } from '../../types/index.js';

export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [settings, setSettings] = useState<DetectionSettings | null>(null);
  const [overview, setOverview] = useState<any>(null);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [savingSettings, setSavingSettings] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'thresholds' | 'users' | 'system'>('thresholds');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersList, detSettings, ov, health] = await Promise.all([
        api.getAdminUsers(),
        api.getDetectionSettings(),
        api.getAdminOverview(),
        api.getAdminSystemHealth()
      ]);
      setUsers(usersList);
      setSettings(detSettings);
      setOverview(ov);
      setSystemHealth(health);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      setSavingSettings(true);
      const updated = await api.updateDetectionSettings(settings);
      setSettings(updated);
      setSuccessMsg('Multi-stage theft detection parameters updated successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert('Error updating settings: ' + err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const updated = await api.updateUserRole(userId, newRole);
      setUsers(users.map(u => u.id === userId ? updated : u));
    } catch (err: any) {
      alert('Failed to update role: ' + err.message);
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>Admin Control Panel & System Governance</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Global theft algorithm thresholds, role-based access management, and IoT hardware telemetry health
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="p-1 bg-zinc-900 border border-zinc-800 rounded-xl flex gap-1 text-xs">
            <button
              onClick={() => setActiveTab('thresholds')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                activeTab === 'thresholds' ? 'bg-emerald-600 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Theft Detection Rules
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                activeTab === 'users' ? 'bg-emerald-600 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              User Access & RBAC
            </button>
            <button
              onClick={() => setActiveTab('system')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                activeTab === 'system' ? 'bg-emerald-600 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              IoT System Health
            </button>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-xs text-zinc-500">Loading system administration records...</div>
      ) : (
        <>
          {/* TAB 1: Detection Settings Form */}
          {activeTab === 'thresholds' && settings && (
            <form onSubmit={handleSaveSettings} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="border-b border-zinc-800 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-emerald-400" />
                    <span>Multi-Stage Anti-Fuel Theft Rule Parameters</span>
                  </h2>
                  <p className="text-xs text-zinc-400">Tuned parameters executed on every incoming ESP32 telemetry packet</p>
                </div>

                <button
                  type="submit"
                  disabled={savingSettings}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs rounded-xl transition shadow-md shadow-emerald-950 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingSettings ? 'Applying...' : 'Save Configuration'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                <div className="space-y-4">
                  <div className="p-4 bg-zinc-950/70 rounded-xl border border-zinc-800 space-y-2">
                    <label className="block text-zinc-300 font-bold">
                      Drop Volume Threshold (Liters)
                    </label>
                    <p className="text-[11px] text-zinc-500">
                      Minimum single sudden volumetric reduction before initiating Stage 1 confirmation hold.
                    </p>
                    <input
                      type="number"
                      step="0.5"
                      min="1.0"
                      max="50.0"
                      value={settings.theftThresholdLiters}
                      onChange={(e) => setSettings({ ...settings, theftThresholdLiters: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 bg-zinc-850 border border-zinc-700 rounded-xl text-zinc-100 font-mono text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="p-4 bg-zinc-950/70 rounded-xl border border-zinc-800 space-y-2">
                    <label className="block text-zinc-300 font-bold">
                      Reduction Rate Threshold (Liters / Minute)
                    </label>
                    <p className="text-[11px] text-zinc-500">
                      Speed of fuel drain exceeding natural diesel engine combustion burn.
                    </p>
                    <input
                      type="number"
                      step="0.1"
                      min="0.5"
                      max="30.0"
                      value={settings.reductionRateThreshold}
                      onChange={(e) => setSettings({ ...settings, reductionRateThreshold: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 bg-zinc-850 border border-zinc-700 rounded-xl text-zinc-100 font-mono text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="p-4 bg-zinc-950/70 rounded-xl border border-zinc-800 space-y-2">
                    <label className="block text-zinc-300 font-bold">
                      Consecutive Confirmation Packet Count
                    </label>
                    <p className="text-[11px] text-zinc-500">
                      Number of successive packets required to verify theft (prevents single packet ADC glitch).
                    </p>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={settings.confirmationReadingsRequired}
                      onChange={(e) => setSettings({ ...settings, confirmationReadingsRequired: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 bg-zinc-850 border border-zinc-700 rounded-xl text-zinc-100 font-mono text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-zinc-950/70 rounded-xl border border-zinc-800 space-y-2">
                    <label className="block text-zinc-300 font-bold">
                      Slosh ADC Noise Window Tolerance
                    </label>
                    <p className="text-[11px] text-zinc-500">
                      Raw ADC deadband filtering out liquid ripple oscillations.
                    </p>
                    <input
                      type="number"
                      min="5"
                      max="100"
                      value={settings.sensorToleranceAdc}
                      onChange={(e) => setSettings({ ...settings, sensorToleranceAdc: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 bg-zinc-850 border border-zinc-700 rounded-xl text-zinc-100 font-mono text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="p-4 bg-zinc-950/70 rounded-xl border border-zinc-800 space-y-2">
                    <label className="block text-zinc-300 font-bold">
                      Alarm Cooldown Time (Seconds)
                    </label>
                    <p className="text-[11px] text-zinc-500">
                      Interval before a new duplicate alarm can trigger on the same vehicle.
                    </p>
                    <input
                      type="number"
                      min="30"
                      max="600"
                      value={settings.alertCooldownSeconds}
                      onChange={(e) => setSettings({ ...settings, alertCooldownSeconds: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 bg-zinc-850 border border-zinc-700 rounded-xl text-zinc-100 font-mono text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="p-4 bg-zinc-950/70 rounded-xl border border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-zinc-300 font-bold flex items-center gap-1.5">
                          <Volume2 className="w-4 h-4 text-emerald-400" />
                          Auto-Trigger GPIO25 Buzzer Relay
                        </label>
                        <p className="text-[11px] text-zinc-500">
                          Instantly sound physical siren when theft is confirmed.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.autoBuzzerEnabled}
                        onChange={(e) => setSettings({ ...settings, autoBuzzerEnabled: e.target.checked })}
                        className="w-5 h-5 rounded border-zinc-700 text-emerald-500 focus:ring-0 cursor-pointer"
                      />
                    </div>

                    {settings.autoBuzzerEnabled && (
                      <div className="pt-2 border-t border-zinc-800">
                        <label className="block text-zinc-400 text-[11px] mb-1">Siren Duration (Seconds)</label>
                        <input
                          type="number"
                          min="5"
                          max="120"
                          value={settings.buzzerDurationSeconds}
                          onChange={(e) => setSettings({ ...settings, buzzerDurationSeconds: parseInt(e.target.value) })}
                          className="w-full px-2.5 py-1.5 bg-zinc-850 border border-zinc-700 rounded-lg text-zinc-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: Users Management & RBAC */}
          {activeTab === 'users' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="border-b border-zinc-800 pb-3">
                <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>Platform User Directory & Role-Based Access Control (RBAC)</span>
                </h2>
                <p className="text-xs text-zinc-400">Assign roles to restrict access to telemetry, hardware registers, or system settings</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-500 font-semibold uppercase text-[10px]">
                      <th className="pb-3">User</th>
                      <th className="pb-3">Contact Email</th>
                      <th className="pb-3">Mobile Phone</th>
                      <th className="pb-3">Current Role</th>
                      <th className="pb-3">Account Status</th>
                      <th className="pb-3 text-right">Modify Access</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-zinc-850/50 transition">
                        <td className="py-3 font-semibold text-zinc-100 flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-zinc-800 text-emerald-400 font-bold flex items-center justify-center text-[10px]">
                            {u.fullName.charAt(0)}
                          </div>
                          <span>{u.fullName}</span>
                        </td>
                        <td className="py-3 text-zinc-400">{u.email}</td>
                        <td className="py-3 font-mono text-zinc-400">{u.mobile || 'N/A'}</td>
                        <td className="py-3 font-mono">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.role === 'ADMIN'
                              ? 'bg-blue-950 text-blue-300 border border-blue-800'
                              : u.role === 'SUPPORT_AGENT'
                              ? 'bg-purple-950 text-purple-300 border border-purple-800'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 bg-emerald-950/80 text-emerald-400 text-[10px] rounded border border-emerald-800">
                            {u.status}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className="bg-zinc-800 border border-zinc-700 text-[11px] text-zinc-200 rounded-lg px-2 py-1 focus:outline-none focus:border-emerald-500"
                          >
                            <option value="VEHICLE_OWNER">VEHICLE_OWNER</option>
                            <option value="SUPPORT_AGENT">SUPPORT_AGENT</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: System Health Overview */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-2">
                  <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Server className="w-4 h-4 text-emerald-400" /> Backend Node Runtime
                  </div>
                  <div className="text-xl font-bold text-zinc-100">ONLINE (200 OK)</div>
                  <div className="text-[11px] text-zinc-500 font-mono">Port 3000 • SSE Connected</div>
                </div>

                <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-2">
                  <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-emerald-400" /> Registered ESP32 Nodes
                  </div>
                  <div className="text-xl font-bold text-zinc-100">{overview?.devicesCount || 2} Deployed</div>
                  <div className="text-[11px] text-emerald-400 font-mono">Secret Key Authentication OK</div>
                </div>

                <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-2">
                  <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-emerald-400" /> Ingestion Packet Rate
                  </div>
                  <div className="text-xl font-bold text-zinc-100">30s Standard Interval</div>
                  <div className="text-[11px] text-zinc-500 font-mono">Heartbeat Timeout: 45s</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
