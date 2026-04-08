'use strict';

/**
 * Push notification service — Expo Push Notification API.
 *
 * Sends push notifications to Expo push tokens stored on User records.
 * All sends are fire-and-forget: a failure never breaks the calling request.
 *
 * Expo Push API docs: https://docs.expo.dev/push-notifications/sending-notifications/
 */

const axios = require('axios');
const logger = require('../utils/logger');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Send one or more push messages.
 * @param {Array<{ to: string, title: string, body: string, data?: object }>} messages
 */
async function sendPushMessages(messages) {
  if (!messages.length) return;

  // Filter out blank/null tokens
  const valid = messages.filter(m => m.to && m.to.startsWith('ExponentPushToken['));
  if (!valid.length) return;

  try {
    await axios.post(EXPO_PUSH_URL, valid, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
  } catch (err) {
    logger.warn('Push notification delivery failed', { error: err.message });
  }
}

/**
 * Notify a single user. Looks up their pushToken and respects their
 * notificationSettings. Silently no-ops if the user has no token or
 * has disabled the relevant category.
 *
 * @param {import('../models').User} user - Sequelize User instance (must have pushToken + notificationSettings)
 * @param {'paymentRequests'|'friendRequests'|null} settingKey - which preference to check, or null to always send
 * @param {{ title: string, body: string, data?: object }} payload
 */
async function notifyUser(user, settingKey, payload) {
  if (!user || !user.pushToken) return;

  const settings = user.notificationSettings || {};
  if (settings.pushNotifications === false) return;
  if (settingKey && settings[settingKey] === false) return;

  await sendPushMessages([{ to: user.pushToken, ...payload }]);
}

module.exports = { notifyUser, sendPushMessages };
