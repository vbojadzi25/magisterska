import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';
import Button from '../components/Button';
import { authAPI, banksAPI, setAuthToken, getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface TwoFactorScreenProps {
  navigation: any;
  route: {
    params: {
      userId: string;
      phoneHint: string;
    };
  };
}

const TwoFactorScreen: React.FC<TwoFactorScreenProps> = ({ navigation, route }) => {
  const { userId, phoneHint } = route.params;
  const { login } = useAuth();

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [resendMessage, setResendMessage] = useState('');

  const inputs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCodeChange = (value: string, index: number) => {
    if (value.length > 1) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }
    if (newCode.every(d => d !== '') && !isVerifying) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (verificationCode?: string) => {
    const codeToVerify = verificationCode || code.join('');
    if (codeToVerify.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit code');
      return;
    }

    setErrorMessage('');
    setIsVerifying(true);
    try {
      const response = await authAPI.verifyLogin({ userId, code: codeToVerify });
      const { user, accessToken } = response.data.data;

      // Temporarily set token to check for bank accounts
      setAuthToken(accessToken);
      const accountsRes = await banksAPI.getUserAccounts();
      const accounts = accountsRes.data.data || [];

      if (accounts.length === 0) {
        setIsVerifying(false);
        navigation.navigate('AddBankAccount', { isOnboarding: true, user, token: accessToken });
      } else {
        login(user, accessToken);
      }
    } catch (error: any) {
      setIsVerifying(false);
      setCode(['', '', '', '', '', '']);
      setErrorMessage(getErrorMessage(error, 'Invalid or expired code. Please try again.'));
      setTimeout(() => inputs.current[0]?.focus(), 50);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setResendMessage('');
    try {
      await authAPI.resendLoginCode(userId);
      setTimer(60);
      setCanResend(false);
      setCode(['', '', '', '', '', '']);
      setResendMessage('A new code has been sent.');
      inputs.current[0]?.focus();
    } catch {
      setResendMessage('Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const formatTimer = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* Back */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.onBackground} />
          </TouchableOpacity>
        </View>

        {/* Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="shield-checkmark" size={48} color={theme.colors.primary} />
          </View>
        </View>

        <Text style={styles.title}>Two-Factor Authentication</Text>
        <Text style={styles.description}>
          We've sent a 6-digit verification code to
        </Text>
        <Text style={styles.phoneHint}>{phoneHint}</Text>

        {/* Code inputs */}
        <View style={styles.codeContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={ref => (inputs.current[index] = ref)}
              style={[
                styles.codeInput,
                digit ? styles.codeInputFilled : null,
                isVerifying ? styles.codeInputDisabled : null,
              ]}
              value={digit}
              onChangeText={value => handleCodeChange(value, index)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
              keyboardType="numeric"
              maxLength={1}
              editable={!isVerifying}
              selectTextOnFocus
              autoFocus={index === 0}
            />
          ))}
        </View>

        {!!errorMessage && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={16} color="#F44336" />
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
          </View>
        )}

        {!!resendMessage && (
          <View style={styles.resendBanner}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            <Text style={styles.resendBannerText}>{resendMessage}</Text>
          </View>
        )}

        {/* Timer / Resend */}
        <View style={styles.resendContainer}>
          {!canResend ? (
            <Text style={styles.timerText}>Resend code in {formatTimer(timer)}</Text>
          ) : (
            <TouchableOpacity onPress={handleResend} disabled={isResending}>
              <Text style={styles.resendText}>
                {isResending ? 'Sending...' : 'Resend Code'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title={isVerifying ? 'Verifying...' : 'Verify'}
            onPress={() => handleVerify()}
            variant="primary"
            size="lg"
            fullWidth
            loading={isVerifying}
            disabled={code.some(d => d === '') || isVerifying}
          />
        </View>

        {/* Demo hint */}
        <View style={styles.demoHint}>
          <Ionicons name="terminal-outline" size={16} color={theme.colors.primary} />
          <Text style={styles.demoText}>
            Demo: Check the server console for the 6-digit code printed as a
            "simulated SMS".
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  header: {
    paddingTop: 56,
    paddingBottom: theme.spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  iconCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: theme.colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.onBackground,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  description: {
    fontSize: theme.fontSize.md,
    color: theme.colors.gray,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  phoneHint: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xl,
  },
  codeInput: {
    width: 48,
    height: 56,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    textAlign: 'center',
    color: theme.colors.onBackground,
  },
  codeInputFilled: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surfaceVariant,
  },
  codeInputDisabled: {
    opacity: 0.6,
  },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm,
    backgroundColor: '#FFEBEE', borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md, marginBottom: theme.spacing.md,
  },
  errorBannerText: { flex: 1, fontSize: theme.fontSize.sm, color: '#C62828' },
  resendBanner: {
    flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm,
    backgroundColor: '#E8F5E9', borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md, marginBottom: theme.spacing.md,
  },
  resendBannerText: { flex: 1, fontSize: theme.fontSize.sm, color: '#2E7D32' },
  resendContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  timerText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.gray,
  },
  resendText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary,
  },
  buttonContainer: {
    marginBottom: theme.spacing.lg,
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
});

export default TwoFactorScreen;
