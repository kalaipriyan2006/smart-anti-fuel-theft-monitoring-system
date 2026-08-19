import React from 'react';
import { useAuth } from '../../contexts/AuthContext.js';
import { useFleet } from '../../contexts/FleetContext.js';
import {
  LayoutDashboard,
  Truck,
  Cpu,
  Fuel,
  Sliders,
  MapPin,
  AlertTriangle,
  FileSpreadsheet,
  Compass,
  Route,
  BarChart3,
  Bell,
  HeadphonesIcon,
  ShieldCheck,
  History,
  UserCheck,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, isOpen, onClose }) => {
  const { user, isAdmin } = useAuth();
  const { activeAlerts, unreadNotifications } = useFleet();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'vehicles', label: 'Vehicles Fleet', icon: Truck },
    { id: 'devices', label: 'ESP32 Devices', icon: Cpu },
    { id: 'fuel', label: 'Fuel Monitoring', icon: Fuel },
    { id: 'calibration', label: 'Sensor Calibration', icon: Sliders },
    { id: 'gps', label: 'Live GPS Map', icon: MapPin },
    {
      id: 'alerts',
      label: 'Active Alerts',
      icon: AlertTriangle,
      badge: activeAlerts.length > 0 ? activeAlerts.length : undefined,
      badgeColor: 'bg-rose-600 text-white'
    },
    { id: 'incidents', label: 'Incidents & Thefts', icon: FileSpreadsheet },
    { id: 'geofences', label: 'Geofencing', icon: Compass },
    { id: 'trips', label: 'Trip History', icon: Route },
    { id: 'analytics', label: 'Fleet Analytics', icon: BarChart3 },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      badge: unreadNotifications.length > 0 ? unreadNotifications.length : undefined,
      badgeColor: 'bg-emerald-600 text-zinc-950 font-bold'
    },
    // Customer Care is ONLY accessible after authentication
    { id: 'customercare', label: 'Customer Care & FAQ', icon: HeadphonesIcon },
  ];

  const adminItems = [
    { id: 'admin', label: 'Admin Web Panel', icon: ShieldCheck },
    { id: 'audit', label: 'Audit Security Logs', icon: History }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-zinc-900 border-r border-zinc-800 transition-transform duration-200 ease-in-out lg:translate-x-0 overflow-y-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-3 space-y-6">
          {/* Main Navigation */}
          <div>
            <div className="px-3 pb-2 text-[10px] uppercase tracking-wider font-semibold text-zinc-500">
              Fleet Operations
            </div>
            <nav className="space-y-0.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      onClose?.();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                      isActive
                        ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/30'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-zinc-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Admin & Security Section */}
          {isAdmin && (
            <div>
              <div className="px-3 pb-2 text-[10px] uppercase tracking-wider font-semibold text-zinc-500">
                System Administration
              </div>
              <nav className="space-y-0.5">
                {adminItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.id);
                        onClose?.();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                        isActive
                          ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/30'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-zinc-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
                    </button>
                  );
                })}
              </nav>
            </div>
          )}

          {/* Gemini AI Copilot Status Card */}
          <div className="p-3 bg-gradient-to-br from-emerald-950/40 to-zinc-950/80 border border-emerald-500/20 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Gemini 2.5 Flash
              </span>
              <span className="px-1.5 py-0.5 text-[9px] font-bold bg-emerald-500/20 text-emerald-400 rounded-full">ACTIVE</span>
            </div>
            <p className="text-[10px] text-zinc-400 leading-normal">
              Autonomous theft forensics, fuel analytics & ESP32 hardware diagnostics.
            </p>
          </div>

          {/* Hardware Specs Card */}
          <div className="p-3 bg-zinc-950/70 border border-zinc-800/80 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span className="font-semibold text-zinc-300">ESP32 Pinout Standards</span>
              <span className="font-mono text-emerald-400">v1.4.2</span>
            </div>
            <div className="text-[10px] font-mono text-zinc-400 space-y-1">
              <div className="flex justify-between">
                <span>Fuel ADC:</span>
                <span className="text-zinc-200">GPIO34</span>
              </div>
              <div className="flex justify-between">
                <span>NEO-6M GPS:</span>
                <span className="text-zinc-200">TX:16 / RX:17</span>
              </div>
              <div className="flex justify-between">
                <span>I2C OLED:</span>
                <span className="text-zinc-200">SDA:21 / SCL:22</span>
              </div>
              <div className="flex justify-between">
                <span>Buzzer (2N2222):</span>
                <span className="text-zinc-200">GPIO25</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
