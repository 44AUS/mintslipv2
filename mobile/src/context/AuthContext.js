import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await apiService.getAuthToken();
      const userInfo = await apiService.getUserInfo();
      const guestMode = await AsyncStorage.getItem('@mintslip_guest_mode');

      if (guestMode === 'true') {
        setIsGuest(true);
        setIsAuthenticated(false);
        setUser(null);
      } else if (token && userInfo) {
        setUser(userInfo);
        setIsAuthenticated(true);
        
        // Refresh user data from server
        try {
          const freshUser = await apiService.getCurrentUser();
          if (freshUser.success && freshUser.user) {
            setUser(freshUser.user);
            await apiService.setUserInfo(freshUser.user);
          }
        } catch (error) {
          console.log('Could not refresh user data:', error);
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    const data = await apiService.login(email, password);
    setUser(data.user);
    setIsAuthenticated(true);
    setIsGuest(false);
    await AsyncStorage.removeItem('@mintslip_guest_mode');
    return data;
  };

  const signup = async (name, email, password, saveDocuments) => {
    const data = await apiService.signup(name, email, password, saveDocuments);
    setUser(data.user);
    setIsAuthenticated(true);
    setIsGuest(false);
    await AsyncStorage.removeItem('@mintslip_guest_mode');
    return data;
  };

  const logout = async () => {
    await apiService.logout();
    await AsyncStorage.removeItem('@mintslip_guest_mode');
    setUser(null);
    setIsAuthenticated(false);
    setIsGuest(false);
  };

  const continueAsGuest = async () => {
    await AsyncStorage.setItem('@mintslip_guest_mode', 'true');
    setIsGuest(true);
    setIsAuthenticated(false);
    setUser(null);
  };

  const hasActiveSubscription = () => {
    if (!user || !user.subscription) return false;
    return (
      user.subscription.status === 'active' &&
      (user.subscription.downloads_remaining > 0 || user.subscription.downloads_remaining === -1)
    );
  };

  const refreshUser = async () => {
    try {
      const freshUser = await apiService.getCurrentUser();
      if (freshUser.success && freshUser.user) {
        setUser(freshUser.user);
        await apiService.setUserInfo(freshUser.user);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        isGuest,
        login,
        signup,
        logout,
        continueAsGuest,
        hasActiveSubscription,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
