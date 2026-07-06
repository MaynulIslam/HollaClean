/**
 * SINGLE source of truth for all money math.
 *
 * Previously the tax/commission calculation was duplicated (and inconsistent)
 * across calculatePayment(), CreateRequest, RequestsFeed, PaymentCheckout and
 * MyRequests — the numbers disagreed. Everything money-related must now flow
 * through this function so every screen and the Stripe charge always agree.
 *
 * Model:
 *   subtotal           = hourlyRate * hours          (pre-tax service cost)
 *   taxAmount          = subtotal * taxRate          (HST, passed to government)
 *   totalAmount        = subtotal + taxAmount        (what the homeowner pays)
 *   platformCommission = subtotal * commissionRate   (taken from pre-tax subtotal)
 *   cleanerPayout      = subtotal - platformCommission
 */

const DEFAULTS = {
  taxRate: 0.13,          // 13% HST (Ontario)
  commissionRate: 0.20,   // 20% platform fee (legacy hourly model)
  defaultHourlyRate: 35,
};

/**
 * Name-your-price model (mobile app / marketplace v2, "Option B"):
 * the customer names a base price B, the cleaner accepts or counters,
 * and once agreed:
 *   customerTotal   = B + B * taxRate          (what the customer pays)
 *   cleanerPayout   = B - B * commissionRate   (what the cleaner receives)
 *   platformRevenue = B * commissionRate
 *   taxAmount       = B * taxRate              (HST, remitted to CRA)
 */
const JOB_PRICING = {
  taxRate: 0.13,        // 13% HST (Ontario)
  commissionRate: 0.30, // 30% platform commission (from the cleaner)
  minBasePrice: 20,     // jobs cannot be posted below this
};

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function computePricing({ hourlyRate, hours, taxRate, commissionRate } = {}) {
  const rate = Number(hourlyRate) > 0 ? Number(hourlyRate) : DEFAULTS.defaultHourlyRate;
  const hrs = Number(hours) > 0 ? Number(hours) : 1;
  const tRate = taxRate != null ? Number(taxRate) : DEFAULTS.taxRate;
  const cRate = commissionRate != null ? Number(commissionRate) : DEFAULTS.commissionRate;

  const subtotal = round2(rate * hrs);
  const taxAmount = round2(subtotal * tRate);
  const totalAmount = round2(subtotal + taxAmount);
  const platformCommission = round2(subtotal * cRate);
  const cleanerPayout = round2(subtotal - platformCommission);

  return {
    hourlyRate: rate,
    hours: hrs,
    subtotal,
    taxRate: tRate,
    taxAmount,
    totalAmount,
    platformCommission,
    cleanerPayout,
  };
}

/**
 * Compute all money fields for a name-your-price job with base price [basePrice].
 * Throws if the base price is below the platform minimum.
 */
function computeJobPricing(basePrice) {
  const base = round2(basePrice);
  if (!(base >= JOB_PRICING.minBasePrice)) {
    const err = new Error(`Base price must be at least $${JOB_PRICING.minBasePrice}`);
    err.code = 'BASE_PRICE_TOO_LOW';
    throw err;
  }
  const taxAmount = round2(base * JOB_PRICING.taxRate);
  const customerTotal = round2(base + taxAmount);
  const platformCommission = round2(base * JOB_PRICING.commissionRate);
  const cleanerPayout = round2(base - platformCommission);
  return {
    basePrice: base,
    taxRate: JOB_PRICING.taxRate,
    taxAmount,
    totalAmount: customerTotal,
    platformCommission,
    cleanerPayout,
  };
}

module.exports = { computePricing, computeJobPricing, DEFAULTS, JOB_PRICING, round2 };
