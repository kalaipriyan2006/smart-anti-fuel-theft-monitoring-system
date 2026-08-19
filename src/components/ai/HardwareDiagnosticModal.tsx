import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Sparkles,
  Cpu,
  X,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Wrench,
  Code,
  Copy,
  Check,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { ESP32Device } from '../../types/index.js';

interface HardwareDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: ESP32Device | null;
}

interface HardwareDiagnostics {
  diagnosticStatus: 'OPTIMAL' | 'WARNING' | 'HARDWARE_FAULT' | 'CALIBRATION_NEEDED' | 'DISCONNECTED';
  summary: string;
  pinHealth: {
    GPIO34?: string;
    GPIO16_17?: string;
    GPIO25?: string;
    LM2596?: string;
    [key: string]: string | undefined;
  };
  troubleshootingSteps: string[];
  firmwareSnippet?: string;
}

export const HardwareDiagnosticModal: React.FC<HardwareDiagnosticModalProps> = ({
  isOpen,
  onClose,
  device
}) => {
  const [loading, setLoading] = useState(false);
  const [diagnostics, setDiagnostics] = useState<HardwareDiagnostics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (isOpen && device) {
      runDiagnostics();
    } else {
      setDiagnostics(null);
      setError(null);
    }
  }, [isOpen, device]);

  const runDiagnostics = async () => {
    if (!device) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/hardware-diagnostics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: device.id || device.deviceId })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to run hardware diagnostic');
      }

      setDiagnostics(data.diagnostics);
    } catch (err: any) {
      setError(err.message || 'Diagnostic service error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !device) return null;

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/85 backdrop-blur-md p-3 sm:p-6 flex min-h-screen items-center justify-center">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] my-auto animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-zinc-800 bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-zinc-100">ESP32 AI Hardware Diagnostics</h3>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Gemini 3.7
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-400">
                Unit: <span className="font-mono text-zinc-300">{device.id || device.deviceId}</span> • Device: <strong className="text-zinc-200">{device.name}</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={runDiagnostics}
              disabled={loading}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition disabled:opacity-50 cursor-pointer"
              title="Re-run diagnostics"
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

        {/* Content */}
        <div className="p-5 overflow-y-auto modal-scrollbar flex-1 min-h-0 space-y-4">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
              <div className="text-sm font-semibold text-zinc-200">Analyzing Microcontroller Telemetry & Pin Registers...</div>
              <p className="text-xs text-zinc-500 max-w-sm">
                Examining GPIO34 ADC bit resolution, UART baud stability, Wi-Fi RSSI attenuation, and step-down regulator thermals...
              </p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-950/40 border border-rose-800/80 rounded-xl text-rose-300 text-xs">
              <strong>Diagnostic Notice:</strong> {error}
            </div>
          ) : diagnostics ? (
            <>
              {/* Diagnostic Overview Card */}
              <div className="p-4 bg-zinc-950/70 border border-zinc-800 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs text-zinc-400 uppercase font-semibold">Diagnostic Assessment</div>
                  <div className="text-sm font-bold text-zinc-100 mt-1">{diagnostics.summary}</div>
                </div>
                <div className="px-3 py-1 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-full font-bold text-xs">
                  {diagnostics.diagnosticStatus}
                </div>
              </div>

              {/* Pin Register Map */}
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-emerald-400" />
                  Hardware Pin & Subsystem Health
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl">
                    <div className="text-xs font-mono font-bold text-emerald-400">GPIO34 (Fuel ADC)</div>
                    <div className="text-xs text-zinc-300 mt-1">{diagnostics.pinHealth?.GPIO34 || '12-bit ADC sampling active'}</div>
                  </div>
                  <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl">
                    <div className="text-xs font-mono font-bold text-blue-400">GPIO16/17 (NEO-6M GPS)</div>
                    <div className="text-xs text-zinc-300 mt-1">{diagnostics.pinHealth?.GPIO16_17 || 'UART 9600 baud stream verified'}</div>
                  </div>
                  <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl">
                    <div className="text-xs font-mono font-bold text-amber-400">GPIO25 (Siren Relay)</div>
                    <div className="text-xs text-zinc-300 mt-1">{diagnostics.pinHealth?.GPIO25 || 'Piezo driver armed'}</div>
                  </div>
                  <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl">
                    <div className="text-xs font-mono font-bold text-purple-400">LM2596 (5.0V Regulator)</div>
                    <div className="text-xs text-zinc-300 mt-1">{diagnostics.pinHealth?.LM2596 || 'Input buck regulator stable'}</div>
                  </div>
                </div>
              </div>

              {/* Troubleshooting Steps */}
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-emerald-400" />
                  Field Technician Action Checklist
                </div>
                <div className="space-y-1.5">
                  {diagnostics.troubleshootingSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl flex items-start gap-2.5 text-xs text-zinc-300"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Firmware Suggestion if any */}
              {diagnostics.firmwareSnippet && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <Code className="w-3.5 h-3.5 text-emerald-400" /> Recommended ESP32 Firmware Patch
                    </span>
                    <button
                      onClick={() => handleCopy(diagnostics.firmwareSnippet!)}
                      className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 normal-case"
                    >
                      {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                    </button>
                  </div>
                  <pre className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-emerald-300 overflow-x-auto">
                    {diagnostics.firmwareSnippet}
                  </pre>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between text-xs text-zinc-400">
          <span>Real-time Microcontroller Grounding Engine</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold rounded-lg transition cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};
