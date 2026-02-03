
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
};
