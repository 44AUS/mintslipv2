import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WelcomeScreen from './src/screens/WelcomeScreen';
import WebViewScreen from './src/screens/WebViewScreen';

const STORAGE_KEY = '@mintslip_has_launched';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('welcome');
  const [initialPath, setInitialPath] = useState('');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    checkFirstLaunch();
  }, []);

  const checkFirstLaunch = async () => {
    try {
      const hasLaunched = await AsyncStorage.getItem(STORAGE_KEY);
      
      if (hasLaunched === 'true') {
        setCurrentScreen('webview');
        setInitialPath('');
      } else {
        setCurrentScreen('welcome');
      }
    } catch (error) {
      console.error('Error checking first launch:', error);
      setCurrentScreen('welcome');
    } finally {
      setIsReady(true);
    }
  };

  const handleLogin = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, 'true');
    } catch (e) {
      console.error('Error saving to storage:', e);
    }
    setInitialPath('/login');
    setCurrentScreen('webview');
  };

  const handleSignup = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, 'true');
    } catch (e) {
      console.error('Error saving to storage:', e);
    }
    setInitialPath('/signup');
    setCurrentScreen('webview');
  };

  const handleGuest = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, 'true');
    } catch (e) {
      console.error('Error saving to storage:', e);
    }
    setInitialPath('');
    setCurrentScreen('webview');
  };

  const handleBackToWelcome = () => {
    setCurrentScreen('welcome');
  };

  // Show loading while checking storage
  if (!isReady) {
    return <View style={styles.loading} />;
  }

  if (currentScreen === 'welcome') {
    return (
      <WelcomeScreen
        onLogin={handleLogin}
        onSignup={handleSignup}
        onGuest={handleGuest}
      />
    );
  }

  return (
    <WebViewScreen
      initialPath={initialPath}
      onBack={handleBackToWelcome}
    />
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
});
