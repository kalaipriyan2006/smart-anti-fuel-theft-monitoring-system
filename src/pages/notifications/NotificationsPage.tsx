import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.js';
import { useFleet } from '../../contexts/FleetContext.js';
import { api } from '../../services/api.js';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldAlert,
  Trash2,
  Clock,
  ExternalLink,
  Check
} from 'lucide-react';
import { NotificationItem } from '../../types/index.js';

interface NotificationsPageProps {
  onNavigate?: (page: string) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { refreshFleetData } = useFleet();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await api.getNotifications(user?.id);
      setNotifications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const handleMarkRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
      refreshFleetData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead(user?.id);
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      refreshFleetData();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = filter === 'UNREAD' ? notifications.filter(n => !n.isRead) : notifications;

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-400" />
            <span>System Notifications & Event Alerts</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time feed of physical ESP32 telemetry alerts, theft triggers, and hardware diagnostics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="p-1 bg-zinc-900 border border-zinc-800 rounded-xl flex gap-1 text-xs">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                filter === 'ALL' ? 'bg-emerald-600 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All Events ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('UNREAD')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                filter === 'UNREAD' ? 'bg-emerald-600 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Unread ({notifications.filter(n => !n.isRead).length})
            </button>
          </div>

          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl border border-zinc-700 transition"
          >
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mark All Read</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-zinc-500 text-xs">Loading notifications...</div>
      ) : filtered.length === 0 ? (
        <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-2xl text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-500 mx-auto">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="text-sm font-semibold text-zinc-300">All Caught Up</div>
          <p className="text-xs text-zinc-500">No new notifications in your inbox.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((notif) => {
            const isTheft = notif.type === 'THEFT_DETECTED' || notif.severity === 'CRITICAL';
            return (
              <div
                key={notif.id}
                className={`p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  !notif.isRead
                    ? 'bg-zinc-900 border-zinc-700 shadow-md'
                    : 'bg-zinc-950/60 border-zinc-800/80 opacity-80'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className={`p-2.5 rounded-xl shrink-0 ${
                    isTheft
                      ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                      : notif.severity === 'HIGH' || notif.severity === 'WARNING'
                      ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                      : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                  }`}>
                    {isTheft ? <ShieldAlert className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-xs font-bold ${!notif.isRead ? 'text-zinc-100' : 'text-zinc-300'}`}>
                        {notif.title}
                      </h3>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      )}
                      <span className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded font-bold ${
                        isTheft ? 'bg-rose-950 text-rose-300' : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        {notif.severity}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">
                      {notif.message}
                    </p>

                    <div className="text-[10px] text-zinc-500 font-mono pt-1">
                      {new Date(notif.createdAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {onNavigate && (
                    <button
                      onClick={() => {
                        handleMarkRead(notif.id);
                        if (isTheft) onNavigate('incidents');
                        else onNavigate('alerts');
                      }}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg border border-zinc-700 transition flex items-center gap-1.5"
                    >
                      <span>View Details</span>
                      <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                    </button>
                  )}

                  {!notif.isRead && (
                    <button
                      onClick={() => handleMarkRead(notif.id)}
                      className="p-1.5 text-zinc-500 hover:text-emerald-400 hover:bg-zinc-800 rounded-lg transition"
                      title="Mark as Read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
