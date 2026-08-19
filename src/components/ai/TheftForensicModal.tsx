import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Sparkles,
  ShieldAlert,
  X,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  TrendingDown,
  Wrench,
  Loader2,
  FileText
} from 'lucide-react';
import { Alert } from '../../types/index.js';

interface TheftForensicModalProps {
  isOpen: boolean;
  onClose: () => void;
  alert: Alert | null;
}

interface ForensicAnalysis {
  assessmentTitle: string;
  theftProbabilityScore: number;
  classification: 'CONFIRMED_THEFT' | 'SUSPECTED_THEFT' | 'SLOSH_FALSE_POSITIVE' | 'RAPID_COMBUSTION_LOAD' | 'SENSOR_HARDWARE_FAULT';
  rootCauseAnalysis: string;
  recommendedActions: string[];
  estimatedFinancialLossUsd: number;
}

export const TheftForensicModal: React.FC<TheftForensicModalProps> = ({ isOpen, onClose, alert }) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<ForensicAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && alert) {
      fetchAnalysis();
    } else {
      setAnalysis(null);
      setError(null);
    }
  }, [isOpen, alert]);

  const fetchAnalysis = async () => {
    if (!alert) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/theft-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertId: alert.id,
          vehicleId: alert.vehicleId
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to perform AI theft forensics');
      }

      setAnalysis(data.analysis);
    } catch (err: any) {
      setError(err.message || 'Error communicating with Gemini forensic engine');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !alert) return null;

  const getClassificationBadge = (classification: string) => {
    switch (classification) {
      case 'CONFIRMED_THEFT':
        return <span className="px-3 py-1 bg-rose-950/80 text-rose-300 border border-rose-800 rounded-full font-bold text-xs">🔴 CONFIRMED SIPHON THEFT</span>;
      case 'SUSPECTED_THEFT':
        return <span className="px-3 py-1 bg-amber-950/80 text-amber-300 border border-amber-800 rounded-full font-bold text-xs">⚠️ HIGH THEFT PROBABILITY</span>;
      case 'SLOSH_FALSE_POSITIVE':
        return <span className="px-3 py-1 bg-blue-950/80 text-blue-300 border border-blue-800 rounded-full font-bold text-xs">🌊 SLOSH DYNAMIC ARTIFACT</span>;
      case 'RAPID_COMBUSTION_LOAD':
        return <span className="px-3 py-1 bg-purple-950/80 text-purple-300 border border-purple-800 rounded-full font-bold text-xs">⚡ HEAVY ENGINE LOAD DRAIN</span>;
      default:
        return <span className="px-3 py-1 bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-full font-bold text-xs">🔧 SENSOR / WIRING FAULT</span>;
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/85 backdrop-blur-md p-3 sm:p-6 flex min-h-screen items-center justify-center">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] my-auto animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-zinc-800 bg-gradient-to-r from-rose-950/40 via-zinc-900 to-zinc-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-zinc-100">AI Theft Forensic Investigation</h3>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Gemini 3.7
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-400">
                Alert ID: <span className="font-mono text-zinc-300">{alert.id}</span> • Vehicle: <strong className="text-zinc-200">{alert.vehicleNumber}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto modal-scrollbar flex-1 min-h-0 space-y-4">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-rose-400" />
              <div className="text-sm font-semibold text-zinc-200">Running Deep Neural Telemetry Forensics...</div>
              <p className="text-xs text-zinc-500 max-w-sm">
                Correlating ADC raw voltage gradients, speed telemetry, GPS fix drift, and slosh parameters with Gemini...
              </p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-950/40 border border-rose-800/80 rounded-xl text-rose-300 text-xs">
              <strong>Forensic Engine Notice:</strong> {error}
            </div>
          ) : analysis ? (
            <>
              {/* Top Summary Card */}
              <div className="p-4 bg-zinc-950/70 border border-zinc-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-zinc-400 uppercase tracking-wider font-semibold mb-1">AI Verdict</div>
                  <div className="text-base font-bold text-zinc-100 mb-2">{analysis.assessmentTitle}</div>
                  <div>{getClassificationBadge(analysis.classification)}</div>
                </div>

                {/* Score Dial */}
                <div className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 px-4 py-3 rounded-xl shrink-0">
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-zinc-400">Theft Probability</div>
                    <div className={`text-2xl font-black ${analysis.theftProbabilityScore > 70 ? 'text-rose-400' : analysis.theftProbabilityScore > 40 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {analysis.theftProbabilityScore}%
                    </div>
                  </div>
                  <div className="h-10 w-px bg-zinc-800" />
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-zinc-400">Est. Loss</div>
                    <div className="text-lg font-bold text-amber-400">
                      ${analysis.estimatedFinancialLossUsd}
                    </div>
                  </div>
                </div>
              </div>

              {/* Root Cause Analysis */}
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-rose-400" />
                  Root-Cause Telemetry Breakdown
                </div>
                <div className="p-4 bg-zinc-800/60 border border-zinc-700/60 rounded-xl text-xs sm:text-sm text-zinc-200 leading-relaxed">
                  {analysis.rootCauseAnalysis}
                </div>
              </div>

              {/* Recommended Actions */}
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-emerald-400" />
                  Recommended Fleet Actions
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {analysis.recommendedActions.map((action, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl flex items-start gap-2.5 text-xs text-zinc-300"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between text-xs text-zinc-400">
          <span>Engine: Gemini 3.7 Flash Telematics Forensic Pipeline</span>
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
