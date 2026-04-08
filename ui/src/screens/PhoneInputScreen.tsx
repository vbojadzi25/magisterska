import React, { useState } from 'react';
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

interface PhoneInputScreenProps {
  navigation: any;
}

const PhoneInputScreen: React.FC<PhoneInputScreenProps> = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode] = useState('+389');
  const [isLoading, setIsLoading] = useState(false);

  const formatPhoneNumber = (input: string) => {
    // Remove all non-numeric characters
    const numbers = input.replace(/\D/g, '');

    // Format as XX XXX XXX
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 5) {
      return `${numbers.slice(0, 2)} ${numbers.slice(2)}`;
    } else {
      return `${numbers.slice(0, 2)} ${numbers.slice(2, 5)} ${numbers.slice(5, 8)}`;
    }
  };

  const validatePhoneNumber = (number: string) => {
    // Remove all non-numeric characters
    const cleanNumber = number.replace(/\D/g, '');

    // Macedonian mobile numbers should be 8 digits (starting with 70-79)
    if (cleanNumber.length !== 8) {
      return false;
    }

    // Should start with 7 (mobile prefix)
    if (!cleanNumber.startsWith('7')) {
      return false;
    }

    return true;
  };

  const handlePhoneNumberChange = (input: string) => {
    const formatted = formatPhoneNumber(input);
    setPhoneNumber(formatted);
  };

  const handleContinue = async () => {
    const cleanNumber = phoneNumber.replace(/\D/g, '');

    if (!validatePhoneNumber(phoneNumber)) {
      Alert.alert(
        'Invalid Phone Number',
        'Please enter a valid Macedonian mobile number (8 digits starting with 7)'
      );
      return;
    }

    const fullPhoneNumber = `${countryCode}${cleanNumber}`;

    setIsLoading(true);

    try {
      // Simulate API call to send verification code
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Navigate to verification screen
      navigation.navigate('PhoneVerification', {
        phoneNumber: fullPhoneNumber
      });

      Alert.alert(
        'Code Sent',
        `Verification code sent to ${fullPhoneNumber}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isValid = validatePhoneNumber(phoneNumber);

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
        <Text style={styles.title}>Enter Your Phone Number</Text>
        <Text style={styles.description}>
          We'll send you a verification code to confirm your phone number
        </Text>

        {/* Country Code and Phone Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Phone Number</Text>
          <View style={styles.phoneInputRow}>
            <View style={styles.countryCodeContainer}>
              <Text style={styles.countryCode}>{countryCode}</Text>
            </View>
            <TextInput
              style={styles.phoneInput}
              value={phoneNumber}
              onChangeText={handlePhoneNumberChange}
              placeholder="70 123 456"
              keyboardType="numeric"
              maxLength={10} // XX XXX XXX format
              placeholderTextColor={theme.colors.gray}
              autoFocus
            />
          </View>
          {phoneNumber && !isValid && (
            <Text style={styles.errorText}>
              Enter a valid Macedonian mobile number (8 digits starting with 7)
            </Text>
          )}
        </View>

        {/* Example */}
        <View style={styles.exampleContainer}>
          <Text style={styles.exampleText}>
            Example: 70 123 456
          </Text>
        </View>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <Button
            title={isLoading ? 'Sending Code...' : 'Send Verification Code'}
            onPress={handleContinue}
            variant="primary"
            size="lg"
            fullWidth
            loading={isLoading}
            disabled={!isValid || isLoading}
          />
        </View>

        {/* Privacy Notice */}
        <Text style={styles.privacyText}>
          By continuing, you agree to receive SMS messages from Denar. Message and data rates may apply.
        </Text>

        {/* Demo Hint */}
        <View style={styles.demoHint}>
          <Text style={styles.demoText}>
            Demo: Use any valid format like "70 123 456"
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
    marginBottom: theme.spacing.xl,
  },
  inputContainer: {
    marginBottom: theme.spacing.lg,
  },
  inputLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.onBackground,
    marginBottom: theme.spacing.sm,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCodeContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.sm,
  },
  countryCode: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.onBackground,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.onBackground,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  errorText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.error,
    marginTop: theme.spacing.sm,
  },
  exampleContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  exampleText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray,
    fontStyle: 'italic',
  },
  buttonContainer: {
    marginBottom: theme.spacing.lg,
  },
  privacyText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
  },
  demoHint: {
    backgroundColor: theme.colors.surfaceVariant,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  demoText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default PhoneInputScreen;