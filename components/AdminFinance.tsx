
import React, { useState, useEffect } from 'react';
import { getAdminEarnings, getAdminBalance, AdminEarnings } from '../utils/paymentApi';
import { Card, Button, Badge } from './UI';
import {
  DollarSign, TrendingUp, Users, CreditCard, RefreshCw, Loader2,
  ArrowUpRight, ArrowDownRight, Calendar, Clock, CheckCircle,
  AlertCircle, Wallet, PieChart, BarChart3, Download, ExternalLink,
  Sparkles, BanknoteIcon
} from 'lucide-react';

interface AdminFinanceProps {
  onBack?: () => void;
}

const AdminFinance: React.FC<AdminFinanceProps> = ({ onBack }) => {
  const [earnings, setEarnings] = useState<AdminEarnings | null>(null);
  const [balance, setBalance] = useState<{ available: number; pending: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [earningsData, balanceData] = await Promise.all([
        getAdminEarnings(),
        getAdminBalance()
      ]);

      setEarnings(earningsData);
      setBalance(balanceData);
    } catch (err: any) {
      console.error('Failed to load finance data:', err);
      // Demo mode fallback
      setEarnings({
        summary: {
          totalRevenue: '1250.00',
          platformEarnings: '250.00',
          cleanerPayouts: '1000.00',
          totalTransactions: 12
        },
        recentTransactions: [
          {
            id: 'demo1',
            requestId: 'req1',
            amount: 140,
            platformFee: 28,
            cleanerPayout: 112,
            status: 'succeeded',
            completedAt: new Date().toISOString()
          },
          {
            id: 'demo2',
            requestId: 'req2',
            amount: 105,
            platformFee: 21,
            cleanerPayout: 84,
            status: 'succeeded',
            completedAt: new Date(Date.now() - 86400000).toISOString()
          }
        ]
      });
      setBalance({ available: 250, pending: 45 });
    } finally {
      setLoading(false);
    }
  };

  const openStripeDashboard = () => {
    window.open('https://dashboard.stripe.com', '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          <p className="text-gray-600">Loading financial data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold font-outfit text-gray-900">
            Platform Finances
          </h2>
          <p className="text-gray-500 mt-1">Track revenue, payouts, and platform earnings</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <Button onClick={openStripeDashboard} variant="secondary">
            <ExternalLink className="w-4 h-4" />
            Stripe Dashboard
          </Button>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-purple-600 to-pink-600 text-white">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6" />
              </div>
              <Badge className="bg-white/20 text-white border-0">Available</Badge>
            </div>
            <p className="text-purple-100 text-sm mb-1">Available for Payout</p>
            <p className="text-3xl font-bold">${balance?.available.toFixed(2) || '0.00'}</p>
            <p className="text-purple-200 text-sm mt-2">
              Ready to transfer to your bank
            </p>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <Badge className="bg-white/20 text-white border-0">Pending</Badge>
            </div>
            <p className="text-blue-100 text-sm mb-1">Pending Balance</p>
            <p className="text-3xl font-bold">${balance?.pending.toFixed(2) || '0.00'}</p>
            <p className="text-blue-200 text-sm mt-2">
              Processing, available soon
            </p>
          </div>
        </Card>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Revenue</p>
              <p className="text-xl font-bold text-gray-900">
                ${earnings?.summary.totalRevenue || '0'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Platform Fee</p>
              <p className="text-xl font-bold text-purple-600">
                ${earnings?.summary.platformEarnings || '0'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Cleaner Pay</p>
              <p className="text-xl font-bold text-gray-900">
                ${earnings?.summary.cleanerPayouts || '0'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Transactions</p>
              <p className="text-xl font-bold text-gray-900">
                {earnings?.summary.totalTransactions || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Fee Breakdown Visual */}
      <Card>
        <div className="p-6">
          <h3 className="font-bold font-outfit text-gray-900 mb-4">Revenue Split</h3>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <div className="h-8 rounded-full overflow-hidden flex">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-full"
                  style={{ width: '20%' }}
                />
                <div
                  className="bg-gradient-to-r from-blue-400 to-cyan-500 h-full"
                  style={{ width: '80%' }}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
              <span className="text-gray-600">Platform Fee (20%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-cyan-500" />
              <span className="text-gray-600">Cleaner Payout (80%)</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="font-bold font-outfit text-gray-900">Recent Transactions</h3>
            <Button variant="secondary" className="text-sm" onClick={openStripeDashboard}>
              View All
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="divide-y divide-gray-50">
          {earnings?.recentTransactions && earnings.recentTransactions.length > 0 ? (
            earnings.recentTransactions.map((tx) => (
              <div key={tx.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      tx.status === 'succeeded' ? 'bg-green-100' : 'bg-yellow-100'
                    }`}>
                      {tx.status === 'succeeded' ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-yellow-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        ${tx.amount.toFixed(2)} payment
                      </p>
                      <p className="text-sm text-gray-500">
                        {tx.completedAt
                          ? new Date(tx.completedAt).toLocaleDateString('en-CA', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'Processing'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-purple-600">
                      +${tx.platformFee.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">Platform fee</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">No transactions yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Transactions will appear here when payments are processed
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Quick Actions */}
      <Card>
        <div className="p-6">
          <h3 className="font-bold font-outfit text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={openStripeDashboard}
              className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <BanknoteIcon className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Request Payout</p>
                <p className="text-sm text-gray-500">Transfer to bank</p>
              </div>
            </button>

            <button
              onClick={openStripeDashboard}
              className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">View Reports</p>
                <p className="text-sm text-gray-500">Detailed analytics</p>
              </div>
            </button>

            <button
              onClick={openStripeDashboard}
              className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Download className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Export Data</p>
                <p className="text-sm text-gray-500">Download CSV</p>
              </div>
            </button>
          </div>
        </div>
      </Card>

      {/* Info Banner */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
            <Sparkles className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-1">How Platform Fees Work</h4>
            <p className="text-sm text-gray-600 mb-3">
              HollaClean automatically collects a 20% platform fee from each transaction.
              This fee covers payment processing, customer support, and platform maintenance.
              Cleaners receive the remaining 80% directly to their connected bank accounts.
            </p>
            <Button variant="secondary" className="text-sm" onClick={openStripeDashboard}>
              Manage in Stripe
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminFinance;
