import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext.js';
import { Shield, Lock, Mail, AlertCircle, ArrowRight, CheckCircle2, User } from 'lucide-react';

interface LoginPageProps {
  onSuccess?: () => void;
  onNavigateRegister?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess, onNavigateRegister }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState<string>('kpriyan997@gmail.com');
  const [password, setPassword] = useState<string>('Owner1234!');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-1">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-zinc-100">Sign In to IoT Monitoring</h1>
          <p className="text-xs text-zinc-400">
            Access real-time vehicle fuel telemetries & anti-theft controls
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/50 border border-rose-800/80 rounded-xl text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">Work Email Address</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                className="w-full px-3 py-2.5 pl-9 bg-zinc-850 border border-zinc-700 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
              />
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-zinc-300">Password</label>
            </div>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3 py-2.5 pl-9 bg-zinc-850 border border-zinc-700 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
              />
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-sm rounded-xl transition shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Role Profiles */}
        <div className="pt-4 border-t border-zinc-800 space-y-2">
          <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider text-center">
            Quick-Fill Role Credentials
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('kpriyan997@gmail.com', 'Owner1234!')}
              className="p-2 bg-zinc-850 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-left transition"
            >
              <div className="text-[11px] font-bold text-emerald-400">Fleet Owner</div>
              <div className="text-[9px] text-zinc-400 truncate">kpriyan997@...</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@antifueltheft.io', 'Admin1234!')}
              className="p-2 bg-zinc-850 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-left transition"
            >
              <div className="text-[11px] font-bold text-blue-400">Admin</div>
              <div className="text-[9px] text-zinc-400 truncate">admin@anti...</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('support@antifueltheft.io', 'Support1234!')}
              className="p-2 bg-zinc-850 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-left transition"
            >
              <div className="text-[11px] font-bold text-purple-400">Support</div>
              <div className="text-[9px] text-zinc-400 truncate">support@anti...</div>
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-zinc-400">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={onNavigateRegister}
            className="text-emerald-400 font-semibold hover:underline"
          >
            Register Fleet
          </button>
        </div>
      </div>
    </div>
  );
};
