import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../contexts/AuthContext.js';
import { useFleet } from '../../contexts/FleetContext.js';
import { api } from '../../services/api.js';
import {
  HeadphonesIcon,
  Plus,
  Send,
  HelpCircle,
  Cpu,
  Fuel,
  Radio,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Paperclip,
  X,
  ChevronDown,
  Shield,
  Sparkles,
  Loader2
} from 'lucide-react';
import { SupportTicket, TicketCategory, TicketPriority } from '../../types/index.js';

export const CustomerCarePage: React.FC = () => {
  const { user, isSupport } = useAuth();
  const { vehicles } = useFleet();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [newMessage, setNewMessage] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'tickets' | 'faq' | 'hardware-guide'>('tickets');
  const [isDraftingAi, setIsDraftingAi] = useState<boolean>(false);

  const handleAiDraftReply = async () => {
    if (!selectedTicket) return;
    setIsDraftingAi(true);
    try {
      const res = await fetch('/api/ai/draft-ticket-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketSubject: selectedTicket.subject,
          ticketDescription: selectedTicket.description,
          ticketCategory: selectedTicket.category,
          latestUserMessage: selectedTicket.messages[selectedTicket.messages.length - 1]?.message
        })
      });
      const data = await res.json();
      if (data.draft) {
        setNewMessage(data.draft);
      }
    } catch (err) {
      console.error('Failed to generate AI draft:', err);
    } finally {
      setIsDraftingAi(false);
    }
  };

  // New Ticket Modal Form
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [subject, setSubject] = useState<string>('');
  const [category, setCategory] = useState<TicketCategory>('ESP32_HARDWARE');
  const [priority, setPriority] = useState<TicketPriority>('MEDIUM');
  const [vehicleId, setVehicleId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await api.getSupportTickets(user.role === 'ADMIN' || user.role === 'SUPPORT_AGENT' ? undefined : user.id, user.role);
      setTickets(data);
      if (data.length > 0 && !selectedTicket) {
        setSelectedTicket(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [user]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !subject || !description) {
      setError('Please provide a subject and detailed description');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const newTicket = await api.createTicket({
        userId: user.id,
        userEmail: user.email,
        userName: user.fullName,
        vehicleId: vehicleId || undefined,
        category,
        subject,
        description,
        priority
      });
      await fetchTickets();
      setSelectedTicket(newTicket);
      setIsCreateOpen(false);
      setSubject('');
      setDescription('');
    } catch (err: any) {
      setError(err.message || 'Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !newMessage.trim() || !user) return;

    try {
      const updated = await api.addTicketMessage(selectedTicket.id, {
        senderId: user.id,
        senderName: user.fullName,
        senderRole: user.role,
        message: newMessage.trim()
      });
      setSelectedTicket(updated);
      setTickets(tickets.map(t => t.id === updated.id ? updated : t));
      setNewMessage('');
    } catch (err: any) {
      alert('Error sending message: ' + err.message);
    }
  };

  const handleUpdateStatus = async (status: any) => {
    if (!selectedTicket || !user) return;
    try {
      const updated = await api.updateTicketStatus(selectedTicket.id, {
        status,
        assignedAgent: user.id,
        assignedAgentName: user.fullName
      });
      setSelectedTicket(updated);
      setTickets(tickets.map(t => t.id === updated.id ? updated : t));
    } catch (err: any) {
      alert('Error updating status: ' + err.message);
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <HeadphonesIcon className="w-5 h-5 text-emerald-400" />
            <span>Customer Care, Support & Knowledge Base</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            24/7 Hardware field assistance, ticket dispatch, and physical sensor calibration guides
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-1 bg-zinc-900 border border-zinc-800 rounded-xl flex gap-1 text-xs">
            <button
              onClick={() => setActiveTab('tickets')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                activeTab === 'tickets' ? 'bg-emerald-600 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Support Tickets
            </button>
            <button
              onClick={() => setActiveTab('faq')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                activeTab === 'faq' ? 'bg-emerald-600 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              System FAQ
            </button>
            <button
              onClick={() => setActiveTab('hardware-guide')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                activeTab === 'hardware-guide' ? 'bg-emerald-600 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Field Guide
            </button>
          </div>

          {activeTab === 'tickets' && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs rounded-xl transition shadow-lg shadow-emerald-950"
            >
              <Plus className="w-4 h-4" />
              <span>Create Ticket</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'tickets' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tickets Sidebar List */}
          <div className="lg:col-span-1 space-y-3">
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-1">
              Active Support Cases ({tickets.length})
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-zinc-500">Loading support cases...</div>
            ) : tickets.length === 0 ? (
              <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl text-center text-xs text-zinc-400">
                No tickets open. Need help? Click "Create Ticket" above.
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {tickets.map((t) => {
                  const isSelected = selectedTicket?.id === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTicket(t)}
                      className={`p-3.5 rounded-xl border transition cursor-pointer space-y-2 ${
                        isSelected
                          ? 'bg-zinc-850 border-emerald-500/50 shadow-md'
                          : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-zinc-200 truncate max-w-[180px]">{t.subject}</span>
                        <span className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded font-bold ${
                          t.status === 'RESOLVED' ? 'bg-emerald-950 text-emerald-300' : 'bg-blue-950 text-blue-300'
                        }`}>
                          {t.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                        <span>{t.category}</span>
                        <span className={t.priority === 'CRITICAL' ? 'text-rose-400 font-bold' : 'text-zinc-500'}>
                          {t.priority}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Ticket Messages Thread */}
          <div className="lg:col-span-2">
            {selectedTicket ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col h-[650px]">
                {/* Ticket Header */}
                <div className="border-b border-zinc-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-zinc-100">{selectedTicket.subject}</h2>
                      <span className="text-[10px] font-mono bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">
                        #{selectedTicket.id}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-400 mt-1 flex items-center gap-2">
                      <span>Reported by {selectedTicket.userName} ({selectedTicket.userEmail})</span>
                      <span>•</span>
                      <span>{new Date(selectedTicket.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Status Dropdown / Controls */}
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => handleUpdateStatus(e.target.value)}
                      className="bg-zinc-800 border border-zinc-700 text-xs font-semibold text-zinc-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="IN_PROGRESS">IN PROGRESS</option>
                      <option value="WAITING_FOR_USER">WAITING FOR USER</option>
                      <option value="RESOLVED">RESOLVED</option>
                      <option value="CLOSED">CLOSED</option>
                    </select>
                  </div>
                </div>

                {/* Description Banner */}
                <div className="my-3 p-3 bg-zinc-950/70 rounded-xl border border-zinc-800/80 text-xs text-zinc-300 shrink-0">
                  <div className="text-[10px] uppercase font-semibold text-zinc-500 mb-1">Issue Description</div>
                  {selectedTicket.description}
                </div>

                {/* Message Bubble Thread */}
                <div className="flex-1 overflow-y-auto space-y-3 py-2 pr-1">
                  {selectedTicket.messages.map((m) => {
                    const isMe = m.senderId === user?.id;
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div className="text-[10px] text-zinc-500 mb-1 flex items-center gap-1.5 font-mono">
                          <span className="font-bold text-zinc-400">{m.senderName}</span>
                          <span>({m.senderRole})</span>
                          <span>•</span>
                          <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div
                          className={`p-3 rounded-xl text-xs max-w-lg leading-relaxed ${
                            isMe
                              ? 'bg-emerald-600/20 border border-emerald-500/40 text-emerald-100'
                              : 'bg-zinc-800 border border-zinc-700 text-zinc-200'
                          }`}
                        >
                          {m.message}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* AI Draft Assist Bar */}
                <div className="pt-2 flex items-center justify-between border-t border-zinc-800/80">
                  <span className="text-[11px] text-zinc-500">Need help resolving this ticket?</span>
                  <button
                    type="button"
                    onClick={handleAiDraftReply}
                    disabled={isDraftingAi}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/80 rounded-lg transition disabled:opacity-50"
                  >
                    {isDraftingAi ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    <span>{isDraftingAi ? 'Drafting with Gemini...' : 'AI Auto-Draft Resolution'}</span>
                  </button>
                </div>

                {/* Reply Box */}
                <form onSubmit={handleSendMessage} className="pt-2 flex items-center gap-2 shrink-0">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your response or technical advice..."
                    className="flex-1 px-3.5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-md shadow-emerald-950"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Reply</span>
                  </button>
                </form>
              </div>
            ) : (
              <div className="h-[500px] flex items-center justify-center bg-zinc-900 border border-zinc-800 rounded-2xl text-xs text-zinc-500">
                Select a ticket on the left to view the technical dialogue thread
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'faq' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            <span>Frequently Asked Operational Questions</span>
          </h2>

          <div className="space-y-3 pt-2 text-xs divide-y divide-zinc-800/80">
            <div className="pt-3 space-y-1">
              <h3 className="font-semibold text-zinc-200">How does the 5-stage calibration curve eliminate fuel sloshing errors?</h3>
              <p className="text-zinc-400 leading-relaxed">
                The platform utilizes a piecewise linear calibration profile mapping Empty, 25%, 50%, 75%, and Full tank levels to 12-bit ADC raw values (GPIO34). In addition, a 30-second moving average window dampens abrupt liquid oscillations caused by cornering and road gradients.
              </p>
            </div>

            <div className="pt-3 space-y-1">
              <h3 className="font-semibold text-zinc-200">What happens when an ESP32 loses GSM/WiFi connectivity?</h3>
              <p className="text-zinc-400 leading-relaxed">
                If no heartbeat packet is received within 45 seconds, the backend automatically flags the device as OFFLINE and dispatches a connectivity alert. When connectivity resumes, cached offline data packets are synced with original timestamp tags.
              </p>
            </div>

            <div className="pt-3 space-y-1">
              <h3 className="font-semibold text-zinc-200">How is the GPIO25 hardware buzzer triggered during a theft event?</h3>
              <p className="text-zinc-400 leading-relaxed">
                When consecutive fuel drop readings surpass the confirmed theft threshold while vehicle speed is 0 km/h, the server sends a command activating GPIO25. A 2N2222 transistor circuit steps up the 3.3V logic to sound the high-decibel 5V piezoelectric siren.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'hardware-guide' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="border-b border-zinc-800 pb-3">
            <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>Field Installation & Wiring Troubleshooting Guide</span>
            </h2>
            <p className="text-xs text-zinc-400">Step-by-step physical diagnostics for on-site fleet technicians</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-zinc-950/70 border border-zinc-800 rounded-xl space-y-2">
              <div className="text-emerald-400 font-bold">1. Fuel Sensor Signal Validation (GPIO34)</div>
              <p className="text-zinc-300 leading-relaxed">
                Ensure the sensor signal output wire connects directly to ESP32 Pin 34 (ADC1_CH6). Using ADC2 pins is prohibited because ADC2 conflicts with the ESP32 Wi-Fi / Cellular stack.
              </p>
            </div>

            <div className="p-4 bg-zinc-950/70 border border-zinc-800 rounded-xl space-y-2">
              <div className="text-emerald-400 font-bold">2. NEO-6M GPS UART Baud Rate (GPIO16 / GPIO17)</div>
              <p className="text-zinc-300 leading-relaxed">
                Verify TX module pin connects to ESP32 RX2 (Pin 16) and RX connects to TX2 (Pin 17). Default baud must be set to 9600. Ensure GPS antenna has unobstructed sky view.
              </p>
            </div>

            <div className="p-4 bg-zinc-950/70 border border-zinc-800 rounded-xl space-y-2">
              <div className="text-emerald-400 font-bold">3. LM2596 DC-DC Buck Converter Calibration</div>
              <p className="text-zinc-300 leading-relaxed">
                Vehicle electrical systems fluctuate between 12V and 28V (alternator charging). Tune the multiturn potentiometer to strictly output 5.0V DC before plugging in the ESP32 VIN.
              </p>
            </div>

            <div className="p-4 bg-zinc-950/70 border border-zinc-800 rounded-xl space-y-2">
              <div className="text-emerald-400 font-bold">4. Buzzer Transistor Relay Switching (GPIO25)</div>
              <p className="text-zinc-300 leading-relaxed">
                ESP32 GPIO pins supply a max of 12mA. Never drive a 5V 30mA buzzer directly from the pin. Always use a 2N2222 NPN transistor with a 1K Ohm base resistor and 1N4007 flyback diode.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Creating New Ticket */}
      {isCreateOpen && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/85 backdrop-blur-md p-4 flex min-h-screen items-center justify-center">
          <div className="relative bg-zinc-900 border border-zinc-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-auto max-h-[85vh] overflow-y-auto modal-scrollbar animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <HeadphonesIcon className="w-5 h-5 text-emerald-400" />
                <h2 className="text-sm font-bold text-zinc-100">Submit Technical Support Ticket</h2>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
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

            <form onSubmit={handleCreateTicket} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fuel sensor ADC fluctuating, ESP32 offline in Zone B"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-850 border border-zinc-700 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-zinc-850 border border-zinc-700 rounded-xl text-zinc-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="ESP32_HARDWARE">ESP32 Hardware</option>
                    <option value="FUEL_SENSOR">Fuel Sensor ADC</option>
                    <option value="GPS_TRACKING">GPS Tracking / Satellites</option>
                    <option value="DEVICE_OFFLINE">Device Offline</option>
                    <option value="THEFT_INCIDENT">Theft Investigation</option>
                    <option value="FALSE_ALERT">False Alarm Report</option>
                    <option value="WEBSITE_ISSUE">Platform / UI Issue</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 bg-zinc-850 border border-zinc-700 rounded-xl text-zinc-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Related Vehicle (Optional)</label>
                <select
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-850 border border-zinc-700 rounded-xl text-zinc-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">General / None</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vehicleNumber} ({v.vehicleName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Technical Problem Description</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide wiring pinouts, symptoms, error codes, or observed tank anomalies..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-850 border border-zinc-700 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3.5 py-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold rounded-xl transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Submitting...' : 'Dispatch Ticket'}
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
