import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';

const RootStack = createNativeStackNavigator();

// Deep linking configuration
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
              PaymentSuccess: {
                path: 'payment-success',
                parse: {
                  session_id: (session_id) => session_id,
                  type: (type) => type,
                  count: (count) => count,
                  template: (template) => template,
                },
              },
            }
          }
        }
      }
    }
  }
};

export default function RootNavigator() {
  const { isAuthenticated, isGuest, isLoading } = useAuth();

  // Don't render navigation until auth state is determined
  if (isLoading) {
    return null;
  }

  return (
    <NavigationContainer linking={linking}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated || isGuest ? (
          <>
            <RootStack.Screen name="Main" component={MainNavigator} />
            {/* Modal screens for auth from within main app */}
            <RootStack.Group screenOptions={{ presentation: 'modal' }}>
              <RootStack.Screen name="Login" component={LoginScreen} />
              <RootStack.Screen name="Signup" component={SignupScreen} />
            </RootStack.Group>
          </>
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
