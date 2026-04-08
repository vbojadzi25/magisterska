import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';
import { useAuth } from '../context/AuthContext';
import { banksAPI, transactionsAPI, getErrorMessage } from '../services/api';

interface BankAccount {
  id: string;
  accountNumber: string;
  availableBalance: number;
  currency: string;
  bank?: { name: string };
}

interface TxnUser {
  id: string;
  name: string;
  profileImageUrl?: string;
}

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  description: string;
  emoji: string;
  direction: 'sent' | 'received';
  isRequest: boolean;
  status: string;
  fromUser: TxnUser | null;
  toUser: TxnUser | null;
  createdAt: string;
}

// ─── Module-level sub-components (never define inside render) ─────────────────

const AvatarCircle = ({ name, color, size }: { name: string; color: string; size: number }) => {
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size * 0.36, fontWeight: '700', color: '#fff' }}>{initials}</Text>
    </View>
  );
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── HomeScreen ───────────────────────────────────────────────────────────────

const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuth();

  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payError, setPayError] = useState<{ id: string; msg: string } | null>(null);

  const loadAll = useCallback(async () => {
    try {
      const [accsRes, txnRes, reqRes] = await Promise.all([
        banksAPI.getUserAccounts(),
        transactionsAPI.getHistory(10),
        transactionsAPI.getPendingRequests(),
      ]);

      const accs: BankAccount[] = (accsRes.data.data || accsRes.data.accounts || []).map((a: any) => ({
        id: a.id,
        accountNumber: a.accountNumber,
        availableBalance: parseFloat(String(a.availableBalance)),
        currency: a.currency || 'MKD',
        bank: a.bank,
      }));
      setAccounts(accs);

      setTransactions((txnRes.data.transactions || []).map((t: any) => ({
        id: t.id,
        amount: parseFloat(String(t.amount)),
        currency: t.currency,
        description: t.description,
        emoji: t.emoji || '💸',
        direction: t.direction,
        isRequest: t.isRequest,
        status: t.status,
        fromUser: t.fromUser,
        toUser: t.toUser,
        createdAt: t.createdAt,
      })));

      setPendingRequests((reqRes.data.requests || []).map((t: any) => ({
        id: t.id,
        amount: parseFloat(String(t.amount)),
        currency: t.currency,
        description: t.description,
        emoji: t.emoji || '💸',
        direction: t.direction,
        isRequest: true,
        status: t.status,
        fromUser: t.fromUser,
        toUser: t.toUser,
        createdAt: t.createdAt,
      })));
    } catch (e) {
      // silently ignore — user sees empty state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Reload every time this screen comes into focus (e.g. after sending money)
  useFocusEffect(useCallback(() => {
    setLoading(true);
    loadAll();
  }, [loadAll]));

  const onRefresh = () => {
    setRefreshing(true);
    loadAll();
  };

  const handlePayRequest = async (txn: Transaction) => {
    const fromAccount = accounts[0];
    if (!fromAccount) return;
    setPayingId(txn.id);
    setPayError(null);
    try {
      await transactionsAPI.pay(txn.id, fromAccount.id);
      await loadAll();
    } catch (e) {
      setPayError({ id: txn.id, msg: getErrorMessage(e, 'Payment failed') });
    } finally {
      setPayingId(null);
    }
  };

  const totalBalance = accounts.reduce((sum, a) => sum + a.availableBalance, 0);
  const primaryCurrency = accounts[0]?.currency || 'MKD';

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.logo}>💸 Denar</Text>
          </View>
        </View>
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.getParent()?.navigate('ProfileTab')}>
            <View style={styles.profileIcon}>
              <Ionicons name="person" size={24} color={theme.colors.onPrimary} />
            </View>
          </TouchableOpacity>
          <Text style={styles.logo}>💸 Denar</Text>
          {user && <Text style={styles.greetingText}>Hey, {user.firstName}!</Text>}
          <View style={{ width: 24 }} />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total Available Balance</Text>
          <Text style={styles.balance}>{totalBalance.toFixed(2)} {primaryCurrency}</Text>
          {accounts.length > 1 && (
            <Text style={styles.balanceSubtext}>{accounts.length} accounts</Text>
          )}
          {accounts.length === 0 && (
            <Text style={styles.balanceSubtext}>No linked accounts</Text>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('SendMoney')}>
            <View style={[styles.actionIcon, { backgroundColor: theme.colors.primary }]}>
              <Ionicons name="arrow-up" size={24} color={theme.colors.onPrimary} />
            </View>
            <Text style={styles.actionText}>Send</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('RequestMoney')}>
            <View style={[styles.actionIcon, { backgroundColor: theme.colors.request }]}>
              <Ionicons name="arrow-down" size={24} color={theme.colors.onPrimary} />
            </View>
            <Text style={styles.actionText}>Request</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.getParent()?.navigate('FriendsTab')}>
            <View style={[styles.actionIcon, { backgroundColor: theme.colors.secondary }]}>
              <Ionicons name="people" size={24} color={theme.colors.onPrimary} />
            </View>
            <Text style={styles.actionText}>Friends</Text>
          </TouchableOpacity>
        </View>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pending Requests</Text>
            {pendingRequests.map((req) => {
              const requesterName = req.toUser?.name || 'Someone';
              const isPaying = payingId === req.id;
              const err = payError?.id === req.id ? payError.msg : null;
              return (
                <View key={req.id} style={styles.requestCard}>
                  <AvatarCircle name={requesterName} color={theme.colors.request} size={44} />
                  <View style={styles.requestInfo}>
                    <Text style={styles.requestTitle}>
                      <Text style={styles.requestName}>{requesterName}</Text>
                      {' requests '}
                      <Text style={styles.requestAmount}>{req.amount.toFixed(2)} {req.currency}</Text>
                    </Text>
                    {req.description ? (
                      <Text style={styles.requestDesc}>{req.emoji} {req.description}</Text>
                    ) : null}
                    {err ? <Text style={styles.requestErr}>{err}</Text> : null}
                  </View>
                  <TouchableOpacity
                    style={[styles.payBtn, isPaying && styles.payBtnDisabled]}
                    onPress={() => handlePayRequest(req)}
                    disabled={isPaying}
                  >
                    {isPaying
                      ? <ActivityIndicator size="small" color={theme.colors.onPrimary} />
                      : <Text style={styles.payBtnText}>Pay</Text>}
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>💸</Text>
              <Text style={styles.emptyText}>No transactions yet</Text>
              <Text style={styles.emptySubtext}>Send or request money to get started</Text>
            </View>
          ) : (
            transactions.map((txn) => {
              const isSent = txn.direction === 'sent';
              const counterpart = isSent ? txn.toUser : txn.fromUser;
              const name = counterpart?.name || 'Unknown';
              return (
                <View key={txn.id} style={styles.activityItem}>
                  <View style={styles.activityEmoji}>
                    <Text style={styles.emoji}>{txn.emoji}</Text>
                  </View>
                  <View style={styles.activityContent}>
                    <View style={styles.activityRow}>
                      <Text style={styles.activityUsers} numberOfLines={1}>
                        {isSent ? `You → ${name}` : `${name} → You`}
                      </Text>
                      <Text style={[styles.activityAmount, { color: isSent ? theme.colors.request : theme.colors.success }]}>
                        {isSent ? '-' : '+'}{txn.amount.toFixed(2)} {txn.currency}
                      </Text>
                    </View>
                    {txn.description ? <Text style={styles.activityDesc}>{txn.description}</Text> : null}
                    <Text style={styles.activityTime}>{timeAgo(txn.createdAt)}</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: theme.spacing.xl }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    backgroundColor: theme.colors.primary,
    paddingTop: 50,
    paddingBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    fontSize: theme.fontSize.xxl,
    fontWeight: '700',
    color: theme.colors.onPrimary,
  },
  greetingText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
  },
  scroll: { flex: 1 },
  balanceCard: {
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
  },
  balanceLabel: { fontSize: theme.fontSize.sm, color: theme.colors.gray, marginBottom: theme.spacing.xs },
  balance: { fontSize: 36, fontWeight: '700', color: theme.colors.primary, marginBottom: theme.spacing.xs },
  balanceSubtext: { fontSize: theme.fontSize.sm, color: theme.colors.gray },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  actionButton: { alignItems: 'center' },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  actionText: { fontSize: theme.fontSize.sm, fontWeight: '500', color: theme.colors.onBackground },
  section: { paddingHorizontal: theme.spacing.md, marginBottom: theme.spacing.lg },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.onBackground,
    marginBottom: theme.spacing.md,
  },
  // Pending request cards
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.request,
  },
  requestInfo: { flex: 1, marginLeft: theme.spacing.sm, marginRight: theme.spacing.sm },
  requestTitle: { fontSize: theme.fontSize.sm, color: theme.colors.onBackground },
  requestName: { fontWeight: '700' },
  requestAmount: { fontWeight: '700', color: theme.colors.request },
  requestDesc: { fontSize: theme.fontSize.xs, color: theme.colors.gray, marginTop: 2 },
  requestErr: { fontSize: theme.fontSize.xs, color: '#DC2626', marginTop: 2 },
  payBtn: {
    backgroundColor: theme.colors.request,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    minWidth: 56,
    alignItems: 'center',
  },
  payBtnDisabled: { opacity: 0.6 },
  payBtnText: { color: theme.colors.onPrimary, fontWeight: '700', fontSize: theme.fontSize.sm },
  // Activity feed
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
  },
  activityEmoji: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  emoji: { fontSize: 22 },
  activityContent: { flex: 1 },
  activityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  activityUsers: { fontSize: theme.fontSize.sm, fontWeight: '600', color: theme.colors.onBackground, flex: 1, marginRight: theme.spacing.sm },
  activityAmount: { fontSize: theme.fontSize.sm, fontWeight: '700' },
  activityDesc: { fontSize: theme.fontSize.xs, color: theme.colors.gray, marginBottom: 2 },
  activityTime: { fontSize: theme.fontSize.xs, color: theme.colors.gray },
  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: theme.spacing.xxl },
  emptyIcon: { fontSize: 48, marginBottom: theme.spacing.md },
  emptyText: { fontSize: theme.fontSize.lg, fontWeight: '600', color: theme.colors.onBackground, marginBottom: theme.spacing.xs },
  emptySubtext: { fontSize: theme.fontSize.sm, color: theme.colors.gray },
});

export default HomeScreen;
