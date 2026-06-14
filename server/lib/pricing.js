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
  commissionRate: 0.20,   // 20% platform fee
  defaultHourlyRate: 35,
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

module.exports = { computePricing, DEFAULTS, round2 };
