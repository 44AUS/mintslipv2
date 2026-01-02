import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';
import { Button, Input, Header } from '../components/ui';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login, continueAsGuest } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    setLoading(true);
    setError('');

    const result = await login(email, password);
    
    if (result.success) {
      navigation.navigate('MainTabs');
    } else {
      setError(result.error || 'Login failed');
    }
    
    setLoading(false);
  };

  const handleContinueAsGuest = () => {
    continueAsGuest();
    navigation.navigate('MainTabs');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Header 
        title="Sign In" 
        showBack 
        onBack={() => navigation.goBack()}
        variant="light"
      />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <Text style={styles.logo}>MintSlip</Text>
          <Text style={styles.subtitle}>Welcome back! Sign in to continue.</Text>
        </View>

        {/* Error Message */}
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        ) : null}

        {/* Login Form */}
        <View style={styles.form}>
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry
          />

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot password?</Text>
          </TouchableOpacity>

          <Button
            onPress={handleLogin}
            loading={loading}
            fullWidth
            size="lg"
          >
            Sign In
          </Button>
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Continue as Guest */}
        <Button
          variant="outline"
          onPress={handleContinueAsGuest}
          fullWidth
          size="lg"
        >
          Continue as Guest
        </Button>

        {/* Sign Up Link */}
        <View style={styles.signupSection}>
          <Text style={styles.signupText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text style={styles.signupLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        {/* Benefits */}
        <View style={styles.benefits}>
          <Text style={styles.benefitsTitle}>Why create an account?</Text>
          <View style={styles.benefit}>
            <Text style={styles.benefitIcon}>✓</Text>
            <Text style={styles.benefitText}>Access your documents anytime</Text>
          </View>
          <View style={styles.benefit}>
            <Text style={styles.benefitIcon}>✓</Text>
            <Text style={styles.benefitText}>Save time with prefilled information</Text>
          </View>
          <View style={styles.benefit}>
            <Text style={styles.benefitIcon}>✓</Text>
            <Text style={styles.benefitText}>Get exclusive subscription discounts</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.xl,
    paddingBottom: SPACING.xxxl,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: SPACING.xxxl,
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.primaryDark,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    backgroundColor: COLORS.errorBg,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
  },
  form: {
    marginBottom: SPACING.xl,
  },
  forgotPassword: {
    alignItems: 'flex-end',
    marginBottom: SPACING.xl,
    marginTop: -SPACING.sm,
  },
  forgotPasswordText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    paddingHorizontal: SPACING.lg,
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
  },
  signupSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.xl,
  },
  signupText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
  },
  signupLink: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  benefits: {
    backgroundColor: COLORS.background,
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    marginTop: SPACING.xxxl,
  },
  benefitsTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  benefitIcon: {
    color: COLORS.primary,
    fontWeight: 'bold',
    marginRight: SPACING.md,
    fontSize: FONT_SIZES.md,
  },
  benefitText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
  },
});
