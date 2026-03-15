
import React, { useState, useEffect } from 'react';
import { User, CleaningRequest } from '../types';
import { storage } from '../utils/storage';
import { Button, Card, Badge } from './UI';
import CreateRequest from './CreateRequest';
import MyRequests from './MyRequests';
import ProfileView from './ProfileView';
import NotificationCenter from './NotificationCenter';
import { CONFIG } from '../utils/config';
import { Notification } from '../utils/notifications';
import {
  Plus, Calendar, LogOut, User as UserIcon, LayoutDashboard, Sparkles,
  Clock, DollarSign, CheckCircle, Star, ArrowRight, Home,
  MapPin, Phone, Shield, TrendingUp, AlertCircle, RefreshCw
} from 'lucide-react';

interface Props {
  user: User;
  onLogout: () => void;
  onUserUpdate?: (user: User) => void;
}

const HomeownerDashboard: React.FC<Props> = ({ user, onLogout, onUserUpdate }) => {
  const [view, setView] = useState<'overview' | 'create' | 'my_requests' | 'profile'>('overview');
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0, totalSpent: 0 });
  const [recentRequests, setRecentRequests] = useState<CleaningRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeRequest, setActiveRequest] = useState<CleaningRequest | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    const keys = await storage.list('request:');
    let total = 0, active = 0, completed = 0, totalSpent = 0;
    const items: CleaningRequest[] = [];
    let currentActive: CleaningRequest | null = null;

    for (const key of keys) {
      const req = await storage.get(key);
      if (req && req.homeownerId === user.id) {
        total++;
        if (['open', 'accepted', 'in_progress'].includes(req.status)) {
          active++;
          if (!currentActive || new Date(req.createdAt) > new Date(currentActive.createdAt)) {
            currentActive = req;
          }
        }
        if (req.status === 'completed') {
          completed++;
          totalSpent += req.totalAmount || 0;
        }
        items.push(req);
      }
    }
    setStats({ total, active, completed, totalSpent });
    setActiveRequest(currentActive);
    setRecentRequests(items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5));
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
    // Set up polling for real-time updates
    const interval = setInterval(loadData, CONFIG.polling.dashboardStats);
    return () => clearInterval(interval);
  }, [view]);

  const handleNotificationClick = (notification: Notification) => {
    // Navigate to My Requests when clicking payment or job-related notifications
    if (notification.link === '/my-requests') {
      setView('my_requests');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, { bg: string; text: string; icon: string }> = {
      open: { bg: 'bg-green-100', text: 'text-green-700', icon: 'text-green-500' },
      accepted: { bg: 'bg-blue-100', text: 'text-blue-700', icon: 'text-blue-500' },
      in_progress: { bg: 'bg-purple-100', text: 'text-purple-700', icon: 'text-purple-500' },
      completed: { bg: 'bg-gray-100', text: 'text-gray-700', icon: 'text-gray-500' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-700', icon: 'text-red-500' }
    };
    return colors[status] || colors.open;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30 flex flex-col pb-24 md:pb-0">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 md:px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/Holla Clean Logo.png" alt="HollaClean" className="h-14 w-auto mix-blend-multiply" />
          </div>

          <div className="flex items-center gap-3">
            {/* Home Button - Only show when not on overview */}
            {view !== 'overview' && (
              <button
                onClick={() => setView('overview')}
                className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 hover:bg-purple-200 transition-colors"
                title="Go to Dashboard"
              >
                <Home className="w-5 h-5" />
              </button>
            )}

            {/* Notifications */}
            <NotificationCenter userId={user.id} onNotificationClick={handleNotificationClick} />

            {/* User Menu */}
            <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-gray-200">
              <div className="text-right">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Homeowner</p>
                <p className="text-sm font-bold text-gray-800">{user.firstName || user.name.split(' ')[0]}</p>
              </div>
              <button
                onClick={() => setView('profile')}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  view === 'profile'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
                    : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                }`}
                title="View Profile"
              >
                <UserIcon className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={onLogout}
              className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-red-100 hover:text-red-500 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full">
        {view === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold font-outfit text-gray-900">
                  {getGreeting()}, {user.firstName || user.name.split(' ')[0]}!
                </h1>
                <p className="text-gray-500 mt-1">Manage your home cleaning services in one place.</p>
              </div>
              <Button onClick={() => setView('create')} className="flex-shrink-0">
                <Plus className="w-5 h-5" />
                Book a Cleaning
              </Button>
            </div>

            {/* Profile Incomplete Banner */}
            {(!user.phone || !user.address) && (
              <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <UserIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-sm">Complete Your Profile</h3>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Add your {[!user.phone && 'phone number', !user.address && 'address'].filter(Boolean).join(' and ')} so cleaners can find and contact you.
                    </p>
                  </div>
                  <button
                    onClick={() => setView('profile')}
                    className="px-4 py-2 bg-blue-500 text-white text-xs font-bold rounded-lg hover:bg-blue-600 transition-colors flex-shrink-0"
                  >
                    Update Profile
                  </button>
                </div>
              </Card>
            )}

            {/* Verification Reminder Banner */}
            {user.phone && user.address && (!user.emailVerified || !user.phoneVerified || !user.addressVerified) && (
              <Card className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-sm">Complete Your Verification</h3>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Verify your {[!user.emailVerified && 'email', !user.phoneVerified && 'phone', !user.addressVerified && 'address'].filter(Boolean).join(', ')} to build trust and unlock all features.
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-1">
                        {[user.emailVerified, user.phoneVerified, user.addressVerified].map((v, i) => (
                          <div key={i} className={`w-2 h-2 rounded-full ${v ? 'bg-green-500' : 'bg-gray-300'}`} />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">{[user.emailVerified, user.phoneVerified, user.addressVerified].filter(Boolean).length}/3 verified</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setView('profile')}
                    className="px-4 py-2 bg-amber-500 text-white text-xs font-bold rounded-lg hover:bg-amber-600 transition-colors flex-shrink-0"
                  >
                    Verify Now
                  </button>
                </div>
              </Card>
            )}

            {/* Active Request Alert */}
            {activeRequest && (
              <Card className={`${activeRequest.status === 'in_progress' && (activeRequest.paymentStatus === 'paid' || activeRequest.paymentStatus === 'held') ? 'bg-gradient-to-r from-emerald-600 to-teal-600' : 'bg-gradient-to-r from-purple-600 to-pink-600'} text-white p-5 border-0`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                      {activeRequest.status === 'in_progress' ? (
                        <RefreshCw className="w-6 h-6 animate-spin" />
                      ) : activeRequest.status === 'accepted' ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        <Clock className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <p className="text-white/70 text-sm font-medium uppercase tracking-wider">
                        {activeRequest.status === 'in_progress'
                          ? 'Cleaning In Progress'
                          : activeRequest.status === 'accepted'
                          ? 'Cleaner Confirmed'
                          : 'Awaiting Cleaner'}
                      </p>
                      <h3 className="text-xl font-bold mt-1">{activeRequest.serviceType}</h3>
                      <div className="flex items-center gap-4 mt-2 text-white/80 text-sm">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(activeRequest.date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {activeRequest.time}
                        </span>
                        {activeRequest.cleanerName && (
                          <span className="flex items-center gap-1">
                            <UserIcon className="w-4 h-4" />
                            {activeRequest.cleanerName}
                          </span>
                        )}
                      </div>
                      {activeRequest.status === 'in_progress' && (activeRequest.paymentStatus === 'paid' || activeRequest.paymentStatus === 'held') && (
                        <p className="text-white/90 text-sm mt-2 font-semibold">
                          ${(Number(activeRequest.totalAmount) || 0).toFixed(2)} paid — cleaning in progress.
                        </p>
                      )}
                      {activeRequest.status === 'open' && activeRequest.paymentStatus === 'paid' && (
                        <p className="text-white/90 text-sm mt-2 font-semibold">
                          Payment complete — a cleaner will call you before arriving.
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setView('my_requests')}
                    className="flex items-center gap-1 text-white/80 hover:text-white transition-colors text-sm font-semibold"
                  >
                    View Details
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 bg-white hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Bookings</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-white hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Active</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-white hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Completed</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-white hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">${stats.totalSpent}</p>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Spent</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setView('create')}
                className="group relative overflow-hidden bg-gradient-to-br from-purple-600 via-purple-600 to-pink-500 p-6 md:p-8 rounded-2xl text-white shadow-xl shadow-purple-200/50 text-left active:scale-[0.98] transition-transform"
              >
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
                    <Plus className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-bold font-outfit mb-2">Request a Cleaning</h3>
                  <p className="text-white/80 text-sm leading-relaxed">
                    Post a new cleaning job and get matched with verified local professionals.
                  </p>
                  <div className="flex items-center gap-2 mt-4 text-white/90 text-sm font-semibold">
                    Get Started <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
                <div className="absolute -bottom-8 -right-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Sparkles className="w-48 h-48" />
                </div>
              </button>

              <button
                onClick={() => setView('my_requests')}
                className="group bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm text-left hover:shadow-lg hover:border-purple-200 transition-all active:scale-[0.98]"
              >
                <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                  <Calendar className="w-7 h-7 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold font-outfit text-gray-900 mb-2">My Requests</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  View and manage all your active and past cleaning requests.
                </p>
                <div className="flex items-center gap-2 mt-4 text-purple-600 text-sm font-semibold">
                  View All <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>

            {/* Recent Activity */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold font-outfit text-gray-900">Recent Activity</h2>
                {recentRequests.length > 0 && (
                  <button
                    onClick={() => setView('my_requests')}
                    className="text-sm text-purple-600 font-semibold hover:underline flex items-center gap-1"
                  >
                    View All <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Card key={i} className="p-4 animate-pulse">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gray-200"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                          <div className="h-3 bg-gray-100 rounded w-1/4"></div>
                        </div>
                        <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : recentRequests.length > 0 ? (
                <div className="space-y-3">
                  {recentRequests.map(req => {
                    const statusColors = getStatusColor(req.status);
                    return (
                      <Card
                        key={req.id}
                        className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setView('my_requests')}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl ${statusColors.bg} flex items-center justify-center`}>
                              <Sparkles className={`w-6 h-6 ${statusColors.icon}`} />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{req.serviceType}</p>
                              <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(req.date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {req.time}
                                </span>
                                <span className="flex items-center gap-1">
                                  <DollarSign className="w-3 h-3" />
                                  ${req.totalAmount}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge status={req.status} />
                            <ArrowRight className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card className="p-8 text-center border-dashed border-2 border-gray-200 bg-gray-50/50">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">No cleaning requests yet</h3>
                  <p className="text-gray-500 text-sm mb-4">Book your first cleaning and experience the HollaClean difference.</p>
                  <Button onClick={() => setView('create')} variant="secondary">
                    <Plus className="w-4 h-4" />
                    Book Your First Cleaning
                  </Button>
                </Card>
              )}
            </div>

            {/* Trust Section */}
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Your Trust & Safety</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    All cleaners on HollaClean are verified and reviewed. Enjoy secure payments, transparent pricing, and our satisfaction guarantee.
                  </p>
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Verified Cleaners
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Secure Payments
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      No Hidden Fees
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {view === 'create' && (
          <CreateRequest
            user={user}
            onSuccess={() => { loadData(); setView('my_requests'); }}
            onBack={() => setView('overview')}
          />
        )}

        {view === 'my_requests' && (
          <MyRequests
            homeownerId={user.id}
            onBack={() => setView('overview')}
          />
        )}

        {view === 'profile' && (
          <ProfileView user={user} onBack={() => setView('overview')} onLogout={onLogout} onUserUpdate={onUserUpdate} />
        )}
      </main>

      {/* Bottom Navigation - Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-100 px-6 py-3 flex items-center justify-around z-40 safe-area-bottom">
        <button
          onClick={() => setView('overview')}
          className={`flex flex-col items-center gap-1 transition-colors ${view === 'overview' ? 'text-purple-600' : 'text-gray-400'}`}
        >
          <LayoutDashboard className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-wide">Home</span>
        </button>
        <button
          onClick={() => setView('create')}
          className="relative -mt-6 w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-300"
        >
          <Plus className="w-7 h-7" />
        </button>
        <button
          onClick={() => setView('my_requests')}
          className={`flex flex-col items-center gap-1 transition-colors ${view === 'my_requests' ? 'text-purple-600' : 'text-gray-400'}`}
        >
          <Calendar className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-wide">Requests</span>
        </button>
      </nav>
    </div>
  );
};

export default HomeownerDashboard;
