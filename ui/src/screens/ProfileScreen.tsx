import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { authAPI, banksAPI } from '../services/api';

interface ProfileScreenProps {
  navigation: any;
}

// Module-level components — must NOT be defined inside the render function
const ProfileSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const SettingItem = ({
  icon, title, subtitle, onPress, rightContent, showArrow = true,
}: {
  icon: string; title: string; subtitle?: string;
  onPress?: () => void; rightContent?: React.ReactNode; showArrow?: boolean;
}) => (
  <TouchableOpacity style={styles.settingItem} onPress={onPress} disabled={!onPress}>
    <View style={styles.settingLeft}>
      <Ionicons name={icon as any} size={20} color={theme.colors.primary} />
      <View style={styles.settingText}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
    </View>
    <View style={styles.settingRight}>
      {rightContent}
      {showArrow && onPress && (
        <Ionicons name="chevron-forward" size={16} color={theme.colors.gray} />
      )}
    </View>
  </TouchableOpacity>
);

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user, logout } = useAuth();

  const [notifications, setNotifications] = useState({
    pushNotifications: true,
    emailNotifications: true,
    paymentRequests: true,
    friendRequests: true,
  });

  const [accounts, setAccounts] = useState<any[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await banksAPI.getUserAccounts();
        setAccounts(res.data.data || []);
      } catch {
        setAccounts([]);
      } finally {
        setLoadingAccounts(false);
      }
    };
    fetchAccounts();
  }, []);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try { await authAPI.logout(); } catch { /* ignore */ }
          logout();
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => logout() },
      ]
    );
  };

  const displayName = user ? `${user.firstName} ${user.lastName}` : 'User';
  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : '?';

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.profilePlaceholder}>
          <Text style={styles.profileInitials}>{initials}</Text>
        </View>
        <Text style={styles.userName}>{displayName}</Text>
        {user?.phoneNumber && <Text style={styles.userPhone}>{user.phoneNumber}</Text>}
        {user?.email && <Text style={styles.userEmail}>{user.email}</Text>}
        <View style={styles.badgeRow}>
          {user?.phoneVerified && (
            <View style={styles.badge}>
              <Ionicons name="checkmark-circle" size={14} color={theme.colors.primary} />
              <Text style={styles.badgeText}>Phone Verified</Text>
            </View>
          )}
          <View style={styles.badge}>
            <Ionicons name="shield-checkmark" size={14} color={theme.colors.primary} />
            <Text style={styles.badgeText}>2FA Active</Text>
          </View>
        </View>
      </View>

      {/* Account */}
      <ProfileSection title="Account">
        <SettingItem
          icon="person-circle-outline"
          title="Personal Information"
          subtitle="Name, email, phone number"
          onPress={() => navigation.navigate('EditProfile')}
        />
        <SettingItem
          icon="lock-closed-outline"
          title="Change Password"
          onPress={() => navigation.navigate('ChangePassword')}
        />
        <SettingItem
          icon="shield-checkmark-outline"
          title="Two-Factor Authentication"
          subtitle="Enabled — code sent on every login"
          showArrow={false}
        />
      </ProfileSection>

      {/* Bank Accounts */}
      <ProfileSection title="Bank Accounts">
        {loadingAccounts ? (
          <View style={styles.bankLoadingRow}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={styles.bankLoadingText}>Loading accounts...</Text>
          </View>
        ) : accounts.length === 0 ? (
          <View style={styles.bankEmptyRow}>
            <Ionicons name="business-outline" size={20} color={theme.colors.gray} />
            <Text style={styles.bankEmptyText}>No bank accounts linked yet</Text>
          </View>
        ) : (
          accounts.map((account) => (
            <TouchableOpacity
              key={account.id}
              style={styles.bankAccountRow}
              onPress={() => navigation.navigate('BankAccountDetail', { accountId: account.id })}
            >
              <View style={styles.bankAccountLeft}>
                <View style={styles.bankIcon}>
                  <Ionicons name="business" size={18} color={theme.colors.primary} />
                </View>
                <View style={styles.bankAccountText}>
                  <Text style={styles.bankAccountName}>{account.bank?.name || 'Bank Account'}</Text>
                  <Text style={styles.bankAccountNumber}>
                    {account.accountNumber
                      ? `••••${String(account.accountNumber).slice(-4)}`
                      : '—'}
                  </Text>
                </View>
              </View>
              <View style={styles.bankAccountRight}>
                {account.balance != null && (
                  <Text style={styles.bankAccountBalance}>
                    {`${parseFloat(String(account.balance)).toFixed(2)} ${account.currency || ''}`}
                  </Text>
                )}
                <Ionicons name="chevron-forward" size={16} color={theme.colors.gray} />
              </View>
            </TouchableOpacity>
          ))
        )}
        <TouchableOpacity
          style={styles.addAccountButton}
          onPress={() => navigation.navigate('AddBankAccount', { isOnboarding: false })}
        >
          <Ionicons name="add-circle-outline" size={20} color={theme.colors.primary} />
          <Text style={styles.addAccountText}>Add Account</Text>
        </TouchableOpacity>
      </ProfileSection>

      {/* Notifications */}
      <ProfileSection title="Notifications">
        {(['pushNotifications', 'emailNotifications', 'paymentRequests', 'friendRequests'] as const).map(key => (
          <SettingItem
            key={key}
            icon={key === 'pushNotifications' ? 'notifications-outline' : key === 'emailNotifications' ? 'mail-outline' : key === 'paymentRequests' ? 'card-outline' : 'people-outline'}
            title={key === 'pushNotifications' ? 'Push Notifications' : key === 'emailNotifications' ? 'Email Notifications' : key === 'paymentRequests' ? 'Payment Requests' : 'Friend Requests'}
            rightContent={
              <Switch
                value={notifications[key]}
                onValueChange={value => setNotifications(prev => ({ ...prev, [key]: value }))}
                trackColor={{ false: theme.colors.lightGray, true: theme.colors.primaryLight }}
                thumbColor={notifications[key] ? theme.colors.primary : theme.colors.gray}
              />
            }
            showArrow={false}
          />
        ))}
      </ProfileSection>

      {/* Support */}
      <ProfileSection title="Support">
        <SettingItem icon="help-circle-outline" title="Help Center" onPress={() => Alert.alert('Help', 'Coming soon!')} />
        <SettingItem icon="document-text-outline" title="Terms & Privacy Policy" onPress={() => Alert.alert('Legal', 'Coming soon!')} />
      </ProfileSection>

      {/* About */}
      <ProfileSection title="About">
        <SettingItem icon="information-circle-outline" title="App Version" subtitle="1.0.0" showArrow={false} />
      </ProfileSection>

      {/* Danger Zone */}
      <View style={styles.dangerSection}>
        <Button title="Logout" onPress={handleLogout} variant="outline" size="md" fullWidth />
        <View style={{ height: theme.spacing.md }} />
        <Button title="Delete Account" onPress={handleDeleteAccount} variant="ghost" size="md" fullWidth />
      </View>

      <View style={{ height: theme.spacing.xxl }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { alignItems: 'center', padding: theme.spacing.lg, backgroundColor: theme.colors.surface },
  profilePlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.md },
  profileInitials: { fontSize: theme.fontSize.xxl, fontWeight: theme.fontWeight.bold, color: theme.colors.onPrimary },
  userName: { fontSize: theme.fontSize.xxl, fontWeight: theme.fontWeight.bold, color: theme.colors.onBackground, marginBottom: theme.spacing.xs },
  userPhone: { fontSize: theme.fontSize.md, color: theme.colors.gray },
  userEmail: { fontSize: theme.fontSize.sm, color: theme.colors.gray, marginBottom: theme.spacing.sm },
  badgeRow: { flexDirection: 'row', columnGap: theme.spacing.sm, marginTop: theme.spacing.sm, flexWrap: 'wrap', justifyContent: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surfaceVariant, paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.xs, borderRadius: theme.borderRadius.full, columnGap: 4 },
  badgeText: { fontSize: theme.fontSize.xs, color: theme.colors.primaryDark, fontWeight: theme.fontWeight.medium },
  section: { marginTop: theme.spacing.lg },
  sectionTitle: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.semibold, color: theme.colors.onBackground, paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.sm },
  settingItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.colors.surface, paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  settingLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  settingText: { marginLeft: theme.spacing.md, flex: 1 },
  settingTitle: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.medium, color: theme.colors.onBackground },
  settingSubtitle: { fontSize: theme.fontSize.sm, color: theme.colors.gray, marginTop: 2 },
  settingRight: { flexDirection: 'row', alignItems: 'center' },
  dangerSection: { padding: theme.spacing.md, marginTop: theme.spacing.lg },
  // Bank Accounts section
  bankLoadingRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing.md, columnGap: theme.spacing.sm },
  bankLoadingText: { fontSize: theme.fontSize.sm, color: theme.colors.gray },
  bankEmptyRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing.md, columnGap: theme.spacing.sm },
  bankEmptyText: { fontSize: theme.fontSize.sm, color: theme.colors.gray },
  bankAccountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.colors.surface, paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  bankAccountLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  bankIcon: { width: 36, height: 36, borderRadius: theme.borderRadius.lg, backgroundColor: theme.colors.surfaceVariant, alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing.md },
  bankAccountText: { flex: 1 },
  bankAccountName: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.medium, color: theme.colors.onBackground },
  bankAccountNumber: { fontSize: theme.fontSize.sm, color: theme.colors.gray, marginTop: 2 },
  bankAccountRight: { flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm },
  bankAccountBalance: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold, color: theme.colors.money },
  addAccountButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing.md, columnGap: theme.spacing.sm },
  addAccountText: { fontSize: theme.fontSize.md, color: theme.colors.primary, fontWeight: theme.fontWeight.medium },
});

export default ProfileScreen;
