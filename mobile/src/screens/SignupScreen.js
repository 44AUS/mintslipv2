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
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Button from '../components/Button';
import Input from '../components/Input';
import { showToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, borderRadius, typography, shadows } from '../styles/theme';

export default function SignupScreen({ navigation }) {
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saveDocuments, setSaveDocuments] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    if (password.length < 8) {
      showToast('Password must be at least 8 characters', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await signup(name, email, password, saveDocuments);
      showToast('Account created! Please verify your email.', 'success');
    } catch (error) {
      showToast(error.message || 'Signup failed. Please try again.', 'error');
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
                <Ionicons name="person-add" size={28} color={colors.primary.foreground} />
              </View>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Start generating professional documents</Text>
            </View>

            {/* Signup Form */}
            <View style={styles.formContainer}>
              <Input
                label="Full Name"
                value={name}
                onChangeText={setName}
                placeholder="John Doe"
                autoCapitalize="words"
                icon={<Ionicons name="person-outline" size={20} color={colors.slate[400]} />}
              />

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

              <Input
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
                secureTextEntry
                icon={<Ionicons name="lock-closed-outline" size={20} color={colors.slate[400]} />}
              />

              {/* Save Documents Toggle */}
              <View style={styles.toggleContainer}>
                <View style={styles.toggleInfo}>
                  <Ionicons name="folder-outline" size={20} color={colors.primary.light} />
                  <View style={styles.toggleText}>
                    <Text style={styles.toggleLabel}>Save my documents for later</Text>
                    <Text style={styles.toggleDescription}>
                      Keep copies of your generated PDFs for up to 30 days
                    </Text>
                  </View>
                </View>
                <Switch
                  value={saveDocuments}
                  onValueChange={setSaveDocuments}
                  trackColor={{ false: colors.slate[200], true: colors.green[200] }}
                  thumbColor={saveDocuments ? colors.primary.light : colors.slate[400]}
                />
              </View>

              <View style={{ height: spacing.base }} />

              <Button
                variant="primary"
                size="lg"
                onPress={handleSignup}
                loading={isLoading}
                icon={<Ionicons name="arrow-forward" size={20} color={colors.primary.foreground} />}
                iconPosition="right"
              >
                Create Account
              </Button>

              <View style={styles.loginPrompt}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.loginLink}>Sign in</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Footer */}
            <Text style={styles.footerText}>
              By creating an account, you agree to our Terms of Service
            </Text>
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
    marginBottom: spacing.xl,
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
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: colors.background,
    borderRadius: borderRadius['2xl'],
    padding: spacing.xl,
    marginBottom: spacing.xl,
    ...shadows.lg,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.slate[50],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: spacing.md,
  },
  toggleText: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  toggleLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.slate[700],
  },
  toggleDescription: {
    fontSize: typography.fontSize.xs,
    color: colors.muted.foreground,
    marginTop: 2,
  },
  loginPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  loginText: {
    fontSize: typography.fontSize.base,
    color: colors.muted.foreground,
  },
  loginLink: {
    fontSize: typography.fontSize.base,
    color: colors.primary.light,
    fontWeight: typography.fontWeight.medium,
  },
  footerText: {
    fontSize: typography.fontSize.sm,
    color: colors.slate[400],
    textAlign: 'center',
  },
});
