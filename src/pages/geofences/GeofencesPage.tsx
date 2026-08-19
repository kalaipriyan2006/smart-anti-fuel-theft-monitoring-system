import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFleet } from '../../contexts/FleetContext.js';
import { useAuth } from '../../contexts/AuthContext.js';
import { api } from '../../services/api.js';
import {
  Compass,
  Plus,
  Trash2,
  MapPin,
  Shield,
  Truck,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  Radio
} from 'lucide-react';
import { Geofence } from '../../types/index.js';

export const GeofencesPage: React.FC = () => {
  const { selectedVehicle, vehicles, refreshFleetData } = useFleet();
  const { user } = useAuth();

  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // New Geofence Form State
  const [name, setName] = useState<string>('');
  const [vehicleId, setVehicleId] = useState<string>('');
  const [zoneType, setZoneType] = useState<Geofence['zoneType']>('DEPOT');
  const [centerLat, setCenterLat] = useState<number>(37.7749);
  const [centerLng, setCenterLng] = useState<number>(-122.4194);
  const [radiusMeters, setRadiusMeters] = useState<number>(500);
  const [alertOnExit, setAlertOnExit] = useState<boolean>(true);
  const [alertOnEntry, setAlertOnEntry] = useState<boolean>(false);
  const [activeTimeStart, setActiveTimeStart] = useState<string>('08:00');
  const [activeTimeEnd, setActiveTimeEnd] = useState<string>('20:00');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGeofences = async () => {
    try {
      setLoading(true);
      const data = await api.getGeofences(user?.id);
      setGeofences(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGeofences();
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !user) {
      setError('Geofence name is required');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await api.createGeofence({
        userId: user.id,
        name,
        vehicleId: vehicleId || undefined,
        zoneType,
        centerLat,
        centerLng,
        radiusMeters,
        alertOnExit,
        alertOnEntry,
        activeTimeStart,
        activeTimeEnd
      });
      await fetchGeofences();
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Failed to create geofence');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this geofence zone?')) return;
    try {
      await api.deleteGeofence(id);
      setGeofences(geofences.filter(g => g.id !== id));
    } catch (err: any) {
      alert('Error deleting geofence: ' + err.message);
    }
  };

  const resetForm = () => {
    setName('');
    setVehicleId(selectedVehicle?.id || '');
    setZoneType('DEPOT');
    setCenterLat(37.7749);
    setCenterLng(-122.4194);
    setRadiusMeters(500);
    setAlertOnExit(true);
    setAlertOnEntry(false);
    setError(null);
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <Compass className="w-5 h-5 text-emerald-400" />
            <span>Fleet Geofencing & Security Perimeters</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Automated perimeter monitoring triggering instant alerts upon vehicle unauthorized exit or depot entry
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs rounded-xl transition shadow-lg shadow-emerald-950/40"
        >
          <Plus className="w-4 h-4" />
          <span>New Geofence Zone</span>
        </button>
      </div>

      {/* Geofence Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-zinc-500 text-xs">
            Loading active perimeter zones...
          </div>
        ) : geofences.length === 0 ? (
          <div className="col-span-full p-8 bg-zinc-900 border border-zinc-800 rounded-2xl text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-500 mx-auto">
              <Compass className="w-6 h-6" />
            </div>
            <div className="text-sm font-semibold text-zinc-300">No Geofences Configured</div>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              Define safe operating zones around fuel depots, distribution terminals, and parking bays to detect route deviations.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg transition"
            >
              Create First Geofence
            </button>
          </div>
        ) : (
          geofences.map((gf) => {
            const assignedVehicle = vehicles.find(v => v.id === gf.vehicleId);
            return (
              <div
                key={gf.id}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg space-y-4 hover:border-zinc-700 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <Compass className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-zinc-100">{gf.name}</h3>
                      <span className="inline-block px-1.5 py-0.5 mt-0.5 text-[10px] uppercase font-mono font-bold bg-zinc-800 text-emerald-400 rounded">
                        {gf.zoneType}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(gf.id)}
                    className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition"
                    title="Delete Geofence"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80">
                  <div>
                    <div className="text-[10px] uppercase text-zinc-500 font-semibold">Radius</div>
                    <div className="font-mono font-bold text-zinc-200 mt-0.5">{gf.radiusMeters} meters</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-zinc-500 font-semibold">Target Fleet</div>
                    <div className="text-zinc-200 mt-0.5 truncate">
                      {assignedVehicle ? assignedVehicle.vehicleNumber : 'All Vehicles'}
                    </div>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-zinc-800/60 flex justify-between text-[11px] font-mono text-zinc-400">
                    <span>GPS: {gf.centerLat.toFixed(4)}, {gf.centerLng.toFixed(4)}</span>
                    <span>{gf.activeTimeStart || '24h'} - {gf.activeTimeEnd || '24h'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${gf.alertOnExit ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                    <span className="text-zinc-400 text-[11px]">
                      {gf.alertOnExit ? 'Exit Alert Active' : 'Exit Alert Disabled'}
                    </span>
                  </div>
                  {gf.alertOnEntry && (
                    <span className="text-[10px] font-mono text-blue-400 bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-800">
                      Entry Alert
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal for Creating Geofence */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/85 backdrop-blur-md p-4 flex min-h-screen items-center justify-center">
          <div className="relative bg-zinc-900 border border-zinc-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-auto max-h-[85vh] overflow-y-auto modal-scrollbar animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-emerald-400" />
                <h2 className="text-sm font-bold text-zinc-100">Configure Geofence Perimeter</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-200 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-950/50 border border-rose-800 text-xs text-rose-300 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Zone Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Central Depot #4, Parking Bay South"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Zone Category</label>
                  <select
                    value={zoneType}
                    onChange={(e) => setZoneType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="DEPOT">Fuel Depot</option>
                    <option value="PARKING">Secure Parking</option>
                    <option value="OFFICE">HQ / Office</option>
                    <option value="HOME">Base Terminal</option>
                    <option value="RESTRICTED">Restricted Zone</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Bind to Specific Vehicle</label>
                  <select
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">All Vehicles</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.vehicleNumber} ({v.vehicleName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Center Lat</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={centerLat}
                    onChange={(e) => setCenterLat(parseFloat(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Center Lng</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={centerLng}
                    onChange={(e) => setCenterLng(parseFloat(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Radius (m)</label>
                  <input
                    type="number"
                    min="50"
                    max="50000"
                    step="50"
                    required
                    value={radiusMeters}
                    onChange={(e) => setRadiusMeters(parseInt(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-xl space-y-2">
                <div className="text-[11px] font-semibold text-zinc-300">Trigger Conditions</div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={alertOnExit}
                      onChange={(e) => setAlertOnExit(e.target.checked)}
                      className="rounded border-zinc-700 text-emerald-500 focus:ring-0"
                    />
                    <span className="text-zinc-300">Alert on Exit</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={alertOnEntry}
                      onChange={(e) => setAlertOnEntry(e.target.checked)}
                      className="rounded border-zinc-700 text-emerald-500 focus:ring-0"
                    />
                    <span className="text-zinc-300">Alert on Entry</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold rounded-xl transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Saving Zone...' : 'Save Geofence'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
