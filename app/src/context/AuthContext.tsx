import React, { createContext, useState, useEffect, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  photoUrl: string;
  level: number;
  xp: number;
  dailyStepGoal: number;
  lifetimeSteps: number;
  lifetimeKilometers: number;
  lifetimeCalories: number;
  role: string;
  joinedDate: string;
}

interface AuthContextType {
  token: string | null;
  user: UserProfile | null;
  loading: boolean;
  login: (token: string, user: UserProfile) => Promise<void>;
  logout: () => Promise<void>;
  updateUserStats: (stats: Partial<UserProfile>) => void;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load persisted session on app start
    const loadSession = async () => {
      try {
        const savedToken = await SecureStore.getItemAsync('pt_token');
        const savedUserStr = await SecureStore.getItemAsync('pt_user');
        
        if (savedToken && savedUserStr) {
          setToken(savedToken);
          setUser(JSON.parse(savedUserStr));
        }
      } catch (err) {
        console.error('Failed to load session from secure store:', err);
      } finally {
        setLoading(false);
      }
    };
    loadSession();
  }, []);

  const login = async (newToken: string, newUser: UserProfile) => {
    try {
      await SecureStore.setItemAsync('pt_token', newToken);
      await SecureStore.setItemAsync('pt_user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
    } catch (err) {
      console.error('Failed to save session:', err);
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('pt_token');
      await SecureStore.deleteItemAsync('pt_user');
      setToken(null);
      setUser(null);
    } catch (err) {
      console.error('Failed to clear session:', err);
    }
  };

  const updateUserStats = (stats: Partial<UserProfile>) => {
    if (user) {
      const updatedUser = { ...user, ...stats };
      setUser(updatedUser);
      SecureStore.setItemAsync('pt_user', JSON.stringify(updatedUser)).catch(err => {
        console.error('Failed to update stats in secure store:', err);
      });
    }
  };

  const updateUserProfile = (profile: Partial<UserProfile>) => {
    if (user) {
      const updatedUser = { ...user, ...profile };
      setUser(updatedUser);
      SecureStore.setItemAsync('pt_user', JSON.stringify(updatedUser)).catch(err => {
        console.error('Failed to update profile in secure store:', err);
      });
    }
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout, updateUserStats, updateUserProfile }}>
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
