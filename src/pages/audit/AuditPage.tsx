import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import {
  History,
  Shield,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Activity,
  Lock
} from 'lucide-react';
import { AuditLog } from '../../types/index.js';

export const AuditPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const data = await api.getAuditLogs();
        setLogs(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(l =>
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.userEmail.toLowerCase().includes(search.toLowerCase()) ||
    l.resource.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-400" />
            <span>Tamper-Evident Security Audit Logs</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Immutable tracking of operator logins, sensor calibration adjustments, vehicle bindings, and hardware key access
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search action or user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 pl-9 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
          />
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-zinc-500">Loading audit records...</div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 font-semibold uppercase text-[10px]">
                <th className="pb-3">Timestamp</th>
                <th className="pb-3">Action Executed</th>
                <th className="pb-3">User Operator</th>
                <th className="pb-3">Target Resource</th>
                <th className="pb-3">Outcome</th>
                <th className="pb-3">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono text-zinc-300">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-500 font-sans">
                    No matching audit log records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-850/50 transition">
                    <td className="py-3 text-zinc-400">
                      {new Date(log.timestamp).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </td>
                    <td className="py-3 font-semibold text-zinc-100">{log.action}</td>
                    <td className="py-3 text-emerald-400 font-sans text-xs">{log.userEmail}</td>
                    <td className="py-3 text-zinc-300">{log.resource}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.result === 'SUCCESS'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}>
                        {log.result}
                      </span>
                    </td>
                    <td className="py-3 text-zinc-500">{log.ipAddress || '127.0.0.1'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
