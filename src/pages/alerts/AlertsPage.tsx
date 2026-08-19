import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFleet } from '../../contexts/FleetContext.js';
import { useAuth } from '../../contexts/AuthContext.js';
import { api } from '../../services/api.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { TheftForensicModal } from '../../components/ai/TheftForensicModal.js';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Shield,
  Filter,
  Check,
  X,
  MapPin,
  FileText,
  Sparkles
} from 'lucide-react';
import { Alert } from '../../types/index.js';

export const AlertsPage: React.FC = () => {
  const { vehicles, selectedVehicleId, refreshAlerts } = useFleet();
  const { user } = useAuth();

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [forensicAlert, setForensicAlert] = useState<Alert | null>(null);
  const [resolvingAlert, setResolvingAlert] = useState<Alert | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const data = await api.getAlerts(selectedVehicleId || undefined);
      setAlerts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [selectedVehicleId]);

  const handleAcknowledge = async (alertId: string) => {
    if (!user) return;
    try {
      await api.acknowledgeAlert(alertId, { userId: user.id, userName: user.fullName });
      await fetchAlerts();
      await refreshAlerts();
    } catch (err: any) {
      alert(err.message || 'Failed to acknowledge alert');
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingAlert || !user) return;

    setActionLoading(true);
    try {
      await api.resolveAlert(resolvingAlert.id, { userId: user.id, userName: user.fullName, notes: resolutionNotes });
      setResolvingAlert(null);
      setResolutionNotes('');
      await fetchAlerts();
      await refreshAlerts();
    } catch (err: any) {
      alert(err.message || 'Failed to resolve alert');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            Security Alerts & Anomaly Center
          </h1>
          <p className="text-xs text-zinc-400">
            Real-time rule engine alerts triggered by sudden drops, disconnection, or geofence breaches
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="WARNING">Warnings</option>
            <option value="INFO">Informational</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active (Unresolved)</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="p-12 bg-zinc-900 border border-zinc-800 rounded-2xl text-center text-zinc-500 text-xs">
            No alerts found matching the current filter criteria.
          </div>
        ) : (
          filteredAlerts.map((alt) => {
            const veh = vehicles.find((v) => v.id === alt.vehicleId);

            return (
              <div
                key={alt.id}
                className={`p-5 bg-zinc-900 border rounded-2xl space-y-3 transition ${
                  alt.status === 'ACTIVE'
                    ? alt.severity === 'CRITICAL'
                      ? 'border-rose-800/80 bg-rose-950/20'
                      : 'border-amber-800/80 bg-amber-950/20'
                    : 'border-zinc-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl text-zinc-100 ${
                        alt.severity === 'CRITICAL'
                          ? 'bg-rose-600'
                          : alt.severity === 'WARNING'
                          ? 'bg-amber-600'
                          : 'bg-blue-600'
                      }`}
                    >
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-zinc-100">{alt.title}</h3>
                        <StatusBadge type="severity" severity={alt.severity} />
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                            alt.status === 'ACTIVE'
                              ? 'bg-rose-900/80 text-rose-300'
                              : alt.status === 'ACKNOWLEDGED'
                              ? 'bg-amber-900/80 text-amber-300'
                              : 'bg-emerald-900/80 text-emerald-300'
                          }`}
                        >
                          {alt.status}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400 mt-0.5">
                        Vehicle:{' '}
                        <span className="text-zinc-200 font-semibold">
                          {veh ? `${veh.vehicleNumber} (${veh.vehicleName})` : alt.vehicleId}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-zinc-500 font-mono flex items-center gap-1 self-end sm:self-auto">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(alt.timestamp).toLocaleString()}</span>
                  </div>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80">
                  {alt.description}
                </p>

                {/* Metadata & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-4 text-[11px] text-zinc-500 font-mono">
                    {alt.fuelDropLiters && (
                      <span className="text-rose-400 font-bold">Fuel Drop: -{alt.fuelDropLiters} L</span>
                    )}
                    {alt.latitude && alt.longitude && (
                      <span className="flex items-center gap-1 text-zinc-400">
                        <MapPin className="w-3 h-3 text-blue-400" />
                        {alt.latitude.toFixed(4)}, {alt.longitude.toFixed(4)}
                      </span>
                    )}
                    {alt.acknowledgedBy && (
                      <span>Ack by: {alt.acknowledgedBy}</span>
                    )}
                    {alt.resolvedBy && (
                      <span className="text-emerald-400">Resolved by: {alt.resolvedBy}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setForensicAlert(alt)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/80 rounded-lg transition"
                      title="Run Gemini AI Theft Forensics Investigation"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                      <span>AI Forensics</span>
                    </button>
                    {alt.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleAcknowledge(alt.id)}
                        className="px-3 py-1.5 text-xs font-semibold bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-700 rounded-lg transition"
                      >
                        Acknowledge
                      </button>
                    )}
                    {alt.status !== 'RESOLVED' && (
                      <button
                        onClick={() => {
                          setResolvingAlert(alt);
                          setResolutionNotes('');
                        }}
                        className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-zinc-950 rounded-lg transition"
                      >
                        Resolve Alert
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Resolution Modal */}
      {resolvingAlert && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/85 backdrop-blur-md p-4 flex min-h-screen items-center justify-center">
          <div className="relative bg-zinc-900 border border-zinc-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 my-auto max-h-[85vh] overflow-y-auto modal-scrollbar animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-zinc-100">Resolve Security Alert</h3>
              <button
                onClick={() => setResolvingAlert(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResolveSubmit} className="space-y-3">
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-xs text-zinc-300">
                <div className="font-bold text-zinc-100">{resolvingAlert.title}</div>
                <div className="text-zinc-400 mt-1">{resolvingAlert.description}</div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Resolution & Investigation Notes</label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  rows={3}
                  placeholder="e.g. Contacted driver Robert Langdon. Driver confirmed authorized refueling stop."
                  required
                  className="w-full px-3 py-2 bg-zinc-850 border border-zinc-700 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResolvingAlert(null)}
                  className="px-4 py-2 text-xs font-medium text-zinc-400 bg-zinc-800 hover:bg-zinc-700 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-zinc-950 rounded-xl transition disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? 'Resolving...' : 'Confirm Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      <TheftForensicModal
        isOpen={!!forensicAlert}
        onClose={() => setForensicAlert(null)}
        alert={forensicAlert}
      />
    </div>
  );
};
