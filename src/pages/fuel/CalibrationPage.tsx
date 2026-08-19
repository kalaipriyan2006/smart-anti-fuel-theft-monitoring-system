import React, { useState, useEffect } from 'react';
import { useFleet } from '../../contexts/FleetContext.js';
import { useAuth } from '../../contexts/AuthContext.js';
import { api } from '../../services/api.js';
import {
  Sliders,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Info,
  Layers,
  History
} from 'lucide-react';
import { CalibrationProfile, CalibrationStage } from '../../types/index.js';

export const CalibrationPage: React.FC = () => {
  const { selectedVehicle } = useFleet();
  const { user } = useAuth();

  const [profile, setProfile] = useState<CalibrationProfile | null>(null);
  const [adcMin, setAdcMin] = useState<number>(300);
  const [adcMax, setAdcMax] = useState<number>(3900);
  const [stages, setStages] = useState<CalibrationStage[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!selectedVehicle) {
        setProfile(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await api.getCalibration(selectedVehicle.id);
        setProfile(data);
        setAdcMin(data.adcMin);
        setAdcMax(data.adcMax);
        setStages(data.stages || []);
        setNotes(data.notes || '');
      } catch (err) {
        // Fallback default stages
        const cap = selectedVehicle.tankCapacityLiters;
        setAdcMin(300);
        setAdcMax(3900);
        setStages([
          { stage: 'EMPTY', adcValue: 300, fuelLiters: 0 },
          { stage: 'LOW', adcValue: 1200, fuelLiters: cap * 0.25 },
          { stage: 'HALF', adcValue: 2100, fuelLiters: cap * 0.5 },
          { stage: 'HIGH', adcValue: 3000, fuelLiters: cap * 0.75 },
          { stage: 'FULL', adcValue: 3900, fuelLiters: cap }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [selectedVehicle]);

  const handleStageAdcChange = (index: number, newAdc: number) => {
    const updated = [...stages];
    updated[index].adcValue = newAdc;
    setStages(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle || !user) return;

    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const updated = await api.updateCalibration(selectedVehicle.id, {
        adcMin: Number(adcMin),
        adcMax: Number(adcMax),
        stages,
        notes,
        userEmail: user.email
      });
      setProfile(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save calibration profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-400" />
            Fuel Sensor Multi-Stage Calibration
          </h1>
          <p className="text-xs text-zinc-400">
            Configure empirical 12-bit ADC curve points for non-linear tank geometry and accurate volume calculation
          </p>
        </div>
      </div>

      {!selectedVehicle ? (
        <div className="p-12 bg-zinc-900 border border-zinc-800 rounded-2xl text-center text-zinc-500 text-xs">
          Select a vehicle to configure its capacitive sensor calibration profile.
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {saveSuccess && (
            <div className="p-4 bg-emerald-950/80 border border-emerald-800 text-xs text-emerald-300 rounded-2xl flex items-center gap-2 shadow-lg">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Calibration profile saved successfully! Calibration curve audit log recorded.</span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-950/80 border border-rose-800 text-xs text-rose-300 rounded-2xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Boundaries */}
          <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Sensor Min/Max Limits (12-Bit ADC Range: 0 - 4095)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">ADC Minimum (Empty Tank: 0L)</label>
                <input
                  type="number"
                  value={adcMin}
                  onChange={(e) => setAdcMin(Number(e.target.value))}
                  min={0}
                  max={4095}
                  required
                  className="w-full px-3 py-2 bg-zinc-850 border border-zinc-700 rounded-xl text-sm text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">ADC Maximum (Full Tank: {selectedVehicle.tankCapacityLiters}L)</label>
                <input
                  type="number"
                  value={adcMax}
                  onChange={(e) => setAdcMax(Number(e.target.value))}
                  min={0}
                  max={4095}
                  required
                  className="w-full px-3 py-2 bg-zinc-850 border border-zinc-700 rounded-xl text-sm text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Tank Volume Reference</label>
                <div className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-emerald-400 font-bold font-mono">
                  {selectedVehicle.tankCapacityLiters} Liters
                </div>
              </div>
            </div>
          </div>

          {/* 5-Stage Calibration Table */}
          <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-100">
                Piecewise 5-Stage Calibration Points
              </h3>
              <span className="text-[11px] text-zinc-400">
                Empirical bench measurements
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400">
                    <th className="pb-2">Calibration Stage</th>
                    <th className="pb-2">Fuel Volume (Liters)</th>
                    <th className="pb-2">Raw ADC (GPIO34)</th>
                    <th className="pb-2">Approx. Voltage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono text-zinc-300">
                  {stages.map((stage, idx) => {
                    const voltage = ((stage.adcValue / 4095) * 3.3).toFixed(2);
                    return (
                      <tr key={stage.stage} className="hover:bg-zinc-850/50">
                        <td className="py-3 font-bold text-zinc-200 font-sans">{stage.stage}</td>
                        <td className="py-3 text-emerald-400 font-bold">{stage.fuelLiters.toFixed(1)} L</td>
                        <td className="py-3">
                          <input
                            type="number"
                            value={stage.adcValue}
                            onChange={(e) => handleStageAdcChange(idx, Number(e.target.value))}
                            min={0}
                            max={4095}
                            className="w-28 px-2.5 py-1 bg-zinc-950 border border-zinc-700 rounded-lg text-zinc-100 font-mono focus:border-emerald-500 focus:outline-none"
                          />
                        </td>
                        <td className="py-3 text-zinc-400">{voltage} V</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Calibration Notes */}
          <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-2">
            <label className="text-xs font-medium text-zinc-300">Calibration Notes & Technician Signoff</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="e.g. Verified with certified 20L flowmeter test at Depot Bay 2."
              className="w-full px-3 py-2 bg-zinc-850 border border-zinc-700 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-[11px] text-zinc-500">
              {profile ? `Last updated: ${new Date(profile.updatedAt).toLocaleDateString()} by ${profile.updatedBy}` : ''}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-zinc-950 rounded-xl transition shadow-lg shadow-emerald-950 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Profile...' : 'Save Calibration Profile'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
