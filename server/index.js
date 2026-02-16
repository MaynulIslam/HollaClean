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

const app = express();

// Stripe initialization
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// CORS configuration
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://0.0.0.0:3000',
  ],
  credentials: true
}));

// Parse JSON for most routes
app.use((req, res, next) => {
  if (req.originalUrl === '/api/webhooks/stripe') {
    next(); // Skip JSON parsing for webhooks (needs raw body)
  } else {
    express.json()(req, res, next);
  }
});

// Platform fee percentage (20%)
const PLATFORM_FEE_PERCENT = parseInt(process.env.PLATFORM_FEE_PERCENT) || 20;

// In-memory storage for payments (transient, OK to lose on restart)
const payments = new Map();
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

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==================== PAYMENT INTENTS (Homeowner pays) ====================

/**
 * Create a payment intent for a cleaning job
 * Called when homeowner confirms booking
 */
app.post('/api/payments/create-intent', async (req, res) => {
  try {
    const { amount, requestId, homeownerId, homeownerEmail, cleanerId, description } = req.body;

    if (!amount || !requestId) {
      return res.status(400).json({ error: 'Amount and requestId are required' });
    }

    // Amount should be in cents for Stripe
    const amountInCents = Math.round(amount * 100);

    // Calculate platform fee
    const platformFee = Math.round(amountInCents * (PLATFORM_FEE_PERCENT / 100));
    const cleanerPayout = amountInCents - platformFee;

    // Create payment intent
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

    // If a real cleaner is assigned (not upfront/pending), set up transfer
    if (cleanerId && cleanerId !== 'pending') {
      const cleanerAccount = connectedAccounts.get(cleanerId);
      if (cleanerAccount?.accountId) {
        paymentIntentParams.transfer_data = {
          destination: cleanerAccount.accountId,
          amount: cleanerPayout, // Amount to transfer to cleaner
        };
      }
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

    // Store payment info
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
app.post('/api/payments/transfer-to-cleaner', async (req, res) => {
  try {
    const { paymentIntentId, cleanerId, amount } = req.body;

    if (!cleanerId || !amount) {
      return res.status(400).json({ error: 'cleanerId and amount are required' });
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
app.get('/api/admin/earnings', async (req, res) => {
  try {
    // In production, verify admin authentication here

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
app.get('/api/admin/balance', async (req, res) => {
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
