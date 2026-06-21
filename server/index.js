require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const {
  getPayment,
  setPayment,
  getAllPayments,
  getConnectedAccount,
  setConnectedAccount,
  findConnectedAccountByAccountId,
} = require('./lib/paymentStore');

const app = express();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const isProduction = process.env.NODE_ENV === 'production';

const allowedOrigins = isProduction
  ? [process.env.FRONTEND_URL].filter(Boolean)
  : [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://localhost:5173',
      'http://0.0.0.0:3000',
    ];

// In development, also allow any localhost or private-LAN origin (so the app
// can be opened from a phone/another device on the same network during testing).
// Production stays locked to FRONTEND_URL only.
const devLanOrigin = /^http:\/\/(localhost|127\.0\.0\.1|(10|192\.168|172\.(1[6-9]|2\d|3[01]))\.[\d.]+):\d+$/;

function corsOrigin(origin, callback) {
  // Allow non-browser requests (curl, server-to-server) with no Origin header.
  if (!origin) return callback(null, true);
  if (allowedOrigins.includes(origin)) return callback(null, true);
  if (!isProduction && devLanOrigin.test(origin)) return callback(null, true);
  return callback(new Error(`Origin ${origin} not allowed by CORS`));
}

app.use(cors({ origin: corsOrigin, credentials: true }));

app.use((req, res, next) => {
  if (req.originalUrl === '/api/webhooks/stripe') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

const PLATFORM_FEE_PERCENT = parseInt(process.env.PLATFORM_FEE_PERCENT) || 20;

// Admin access = a logged-in Firebase user whose Firestore profile has
// type === 'admin'. Verified server-side via the ID token (same mechanism
// as the rest of the API), so there is no shared admin secret in the client.
const { requireRole } = require('./lib/auth');
const requireAdminAuth = requireRole('admin');

const paymentRateLimits = new Map();
function paymentRateLimit(req, res, next) {
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000;
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

// Payment records and Stripe connected accounts are persisted in Firestore
// (see lib/paymentStore) so they survive server restarts/redeploys.

// ==================== ROOT & HEALTH CHECK ====================

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
  let firestore = 'not_configured';
  let firestoreError = null;
  try {
    const { db } = require('./lib/db');
    await db.collection('users').limit(1).get();
    firestore = 'connected';
  } catch (err) {
    firestore = 'unreachable';
    firestoreError = err.code || err.message;
  }
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    firestore,
    firestoreError,
    config: {
      firebaseServiceAccount: Boolean(process.env.FIREBASE_SERVICE_ACCOUNT),
    },
  });
});

// ==================== DATABASE-BACKED API ====================
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/requests', require('./routes/requests.routes'));
app.use('/api/users', require('./routes/users.routes'));
app.use('/api/reviews', require('./routes/reviews.routes'));
app.use('/api/services', require('./routes/services.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

// ==================== OTP ====================

const otpStore = new Map();

app.post('/api/otp/send', paymentRateLimit, (req, res) => {
  const { target, type } = req.body;
  if (!target || !['email', 'phone'].includes(type)) {
    return res.status(400).json({ error: 'target and type (email|phone) are required' });
  }
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const otpId = uuidv4();
  otpStore.set(otpId, {
    code, target, type,
    expiresAt: Date.now() + 10 * 60 * 1000,
    attempts: 0,
  });
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
  otpStore.delete(otpId);
  res.json({ valid: true });
});

// ==================== PAYMENT INTENTS ====================

app.post('/api/payments/create-intent', paymentRateLimit, async (req, res) => {
  try {
    const { amount, requestId, homeownerId, homeownerEmail, cleanerId, description, commissionRate } = req.body;

    if (!amount || !requestId) {
      return res.status(400).json({ error: 'Amount and requestId are required' });
    }

    const amountInCents = Math.round(amount * 100);

    const MIN_COMMISSION = 5;
    const MAX_COMMISSION = 50;
    const effectiveCommissionPct = commissionRate != null
      ? Math.min(MAX_COMMISSION, Math.max(MIN_COMMISSION, Math.round(commissionRate * 100)))
      : PLATFORM_FEE_PERCENT;
    const platformFee = Math.round(amountInCents * (effectiveCommissionPct / 100));
    const cleanerPayout = amountInCents - platformFee;

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

    const idempotencyKey = `intent-${requestId}`;
    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams, { idempotencyKey });

    await setPayment(paymentIntent.id, {
      id: paymentIntent.id,
      requestId,
      homeownerId,
      cleanerId: cleanerId || null,
      amount: amount,
      platformFee: platformFee / 100,
      cleanerPayout: cleanerPayout / 100,
      status: 'pending',
      createdAt: new Date().toISOString()
    });

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

app.get('/api/payments/:paymentIntentId', async (req, res) => {
  try {
    const { paymentIntentId } = req.params;
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const localPayment = await getPayment(paymentIntentId);
    res.json({
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      ...localPayment
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/payments/transfer-to-cleaner', requireAdminAuth, async (req, res) => {
  try {
    const { paymentIntentId, cleanerId, amount } = req.body;
    if (!paymentIntentId || !cleanerId || !amount) {
      return res.status(400).json({ error: 'paymentIntentId, cleanerId and amount are required' });
    }
    const storedPayment = await getPayment(paymentIntentId);
    if (!storedPayment) return res.status(404).json({ error: 'Payment record not found' });
    if (storedPayment.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment has not been completed yet' });
    }
    const tolerance = 0.01;
    if (Math.abs(storedPayment.cleanerPayout - amount) > tolerance) {
      return res.status(400).json({
        error: `Transfer amount $${amount} does not match stored payout $${storedPayment.cleanerPayout}`
      });
    }
    const accountInfo = await getConnectedAccount(cleanerId);
    if (!accountInfo?.accountId) {
      return res.status(404).json({
        error: 'Cleaner has no connected Stripe account',
        code: 'NO_CONNECT_ACCOUNT'
      });
    }
    const amountInCents = Math.round(amount * 100);
    const transfer = await stripe.transfers.create({
      amount: amountInCents,
      currency: 'cad',
      destination: accountInfo.accountId,
      metadata: { paymentIntentId: paymentIntentId || 'manual', cleanerId, platform: 'hollaclean' },
      description: `HollaClean payout for job`
    });
    console.log(`Transfer created: ${transfer.id} → ${accountInfo.accountId} ($${amount})`);
    res.json({ transferId: transfer.id, amount, status: 'transferred' });
  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== STRIPE CONNECT ====================

app.post('/api/connect/create-account', async (req, res) => {
  try {
    const { cleanerId, email, name } = req.body;
    if (!cleanerId || !email) {
      return res.status(400).json({ error: 'cleanerId and email are required' });
    }
    const existing = await getConnectedAccount(cleanerId);
    if (existing?.accountId) {
      return res.json({ accountId: existing.accountId, alreadyExists: true });
    }
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'CA',
      email: email,
      capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
      business_type: 'individual',
      business_profile: {
        mcc: '7349',
        name: `${name} - HollaClean`,
        product_description: 'Professional cleaning services via HollaClean marketplace'
      },
      metadata: { cleanerId, platform: 'hollaclean' }
    });
    await setConnectedAccount(cleanerId, { accountId: account.id, email, name, status: 'pending', createdAt: new Date().toISOString() });
    res.json({ accountId: account.id, message: 'Account created. Complete onboarding to start receiving payments.' });
  } catch (error) {
    console.error('Connect account error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/connect/onboarding-link', async (req, res) => {
  try {
    const { cleanerId } = req.body;
    const accountInfo = await getConnectedAccount(cleanerId);
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

app.get('/api/connect/status/:cleanerId', async (req, res) => {
  try {
    const { cleanerId } = req.params;
    const accountInfo = await getConnectedAccount(cleanerId);
    if (!accountInfo?.accountId) {
      return res.json({ connected: false, status: 'not_started', message: 'No payment account set up yet' });
    }
    const account = await stripe.accounts.retrieve(accountInfo.accountId);
    const isComplete = account.details_submitted && account.payouts_enabled && account.charges_enabled;
    accountInfo.status = isComplete ? 'active' : 'pending';
    await setConnectedAccount(cleanerId, accountInfo);
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

app.post('/api/connect/dashboard-link', async (req, res) => {
  try {
    const { cleanerId } = req.body;
    const accountInfo = await getConnectedAccount(cleanerId);
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

app.get('/api/connect/balance/:cleanerId', async (req, res) => {
  try {
    const { cleanerId } = req.params;
    const accountInfo = await getConnectedAccount(cleanerId);
    if (!accountInfo?.accountId) {
      return res.json({ available: 0, pending: 0, currency: 'cad' });
    }
    const balance = await stripe.balance.retrieve({ stripeAccount: accountInfo.accountId });
    const available = balance.available.find(b => b.currency === 'cad')?.amount || 0;
    const pending = balance.pending.find(b => b.currency === 'cad')?.amount || 0;
    res.json({ available: available / 100, pending: pending / 100, currency: 'cad' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ADMIN / PLATFORM EARNINGS ====================

app.get('/api/admin/earnings', requireAdminAuth, async (req, res) => {
  try {
    const allPayments = await getAllPayments();
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

app.post('/api/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        console.log('Payment succeeded:', paymentIntent.id);
        const payment = await getPayment(paymentIntent.id);
        if (payment) {
          await setPayment(paymentIntent.id, {
            status: 'succeeded',
            completedAt: new Date().toISOString(),
          });
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const failedPayment = event.data.object;
        console.log('Payment failed:', failedPayment.id);
        const failedRecord = await getPayment(failedPayment.id);
        if (failedRecord) {
          await setPayment(failedPayment.id, {
            status: 'failed',
            error: failedPayment.last_payment_error?.message || null,
          });
        }
        break;
      }

      case 'account.updated': {
        const account = event.data.object;
        console.log('Connected account updated:', account.id);
        const match = await findConnectedAccountByAccountId(account.id);
        if (match) {
          await setConnectedAccount(match.cleanerId, {
            status: account.payouts_enabled ? 'active' : 'pending',
          });
        }
        break;
      }

      case 'payment_intent.created':
      case 'charge.succeeded':
      case 'charge.updated':
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  }
);

// ==================== START SERVER ====================

const missingFirebase = !process.env.FIREBASE_SERVICE_ACCOUNT;
if (missingFirebase) {
  console.warn(
    `\n⚠️  Firebase is NOT configured.\n` +
    `   Set FIREBASE_SERVICE_ACCOUNT in server/.env for auth routes to work.\n` +
    `   Stripe/payment routes will still work without it.\n`
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
