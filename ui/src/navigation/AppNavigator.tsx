import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';
import { useAuth } from '../context/AuthContext';
import { usePushNotifications } from '../hooks/usePushNotifications';

// Auth screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import TwoFactorScreen from '../screens/TwoFactorScreen';

// App screens
import HomeScreen from '../screens/HomeScreen';
import SendMoneyScreen from '../screens/SendMoneyScreen';
import RequestMoneyScreen from '../screens/RequestMoneyScreen';
import FriendsScreen from '../screens/FriendsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PhoneInputScreen from '../screens/PhoneInputScreen';
import PhoneVerificationScreen from '../screens/PhoneVerificationScreen';
import AddBankAccountScreen from '../screens/AddBankAccountScreen';
import BankAccountDetailScreen from '../screens/BankAccountDetailScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// ─── Auth Stack ───────────────────────────────────────────────────────────────
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="TwoFactor" component={TwoFactorScreen} />
    <Stack.Screen name="AddBankAccount" component={AddBankAccountScreen} />
  </Stack.Navigator>
);

// ─── Home Stack ───────────────────────────────────────────────────────────────
const HomeStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
    <Stack.Screen
      name="SendMoney"
      component={SendMoneyScreen}
      options={{
        title: 'Send Money',
        headerStyle: { backgroundColor: theme.colors.primary },
        headerTintColor: theme.colors.onPrimary,
        headerTitleStyle: { fontWeight: theme.fontWeight.bold },
      }}
    />
    <Stack.Screen
      name="RequestMoney"
      component={RequestMoneyScreen}
      options={{
        title: 'Request Money',
        headerStyle: { backgroundColor: theme.colors.request },
        headerTintColor: theme.colors.onPrimary,
        headerTitleStyle: { fontWeight: theme.fontWeight.bold },
      }}
    />
    <Stack.Screen
      name="PhoneInput"
      component={PhoneInputScreen}
      options={{
        title: 'Verify Phone',
        headerStyle: { backgroundColor: theme.colors.primary },
        headerTintColor: theme.colors.onPrimary,
        headerTitleStyle: { fontWeight: theme.fontWeight.bold },
      }}
    />
    <Stack.Screen
      name="PhoneVerification"
      component={PhoneVerificationScreen}
      options={{
        title: 'Enter Code',
        headerStyle: { backgroundColor: theme.colors.primary },
        headerTintColor: theme.colors.onPrimary,
        headerTitleStyle: { fontWeight: theme.fontWeight.bold },
      }}
    />
  </Stack.Navigator>
);

// ─── Friends Stack ────────────────────────────────────────────────────────────
const FriendsStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="FriendsMain" component={FriendsScreen} options={{ headerShown: false }} />
  </Stack.Navigator>
);

// ─── Profile Stack ────────────────────────────────────────────────────────────
const profileHeaderOptions = {
  headerStyle: { backgroundColor: theme.colors.primary },
  headerTintColor: theme.colors.onPrimary,
  headerTitleStyle: { fontWeight: theme.fontWeight.bold },
};

const ProfileStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="ProfileMain"
      component={ProfileScreen}
      options={{ title: 'Profile', ...profileHeaderOptions }}
    />
    <Stack.Screen
      name="EditProfile"
      component={EditProfileScreen}
      options={{ title: 'Edit Profile', ...profileHeaderOptions }}
    />
    <Stack.Screen
      name="ChangePassword"
      component={ChangePasswordScreen}
      options={{ title: 'Change Password', ...profileHeaderOptions }}
    />
    <Stack.Screen
      name="AddBankAccount"
      component={AddBankAccountScreen}
      options={{ title: 'Add Bank Account', ...profileHeaderOptions }}
    />
    <Stack.Screen
      name="BankAccountDetail"
      component={BankAccountDetailScreen}
      options={{ title: 'Account Details', ...profileHeaderOptions }}
    />
    <Stack.Screen
      name="PhoneInput"
      component={PhoneInputScreen}
      options={{ title: 'Verify Phone', ...profileHeaderOptions }}
    />
    <Stack.Screen
      name="PhoneVerification"
      component={PhoneVerificationScreen}
      options={{ title: 'Enter Code', ...profileHeaderOptions }}
    />
  </Stack.Navigator>
);

// ─── Main Tab Navigator ───────────────────────────────────────────────────────
const TabNavigator = () => {
  usePushNotifications();

  return (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: keyof typeof Ionicons.glyphMap = 'home';
        if (route.name === 'HomeTab') {
          iconName = focused ? 'home' : 'home-outline';
        } else if (route.name === 'FriendsTab') {
          iconName = focused ? 'people' : 'people-outline';
        } else if (route.name === 'ProfileTab') {
          iconName = focused ? 'person' : 'person-outline';
        }
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: theme.colors.primary,
      tabBarInactiveTintColor: theme.colors.gray,
      tabBarStyle: {
        backgroundColor: theme.colors.surface,
        borderTopColor: theme.colors.border,
        paddingBottom: 8,
        paddingTop: 8,
        height: 80,
      },
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: theme.fontWeight.medium,
      },
      headerShown: false,
    })}
  >
    <Tab.Screen name="HomeTab" component={HomeStack} options={{ tabBarLabel: 'Home' }} />
    <Tab.Screen name="FriendsTab" component={FriendsStack} options={{ tabBarLabel: 'Friends' }} />
    <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ tabBarLabel: 'Profile' }} />
  </Tab.Navigator>
  );
};

// ─── Root Navigator ───────────────────────────────────────────────────────────
const AppNavigator = () => {
  const { isAuthenticated } = useAuth();

  return (
    <NavigationContainer>
      {isAuthenticated ? <TabNavigator /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;
