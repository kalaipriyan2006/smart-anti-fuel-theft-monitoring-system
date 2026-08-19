import {
  User,
  ESP32Device,
  Vehicle,
  CalibrationProfile,
  FuelReading,
  GpsReading,
  Alert,
  Incident,
  Geofence,
  Trip,
  SupportTicket,
  NotificationItem,
  AuditLog,
  DetectionSettings
} from '../types/index.js';

const API_BASE = '/api';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('saftms_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('saftms_token', token);
    } else {
      localStorage.removeItem('saftms_token');
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: `HTTP ${res.status}: ${res.statusText || 'Request failed'}` }));
        throw new Error(errorData.error || `HTTP error ${res.status}`);
      }

      return res.json();
    } catch (err: any) {
      if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
        throw new Error('Connection to telemetry service lost. Reconnecting...');
      }
      throw err;
    }
  }

  // Real-time SSE Stream
  subscribeRealtime(onMessage: (event: string, data: any) => void) {
    let evtSource: EventSource | null = null;
    let isClosed = false;

    try {
      evtSource = new EventSource(`${API_BASE}/realtime/stream`);
      
      const safeParse = (dataStr: string) => {
        try {
          return JSON.parse(dataStr);
        } catch {
          return null;
        }
      };

      evtSource.addEventListener('device_heartbeat', (e) => {
        const data = safeParse(e.data);
        if (data && !isClosed) onMessage('device_heartbeat', data);
      });
      evtSource.addEventListener('fuel_reading', (e) => {
        const data = safeParse(e.data);
        if (data && !isClosed) onMessage('fuel_reading', data);
      });
      evtSource.addEventListener('gps_update', (e) => {
        const data = safeParse(e.data);
        if (data && !isClosed) onMessage('gps_update', data);
      });
      evtSource.addEventListener('alert_updated', (e) => {
        const data = safeParse(e.data);
        if (data && !isClosed) onMessage('alert_updated', data);
      });

      evtSource.onerror = () => {
        // Silently let browser EventSource auto-reconnect without throwing uncaught UI crashes
      };
    } catch (e) {
      console.warn('Realtime SSE stream initialization:', e);
    }

    return () => {
      isClosed = true;
      if (evtSource) {
        evtSource.close();
      }
    };
  }

  // Auth
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const data = await this.request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    this.setToken(data.token);
    return data;
  }

  async register(data: { fullName: string; email: string; mobile: string; password: string; role?: string }): Promise<{ user: User; token: string }> {
    const res = await this.request<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    this.setToken(res.token);
    return res;
  }

  async getMe(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/auth/me');
  }

  async updateProfile(userId: string, data: { fullName?: string; mobile?: string }): Promise<{ user: User }> {
    return this.request<{ user: User }>('/auth/update-profile', {
      method: 'POST',
      body: JSON.stringify({ userId, ...data })
    });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ status: string }> {
    return this.request<{ status: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ userId, currentPassword, newPassword })
    });
  }

  // Vehicles
  async getVehicles(userId?: string): Promise<Vehicle[]> {
    const q = userId ? `?userId=${userId}` : '';
    return this.request<Vehicle[]>(`/vehicles${q}`);
  }

  async createVehicle(data: Partial<Vehicle>): Promise<Vehicle> {
    return this.request<Vehicle>('/vehicles', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateVehicle(id: string, data: Partial<Vehicle>): Promise<Vehicle> {
    return this.request<Vehicle>(`/vehicles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteVehicle(id: string): Promise<{ status: string }> {
    return this.request<{ status: string }>(`/vehicles/${id}`, {
      method: 'DELETE'
    });
  }

  // Devices
  async getDevices(userId?: string): Promise<ESP32Device[]> {
    const q = userId ? `?userId=${userId}` : '';
    return this.request<ESP32Device[]>(`/devices${q}`);
  }

  async registerDevice(data: { deviceId: string; name: string; userId: string; vehicleId?: string }): Promise<ESP32Device> {
    return this.request<ESP32Device>('/devices/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async linkDevice(deviceId: string, vehicleId: string): Promise<{ status: string; device: ESP32Device; vehicle: Vehicle }> {
    return this.request('/devices/link', {
      method: 'POST',
      body: JSON.stringify({ deviceId, vehicleId })
    });
  }

  async unlinkDevice(deviceId: string): Promise<{ status: string }> {
    return this.request('/devices/unlink', {
      method: 'POST',
      body: JSON.stringify({ deviceId })
    });
  }

  // Test payload submission (Simulates hardware packet for testing physical/live pipelines)
  async sendDevicePacket(packet: {
    deviceId: string;
    secretKey?: string;
    rawAdc: number;
    wifiRSSI?: number;
    firmwareVersion?: string;
    gps?: {
      latitude: number;
      longitude: number;
      speedKmh?: number;
      satellites?: number;
      gpsFix: boolean;
    };
    sensorStatus?: string;
  }): Promise<any> {
    return this.request('/device/packet', {
      method: 'POST',
      headers: {
        'X-ESP32-Device-ID': packet.deviceId,
        ...(packet.secretKey ? { 'X-ESP32-Secret-Key': packet.secretKey } : {})
      },
      body: JSON.stringify(packet)
    });
  }

  // Fuel & Calibration
  async getFuelReadings(vehicleId?: string, limit = 100): Promise<FuelReading[]> {
    const q = vehicleId ? `?vehicleId=${vehicleId}&limit=${limit}` : `?limit=${limit}`;
    return this.request<FuelReading[]>(`/fuel/readings${q}`);
  }

  async getCalibration(vehicleId: string): Promise<CalibrationProfile> {
    return this.request<CalibrationProfile>(`/fuel/calibration/${vehicleId}`);
  }

  async updateCalibration(vehicleId: string, data: Partial<CalibrationProfile> & { userEmail?: string }): Promise<CalibrationProfile> {
    return this.request<CalibrationProfile>(`/fuel/calibration/${vehicleId}`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Alerts & Incidents
  async getAlerts(vehicleId?: string, severity?: string, status?: string): Promise<Alert[]> {
    const params = new URLSearchParams();
    if (vehicleId) params.append('vehicleId', vehicleId);
    if (severity) params.append('severity', severity);
    if (status) params.append('status', status);
    return this.request<Alert[]>(`/alerts?${params.toString()}`);
  }

  async acknowledgeAlert(alertId: string, data: { userId?: string; userName?: string }): Promise<Alert> {
    return this.request<Alert>(`/alerts/${alertId}/acknowledge`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async resolveAlert(alertId: string, data: { userId?: string; userName?: string; notes?: string }): Promise<Alert> {
    return this.request<Alert>(`/alerts/${alertId}/resolve`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getIncidents(vehicleId?: string): Promise<Incident[]> {
    const q = vehicleId ? `?vehicleId=${vehicleId}` : '';
    return this.request<Incident[]>(`/incidents${q}`);
  }

  async updateIncidentStatus(id: string, data: { status: string; assignedAgent?: string; resolutionNotes?: string; userName?: string }): Promise<Incident> {
    return this.request<Incident>(`/incidents/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async addIncidentTimeline(id: string, event: string, userName?: string): Promise<Incident> {
    return this.request<Incident>(`/incidents/${id}/timeline`, {
      method: 'POST',
      body: JSON.stringify({ event, userName })
    });
  }

  // GPS & Geofences & Trips
  async getLatestGps(vehicleId?: string): Promise<GpsReading | null> {
    const q = vehicleId ? `?vehicleId=${vehicleId}` : '';
    return this.request<GpsReading | null>(`/gps/latest${q}`);
  }

  async getGpsHistory(vehicleId?: string): Promise<GpsReading[]> {
    const q = vehicleId ? `?vehicleId=${vehicleId}` : '';
    return this.request<GpsReading[]>(`/gps/history${q}`);
  }

  async getGeofences(userId?: string): Promise<Geofence[]> {
    const q = userId ? `?userId=${userId}` : '';
    return this.request<Geofence[]>(`/geofences${q}`);
  }

  async createGeofence(data: Partial<Geofence>): Promise<Geofence> {
    return this.request<Geofence>('/geofences', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async deleteGeofence(id: string): Promise<{ status: string }> {
    return this.request<{ status: string }>(`/geofences/${id}`, {
      method: 'DELETE'
    });
  }

  async getTrips(vehicleId?: string): Promise<Trip[]> {
    const q = vehicleId ? `?vehicleId=${vehicleId}` : '';
    return this.request<Trip[]>(`/trips${q}`);
  }

  // Analytics
  async getAnalytics(vehicleId?: string): Promise<any> {
    const q = vehicleId ? `?vehicleId=${vehicleId}` : '';
    return this.request(`/analytics${q}`);
  }

  // Support
  async getSupportTickets(userId?: string, role?: string): Promise<SupportTicket[]> {
    const q = userId ? `?userId=${userId}&role=${role || ''}` : '';
    return this.request<SupportTicket[]>(`/support/tickets${q}`);
  }

  async createTicket(data: Partial<SupportTicket>): Promise<SupportTicket> {
    return this.request<SupportTicket>('/support/tickets', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async addTicketMessage(ticketId: string, data: { senderId: string; senderName: string; senderRole: string; message: string; attachmentUrl?: string }): Promise<SupportTicket> {
    return this.request<SupportTicket>(`/support/tickets/${ticketId}/message`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateTicketStatus(ticketId: string, data: { status: string; assignedAgent?: string; assignedAgentName?: string }): Promise<SupportTicket> {
    return this.request<SupportTicket>(`/support/tickets/${ticketId}/status`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // Notifications
  async getNotifications(userId?: string): Promise<NotificationItem[]> {
    const q = userId ? `?userId=${userId}` : '';
    return this.request<NotificationItem[]>(`/notifications${q}`);
  }

  async markNotificationRead(notifId: string): Promise<void> {
    await this.request('/notifications/mark-read', {
      method: 'POST',
      body: JSON.stringify({ notifId })
    });
  }

  async markAllNotificationsRead(userId?: string): Promise<void> {
    await this.request('/notifications/mark-all-read', {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  }

  // Audit Logs & Admin
  async getAuditLogs(): Promise<AuditLog[]> {
    return this.request<AuditLog[]>('/audit-logs');
  }

  async getAdminOverview(): Promise<any> {
    return this.request('/admin/overview');
  }

  async getAdminSystemHealth(): Promise<any> {
    return this.request('/admin/system-health');
  }

  async getAdminUsers(): Promise<User[]> {
    return this.request<User[]>('/admin/users');
  }

  async updateUserRole(userId: string, role: string): Promise<User> {
    return this.request<User>(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role })
    });
  }

  async getDetectionSettings(): Promise<DetectionSettings> {
    return this.request<DetectionSettings>('/admin/detection-settings');
  }

  async updateDetectionSettings(settings: Partial<DetectionSettings>): Promise<DetectionSettings> {
    return this.request<DetectionSettings>('/admin/detection-settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  }
}

export const api = new ApiService();
