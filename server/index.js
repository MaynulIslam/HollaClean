/**
 * HollaClean Payment Server
 *
 * Handles Stripe payments for the cleaning marketplace:
 * - Payment collection from homeowners
 * - Payouts to cleaners via Stripe Connect
 * - Platform fee collection for admin
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const app = express();

// Stripe initialization
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// CORS configuration — dev always allows localhost; prod locks to FRONTEND_URL
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.FRONTEND_URL].filter(Boolean)
  : [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://localhost:5173',
      'http://0.0.0.0:3000',
    ];

app.use(cors({ origin: allowedOrigins, credentials: true }));

// Parse JSON for most routes
app.use((req, res, next) => {
  if (req.originalUrl === '/api/webhooks/stripe') {
    next(); // Skip JSON parsing for webhooks (needs raw body)
  } else {
    express.json()(req, res, next);
  }
});

// Platform fee percentage (20%) — can be overridden per-request via commissionRate body param
const PLATFORM_FEE_PERCENT = parseInt(process.env.PLATFORM_FEE_PERCENT) || 20;

// Admin HMAC secret — used to sign short-lived admin tokens
const ADMIN_HMAC_SECRET = process.env.ADMIN_SECRET || 'hollaclean-admin-secret-dev';
const ADMIN_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes

function generateAdminToken() {
  const expires = Date.now() + ADMIN_TOKEN_TTL_MS;
  const payload = `${expires}`;
  const sig = crypto.createHmac('sha256', ADMIN_HMAC_SECRET).update(payload).digest('hex');
  return `${expires}.${sig}`;
}

function verifyAdminToken(token) {
  if (!token) return false;
  const [expiresStr, sig] = token.split('.');
  if (!expiresStr || !sig) return false;
  const expires = parseInt(expiresStr, 10);
  if (isNaN(expires) || Date.now() > expires) return false;
  const expected = crypto.createHmac('sha256', ADMIN_HMAC_SECRET).update(expiresStr).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'));
}

// ─── Admin auth middleware ───
function requireAdminAuth(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (!verifyAdminToken(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// ─── Simple in-memory rate limiter for payment creation ───
const paymentRateLimits = new Map(); // ip → { count, resetAt }
function paymentRateLimit(req, res, next) {
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = 10;
  const entry = paymentRateLimits.get(ip);
  if (!entry || now > entry.resetAt) {
    paymentRateLimits.set(ip, { count: 1, resetAt: now + windowMs });
    return next();
  }
  if (entry.count >= maxRequests) {
    return res.status(429).json({ error: 'Too many requests. Please wait before trying again.' });
  }
  entry.count++;
  next();
}

// ─── Persistent storage for payments ───
const PAYMENTS_FILE = path.join(__dirname, 'payments.json');

function loadPayments() {
  try {
    if (fs.existsSync(PAYMENTS_FILE)) {
      const data = JSON.parse(fs.readFileSync(PAYMENTS_FILE, 'utf8'));
      return new Map(Object.entries(data));
    }
  } catch (err) {
    console.error('Failed to load payments:', err.message);
  }
  return new Map();
}

function savePayments(paymentsMap) {
  try {
    const obj = Object.fromEntries(paymentsMap);
    fs.writeFileSync(PAYMENTS_FILE, JSON.stringify(obj, null, 2));
  } catch (err) {
    console.error('Failed to save payments:', err.message);
  }
}

const payments = loadPayments();
console.log(`Loaded ${payments.size} payment record(s) from disk`);
const platformEarnings = { total: 0, transactions: [] };

// ─── Persistent storage for connected Stripe accounts ───
const CONNECTED_ACCOUNTS_FILE = path.join(__dirname, 'connected-accounts.json');

function loadConnectedAccounts() {
  try {
    if (fs.existsSync(CONNECTED_ACCOUNTS_FILE)) {
      const data = JSON.parse(fs.readFileSync(CONNECTED_ACCOUNTS_FILE, 'utf8'));
      return new Map(Object.entries(data));
    }
  } catch (err) {
    console.error('Failed to load connected accounts:', err.message);
  }
  return new Map();
}

function saveConnectedAccounts() {
  try {
    const obj = Object.fromEntries(connectedAccounts);
    fs.writeFileSync(CONNECTED_ACCOUNTS_FILE, JSON.stringify(obj, null, 2));
  } catch (err) {
    console.error('Failed to save connected accounts:', err.message);
  }
}

const connectedAccounts = loadConnectedAccounts();
console.log(`Loaded ${connectedAccounts.size} connected account(s) from disk`);

// ==================== ROOT & HEALTH CHECK ====================

// Root route - server info
app.get('/', (req, res) => {
  res.json({
    name: 'HollaClean Payment Server',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      payments: '/api/payments/*',
      connect: '/api/connect/*',
      admin: '/api/admin/*'
    }
  });
});

app.get('/api/health', async (req, res) => {
  const dbConfigured = Boolean(process.env.DATABASE_URL);
  let database = 'not_configured';
  if (dbConfigured) {
    try {
      const { prisma } = require('./lib/db');
      await prisma.$queryRaw`SELECT 1`;
      database = 'connected';
    } catch (err) {
      database = 'unreachable';
    }
  }
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database,
    config: {
      databaseUrl: dbConfigured,
      jwtSecret: Boolean(process.env.JWT_SECRET),
      firebaseServiceAccount: Boolean(process.env.FIREBASE_SERVICE_ACCOUNT),
    },
  });
});

// ==================== DATABASE-BACKED API (the rebuild) ====================
// These routers replace the old localStorage model with a shared Postgres DB.
// Identity comes from a verified JWT (see lib/auth.js); marketplace data lives
// in the DB (see lib/db.js + prisma/schema.prisma). The legacy Stripe routes
// below stay as-is for now.
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/requests', require('./routes/requests.routes'));
app.use('/api/users', require('./routes/users.routes'));
app.use('/api/reviews', require('./routes/reviews.routes'));

// ==================== AUTH (Password hashing via bcrypt) ====================

const BCRYPT_ROUNDS = 12;

// Hash a password — called from frontend on register
app.post('/api/auth/hash-password', paymentRateLimit, async (req, res) => {
  const { password } = req.body;
  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  res.json({ hash });
});

// Verify a password against a stored hash — called from frontend on login
app.post('/api/auth/verify-password', paymentRateLimit, async (req, res) => {
  const { password, hash } = req.body;
  if (!password || !hash) {
    return res.status(400).json({ error: 'password and hash are required' });
  }
  const valid = await bcrypt.compare(password, hash);
  res.json({ valid });
});

// ==================== ADMIN TOKEN ====================

// Issue a short-lived HMAC admin token when the static secret matches
app.post('/api/auth/admin-token', (req, res) => {
  const { secret } = req.body;
  if (!secret || secret !== ADMIN_HMAC_SECRET) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  res.json({ token: generateAdminToken(), expiresIn: ADMIN_TOKEN_TTL_MS });
});

// ==================== OTP ====================

// In-memory OTP store: { [otpId]: { code, expiresAt, target, verified } }
const otpStore = new Map();

app.post('/api/otp/send', paymentRateLimit, (req, res) => {
  const { target, type } = req.body; // target = email or phone
  if (!target || !['email', 'phone'].includes(type)) {
    return res.status(400).json({ error: 'target and type (email|phone) are required' });
  }
  const code = String(Math.floor(100000 + Math.random() * 900000)); // 6-digit
  const otpId = uuidv4();
  otpStore.set(otpId, {
    code,
    target,
    type,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    attempts: 0,
  });

  // In production: send `code` via EmailJS/Twilio. For now log in dev only.
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[OTP DEV] ${type} OTP for ${target}: ${code}`);
  }

  res.json({ otpId });
});

app.post('/api/otp/verify', (req, res) => {
  const { otpId, code } = req.body;
  if (!otpId || !code) {
    return res.status(400).json({ error: 'otpId and code are required' });
  }
  const entry = otpStore.get(otpId);
  if (!entry) return res.status(404).json({ error: 'OTP not found or already used' });
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(otpId);
    return res.status(410).json({ error: 'OTP expired' });
  }
  entry.attempts++;
  if (entry.attempts > 5) {
    otpStore.delete(otpId);
    return res.status(429).json({ error: 'Too many attempts. Request a new code.' });
  }
  if (code !== entry.code) {
    return res.status(400).json({ valid: false, error: 'Invalid code' });
  }
  otpStore.delete(otpId); // one-time use
  res.json({ valid: true });
});

// ==================== PAYMENT INTENTS (Homeowner pays) ====================

/**
 * Create a payment intent for a cleaning job
 * Called when homeowner confirms booking
 */
app.post('/api/payments/create-intent', paymentRateLimit, async (req, res) => {
  try {
    const { amount, requestId, homeownerId, homeownerEmail, cleanerId, description, commissionRate } = req.body;

    if (!amount || !requestId) {
      return res.status(400).json({ error: 'Amount and requestId are required' });
    }

    // Amount should be in cents for Stripe
    const amountInCents = Math.round(amount * 100);

    // Use commission rate from frontend if provided, clamped to [5, 50]% to prevent abuse
    const MIN_COMMISSION = 5;
    const MAX_COMMISSION = 50;
    const effectiveCommissionPct = commissionRate != null
      ? Math.min(MAX_COMMISSION, Math.max(MIN_COMMISSION, Math.round(commissionRate * 100)))
      : PLATFORM_FEE_PERCENT;
    const platformFee = Math.round(amountInCents * (effectiveCommissionPct / 100));
    const cleanerPayout = amountInCents - platformFee;

    // Create payment intent — NO transfer_data.
    // Transfers to cleaners are handled manually by admin via /transfer-to-cleaner.
    const paymentIntentParams = {
      amount: amountInCents,
      currency: 'cad',
      metadata: {
        requestId,
        homeownerId,
        cleanerId: cleanerId || 'pending',
        platformFee: platformFee.toString(),
        cleanerPayout: cleanerPayout.toString()
      },
      description: description || `HollaClean - Cleaning Service`,
      receipt_email: homeownerEmail,
      payment_method_types: ['card'],
    };

    // Idempotency key scoped to requestId — safe to retry, prevents double-charges
    const idempotencyKey = `intent-${requestId}`;
    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams, { idempotencyKey });

    // Store payment info (persisted to disk)
    payments.set(paymentIntent.id, {
      id: paymentIntent.id,
      requestId,
      homeownerId,
      cleanerId,
      amount: amount,
      platformFee: platformFee / 100,
      cleanerPayout: cleanerPayout / 100,
      status: 'pending',
      createdAt: new Date().toISOString()
    });
    savePayments(payments);

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      breakdown: {
        total: amount,
        platformFee: platformFee / 100,
        cleanerPayout: cleanerPayout / 100
      }
    });

  } catch (error) {
    console.error('Payment intent error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get payment status
 */
app.get('/api/payments/:paymentIntentId', async (req, res) => {
  try {
    const { paymentIntentId } = req.params;
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const localPayment = payments.get(paymentIntentId);

    res.json({
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      ...localPayment
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Transfer cleaner's payout after job completion
 * Called when cleaner marks a job as complete
 */
app.post('/api/payments/transfer-to-cleaner', requireAdminAuth, async (req, res) => {
  try {
    const { paymentIntentId, cleanerId, amount } = req.body;

    if (!paymentIntentId || !cleanerId || !amount) {
      return res.status(400).json({ error: 'paymentIntentId, cleanerId and amount are required' });
    }

    // Validate amount against our stored record — prevents admin UI from sending wrong amounts
    const storedPayment = payments.get(paymentIntentId);
    if (!storedPayment) {
      return res.status(404).json({ error: 'Payment record not found' });
    }
    if (storedPayment.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment has not been completed yet' });
    }
    const tolerance = 0.01; // allow 1 cent rounding difference
    if (Math.abs(storedPayment.cleanerPayout - amount) > tolerance) {
      return res.status(400).json({
        error: `Transfer amount $${amount} does not match stored payout $${storedPayment.cleanerPayout}`
      });
    }

    const accountInfo = connectedAccounts.get(cleanerId);
    if (!accountInfo?.accountId) {
      return res.status(404).json({
        error: 'Cleaner has no connected Stripe account',
        code: 'NO_CONNECT_ACCOUNT'
      });
    }

    // Amount is the cleaner's payout (80%), convert to cents
    const amountInCents = Math.round(amount * 100);

    const transfer = await stripe.transfers.create({
      amount: amountInCents,
      currency: 'cad',
      destination: accountInfo.accountId,
      metadata: {
        paymentIntentId: paymentIntentId || 'manual',
        cleanerId,
        platform: 'hollaclean'
      },
      description: `HollaClean payout for job`
    });

    console.log(`Transfer created: ${transfer.id} → ${accountInfo.accountId} ($${amount})`);

    res.json({
      transferId: transfer.id,
      amount: amount,
      status: 'transferred'
    });

  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== STRIPE CONNECT (Cleaner onboarding) ====================

/**
 * Create a Stripe Connect account for a cleaner
 * This starts the onboarding process
 */
app.post('/api/connect/create-account', async (req, res) => {
  try {
    const { cleanerId, email, name } = req.body;

    if (!cleanerId || !email) {
      return res.status(400).json({ error: 'cleanerId and email are required' });
    }

    // Check if already has account
    const existing = connectedAccounts.get(cleanerId);
    if (existing?.accountId) {
      return res.json({
        accountId: existing.accountId,
        alreadyExists: true
      });
    }

    // Create Express account for the cleaner
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'CA',
      email: email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      business_profile: {
        mcc: '7349', // Cleaning services
        name: `${name} - HollaClean`,
        product_description: 'Professional cleaning services via HollaClean marketplace'
      },
      metadata: {
        cleanerId,
        platform: 'hollaclean'
      }
    });

    // Store the account mapping (persisted to disk)
    connectedAccounts.set(cleanerId, {
      accountId: account.id,
      email,
      name,
      status: 'pending',
      createdAt: new Date().toISOString()
    });
    saveConnectedAccounts();

    res.json({
      accountId: account.id,
      message: 'Account created. Complete onboarding to start receiving payments.'
    });

  } catch (error) {
    console.error('Connect account error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Generate onboarding link for cleaner to complete Stripe setup
 */
app.post('/api/connect/onboarding-link', async (req, res) => {
  try {
    const { cleanerId } = req.body;
    const accountInfo = connectedAccounts.get(cleanerId);

    if (!accountInfo?.accountId) {
      return res.status(404).json({ error: 'No connected account found. Create one first.' });
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountInfo.accountId,
      refresh_url: `${process.env.FRONTEND_URL}?stripe_refresh=true&cleanerId=${cleanerId}`,
      return_url: `${process.env.FRONTEND_URL}?stripe_success=true&cleanerId=${cleanerId}`,
      type: 'account_onboarding',
    });

    res.json({ url: accountLink.url });

  } catch (error) {
    console.error('Onboarding link error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Check if cleaner's Stripe account is fully set up
 */
app.get('/api/connect/status/:cleanerId', async (req, res) => {
  try {
    const { cleanerId } = req.params;
    const accountInfo = connectedAccounts.get(cleanerId);

    if (!accountInfo?.accountId) {
      return res.json({
        connected: false,
        status: 'not_started',
        message: 'No payment account set up yet'
      });
    }

    const account = await stripe.accounts.retrieve(accountInfo.accountId);

    const isComplete = account.details_submitted &&
                       account.payouts_enabled &&
                       account.charges_enabled;

    // Update local status (persisted to disk)
    accountInfo.status = isComplete ? 'active' : 'pending';
    connectedAccounts.set(cleanerId, accountInfo);
    saveConnectedAccounts();

    res.json({
      connected: true,
      status: isComplete ? 'active' : 'pending',
      detailsSubmitted: account.details_submitted,
      payoutsEnabled: account.payouts_enabled,
      chargesEnabled: account.charges_enabled,
      message: isComplete
        ? 'Your account is ready to receive payments!'
        : 'Complete your account setup to receive payments'
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get cleaner's Stripe dashboard link
 */
app.post('/api/connect/dashboard-link', async (req, res) => {
  try {
    const { cleanerId } = req.body;
    const accountInfo = connectedAccounts.get(cleanerId);

    if (!accountInfo?.accountId) {
      return res.status(404).json({ error: 'No connected account found' });
    }

    const loginLink = await stripe.accounts.createLoginLink(accountInfo.accountId);
    res.json({ url: loginLink.url });

  } catch (error) {
    console.error('Dashboard link error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get cleaner's balance from Stripe
 */
app.get('/api/connect/balance/:cleanerId', async (req, res) => {
  try {
    const { cleanerId } = req.params;
    const accountInfo = connectedAccounts.get(cleanerId);

    if (!accountInfo?.accountId) {
      return res.json({
        available: 0,
        pending: 0,
        currency: 'cad'
      });
    }

    const balance = await stripe.balance.retrieve({
      stripeAccount: accountInfo.accountId
    });

    const available = balance.available.find(b => b.currency === 'cad')?.amount || 0;
    const pending = balance.pending.find(b => b.currency === 'cad')?.amount || 0;

    res.json({
      available: available / 100,
      pending: pending / 100,
      currency: 'cad'
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ADMIN / PLATFORM EARNINGS ====================

/**
 * Get platform earnings summary (Admin only)
 */
app.get('/api/admin/earnings', requireAdminAuth, async (req, res) => {
  try {

    const allPayments = Array.from(payments.values());
    const completedPayments = allPayments.filter(p => p.status === 'succeeded');

    const totalRevenue = completedPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalPlatformFees = completedPayments.reduce((sum, p) => sum + p.platformFee, 0);
    const totalCleanerPayouts = completedPayments.reduce((sum, p) => sum + p.cleanerPayout, 0);

    res.json({
      summary: {
        totalRevenue: totalRevenue.toFixed(2),
        platformEarnings: totalPlatformFees.toFixed(2),
        cleanerPayouts: totalCleanerPayouts.toFixed(2),
        totalTransactions: completedPayments.length
      },
      recentTransactions: completedPayments.slice(-10).reverse()
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get Stripe account balance (Platform's own balance)
 */
app.get('/api/admin/balance', requireAdminAuth, async (req, res) => {
  try {
    const balance = await stripe.balance.retrieve();

    const available = balance.available.find(b => b.currency === 'cad')?.amount || 0;
    const pending = balance.pending.find(b => b.currency === 'cad')?.amount || 0;

    res.json({
      available: available / 100,
      pending: pending / 100,
      currency: 'cad',
      message: 'This is your platform earnings that can be paid out to your bank'
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== WEBHOOKS ====================

/**
 * Handle Stripe webhooks for payment events
 */
app.post('/api/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('Payment succeeded:', paymentIntent.id);

        // Update payment status
        const payment = payments.get(paymentIntent.id);
        if (payment) {
          payment.status = 'succeeded';
          payment.completedAt = new Date().toISOString();
          payments.set(paymentIntent.id, payment);
          savePayments(payments);

          // Track platform earnings
          platformEarnings.total += payment.platformFee;
          platformEarnings.transactions.push({
            paymentId: paymentIntent.id,
            amount: payment.platformFee,
            timestamp: new Date().toISOString()
          });
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        console.log('Payment failed:', failedPayment.id);

        const failedRecord = payments.get(failedPayment.id);
        if (failedRecord) {
          failedRecord.status = 'failed';
          failedRecord.error = failedPayment.last_payment_error?.message;
          payments.set(failedPayment.id, failedRecord);
          savePayments(payments);
        }
        break;

      case 'account.updated':
        const account = event.data.object;
        console.log('Connected account updated:', account.id);

        // Find and update the connected account
        for (const [cleanerId, info] of connectedAccounts.entries()) {
          if (info.accountId === account.id) {
            info.status = account.payouts_enabled ? 'active' : 'pending';
            connectedAccounts.set(cleanerId, info);
            saveConnectedAccounts();
            break;
          }
        }
        break;

      case 'payment_intent.created':
      case 'charge.succeeded':
      case 'charge.updated':
        // Expected events, no action needed
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  }
);

// ==================== START SERVER ====================

// Warn loudly at startup if the database-backed API is missing its config.
// The server still boots (Stripe/payment routes work without these), but the
// new /api/auth, /api/requests, /api/users and /api/reviews routes will fail
// at the database boundary until these are set. This prints exactly what's
// missing so it's obvious in the Render logs.
const DB_API_ENV = ['DATABASE_URL', 'JWT_SECRET', 'FIREBASE_SERVICE_ACCOUNT'];
const missingDbEnv = DB_API_ENV.filter((k) => !process.env[k]);
if (missingDbEnv.length > 0) {
  console.warn(
    `\n⚠️  Database-backed API is NOT fully configured.\n` +
    `   Missing env var(s): ${missingDbEnv.join(', ')}\n` +
    `   Stripe/payment routes will work, but /api/auth, /api/requests,\n` +
    `   /api/users and /api/reviews will fail until these are set\n` +
    `   (and 'prisma migrate deploy' has been run against the database).\n`
  );
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════════════════╗
  ║                                                       ║
  ║   🧹 HollaClean Payment Server                        ║
  ║                                                       ║
  ║   Server running on: http://localhost:${PORT}            ║
  ║                                                       ║
  ║   Endpoints:                                          ║
  ║   POST /api/payments/create-intent  - Create payment  ║
  ║   POST /api/connect/create-account  - Cleaner signup  ║
  ║   POST /api/connect/onboarding-link - Setup link      ║
  ║   GET  /api/connect/status/:id      - Check status    ║
  ║   GET  /api/admin/earnings          - Platform stats  ║
  ║                                                       ║
  ╚═══════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
