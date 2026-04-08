import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';
import Button from '../components/Button';
import { usersAPI, getErrorMessage } from '../services/api';

// Outside component — stable reference, no unmount/remount on re-render
const PasswordField = ({
  label, value, onChangeText, show, onToggle, placeholder, error,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  show: boolean; onToggle: () => void; placeholder?: string; error?: string;
}) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={[styles.inputRow, !!error && styles.inputRowError]}>
      <Ionicons name="lock-closed-outline" size={18} color={theme.colors.gray} style={styles.inputIcon} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || '••••••••'}
        placeholderTextColor={theme.colors.gray}
        secureTextEntry={!show}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TouchableOpacity onPress={onToggle} style={styles.eyeBtn}>
        <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={18} color={theme.colors.gray} />
      </TouchableOpacity>
    </View>
    {!!error && <Text style={styles.fieldError}>{error}</Text>}
  </View>
);

const getPasswordStrength = (pwd: string): { label: string; color: string; width: string } => {
  if (pwd.length === 0) return { label: '', color: 'transparent', width: '0%' };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[@$!%*?&]/.test(pwd)) score++;
  if (score <= 2) return { label: 'Weak', color: '#F44336', width: '33%' };
  if (score <= 3) return { label: 'Fair', color: '#FF9800', width: '60%' };
  return { label: 'Strong', color: '#4CAF50', width: '100%' };
};

interface ChangePasswordScreenProps {
  navigation: any;
}

const ChangePasswordScreen: React.FC<ChangePasswordScreenProps> = ({ navigation }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState(false);

  const strength = getPasswordStrength(newPassword);

  // Inline validation errors (no Alert)
  const currentError = !currentPassword && apiError ? '' : '';
  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const tooShort = newPassword.length > 0 && newPassword.length < 8;
  const sameAsCurrent = newPassword.length > 0 && newPassword === currentPassword;

  const handleSubmit = async () => {
    setApiError('');
    if (!currentPassword) { setApiError('Please enter your current password'); return; }
    if (newPassword.length < 8) { setApiError('New password must be at least 8 characters'); return; }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(newPassword)) {
      setApiError('Password must contain uppercase, lowercase, number and special character (@$!%*?&)');
      return;
    }
    if (newPassword !== confirmPassword) { setApiError('New passwords do not match'); return; }
    if (currentPassword === newPassword) { setApiError('New password must be different from your current password'); return; }

    setIsLoading(true);
    try {
      await usersAPI.changePassword({ currentPassword, newPassword });
      setIsLoading(false);
      setSuccess(true);
    } catch (error: any) {
      setIsLoading(false);
      setApiError(getErrorMessage(error, 'Failed to change password. Please try again.'));
    }
  };

  if (success) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successCircle}>
          <Ionicons name="checkmark" size={48} color={theme.colors.onPrimary} />
        </View>
        <Text style={styles.successTitle}>Password Changed</Text>
        <Text style={styles.successSub}>Your password has been updated successfully.</Text>
        <TouchableOpacity style={styles.successBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.successBtnText}>Back to Profile</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="lock-closed" size={36} color={theme.colors.primary} />
          </View>
          <Text style={styles.subtitle}>Choose a strong password with at least 8 characters.</Text>
        </View>

        {!!apiError && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={16} color="#F44336" />
            <Text style={styles.errorBannerText}>{apiError}</Text>
          </View>
        )}

        <View style={styles.card}>
          <PasswordField
            label="Current Password"
            value={currentPassword}
            onChangeText={v => { setCurrentPassword(v); setApiError(''); }}
            show={showCurrent}
            onToggle={() => setShowCurrent(v => !v)}
          />

          <PasswordField
            label="New Password"
            value={newPassword}
            onChangeText={v => { setNewPassword(v); setApiError(''); }}
            show={showNew}
            onToggle={() => setShowNew(v => !v)}
            placeholder="Min 8 chars, A-z, 0-9, @$!%*?&"
            error={tooShort ? 'At least 8 characters required' : sameAsCurrent ? 'Must differ from current password' : ''}
          />

          {newPassword.length > 0 && (
            <View style={styles.strengthContainer}>
              <View style={styles.strengthBar}>
                <View style={[styles.strengthFill, { width: strength.width as any, backgroundColor: strength.color }]} />
              </View>
              <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
            </View>
          )}

          <PasswordField
            label="Confirm New Password"
            value={confirmPassword}
            onChangeText={v => { setConfirmPassword(v); setApiError(''); }}
            show={showConfirm}
            onToggle={() => setShowConfirm(v => !v)}
            error={mismatch ? 'Passwords do not match' : ''}
          />
        </View>

        <Button
          title={isLoading ? 'Changing Password...' : 'Change Password'}
          onPress={handleSubmit}
          variant="primary"
          size="lg"
          fullWidth
          loading={isLoading}
          disabled={isLoading}
        />

        <View style={{ height: theme.spacing.xxl }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { flexGrow: 1, paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xxl, paddingTop: theme.spacing.lg },
  iconContainer: { alignItems: 'center', marginBottom: theme.spacing.lg },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: theme.colors.surfaceVariant,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  subtitle: { fontSize: theme.fontSize.md, color: theme.colors.gray, textAlign: 'center' },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm,
    backgroundColor: '#FFEBEE', borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md, marginBottom: theme.spacing.md,
  },
  errorBannerText: { flex: 1, fontSize: theme.fontSize.sm, color: '#C62828' },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  inputGroup: { marginBottom: theme.spacing.md },
  label: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.medium, color: theme.colors.onBackground, marginBottom: theme.spacing.xs },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1, borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
  },
  inputRowError: { borderColor: '#F44336' },
  inputIcon: { marginRight: theme.spacing.sm },
  input: { flex: 1, fontSize: theme.fontSize.md, color: theme.colors.onBackground, paddingVertical: theme.spacing.md },
  eyeBtn: { padding: theme.spacing.sm },
  fieldError: { fontSize: theme.fontSize.xs, color: '#F44336', marginTop: 4 },
  strengthContainer: { flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm, marginBottom: theme.spacing.md, marginTop: -theme.spacing.xs },
  strengthBar: { flex: 1, height: 4, backgroundColor: theme.colors.border, borderRadius: 2, overflow: 'hidden' },
  strengthFill: { height: '100%', borderRadius: 2 },
  strengthLabel: { fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.semibold, width: 44 },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background, padding: theme.spacing.xl },
  successCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#4CAF50', alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.lg },
  successTitle: { fontSize: theme.fontSize.xxl, fontWeight: theme.fontWeight.bold, color: theme.colors.onBackground, marginBottom: theme.spacing.sm },
  successSub: { fontSize: theme.fontSize.md, color: theme.colors.gray, textAlign: 'center', marginBottom: theme.spacing.xl },
  successBtn: { backgroundColor: theme.colors.primary, paddingHorizontal: theme.spacing.xl, paddingVertical: theme.spacing.md, borderRadius: theme.borderRadius.full },
  successBtnText: { color: theme.colors.onPrimary, fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold },
});

export default ChangePasswordScreen;
