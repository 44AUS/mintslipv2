import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WelcomeScreen from './src/screens/WelcomeScreen';
import WebViewScreen from './src/screens/WebViewScreen';

const STORAGE_KEY = '@mintslip_has_launched';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('loading');
  const [initialPath, setInitialPath] = useState('');

  useEffect(() => {
    checkFirstLaunch();
  }, []);

  const checkFirstLaunch = async () => {
    try {
      const hasLaunched = await AsyncStorage.getItem(STORAGE_KEY);
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
      setCurrentScreen('welcome');
    }
  };

  const handleLogin = async () => {
    await AsyncStorage.setItem(STORAGE_KEY, 'true');
    setInitialPath('/login');
    setCurrentScreen('webview');
  };

  const handleSignup = async () => {
    await AsyncStorage.setItem(STORAGE_KEY, 'true');
    setInitialPath('/signup');
    setCurrentScreen('webview');
  };

  const handleGuest = async () => {
    await AsyncStorage.setItem(STORAGE_KEY, 'true');
    setInitialPath('');
    setCurrentScreen('webview');
  };

  const handleBackToWelcome = () => {
    setCurrentScreen('welcome');
  };

  if (currentScreen === 'loading') {
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
