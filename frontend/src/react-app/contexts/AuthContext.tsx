import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  user_id: string;
  email?: string;
  phone?: string;
  full_name?: string;
  last_name?: string;
  profile_picture_url?: string;
  onboarding_completed?: boolean;
  account_type?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isPending: boolean;
  login: () => void;
  logout: () => Promise<void>;
  redirectToLogin: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/users/me', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.profile) {
          setUser(data.profile);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
      setIsPending(false);
    }
  };

  const login = () => {
    window.location.href = '/login';
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      setUser(null);
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
      window.location.href = '/';
    }
  };

  const redirectToLogin = () => {
    window.location.href = '/login';
  };

  const refreshUser = async () => {
    await checkAuth();
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isPending,
    login,
    logout,
    redirectToLogin,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

