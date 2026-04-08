import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';
import Button from '../components/Button';
import { friendsAPI, banksAPI, transactionsAPI, getErrorMessage } from '../services/api';

interface FriendItem {
  id: string;
  name: string;
  profileImageUrl?: string;
}

interface BankAccount {
  id: string;
  accountNumber: string;
  accountName: string;
  availableBalance: number;
  currency: string;
  bank?: { name: string };
}

const AvatarCircle = ({ name, color, size }: { name: string; color: string; size: number }) => {
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size * 0.35, fontWeight: '700', color: theme.colors.onPrimary }}>{initials}</Text>
    </View>
  );
};

const emojis = ['💸', '☕', '🍽️', '🎬', '🚗', '🏠', '🎉', '💡', '📱', '🎵'];
const privacyOptions = [
  { value: 'friends', label: 'Friends', icon: 'people-outline' as const },
  { value: 'public', label: 'Public', icon: 'globe-outline' as const },
  { value: 'private', label: 'Private', icon: 'lock-closed-outline' as const },
];

const SendMoneyScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const presetRecipientId: string | undefined = route?.params?.recipientId;
  const presetRecipientName: string | undefined = route?.params?.recipient;

  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>(presetRecipientId || '');
  const [selectedRecipientName, setSelectedRecipientName] = useState<string>(presetRecipientName || '');
  const [recipientSearch, setRecipientSearch] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('💸');
  const [privacy, setPrivacy] = useState<'public' | 'friends' | 'private'>('friends');
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [friendsRes, accountsRes] = await Promise.all([
        friendsAPI.getAll(),
        banksAPI.getUserAccounts(),
      ]);
      setFriends((friendsRes.data.friends || []).map((f: any) => ({
        id: f.id, name: f.name, profileImageUrl: f.profileImageUrl,
      })));
      const accs: BankAccount[] = (accountsRes.data.data || accountsRes.data.accounts || []).map((a: any) => ({
        id: a.id,
        accountNumber: a.accountNumber,
        accountName: a.accountName,
        availableBalance: parseFloat(String(a.availableBalance)),
        currency: a.currency || 'MKD',
        bank: a.bank,
      }));
      setAccounts(accs);
      if (accs.length > 0) setSelectedAccountId(accs[0].id);
    } catch (e) {
      setErrorMessage(getErrorMessage(e, 'Failed to load data'));
    } finally {
      setLoading(false);
    }
  };

  const suggestions = recipientSearch.trim().length > 0
    ? friends.filter(f => f.name.toLowerCase().includes(recipientSearch.toLowerCase()))
    : friends;

  const handleSelectFriend = (friend: FriendItem) => {
    setSelectedRecipientId(friend.id);
    setSelectedRecipientName(friend.name);
    setRecipientSearch('');
    setErrorMessage('');
  };

  const handleClearRecipient = () => {
    setSelectedRecipientId('');
    setSelectedRecipientName('');
    setRecipientSearch('');
  };

  const handleConfirm = () => {
    setErrorMessage('');
    if (!selectedRecipientId) { setErrorMessage('Please select a recipient'); return; }
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt < 1) { setErrorMessage('Minimum amount is 1 MKD'); return; }
    if (!selectedAccountId) { setErrorMessage('Please select a bank account'); return; }
    setConfirming(true);
  };

  const handleSend = async () => {
    setSubmitting(true);
    setErrorMessage('');
    try {
      await transactionsAPI.send({
        toUserId: selectedRecipientId,
        fromBankAccountId: selectedAccountId,
        amount,
        description,
        emoji: selectedEmoji,
        privacy,
      });
      setConfirming(false);
      setSuccessMessage(`Sent ${amount} MKD to ${selectedRecipientName}!`);
    } catch (e) {
      setConfirming(false);
      setErrorMessage(getErrorMessage(e, 'Failed to send money'));
    } finally {
      setSubmitting(false);
    }
  };

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;
  }

  if (successMessage) {
    return (
      <View style={styles.centered}>
        <Text style={styles.successIcon}>✅</Text>
        <Text style={styles.successTitle}>{successMessage}</Text>
        <Button title="Done" onPress={() => navigation.goBack()} variant="primary" size="lg" />
      </View>
    );
  }

  if (confirming) {
    return (
      <View style={styles.confirmOverlay}>
        <View style={styles.confirmCard}>
          <Text style={styles.confirmTitle}>Confirm Payment</Text>
          <Text style={styles.confirmAmount}>{amount} MKD</Text>
          <Text style={styles.confirmTo}>to {selectedRecipientName}</Text>
          {description ? <Text style={styles.confirmNote}>{selectedEmoji} {description}</Text> : null}
          {selectedAccount && (
            <Text style={styles.confirmAccount}>
              From: {selectedAccount.bank?.name || 'Bank'} ···{selectedAccount.accountNumber.slice(-4)}
            </Text>
          )}
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
          <View style={styles.confirmButtons}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setConfirming(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.sendBtn, submitting && styles.disabledBtn]} onPress={handleSend} disabled={submitting}>
              {submitting ? <ActivityIndicator size="small" color={theme.colors.onPrimary} /> : <Text style={styles.sendBtnText}>Send</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">

        {/* Amount */}
        <View style={styles.amountSection}>
          <Text style={styles.currencySymbol}>MKD</Text>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            placeholder="0"
            keyboardType="numeric"
            placeholderTextColor={theme.colors.lightGray}
          />
        </View>

        {/* Recipient */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>To</Text>
          {selectedRecipientName ? (
            <TouchableOpacity style={styles.selectedRecipient} onPress={handleClearRecipient}>
              <AvatarCircle name={selectedRecipientName} color={theme.colors.primary} size={36} />
              <Text style={styles.selectedRecipientName}>{selectedRecipientName}</Text>
              <Ionicons name="close-circle" size={20} color={theme.colors.gray} />
            </TouchableOpacity>
          ) : (
            <View>
              <View style={styles.searchBox}>
                <Ionicons name="search-outline" size={18} color={theme.colors.gray} />
                <TextInput
                  style={styles.searchInput}
                  value={recipientSearch}
                  onChangeText={setRecipientSearch}
                  placeholder="Search friends..."
                  placeholderTextColor={theme.colors.gray}
                  autoCorrect={false}
                />
                {recipientSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setRecipientSearch('')}>
                    <Ionicons name="close-circle" size={18} color={theme.colors.gray} />
                  </TouchableOpacity>
                )}
              </View>
              {suggestions.length > 0 ? (
                <View style={styles.suggestionList}>
                  {suggestions.map((f) => (
                    <TouchableOpacity key={f.id} style={styles.suggestionRow} onPress={() => handleSelectFriend(f)}>
                      <AvatarCircle name={f.name} color={theme.colors.primary} size={36} />
                      <Text style={styles.suggestionName}>{f.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyText}>
                  {recipientSearch.length > 0 ? 'No friends match that name' : 'No friends yet'}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Bank Account */}
        {accounts.length > 1 && (
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>From account</Text>
            {accounts.map((acc) => (
              <TouchableOpacity
                key={acc.id}
                style={[styles.accountOption, selectedAccountId === acc.id && styles.accountOptionSelected]}
                onPress={() => setSelectedAccountId(acc.id)}
              >
                <View style={styles.accountOptionLeft}>
                  <Text style={styles.accountOptionBank}>{acc.bank?.name || 'Bank'}</Text>
                  <Text style={styles.accountOptionNumber}>···{acc.accountNumber.slice(-4)}</Text>
                </View>
                <Text style={styles.accountOptionBalance}>{acc.availableBalance.toFixed(2)} {acc.currency}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {accounts.length === 1 && selectedAccount && (
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>From account</Text>
            <View style={styles.singleAccount}>
              <Text style={styles.accountOptionBank}>{selectedAccount.bank?.name || 'Bank'}</Text>
              <Text style={styles.accountOptionNumber}>···{selectedAccount.accountNumber.slice(-4)}</Text>
              <Text style={styles.singleAccountBalance}>
                {selectedAccount.availableBalance.toFixed(2)} {selectedAccount.currency} available
              </Text>
            </View>
          </View>
        )}

        {/* Description */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>What's it for?</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={description}
              onChangeText={setDescription}
              placeholder="Add a note..."
              placeholderTextColor={theme.colors.gray}
            />
          </View>
        </View>

        {/* Emoji */}
        <View style={styles.emojiSection}>
          <Text style={styles.sectionTitle}>Add emoji</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.emojiContainer}>
              {emojis.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={[styles.emojiButton, selectedEmoji === emoji && styles.selectedEmoji]}
                  onPress={() => setSelectedEmoji(emoji)}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Privacy */}
        <View style={styles.privacySection}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          <View style={styles.privacyContainer}>
            {privacyOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[styles.privacyOption, privacy === option.value && styles.selectedPrivacy]}
                onPress={() => setPrivacy(option.value as any)}
              >
                <Ionicons name={option.icon} size={18} color={privacy === option.value ? theme.colors.primary : theme.colors.gray} />
                <Text style={[styles.privacyText, { color: privacy === option.value ? theme.colors.primary : theme.colors.gray }]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {errorMessage ? (
          <View style={styles.errorBanner}><Text style={styles.errorText}>{errorMessage}</Text></View>
        ) : null}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <Button title={`Send ${amount ? `${amount} MKD` : 'Money'}`} onPress={handleConfirm} variant="primary" size="lg" fullWidth />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  centered: { flex: 1, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.xl },
  content: { flex: 1, padding: theme.spacing.md },
  amountSection: { alignItems: 'center', paddingVertical: theme.spacing.xxl, marginBottom: theme.spacing.xl },
  currencySymbol: { fontSize: theme.fontSize.lg, color: theme.colors.gray, marginBottom: theme.spacing.sm },
  amountInput: { fontSize: 48, fontWeight: '700', color: theme.colors.primary, textAlign: 'center', minWidth: 200 },
  inputSection: { marginBottom: theme.spacing.lg },
  inputLabel: { fontSize: theme.fontSize.md, fontWeight: '500', color: theme.colors.onBackground, marginBottom: theme.spacing.sm },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.xs,
  },
  searchInput: { flex: 1, fontSize: theme.fontSize.md, color: theme.colors.onBackground, marginLeft: theme.spacing.sm },
  suggestionList: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  suggestionName: { fontSize: theme.fontSize.md, color: theme.colors.onBackground, marginLeft: theme.spacing.sm, fontWeight: '500' },
  emptyText: { fontSize: theme.fontSize.sm, color: theme.colors.gray, paddingVertical: theme.spacing.sm },
  selectedRecipient: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  selectedRecipientName: { flex: 1, fontSize: theme.fontSize.md, fontWeight: '600', color: theme.colors.onBackground, marginLeft: theme.spacing.sm },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  textInput: { flex: 1, fontSize: theme.fontSize.md, color: theme.colors.onBackground },
  accountOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  accountOptionSelected: { borderColor: theme.colors.primary, backgroundColor: theme.colors.surfaceVariant },
  accountOptionLeft: { flexDirection: 'row', alignItems: 'center' },
  accountOptionBank: { fontSize: theme.fontSize.sm, fontWeight: '600', color: theme.colors.onBackground, marginRight: theme.spacing.sm },
  accountOptionNumber: { fontSize: theme.fontSize.sm, color: theme.colors.gray },
  accountOptionBalance: { fontSize: theme.fontSize.sm, fontWeight: '600', color: theme.colors.primary },
  singleAccount: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border },
  singleAccountBalance: { fontSize: theme.fontSize.sm, color: theme.colors.gray, marginTop: 2 },
  sectionTitle: { fontSize: theme.fontSize.md, fontWeight: '600', color: theme.colors.onBackground, marginBottom: theme.spacing.md },
  emojiSection: { marginBottom: theme.spacing.lg },
  emojiContainer: { flexDirection: 'row', paddingVertical: theme.spacing.sm },
  emojiButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing.sm, borderWidth: 2, borderColor: 'transparent' },
  selectedEmoji: { borderColor: theme.colors.primary, backgroundColor: theme.colors.surfaceVariant },
  emojiText: { fontSize: 24 },
  privacySection: { marginBottom: theme.spacing.xl },
  privacyContainer: { flexDirection: 'row', justifyContent: 'space-around' },
  privacyOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.md, borderRadius: theme.borderRadius.lg, backgroundColor: theme.colors.surface, borderWidth: 2, borderColor: 'transparent' },
  selectedPrivacy: { borderColor: theme.colors.primary, backgroundColor: theme.colors.surfaceVariant },
  privacyText: { fontSize: theme.fontSize.sm, fontWeight: '500', marginLeft: theme.spacing.xs },
  errorBanner: { backgroundColor: '#FEE2E2', borderRadius: theme.borderRadius.md, padding: theme.spacing.md, marginBottom: theme.spacing.lg },
  errorText: { color: '#DC2626', fontSize: theme.fontSize.sm, textAlign: 'center' },
  buttonContainer: { padding: theme.spacing.md, paddingBottom: theme.spacing.xl },
  confirmOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: theme.spacing.xl },
  confirmCard: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.xl, padding: theme.spacing.xl, width: '100%', alignItems: 'center' },
  confirmTitle: { fontSize: theme.fontSize.lg, fontWeight: '700', color: theme.colors.onBackground, marginBottom: theme.spacing.lg },
  confirmAmount: { fontSize: 40, fontWeight: '700', color: theme.colors.primary },
  confirmTo: { fontSize: theme.fontSize.md, color: theme.colors.gray, marginBottom: theme.spacing.md },
  confirmNote: { fontSize: theme.fontSize.sm, color: theme.colors.onBackground, marginBottom: theme.spacing.sm },
  confirmAccount: { fontSize: theme.fontSize.sm, color: theme.colors.gray, marginBottom: theme.spacing.lg },
  confirmButtons: { flexDirection: 'row', marginTop: theme.spacing.md },
  cancelBtn: { flex: 1, paddingVertical: theme.spacing.md, borderRadius: theme.borderRadius.lg, backgroundColor: theme.colors.surfaceVariant, alignItems: 'center', marginRight: theme.spacing.sm },
  cancelBtnText: { fontSize: theme.fontSize.md, fontWeight: '600', color: theme.colors.onBackground },
  sendBtn: { flex: 1, paddingVertical: theme.spacing.md, borderRadius: theme.borderRadius.lg, backgroundColor: theme.colors.primary, alignItems: 'center', marginLeft: theme.spacing.sm },
  disabledBtn: { opacity: 0.6 },
  sendBtnText: { fontSize: theme.fontSize.md, fontWeight: '700', color: theme.colors.onPrimary },
  successIcon: { fontSize: 64, marginBottom: theme.spacing.lg },
  successTitle: { fontSize: theme.fontSize.xl, fontWeight: '700', color: theme.colors.onBackground, textAlign: 'center', marginBottom: theme.spacing.xl },
});

export default SendMoneyScreen;
