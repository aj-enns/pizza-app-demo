'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, LoginCredentials, RegisterCredentials, AuthState } from '@/lib/types';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  register: (credentials: RegisterCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (profile: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'pizza-auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const user = JSON.parse(saved) as UserProfile;
          // Verify user is still valid by calling API
          const response = await fetch(`/api/auth/me?userId=${user.id}`);
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              setState({
                user: data.data,
                isAuthenticated: true,
                isLoading: false,
              });
              localStorage.setItem(STORAGE_KEY, JSON.stringify(data.data));
              return;
            }
          }
          // If verification fails, clear storage
          localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
          console.error('Failed to load user:', error);
          localStorage.removeItem(STORAGE_KEY);
        }
      }
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    };

    loadUser();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (data.success && data.data) {
        const user = data.data;
        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        return { success: true };
      }

      return { success: false, error: data.error || 'Login failed' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An error occurred during login' };
    }
  };

  const register = async (credentials: RegisterCredentials): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (data.success && data.data) {
        const user = data.data;
        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        return { success: true };
      }

      return { success: false, error: data.error || 'Registration failed' };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'An error occurred during registration' };
    }
  };

  const logout = () => {
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    localStorage.removeItem(STORAGE_KEY);
  };

  const updateProfile = async (profile: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });

      const data = await response.json();

      if (data.success && data.data) {
        const updatedUser = data.data;
        setState({
          user: updatedUser,
          isAuthenticated: true,
          isLoading: false,
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
        return { success: true };
      }

      return { success: false, error: data.error || 'Failed to update profile' };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: 'An error occurred while updating profile' };
    }
  };

  const refreshUser = async () => {
    if (!state.user?.id) return;
    
    try {
      const response = await fetch(`/api/auth/me?userId=${state.user.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setState({
            user: data.data,
            isAuthenticated: true,
            isLoading: false,
          });
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data.data));
        }
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        updateProfile,
        refreshUser,
      }}
    >
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
