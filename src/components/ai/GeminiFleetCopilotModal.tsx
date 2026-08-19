import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFleet } from '../../contexts/FleetContext.js';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  RotateCcw,
  Copy,
  Check,
  ShieldAlert,
  Cpu,
  Fuel,
  TrendingDown,
  Info,
  Loader2
} from 'lucide-react';

interface GeminiFleetCopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export const GeminiFleetCopilotModal: React.FC<GeminiFleetCopilotModalProps> = ({ isOpen, onClose }) => {
  const { selectedVehicle, selectedDevice, vehicles, activeAlerts } = useFleet();

  const [inputPrompt, setInputPrompt] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `👋 Hello! I am **Gemini Fleet Copilot**, your real-time AI telematics and anti-fuel theft intelligence advisor.\n\nI have access to live telemetry from **${vehicles.length} fleet vehicles**, hardware status for **${selectedDevice?.deviceId || 'ESP32 units'}**, and the active theft detection threshold engine. How can I assist your fleet operations today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const quickPrompts = [
    {
      label: 'Theft Risk Analysis',
      icon: ShieldAlert,
      prompt: `Analyze fuel theft risks and sudden drop anomalies across our vehicles right now.`
    },
    {
      label: 'ESP32 Diagnostic',
      icon: Cpu,
      prompt: `Diagnose device ${selectedDevice?.deviceId || 'ESP32'} status, ADC pin GPIO34 readings, and GPS fix state.`
    },
    {
      label: 'Fuel Economy Audit',
      icon: Fuel,
      prompt: `Audit the fuel burn rate and reduction trend for ${selectedVehicle?.vehicleName || 'our active fleet'}.`
    },
    {
      label: 'Algorithm Guidance',
      icon: TrendingDown,
      prompt: `Explain how the 5-point calibration curve and slosh filter prevent false alarms during truck braking.`
    }
  ];

  const handleSend = async (textToSend?: string) => {
    const prompt = (textToSend || inputPrompt).trim();
    if (!prompt || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          vehicleId: selectedVehicle?.id
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to get response from Gemini Copilot');
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.reply || 'Analysis completed.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: `⚠️ **AI Service Notice**: ${err.message || 'Unable to connect to Gemini AI model at this moment. Please check your connectivity and try again.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'ai',
        text: `Chat cleared. Ready for your next fleet analysis query or ESP32 diagnostic task!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/85 backdrop-blur-md p-3 sm:p-6 flex min-h-screen items-center justify-center">
      <div className="relative w-full max-w-3xl bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh] my-auto animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-zinc-800 bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-zinc-100">Gemini Fleet AI Copilot</h3>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                  gemini-3.7-flash
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-400 flex items-center gap-2">
                <span>Active Context:</span>
                <span className="text-emerald-400 font-medium">{selectedVehicle ? `${selectedVehicle.vehicleNumber} (${selectedVehicle.vehicleName})` : 'All Fleet Vehicles'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetChat}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition cursor-pointer"
              title="Reset conversation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Context Banner */}
        <div className="px-5 py-2 bg-zinc-950/60 border-b border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400 overflow-x-auto gap-4">
          <div className="flex items-center gap-4 shrink-0">
            <span className="flex items-center gap-1.5">
              <Fuel className="w-3.5 h-3.5 text-amber-400" />
              Fuel: <strong className="text-zinc-200">{selectedVehicle?.currentFuelLiters || 0} L ({selectedVehicle?.currentFuelPercentage || 0}%)</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              ESP32: <strong className={selectedDevice?.status === 'ONLINE' ? 'text-emerald-400' : 'text-rose-400'}>{selectedDevice?.status || 'OFFLINE'}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              Alerts: <strong className="text-zinc-200">{activeAlerts.length} Active</strong>
            </span>
          </div>
          <span className="text-[11px] text-zinc-500 hidden sm:inline-block">Ground Truth Telematics Injected</span>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-emerald-600 text-white rounded-tr-none shadow-md'
                    : 'bg-zinc-800/90 border border-zinc-700/60 text-zinc-200 rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans space-y-1.5">
                  {msg.text.split('\n\n').map((paragraph, idx) => (
                    <p key={idx} className="leading-relaxed">
                      {paragraph.split('**').map((part, i) =>
                        i % 2 === 1 ? <strong key={i} className="text-emerald-300 font-semibold">{part}</strong> : part
                      )}
                    </p>
                  ))}
                </div>

                <div className="mt-2 flex items-center justify-between pt-1 border-t border-zinc-700/40 text-[10px] text-zinc-400">
                  <span>{msg.timestamp}</span>
                  {msg.sender === 'ai' && (
                    <button
                      onClick={() => handleCopy(msg.id, msg.text)}
                      className="hover:text-zinc-200 flex items-center gap-1 transition"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-zinc-700 flex items-center justify-center text-zinc-200 shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-zinc-800/90 border border-zinc-700/60 rounded-2xl rounded-tl-none p-3.5 flex items-center gap-2.5 text-xs text-zinc-300">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Gemini is analyzing fleet telemetry & computing diagnostics...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-zinc-950/40 border-t border-zinc-800/80 overflow-x-auto flex items-center gap-2">
          {quickPrompts.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={() => handleSend(item.prompt)}
                disabled={isLoading}
                className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 rounded-full transition disabled:opacity-50"
              >
                <Icon className="w-3 h-3 text-emerald-400" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 sm:p-4 bg-zinc-900 border-t border-zinc-800 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder={`Ask Gemini about fuel telemetry, ESP32 ADC pinouts, or theft events...`}
            disabled={isLoading}
            className="flex-1 bg-zinc-800/90 border border-zinc-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
          />
          <button
            type="submit"
            disabled={!inputPrompt.trim() || isLoading}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center gap-2 text-xs sm:text-sm transition shadow-md"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span className="hidden sm:inline">Ask AI</span>
          </button>
        </form>

      </div>
    </div>,
    document.body
  );
};
