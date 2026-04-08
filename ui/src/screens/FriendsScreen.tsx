import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  TextInput, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';
import Button from '../components/Button';
import { contactsAPI, friendsAPI, getErrorMessage } from '../services/api';

interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  isOnDenar: boolean;
  userId?: string | null;
  invited?: boolean;
}

interface Friend {
  id: string;
  name: string;
  phoneNumber: string;
  status: 'pending' | 'accepted';
  friendshipId?: string;
  type?: 'received' | 'sent';
}

interface FriendsScreenProps {
  navigation: any;
}

const FriendsScreen: React.FC<FriendsScreenProps> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<'friends' | 'contacts' | 'requests'>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<Friend[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [contactsSynced, setContactsSynced] = useState(false);
  const [usernameSearch, setUsernameSearch] = useState('');
  const [usernameResult, setUsernameResult] = useState<{
    user: { id: string; username: string; name: string; profileImageUrl?: string };
    friendshipStatus: string | null;
    requestDirection: string | null;
  } | null>(null);
  const [usernameSearchError, setUsernameSearchError] = useState('');
  const [usernameSearching, setUsernameSearching] = useState(false);
  const [sendRequestError, setSendRequestError] = useState('');
  const [requestSentToId, setRequestSentToId] = useState<string | null>(null);

  const loadFriends = useCallback(async () => {
    setLoadingFriends(true);
    try {
      const [friendsRes, requestsRes] = await Promise.all([
        friendsAPI.getAll(),
        friendsAPI.getRequests(),
      ]);

      const friendsList = (friendsRes.data.friends || []).map((f: any) => ({
        id: f.id,
        name: f.name || `${f.firstName ?? ''} ${f.lastName ?? ''}`.trim(),
        phoneNumber: f.phoneNumber,
        status: 'accepted' as const,
        friendshipId: f.friendshipId,
      }));

      const received = (requestsRes.data.received || []).map((r: any) => ({
        id: r.id,
        name: r.user?.name || `${r.user?.firstName ?? ''} ${r.user?.lastName ?? ''}`.trim(),
        phoneNumber: r.user?.phoneNumber,
        status: 'pending' as const,
        type: 'received' as const,
      }));

      setFriends(friendsList);
      setFriendRequests(received);
    } catch (err: any) {
      // silently ignore on first load
    } finally {
      setLoadingFriends(false);
    }
  }, []);

  const loadContacts = useCallback(async () => {
    setLoadingContacts(true);
    try {
      const res = await contactsAPI.getAll();
      const list = (res.data.contacts || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        phoneNumber: c.phoneNumber,
        isOnDenar: c.isOnDenar,
        userId: c.userId,
        invited: c.invited,
      }));
      setContacts(list);
      setContactsSynced(true);
    } catch {
      setContactsSynced(false);
    } finally {
      setLoadingContacts(false);
    }
  }, []);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadFriends(), contactsSynced ? loadContacts() : Promise.resolve()]);
    setRefreshing(false);
  };

  const handleSyncContacts = async () => {
    await loadContacts();
  };

  const handleUsernameSearch = async () => {
    if (!usernameSearch.trim()) return;
    setUsernameSearching(true);
    setUsernameResult(null);
    setUsernameSearchError('');
    setSendRequestError('');
    setRequestSentToId(null);
    try {
      const res = await friendsAPI.searchByUsername(usernameSearch.trim());
      setUsernameResult(res.data);
    } catch (e: any) {
      setUsernameSearchError(getErrorMessage(e, 'User not found'));
    } finally {
      setUsernameSearching(false);
    }
  };

  const handleSendRequestFromSearch = async () => {
    if (!usernameResult) return;
    setSendRequestError('');
    try {
      await friendsAPI.sendRequest(usernameResult.user.id);
      setRequestSentToId(usernameResult.user.id);
      setUsernameResult(prev =>
        prev ? { ...prev, friendshipStatus: 'pending', requestDirection: 'sent' } : null
      );
    } catch (e: any) {
      setSendRequestError(getErrorMessage(e, 'Could not send request'));
    }
  };

  const handleAddFriend = (contact: Contact) => {
    if (!contact.userId) return;
    Alert.alert('Send Friend Request', `Send friend request to ${contact.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Send',
        onPress: async () => {
          try {
            await friendsAPI.sendRequest(contact.userId!);
            Alert.alert('Sent!', `Friend request sent to ${contact.name}.`);
          } catch (e: any) {
            Alert.alert('Error', e.response?.data?.error || 'Could not send request.');
          }
        },
      },
    ]);
  };

  const handleInvite = async (contact: Contact) => {
    Alert.alert('Invite to Denar', `Invite ${contact.name} to join Denar?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Invite',
        onPress: async () => {
          try {
            await contactsAPI.invite(contact.id);
            setContacts(prev =>
              prev.map(c => (c.id === contact.id ? { ...c, invited: true } : c))
            );
            Alert.alert('Invited!', `Invitation sent to ${contact.name}.`);
          } catch {
            Alert.alert('Error', 'Could not send invitation.');
          }
        },
      },
    ]);
  };

  const handleFriendRequest = async (friend: Friend, action: 'accept' | 'decline') => {
    try {
      if (action === 'accept') {
        await friendsAPI.accept(friend.id);
        setFriendRequests(prev => prev.filter(f => f.id !== friend.id));
        setFriends(prev => [...prev, { ...friend, status: 'accepted' }]);
        Alert.alert('Accepted!', `You are now friends with ${friend.name}!`);
      } else {
        await friendsAPI.decline(friend.id);
        setFriendRequests(prev => prev.filter(f => f.id !== friend.id));
      }
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || 'Action failed.');
    }
  };

  const filteredFriends = friends.filter(f =>
    f.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderFriendItem = ({ item }: { item: Friend }) => (
    <View style={styles.listItem}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
        </Text>
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemSub}>{item.phoneNumber}</Text>
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('HomeTab', { screen: 'SendMoney', params: { recipient: item.name, recipientId: item.id } })}
        >
          <Ionicons name="arrow-up" size={14} color={theme.colors.primary} />
          <Text style={styles.actionBtnText}>Send</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.requestBtn]}
          onPress={() => navigation.navigate('HomeTab', { screen: 'RequestMoney', params: { recipient: item.name, recipientId: item.id } })}
        >
          <Ionicons name="arrow-down" size={14} color={theme.colors.request} />
          <Text style={[styles.actionBtnText, { color: theme.colors.request }]}>Request</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderContactItem = ({ item }: { item: Contact }) => (
    <View style={styles.listItem}>
      <View style={[styles.avatar, { backgroundColor: item.isOnDenar ? theme.colors.primary : theme.colors.gray }]}>
        <Text style={styles.avatarText}>
          {item.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
        </Text>
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemSub}>{item.phoneNumber}</Text>
        {item.isOnDenar && <Text style={styles.onDenarTag}>On Denar</Text>}
      </View>
      <View>
        {item.isOnDenar ? (
          <TouchableOpacity style={styles.addBtn} onPress={() => handleAddFriend(item)}>
            <Ionicons name="person-add" size={14} color={theme.colors.primary} />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.addBtn, item.invited && styles.invitedBtn]}
            onPress={() => !item.invited && handleInvite(item)}
            disabled={!!item.invited}
          >
            <Ionicons
              name={item.invited ? 'checkmark' : 'mail'}
              size={14}
              color={item.invited ? theme.colors.gray : theme.colors.secondary}
            />
            <Text style={[styles.addBtnText, { color: item.invited ? theme.colors.gray : theme.colors.secondary }]}>
              {item.invited ? 'Invited' : 'Invite'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderRequest = ({ item }: { item: Friend }) => (
    <View style={styles.listItem}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
        </Text>
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemSub}>{item.phoneNumber}</Text>
      </View>
      <View style={{ flexDirection: 'row' }}>
        <TouchableOpacity style={styles.acceptBtn} onPress={() => handleFriendRequest(item, 'accept')}>
          <Ionicons name="checkmark" size={16} color={theme.colors.onPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.declineBtn} onPress={() => handleFriendRequest(item, 'decline')}>
          <Ionicons name="close" size={16} color={theme.colors.onPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Friends</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="sync" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={theme.colors.gray} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search friends and contacts"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={theme.colors.gray}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['friends', 'contacts', 'requests'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'friends'
                ? `Friends (${friends.length})`
                : tab === 'contacts'
                ? `Contacts (${contacts.length})`
                : `Requests (${friendRequests.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'friends' && (
          loadingFriends ? (
            <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={filteredFriends}
              renderItem={renderFriendItem}
              keyExtractor={item => item.id}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              ListHeaderComponent={
                <View style={styles.usernameSearchSection}>
                  <Text style={styles.usernameSearchLabel}>Add by username</Text>
                  <View style={styles.usernameSearchRow}>
                    <TextInput
                      style={styles.usernameSearchInput}
                      placeholder="@username"
                      value={usernameSearch}
                      onChangeText={text => {
                        setUsernameSearch(text);
                        setUsernameResult(null);
                        setUsernameSearchError('');
                        setSendRequestError('');
                      }}
                      onSubmitEditing={handleUsernameSearch}
                      autoCapitalize="none"
                      autoCorrect={false}
                      placeholderTextColor={theme.colors.gray}
                    />
                    <TouchableOpacity
                      style={[styles.usernameSearchBtn, usernameSearching && { opacity: 0.6 }]}
                      onPress={handleUsernameSearch}
                      disabled={usernameSearching}
                    >
                      {usernameSearching
                        ? <ActivityIndicator size="small" color={theme.colors.onPrimary} />
                        : <Ionicons name="search" size={18} color={theme.colors.onPrimary} />
                      }
                    </TouchableOpacity>
                  </View>
                  {!!usernameSearchError && (
                    <Text style={styles.usernameSearchError}>{usernameSearchError}</Text>
                  )}
                  {!!usernameResult && (
                    <View style={styles.usernameResultCard}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                          {usernameResult.user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                        </Text>
                      </View>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{usernameResult.user.name}</Text>
                        <Text style={styles.itemSub}>@{usernameResult.user.username}</Text>
                      </View>
                      {usernameResult.friendshipStatus === 'accepted' ? (
                        <Text style={styles.usernameStatusText}>Friends</Text>
                      ) : usernameResult.friendshipStatus === 'pending' ? (
                        <Text style={styles.usernameStatusText}>
                          {usernameResult.requestDirection === 'sent' ? 'Requested' : 'Incoming'}
                        </Text>
                      ) : (
                        <TouchableOpacity style={styles.addBtn} onPress={handleSendRequestFromSearch}>
                          <Ionicons name="person-add" size={14} color={theme.colors.primary} />
                          <Text style={styles.addBtnText}>Add</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                  {!!sendRequestError && (
                    <Text style={styles.usernameSearchError}>{sendRequestError}</Text>
                  )}
                </View>
              }
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Ionicons name="people" size={48} color={theme.colors.gray} />
                  <Text style={styles.emptyText}>No friends yet</Text>
                  <Text style={styles.emptySub}>Add friends from your contacts</Text>
                </View>
              }
            />
          )
        )}

        {activeTab === 'contacts' && (
          !contactsSynced ? (
            <View style={styles.empty}>
              <Ionicons name="contacts" size={48} color={theme.colors.gray} />
              <Text style={styles.emptyText}>Your Phone Contacts</Text>
              <Text style={styles.emptySub}>Find friends who are already on Denar</Text>
              <Button
                title={loadingContacts ? 'Loading...' : 'Load Contacts'}
                onPress={handleSyncContacts}
                variant="primary"
                size="md"
                loading={loadingContacts}
                disabled={loadingContacts}
              />
            </View>
          ) : (
            <FlatList
              data={filteredContacts}
              renderItem={renderContactItem}
              keyExtractor={item => item.id}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={styles.emptyText}>No contacts found</Text>
                </View>
              }
            />
          )
        )}

        {activeTab === 'requests' && (
          <FlatList
            data={friendRequests}
            renderItem={renderRequest}
            keyExtractor={item => item.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="person-add" size={48} color={theme.colors.gray} />
                <Text style={styles.emptyText}>No friend requests</Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.md, backgroundColor: theme.colors.surface },
  headerTitle: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: theme.colors.onBackground },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, margin: theme.spacing.md, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, borderRadius: theme.borderRadius.lg, borderWidth: 1, borderColor: theme.colors.border },
  searchInput: { flex: 1, fontSize: theme.fontSize.md, color: theme.colors.onBackground, marginLeft: theme.spacing.sm },
  tabs: { flexDirection: 'row', paddingHorizontal: theme.spacing.md, marginBottom: theme.spacing.md },
  tab: { flex: 1, paddingVertical: theme.spacing.md, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: theme.colors.primary },
  tabText: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.medium, color: theme.colors.gray },
  activeTabText: { color: theme.colors.primary },
  content: { flex: 1, paddingHorizontal: theme.spacing.md },
  listItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, padding: theme.spacing.md, marginBottom: theme.spacing.sm, borderRadius: theme.borderRadius.lg },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing.md },
  avatarText: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.bold, color: theme.colors.onPrimary },
  itemInfo: { flex: 1 },
  itemName: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.medium, color: theme.colors.onBackground },
  itemSub: { fontSize: theme.fontSize.sm, color: theme.colors.gray, marginTop: 2 },
  onDenarTag: { fontSize: theme.fontSize.xs, color: theme.colors.primary, fontWeight: theme.fontWeight.medium, marginTop: 2 },
  itemActions: { flexDirection: 'row' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.xs, borderRadius: theme.borderRadius.sm, borderWidth: 1, borderColor: theme.colors.primary, marginLeft: theme.spacing.xs },
  requestBtn: { borderColor: theme.colors.request },
  actionBtnText: { fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.medium, color: theme.colors.primary, marginLeft: 4 },
  addBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.xs, borderRadius: theme.borderRadius.sm, borderWidth: 1, borderColor: theme.colors.primary },
  invitedBtn: { borderColor: theme.colors.gray, backgroundColor: theme.colors.surfaceVariant },
  addBtnText: { fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.medium, color: theme.colors.primary, marginLeft: 4 },
  acceptBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing.xs },
  declineBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: theme.colors.error, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: theme.spacing.xxl },
  emptyText: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.medium, color: theme.colors.onBackground, marginTop: theme.spacing.md },
  emptySub: { fontSize: theme.fontSize.md, color: theme.colors.gray, textAlign: 'center', marginTop: theme.spacing.sm, marginBottom: theme.spacing.lg },
  usernameSearchSection: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg, padding: theme.spacing.md, marginBottom: theme.spacing.md },
  usernameSearchLabel: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.medium, color: theme.colors.onBackground, marginBottom: theme.spacing.sm },
  usernameSearchRow: { flexDirection: 'row', alignItems: 'center' },
  usernameSearchInput: { flex: 1, fontSize: theme.fontSize.md, color: theme.colors.onBackground, backgroundColor: theme.colors.background, borderRadius: theme.borderRadius.md, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, borderWidth: 1, borderColor: theme.colors.border, marginRight: theme.spacing.sm },
  usernameSearchBtn: { width: 42, height: 42, borderRadius: theme.borderRadius.md, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
  usernameSearchError: { fontSize: theme.fontSize.sm, color: theme.colors.error, marginTop: theme.spacing.sm },
  usernameResultCard: { flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing.md, paddingTop: theme.spacing.md, borderTopWidth: 1, borderTopColor: theme.colors.border },
  usernameStatusText: { fontSize: theme.fontSize.sm, color: theme.colors.gray, fontWeight: theme.fontWeight.medium },
});

export default FriendsScreen;
