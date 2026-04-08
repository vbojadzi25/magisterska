import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';
import { banksAPI, getErrorMessage } from '../services/api';

interface BankAccountDetailScreenProps {
  navigation: any;
  route: {
    params: {
      accountId: string;
    };
  };
}

const BankAccountDetailScreen: React.FC<BankAccountDetailScreenProps> = ({ navigation, route }) => {
  const { accountId } = route.params;
  const [account, setAccount] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchAccount();
  }, []);

  const fetchAccount = async () => {
    try {
      const res = await banksAPI.getUserAccounts();
      const accounts: any[] = res.data.data || [];
      const found = accounts.find((a: any) => a.id === accountId);
      if (found) setAccount(found);
    } catch (error: any) {
      Alert.alert('Error', getErrorMessage(error, 'Failed to load account'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshBalance = async () => {
    setIsRefreshing(true);
    try {
      // In simulation mode, just re-fetch — balance won't change from external bank
      await fetchAccount();
      Alert.alert('Updated', 'Balance is up to date.');
    } catch (error: any) {
      Alert.alert('Error', getErrorMessage(error, 'Failed to refresh balance'));
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!account) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Account not found</Text>
      </View>
    );
  }

  const formatBalance = (amount: number, curr: string) => {
    return `${parseFloat(amount.toString()).toLocaleString('mk-MK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${curr}`;
  };

  const accountTypeIcon: Record<string, string> = {
    checking: 'card',
    savings: 'save',
    business: 'briefcase',
  };

  return (
    <ScrollView style={styles.container}>
      {/* Balance card */}
      <View style={styles.balanceCard}>
        <View style={styles.bankBadge}>
          <Ionicons name="business" size={16} color={theme.colors.onPrimary} />
          <Text style={styles.bankBadgeText}>{account.bank?.name || 'Bank'}</Text>
        </View>
        <Text style={styles.accountNameLabel}>Available Balance</Text>
        <Text style={styles.balanceAmount}>
          {account.balance != null ? formatBalance(account.balance, account.currency) : '—'}
        </Text>
        {account.availableBalance != null && account.availableBalance !== account.balance && (
          <Text style={styles.availableBalance}>
            Available: {formatBalance(account.availableBalance, account.currency)}
          </Text>
        )}
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefreshBalance} disabled={isRefreshing}>
          <Ionicons name="refresh" size={16} color={theme.colors.onPrimary} />
          <Text style={styles.refreshText}>{isRefreshing ? 'Refreshing...' : 'Refresh'}</Text>
        </TouchableOpacity>
      </View>

      {/* Details */}
      <View style={styles.detailCard}>
        <Text style={styles.detailCardTitle}>Account Details</Text>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Account Name</Text>
          <Text style={styles.detailValue}>{account.accountName}</Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Account Number</Text>
          <Text style={styles.detailValue}>{account.accountNumber}</Text>
        </View>
        <View style={styles.divider} />

        {account.iban && (
          <>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>IBAN</Text>
              <Text style={styles.detailValue}>{account.iban}</Text>
            </View>
            <View style={styles.divider} />
          </>
        )}

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Account Type</Text>
          <View style={styles.typeChip}>
            <Ionicons
              name={(accountTypeIcon[account.accountType] || 'card') as any}
              size={14}
              color={theme.colors.primary}
            />
            <Text style={styles.typeChipText}>
              {account.accountType.charAt(0).toUpperCase() + account.accountType.slice(1)}
            </Text>
          </View>
        </View>
        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Currency</Text>
          <Text style={styles.detailValue}>{account.currency}</Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Status</Text>
          <View style={[styles.statusBadge, account.isVerified ? styles.statusVerified : styles.statusPending]}>
            <Ionicons
              name={account.isVerified ? 'checkmark-circle' : 'time'}
              size={14}
              color={account.isVerified ? theme.colors.success : theme.colors.warning}
            />
            <Text style={[styles.statusText, { color: account.isVerified ? theme.colors.success : theme.colors.warning }]}>
              {account.isVerified ? 'Verified' : 'Pending'}
            </Text>
          </View>
        </View>
        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Default Account</Text>
          <View style={styles.defaultBadge}>
            <Ionicons
              name={account.isDefault ? 'star' : 'star-outline'}
              size={14}
              color={account.isDefault ? theme.colors.primary : theme.colors.gray}
            />
            <Text style={[styles.defaultText, { color: account.isDefault ? theme.colors.primary : theme.colors.gray }]}>
              {account.isDefault ? 'Default' : 'Not default'}
            </Text>
          </View>
        </View>

        {account.lastBalanceUpdate && (
          <>
            <View style={styles.divider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Last Updated</Text>
              <Text style={styles.detailValue}>
                {new Date(account.lastBalanceUpdate).toLocaleString()}
              </Text>
            </View>
          </>
        )}
      </View>

      <View style={{ height: theme.spacing.xxl }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background },
  errorText: { fontSize: theme.fontSize.md, color: theme.colors.gray },
  balanceCard: {
    backgroundColor: theme.colors.primary,
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  bankBadge: {
    flexDirection: 'row', alignItems: 'center', columnGap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full, marginBottom: theme.spacing.md,
  },
  bankBadgeText: { color: theme.colors.onPrimary, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.medium },
  accountNameLabel: { fontSize: theme.fontSize.sm, color: 'rgba(255,255,255,0.8)', marginBottom: theme.spacing.xs },
  balanceAmount: { fontSize: 36, fontWeight: theme.fontWeight.bold, color: theme.colors.onPrimary, marginBottom: theme.spacing.xs },
  availableBalance: { fontSize: theme.fontSize.sm, color: 'rgba(255,255,255,0.8)', marginBottom: theme.spacing.md },
  refreshButton: {
    flexDirection: 'row', alignItems: 'center', columnGap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full, marginTop: theme.spacing.md,
  },
  refreshText: { color: theme.colors.onPrimary, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.medium },
  detailCard: {
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.md, marginTop: 0,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
  },
  detailCardTitle: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.semibold, color: theme.colors.onBackground, marginBottom: theme.spacing.md },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: theme.spacing.sm },
  divider: { height: 1, backgroundColor: theme.colors.border },
  detailLabel: { fontSize: theme.fontSize.sm, color: theme.colors.gray },
  detailValue: { fontSize: theme.fontSize.sm, color: theme.colors.onBackground, fontWeight: theme.fontWeight.medium, maxWidth: '60%', textAlign: 'right' },
  typeChip: {
    flexDirection: 'row', alignItems: 'center', columnGap: 4,
    backgroundColor: theme.colors.surfaceVariant,
    paddingHorizontal: theme.spacing.sm, paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
  },
  typeChipText: { fontSize: theme.fontSize.xs, color: theme.colors.primaryDark, fontWeight: theme.fontWeight.medium },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', columnGap: 4,
    paddingHorizontal: theme.spacing.sm, paddingVertical: 4,
    borderRadius: theme.borderRadius.full, backgroundColor: theme.colors.surfaceVariant,
  },
  statusVerified: { backgroundColor: '#E8F5E9' },
  statusPending: { backgroundColor: '#FFF8E1' },
  statusText: { fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.medium },
  defaultBadge: { flexDirection: 'row', alignItems: 'center', columnGap: 4 },
  defaultText: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.medium },
});

export default BankAccountDetailScreen;
