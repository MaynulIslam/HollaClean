
import React, { useState, useEffect, useRef } from 'react';
import { CleaningRequest } from '../types';
import { createPaymentIntent, PaymentBreakdown } from '../utils/paymentApi';
import { CONFIG } from '../utils/config';
import {
  CreditCard, Lock, CheckCircle, AlertCircle, Loader2, X,
  DollarSign, Calendar, Clock, MapPin, User, Sparkles, Shield
} from 'lucide-react';

interface PaymentCheckoutProps {
  request: CleaningRequest;
  homeownerEmail?: string;
  isOpen: boolean;
  mode?: 'upfront' | 'standard';
  onClose: () => void;
  onPaymentSuccess: (paymentIntentId: string) => void;
}

const PaymentCheckout: React.FC<PaymentCheckoutProps> = ({
  request,
  homeownerEmail,
  isOpen,
  mode = 'standard',
  onClose,
  onPaymentSuccess
}) => {
  const [step, setStep] = useState<'review' | 'payment' | 'processing' | 'success' | 'error'>('review');
  const [breakdown, setBreakdown] = useState<PaymentBreakdown | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCardValid, setIsCardValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [elementReady, setElementReady] = useState(false);

  // Stripe refs
  const stripeRef = useRef<any>(null);
  const elementsRef = useRef<any>(null);
  const paymentElementRef = useRef<any>(null);
  const elementMountedRef = useRef(false);

  // Demo card details (only used in demo mode)
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardName, setCardName] = useState('');

  // Determine if we're in demo mode (no server / no Stripe)
  const isDemoMode = !clientSecret || !stripeRef.current;

  useEffect(() => {
    if (isOpen && request) {
      // Reset state when opening
      setStep('review');
      setError(null);
      setIsCardValid(false);
      setIsSubmitting(false);
      setElementReady(false);
      elementMountedRef.current = false;
      paymentElementRef.current = null;
      elementsRef.current = null;
      initializePayment();
    }
  }, [isOpen, request]);

  // Mount Stripe Payment Element when entering payment step
  useEffect(() => {
    if (step === 'payment' && stripeRef.current && clientSecret && !elementMountedRef.current) {
      // Small delay to ensure the DOM element exists
      const timer = setTimeout(() => {
        const container = document.getElementById('stripe-payment-element');
        if (!container || elementMountedRef.current) return;

        try {
          // Create Elements instance with clientSecret (required for Payment Element)
          const elements = stripeRef.current.elements({
            clientSecret,
            appearance: {
              theme: 'stripe',
              variables: {
                colorPrimary: '#9333ea',
                colorText: '#1f2937',
                fontFamily: 'Poppins, sans-serif',
                borderRadius: '12px',
              },
            },
          });
          elementsRef.current = elements;

          // Create and mount Payment Element
          const paymentElement = elements.create('payment', {
            layout: 'tabs',
          });
          paymentElement.mount('#stripe-payment-element');
          paymentElementRef.current = paymentElement;
          elementMountedRef.current = true;

          paymentElement.on('ready', () => {
            setElementReady(true);
          });

          paymentElement.on('change', (event: any) => {
            setIsCardValid(event.complete);
            if (event.error) {
              setError(event.error.message);
            } else {
              setError(null);
            }
          });
        } catch (err) {
          console.error('Failed to mount Stripe Payment Element:', err);
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [step, clientSecret]);

  // Cleanup when component unmounts or modal closes
  useEffect(() => {
    return () => {
      if (paymentElementRef.current) {
        try { paymentElementRef.current.destroy(); } catch (e) {}
        paymentElementRef.current = null;
        elementsRef.current = null;
        elementMountedRef.current = false;
      }
    };
  }, []);

  const initializePayment = async () => {
    try {
      setError(null);

      // Initialize Stripe instance if not already done
      if (!stripeRef.current && CONFIG.server.stripePublishableKey) {
        const StripeConstructor = (window as any).Stripe;
        if (StripeConstructor) {
          stripeRef.current = StripeConstructor(CONFIG.server.stripePublishableKey);
        }
      }

      const result = await createPaymentIntent({
        amount: request.totalAmount,
        requestId: request.id,
        homeownerId: request.homeownerId,
        homeownerEmail,
        cleanerId: mode === 'upfront' ? 'pending' : (request.cleanerId || 'pending'),
        description: `${request.serviceType} - ${request.hours}hrs`
      });

      setClientSecret(result.clientSecret);
      setPaymentIntentId(result.paymentIntentId);
      setBreakdown(result.breakdown);
    } catch (err: any) {
      console.error('Payment init error:', err);
      // In demo mode, create a fake breakdown
      setBreakdown({
        total: Number(request.totalAmount) || 0,
        platformFee: Number(request.platformCommission) || 0,
        cleanerPayout: Number(request.cleanerPayout) || 0
      });
    }
  };

  // Demo mode card formatting helpers
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleSubmitPayment = async () => {
    if (!isDemoMode && elementsRef.current) {
      // REAL STRIPE PAYMENT using Payment Element
      // IMPORTANT: Do NOT unmount the payment element before confirmPayment completes.
      // Setting step to 'processing' would remove the DOM element Stripe needs.
      setIsSubmitting(true);
      setError(null);

      try {
        const { paymentIntent, error: stripeError } = await stripeRef.current.confirmPayment({
          elements: elementsRef.current,
          confirmParams: {
            return_url: window.location.href,
          },
          redirect: 'if_required',
        });

        if (stripeError) {
          setError(stripeError.message || 'Payment failed. Please try again.');
          setIsSubmitting(false);
          return;
        }

        if (paymentIntent && paymentIntent.status === 'succeeded') {
          setStep('success');
          setTimeout(() => {
            onPaymentSuccess(paymentIntent.id);
          }, 1500);
        } else if (paymentIntent && paymentIntent.status === 'requires_action') {
          // 3D Secure or other auth — Stripe handles this automatically
          // If we get here after redirect, check status
          setError('Additional authentication required. Please try again.');
          setIsSubmitting(false);
        } else {
          setError('Payment was not completed. Please try again.');
          setIsSubmitting(false);
        }
      } catch (err: any) {
        console.error('Stripe payment error:', err);
        setError(err.message || 'Payment failed. Please try again.');
        setIsSubmitting(false);
      }
    } else {
      // DEMO MODE — simulate payment
      setStep('processing');
      await new Promise(resolve => setTimeout(resolve, 2000));
      setStep('success');
      setTimeout(() => {
        onPaymentSuccess(paymentIntentId || 'demo_payment_' + Date.now());
      }, 1500);
    }
  };

  const isDemoCardValid = cardNumber.replace(/\s/g, '').length === 16 &&
                    expiry.length === 5 &&
                    cvc.length >= 3 &&
                    cardName.length > 2;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={(step === 'processing' || isSubmitting) ? undefined : onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 fade-in duration-200">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            <h2 className="text-lg font-bold font-outfit text-gray-900">Secure Checkout</h2>
          </div>
          {step !== 'processing' && !isSubmitting && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="p-4 md:p-6">
          {/* Step: Review */}
          {step === 'review' && (
            <>
              {/* Order Summary */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service</span>
                    <span className="font-medium">{request.serviceType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration</span>
                    <span className="font-medium">{request.hours} hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rate</span>
                    <span className="font-medium">${Number(request.hourlyRate) || 35}/hr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date</span>
                    <span className="font-medium">
                      {new Date(request.date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })} at {request.time}
                    </span>
                  </div>
                  {request.cleanerName && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cleaner</span>
                      <span className="font-medium">{request.cleanerName}</span>
                    </div>
                  )}
                </div>
                <div className="border-t border-purple-200 mt-3 pt-3 flex justify-between">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="text-xl font-bold text-purple-600">
                    ${(Number(request.totalAmount) || 0).toFixed(2)} CAD
                  </span>
                </div>
              </div>

              {/* Payment Info Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
                <div className="flex items-start gap-2">
                  <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-blue-800">Secure Payment</p>
                    <p className="text-blue-700">Your payment is processed <strong>securely via Stripe</strong>. After payment, a cleaner will call you before arriving.</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setStep('payment')}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <CreditCard className="w-5 h-5" />
                Continue to Payment
              </button>
            </>
          )}

          {/* Step: Payment Form */}
          {step === 'payment' && (
            <>
              {/* Submitting overlay — keeps Stripe element in DOM */}
              {isSubmitting && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center rounded-2xl">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                    <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                  </div>
                  <h3 className="text-xl font-bold font-outfit text-gray-900 mb-2">
                    Processing Payment
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Please wait while we securely process your payment...
                  </p>
                </div>
              )}

              {/* Mode indicator */}
              {isDemoMode ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-6">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold text-yellow-800">Demo Mode</p>
                      <p className="text-yellow-700">Payment server not connected. Use test card: 4242 4242 4242 4242</p>
                      <p className="text-yellow-700 text-xs mt-1">Any future date and any 3-digit CVC</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-6">
                  <div className="flex items-start gap-2">
                    <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold text-green-800">Secure Payment</p>
                      <p className="text-green-700">Your card details are securely handled by Stripe. We never see your full card number.</p>
                      <p className="text-green-700 text-xs mt-1">Use test card: 4242 4242 4242 4242, any future date, any CVC</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Card Form */}
              <div className="space-y-4">
                {isDemoMode ? (
                  /* Demo mode: manual card inputs */
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Card Number
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                          placeholder="4242 4242 4242 4242"
                          maxLength={19}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Expiry Date
                        </label>
                        <input
                          type="text"
                          value={expiry}
                          onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                          placeholder="MM/YY"
                          maxLength={5}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          CVC
                        </label>
                        <input
                          type="text"
                          value={cvc}
                          onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          placeholder="123"
                          maxLength={4}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name on Card
                      </label>
                      <input
                        type="text"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="John Smith"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </>
                ) : (
                  /* Real Stripe mode: Stripe Payment Element */
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Details
                      </label>
                      <div
                        id="stripe-payment-element"
                        className="min-h-[120px]"
                      />
                      {error && (
                        <p className="text-red-500 text-xs mt-1">{error}</p>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Total */}
              <div className="flex justify-between items-center py-4 border-t border-gray-100 mt-6">
                <span className="text-gray-600">Total to pay</span>
                <span className="text-2xl font-bold text-purple-600">
                  ${(Number(request.totalAmount) || 0).toFixed(2)}
                </span>
              </div>

              {/* Inline error for Stripe mode */}
              {!isDemoMode && error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 mt-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmitPayment}
                disabled={isSubmitting || (isDemoMode ? !isDemoCardValid : (!isCardValid || !elementReady))}
                className={`w-full py-3 font-semibold rounded-xl flex items-center justify-center gap-2 transition-all ${
                  !isSubmitting && (isDemoMode ? isDemoCardValid : (isCardValid && elementReady))
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Lock className="w-5 h-5" />
                )}
                {isSubmitting ? 'Processing...' : `Pay $${(Number(request.totalAmount) || 0).toFixed(2)} CAD`}
              </button>

              {!isSubmitting && (
                <button
                  onClick={() => {
                    // Cleanup payment element when going back
                    if (paymentElementRef.current) {
                      try { paymentElementRef.current.destroy(); } catch (e) {}
                      paymentElementRef.current = null;
                      elementsRef.current = null;
                      elementMountedRef.current = false;
                    }
                    setElementReady(false);
                    setStep('review');
                  }}
                  className="w-full py-2 text-gray-500 text-sm mt-2 hover:text-gray-700"
                >
                  Back to Review
                </button>
              )}
            </>
          )}

          {/* Step: Processing */}
          {step === 'processing' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
              </div>
              <h3 className="text-xl font-bold font-outfit text-gray-900 mb-2">
                Processing Payment
              </h3>
              <p className="text-gray-600">
                Please wait while we securely process your payment...
              </p>
            </div>
          )}

          {/* Step: Success */}
          {step === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold font-outfit text-gray-900 mb-2">
                Payment Successful!
              </h3>
              <p className="text-gray-600 mb-4">
                {mode === 'upfront'
                  ? 'Your request has been posted! A cleaner will accept your job and call you before arriving.'
                  : 'Payment complete! Your cleaning session is confirmed.'}
              </p>
              <div className="bg-green-50 rounded-xl p-4 text-sm">
                <p className="text-green-800">
                  <span className="font-semibold">Amount paid:</span> ${(Number(request.totalAmount) || 0).toFixed(2)} CAD
                </p>
                <p className="text-green-700 text-xs mt-1">
                  A cleaner will call you before they arrive.
                </p>
              </div>
            </div>
          )}

          {/* Step: Error */}
          {step === 'error' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold font-outfit text-gray-900 mb-2">
                Payment Failed
              </h3>
              <p className="text-gray-600 mb-4">
                {error || 'Something went wrong. Please try again.'}
              </p>
              <button
                onClick={() => {
                  setError(null);
                  setStep('payment');
                }}
                className="px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentCheckout;
