
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import {
  createConnectAccount,
  getOnboardingLink,
  getConnectStatus,
  getDashboardLink,
  getCleanerBalance,
  ConnectStatus
} from '../utils/paymentApi';
import { storage } from '../utils/storage';
import {
  CreditCard, ExternalLink, CheckCircle, AlertCircle, Loader2,
  Wallet, TrendingUp, DollarSign, Clock, ArrowRight, Shield,
  RefreshCw, BanknoteIcon, Sparkles
} from 'lucide-react';
import { Button, Card } from './UI';

interface StripeConnectSetupProps {
  user: User;
  onStatusChange?: (status: ConnectStatus) => void;
}

const StripeConnectSetup: React.FC<StripeConnectSetupProps> = ({ user, onStatusChange }) => {
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [balance, setBalance] = useState<{ available: number; pending: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkStatus();
  }, [user.id]);

  const checkStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const connectStatus = await getConnectStatus(user.id);
      setStatus(connectStatus);
      onStatusChange?.(connectStatus);

      // Persist connect status to user in localStorage
      if (connectStatus.status !== 'not_started') {
        const userData = await storage.get(`user:${user.id}`);
        if (userData && userData.stripeConnectStatus !== connectStatus.status) {
          userData.stripeConnectStatus = connectStatus.status;
          await storage.set(`user:${user.id}`, userData);
        }
      }

      if (connectStatus.status === 'active') {
        const bal = await getCleanerBalance(user.id);
        setBalance(bal);
      }
    } catch (err: any) {
      console.error('Status check error:', err);
      // Demo mode fallback
      setStatus({
        connected: false,
        status: 'not_started',
        message: 'Set up your payment account to receive payouts'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartSetup = async () => {
    try {
      setActionLoading(true);
      setError(null);

      // Create connect account
      const { accountId } = await createConnectAccount({
        cleanerId: user.id,
        email: user.email,
        name: user.name
      });

      // Save Stripe account ID to user in localStorage
      const userData = await storage.get(`user:${user.id}`);
      if (userData) {
        userData.stripeAccountId = accountId;
        userData.stripeConnectStatus = 'pending';
        await storage.set(`user:${user.id}`, userData);
      }

      // Get onboarding link
      const { url } = await getOnboardingLink(user.id);
      window.open(url, '_blank');

    } catch (err: any) {
      console.error('Setup error:', err);
      setError(err.message || 'Failed to start setup. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleContinueSetup = async () => {
    try {
      setActionLoading(true);
      const { url } = await getOnboardingLink(user.id);
      window.open(url, '_blank');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenDashboard = async () => {
    try {
      setActionLoading(true);
      const { url } = await getDashboardLink(user.id);
      window.open(url, '_blank');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
          <span className="text-gray-600">Checking payment setup...</span>
        </div>
      </Card>
    );
  }

  // Not started - Show setup prompt
  if (!status?.connected || status.status === 'not_started') {
    return (
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Wallet className="w-8 h-8" />
            <h3 className="text-xl font-bold font-outfit">Set Up Payments</h3>
          </div>
          <p className="text-purple-100">
            Connect your bank account to receive payouts for completed jobs
          </p>
        </div>

        <div className="p-6">
          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Keep 80% of every job</p>
                <p className="text-sm text-gray-500">Industry-leading payout rates</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Fast payouts</p>
                <p className="text-sm text-gray-500">Money in your bank within 2 business days</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Secure & encrypted</p>
                <p className="text-sm text-gray-500">Powered by Stripe, trusted by millions</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
              <div className="flex items-center gap-2 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            </div>
          )}

          <Button
            onClick={handleStartSetup}
            disabled={actionLoading}
            className="w-full"
          >
            {actionLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                Set Up Payment Account
                <ExternalLink className="w-4 h-4" />
              </>
            )}
          </Button>

          <p className="text-xs text-gray-500 text-center mt-3">
            You'll be redirected to Stripe to complete setup
          </p>
        </div>
      </Card>
    );
  }

  // Pending - Setup incomplete
  if (status.status === 'pending') {
    return (
      <Card className="overflow-hidden">
        <div className="bg-yellow-50 border-b border-yellow-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Complete Your Setup</h3>
              <p className="text-sm text-yellow-700">{status.message}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <h4 className="font-semibold text-gray-900 mb-2">Setup Status</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Account Created</span>
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Details Submitted</span>
                {status.detailsSubmitted ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <Clock className="w-5 h-5 text-yellow-500" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Payouts Enabled</span>
                {status.payoutsEnabled ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <Clock className="w-5 h-5 text-yellow-500" />
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
              <div className="flex items-center gap-2 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            </div>
          )}

          <Button
            onClick={handleContinueSetup}
            disabled={actionLoading}
            className="w-full"
          >
            {actionLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Continue Setup
                <ExternalLink className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </Card>
    );
  }

  // Active - Full dashboard
  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold font-outfit">Payment Account Active</h3>
              <p className="text-green-100 text-sm">Ready to receive payouts</p>
            </div>
          </div>
          <button
            onClick={checkStatus}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Balance */}
        {balance && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-green-100 text-sm mb-1">Available</p>
              <p className="text-2xl font-bold">${balance.available.toFixed(2)}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-green-100 text-sm mb-1">Pending</p>
              <p className="text-2xl font-bold">${balance.pending.toFixed(2)}</p>
            </div>
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={handleOpenDashboard}
            disabled={actionLoading}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">View Stripe Dashboard</p>
                <p className="text-sm text-gray-500">Manage payouts & view transactions</p>
              </div>
            </div>
            <ExternalLink className="w-5 h-5 text-gray-400" />
          </button>

          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <BanknoteIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Automatic Payouts</p>
              <p className="text-sm text-blue-700">
                Earnings are automatically sent to your bank
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mt-4">
            <div className="flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default StripeConnectSetup;
