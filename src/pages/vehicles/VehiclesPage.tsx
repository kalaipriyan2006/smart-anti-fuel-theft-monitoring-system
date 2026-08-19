import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useFleet } from '../../contexts/FleetContext.js';
import { useAuth } from '../../contexts/AuthContext.js';
import { api } from '../../services/api.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import {
  Truck,
  Plus,
  Edit2,
  Trash2,
  Cpu,
  Fuel,
  CheckCircle2,
  AlertCircle,
  X,
  Radio
} from 'lucide-react';
import { Vehicle } from '../../types/index.js';

export const VehiclesPage: React.FC = () => {
  const { vehicles, devices, selectedVehicleId, setSelectedVehicleId, refreshFleetData } = useFleet();
  const { user } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const [vehicleNumber, setVehicleNumber] = useState<string>('');
  const [vehicleName, setVehicleName] = useState<string>('');
  const [vehicleType, setVehicleType] = useState<any>('TRUCK');
  const [tankCapacityLiters, setTankCapacityLiters] = useState<number>(450);
  const [driverName, setDriverName] = useState<string>('');
  const [driverPhone, setDriverPhone] = useState<string>('');
  const [deviceId, setDeviceId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const openAddModal = () => {
    setEditingVehicle(null);
    setVehicleNumber('');
    setVehicleName('');
    setVehicleType('TRUCK');
    setTankCapacityLiters(450);
    setDriverName('');
    setDriverPhone('');
    setDeviceId('');
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (veh: Vehicle) => {
    setEditingVehicle(veh);
    setVehicleNumber(veh.vehicleNumber);
    setVehicleName(veh.vehicleName);
    setVehicleType(veh.vehicleType);
    setTankCapacityLiters(veh.tankCapacityLiters);
    setDriverName(veh.driverName || '');
    setDriverPhone(veh.driverPhone || '');
    setDeviceId(veh.deviceId || '');
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!vehicleNumber || !vehicleName || !tankCapacityLiters) {
      setError('Please fill in vehicle number, name and tank capacity');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (editingVehicle) {
        await api.updateVehicle(editingVehicle.id, {
          vehicleNumber,
          vehicleName,
          vehicleType,
          tankCapacityLiters: Number(tankCapacityLiters),
          driverName,
          driverPhone,
          deviceId: deviceId || undefined
        });
      } else {
        await api.createVehicle({
          userId: user.id,
          vehicleNumber,
          vehicleName,
          vehicleType,
          tankCapacityLiters: Number(tankCapacityLiters),
          driverName,
          driverPhone,
          deviceId: deviceId || undefined
        });
      }
      await refreshFleetData();
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save vehicle');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) return;
    try {
      await api.deleteVehicle(id);
      await refreshFleetData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete vehicle');
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-400" />
            Fleet Vehicle Management
          </h1>
          <p className="text-xs text-zinc-400">
            Configure vehicle fleet assets, fuel tank volumes, and linked ESP32 IoT microcontrollers
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-zinc-950 rounded-xl transition shadow-md shadow-emerald-950 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Vehicle</span>
        </button>
      </div>

      {/* Vehicles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicles.length === 0 ? (
          <div className="col-span-full p-12 bg-zinc-900 border border-zinc-800 rounded-2xl text-center text-zinc-500 text-xs">
            No vehicles registered yet. Click "Add New Vehicle" to configure your fleet.
          </div>
        ) : (
          vehicles.map((v) => {
            const linkedDev = devices.find((d) => d.id === v.deviceId || d.vehicleId === v.id);
            const isSelected = selectedVehicleId === v.id;

            return (
              <div
                key={v.id}
                className={`p-5 bg-zinc-900 border rounded-2xl space-y-4 transition ${
                  isSelected ? 'border-emerald-500/80 ring-1 ring-emerald-500/50' : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-emerald-400">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-zinc-100">{v.vehicleName}</h3>
                      <span className="font-mono text-xs text-emerald-400 font-semibold">{v.vehicleNumber}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(v)}
                      className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition"
                      title="Edit Vehicle"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(v.id)}
                      className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition"
                      title="Delete Vehicle"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Specs */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase">Tank Volume</span>
                    <span className="font-bold text-zinc-200">{v.tankCapacityLiters} Liters</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase">Vehicle Type</span>
                    <span className="font-medium text-zinc-200">{v.vehicleType}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase">Assigned Driver</span>
                    <span className="text-zinc-300 truncate block">{v.driverName || 'Unassigned'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase">Driver Contact</span>
                    <span className="text-zinc-300 truncate block">{v.driverPhone || 'N/A'}</span>
                  </div>
                </div>

                {/* Linked ESP32 Status */}
                <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <Cpu className="w-3.5 h-3.5 text-blue-400" />
                    <span className="font-mono text-[11px]">
                      {linkedDev ? linkedDev.id : 'No ESP32 Linked'}
                    </span>
                  </div>
                  <StatusBadge type="device" status={linkedDev ? linkedDev.status : undefined} />
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedVehicleId(v.id)}
                  className={`w-full py-2 text-xs font-semibold rounded-xl transition ${
                    isSelected
                      ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-zinc-800 hover:bg-zinc-750 text-zinc-300'
                  }`}
                >
                  {isSelected ? '✓ Active Dashboard Vehicle' : 'Select for Live Monitoring'}
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/85 backdrop-blur-md p-4 flex min-h-screen items-center justify-center">
          <div className="relative bg-zinc-900 border border-zinc-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 my-auto max-h-[85vh] overflow-y-auto modal-scrollbar animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-zinc-100">
                {editingVehicle ? 'Edit Vehicle Profile' : 'Register New Fleet Vehicle'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
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

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Vehicle Registration Number</label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  placeholder="e.g. FL-9021-VOLVO"
                  required
                  className="w-full px-3 py-2 bg-zinc-850 border border-zinc-700 rounded-xl text-sm text-zinc-100 uppercase font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Vehicle Friendly Name / Model</label>
                <input
                  type="text"
                  value={vehicleName}
                  onChange={(e) => setVehicleName(e.target.value)}
                  placeholder="e.g. Volvo FH16 Longhaul 750"
                  required
                  className="w-full px-3 py-2 bg-zinc-850 border border-zinc-700 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300">Vehicle Type</label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-850 border border-zinc-700 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="TRUCK">Longhaul Truck</option>
                    <option value="TANKER">Fuel Tanker</option>
                    <option value="BUS">Fleet Bus</option>
                    <option value="HEAVY_EQUIPMENT">Heavy Equipment</option>
                    <option value="GENERATOR">Stationary Generator</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300">Tank Capacity (Liters)</label>
                  <input
                    type="number"
                    value={tankCapacityLiters}
                    onChange={(e) => setTankCapacityLiters(Number(e.target.value))}
                    min={10}
                    max={5000}
                    required
                    className="w-full px-3 py-2 bg-zinc-850 border border-zinc-700 rounded-xl text-sm text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300">Driver Name</label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="e.g. Robert Langdon"
                    className="w-full px-3 py-2 bg-zinc-850 border border-zinc-700 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300">Driver Contact</label>
                  <input
                    type="text"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2 bg-zinc-850 border border-zinc-700 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Link to Authenticated ESP32 Device</label>
                <select
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-850 border border-zinc-700 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Do Not Link Now --</option>
                  {devices.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.id} ({d.name}) - {d.status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-800 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-zinc-950 rounded-xl transition disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Saving...' : editingVehicle ? 'Update Vehicle' : 'Create Vehicle'}
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
