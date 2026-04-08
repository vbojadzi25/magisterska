import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Alert,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';
import Button from '../components/Button';
import { usersAPI, getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface EditProfileScreenProps {
  navigation: any;
}

const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ navigation }) => {
  const { user, updateUser } = useAuth();

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Error', 'First and last name are required');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Error', 'A valid email is required');
      return;
    }

    setIsLoading(true);
    try {
      const res = await usersAPI.updateProfile({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim().toLowerCase(), bio: bio.trim() });
      const updatedUser = res.data.data;
      updateUser({
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        bio: updatedUser.bio,
      });
      Alert.alert('Saved', 'Your profile has been updated.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      setIsLoading(false);
      Alert.alert('Error', getErrorMessage(error, 'Failed to update profile. Please try again.'));
    }
  };

  const Field = ({
    label, value, onChangeText, placeholder, keyboardType, multiline, maxLength,
  }: {
    label: string; value: string; onChangeText: (v: string) => void;
    placeholder?: string; keyboardType?: any; multiline?: boolean; maxLength?: number;
  }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.gray}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
        autoCorrect={false}
        multiline={multiline}
        maxLength={maxLength}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );

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
        {/* Avatar preview */}
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitials}>
              {(firstName[0] || '?').toUpperCase()}{(lastName[0] || '').toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.avatarName}>{firstName} {lastName}</Text>
            <Text style={styles.avatarSub}>Tap fields below to edit</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Field label="First Name" value={firstName} onChangeText={setFirstName} placeholder="Ivan" />
          <Field label="Last Name" value={lastName} onChangeText={setLastName} placeholder="Petrov" />
          <Field label="Email" value={email} onChangeText={setEmail} placeholder="your@email.com" keyboardType="email-address" />
          <Field label="Bio" value={bio} onChangeText={setBio} placeholder="A short bio about yourself..." multiline maxLength={500} />
        </View>

        {/* Phone — read-only */}
        <View style={styles.readOnlyCard}>
          <Ionicons name="call" size={18} color={theme.colors.primary} />
          <View style={styles.readOnlyText}>
            <Text style={styles.readOnlyLabel}>Phone Number</Text>
            <Text style={styles.readOnlyValue}>{user?.phoneNumber || '—'}</Text>
          </View>
          <View style={styles.lockedBadge}>
            <Ionicons name="lock-closed" size={12} color={theme.colors.gray} />
            <Text style={styles.lockedText}>Locked</Text>
          </View>
        </View>

        <Button
          title={isLoading ? 'Saving...' : 'Save Changes'}
          onPress={handleSave}
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
  avatarRow: {
    flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg, borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing.md,
  },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: theme.colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitials: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: theme.colors.onPrimary },
  avatarName: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.semibold, color: theme.colors.onBackground },
  avatarSub: { fontSize: theme.fontSize.sm, color: theme.colors.gray, marginTop: 2 },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  inputGroup: { marginBottom: theme.spacing.md },
  label: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.medium, color: theme.colors.onBackground, marginBottom: theme.spacing.xs },
  input: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1, borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.md,
    fontSize: theme.fontSize.md, color: theme.colors.onBackground,
  },
  inputMultiline: { height: 88, textAlignVertical: 'top' },
  readOnlyCard: {
    flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md, borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing.md,
  },
  readOnlyText: { flex: 1 },
  readOnlyLabel: { fontSize: theme.fontSize.xs, color: theme.colors.gray },
  readOnlyValue: { fontSize: theme.fontSize.md, color: theme.colors.onBackground, fontWeight: theme.fontWeight.medium },
  lockedBadge: { flexDirection: 'row', alignItems: 'center', columnGap: 4 },
  lockedText: { fontSize: theme.fontSize.xs, color: theme.colors.gray },
});

export default EditProfileScreen;
