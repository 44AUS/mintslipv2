import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

// Screens
import HomeScreen from '../screens/HomeScreen';
import PaystubFormScreen from '../screens/PaystubFormScreen';
import CanadianPaystubFormScreen from '../screens/CanadianPaystubFormScreen';
import W2FormScreen from '../screens/W2FormScreen';
import ResumeBuilderScreen from '../screens/ResumeBuilderScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PreviewScreen from '../screens/PreviewScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Icon
function TabIcon({ name, focused }) {
  const icons = { Home: '🏠', Documents: '📄', Profile: '👤' };
  return (
    <View style={[styles.tabIconWrap, focused && styles.tabIconWrapActive]}>
      <Text style={styles.tabIcon}>{icons[name]}</Text>
    </View>
  );
}

// Main Tabs
function MainTabs() {
  const { isGuest } = useAuth();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textTertiary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Documents" component={HomeScreen} options={{ tabBarLabel: 'Create' }} />
      <Tab.Screen 
        name="Profile" 
        component={isGuest ? LoginScreen : ProfileScreen} 
        options={{ tabBarLabel: isGuest ? 'Login' : 'Profile' }} 
      />
    </Tab.Navigator>
  );
}

// App Navigator
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="MainTabs" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="PaystubForm" component={PaystubFormScreen} />
        <Stack.Screen name="CanadianPaystubForm" component={CanadianPaystubFormScreen} />
        <Stack.Screen name="W2Form" component={W2FormScreen} />
        <Stack.Screen name="ResumeBuilder" component={ResumeBuilderScreen} />
        <Stack.Screen name="Preview" component={PreviewScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
    paddingBottom: 8,
    height: 70,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  tabItem: {
    paddingVertical: 4,
  },
  tabIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconWrapActive: {
    backgroundColor: COLORS.primarySoft,
  },
  tabIcon: {
    fontSize: 20,
  },
});
