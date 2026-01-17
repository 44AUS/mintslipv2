import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Button from '../components/Button';
import Input from '../components/Input';
import { showToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, borderRadius, typography, shadows } from '../styles/theme';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      showToast('Please enter email and password', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const data = await login(email, password);
      showToast('Welcome back!', 'success');
      
      // Check if email needs verification
      if (data.user?.emailVerified === false) {
        // Navigate to verification screen if implemented
        showToast('Please verify your email', 'warning');
      }
    } catch (error) {
      showToast(error.message || 'Login failed. Please check your credentials.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[colors.secondary.default, colors.background, colors.secondary.default]}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={colors.slate[600]} />
            </TouchableOpacity>

            {/* Logo/Brand */}
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Ionicons name="sparkles" size={32} color={colors.primary.foreground} />
              </View>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to your account</Text>
            </View>

            {/* Login Form */}
            <View style={styles.formContainer}>
              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                icon={<Ionicons name="mail-outline" size={20} color={colors.slate[400]} />}
              />

              <Input
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
                icon={<Ionicons name="lock-closed-outline" size={20} color={colors.slate[400]} />}
              />

              <TouchableOpacity
                style={styles.forgotPassword}
                onPress={() => showToast('Password reset coming soon', 'info')}
              >
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>

              <View style={{ height: spacing.base }} />

              <Button
                variant="primary"
                size="lg"
                onPress={handleLogin}
                loading={isLoading}
                icon={<Ionicons name="arrow-forward" size={20} color={colors.primary.foreground} />}
                iconPosition="right"
              >
                Sign In
              </Button>

              <View style={styles.signupPrompt}>
                <Text style={styles.signupText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                  <Text style={styles.signupLink}>Sign up</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Subscription Benefits */}
            <View style={styles.benefitsContainer}>
              <View style={styles.benefitsHeader}>
                <Ionicons name="sparkles" size={16} color={colors.primary.light} />
                <Text style={styles.benefitsTitle}>Subscription Benefits</Text>
              </View>
              <Text style={styles.benefitItem}>• Save on document generation</Text>
              <Text style={styles.benefitItem}>• Priority support</Text>
              <Text style={styles.benefitItem}>• Download history</Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.secondary.default,
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.base,
    paddingBottom: spacing.xl,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    marginBottom: spacing.base,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.base,
    ...shadows.green,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.slate[800],
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.muted.foreground,
  },
  formContainer: {
    backgroundColor: colors.background,
    borderRadius: borderRadius['2xl'],
    padding: spacing.xl,
    marginBottom: spacing.xl,
    ...shadows.lg,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -spacing.sm,
  },
  forgotPasswordText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary.light,
    fontWeight: typography.fontWeight.medium,
  },
  signupPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  signupText: {
    fontSize: typography.fontSize.base,
    color: colors.muted.foreground,
  },
  signupLink: {
    fontSize: typography.fontSize.base,
    color: colors.primary.light,
    fontWeight: typography.fontWeight.medium,
  },
  benefitsContainer: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
  },
  benefitsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  benefitsTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.slate[800],
    marginLeft: spacing.sm,
  },
  benefitItem: {
    fontSize: typography.fontSize.sm,
    color: colors.muted.foreground,
    marginBottom: 4,
  },
});
