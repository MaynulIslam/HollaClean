
/**
 * Notification System for HollaClean
 *
 * Provides in-app notifications with persistence
 */

import { storage } from './storage';

export interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'job_accepted' | 'job_completed' | 'new_job' | 'review';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

// Get all notifications for a user
export async function getNotifications(userId: string): Promise<Notification[]> {
  const keys = await storage.list(`notification:${userId}:`);
  const notifications: Notification[] = [];

  for (const key of keys) {
    const notification = await storage.get(key);
    if (notification) {
      notifications.push(notification);
    }
  }

  return notifications.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// Get unread notification count
export async function getUnreadCount(userId: string): Promise<number> {
  const notifications = await getNotifications(userId);
  return notifications.filter(n => !n.read).length;
}

// Create a new notification
export async function createNotification(
  userId: string,
  type: Notification['type'],
  title: string,
  message: string,
  link?: string
): Promise<Notification> {
  const notification: Notification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    type,
    title,
    message,
    link,
    read: false,
    createdAt: new Date().toISOString(),
  };

  await storage.set(`notification:${userId}:${notification.id}`, notification);
  return notification;
}

// Mark notification as read
export async function markAsRead(userId: string, notificationId: string): Promise<void> {
  const key = `notification:${userId}:${notificationId}`;
  const notification = await storage.get(key);
  if (notification) {
    notification.read = true;
    await storage.set(key, notification);
  }
}

// Mark all notifications as read
export async function markAllAsRead(userId: string): Promise<void> {
  const notifications = await getNotifications(userId);
  for (const notification of notifications) {
    if (!notification.read) {
      notification.read = true;
      await storage.set(`notification:${userId}:${notification.id}`, notification);
    }
  }
}

// Delete a notification
export async function deleteNotification(userId: string, notificationId: string): Promise<void> {
  await storage.delete(`notification:${userId}:${notificationId}`);
}

// Clear all notifications for a user
export async function clearAllNotifications(userId: string): Promise<void> {
  const keys = await storage.list(`notification:${userId}:`);
  for (const key of keys) {
    await storage.delete(key);
  }
}

// Helper functions to create specific notification types
export const NotificationHelpers = {
  async jobAccepted(homeownerId: string, cleanerName: string, serviceType: string) {
    return createNotification(
      homeownerId,
      'job_accepted',
      'Cleaner Accepted Your Job',
      `${cleanerName} has accepted your ${serviceType} request.`,
      '/my-requests'
    );
  },

  async jobCompleted(homeownerId: string, cleanerName: string, serviceType: string) {
    return createNotification(
      homeownerId,
      'job_completed',
      'Cleaning Completed',
      `${cleanerName} has completed your ${serviceType}. Please leave a review!`,
      '/my-requests'
    );
  },

  async newJobAvailable(cleanerId: string, serviceType: string, location: string) {
    return createNotification(
      cleanerId,
      'new_job',
      'New Job Available',
      `A new ${serviceType} job is available in ${location}.`,
      '/jobs'
    );
  },

  async newReview(cleanerId: string, rating: number, homeownerName: string) {
    return createNotification(
      cleanerId,
      'review',
      'New Review Received',
      `${homeownerName} left you a ${rating}-star review.`,
      '/profile'
    );
  },

  async jobCancelled(userId: string, serviceType: string, role: 'homeowner' | 'cleaner') {
    const message = role === 'homeowner'
      ? `Your ${serviceType} request has been cancelled.`
      : `The ${serviceType} job has been cancelled by the homeowner.`;

    return createNotification(
      userId,
      'warning',
      'Job Cancelled',
      message
    );
  },

  async paymentReceived(cleanerId: string, amount: number, serviceType: string) {
    return createNotification(
      cleanerId,
      'success',
      'Payment Received',
      `You've received $${amount.toFixed(2)} for completing ${serviceType}.`,
      '/earnings'
    );
  },

  async paymentRequired(homeownerId: string, cleanerName: string, serviceType: string, amount: number) {
    return createNotification(
      homeownerId,
      'warning',
      'Payment Required to Start',
      `${cleanerName} is ready to begin your ${serviceType}. Please pay $${amount.toFixed(2)} to start the cleaning.`,
      '/my-requests'
    );
  },

  async paymentHeld(cleanerId: string, serviceType: string) {
    return createNotification(
      cleanerId,
      'success',
      'Payment Received — Job Started',
      `The homeowner has paid for ${serviceType}. You can now begin cleaning! Payment will be released when you mark the job complete.`,
      '/jobs'
    );
  },

  async paymentReleased(homeownerId: string, cleanerName: string, serviceType: string, amount: number) {
    return createNotification(
      homeownerId,
      'success',
      'Payment Released',
      `$${amount.toFixed(2)} has been released to ${cleanerName} for completing your ${serviceType}.`,
      '/my-requests'
    );
  },

  async verificationReminder(userId: string) {
    return createNotification(
      userId,
      'warning',
      'Complete Your Verification',
      'Verify your email, phone number, and address to build trust and unlock all features. Go to Profile → Verification Status.',
      '/profile'
    );
  },

  async paymentReminder(homeownerId: string, cleanerName: string, serviceType: string, amount: number, urgency: 'reminder' | 'urgent' | 'final') {
    const titles: Record<string, string> = {
      reminder: 'Payment Reminder',
      urgent: 'Urgent: Payment Needed Soon',
      final: 'Final Reminder: Pay Now',
    };
    const messages: Record<string, string> = {
      reminder: `Don't forget to pay $${amount.toFixed(2)} for your ${serviceType} with ${cleanerName}. Payment is needed before cleaning begins.`,
      urgent: `Your ${serviceType} is starting soon! Please pay $${amount.toFixed(2)} now so ${cleanerName} can begin.`,
      final: `FINAL REMINDER: ${cleanerName} is arriving soon for ${serviceType}. Pay $${amount.toFixed(2)} immediately to avoid cancellation.`,
    };
    return createNotification(
      homeownerId,
      'warning',
      titles[urgency],
      messages[urgency],
      '/my-requests'
    );
  },

  async bookingConfirmation(homeownerId: string, cleanerName: string, serviceType: string, date: string, time: string) {
    const formattedDate = new Date(date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
    return createNotification(
      homeownerId,
      'success',
      'Booking Confirmed!',
      `${cleanerName} has accepted your ${serviceType} request for ${formattedDate} at ${time}. A booking quote is available in your requests.`,
      '/my-requests'
    );
  },
};
