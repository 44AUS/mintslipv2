import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import HomeScreen from '../screens/HomeScreen';
import PaystubGeneratorScreen from '../screens/PaystubGeneratorScreen';
import CanadianPaystubGeneratorScreen from '../screens/CanadianPaystubGeneratorScreen';
import PaymentSuccessScreen from '../screens/PaymentSuccessScreen';
import SettingsScreen from '../screens/SettingsScreen';

import { colors, spacing, borderRadius, typography, shadows } from '../styles/theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Stack navigator for Home tab to include generator screens
function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="PaystubGenerator" component={PaystubGeneratorScreen} />
      <Stack.Screen name="CanadianPaystubGenerator" component={CanadianPaystubGeneratorScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}

// Placeholder screens for documents and profile tabs
function DocumentsScreen() {
  return <HomeScreen />;
}

function ProfileStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="SettingsMain" component={SettingsScreen} />
    </Stack.Navigator>
  );
}

export default function MainNavigator() {
  const insets = useSafeAreaInsets();

  const handleTabPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Documents':
              iconName = focused ? 'document-text' : 'document-text-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'ellipse-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary.light,
        tabBarInactiveTintColor: colors.slate[400],
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 60 + insets.bottom,
          paddingTop: spacing.sm,
          paddingBottom: insets.bottom + spacing.xs,
          ...shadows.sm,
        },
        tabBarLabelStyle: {
          fontSize: typography.fontSize.xs,
          fontWeight: typography.fontWeight.medium,
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        listeners={{
          tabPress: handleTabPress,
        }}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="Documents"
        component={DocumentsScreen}
        listeners={{
          tabPress: handleTabPress,
        }}
        options={{
          tabBarLabel: 'Documents',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        listeners={{
          tabPress: handleTabPress,
        }}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}
