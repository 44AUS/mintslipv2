import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';
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

// Tab Icon Component
function TabIcon({ name, focused }) {
  const icons = {
    Home: '🏠',
    Documents: '📄',
    Profile: '👤',
  };
  return (
    <View style={styles.tabIcon}>
      <Text style={[styles.tabIconText, focused && styles.tabIconFocused]}>
        {icons[name] || '●'}
      </Text>
    </View>
  );
}

// Main Tab Navigator
function MainTabs() {
  const { user, isGuest } = useAuth();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen 
        name="Documents" 
        component={DocumentsStack}
        options={{ tabBarLabel: 'Create' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={isGuest ? LoginScreen : ProfileScreen}
        options={{ tabBarLabel: isGuest ? 'Login' : 'Profile' }}
      />
    </Tab.Navigator>
  );
}

// Documents Stack (for document creation flow)
function DocumentsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DocumentList" component={HomeScreen} />
    </Stack.Navigator>
  );
}

// Main App Navigator
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="MainTabs"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="MainTabs" component={MainTabs} />
        
        {/* Document Generators */}
        <Stack.Screen name="PaystubForm" component={PaystubFormScreen} />
        <Stack.Screen name="CanadianPaystubForm" component={CanadianPaystubFormScreen} />
        <Stack.Screen name="W2Form" component={W2FormScreen} />
        <Stack.Screen name="ResumeBuilder" component={ResumeBuilderScreen} />
        
        {/* Preview */}
        <Stack.Screen name="Preview" component={PreviewScreen} />
        
        {/* Auth */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
    paddingBottom: 8,
    height: 65,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconText: {
    fontSize: 24,
  },
  tabIconFocused: {
    transform: [{ scale: 1.1 }],
  },
});
