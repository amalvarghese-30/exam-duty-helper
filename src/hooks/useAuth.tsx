import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

type UserRole = "admin" | "teacher" | null;

interface AuthContextType {
  user: { id: string; email: string; name?: string } | null;
  role: UserRole;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const API = "http://localhost:5000";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string; name?: string } | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored session
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        // Determine role (could be stored or fetched from backend)
        const storedRole = localStorage.getItem('role') as UserRole;
        setRole(storedRole || (parsedUser.email === 'admin@test.com' ? 'admin' : 'teacher'));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await axios.post(`${API}/auth/login`, { email, password });
      const { token, user: userData, role: userRole } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('role', userRole);

      setUser(userData);
      setRole(userRole);

      return { error: null };
    } catch (error: any) {
      console.error('Login failed:', error);
      return { error: new Error(error.response?.data?.error || 'Login failed') };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const response = await axios.post(`${API}/auth/register`, { email, password, fullName });
      const { token, user: userData, role: userRole } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('role', userRole);

      setUser(userData);
      setRole(userRole);

      return { error: null };
    } catch (error: any) {
      console.error('Registration failed:', error);
      return { error: new Error(error.response?.data?.error || 'Registration failed') };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    setUser(null);
    setRole(null);
    toast.success('Signed out successfully');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        signIn,
        signUp,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}