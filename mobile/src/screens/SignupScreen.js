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
  const [step, setStep] = useState(1); // 1 = form, 2 = verify email, 3 = choose plan
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saveDocuments, setSaveDocuments] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const plans = [
    { id: 'starter', name: 'Starter', price: '$9.99/mo', downloads: '5 downloads/month', features: ['Basic templates', 'Email support'] },
    { id: 'professional', name: 'Professional', price: '$19.99/mo', downloads: '20 downloads/month', features: ['All templates', 'Priority support', 'Save documents'] },
    { id: 'business', name: 'Business', price: '$49.99/mo', downloads: 'Unlimited downloads', features: ['Everything in Pro', 'API access', 'Custom branding'] },
  ];

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
      setStep(2); // Move to email verification step
    } catch (error) {
      showToast(error.message || 'Signup failed. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueToPlans = () => {
    setStep(3);
  };

  const handleSelectPlan = (planId) => {
    setSelectedPlan(planId);
  };

  const handleCompletePlanSelection = () => {
    if (!selectedPlan) {
      showToast('Please select a plan or skip', 'warning');
      return;
    }
    showToast(`${selectedPlan} plan selected! Payment integration coming soon.`, 'info');
    // Navigation handled by auth state change
  };

  const handleSkipPlan = () => {
    showToast('You can subscribe anytime from settings', 'info');
    // Navigation handled by auth state change
  };

  // Step 1: Registration Form
  if (step === 1) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={[colors.secondary.default, colors.background, colors.secondary.default]} style={styles.gradient}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color={colors.slate[600]} />
              </TouchableOpacity>

              <View style={styles.logoContainer}>
                <View style={styles.logoCircle}>
                  <Ionicons name="person-add" size={28} color={colors.primary.foreground} />
                </View>
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>Start generating professional documents</Text>
              </View>

              <View style={styles.formContainer}>
                <Input label="Full Name" value={name} onChangeText={setName} placeholder="John Doe" autoCapitalize="words" icon={<Ionicons name="person-outline" size={20} color={colors.slate[400]} />} />
                <Input label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} icon={<Ionicons name="mail-outline" size={20} color={colors.slate[400]} />} />
                <Input label="Password" value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry icon={<Ionicons name="lock-closed-outline" size={20} color={colors.slate[400]} />} />
                <Input label="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="••••••••" secureTextEntry icon={<Ionicons name="lock-closed-outline" size={20} color={colors.slate[400]} />} />

                <View style={styles.toggleContainer}>
                  <View style={styles.toggleInfo}>
                    <Ionicons name="folder-outline" size={20} color={colors.primary.light} />
                    <View style={styles.toggleText}>
                      <Text style={styles.toggleLabel}>Save my documents for later</Text>
                      <Text style={styles.toggleDescription}>Keep copies of your generated PDFs for up to 30 days</Text>
                    </View>
                  </View>
                  <Switch value={saveDocuments} onValueChange={setSaveDocuments} trackColor={{ false: colors.slate[200], true: colors.green[200] }} thumbColor={saveDocuments ? colors.primary.light : colors.slate[400]} />
                </View>

                <View style={{ height: spacing.base }} />

                <Button variant="primary" size="lg" onPress={handleSignup} loading={isLoading} icon={<Ionicons name="arrow-forward" size={20} color={colors.primary.foreground} />} iconPosition="right">
                  Create Account
                </Button>

                <View style={styles.loginPrompt}>
                  <Text style={styles.loginText}>Already have an account? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.loginLink}>Sign in</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.footerText}>By creating an account, you agree to our Terms of Service</Text>
            </ScrollView>
          </KeyboardAvoidingView>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  // Step 2: Email Verification
  if (step === 2) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={[colors.secondary.default, colors.background, colors.secondary.default]} style={styles.gradient}>
          <View style={styles.centeredContent}>
            <View style={styles.iconCircle}>
              <Ionicons name="mail" size={48} color={colors.primary.light} />
            </View>
            <Text style={styles.verifyTitle}>Verify Your Email</Text>
            <Text style={styles.verifySubtitle}>We've sent a verification email to:</Text>
            <Text style={styles.verifyEmail}>{email}</Text>
            <Text style={styles.verifyInstructions}>
              Please check your inbox and click the verification link to continue. Check your spam folder if you don't see it.
            </Text>

            <View style={styles.verifyActions}>
              <Button variant="primary" size="lg" onPress={handleContinueToPlans}>
                I've Verified My Email
              </Button>
              <View style={{ height: spacing.md }} />
              <Button variant="ghost" onPress={() => showToast('Verification email resent!', 'success')}>
                Resend Verification Email
              </Button>
            </View>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  // Step 3: Choose Subscription Plan
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[colors.secondary.default, colors.background]} style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.planScrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.planHeader}>
            <Text style={styles.planTitle}>Choose Your Plan</Text>
            <Text style={styles.planSubtitle}>Select a subscription to unlock more features</Text>
          </View>

          {plans.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[styles.planCard, selectedPlan === plan.id && styles.planCardSelected]}
              onPress={() => handleSelectPlan(plan.id)}
              activeOpacity={0.8}
            >
              <View style={styles.planCardHeader}>
                <View>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planPrice}>{plan.price}</Text>
                </View>
                <View style={[styles.planRadio, selectedPlan === plan.id && styles.planRadioSelected]}>
                  {selectedPlan === plan.id && <Ionicons name="checkmark" size={16} color={colors.primary.foreground} />}
                </View>
              </View>
              <Text style={styles.planDownloads}>{plan.downloads}</Text>
              <View style={styles.planFeatures}>
                {plan.features.map((feature, idx) => (
                  <View key={idx} style={styles.planFeatureRow}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.primary.light} />
                    <Text style={styles.planFeatureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          ))}

          <View style={styles.planActions}>
            <Button variant="primary" size="lg" onPress={handleCompletePlanSelection} disabled={!selectedPlan}>
              Continue with {selectedPlan ? plans.find(p => p.id === selectedPlan)?.name : 'Plan'}
            </Button>
            <View style={{ height: spacing.md }} />
            <Button variant="ghost" onPress={handleSkipPlan}>
              Skip for Now
            </Button>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.secondary.default },
  gradient: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.base, paddingBottom: spacing.xl },
  backButton: { width: 44, height: 44, justifyContent: 'center', marginBottom: spacing.base },
  logoContainer: { alignItems: 'center', marginBottom: spacing.xl },
  logoCircle: { width: 64, height: 64, borderRadius: borderRadius.xl, backgroundColor: colors.primary.light, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.base, ...shadows.green },
  title: { fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: colors.slate[800], marginBottom: spacing.xs },
  subtitle: { fontSize: typography.fontSize.base, color: colors.muted.foreground, textAlign: 'center' },
  formContainer: { backgroundColor: colors.background, borderRadius: borderRadius['2xl'], padding: spacing.xl, marginBottom: spacing.xl, ...shadows.lg },
  toggleContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.slate[50], borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  toggleInfo: { flexDirection: 'row', alignItems: 'flex-start', flex: 1, marginRight: spacing.md },
  toggleText: { marginLeft: spacing.sm, flex: 1 },
  toggleLabel: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colors.slate[700] },
  toggleDescription: { fontSize: typography.fontSize.xs, color: colors.muted.foreground, marginTop: 2 },
  loginPrompt: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl },
  loginText: { fontSize: typography.fontSize.base, color: colors.muted.foreground },
  loginLink: { fontSize: typography.fontSize.base, color: colors.primary.light, fontWeight: typography.fontWeight.medium },
  footerText: { fontSize: typography.fontSize.sm, color: colors.slate[400], textAlign: 'center' },
  // Email verification styles
  centeredContent: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xl },
  iconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.secondary.light, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.xl },
  verifyTitle: { fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: colors.slate[800], marginBottom: spacing.sm },
  verifySubtitle: { fontSize: typography.fontSize.base, color: colors.muted.foreground },
  verifyEmail: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, color: colors.primary.default, marginVertical: spacing.sm },
  verifyInstructions: { fontSize: typography.fontSize.sm, color: colors.muted.foreground, textAlign: 'center', marginTop: spacing.base, lineHeight: 20 },
  verifyActions: { marginTop: spacing['2xl'], width: '100%' },
  // Plan selection styles
  planScrollContent: { padding: spacing.xl },
  planHeader: { marginBottom: spacing.xl },
  planTitle: { fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: colors.primary.default, marginBottom: spacing.xs },
  planSubtitle: { fontSize: typography.fontSize.base, color: colors.muted.foreground },
  planCard: { backgroundColor: colors.background, borderRadius: borderRadius.xl, padding: spacing.base, marginBottom: spacing.md, borderWidth: 2, borderColor: colors.border, ...shadows.sm },
  planCardSelected: { borderColor: colors.primary.light, backgroundColor: colors.secondary.default },
  planCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  planName: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.foreground },
  planPrice: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.primary.light },
  planRadio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  planRadioSelected: { backgroundColor: colors.primary.light, borderColor: colors.primary.light },
  planDownloads: { fontSize: typography.fontSize.sm, color: colors.muted.foreground, marginBottom: spacing.sm },
  planFeatures: { marginTop: spacing.xs },
  planFeatureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  planFeatureText: { fontSize: typography.fontSize.sm, color: colors.slate[600], marginLeft: spacing.xs },
  planActions: { marginTop: spacing.xl },
});
