import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { usersAPI } from '../services/api';

// How foreground notifications behave
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Registers for push notifications, sends the Expo push token to the backend,
 * and returns the latest notification (if any arrived while the app was open).
 *
 * Must be called only when the user is authenticated.
 */
export function usePushNotifications() {
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    registerForPushNotifications();

    // Foreground notification received
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      // Notification arrived while app is open — the handler above shows it automatically
      console.log('[Push] Received:', notification.request.content.title);
    });

    // User tapped a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as Record<string, unknown>;
      console.log('[Push] Tapped:', data?.type);
      // Navigation on tap can be extended here using a navigationRef if needed
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);
}

async function registerForPushNotifications() {
  if (!Device.isDevice) {
    // Push tokens are not available on simulators/emulators
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1E88E5',
    });
  }

  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    const tokenData = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();

    await usersAPI.registerPushToken(tokenData.data);
  } catch (err) {
    // Non-fatal — app works fine without push tokens (e.g. Expo Go without EAS project)
    console.warn('[Push] Could not register push token:', err);
  }
}
