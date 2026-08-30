import { getCatalystAppAsync } from './index';

export interface PushNotificationPayload {
  title: string;
  body: string;
  userRole?: string;
  targetUserId?: string;
  data?: Record<string, any>;
}

/**
 * Catalyst Push Notifications Client Wrapper
 * Dispatches web and mobile push notifications to field officers.
 */
export const CatalystPush = {
  /**
   * Sends web/mobile push notification via Catalyst Push Notifications service
   */
  sendNotification: async (payload: PushNotificationPayload): Promise<boolean> => {
    try {
      const app = await getCatalystAppAsync();
      if (app.pushNotification) {
        await app.pushNotification().sendNotification({
          message: payload.body,
          title: payload.title,
          custom_details: payload.data || {},
        });
        return true;
      }
    } catch (e) {
      console.warn('Catalyst Push notification note:', (e as Error).message);
    }
    return false;
  }
};
