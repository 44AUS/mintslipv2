import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import Header from '../components/Header';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import RadioGroup from '../components/RadioGroup';
import PayPalWebView from '../components/PayPalWebView';
import { generateAndDownloadBankStatement } from '../utils/bankStatementGenerator';

export default function BankStatementFormScreen() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPayPal, setShowPayPal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('template-a');
  
  const [accountName, setAccountName] = useState('');
  const [accountAddress1, setAccountAddress1] = useState('');
  const [accountAddress2, setAccountAddress2] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [beginningBalance, setBeginningBalance] = useState('0.00');
  const [transactions, setTransactions] = useState([
    { date: '', description: '', type: 'Purchase', amount: '' },
  ]);

  useEffect(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${y}-${m}`);
  }, []);

  const addTransaction = () => {
    setTransactions([...transactions, { date: '', description: '', type: 'Purchase', amount: '' }]);
  };

  const removeTransaction = (idx) => {
    if (transactions.length > 1) {
      setTransactions(transactions.filter((_, i) => i !== idx));
    }
  };

  const updateTransaction = (idx, field, value) => {
    const updated = [...transactions];
    updated[idx][field] = value;
    setTransactions(updated);
  };

  const handlePayment = () => {
    // Validate required fields
    if (!accountName || !accountNumber || !selectedMonth) {
      Alert.alert('Missing Information', 'Please fill in account name, number, and month');
      return;
    }
    setShowPayPal(true);
  };

  const onPaymentSuccess = async () => {
    setShowPayPal(false);
    setIsProcessing(true);
    
    try {
      const formData = {
        accountName,
        accountAddress1,
        accountAddress2,
        accountNumber,
        selectedMonth,
        beginningBalance,
        transactions,
      };
      
      await generateAndDownloadBankStatement(formData, selectedTemplate);
      
      Alert.alert('Success', 'Bank statement generated successfully!', [
        { text: 'OK', onPress: () => setIsProcessing(false) }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate document. Please try again.');
      setIsProcessing(false);
    }
  };

  const onPaymentError = (error) => {
    setShowPayPal(false);
    Alert.alert('Payment Failed', error || 'Please try again');
  };

  const onPaymentCancel = () => {
    setShowPayPal(false);
  };

  const transactionTypes = [
    { label: 'Purchase', value: 'Purchase' },
    { label: 'Deposit', value: 'Deposit' },
    { label: 'Withdrawal', value: 'Withdrawal' },
    { label: 'Interest', value: 'Interest' },
    { label: 'Fee', value: 'Fee' },
  ];

  return (
    <View style={styles.container}>
      <Header title="Generate Bank Statement" showBack={true} />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Template Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Template</Text>
          <RadioGroup
            options={[
              { label: 'Template A - Traditional Bank Statement', value: 'template-a' },
              { label: 'Template B - Modern Digital Statement', value: 'template-b' },
              { label: 'Template C - Professional Corporate', value: 'template-c' },
            ]}
            value={selectedTemplate}
            onValueChange={setSelectedTemplate}
          />
        </View>

        {/* Account Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <Input
            label="Account Holder Name *"
            value={accountName}
            onChangeText={setAccountName}
            placeholder="John Doe"
          />
          <Input
            label="Address Line 1"
            value={accountAddress1}
            onChangeText={setAccountAddress1}
            placeholder="123 Main Street"
          />
          <Input
            label="Address Line 2"
            value={accountAddress2}
            onChangeText={setAccountAddress2}
            placeholder="Los Angeles, CA 90001"
          />
          <Input
            label="Account Number *"
            value={accountNumber}
            onChangeText={setAccountNumber}
            placeholder="123456789"
            keyboardType="numeric"
          />
          <Input
            label="Statement Month *"
            value={selectedMonth}
            onChangeText={setSelectedMonth}
            placeholder="YYYY-MM"
          />
          <Input
            label="Beginning Balance"
            value={beginningBalance}
            onChangeText={setBeginningBalance}
            placeholder="1000.00"
            keyboardType="decimal-pad"
          />
        </View>

        {/* Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transactions</Text>
            <Button
              title="+ Add"
              onPress={addTransaction}
              variant="secondary"
              style={styles.addButton}
            />
          </View>

          {transactions.map((transaction, idx) => (
            <View key={idx} style={styles.transactionCard}>
              <View style={styles.transactionHeader}>
                <Text style={styles.transactionLabel}>Transaction {idx + 1}</Text>
                {transactions.length > 1 && (
                  <TouchableOpacity
                    onPress={() => removeTransaction(idx)}
                    style={styles.removeButton}
                  >
                    <Text style={styles.removeText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Input
                label="Date"
                value={transaction.date}
                onChangeText={(v) => updateTransaction(idx, 'date', v)}
                placeholder="YYYY-MM-DD"
              />
              <Input
                label="Description"
                value={transaction.description}
                onChangeText={(v) => updateTransaction(idx, 'description', v)}
                placeholder="Coffee Shop"
              />
              <Select
                label="Type"
                value={transaction.type}
                onValueChange={(v) => updateTransaction(idx, 'type', v)}
                items={transactionTypes}
              />
              <Input
                label="Amount"
                value={transaction.amount}
                onChangeText={(v) => updateTransaction(idx, 'amount', v)}
                placeholder="25.00"
                keyboardType="decimal-pad"
              />
            </View>
          ))}
        </View>

        {/* Pay Button */}
        <View style={styles.paySection}>
          <Text style={styles.priceText}>Total: $50.00</Text>
          <Button
            title="Pay $50.00 with PayPal"
            onPress={handlePayment}
            disabled={isProcessing}
            style={styles.payButton}
          />
        </View>

        {isProcessing && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color="#1a4731" />
            <Text style={styles.processingText}>Generating your bank statement...</Text>
          </View>
        )}
      </ScrollView>

      <PayPalWebView
        visible={showPayPal}
        amount={50}
        description="Bank Statement Generation"
        onSuccess={onPaymentSuccess}
        onError={onPaymentError}
        onCancel={onPaymentCancel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a4731',
  },
  addButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  transactionCard: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  transactionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: 'bold',
  },
  paySection: {
    marginTop: 20,
    marginBottom: 40,
  },
  priceText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a4731',
    textAlign: 'center',
    marginBottom: 16,
  },
  payButton: {
    marginTop: 8,
  },
  processingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  processingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
});
