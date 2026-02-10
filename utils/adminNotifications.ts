
/**
 * Admin Notification System for HollaClean
 *
 * Sends email notifications to the admin for key platform events.
 * Reads admin email and notification preferences from reminder config.
 */

import { getReminderConfig } from './reminderService';
import { sendEmail } from './externalNotifications';

type AdminEvent = 'new_registration' | 'job_accepted' | 'payment_completed' | 'job_completed';

interface EventDetails {
  userName?: string;
  userEmail?: string;
  userType?: string;
  serviceType?: string;
  amount?: number;
  cleanerName?: string;
  homeownerName?: string;
  requestId?: string;
}

const EVENT_CONFIG: Record<AdminEvent, { configKey: keyof Pick<Awaited<ReturnType<typeof getReminderConfig>>, 'adminNotifyOnRegistration' | 'adminNotifyOnPayment' | 'adminNotifyOnCompletion'>; subject: (d: EventDetails) => string; body: (d: EventDetails) => string }> = {
  new_registration: {
    configKey: 'adminNotifyOnRegistration',
    subject: (d) => `New User Registration: ${d.userName}`,
    body: (d) => `A new ${d.userType} has registered on HollaClean.\n\nName: ${d.userName}\nEmail: ${d.userEmail}\nRole: ${d.userType}\n\nLog in to the admin dashboard to manage users.`,
  },
  job_accepted: {
    configKey: 'adminNotifyOnCompletion', // group with general activity
    subject: (d) => `Job Accepted: ${d.serviceType}`,
    body: (d) => `A cleaning job has been accepted.\n\nService: ${d.serviceType}\nCleaner: ${d.cleanerName}\nHomeowner: ${d.homeownerName}\nRequest ID: ${d.requestId}`,
  },
  payment_completed: {
    configKey: 'adminNotifyOnPayment',
    subject: (d) => `Payment Received: $${d.amount?.toFixed(2)} for ${d.serviceType}`,
    body: (d) => `A payment has been received.\n\nService: ${d.serviceType}\nAmount: $${d.amount?.toFixed(2)}\nHomeowner: ${d.homeownerName}\nCleaner: ${d.cleanerName}\nRequest ID: ${d.requestId}\n\nPayment is held securely until job completion.`,
  },
  job_completed: {
    configKey: 'adminNotifyOnCompletion',
    subject: (d) => `Job Completed: ${d.serviceType}`,
    body: (d) => `A cleaning job has been completed.\n\nService: ${d.serviceType}\nCleaner: ${d.cleanerName}\nHomeowner: ${d.homeownerName}\nAmount: $${d.amount?.toFixed(2)}\nRequest ID: ${d.requestId}\n\nPayment has been released to the cleaner.`,
  },
};

export async function notifyAdmin(event: AdminEvent, details: EventDetails): Promise<void> {
  try {
    const config = await getReminderConfig();

    // Check if admin email is configured
    if (!config.adminEmail || config.adminEmail.trim() === '') {
      console.log(`[HollaClean Admin] No admin email configured — skipping ${event} notification`);
      return;
    }

    // Check if this notification type is enabled
    const eventDef = EVENT_CONFIG[event];
    if (!config[eventDef.configKey]) {
      console.log(`[HollaClean Admin] ${event} notifications disabled — skipping`);
      return;
    }

    const subject = eventDef.subject(details);
    const body = eventDef.body(details);

    await sendEmail(config.adminEmail, 'Admin', `[HollaClean Admin] ${subject}`, body);
    console.log(`[HollaClean Admin] Sent ${event} notification to ${config.adminEmail}`);
  } catch (err) {
    console.warn('[HollaClean Admin] Failed to send admin notification:', err);
  }
}
