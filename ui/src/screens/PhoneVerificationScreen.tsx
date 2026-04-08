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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';
import Button from '../components/Button';

interface PhoneVerificationScreenProps {
  navigation: any;
  route: {
    params: {
      phoneNumber: string;
    };
  };
}

const PhoneVerificationScreen: React.FC<PhoneVerificationScreenProps> = ({ navigation, route }) => {
  const { phoneNumber } = route.params;
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const inputs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => {
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

    // Auto-focus next input
    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }

    // Auto-verify when all digits are entered
    if (newCode.every(digit => digit !== '') && !isVerifying) {
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
      Alert.alert('Error', 'Please enter the complete 6-digit code');
      return;
    }

    setIsVerifying(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // For demo, accept any code with "123456" or the last 6 digits of phone number
      const phoneLastSix = phoneNumber.slice(-6);
      if (codeToVerify === '123456' || codeToVerify === phoneLastSix) {
        Alert.alert('Success', 'Phone number verified successfully!', [
          {
            text: 'Continue',
            onPress: () => navigation.navigate('HomeTab')
          }
        ]);
      } else {
        Alert.alert('Error', 'Invalid verification code. Please try again.');
        setCode(['', '', '', '', '', '']);
        inputs.current[0]?.focus();
      }
    } catch (error) {
      Alert.alert('Error', 'Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      Alert.alert('Code Sent', 'A new verification code has been sent to your phone.');

      // Reset timer
      setTimer(60);
      setCanResend(false);

      // Clear current code
      setCode(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } catch (error) {
      Alert.alert('Error', 'Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const formatPhoneNumber = (phone: string) => {
    if (phone.startsWith('+389')) {
      return `+389 ${phone.slice(4, 6)} ${phone.slice(6, 9)} ${phone.slice(9)}`;
    }
    return phone;
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.onBackground} />
          </TouchableOpacity>
        </View>

        {/* Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="phone-portrait" size={48} color={theme.colors.primary} />
          </View>
        </View>

        {/* Title and Description */}
        <Text style={styles.title}>Verify Your Phone Number</Text>
        <Text style={styles.description}>
          We've sent a 6-digit verification code to
        </Text>
        <Text style={styles.phoneNumber}>{formatPhoneNumber(phoneNumber)}</Text>

        {/* Code Input */}
        <View style={styles.codeContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => inputs.current[index] = ref}
              style={[
                styles.codeInput,
                digit ? styles.codeInputFilled : null,
                isVerifying ? styles.codeInputDisabled : null
              ]}
              value={digit}
              onChangeText={(value) => handleCodeChange(value, index)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
              keyboardType="numeric"
              maxLength={1}
              editable={!isVerifying}
              selectTextOnFocus
            />
          ))}
        </View>

        {/* Timer and Resend */}
        <View style={styles.resendContainer}>
          {!canResend ? (
            <Text style={styles.timerText}>
              Resend code in {formatTimer(timer)}
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResendCode} disabled={isResending}>
              <Text style={styles.resendText}>
                {isResending ? 'Sending...' : 'Resend Code'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Verify Button */}
        <View style={styles.buttonContainer}>
          <Button
            title={isVerifying ? 'Verifying...' : 'Verify'}
            onPress={() => handleVerify()}
            variant="primary"
            size="lg"
            fullWidth
            loading={isVerifying}
            disabled={code.some(digit => digit === '') || isVerifying}
          />
        </View>

        {/* Help Text */}
        <Text style={styles.helpText}>
          Didn't receive the code? Check your SMS or try resending.
        </Text>

        {/* Demo Hint */}
        <View style={styles.demoHint}>
          <Text style={styles.demoText}>
            Demo: Use code "123456" or the last 6 digits of your phone number
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
    paddingTop: 50,
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
    width: 120,
    height: 120,
    borderRadius: 60,
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
  phoneNumber: {
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
  helpText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  demoHint: {
    backgroundColor: theme.colors.surfaceVariant,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginTop: theme.spacing.lg,
  },
  demoText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default PhoneVerificationScreen;