import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Register for push notifications
export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }
    
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId || 'your-project-id',
    })).data;
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

// Save push token to backend
export async function savePushToken(userId, token) {
  try {
    const response = await fetch(`http://localhost:3000/api/notifications/${userId}/push-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error saving push token:', error);
    throw error;
  }
}

// Schedule local notification (for testing)
export async function scheduleLocalNotification(title, body, data = {}) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: { seconds: 1 },
  });
}

// Notification types
export const NotificationTypes = {
  RANK_CHANGE: 'rank_change',
  FRIEND_OVERTAKE: 'friend_overtake',
  ACHIEVEMENT_UNLOCK: 'achievement_unlock',
  WEEKLY_RESET: 'weekly_reset',
  SQUAD_UPDATE: 'squad_update',
  FRIEND_REQUEST: 'friend_request'
};

export default {
  registerForPushNotificationsAsync,
  savePushToken,
  scheduleLocalNotification,
  NotificationTypes
};
