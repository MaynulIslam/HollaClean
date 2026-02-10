
/**
 * Payment Reminder Service for HollaClean
 *
 * Runs as a background polling loop (every 60s from App.tsx).
 * Sends recurring payment reminders to homeowners before their scheduled cleaning.
 * Reminders escalate in urgency as the scheduled time approaches.
 */

import { storage } from './storage';
import { CONFIG } from './config';
import { NotificationHelpers } from './notifications';
import { ExternalNotify } from './externalNotifications';

// ── Types ──────────────────────────────────────────────────────────

export interface ReminderConfig {
  enabled: boolean;
  intervalMinutes: number;
  startHoursBefore: number;
  maxReminders: number;
  adminEmail: string;
  adminNotifyOnRegistration: boolean;
  adminNotifyOnPayment: boolean;
  adminNotifyOnCompletion: boolean;
}

export interface ReminderLog {
  requestId: string;
  sentTimestamps: string[];
  lastSentAt: string | null;
  totalSent: number;
  stoppedReason?: 'paid' | 'cancelled' | 'max_reached' | 'past_due';
}

export type ReminderUrgency = 'reminder' | 'urgent' | 'final';

// ── Config Management ──────────────────────────────────────────────

const DEFAULT_CONFIG: ReminderConfig = {
  enabled: CONFIG.reminders.defaultEnabled,
  intervalMinutes: CONFIG.reminders.defaultIntervalMinutes,
  startHoursBefore: CONFIG.reminders.defaultStartHoursBefore,
  maxReminders: CONFIG.reminders.defaultMaxReminders,
  adminEmail: '',
  adminNotifyOnRegistration: true,
  adminNotifyOnPayment: true,
  adminNotifyOnCompletion: true,
};

const CONFIG_KEY = 'config:reminders';

export async function getReminderConfig(): Promise<ReminderConfig> {
  const config = await storage.get(CONFIG_KEY);
  return config ? { ...DEFAULT_CONFIG, ...config } : { ...DEFAULT_CONFIG };
}

export async function setReminderConfig(updates: Partial<ReminderConfig>): Promise<ReminderConfig> {
  const current = await getReminderConfig();
  const updated = { ...current, ...updates };
  await storage.set(CONFIG_KEY, updated);
  return updated;
}

// ── Reminder Log Management ────────────────────────────────────────

function logKey(requestId: string): string {
  return `reminder:log:${requestId}`;
}

async function getReminderLog(requestId: string): Promise<ReminderLog> {
  const log = await storage.get(logKey(requestId));
  return log || {
    requestId,
    sentTimestamps: [],
    lastSentAt: null,
    totalSent: 0,
  };
}

async function updateReminderLog(requestId: string, updates: Partial<ReminderLog>): Promise<void> {
  const log = await getReminderLog(requestId);
  await storage.set(logKey(requestId), { ...log, ...updates });
}

export async function getReminderLogs(): Promise<ReminderLog[]> {
  const keys = await storage.list('reminder:log:');
  const logs: ReminderLog[] = [];
  for (const key of keys) {
    const log = await storage.get(key);
    if (log) logs.push(log);
  }
  return logs;
}

// ── Stop Reminders ─────────────────────────────────────────────────

export async function stopRemindersForRequest(requestId: string, reason: ReminderLog['stoppedReason']): Promise<void> {
  await updateReminderLog(requestId, { stoppedReason: reason });
}

// ── Urgency Calculation ────────────────────────────────────────────

function getUrgency(minutesUntilScheduled: number): ReminderUrgency {
  if (minutesUntilScheduled <= 60) return 'final';
  if (minutesUntilScheduled <= 120) return 'urgent';
  return 'reminder';
}

// ── Parse Scheduled Time ───────────────────────────────────────────

function parseScheduledTime(date: string, time: string): Date | null {
  try {
    // date = "2026-02-15", time = "14:00"
    const dt = new Date(`${date}T${time}:00`);
    if (isNaN(dt.getTime())) return null;
    return dt;
  } catch {
    return null;
  }
}

// ── Init ───────────────────────────────────────────────────────────

export async function initReminderService(): Promise<void> {
  // Ensure config exists with defaults
  const existing = await storage.get(CONFIG_KEY);
  if (!existing) {
    await storage.set(CONFIG_KEY, DEFAULT_CONFIG);
  }
}

// ── Core: Check and Send Reminders ─────────────────────────────────

export async function checkAndSendReminders(): Promise<void> {
  if (!CONFIG.features.paymentReminders) return;

  const config = await getReminderConfig();
  if (!config.enabled) return;

  const now = new Date();
  const keys = await storage.list('request:');

  for (const key of keys) {
    const req = await storage.get(key);
    if (!req) continue;

    // Only send reminders for accepted or awaiting_payment requests
    if (req.status !== 'accepted' && req.status !== 'awaiting_payment') continue;

    // Parse scheduled time
    const scheduledTime = parseScheduledTime(req.date, req.time);
    if (!scheduledTime) continue;

    const msUntilScheduled = scheduledTime.getTime() - now.getTime();
    const minutesUntilScheduled = msUntilScheduled / (1000 * 60);
    const hoursUntilScheduled = minutesUntilScheduled / 60;

    // Skip if too early (not within the reminder window yet)
    if (hoursUntilScheduled > config.startHoursBefore) continue;

    // Skip if past due (scheduled time has passed)
    if (msUntilScheduled < -30 * 60 * 1000) {
      // More than 30 min past — mark as past due
      const log = await getReminderLog(req.id);
      if (!log.stoppedReason) {
        await stopRemindersForRequest(req.id, 'past_due');
      }
      continue;
    }

    // Check reminder log
    const log = await getReminderLog(req.id);

    // Already stopped
    if (log.stoppedReason) continue;

    // Max reminders reached
    if (log.totalSent >= config.maxReminders) {
      await stopRemindersForRequest(req.id, 'max_reached');
      continue;
    }

    // Check if enough time has passed since last reminder
    if (log.lastSentAt) {
      const msSinceLastReminder = now.getTime() - new Date(log.lastSentAt).getTime();
      const minSinceLastReminder = msSinceLastReminder / (1000 * 60);
      if (minSinceLastReminder < config.intervalMinutes) continue;
    }

    // Determine urgency
    const urgency = getUrgency(Math.max(0, minutesUntilScheduled));

    // Send reminder through all channels
    try {
      // In-app notification
      await NotificationHelpers.paymentReminder(
        req.homeownerId,
        req.cleanerName || 'Your cleaner',
        req.serviceType,
        req.totalAmount,
        urgency
      );

      // Email + push notification
      if (req.homeownerEmail) {
        ExternalNotify.paymentReminder(
          req.homeownerEmail,
          req.homeownerName || 'Homeowner',
          req.cleanerName || 'Your cleaner',
          req.serviceType,
          req.totalAmount,
          urgency
        );
      }

      // Update log
      const newTimestamp = now.toISOString();
      await updateReminderLog(req.id, {
        sentTimestamps: [...log.sentTimestamps, newTimestamp],
        lastSentAt: newTimestamp,
        totalSent: log.totalSent + 1,
      });

      // Also update request for quick reference
      req.remindersSent = (req.remindersSent || 0) + 1;
      req.lastReminderAt = newTimestamp;
      await storage.set(key, req);

      console.log(`[HollaClean Reminder] Sent ${urgency} reminder #${log.totalSent + 1} for request ${req.id} to ${req.homeownerName}`);
    } catch (err) {
      console.warn('[HollaClean Reminder] Failed to send reminder:', err);
    }
  }
}
