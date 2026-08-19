import React, { useState } from 'react';
import {
  Shield,
  Fuel,
  Cpu,
  Radio,
  Bell,
  Lock,
  ArrowRight,
  Activity,
  Layers,
  MapPin,
  CheckCircle2,
  Sliders,
  ChevronRight,
  Zap
} from 'lucide-react';

interface LandingPageProps {
  onLoginClick: () => void;
  onRegisterClick: () => void;
  onGuestExplore?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick, onRegisterClick, onGuestExplore }) => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'pinouts' | 'detection'>('architecture');

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-emerald-500 selection:text-zinc-950">
      {/* Public Header */}
      <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur border-b border-zinc-800/80 px-4 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase">IoT Hardware Platform</div>
            <div className="text-sm font-bold text-zinc-100 tracking-tight">ANTI-FUEL THEFT</div>
          </div>
        </div>

        {/* Public Navigation Items */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-zinc-400">
          <a href="#features" className="hover:text-zinc-200 transition">Features</a>
          <a href="#how-it-works" className="hover:text-zinc-200 transition">How It Works</a>
          <a href="#hardware" className="hover:text-zinc-200 transition">Hardware & Pinouts</a>
          <a href="#security" className="hover:text-zinc-200 transition">Security & RBAC</a>
          <a href="#about" className="hover:text-zinc-200 transition">About System</a>
        </nav>

        {/* Auth CTAs */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onLoginClick}
            className="px-3.5 py-1.5 text-xs font-semibold text-zinc-300 hover:text-zinc-100 hover:bg-zinc-850 border border-zinc-800 rounded-lg transition"
          >
            Login
          </button>
          <button
            onClick={onRegisterClick}
            className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-zinc-950 rounded-lg transition shadow-md shadow-emerald-950"
          >
            Register Fleet
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-4 lg:px-8 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs font-semibold mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Production ESP32 IoT Edge Telemetry
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-zinc-100 max-w-4xl mx-auto leading-tight sm:leading-none">
          SMART ANTI-FUEL <br />
          <span className="text-emerald-400">THEFT MONITORING SYSTEM</span>
        </h1>

        <p className="mt-5 text-sm sm:text-lg font-medium text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          REAL-TIME VEHICLE FUEL MONITORING, THEFT DETECTION AND GPS TRACKING
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onLoginClick}
            className="flex items-center gap-2 px-6 py-3 text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-xl transition shadow-lg shadow-emerald-950"
          >
            <span>Launch Web Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onRegisterClick}
            className="flex items-center gap-2 px-6 py-3 text-sm font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-xl transition"
          >
            <span>Create Owner Account</span>
          </button>
        </div>

        {/* Live System Preview Badge */}
        <div className="mt-14 p-4 sm:p-6 bg-zinc-900/70 border border-zinc-800 rounded-2xl text-left shadow-2xl backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
              <div>
                <div className="text-xs font-bold text-zinc-200">Hardware Telemetry Stream</div>
                <div className="text-[11px] text-zinc-500">Connected: ESP32 DevKit V1 • Baud: 115200 • ADC: 12-Bit</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <span className="px-2 py-1 bg-emerald-950/80 border border-emerald-800 rounded">ESP32: ONLINE</span>
              <span className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-zinc-300">GPS: FIX (10 SAT)</span>
              <span className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-zinc-300">CALIBRATED: 5-PT</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
            <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
              <div className="text-[11px] text-zinc-500 uppercase">Live Tank Capacity</div>
              <div className="text-xl font-bold text-zinc-100 mt-1">345.0 <span className="text-xs font-normal text-zinc-400">/ 450 L</span></div>
              <div className="text-[10px] text-emerald-400 mt-0.5">76.7% Level Calibrated</div>
            </div>
            <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
              <div className="text-[11px] text-zinc-500 uppercase">Rule Engine Status</div>
              <div className="text-xl font-bold text-emerald-400 mt-1">ARMED</div>
              <div className="text-[10px] text-zinc-400 mt-0.5">Threshold: 4.0L / 30s</div>
            </div>
            <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
              <div className="text-[11px] text-zinc-500 uppercase">GPS Fleet Coordinates</div>
              <div className="text-xl font-bold text-zinc-100 mt-1 font-mono text-sm">37.7749, -122.41</div>
              <div className="text-[10px] text-zinc-400 mt-0.5">Speed: 0.0 km/h (Parked)</div>
            </div>
            <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
              <div className="text-[11px] text-zinc-500 uppercase">Hardware Relay Buzzer</div>
              <div className="text-xl font-bold text-zinc-100 mt-1">GPIO25</div>
              <div className="text-[10px] text-zinc-400 mt-0.5">2N2222 Driver Circuit</div>
            </div>
          </div>
        </div>
      </section>

      {/* System Architecture & Pinout Interactive Explorer */}
      <section id="how-it-works" className="py-16 px-4 lg:px-8 border-t border-zinc-800/80 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100">End-to-End Enterprise Architecture</h2>
          <p className="mt-2 text-xs sm:text-sm text-zinc-400">
            Real physical vehicle sensing flowing directly through hardened ESP32 firmware into rule engines and live web interfaces.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex justify-center mb-6">
          <div className="p-1 bg-zinc-900 border border-zinc-800 rounded-xl flex gap-1 text-xs">
            <button
              onClick={() => setActiveTab('architecture')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeTab === 'architecture' ? 'bg-emerald-600 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              System Dataflow
            </button>
            <button
              onClick={() => setActiveTab('pinouts')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeTab === 'pinouts' ? 'bg-emerald-600 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              ESP32 Pinout Specifications
            </button>
            <button
              onClick={() => setActiveTab('detection')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeTab === 'detection' ? 'bg-emerald-600 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Multi-Stage Theft Rules
            </button>
          </div>
        </div>

        {/* Content Tabs */}
        {activeTab === 'architecture' && (
          <div className="p-6 bg-zinc-900/60 border border-zinc-800 rounded-2xl font-mono text-xs text-zinc-300 leading-relaxed overflow-x-auto">
            <div className="text-emerald-400 font-bold mb-3">// HARDWARE TO WEB PLATFORM PIPELINE</div>
            <pre className="text-zinc-300 whitespace-pre">
{`PHYSICAL VEHICLE (Tank Capacity: 100 - 1500 Liters)
        |
        v
FUEL SENSOR (Capacitive / Ultrasonic / Float Sensor)
        |
        v
ESP32 DEVKIT V1 MICROCONTROLLER
        |
        +-------- NEO-6M GPS MODULE (TX->16, RX->17)
        |
        +-------- 0.96" I2C OLED DISPLAY (SDA->21, SCL->22)
        |
        +-------- 5V ACTIVE BUZZER (GPIO25 -> 1K Resistor -> 2N2222 -> Buzzer)
        |
        v
SECURE INTERNET (HTTPS POST /api/device/packet with X-ESP32-Secret-Key)
        |
        v
BACKEND API & AUTHENTICATION (Node.js Express + Database)
        |
        v
DATA VALIDATION & CALIBRATION ENGINE (5-Stage Piecewise Linear Interpolation)
        |
        v
CLOUD DATABASE (Vehicles, Devices, Fuel, GPS, Incidents, Alerts)
        |
        +-------- REAL-TIME ENGINE (Server-Sent Events Instant Broadcast)
        |
        +-------- THEFT DETECTION RULE ENGINE (Multi-Stage Consecutive Validation)
        |
        +-------- ANALYTICS & GEOFENCING ENGINE
        |
        v
RESPONSIVE WEB PLATFORM (Desktop, Laptop, Tablet, Mobile)`}
            </pre>
          </div>
        )}

        {activeTab === 'pinouts' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <Cpu className="w-4 h-4" />
                <span>ESP32 Hardware Pin Assignments</span>
              </div>
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500">
                    <th className="pb-2">Component</th>
                    <th className="pb-2">ESP32 Pin</th>
                    <th className="pb-2">Signal Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300 font-mono">
                  <tr>
                    <td className="py-2 text-zinc-200">Fuel Level Sensor OUT</td>
                    <td className="py-2 text-emerald-400 font-bold">GPIO34</td>
                    <td className="py-2 text-zinc-400">12-Bit ADC (0 - 4095)</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-zinc-200">NEO-6M GPS TX</td>
                    <td className="py-2 text-emerald-400 font-bold">GPIO16 (RX2)</td>
                    <td className="py-2 text-zinc-400">UART 9600 Baud</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-zinc-200">NEO-6M GPS RX</td>
                    <td className="py-2 text-emerald-400 font-bold">GPIO17 (TX2)</td>
                    <td className="py-2 text-zinc-400">UART 9600 Baud</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-zinc-200">0.96" OLED SDA</td>
                    <td className="py-2 text-emerald-400 font-bold">GPIO21</td>
                    <td className="py-2 text-zinc-400">I2C Data</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-zinc-200">0.96" OLED SCL</td>
                    <td className="py-2 text-emerald-400 font-bold">GPIO22</td>
                    <td className="py-2 text-zinc-400">I2C Clock</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-zinc-200">Active Buzzer Control</td>
                    <td className="py-2 text-emerald-400 font-bold">GPIO25</td>
                    <td className="py-2 text-zinc-400">Digital OUTPUT (Relay/Transistor)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <Zap className="w-4 h-4" />
                <span>Power & Discrete Electronics</span>
              </div>
              <ul className="text-xs text-zinc-300 space-y-2 leading-relaxed">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>LM2596 Buck Converter:</strong> Steps down 12V / 24V vehicle battery power to clean 5.0V regulated DC for ESP32 and GPS.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>2N2222 NPN Transistor:</strong> Drives the 5V active buzzer triggered by GPIO25 3.3V logic level without overloading ESP32 GPIO pins.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>1K Ohm Resistor:</strong> Current limiting base resistor between GPIO25 and 2N2222 base.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>1N4007 Flyback Diode:</strong> Prevents inductive back-EMF spikes across the buzzer coil.</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'detection' && (
          <div className="p-6 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-4">
            <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              Multi-Stage Theft Confirmation Algorithm
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              To eliminate false alarms caused by vehicle vibrations, road gradient tilts, and electrical ADC noise, the platform utilizes strict multi-stage consecutive confirmation:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 font-mono text-xs">
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                <div className="text-emerald-400 font-bold mb-1">STAGE 1</div>
                <div className="text-zinc-200">Reading 1 (Drop Detected)</div>
                <div className="text-[11px] text-zinc-500 mt-1">Sensor flags drop &ge; threshold (e.g. 4.0L). Enters confirmation hold.</div>
              </div>
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                <div className="text-emerald-400 font-bold mb-1">STAGE 2</div>
                <div className="text-zinc-200">Reading 2 (Validation)</div>
                <div className="text-[11px] text-zinc-500 mt-1">Consecutive packet arrives. Checks if reduction is sustained over time window.</div>
              </div>
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                <div className="text-emerald-400 font-bold mb-1">STAGE 3</div>
                <div className="text-zinc-200">Rule Confirmation</div>
                <div className="text-[11px] text-zinc-500 mt-1">Verifies vehicle speed = 0 (stopped) and rate exceeds normal consumption.</div>
              </div>
              <div className="p-3 bg-rose-950/50 border border-rose-800/80 rounded-xl">
                <div className="text-rose-400 font-bold mb-1">TRIGGER</div>
                <div className="text-rose-200">Alarm & Notification</div>
                <div className="text-[11px] text-rose-300 mt-1">Activates GPIO25 Buzzer, generates critical incident & GPS location tag.</div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Key Features Grid */}
      <section id="features" className="py-16 px-4 lg:px-8 max-w-6xl mx-auto border-t border-zinc-800/80">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100">Enterprise Fleet Security Modules</h2>
          <p className="mt-2 text-xs sm:text-sm text-zinc-400">
            Engineered for logistics carriers, tankers, construction machinery, and industrial fuel storage.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl space-y-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Fuel className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-zinc-100">Real-Time Fuel Analytics</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Piecewise 5-stage calibration curve converting raw 12-bit ADC values to exact fuel liters with reduction rate telemetry.
            </p>
          </div>

          <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl space-y-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-zinc-100">Live GPS & Geofencing</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              NEO-6M satellite tracking with automated circular geofence boundary alerts for depots, parking terminals, and unauthorized routes.
            </p>
          </div>

          <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl space-y-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-zinc-100">Role-Based Access Control</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Multi-tier permissions for Admins, Vehicle Fleet Owners, and Hardware Support Specialists with tamper-evident audit logs.
            </p>
          </div>
        </div>
      </section>

      {/* Security & RBAC */}
      <section id="security" className="py-16 px-4 lg:px-8 max-w-6xl mx-auto border-t border-zinc-800/80">
        <div className="p-8 bg-zinc-900/80 border border-zinc-800 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-950/70 border border-emerald-800 text-emerald-400 text-xs font-semibold">
              <Lock className="w-3.5 h-3.5" />
              Hardware Device Authentication
            </div>
            <h3 className="text-2xl font-bold text-zinc-100">Zero-Trust IoT Ingestion</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Every physical ESP32 device requires a unique cryptographic secret token header (<code className="text-emerald-400">X-ESP32-Secret-Key</code>) and is strictly bound to a verified vehicle. Spoofed or unauthenticated packets are instantly rejected.
            </p>
          </div>

          <button
            onClick={onLoginClick}
            className="px-6 py-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-zinc-950 rounded-xl transition shadow-lg shadow-emerald-950 whitespace-nowrap"
          >
            Access Security Panel
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer id="about" className="py-10 px-4 lg:px-8 border-t border-zinc-800 text-center text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-zinc-400">Smart Anti-Fuel Theft Monitoring System</span>
          </div>
          <div>
            Connected to ESP32 DevKit V1 Hardware • Production Full-Stack Web Platform
          </div>
          <div>
            &copy; {new Date().getFullYear()} All Rights Reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
