const express = require('express');
const router = express.Router();
const { User } = require('../models');

// Save push notification token
router.post('/:userId/push-token', async (req, res) => {
  try {
    const { userId } = req.params;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required'
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Store push token in preferences
    const preferences = user.preferences || {};
    preferences.pushToken = token;
    preferences.pushNotificationsEnabled = true;
    
    user.preferences = preferences;
    await user.save();

    res.json({
      success: true,
      message: 'Push token saved'
    });
  } catch (error) {
    console.error('Error saving push token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save push token'
    });
  }
});

// Send push notification (utility endpoint)
router.post('/send-notification', async (req, res) => {
  try {
    const { userId, title, body, data } = req.body;

    const user = await User.findByPk(userId);
    if (!user || !user.preferences?.pushToken) {
      return res.status(404).json({
        success: false,
        error: 'User or push token not found'
      });
    }

    // In production, use Expo's push notification service
    // For now, just return success
    // 
    // Example with expo-server-sdk:
    // const Expo = require('expo-server-sdk').Expo;
    // let expo = new Expo();
    // 
    // const messages = [{
    //   to: user.preferences.pushToken,
    //   sound: 'default',
    //   title,
    //   body,
    //   data
    // }];
    // 
    // await expo.sendPushNotificationsAsync(messages);

    res.json({
      success: true,
      message: 'Notification sent'
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send notification'
    });
  }
});

module.exports = router;
