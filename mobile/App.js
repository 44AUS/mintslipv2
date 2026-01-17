import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';

import { AuthProvider } from './src/context/AuthContext';
import { ToastProvider } from './src/components/Toast';
import { RootNavigator } from './src/navigation';
import SplashScreen from './src/screens/SplashScreen';
import { colors } from './src/styles/theme';

const STORAGE_KEY = '@mintslip_has_launched';

// Deep link prefix for the app
const linking = {
  prefixes: [
    Linking.createURL('/'),
    'mintslip://',
    'https://native-paystubs.preview.emergentagent.com'
  ],
  config: {
    screens: {
      Main: {
        screens: {
          Home: {
            screens: {
              PaymentSuccess: 'payment-success',
            }
          }
        }
      }
    }
  }
};

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isReturningUser, setIsReturningUser] = useState(false);

  useEffect(() => {
    checkFirstLaunch();
  }, []);

  const checkFirstLaunch = async () => {
    try {
      const hasLaunched = await AsyncStorage.getItem(STORAGE_KEY);
      
      if (hasLaunched === 'true') {
        // Returning user - show splash briefly
        setIsReturningUser(true);
        setShowSplash(true);
      } else {
        // First time user - mark as launched and skip splash after initial render
        await AsyncStorage.setItem(STORAGE_KEY, 'true');
        setShowSplash(true);
      }
    } catch (error) {
      console.error('Error checking first launch:', error);
      setShowSplash(false);
    }
  };

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  if (showSplash) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <SplashScreen onFinish={handleSplashFinish} />
      </SafeAreaProvider>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AuthProvider>
          <ToastProvider>
            <RootNavigator />
          </ToastProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
