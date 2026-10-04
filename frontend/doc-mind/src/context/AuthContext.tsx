import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authService } from '../services/authService';
import type { LoginRequest, UserResponse } from '../types/auth';

interface AuthContextType {
  user: UserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (role: string) => boolean;
  isSuperAdmin: boolean;
  canAccessTenants: boolean;
  canAccessUsers: boolean;
  canAccessRoles: boolean;
  isAdmin: boolean;
}

const AUTH_SESSION_KEY = 'docmind_logged_in';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const userData = await authService.getMe();
      setUser(userData);
      sessionStorage.setItem(AUTH_SESSION_KEY, 'true');
    } catch (err) {
      setUser(null);
      sessionStorage.removeItem(AUTH_SESSION_KEY);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Only check session on boot if user previously logged in
  useEffect(() => {
    const hasSessionFlag = sessionStorage.getItem(AUTH_SESSION_KEY) === 'true';
    if (hasSessionFlag) {
      fetchCurrentUser().catch(() => {
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, [fetchCurrentUser]);

  // Automated background token refresh every 14 minutes when logged in
  useEffect(() => {
    if (!user) return;

    const FOURTEEN_MINUTES_MS = 14 * 60 * 1000;
    const timer = setInterval(async () => {
      try {
        await authService.refreshToken();
        console.log('[AuthContext] Access token refreshed automatically (14-minute timer)');
      } catch (err) {
        console.warn('[AuthContext] Automatic 14-minute token refresh failed:', err);
      }
    }, FOURTEEN_MINUTES_MS);

    return () => clearInterval(timer);
  }, [user]);

  const login = async (credentials: LoginRequest) => {
    setIsLoading(true);
    try {
      // 1. Hit public login API: POST /api/auth/login
      await authService.login(credentials);
      sessionStorage.setItem(AUTH_SESSION_KEY, 'true');
      // 2. Fetch current user after login succeeds
      await fetchCurrentUser();
    } catch (err) {
      sessionStorage.removeItem(AUTH_SESSION_KEY);
      setIsLoading(false);
      throw err;
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } catch {
      // Silently ignore logout network errors
    } finally {
      sessionStorage.removeItem(AUTH_SESSION_KEY);
      setUser(null);
      setIsLoading(false);
    }
  };

  const hasRole = (roleName: string): boolean => {
    if (!user || !user.authorities) return false;
    const cleanName = roleName.replace(/^ROLE_/, '').toUpperCase();
    return user.authorities.some(
      (auth) => auth.authority.replace(/^ROLE_/, '').toUpperCase() === cleanName
    );
  };

  const isSuperAdmin = Boolean(hasRole('PLATFORM_ADMIN'));

  const canAccessTenants = Boolean(hasRole('PLATFORM_ADMIN'));

  const canAccessUsers = Boolean(
    hasRole('PLATFORM_ADMIN') || hasRole('COMPANY_ADMIN') || hasRole('ADMIN')
  );

  const canAccessRoles = Boolean(
    hasRole('PLATFORM_ADMIN') || hasRole('COMPANY_ADMIN') || hasRole('ADMIN')
  );

  const isAdmin = Boolean(
    hasRole('PLATFORM_ADMIN') || hasRole('COMPANY_ADMIN') || hasRole('ADMIN')
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshUser: fetchCurrentUser,
        hasRole,
        isSuperAdmin,
        canAccessTenants,
        canAccessUsers,
        canAccessRoles,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
