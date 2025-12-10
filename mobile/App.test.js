// SIMPLE TEST VERSION - Use this if main app doesn't work
// Rename this to App.js to test basic functionality

import React from 'react';
import { View, Text, Button, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

function HomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          <Text style={styles.title}>🏦 DocuMint Mobile</Text>
          <Text style={styles.subtitle}>Professional Document Generation</Text>
          
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📄 Pay Stub</Text>
            <Text style={styles.cardText}>
              Generate professional pay stubs with accurate tax calculations.
            </Text>
            <Button 
              title="Generate Pay Stub" 
              onPress={() => navigation.navigate('Paystub')}
              color="#1a4731"
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>🏦 Bank Statement</Text>
            <Text style={styles.cardText}>
              Create detailed bank statements with transaction history.
            </Text>
            <Button 
              title="Generate Bank Statement" 
              onPress={() => navigation.navigate('Bank')}
              color="#1a4731"
            />
          </View>
          
          <Text style={styles.footer}>© 2025 DocuMint</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function PaystubScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          <Text style={styles.title}>Pay Stub Generator</Text>
          <Text style={styles.info}>Form fields would go here</Text>
          
          <View style={styles.formSection}>
            <Text style={styles.label}>Employee Name:</Text>
            <Text style={styles.placeholder}>[Input field]</Text>
          </View>
          
          <View style={styles.formSection}>
            <Text style={styles.label}>Company Name:</Text>
            <Text style={styles.placeholder}>[Input field]</Text>
          </View>
          
          <View style={styles.formSection}>
            <Text style={styles.label}>Rate:</Text>
            <Text style={styles.placeholder}>[Input field]</Text>
          </View>
          
          <View style={styles.buttonContainer}>
            <Button title="Back" onPress={() => navigation.goBack()} color="#666" />
            <Button title="Generate PDF" onPress={() => alert('PDF would generate here')} color="#1a4731" />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function BankScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          <Text style={styles.title}>Bank Statement Generator</Text>
          <Text style={styles.info}>Form fields would go here</Text>
          
          <View style={styles.formSection}>
            <Text style={styles.label}>Account Holder:</Text>
            <Text style={styles.placeholder}>[Input field]</Text>
          </View>
          
          <View style={styles.formSection}>
            <Text style={styles.label}>Account Number:</Text>
            <Text style={styles.placeholder}>[Input field]</Text>
          </View>
          
          <View style={styles.formSection}>
            <Text style={styles.label}>Statement Month:</Text>
            <Text style={styles.placeholder}>[Input field]</Text>
          </View>
          
          <View style={styles.buttonContainer}>
            <Button title="Back" onPress={() => navigation.goBack()} color="#666" />
            <Button title="Generate PDF" onPress={() => alert('PDF would generate here')} color="#1a4731" />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1a4731',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ title: 'DocuMint' }}
        />
        <Stack.Screen 
          name="Paystub" 
          component={PaystubScreen}
          options={{ title: 'Pay Stub' }}
        />
        <Stack.Screen 
          name="Bank" 
          component={BankScreen}
          options={{ title: 'Bank Statement' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a4731',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a4731',
    marginBottom: 10,
  },
  cardText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  info: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  formSection: {
    marginBottom: 20,
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 5,
  },
  placeholder: {
    fontSize: 14,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    gap: 10,
  },
  footer: {
    marginTop: 40,
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});
