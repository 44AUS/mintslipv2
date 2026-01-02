import React, { useState } from 'react';
import { 
  View, Text, ScrollView, StyleSheet, TouchableOpacity, 
  TextInput, KeyboardAvoidingView, Platform, SafeAreaView, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login, continueAsGuest } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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

  const handleGuest = () => {
    continueAsGuest();
    navigation.navigate('MainTabs');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
      </View>
      
      <KeyboardAvoidingView style={styles.content} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
          
          {/* Logo */}
          <View style={styles.logoSection}>
            <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.logoCircle}>
              <Text style={styles.logoText}>M</Text>
            </LinearGradient>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to your MintSlip account</Text>
          </View>
          
          {/* Error */}
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          
          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@email.com"
                  placeholderTextColor={COLORS.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter password"
                  placeholderTextColor={COLORS.textTertiary}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Text style={styles.showHide}>{showPassword ? 'Hide' : 'Show'}</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <TouchableOpacity style={styles.forgotBtn}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>
          
          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>
          
          {/* Guest */}
          <TouchableOpacity style={styles.outlineBtn} onPress={handleGuest}>
            <Text style={styles.outlineBtnText}>Continue as Guest</Text>
          </TouchableOpacity>
          
          {/* Sign Up */}
          <View style={styles.signupRow}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
          
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', ...SHADOWS.xs },
  backText: { fontSize: 22, color: COLORS.text },
  content: { flex: 1 },
  scrollContent: { padding: SPACING.xl, paddingBottom: SPACING.huge },
  
  logoSection: { alignItems: 'center', marginBottom: SPACING.xxxl },
  logoCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.lg },
  logoText: { fontSize: 32, fontWeight: '800', color: '#fff' },
  title: { fontSize: FONT_SIZES.xxl, fontWeight: '800', color: COLORS.text, marginBottom: SPACING.xs },
  subtitle: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary },
  
  errorBox: { backgroundColor: COLORS.errorSoft, padding: SPACING.md, borderRadius: BORDER_RADIUS.md, marginBottom: SPACING.lg },
  errorText: { color: COLORS.error, fontSize: FONT_SIZES.sm, textAlign: 'center' },
  
  form: { marginBottom: SPACING.xl },
  inputGroup: { marginBottom: SPACING.lg },
  inputLabel: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.sm },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.lg, paddingHorizontal: SPACING.lg, minHeight: 56 },
  input: { flex: 1, fontSize: FONT_SIZES.md, color: COLORS.text, paddingVertical: SPACING.md },
  showHide: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.primary },
  
  forgotBtn: { alignSelf: 'flex-end', marginBottom: SPACING.xl },
  forgotText: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.primary },
  
  primaryBtn: { backgroundColor: COLORS.primary, paddingVertical: SPACING.lg, borderRadius: BORDER_RADIUS.lg, alignItems: 'center' },
  primaryBtnText: { fontSize: FONT_SIZES.md, fontWeight: '700', color: '#fff' },
  
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: SPACING.xl },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { paddingHorizontal: SPACING.lg, fontSize: FONT_SIZES.sm, color: COLORS.textTertiary },
  
  outlineBtn: { borderWidth: 2, borderColor: COLORS.primary, paddingVertical: SPACING.lg, borderRadius: BORDER_RADIUS.lg, alignItems: 'center' },
  outlineBtnText: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.primary },
  
  signupRow: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.xxl },
  signupText: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary },
  signupLink: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.primary },
});
