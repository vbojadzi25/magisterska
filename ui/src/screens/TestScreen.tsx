import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { banksAPI, testAPI, authAPI, setAuthToken } from '../services/api';

interface Bank {
  id: string;
  name: string;
  code: string;
  supportedCurrencies: string[];
  supportsPSD2: boolean;
}

const TestScreen = () => {
  const [apiStatus, setApiStatus] = useState('Checking...');
  const [banks, setBanks] = useState<Bank[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    testApiConnection();
  }, []);

  const testApiConnection = async () => {
    try {
      console.log('Testing API connection...');
      const healthResponse = await testAPI.health();
      console.log('Health response:', healthResponse.data);

      if (healthResponse.data.status === 'OK') {
        setApiStatus('✅ API Connected');
        await loadBanks();
      }
    } catch (error) {
      console.error('API Test Failed:', error);
      setApiStatus('❌ API Connection Failed - Make sure API is running on localhost:3000');
    }
  };

  const loadBanks = async () => {
    try {
      const response = await banksAPI.getAll();
      console.log('Banks response:', response.data);
      if (response.data.success) {
        setBanks(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load banks:', error);
    }
  };

  const testRegistration = async () => {
    const userData = {
      email: 'test@example.com',
      password: 'SecurePass123!',
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '+38970123456',
      dateOfBirth: '1990-01-01'
    };

    try {
      const response = await authAPI.register(userData);
      console.log('Registration response:', response.data);

      if (response.data.success) {
        // Store auth token
        setAuthToken(response.data.data.accessToken);
        setUser(response.data.data.user);
        Alert.alert('Success', 'User registered and logged in!');
      }
    } catch (error: any) {
      console.error('Registration error:', error.response?.data);
      const message = error.response?.data?.error?.message || 'Registration failed';
      Alert.alert('Registration Result', message);
    }
  };

  const testLogin = async () => {
    try {
      const response = await authAPI.login({
        email: 'test@example.com',
        password: 'SecurePass123!'
      });

      if (response.data.success) {
        setAuthToken(response.data.data.accessToken);
        setUser(response.data.data.user);
        Alert.alert('Success', 'Login successful!');
      }
    } catch (error: any) {
      console.error('Login error:', error.response?.data);
      Alert.alert('Login Error', error.response?.data?.error?.message || 'Login failed');
    }
  };

  const testBankLinking = async (bank: Bank) => {
    if (!user) {
      Alert.alert('Error', 'Please login first');
      return;
    }

    try {
      const response = await banksAPI.linkAccount(bank.id);
      console.log('Bank linking response:', response.data);

      Alert.alert(
        'Bank Account Linking',
        `Mock OAuth flow initiated with ${bank.name}. In production, you would be redirected to the bank's authorization page.`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Bank linking error:', error.response?.data);
      Alert.alert('Error', error.response?.data?.error?.message || 'Bank linking failed');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🏦 Denar Money Transfer</Text>
      <Text style={styles.subtitle}>API Test Interface</Text>

      <View style={styles.statusContainer}>
        <Text style={styles.status}>{apiStatus}</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={testApiConnection}>
        <Text style={styles.buttonText}>🔄 Test API Connection</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={testRegistration}>
        <Text style={styles.buttonText}>👤 Test User Registration</Text>
      </TouchableOpacity>

      {user && (
        <View style={styles.userContainer}>
          <Text style={styles.userText}>
            ✅ Logged in as: {user.firstName} {user.lastName}
          </Text>
        </View>
      )}

      <View style={styles.savingsCard}>
        <Text style={styles.savingsTitle}>💰 Save Money with Denar</Text>
        <Text style={styles.savingsText}>
          • P2P transfers: FREE (vs 50-150 MKD bank fees)
        </Text>
        <Text style={styles.savingsText}>
          • External transfers: 25 MKD (vs 50-150 MKD bank fees)
        </Text>
        <Text style={styles.savingsText}>
          • Save 20-125 MKD per transaction (40-80% savings)
        </Text>
      </View>

      <Text style={styles.banksTitle}>Available Macedonian Banks:</Text>

      {banks.length === 0 ? (
        <Text style={styles.loadingText}>
          {apiStatus.includes('Failed') ? 'Start your API server first!' : 'Loading banks...'}
        </Text>
      ) : (
        banks.map((bank) => (
          <View key={bank.id} style={styles.bankCard}>
            <Text style={styles.bankName}>{bank.name}</Text>
            <Text style={styles.bankInfo}>
              {bank.code} • PSD2: {bank.supportsPSD2 ? '✅' : '❌'}
            </Text>
            <Text style={styles.currencies}>
              Currencies: {bank.supportedCurrencies.join(', ')}
            </Text>
            <TouchableOpacity
              style={[styles.linkButton, !user && styles.disabledButton]}
              onPress={() => testBankLinking(bank)}
              disabled={!user}
            >
              <Text style={styles.linkButtonText}>
                {user ? 'Link Account' : 'Login Required'}
              </Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      <View style={styles.instructionsCard}>
        <Text style={styles.instructionsTitle}>📱 How to Test:</Text>
        <Text style={styles.instructionsText}>
          1. Make sure your API is running (npm run dev in api folder)
        </Text>
        <Text style={styles.instructionsText}>
          2. Test API connection (should show ✅ API Connected)
        </Text>
        <Text style={styles.instructionsText}>
          3. Register a test user
        </Text>
        <Text style={styles.instructionsText}>
          4. Try linking bank accounts
        </Text>
        <Text style={styles.instructionsText}>
          5. Test the full P2P money transfer flow!
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
    color: '#1976d2',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  statusContainer: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  status: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#1976d2',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userContainer: {
    backgroundColor: '#e8f5e8',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  userText: {
    color: '#2e7d32',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  savingsCard: {
    backgroundColor: '#fff3e0',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#f57c00',
  },
  savingsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#e65100',
  },
  savingsText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#333',
  },
  banksTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 20,
  },
  bankCard: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bankName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  bankInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  currencies: {
    fontSize: 12,
    color: '#999',
    marginBottom: 10,
  },
  linkButton: {
    backgroundColor: '#4caf50',
    padding: 10,
    borderRadius: 5,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  linkButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  instructionsCard: {
    backgroundColor: '#f3e5f5',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    marginBottom: 40,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#7b1fa2',
  },
  instructionsText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#333',
  },
});

export default TestScreen;