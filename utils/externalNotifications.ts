
/**
 * External Notification System for HollaClean
 *
 * Provides:
 * 1. Email notifications via EmailJS (client-side, no backend needed)
 * 2. Browser push notifications via Notification API
 */

// Declare global EmailJS type from CDN
declare global {
  interface Window {
    emailjs?: {
      init: (publicKey: string) => void;
      send: (serviceId: string, templateId: string, params: Record<string, string>) => Promise<any>;
    };
  }
}

// ── EmailJS Configuration ──────────────────────────────────────────

const EMAILJS_CONFIG = {
  serviceId: (typeof process !== 'undefined' && process.env?.EMAILJS_SERVICE_ID) || '',
  templateId: (typeof process !== 'undefined' && process.env?.EMAILJS_TEMPLATE_ID) || '',
  publicKey: (typeof process !== 'undefined' && process.env?.EMAILJS_PUBLIC_KEY) || '',
};

let emailjsInitialized = false;

function initEmailJS() {
  if (emailjsInitialized) return;
  if (!window.emailjs || !EMAILJS_CONFIG.publicKey || EMAILJS_CONFIG.publicKey === 'your_public_key') return;
  window.emailjs.init(EMAILJS_CONFIG.publicKey);
  emailjsInitialized = true;
}

/**
 * Check if EmailJS is properly configured and available
 */
export function isEmailAvailable(): boolean {
  return !!(
    window.emailjs &&
    EMAILJS_CONFIG.serviceId &&
    EMAILJS_CONFIG.serviceId !== 'your_service_id' &&
    EMAILJS_CONFIG.templateId &&
    EMAILJS_CONFIG.templateId !== 'your_template_id' &&
    EMAILJS_CONFIG.publicKey &&
    EMAILJS_CONFIG.publicKey !== 'your_public_key'
  );
}

/**
 * Send an email notification via EmailJS
 */
export async function sendEmail(
  toEmail: string,
  toName: string,
  subject: string,
  message: string
): Promise<boolean> {
  try {
    initEmailJS();
    if (!isEmailAvailable()) {
      console.log('[HollaClean] EmailJS not configured — email skipped:', subject);
      return false;
    }

    await window.emailjs!.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId, {
      to_email: toEmail,
      to_name: toName,
      subject: subject,
      message: message,
    });

    console.log('[HollaClean] Email sent to:', toEmail);
    return true;
  } catch (err) {
    console.warn('[HollaClean] Email send failed:', err);
    return false;
  }
}

// ── Browser Push Notifications ─────────────────────────────────────

/**
 * Request browser push notification permission
 * Returns true if permission granted
 */
export async function requestPushPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  const result = await Notification.requestPermission();
  return result === 'granted';
}

/**
 * Check if browser push notifications are available and permitted
 */
export function isPushAvailable(): boolean {
  return 'Notification' in window && Notification.permission === 'granted';
}

/**
 * Send a browser push notification
 */
export function sendPushNotification(
  title: string,
  body: string,
  options?: { icon?: string; tag?: string; onClick?: () => void }
): boolean {
  if (!isPushAvailable()) {
    console.log('[HollaClean] Push not permitted — notification skipped:', title);
    return false;
  }

  try {
    const notification = new Notification(title, {
      body,
      icon: options?.icon || '/favicon.svg',
      badge: '/favicon.svg',
      tag: options?.tag || `hollaclean-${Date.now()}`,
    });

    if (options?.onClick) {
      notification.onclick = () => {
        window.focus();
        options.onClick!();
        notification.close();
      };
    } else {
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }

    return true;
  } catch (err) {
    console.warn('[HollaClean] Push notification failed:', err);
    return false;
  }
}

// ── Combined Notification Helpers ──────────────────────────────────

/**
 * Send both email + push notification for a given event.
 * Falls back gracefully if either channel is unavailable.
 */
export const ExternalNotify = {
  /** Notify user to verify their account after registration */
  async verificationReminder(email: string, name: string) {
    sendPushNotification(
      'Welcome to HollaClean!',
      'Complete your verification to build trust and unlock all features.',
      { tag: 'verification-reminder' }
    );

    await sendEmail(
      email,
      name,
      'Welcome to HollaClean — Complete Your Verification',
      `Hi ${name},\n\nWelcome to HollaClean! To build trust with other users and unlock all platform features, please verify your email, phone number, and address.\n\nLog in to your dashboard and go to Profile → Verification Status to get started.\n\nThank you for joining HollaClean!\n\n— The HollaClean Team`
    );
  },

  /** Notify homeowner that payment is required (cleaner started) */
  async paymentRequired(email: string, name: string, cleanerName: string, serviceType: string, amount: number) {
    sendPushNotification(
      'Payment Required — Cleaner is Ready!',
      `${cleanerName} is ready to start your ${serviceType}. Pay $${amount.toFixed(2)} to begin.`,
      { tag: 'payment-required' }
    );

    await sendEmail(
      email,
      name,
      `HollaClean: Payment Required for ${serviceType}`,
      `Hi ${name},\n\nGreat news! ${cleanerName} is ready to start your ${serviceType} cleaning.\n\nPlease log in and pay $${amount.toFixed(2)} to begin the cleaning session.\n\nYour payment will be held securely and released to the cleaner once the job is completed.\n\n— The HollaClean Team`
    );
  },

  /** Notify cleaner that payment was received and job can begin */
  async paymentHeld(email: string, name: string, serviceType: string) {
    sendPushNotification(
      'Payment Received — Start Cleaning!',
      `The homeowner has paid for ${serviceType}. You can now begin!`,
      { tag: 'payment-held' }
    );

    await sendEmail(
      email,
      name,
      `HollaClean: Payment Received — Start ${serviceType}`,
      `Hi ${name},\n\nThe homeowner has paid for the ${serviceType} job. You can now begin cleaning!\n\nThe payment will be released to you once you mark the job as complete.\n\nHappy cleaning!\n\n— The HollaClean Team`
    );
  },

  /** Notify homeowner that cleaning is complete and payment released */
  async jobCompleted(email: string, name: string, cleanerName: string, serviceType: string, amount: number) {
    sendPushNotification(
      'Cleaning Complete!',
      `${cleanerName} has completed your ${serviceType}. $${amount.toFixed(2)} has been released.`,
      { tag: 'job-completed' }
    );

    await sendEmail(
      email,
      name,
      `HollaClean: ${serviceType} Completed`,
      `Hi ${name},\n\n${cleanerName} has completed your ${serviceType} cleaning. $${amount.toFixed(2)} has been released as payment.\n\nWe hope you're satisfied with the service! Please leave a review to help other homeowners.\n\n— The HollaClean Team`
    );
  },

  /** Notify cleaner that their job offer was accepted */
  async jobAccepted(email: string, name: string, serviceType: string, homeownerName: string) {
    sendPushNotification(
      'New Job Accepted!',
      `${homeownerName} has accepted your offer for ${serviceType}.`,
      { tag: 'job-accepted' }
    );

    await sendEmail(
      email,
      name,
      `HollaClean: You Got a New Job — ${serviceType}`,
      `Hi ${name},\n\n${homeownerName} has accepted your offer for ${serviceType}!\n\nLog in to your dashboard to view the job details and start cleaning.\n\n— The HollaClean Team`
    );
  },

  /** Notify cleaner about payment received for completed job */
  async paymentReceived(email: string, name: string, amount: number, serviceType: string) {
    sendPushNotification(
      'Payment Received!',
      `You've earned $${amount.toFixed(2)} for completing ${serviceType}.`,
      { tag: 'payment-received' }
    );

    await sendEmail(
      email,
      name,
      `HollaClean: Payment of $${amount.toFixed(2)} Received`,
      `Hi ${name},\n\nCongratulations! You've earned $${amount.toFixed(2)} for completing ${serviceType}.\n\nKeep up the great work!\n\n— The HollaClean Team`
    );
  },

  /** Recurring payment reminder with escalating urgency */
  async paymentReminder(email: string, name: string, cleanerName: string, serviceType: string, amount: number, urgency: string) {
    const urgencyPrefix = urgency === 'final' ? 'FINAL REMINDER: ' : urgency === 'urgent' ? 'URGENT: ' : '';

    sendPushNotification(
      `${urgencyPrefix}Payment Reminder`,
      `Pay $${amount.toFixed(2)} for your ${serviceType} with ${cleanerName}.`,
      { tag: `payment-reminder-${Date.now()}` }
    );

    await sendEmail(
      email,
      name,
      `${urgencyPrefix}HollaClean Payment Reminder — ${serviceType}`,
      `Hi ${name},\n\nThis is a ${urgency === 'final' ? 'final ' : urgency === 'urgent' ? 'urgent ' : ''}reminder to complete your payment of $${amount.toFixed(2)} for your ${serviceType} cleaning with ${cleanerName}.\n\nPlease log in to HollaClean and pay to confirm your booking. Your payment is held securely and only released after the job is completed.\n\n— The HollaClean Team`
    );
  },

  /** Booking confirmation when cleaner accepts */
  async bookingConfirmation(email: string, name: string, cleanerName: string, serviceType: string, amount: number, date: string, time: string) {
    const formattedDate = new Date(date).toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' });

    sendPushNotification(
      'Booking Confirmed!',
      `${cleanerName} accepted your ${serviceType} for ${formattedDate} at ${time}.`,
      { tag: 'booking-confirmed' }
    );

    await sendEmail(
      email,
      name,
      `HollaClean: Booking Confirmed — ${serviceType}`,
      `Hi ${name},\n\n${cleanerName} has accepted your ${serviceType} cleaning request!\n\nDetails:\n- Date: ${formattedDate}\n- Time: ${time}\n- Amount: $${amount.toFixed(2)}\n\nA booking quote is available in your dashboard under My Requests. Please make payment before the scheduled time to confirm.\n\n— The HollaClean Team`
    );
  },
};
