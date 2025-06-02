import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, LoginDto, RegisterDto } from '../types';
import { authApi, tokenUtils } from '../lib/api';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginDto) => Promise<boolean>;
  register: (userData: RegisterDto) => Promise<boolean>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  useEffect(() => {
    const initializeAuth = async () => {
      const token = tokenUtils.getToken();
      const savedUser = tokenUtils.getUser();

      if (token && savedUser) {
        // Check if token is expired
        if (tokenUtils.isTokenExpired(token)) {
          tokenUtils.removeToken();
          setIsLoading(false);
          return;
        }

        // Set user without server validation during initialization
        // Server validation will happen on subsequent API calls
        setUser(savedUser);
      }

      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginDto): Promise<boolean> => {
    try {
      const response = await authApi.login(credentials);
      console.log('response', response);
      tokenUtils.setToken(response.token);
      tokenUtils.setUser(response.user);
      setUser(response.user);
      
      toast.success('Login successful!');
      return true;
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed';
      toast.error(message);
      return false;
    }
  };

  const register = async (userData: RegisterDto): Promise<boolean> => {
    try {
      const response = await authApi.register(userData);
      
      tokenUtils.setToken(response.token);
      tokenUtils.setUser(response.user);
      setUser(response.user);
      
      toast.success('Registration successful!');
      return true;
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed';
      toast.error(message);
      return false;
    }
  };

  const logout = () => {
    tokenUtils.removeToken();
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    tokenUtils.setUser(updatedUser);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 