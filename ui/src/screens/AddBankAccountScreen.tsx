import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';
import Button from '../components/Button';
import { banksAPI, bankAccountsAPI, getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { setAuthToken } from '../services/api';

interface AddBankAccountScreenProps {
  navigation: any;
  route: {
    params: {
      isOnboarding?: boolean;
      user?: any;
      token?: string;
    };
  };
}

const ACCOUNT_TYPES = [
  { value: 'checking', label: 'Checking' },
  { value: 'savings', label: 'Savings' },
  { value: 'business', label: 'Business' },
];

const CURRENCIES = ['MKD', 'EUR', 'USD'];

const AddBankAccountScreen: React.FC<AddBankAccountScreenProps> = ({ navigation, route }) => {
  const { isOnboarding = false, user: onboardingUser, token: onboardingToken } = route.params || {};
  const { login } = useAuth();

  const [banks, setBanks] = useState<{ id: string; name: string; code: string }[]>([]);
  const [selectedBankId, setSelectedBankId] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState('checking');
  const [currency, setCurrency] = useState('MKD');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingBanks, setLoadingBanks] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // If onboarding, temporarily set the token so API calls work
    if (isOnboarding && onboardingToken) {
      setAuthToken(onboardingToken);
    }
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    try {
      const res = await banksAPI.getAll();
      const bankList = res.data.data || [];
      setBanks(bankList);
      if (bankList.length > 0) setSelectedBankId(bankList[0].id);
    } catch {
      setErrorMessage('Failed to load banks. Please try again.');
    } finally {
      setLoadingBanks(false);
    }
  };

  const handleSubmit = async () => {
    setErrorMessage('');
    if (!selectedBankId) {
      setErrorMessage('Please select a bank');
      return;
    }
    if (!accountNumber.trim()) {
      setErrorMessage('Please enter your account/transaction number');
      return;
    }
    if (!accountName.trim()) {
      setErrorMessage('Please enter an account name');
      return;
    }

    setIsLoading(true);
    try {
      await bankAccountsAPI.add({
        bankId: selectedBankId,
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim(),
        accountType,
        currency,
      });

      if (isOnboarding && onboardingUser && onboardingToken) {
        login(onboardingUser, onboardingToken);
      } else {
        navigation.goBack();
      }
    } catch (error: any) {
      setIsLoading(false);
      setErrorMessage(getErrorMessage(error, 'Failed to add account. Please try again.'));
    }
  };

  const handleSkip = () => {
    if (isOnboarding && onboardingUser && onboardingToken) {
      login(onboardingUser, onboardingToken);
    } else {
      navigation.goBack();
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
          {!isOnboarding && (
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.onBackground} />
            </TouchableOpacity>
          )}
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>{isOnboarding ? 'Link Your Bank Account' : 'Add Bank Account'}</Text>
            {isOnboarding && (
              <Text style={styles.headerSubtitle}>
                Link your bank account to send and receive money instantly.
              </Text>
            )}
          </View>
        </View>

        {!!errorMessage && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={16} color="#F44336" />
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
          </View>
        )}

        {/* Bank Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Bank</Text>
          {loadingBanks ? (
            <Text style={styles.loadingText}>Loading banks...</Text>
          ) : (
            <View style={styles.bankGrid}>
              {banks.map(bank => (
                <TouchableOpacity
                  key={bank.id}
                  style={[
                    styles.bankCard,
                    selectedBankId === bank.id && styles.bankCardSelected,
                  ]}
                  onPress={() => setSelectedBankId(bank.id)}
                >
                  <View style={[styles.bankIcon, selectedBankId === bank.id && styles.bankIconSelected]}>
                    <Ionicons
                      name="business"
                      size={20}
                      color={selectedBankId === bank.id ? theme.colors.onPrimary : theme.colors.primary}
                    />
                  </View>
                  <Text
                    style={[styles.bankName, selectedBankId === bank.id && styles.bankNameSelected]}
                    numberOfLines={2}
                  >
                    {bank.name.replace(' AD Skopje', '').replace('Štedilnica ', '')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Account Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Account / Transaction Number</Text>
            <View style={styles.inputRow}>
              <Ionicons name="card-outline" size={18} color={theme.colors.gray} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={accountNumber}
                onChangeText={setAccountNumber}
                placeholder="e.g. 200000123456789"
                keyboardType="numeric"
                placeholderTextColor={theme.colors.gray}
              />
            </View>
            <Text style={styles.hint}>Enter the 15-digit transaction number from your bank card or statement</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Account Nickname</Text>
            <View style={styles.inputRow}>
              <Ionicons name="bookmark-outline" size={18} color={theme.colors.gray} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={accountName}
                onChangeText={setAccountName}
                placeholder="e.g. My Main Account"
                placeholderTextColor={theme.colors.gray}
              />
            </View>
          </View>

          {/* Account Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Account Type</Text>
            <View style={styles.chipRow}>
              {ACCOUNT_TYPES.map(t => (
                <TouchableOpacity
                  key={t.value}
                  style={[styles.chip, accountType === t.value && styles.chipSelected]}
                  onPress={() => setAccountType(t.value)}
                >
                  <Text style={[styles.chipText, accountType === t.value && styles.chipTextSelected]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Currency */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Currency</Text>
            <View style={styles.chipRow}>
              {CURRENCIES.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.chip, currency === c && styles.chipSelected]}
                  onPress={() => setCurrency(c)}
                >
                  <Text style={[styles.chipText, currency === c && styles.chipTextSelected]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <Button
          title={isLoading ? 'Linking Account...' : 'Link Account'}
          onPress={handleSubmit}
          variant="primary"
          size="lg"
          fullWidth
          loading={isLoading}
          disabled={isLoading}
        />

        {isOnboarding && (
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        )}

        {/* Info banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="shield-checkmark-outline" size={16} color={theme.colors.primary} />
          <Text style={styles.infoText}>
            Your account number is stored securely and used only for payment initiation via open banking (TPP).
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { flexGrow: 1, paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xxl },
  header: { paddingTop: 56, paddingBottom: theme.spacing.lg },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: theme.colors.surface,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  headerTitleWrap: {},
  headerTitle: { fontSize: theme.fontSize.xxl, fontWeight: theme.fontWeight.bold, color: theme.colors.onBackground },
  headerSubtitle: { fontSize: theme.fontSize.md, color: theme.colors.gray, marginTop: theme.spacing.xs },
  section: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.semibold,
    color: theme.colors.onBackground, marginBottom: theme.spacing.md,
  },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm,
    backgroundColor: '#FFEBEE', borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md, marginBottom: theme.spacing.md,
  },
  errorBannerText: { flex: 1, fontSize: theme.fontSize.sm, color: '#C62828' },
  loadingText: { color: theme.colors.gray, fontSize: theme.fontSize.md },
  bankGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  bankCard: {
    width: '30%', margin: '1.5%',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2, borderColor: theme.colors.border,
    padding: theme.spacing.sm,
    alignItems: 'center',
  },
  bankCardSelected: { borderColor: theme.colors.primary, backgroundColor: theme.colors.surfaceVariant },
  bankIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: theme.colors.surfaceVariant,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: theme.spacing.xs,
  },
  bankIconSelected: { backgroundColor: theme.colors.primary },
  bankName: { fontSize: 10, color: theme.colors.onBackground, textAlign: 'center', fontWeight: theme.fontWeight.medium },
  bankNameSelected: { color: theme.colors.primaryDark },
  inputGroup: { marginBottom: theme.spacing.md },
  label: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.medium, color: theme.colors.onBackground, marginBottom: theme.spacing.xs },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1, borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
  },
  inputIcon: { marginRight: theme.spacing.sm },
  input: { flex: 1, fontSize: theme.fontSize.md, color: theme.colors.onBackground, paddingVertical: theme.spacing.md },
  hint: { fontSize: theme.fontSize.xs, color: theme.colors.gray, marginTop: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.background,
    borderWidth: 1, borderColor: theme.colors.border,
    marginRight: theme.spacing.sm, marginBottom: theme.spacing.xs,
  },
  chipSelected: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipText: { fontSize: theme.fontSize.sm, color: theme.colors.onBackground, fontWeight: theme.fontWeight.medium },
  chipTextSelected: { color: theme.colors.onPrimary },
  skipButton: { alignItems: 'center', paddingVertical: theme.spacing.md },
  skipText: { fontSize: theme.fontSize.md, color: theme.colors.gray },
  infoBanner: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: theme.colors.surfaceVariant,
    padding: theme.spacing.md, borderRadius: theme.borderRadius.lg,
    marginTop: theme.spacing.md, columnGap: theme.spacing.sm,
  },
  infoText: { flex: 1, fontSize: theme.fontSize.sm, color: theme.colors.primaryDark, lineHeight: 20 },
});

export default AddBankAccountScreen;
