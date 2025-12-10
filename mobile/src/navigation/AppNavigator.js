import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import PaystubFormScreen from '../screens/PaystubFormScreen';
import BankStatementFormScreen from '../screens/BankStatementFormScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="PaystubForm" component={PaystubFormScreen} />
        <Stack.Screen name="BankStatementForm" component={BankStatementFormScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
