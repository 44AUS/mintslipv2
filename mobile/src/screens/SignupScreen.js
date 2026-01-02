import React, { useState } from 'react';
import { 
  View, Text, ScrollView, StyleSheet, TouchableOpacity, 
  TextInput, KeyboardAvoidingView, Platform, SafeAreaView, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

export default function SignupScreen({ navigation }) {
  const { signup, continueAsGuest } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async () => {
    if (!name || !email || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    setError('');
    const result = await signup(name, email, password);
    if (result.success) {
      navigation.navigate('MainTabs');
    } else {
      setError(result.error || 'Signup failed');
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
      </View>
      
      <KeyboardAvoidingView style={styles.content} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.logoSection}>
            <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.logoCircle}>
              <Text style={styles.logoText}>M</Text>
            </LinearGradient>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join MintSlip today</Text>
          </View>
          
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <View style={styles.inputContainer}>
                <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="John Smith" placeholderTextColor={COLORS.textTertiary} />
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputContainer}>
                <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="you@email.com" placeholderTextColor={COLORS.textTertiary} keyboardType="email-address" autoCapitalize="none" />
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputContainer}>
                <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Min 6 characters" placeholderTextColor={COLORS.textTertiary} secureTextEntry />
              </View>
            </View>
            
            <TouchableOpacity style={styles.primaryBtn} onPress={handleSignup} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Create Account</Text>}
            </TouchableOpacity>
          </View>
          
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>
          
          <TouchableOpacity style={styles.outlineBtn} onPress={() => { continueAsGuest(); navigation.navigate('MainTabs'); }}>
            <Text style={styles.outlineBtnText}>Continue as Guest</Text>
          </TouchableOpacity>
          
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.terms}>By creating an account, you agree to our Terms & Privacy Policy</Text>
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
  logoSection: { alignItems: 'center', marginBottom: SPACING.xxl },
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
  primaryBtn: { backgroundColor: COLORS.primary, paddingVertical: SPACING.lg, borderRadius: BORDER_RADIUS.lg, alignItems: 'center', marginTop: SPACING.md },
  primaryBtnText: { fontSize: FONT_SIZES.md, fontWeight: '700', color: '#fff' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: SPACING.xl },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { paddingHorizontal: SPACING.lg, fontSize: FONT_SIZES.sm, color: COLORS.textTertiary },
  outlineBtn: { borderWidth: 2, borderColor: COLORS.primary, paddingVertical: SPACING.lg, borderRadius: BORDER_RADIUS.lg, alignItems: 'center' },
  outlineBtnText: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.primary },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.xxl },
  loginText: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary },
  loginLink: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.primary },
  terms: { textAlign: 'center', fontSize: FONT_SIZES.xs, color: COLORS.textTertiary, marginTop: SPACING.xxl, lineHeight: 18 },
});
