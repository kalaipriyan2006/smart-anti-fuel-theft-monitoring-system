import React, { useState, useEffect } from 'react';
import { useFleet } from '../../contexts/FleetContext.js';
import { useAuth } from '../../contexts/AuthContext.js';
import { api } from '../../services/api.js';
import { TheftForensicModal } from '../../components/ai/TheftForensicModal.js';
import {
  FileSpreadsheet,
  AlertTriangle,
  Shield,
  Clock,
  DollarSign,
  MapPin,
  CheckCircle2,
  XCircle,
  Truck,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { Incident } from '../../types/index.js';

export const IncidentsPage: React.FC = () => {
  const { vehicles } = useFleet();
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [forensicAlert, setForensicAlert] = useState<any | null>(null);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const data = await api.getIncidents();
      setIncidents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const totalFuelLoss = incidents.reduce((acc, curr) => acc + (curr.stolenLiters || 0), 0);
  const totalValueLoss = incidents.reduce((acc, curr) => acc + (curr.estimatedValueLost || 0), 0);

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            Fuel Theft Incidents & Case Management
          </h1>
          <p className="text-xs text-zinc-400">
            Confirmed theft dossiers with sensor before/after timelines, financial valuation, and investigator signoff
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-1">
          <span className="text-[11px] text-zinc-500 uppercase font-semibold">Total Logged Incidents</span>
          <div className="text-2xl font-bold text-zinc-100">{incidents.length}</div>
          <div className="text-xs text-zinc-400">Fleet wide investigations</div>
        </div>

        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-1">
          <span className="text-[11px] text-zinc-500 uppercase font-semibold">Total Fuel Stolen</span>
          <div className="text-2xl font-bold text-rose-400">
            {totalFuelLoss.toFixed(1)} Liters
          </div>
          <div className="text-xs text-zinc-400">Siphoning drops confirmed</div>
        </div>

        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-1">
          <span className="text-[11px] text-zinc-500 uppercase font-semibold">Financial Impact Value</span>
          <div className="text-2xl font-bold text-amber-400">
            ${totalValueLoss.toFixed(2)} USD
          </div>
          <div className="text-xs text-zinc-400">Calculated @ $1.50 / Liter</div>
        </div>
      </div>

      {/* Incident Dossiers */}
      <div className="space-y-4">
        {incidents.length === 0 ? (
          <div className="p-12 bg-zinc-900 border border-zinc-800 rounded-2xl text-center text-zinc-500 text-xs">
            No theft incidents recorded in the system.
          </div>
        ) : (
          incidents.map((inc) => {
            const veh = vehicles.find((v) => v.id === inc.vehicleId);

            return (
              <div
                key={inc.id}
                className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4 shadow-lg"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-400">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-zinc-400">{inc.id}</span>
                        <span className="text-sm font-bold text-zinc-100">
                          {veh ? `${veh.vehicleNumber} (${veh.vehicleName})` : inc.vehicleId}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                            inc.status === 'CONFIRMED_THEFT'
                              ? 'bg-rose-800 text-white'
                              : inc.status === 'INVESTIGATING'
                              ? 'bg-amber-800 text-amber-100'
                              : 'bg-emerald-800 text-emerald-100'
                          }`}
                        >
                          {inc.status}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-500 mt-0.5 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(inc.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-bold text-rose-400">
                      -{inc.stolenLiters.toFixed(1)} L
                    </div>
                    <div className="text-xs text-amber-400 font-mono">
                      ~${inc.estimatedValueLost.toFixed(2)} Lost
                    </div>
                  </div>
                </div>

                {/* Data Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-zinc-950 p-3.5 rounded-xl border border-zinc-800/80 font-mono">
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase font-sans">Initial Fuel</span>
                    <span className="text-zinc-200 font-bold">{inc.initialFuelLiters.toFixed(1)} L</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase font-sans">After Drop Fuel</span>
                    <span className="text-zinc-200 font-bold">{inc.finalFuelLiters.toFixed(1)} L</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase font-sans">GPS Coordinates</span>
                    <span className="text-blue-400 font-bold">
                      {inc.latitude.toFixed(4)}, {inc.longitude.toFixed(4)}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase font-sans">Investigator</span>
                    <span className="text-zinc-300 truncate block font-sans">
                      {inc.investigatorNotes ? 'Reviewed' : 'Pending Audit'}
                    </span>
                  </div>
                </div>

                {/* Notes & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  {inc.investigatorNotes ? (
                    <div className="p-3 bg-zinc-850/60 rounded-xl border border-zinc-800 text-xs text-zinc-300 space-y-1 flex-1">
                      <div className="font-semibold text-zinc-200">Investigator Case Notes:</div>
                      <p className="text-zinc-400 italic leading-relaxed">{inc.investigatorNotes}</p>
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-500 italic">No manual investigator notes recorded yet.</div>
                  )}

                  <button
                    onClick={() =>
                      setForensicAlert({
                        id: inc.id,
                        vehicleId: inc.vehicleId,
                        title: `Fuel Theft Incident - ${inc.stolenLiters}L Stolen`,
                        description: `Siphoning event detected at coordinates (${inc.latitude.toFixed(4)}, ${inc.longitude.toFixed(4)}). Initial level: ${inc.initialFuelLiters}L, Final level: ${inc.finalFuelLiters}L.`,
                        fuelDropLiters: inc.stolenLiters,
                        latitude: inc.latitude,
                        longitude: inc.longitude,
                        timestamp: inc.timestamp,
                        type: 'SUDDEN_DROP',
                        severity: 'CRITICAL',
                        status: 'ACTIVE'
                      })
                    }
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/80 rounded-xl transition shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                    <span>AI Theft Forensics</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <TheftForensicModal
        isOpen={!!forensicAlert}
        onClose={() => setForensicAlert(null)}
        alert={forensicAlert}
      />
    </div>
  );
};
