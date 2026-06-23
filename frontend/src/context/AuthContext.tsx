import React, { createContext, useState, useCallback, ReactNode, useEffect } from 'react';

const AUTH_USER_COOKIE = 'spm_user';
const AUTH_TOKEN_COOKIE = 'spm_token';

function getCookie(name: string): string | null {
  const cookie = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`));
  if (!cookie) return null;
  return decodeURIComponent(cookie.split('=').slice(1).join('='));
}

function isJwtExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1]));
    const exp = Number(payload?.exp || 0);
    if (!exp) return false;
    return Date.now() >= exp * 1000;
  } catch {
    return true;
  }
}

function bootstrapAuthFromCookies(): User | null {
  const cookieUser = getCookie(AUTH_USER_COOKIE);
  const cookieToken = getCookie(AUTH_TOKEN_COOKIE);

  if (!cookieUser || !cookieToken) {
    return null;
  }

  // Check if token is expired
  if (isJwtExpired(cookieToken)) {
    console.log('Cookie token expired');
    return null;
  }

  try {
    return JSON.parse(cookieUser) as User;
  } catch {
    return null;
  }
}

export interface UserPermissions {
  can_view_products?: boolean;
  can_view_tasks?: boolean;
  can_view_emd?: boolean;
  can_view_insurance?: boolean;
  can_view_sepl?: boolean;
  can_create_sepl?: boolean;
  can_delete_sepl?: boolean;
  can_view_billing_portal?: boolean;
  can_create_billing_portal?: boolean;
  can_delete_billing_portal?: boolean;
  can_view_hr_recruitment?: boolean;
  can_create_hr_recruitment?: boolean;
  can_delete_hr_recruitment?: boolean;
  can_view_letters?: boolean;
  can_create_letters?: boolean;
  can_delete_letters?: boolean;
  is_authorized_signatory?: boolean;
  can_view_tasktracker?: boolean;
  can_create_tasktracker?: boolean;
  can_delete_tasktracker?: boolean;
  is_admin?: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  permissions?: UserPermissions;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissionsLoaded: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User | null) => void;
  setIsLoading: (loading: boolean) => void;
  fetchPermissions: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => bootstrapAuthFromCookies());
  const [isLoading, setIsLoading] = useState(false);
  const [permissionsLoaded, setPermissionsLoaded] = useState(true);

  // Check cookies periodically in case user logs in via main portal
  useEffect(() => {
    const checkCookies = () => {
      const currentUser = bootstrapAuthFromCookies();
      if (!user && currentUser) {
        // User logged in via main portal
        console.log('Detected login from main portal');
        setUser(currentUser);
      } else if (user && !currentUser) {
        // User logged out or session expired
        console.log('Detected logout or session expiry');
        setUser(null);
      }
    };

    // Check every 5 seconds
    const interval = setInterval(checkCookies, 5000);
    
    return () => clearInterval(interval);
  }, [user]);

  const login = useCallback((newUser: User, token: string) => {
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Clear MSAL cache so next login asks for credentials
    Object.keys(localStorage).filter(
      (k) => k.startsWith('msal.') || k.includes('msal') || k.includes('authority')
    ).forEach((k) => localStorage.removeItem(k));
    // Clear spm cookies
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `spm_token=; Path=/; Domain=.surbhi.net; Max-Age=0; SameSite=Lax${secure}`;
    document.cookie = `spm_user=; Path=/; Domain=.surbhi.net; Max-Age=0; SameSite=Lax${secure}`;
    document.cookie = `spm_just_logged_out=1; Path=/; Domain=.surbhi.net; Max-Age=300; SameSite=Lax${secure}`;
    // Redirect to main portal for logout
    window.location.href = 'https://demo.surbhi.net/login?logged_out=1';
  }, []);

  const fetchPermissions = useCallback(async () => {
    // Permissions are already in the user object from cookie
    setPermissionsLoaded(true);
  }, []);

  const contextValue: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    permissionsLoaded,
    login,
    logout,
    setUser,
    setIsLoading,
    fetchPermissions,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
