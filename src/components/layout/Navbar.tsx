import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.js';
import { useFleet } from '../../contexts/FleetContext.js';
import { StatusBadge } from '../common/StatusBadge.js';
import { DeviceTesterModal } from '../common/DeviceTesterModal.js';
import { GeminiFleetCopilotModal } from '../ai/GeminiFleetCopilotModal.js';
import {
  Shield,
  Truck,
  Bell,
  Cpu,
  Radio,
  LogOut,
  User,
  ChevronDown,
  Menu,
  X,
  Sparkles,
  Check,
  Search,
  Fuel,
  Activity,
  Layers
} from 'lucide-react';
import { UserRole } from '../../types/index.js';

interface NavbarProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  onNavigate?: (page: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, isSidebarOpen, onNavigate }) => {
  const { user, logout, switchRoleForTesting } = useAuth();
  const {
    vehicles,
    selectedVehicleId,
    setSelectedVehicleId,
    selectedVehicle,
    selectedDevice,
    unreadNotifications,
    sseConnected
  } = useFleet();

  const [isTesterOpen, setIsTesterOpen] = useState<boolean>(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [isVehicleMenuOpen, setIsVehicleMenuOpen] = useState<boolean>(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState<boolean>(false);
  const [isNotifMenuOpen, setIsNotifMenuOpen] = useState<boolean>(false);
  const [vehicleSearch, setVehicleSearch] = useState<string>('');

  const vehicleMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (vehicleMenuRef.current && !vehicleMenuRef.current.contains(target)) {
        setIsVehicleMenuOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setIsProfileMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(target)) {
        setIsNotifMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredVehicles = vehicles.filter(
    (v) =>
      v.vehicleNumber.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
      v.vehicleName.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
      v.makeModel.toLowerCase().includes(vehicleSearch.toLowerCase())
  );

  return (
    <header className="sticky top-0 z-40 bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800 px-3 sm:px-5 lg:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4 select-none">
      
      {/* Left: Mobile Sidebar Toggle & Branding */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl transition"
          aria-label="Toggle navigation"
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <div
          className="flex items-center gap-2.5 cursor-pointer group"
          onClick={() => onNavigate && onNavigate('dashboard')}
          title="Go to Dashboard"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm group-hover:scale-105 transition">
            <Shield className="w-5 h-5" />
          </div>
          <div className="hidden md:block">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-emerald-400 flex items-center gap-1.5 leading-none">
              IoT Telemetry Fleet
              {sseConnected && (
                <span className="flex h-2 w-2 relative" title="Real-time SSE Live">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </div>
            <div className="text-sm font-bold text-zinc-100 tracking-tight leading-snug">
              SMART ANTI-FUEL THEFT
            </div>
          </div>
        </div>
      </div>

      {/* Center: Interactive Full Vehicle Selector & Status Badge */}
      {user && (
        <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-xl justify-center">
          
          {/* Custom Vehicle Dropdown */}
          <div className="relative" ref={vehicleMenuRef}>
            <button
              type="button"
              onClick={() => {
                setIsVehicleMenuOpen(!isVehicleMenuOpen);
                setIsProfileMenuOpen(false);
                setIsNotifMenuOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/90 hover:bg-zinc-800 border border-zinc-700/90 hover:border-zinc-600 rounded-xl text-xs text-zinc-100 transition shadow-sm"
              title="Select Active Vehicle"
            >
              <Truck className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="flex flex-col text-left">
                <span className="font-semibold text-zinc-100 font-mono tracking-tight leading-tight">
                  {selectedVehicle ? selectedVehicle.vehicleNumber : 'Select Vehicle'}
                </span>
                {selectedVehicle && (
                  <span className="text-[10px] text-zinc-400 hidden sm:inline leading-tight">
                    {selectedVehicle.vehicleName}
                  </span>
                )}
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${isVehicleMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Vehicle Selection Popup Panel */}
            {isVehicleMenuOpen && (
              <div className="absolute left-0 sm:left-1/2 sm:-translate-x-1/2 mt-2 w-72 sm:w-80 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95">
                <div className="px-2 py-1.5 border-b border-zinc-800 flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-emerald-400" />
                    Fleet Vehicles ({vehicles.length})
                  </span>
                  <button
                    onClick={() => {
                      setIsVehicleMenuOpen(false);
                      if (onNavigate) onNavigate('vehicles');
                    }}
                    className="text-[11px] text-emerald-400 hover:underline font-medium"
                  >
                    Manage Fleet
                  </button>
                </div>

                {/* Search Input */}
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search vehicle number or model..."
                    value={vehicleSearch}
                    onChange={(e) => setVehicleSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Vehicle List */}
                <div className="max-h-56 overflow-y-auto modal-scrollbar space-y-1">
                  {filteredVehicles.length === 0 ? (
                    <div className="p-4 text-center text-xs text-zinc-500">No vehicles found</div>
                  ) : (
                    filteredVehicles.map((v) => {
                      const isSelected = selectedVehicleId === v.id;
                      return (
                        <div
                          key={v.id}
                          onClick={() => {
                            setSelectedVehicleId(v.id);
                            setIsVehicleMenuOpen(false);
                          }}
                          className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2 ${
                            isSelected
                              ? 'bg-emerald-500/15 border-emerald-500/50 text-zinc-100'
                              : 'bg-zinc-800/40 hover:bg-zinc-800 border-zinc-800 text-zinc-300'
                          }`}
                        >
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-xs text-zinc-100">
                                {v.vehicleNumber}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 bg-zinc-800 text-zinc-400 rounded border border-zinc-700">
                                {v.fuelType}
                              </span>
                            </div>
                            <div className="text-[11px] text-zinc-400 truncate">
                              {v.vehicleName} &bull; {v.tankCapacityLiters}L Tank
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Real Hardware Online/Offline Status Badge */}
          <div className="hidden lg:flex items-center">
            <StatusBadge
              type="device"
              status={selectedDevice ? selectedDevice.status : undefined}
              isHistorical={selectedDevice?.status === 'OFFLINE'}
            />
          </div>
        </div>
      )}

      {/* Right: AI Copilot, Hardware Terminal, Alerts & Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        
        {/* Gemini AI Fleet Copilot Launcher */}
        <button
          onClick={() => setIsCopilotOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl transition shadow-sm hover:shadow-emerald-950/50 cursor-pointer"
          title="Open Gemini AI Copilot"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="hidden sm:inline font-bold">Gemini AI</span>
          <span className="sm:hidden font-bold">AI</span>
        </button>

        {/* Hardware Ingestion Terminal */}
        <button
          onClick={() => setIsTesterOpen(true)}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl transition shadow-sm cursor-pointer"
          title="Hardware Packet Tester & Rule Verification"
        >
          <Cpu className="w-3.5 h-3.5 text-zinc-400" />
          <span>ESP32 Test Terminal</span>
        </button>

        {/* Notifications Bell */}
        {user && (
          <div className="relative" ref={notifMenuRef}>
            <button
              onClick={() => {
                setIsNotifMenuOpen(!isNotifMenuOpen);
                setIsProfileMenuOpen(false);
                setIsVehicleMenuOpen(false);
              }}
              className="relative p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl transition cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifications.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-zinc-100 text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadNotifications.length}
                </span>
              )}
            </button>

            {/* Notification Menu Dropdown */}
            {isNotifMenuOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5 mb-2">
                  <span className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-emerald-400" />
                    Live System Alerts
                  </span>
                  <button
                    onClick={() => {
                      setIsNotifMenuOpen(false);
                      if (onNavigate) onNavigate('notifications');
                    }}
                    className="text-[11px] text-emerald-400 hover:underline font-medium"
                  >
                    View All History
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto modal-scrollbar space-y-2">
                  {unreadNotifications.length === 0 ? (
                    <div className="text-xs text-zinc-500 py-6 text-center">No unread notifications</div>
                  ) : (
                    unreadNotifications.map((n) => (
                      <div
                        key={n.id}
                        className="p-2.5 bg-zinc-800/60 hover:bg-zinc-800 rounded-xl border border-zinc-700/60 text-xs transition cursor-pointer"
                        onClick={() => {
                          setIsNotifMenuOpen(false);
                          if (onNavigate) onNavigate('alerts');
                        }}
                      >
                        <div className="font-semibold text-zinc-200 flex items-center justify-between">
                          <span>{n.title}</span>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-zinc-400 text-[11px] mt-0.5 leading-relaxed">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* User Profile & Role Switcher */}
        {user ? (
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => {
                setIsProfileMenuOpen(!isProfileMenuOpen);
                setIsNotifMenuOpen(false);
                setIsVehicleMenuOpen(false);
              }}
              className="flex items-center gap-2 p-1.5 bg-zinc-800/90 hover:bg-zinc-800 border border-zinc-700/80 rounded-xl transition cursor-pointer shadow-sm"
              title="User Profile & Roles"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-zinc-950 font-bold text-xs flex items-center justify-center shrink-0">
                {user.fullName.charAt(0)}
              </div>
              <div className="hidden lg:flex flex-col text-left pr-1 leading-tight">
                <span className="text-xs font-semibold text-zinc-200 whitespace-nowrap">
                  {user.fullName}
                </span>
                <span className="text-[10px] text-emerald-400 font-mono font-medium uppercase">
                  {user.role}
                </span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Profile Dropdown Panel */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95">
                <div className="p-2.5 border-b border-zinc-800 mb-1.5">
                  <div className="text-xs font-bold text-zinc-100">{user.fullName}</div>
                  <div className="text-[11px] text-zinc-400 truncate">{user.email}</div>
                  <div className="mt-1.5 text-[10px] uppercase font-mono px-2 py-0.5 bg-zinc-800 text-emerald-300 rounded-md border border-zinc-700 inline-block font-semibold">
                    {user.role}
                  </div>
                </div>

                {/* Role Switcher for QA / Live Testing */}
                <div className="p-2.5 border-b border-zinc-800 mb-1.5 bg-zinc-950/40 rounded-xl">
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-2">
                    Switch Active Role
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['ADMIN', 'VEHICLE_OWNER', 'SUPPORT_AGENT'] as UserRole[]).map((r) => (
                      <button
                        key={r}
                        onClick={() => {
                          switchRoleForTesting?.(r);
                          setIsProfileMenuOpen(false);
                        }}
                        className={`px-2 py-1.5 text-[10px] rounded-lg font-semibold transition ${
                          user.role === r
                            ? 'bg-emerald-500 text-zinc-950 shadow'
                            : 'bg-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700'
                        }`}
                      >
                        {r === 'VEHICLE_OWNER' ? 'Owner' : r === 'SUPPORT_AGENT' ? 'Support' : 'Admin'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      if (onNavigate) onNavigate('profile');
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl transition flex items-center gap-2"
                  >
                    <User className="w-3.5 h-3.5 text-zinc-400" />
                    Profile & Security Settings
                  </button>
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-950/40 rounded-xl transition flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate && onNavigate('login')}
              className="px-3.5 py-1.5 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl transition"
            >
              Login
            </button>
            <button
              onClick={() => onNavigate && onNavigate('register')}
              className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-zinc-950 rounded-xl transition shadow-md shadow-emerald-950"
            >
              Register
            </button>
          </div>
        )}
      </div>

      {/* Global Modals */}
      <DeviceTesterModal isOpen={isTesterOpen} onClose={() => setIsTesterOpen(false)} />
      <GeminiFleetCopilotModal isOpen={isCopilotOpen} onClose={() => setIsCopilotOpen(false)} />
    </header>
  );
};
