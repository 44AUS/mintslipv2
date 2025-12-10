import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import Header from '../components/Header';

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Header title="DocuMint" />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.hero}>
          <Text style={styles.subtitle}>PROFESSIONAL DOCUMENT GENERATION</Text>
          <Text style={styles.title}>Generate{'\n'}Authentic{'\n'}Documents</Text>
          <Text style={styles.description}>
            Create professional pay stubs and bank statements instantly. Simple, secure, and ready to use.
          </Text>
          
          <View style={styles.featurePills}>
            <View style={styles.pill}>
              <Text style={styles.pillText}>✓ Instant Download</Text>
            </View>
            <View style={styles.pill}>
              <Text style={styles.pillText}>✓ Secure Payment</Text>
            </View>
            <View style={styles.pill}>
              <Text style={styles.pillText}>✓ No Registration</Text>
            </View>
          </View>
        </View>

        {/* Document Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Your Document</Text>
          <Text style={styles.sectionSubtitle}>Select the document type you need to generate</Text>
          
          {/* Pay Stub Card */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('PaystubForm')}
            activeOpacity={0.8}
          >
            <View style={styles.cardIcon}>
              <Text style={styles.iconText}>📄</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Pay Stub</Text>
              <Text style={styles.cardDescription}>
                Generate professional pay stubs with accurate tax calculations, direct deposit information, and customizable pay periods.
              </Text>
              <View style={styles.priceContainer}>
                <Text style={styles.price}>$10</Text>
                <Text style={styles.priceLabel}>per document</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Bank Statement Card */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('BankStatementForm')}
            activeOpacity={0.8}
          >
            <View style={styles.cardIcon}>
              <Text style={styles.iconText}>🏦</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Bank Statement</Text>
              <Text style={styles.cardDescription}>
                Create detailed bank statements with transaction history, account summaries, and professional formatting.
              </Text>
              <View style={styles.priceContainer}>
                <Text style={styles.price}>$50</Text>
                <Text style={styles.priceLabel}>per document</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Trust Section */}
        <View style={styles.trustSection}>
          <Text style={styles.trustTitle}>Secure & Instant</Text>
          <Text style={styles.trustDescription}>
            Your payment is processed securely through PayPal. Once payment is confirmed, your document is generated and downloaded immediately.
          </Text>
          <View style={styles.trustFeatures}>
            <View style={styles.trustFeature}>
              <Text style={styles.trustCheckmark}>✓</Text>
              <Text style={styles.trustFeatureText}>Industry-standard encryption</Text>
            </View>
            <View style={styles.trustFeature}>
              <Text style={styles.trustCheckmark}>✓</Text>
              <Text style={styles.trustFeatureText}>No data storage after download</Text>
            </View>
            <View style={styles.trustFeature}>
              <Text style={styles.trustCheckmark}>✓</Text>
              <Text style={styles.trustFeatureText}>Instant PDF generation</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2025 DocuMint. Professional document generation service.</Text>
        </View>
      </ScrollView>
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
  },
  hero: {
    padding: 24,
    paddingTop: 32,
  },
  subtitle: {
    fontSize: 11,
    letterSpacing: 2,
    color: '#64748b',
    marginBottom: 16,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1a4731',
    marginBottom: 16,
    lineHeight: 52,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#64748b',
    marginBottom: 24,
  },
  featurePills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    backgroundColor: '#f0fdf4',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#15803d',
  },
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
  },
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 32,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a4731',
    marginBottom: 12,
  },
  cardDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: '#64748b',
    marginBottom: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a4731',
  },
  priceLabel: {
    fontSize: 16,
    color: '#64748b',
  },
  trustSection: {
    backgroundColor: '#f8fafc',
    padding: 24,
    marginTop: 16,
  },
  trustTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a4731',
    marginBottom: 16,
  },
  trustDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: '#64748b',
    marginBottom: 24,
  },
  trustFeatures: {
    gap: 16,
  },
  trustFeature: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  trustCheckmark: {
    fontSize: 20,
    color: '#15803d',
  },
  trustFeatureText: {
    fontSize: 15,
    color: '#475569',
    flex: 1,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
  },
});
