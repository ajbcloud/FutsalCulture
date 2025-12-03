import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth as useClerkAuth, useUser as useClerkUser, useClerk } from '@clerk/clerk-react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  profileImageUrl?: string;
  avatarColor?: string;
  avatarTextColor?: string;
  isAdmin?: boolean;
  isAssistant?: boolean;
  isSuperAdmin?: boolean;
  role?: string;
  tenantId?: string;
  planId?: string;
  billingStatus?: string;
  capabilities?: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasCapability: (capability: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { isSignedIn, isLoaded: clerkLoaded, getToken } = useClerkAuth();
  const { user: clerkUser } = useClerkUser();
  const { signOut } = useClerk();

  const fetchUser = async () => {
    try {
      // Get Clerk token - this validates the user is properly signed in
      const token = await getToken();
      
      console.log("🔐 AuthContext.fetchUser:", { 
        hasToken: !!token,
        tokenPreview: token ? token.substring(0, 50) + '...' : 'null',
        isSignedIn
      });
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        console.warn("⚠️ No Clerk token available - user may not be properly authenticated");
      }
      
      const response = await fetch('/api/auth/user', {
        headers,
        credentials: 'include'
      });
      
      console.log("🔐 AuthContext.fetchUser response:", { 
        status: response.status,
        ok: response.ok 
      });
      
      if (response.ok) {
        const userData = await response.json();
        console.log("✅ AuthContext user loaded:", { 
          id: userData.id, 
          email: userData.email,
          tenantId: userData.tenantId 
        });
        setUser(userData);
      } else {
        console.warn("❌ Failed to fetch user, status:", response.status);
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!clerkLoaded) {
      return;
    }
    
    if (isSignedIn) {
      fetchUser();
    } else {
      setUser(null);
      setLoading(false);
    }
  }, [isSignedIn, clerkLoaded, clerkUser?.id]);

  const login = async (_email: string, _password: string) => {
    window.location.href = '/login';
  };

  const logout = async () => {
    try {
      await signOut();
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
      setUser(null);
    }
  };

  const refreshUser = async () => {
    if (isSignedIn) {
      await fetchUser();
    }
  };

  const hasCapability = (capability: string): boolean => {
    return user?.capabilities?.includes(capability) ?? false;
  };

  const value = {
    user,
    loading: loading || !clerkLoaded,
    isAuthenticated: !!user && !!isSignedIn,
    isLoading: loading || !clerkLoaded,
    login,
    logout,
    refreshUser,
    hasCapability
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useHasCapability(capability: string): boolean {
  const { user } = useAuth();
  return user?.capabilities?.includes(capability) ?? false;
}
