
import React, { useState, useEffect } from 'react';
import { User, CleaningRequest } from '../types';
import { storage } from '../utils/storage';
import { Button, Card, Badge } from './UI';
import CreateRequest from './CreateRequest';
import MyRequests from './MyRequests';
import ProfileView from './ProfileView';
<<<<<<< HEAD
import {
  Plus, Calendar, LogOut, User as UserIcon, LayoutDashboard, Sparkles,
  Clock, DollarSign, CheckCircle, Star, ArrowRight, Home, Bell,
  MapPin, Phone, Shield, TrendingUp, AlertCircle, RefreshCw
} from 'lucide-react';
=======
import { Plus, Calendar, LogOut, User as UserIcon, LayoutDashboard, Sparkles } from 'lucide-react';
>>>>>>> d06443da4cbdb3f847eedb509039380cf77654ed

interface Props {
  user: User;
  onLogout: () => void;
}

const HomeownerDashboard: React.FC<Props> = ({ user, onLogout }) => {
  const [view, setView] = useState<'overview' | 'create' | 'my_requests' | 'profile'>('overview');
<<<<<<< HEAD
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
=======
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0 });
  const [recentRequests, setRecentRequests] = useState<CleaningRequest[]>([]);

  const loadData = async () => {
    const keys = await storage.list('request:');
    let total = 0, active = 0, completed = 0;
    const items: CleaningRequest[] = [];
>>>>>>> d06443da4cbdb3f847eedb509039380cf77654ed

    for (const key of keys) {
      const req = await storage.get(key);
      if (req && req.homeownerId === user.id) {
        total++;
<<<<<<< HEAD
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
=======
        if (['open', 'accepted', 'in_progress'].includes(req.status)) active++;
        if (req.status === 'completed') completed++;
        items.push(req);
      }
    }
    setStats({ total, active, completed });
    setRecentRequests(items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3));
>>>>>>> d06443da4cbdb3f847eedb509039380cf77654ed
  };

  useEffect(() => {
    loadData();
<<<<<<< HEAD
    // Set up polling for real-time updates
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [view]);

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
            <Sparkles className="w-7 h-7 text-purple-600 animate-zoom-pulse" />
            <span className="text-xl font-bold font-outfit animate-shine">HollaClean</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button className="relative w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
              <Bell className="w-5 h-5 text-gray-600" />
              {stats.active > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-purple-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {stats.active}
                </span>
              )}
            </button>

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
              >
                <UserIcon className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={onLogout}
              className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-red-100 hover:text-red-500 transition-colors"
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

            {/* Active Request Alert */}
            {activeRequest && (
              <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-5 border-0">
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
=======
  }, [view]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-24 md:pb-0">
      {/* Top Nav */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-600" />
          <h1 className="text-xl font-bold font-outfit">HollaClean</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Homeowner</p>
            <p className="text-sm font-bold text-gray-800">Hey, {user.name.split(' ')[0]}! 👋</p>
          </div>
          <button 
            onClick={() => setView('profile')}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${view === 'profile' ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-600 hover:bg-purple-200'}`}
          >
            <UserIcon className="w-5 h-5" />
          </button>
          <button onClick={onLogout} className="text-gray-400 hover:text-red-500 transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-6 md:p-8 max-w-5xl mx-auto w-full">
        {view === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Requests', val: stats.total, color: 'bg-purple-600 text-white shadow-lg shadow-purple-100' },
                { label: 'Active', val: stats.active, color: 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' },
                { label: 'Completed', val: stats.completed, color: 'bg-slate-600 text-white shadow-lg shadow-slate-100' }
              ].map((s, i) => (
                <div key={i} className={`p-4 rounded-2xl ${s.color} text-center transition-all hover:scale-105`}>
                  <p className="text-2xl font-black">{s.val}</p>
                  <p className="text-[10px] uppercase font-black tracking-widest opacity-80">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Main Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={() => setView('create')}
                className="group relative overflow-hidden bg-gradient-to-br from-purple-600 to-pink-500 p-8 rounded-3xl text-white shadow-xl shadow-purple-200 text-left active:scale-[0.98] transition-transform"
              >
                <div className="relative z-10">
                  <Plus className="w-10 h-10 mb-4 bg-white/20 p-2 rounded-xl" />
                  <h3 className="text-2xl font-bold mb-1">Request Cleaning</h3>
                  <p className="text-white/80 text-sm">Post a new job and get matched with top local cleaners.</p>
                </div>
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
                  <Sparkles className="w-32 h-32" />
                </div>
              </button>

              <button 
                onClick={() => setView('my_requests')}
                className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-left hover:shadow-md transition-shadow active:scale-[0.98]"
              >
                <Calendar className="w-10 h-10 mb-4 text-purple-600 bg-purple-50 p-2 rounded-xl" />
                <h3 className="text-2xl font-bold mb-1">My Requests</h3>
                <p className="text-gray-500 text-sm">View and manage your active and past cleaning jobs.</p>
>>>>>>> d06443da4cbdb3f847eedb509039380cf77654ed
              </button>
            </div>

            {/* Recent Activity */}
<<<<<<< HEAD
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
=======
            <div className="space-y-4">
              <h3 className="text-lg font-bold">Recent Activity</h3>
              {recentRequests.length > 0 ? (
                <div className="space-y-3">
                  {recentRequests.map(req => (
                    <Card key={req.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                          <Sparkles className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">{req.serviceType}</p>
                          <p className="text-xs text-gray-500">{new Date(req.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <Badge status={req.status} />
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200">
                  <p className="text-gray-400">No recent requests.</p>
                </div>
              )}
            </div>
>>>>>>> d06443da4cbdb3f847eedb509039380cf77654ed
          </div>
        )}

        {view === 'create' && (
<<<<<<< HEAD
          <CreateRequest
            user={user}
            onSuccess={() => { loadData(); setView('my_requests'); }}
            onBack={() => setView('overview')}
=======
          <CreateRequest 
            user={user} 
            onSuccess={() => setView('my_requests')} 
            onBack={() => setView('overview')} 
>>>>>>> d06443da4cbdb3f847eedb509039380cf77654ed
          />
        )}

        {view === 'my_requests' && (
<<<<<<< HEAD
          <MyRequests
            homeownerId={user.id}
            onBack={() => setView('overview')}
=======
          <MyRequests 
            homeownerId={user.id} 
            onBack={() => setView('overview')} 
>>>>>>> d06443da4cbdb3f847eedb509039380cf77654ed
          />
        )}

        {view === 'profile' && (
          <ProfileView user={user} onBack={() => setView('overview')} onLogout={onLogout} />
        )}
      </main>

<<<<<<< HEAD
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
=======
      {/* Bottom Nav Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4 flex items-center justify-around z-40 safe-area-bottom">
        <button onClick={() => setView('overview')} className={`flex flex-col items-center gap-1 ${view === 'overview' ? 'text-purple-600' : 'text-gray-400'}`}>
          <LayoutDashboard className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase">Home</span>
        </button>
        <button onClick={() => setView('my_requests')} className={`flex flex-col items-center gap-1 ${view === 'my_requests' ? 'text-purple-600' : 'text-gray-400'}`}>
          <Calendar className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase">Requests</span>
        </button>
        <button onClick={() => setView('profile')} className={`flex flex-col items-center gap-1 ${view === 'profile' ? 'text-purple-600' : 'text-gray-400'}`}>
          <UserIcon className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase">Profile</span>
>>>>>>> d06443da4cbdb3f847eedb509039380cf77654ed
        </button>
      </nav>
    </div>
  );
};

export default HomeownerDashboard;
