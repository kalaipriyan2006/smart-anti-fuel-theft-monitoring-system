import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Sparkles,
  Fuel,
  X,
  TrendingDown,
  DollarSign,
  Award,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useFleet } from '../../contexts/FleetContext.js';

interface FuelIntelligenceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface IntelligenceReport {
  summaryHeadline: string;
  theftRiskAnalysis: string;
  fuelEfficiencyInsights: string;
  keyRecommendations: string[];
  savingsOpportunityUsd: number;
  fleetHealthGrade: string;
}

export const FuelIntelligenceModal: React.FC<FuelIntelligenceModalProps> = ({ isOpen, onClose }) => {
  const { selectedVehicle } = useFleet();
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<IntelligenceReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'24h' | '7d' | '30d'>('7d');

  useEffect(() => {
    if (isOpen) {
      generateReport();
    } else {
      setReport(null);
      setError(null);
    }
  }, [isOpen, period, selectedVehicle]);

  const generateReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/fuel-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period,
          vehicleId: selectedVehicle?.id
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate intelligence report');
      }

      setReport(data.report);
    } catch (err: any) {
      setError(err.message || 'Error communicating with AI engine');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/85 backdrop-blur-md p-3 sm:p-6 flex min-h-screen items-center justify-center">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] my-auto animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-zinc-800 bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Fuel className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-zinc-100">AI Fuel Economy & Theft Intelligence</h3>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Gemini 3.7
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-400">
                Scope: <strong className="text-zinc-200">{selectedVehicle ? selectedVehicle.vehicleNumber : 'Entire Fleet'}</strong> • Range: {period}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={generateReport}
              disabled={loading}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition disabled:opacity-50 cursor-pointer"
              title="Regenerate report"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Time Selector */}
        <div className="px-5 py-2 bg-zinc-950/50 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-zinc-400 font-medium">Reporting Interval:</span>
          <div className="flex items-center gap-1.5">
            {(['24h', '7d', '30d'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  period === p
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700'
                }`}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto modal-scrollbar flex-1 min-h-0 space-y-4">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
              <div className="text-sm font-semibold text-zinc-200">Synthesizing Fleet Fuel Intelligence...</div>
              <p className="text-xs text-zinc-500 max-w-sm">
                Aggregating fuel burn patterns, drain differentials, and optimization opportunities with Gemini...
              </p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-950/40 border border-rose-800/80 rounded-xl text-rose-300 text-xs">
              <strong>Intelligence Engine Notice:</strong> {error}
            </div>
          ) : report ? (
            <>
              {/* Executive Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 bg-zinc-950/70 border border-zinc-800 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-zinc-400">Fleet Health Grade</div>
                    <div className="text-3xl font-black text-emerald-400 mt-1">{report.fleetHealthGrade}</div>
                    <div className="text-xs text-zinc-400 mt-0.5">Telematics Security Index</div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Award className="w-6 h-6" />
                  </div>
                </div>

                <div className="p-4 bg-zinc-950/70 border border-zinc-800 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-zinc-400">Est. Preventative Savings</div>
                    <div className="text-3xl font-black text-amber-400 mt-1">${report.savingsOpportunityUsd}</div>
                    <div className="text-xs text-zinc-400 mt-0.5">via theft prevention & calibration</div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <DollarSign className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Headline */}
              <div className="p-4 bg-zinc-800/60 border border-zinc-700/60 rounded-xl text-xs sm:text-sm text-zinc-200 font-medium leading-relaxed">
                💡 {report.summaryHeadline}
              </div>

              {/* Insights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-1.5">
                  <div className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400" /> Theft Risk & Vulnerability
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">{report.theftRiskAnalysis}</p>
                </div>

                <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-1.5">
                  <div className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                    <TrendingDown className="w-3.5 h-3.5 text-emerald-400" /> Consumption Efficiency
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">{report.fuelEfficiencyInsights}</p>
                </div>
              </div>

              {/* Key Recommendations */}
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  Key Strategic Recommendations
                </div>
                <div className="space-y-1.5">
                  {report.keyRecommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl flex items-start gap-2.5 text-xs text-zinc-300"
                    >
                      <span className="w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-[10px] shrink-0">
                        {idx + 1}
                      </span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between text-xs text-zinc-400">
          <span>Gemini Fuel Intelligence Engine</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold rounded-lg transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};
