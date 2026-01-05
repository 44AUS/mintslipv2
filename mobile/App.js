import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AnimatedSplashScreen from './src/screens/AnimatedSplashScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import WebViewScreen from './src/screens/WebViewScreen';

const STORAGE_KEY = '@mintslip_has_launched';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('welcome');
  const [initialPath, setInitialPath] = useState('');

  useEffect(() => {
    checkFirstLaunch();
  }, []);

  const checkFirstLaunch = async () => {
    try {
      const hasLaunched = await AsyncStorage.getItem(STORAGE_KEY);
      console.log('Has launched before:', hasLaunched);
      
      if (hasLaunched === 'true') {
        // User has seen welcome screen before, show main app
        setCurrentScreen('webview');
        setInitialPath('');
      } else {
        // First launch, show welcome screen
        setCurrentScreen('welcome');
      }
    } catch (error) {
      console.error('Error checking first launch:', error);
      // Default to welcome screen on error
      setCurrentScreen('welcome');
    } finally {
      setIsReady(true);
    }
  };

  const handleSplashFinish = () => {
    setShowSplash(false);
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

  // Show animated splash screen until both splash animation completes AND app is ready
  if (showSplash || !isReady) {
    return <AnimatedSplashScreen onFinish={handleSplashFinish} />;
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
    backgroundColor: '#059669',
  },
});
