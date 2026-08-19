import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext.js';
import { FleetProvider } from './contexts/FleetContext.js';
import { Navbar } from './components/layout/Navbar.js';
import { Sidebar } from './components/layout/Sidebar.js';

// Pages
import { LandingPage } from './pages/landing/LandingPage.js';
import { LoginPage } from './pages/auth/LoginPage.js';
import { RegisterPage } from './pages/auth/RegisterPage.js';
import { DashboardPage } from './pages/dashboard/DashboardPage.js';
import { VehiclesPage } from './pages/vehicles/VehiclesPage.js';
import { DevicesPage } from './pages/devices/DevicesPage.js';
import { FuelPage } from './pages/fuel/FuelPage.js';
import { CalibrationPage } from './pages/fuel/CalibrationPage.js';
import { GpsPage } from './pages/gps/GpsPage.js';
import { AlertsPage } from './pages/alerts/AlertsPage.js';
import { IncidentsPage } from './pages/incidents/IncidentsPage.js';
import { GeofencesPage } from './pages/geofences/GeofencesPage.js';
import { TripsPage } from './pages/trips/TripsPage.js';
import { AnalyticsPage } from './pages/analytics/AnalyticsPage.js';
import { NotificationsPage } from './pages/notifications/NotificationsPage.js';
import { CustomerCarePage } from './pages/customercare/CustomerCarePage.js';
import { AdminPage } from './pages/admin/AdminPage.js';
import { AuditPage } from './pages/audit/AuditPage.js';
import { ProfilePage } from './pages/profile/ProfilePage.js';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-400 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        <span className="text-xs font-mono">Initializing Telemetry Engine...</span>
      </div>
    );
  }

  // When not authenticated:
  if (!user) {
    if (currentPage === 'login') {
      return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
          <header className="p-4 border-b border-zinc-850 flex items-center justify-between">
            <button
              onClick={() => setCurrentPage('landing')}
              className="text-xs text-zinc-400 hover:text-zinc-200 font-semibold"
            >
              &larr; Back to Overview
            </button>
          </header>
          <div className="flex-1 flex items-center justify-center">
            <LoginPage
              onSuccess={() => setCurrentPage('dashboard')}
              onNavigateRegister={() => setCurrentPage('register')}
            />
          </div>
        </div>
      );
    }

    if (currentPage === 'register') {
      return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
          <header className="p-4 border-b border-zinc-850 flex items-center justify-between">
            <button
              onClick={() => setCurrentPage('landing')}
              className="text-xs text-zinc-400 hover:text-zinc-200 font-semibold"
            >
              &larr; Back to Overview
            </button>
          </header>
          <div className="flex-1 flex items-center justify-center">
            <RegisterPage
              onSuccess={() => setCurrentPage('dashboard')}
              onNavigateLogin={() => setCurrentPage('login')}
            />
          </div>
        </div>
      );
    }

    return (
      <LandingPage
        onLoginClick={() => setCurrentPage('login')}
        onRegisterClick={() => setCurrentPage('register')}
        onGuestExplore={() => setCurrentPage('login')}
      />
    );
  }

  // Authenticated Application Shell
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage onNavigate={setCurrentPage} />;
      case 'vehicles':
        return <VehiclesPage />;
      case 'devices':
        return <DevicesPage />;
      case 'fuel':
        return <FuelPage onNavigateCalibration={() => setCurrentPage('calibration')} />;
      case 'calibration':
        return <CalibrationPage />;
      case 'gps':
        return <GpsPage />;
      case 'alerts':
        return <AlertsPage />;
      case 'incidents':
        return <IncidentsPage />;
      case 'geofences':
        return <GeofencesPage />;
      case 'trips':
        return <TripsPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'notifications':
        return <NotificationsPage onNavigate={setCurrentPage} />;
      case 'customercare':
        return <CustomerCarePage />;
      case 'admin':
        return <AdminPage />;
      case 'audit':
        return <AuditPage />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <DashboardPage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-emerald-500 selection:text-zinc-950">
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
        onNavigate={setCurrentPage}
      />

      <div className="flex-1 flex">
        <Sidebar
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <main className="flex-1 lg:pl-64 transition-all duration-200">
          {renderCurrentPage()}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <FleetProvider>
        <AppContent />
      </FleetProvider>
    </AuthProvider>
  );
}
