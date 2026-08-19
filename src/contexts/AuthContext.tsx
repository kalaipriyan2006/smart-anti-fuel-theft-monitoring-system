import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types/index.js';
import { api } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (data: { fullName: string; email: string; mobile: string; password: string; role?: string }) => Promise<void>;
  logout: () => void;
  switchRoleForTesting?: (role: UserRole) => void;
  isAdmin: boolean;
  isSupport: boolean;
  isOwner: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    if (!localStorage.getItem('saftms_token')) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      setUser(res.user);
    } catch (err) {
      setUser(null);
      api.setToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.login(email, pass);
    setUser(res.user);
  };

  const register = async (data: { fullName: string; email: string; mobile: string; password: string; role?: string }) => {
    const res = await api.register(data);
    setUser(res.user);
  };

  const logout = () => {
    api.setToken(null);
    setUser(null);
  };

  // Quick helper to switch roles in development if needed
  const switchRoleForTesting = (role: UserRole) => {
    if (user) {
      setUser({ ...user, role });
    }
  };

  const isAdmin = user?.role === 'ADMIN';
  const isSupport = user?.role === 'SUPPORT_AGENT' || user?.role === 'ADMIN';
  const isOwner = user?.role === 'VEHICLE_OWNER';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        switchRoleForTesting,
        isAdmin,
        isSupport,
        isOwner,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
