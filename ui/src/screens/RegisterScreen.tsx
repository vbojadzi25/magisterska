import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';
import Button from '../components/Button';
import { authAPI, contactsAPI, getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';

// Simulated phone contacts "imported" from the user's phone on registration
const SIMULATED_PHONE_CONTACTS = [
  { name: 'Stefan Mitrevski', phoneNumber: '+38970111222' },
  { name: 'Ana Kostadinova', phoneNumber: '+38971222333' },
  { name: 'Marko Petrov', phoneNumber: '+38972333444' },
  { name: 'Ivana Stojanovic', phoneNumber: '+38973444555' },
  { name: 'Petar Kjosev', phoneNumber: '+38974555666' },
  { name: 'Maja Trajkoska', phoneNumber: '+38975666777' },
  { name: 'Nikola Mitevski', phoneNumber: '+38976777888' },
  { name: 'Elena Ristovska', phoneNumber: '+38977888999' },
  { name: 'Boris Angelov', phoneNumber: '+38978999000' },
  { name: 'Sara Nikoloska', phoneNumber: '+38979000111' },
];

interface RegisterScreenProps {
  navigation: any;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const { login } = useAuth();

  const [form, setForm] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    dateOfBirth: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Username availability check
  type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const username = form.username.trim();
    if (!username) { setUsernameStatus('idle'); return; }

    if (!/^[a-zA-Z][a-zA-Z0-9_]{2,29}$/.test(username)) {
      setUsernameStatus('invalid');
      return;
    }

    setUsernameStatus('checking');
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await authAPI.checkUsername(username);
        setUsernameStatus(res.data.available ? 'available' : 'taken');
      } catch {
        setUsernameStatus('idle');
      }
    }, 500);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [form.username]);

  const update = (field: keyof typeof form, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const validate = () => {
    if (!form.username.trim() || usernameStatus !== 'available') {
      Alert.alert('Error', 'Please choose a valid, available username');
      return false;
    }
    if (!form.firstName.trim() || !form.lastName.trim()) {
      Alert.alert('Error', 'First and last name are required');
      return false;
    }
    if (!form.email.trim() || !form.email.includes('@')) {
      Alert.alert('Error', 'Valid email is required');
      return false;
    }
    if (form.password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return false;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(form.password)) {
      Alert.alert(
        'Weak Password',
        'Password must contain uppercase, lowercase, number and special character (@$!%*?&)'
      );
      return false;
    }
    if (form.password !== form.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    // Expect +389XXXXXXXX format
    if (!/^\+389[0-9]{8}$/.test(form.phoneNumber)) {
      Alert.alert('Error', 'Phone must be in format +389XXXXXXXX (e.g. +38970123456)');
      return false;
    }
    if (!form.dateOfBirth.trim()) {
      Alert.alert('Error', 'Date of birth is required (YYYY-MM-DD)');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const response = await authAPI.register({
        username: form.username.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phoneNumber: form.phoneNumber.trim(),
        dateOfBirth: form.dateOfBirth.trim(),
      });

      const { user, accessToken } = response.data.data;

      // Silently sync simulated phone contacts in background
      contactsAPI.sync(SIMULATED_PHONE_CONTACTS).catch(() => {
        // non-critical — ignore errors
      });

      // Show alert BEFORE calling login() — login() triggers navigator switch
      // which unmounts this component; calling Alert after unmount crashes on RN New Architecture
      Alert.alert(
        'Welcome to Denar!',
        `Account created successfully, ${user.firstName}. Your phone contacts have been synced.`,
        [{ text: 'Get Started', onPress: () => login(user, accessToken) }]
      );
    } catch (error: any) {
      Alert.alert('Registration Failed', getErrorMessage(error, 'Registration failed. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.onBackground} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Account</Text>
          <View style={{ width: 40 }} />
        </View>

        <Text style={styles.subtitle}>
          Join Denar and start sending money instantly
        </Text>

        <View style={styles.form}>
          {/* Username */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Username</Text>
            <View style={[
              styles.inputWithIcon,
              usernameStatus === 'available' && styles.inputBorderSuccess,
              usernameStatus === 'taken' || usernameStatus === 'invalid' ? styles.inputBorderError : undefined,
            ]}>
              <Text style={styles.atSign}>@</Text>
              <TextInput
                style={styles.inputFlex}
                value={form.username}
                onChangeText={v => update('username', v.toLowerCase().replace(/[^a-zA-Z0-9_]/g, ''))}
                placeholder="your_username"
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor={theme.colors.gray}
              />
              {usernameStatus === 'checking' && (
                <Text style={styles.usernameHintGray}>...</Text>
              )}
              {usernameStatus === 'available' && (
                <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
              )}
              {(usernameStatus === 'taken' || usernameStatus === 'invalid') && (
                <Ionicons name="close-circle" size={18} color="#F44336" />
              )}
            </View>
            {usernameStatus === 'available' && (
              <Text style={styles.usernameHintSuccess}>Username is available</Text>
            )}
            {usernameStatus === 'taken' && (
              <Text style={styles.usernameHintError}>Username is already taken</Text>
            )}
            {usernameStatus === 'invalid' && (
              <Text style={styles.usernameHintError}>3–30 chars, start with a letter, letters/numbers/underscores only</Text>
            )}
          </View>

          {/* Name row */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: theme.spacing.sm }]}>
              <Text style={styles.inputLabel}>First Name</Text>
              <TextInput
                style={styles.input}
                value={form.firstName}
                onChangeText={v => update('firstName', v)}
                placeholder="Ivan"
                placeholderTextColor={theme.colors.gray}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Last Name</Text>
              <TextInput
                style={styles.input}
                value={form.lastName}
                onChangeText={v => update('lastName', v)}
                placeholder="Petrov"
                placeholderTextColor={theme.colors.gray}
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.inputWithIcon}>
              <Ionicons name="mail-outline" size={18} color={theme.colors.gray} style={styles.icon} />
              <TextInput
                style={styles.inputFlex}
                value={form.email}
                onChangeText={v => update('email', v)}
                placeholder="your@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor={theme.colors.gray}
              />
            </View>
          </View>

          {/* Phone */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <View style={styles.inputWithIcon}>
              <Ionicons name="call-outline" size={18} color={theme.colors.gray} style={styles.icon} />
              <TextInput
                style={styles.inputFlex}
                value={form.phoneNumber}
                onChangeText={v => update('phoneNumber', v)}
                placeholder="+38970123456"
                keyboardType="phone-pad"
                placeholderTextColor={theme.colors.gray}
              />
            </View>
            <Text style={styles.hint}>Format: +389XXXXXXXX (Macedonian number)</Text>
          </View>

          {/* Date of Birth */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Date of Birth</Text>
            <View style={styles.inputWithIcon}>
              <Ionicons name="calendar-outline" size={18} color={theme.colors.gray} style={styles.icon} />
              <TextInput
                style={styles.inputFlex}
                value={form.dateOfBirth}
                onChangeText={v => update('dateOfBirth', v)}
                placeholder="1990-01-31"
                placeholderTextColor={theme.colors.gray}
              />
            </View>
            <Text style={styles.hint}>Format: YYYY-MM-DD</Text>
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputWithIcon}>
              <Ionicons name="lock-closed-outline" size={18} color={theme.colors.gray} style={styles.icon} />
              <TextInput
                style={styles.inputFlex}
                value={form.password}
                onChangeText={v => update('password', v)}
                placeholder="Min 8 chars, A-z, 0-9, @$!%*?&"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                placeholderTextColor={theme.colors.gray}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={theme.colors.gray}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirm Password</Text>
            <View style={styles.inputWithIcon}>
              <Ionicons name="lock-closed-outline" size={18} color={theme.colors.gray} style={styles.icon} />
              <TextInput
                style={styles.inputFlex}
                value={form.confirmPassword}
                onChangeText={v => update('confirmPassword', v)}
                placeholder="Repeat your password"
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                placeholderTextColor={theme.colors.gray}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeBtn}>
                <Ionicons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={theme.colors.gray}
                />
              </TouchableOpacity>
            </View>
          </View>

          <Button
            title={isLoading ? 'Creating account...' : 'Create Account'}
            onPress={handleRegister}
            variant="primary"
            size="lg"
            fullWidth
            loading={isLoading}
            disabled={isLoading}
          />

          <TouchableOpacity style={styles.loginLink} onPress={() => navigation.goBack()}>
            <Text style={styles.loginLinkText}>
              Already have an account?{' '}
              <Text style={styles.loginLinkBold}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.demoHint}>
          <Ionicons name="information-circle-outline" size={16} color={theme.colors.primary} />
          <Text style={styles.demoText}>
            Upon registration, 10 simulated contacts are synced from your "phone".
            As more users join Denar, matching contacts will appear as "On Denar".
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingBottom: theme.spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.onBackground,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.gray,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  form: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.md,
  },
  row: {
    flexDirection: 'row',
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.onBackground,
    marginBottom: theme.spacing.xs,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.onBackground,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
  },
  icon: {
    marginRight: theme.spacing.sm,
  },
  inputFlex: {
    flex: 1,
    fontSize: theme.fontSize.md,
    color: theme.colors.onBackground,
    paddingVertical: theme.spacing.md,
  },
  eyeBtn: {
    padding: theme.spacing.sm,
  },
  hint: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.gray,
    marginTop: theme.spacing.xs,
  },
  loginLink: {
    marginTop: theme.spacing.lg,
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.gray,
  },
  loginLinkBold: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  demoHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.surfaceVariant,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    columnGap: theme.spacing.sm,
  },
  demoText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.primaryDark,
    lineHeight: 20,
  },
  inputBorderSuccess: {
    borderColor: '#4CAF50',
  },
  inputBorderError: {
    borderColor: '#F44336',
  },
  atSign: {
    fontSize: theme.fontSize.md,
    color: theme.colors.gray,
    marginRight: theme.spacing.xs,
  },
  usernameHintSuccess: {
    fontSize: theme.fontSize.xs,
    color: '#4CAF50',
    marginTop: theme.spacing.xs,
  },
  usernameHintError: {
    fontSize: theme.fontSize.xs,
    color: '#F44336',
    marginTop: theme.spacing.xs,
  },
  usernameHintGray: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.gray,
  },
});

export default RegisterScreen;
