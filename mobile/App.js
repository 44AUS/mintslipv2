import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AnimatedSplashScreen from './src/screens/AnimatedSplashScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import WebViewScreen from './src/screens/WebViewScreen';

const STORAGE_KEY = '@mintslip_has_launched';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('loading');
  const [initialPath, setInitialPath] = useState('');
  const [showSplash, setShowSplash] = useState(false);
  const [isReturningUser, setIsReturningUser] = useState(false);

  useEffect(() => {
    checkFirstLaunch();
  }, []);

  const checkFirstLaunch = async () => {
    try {
      const hasLaunched = await AsyncStorage.getItem(STORAGE_KEY);
      
      if (hasLaunched === 'true') {
        // Returning user - show animated splash then webview
        setIsReturningUser(true);
        setShowSplash(true);
        setCurrentScreen('webview');
        setInitialPath('');
      } else {
        // First time user - show welcome screen directly
        setIsReturningUser(false);
        setShowSplash(false);
        setCurrentScreen('welcome');
      }
    } catch (error) {
      console.error('Error checking first launch:', error);
      setCurrentScreen('welcome');
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

  // Show loading while checking storage
  if (currentScreen === 'loading') {
    return <View style={styles.loading} />;
  }

  // Returning users: show animated splash screen
  if (showSplash && isReturningUser) {
    return <AnimatedSplashScreen onFinish={handleSplashFinish} />;
  }

  // First time users: show welcome screen
  if (currentScreen === 'welcome') {
    return (
      <WelcomeScreen
        onLogin={handleLogin}
        onSignup={handleSignup}
        onGuest={handleGuest}
      />
    );
  }

  // Main app webview
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
