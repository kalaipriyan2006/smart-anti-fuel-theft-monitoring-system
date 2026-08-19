import React from 'react';
import { DeviceStatus, SensorStatus, GpsStatus } from '../../types/index.js';
import { Activity, Wifi, Radio, AlertTriangle, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  type: 'device' | 'sensor' | 'gps' | 'cloud' | 'alert' | 'health';
  status?: DeviceStatus | SensorStatus | GpsStatus | string;
  isHistorical?: boolean;
  score?: number;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, status, isHistorical, score }) => {
  if (type === 'device') {
    if (!status || status === 'UNAVAILABLE') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
          <XCircle className="w-3.5 h-3.5 text-zinc-500" />
          NO DEVICE CONNECTED
        </span>
      );
    }
    if (status === 'OFFLINE') {
      return (
        <div className="inline-flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-950/80 text-rose-300 border border-rose-800">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            ESP32 OFFLINE
          </span>
          {isHistorical && (
            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-amber-950/60 text-amber-300 border border-amber-800/80 rounded">
              HISTORICAL DATA
            </span>
          )}
        </div>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-800">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        ONLINE
      </span>
    );
  }

  if (type === 'sensor') {
    if (status === 'ERROR') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-950/80 text-rose-300 border border-rose-800">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          FUEL SENSOR ERROR
        </span>
      );
    }
    if (status === 'NORMAL') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-800">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          NORMAL
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
        INVALID SENSOR DATA
      </span>
    );
  }

  if (type === 'gps') {
    if (status === 'CONNECTED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-800">
          <Radio className="w-3.5 h-3.5 text-emerald-400" />
          CONNECTED
        </span>
      );
    }
    if (status === 'NO_FIX') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-950/70 text-amber-300 border border-amber-800">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          GPS NO FIX
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
        GPS UNAVAILABLE
      </span>
    );
  }

  if (type === 'cloud') {
    if (status === 'CONNECTED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-800">
          <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          CONNECTED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-950/80 text-rose-300 border border-rose-800">
        <XCircle className="w-3.5 h-3.5 text-rose-400" />
        CLOUD CONNECTION LOST
      </span>
    );
  }

  if (type === 'health') {
    if (score === undefined || score === null) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
          HEALTH DATA UNAVAILABLE
        </span>
      );
    }
    const colorClass =
      score >= 80
        ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800'
        : score >= 50
        ? 'bg-amber-950/70 text-amber-300 border-amber-800'
        : 'bg-rose-950/80 text-rose-300 border-rose-800';

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${colorClass}`}>
        <Activity className="w-3.5 h-3.5" />
        DEVICE HEALTH {score}%
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-zinc-800 text-zinc-300">
      {status || 'UNKNOWN'}
    </span>
  );
};
