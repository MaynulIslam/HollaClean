
import React, { useState, useEffect } from 'react';
import { User, CleaningRequest } from '../types';
import { storage } from '../utils/storage';
import { Button, Card, Badge } from './UI';
import RequestsFeed from './RequestsFeed';
import MyJobs from './MyJobs';
import ProfileView from './ProfileView';
import {
  Search, Briefcase, DollarSign, LogOut, User as UserIcon, LayoutDashboard,
  Sparkles, TrendingUp, Calendar, Star, Clock, MapPin, CheckCircle,
  Bell, Award, Target, Wallet, ArrowRight, RefreshCw, Zap
} from 'lucide-react';

interface Props {
  user: User;
  onLogout: () => void;
}

const CleanerDashboard: React.FC<Props> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'available' | 'my_jobs' | 'history' | 'profile'>('available');
  const [stats, setStats] = useState({
    available: 0,
    accepted: 0,
    completed: 0,
    monthly: 0,
    weeklyHours: 0
  });
  const [activeJob, setActiveJob] = useState<CleaningRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadStats = async () => {
    setIsLoading(true);
    const keys = await storage.list('request:');
    let avail = 0, acc = 0, completed = 0, mon = 0, weeklyHours = 0;
    let currentActiveJob: CleaningRequest | null = null;
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    for (const key of keys) {
      const req = await storage.get(key);
      if (req) {
        if (req.status === 'open') avail++;
        if (req.acceptedBy === user.id) {
          if (['accepted', 'in_progress'].includes(req.status)) {
            acc++;
            if (req.status === 'in_progress' && (!currentActiveJob || new Date(req.acceptedAt) > new Date(currentActiveJob.acceptedAt))) {
              currentActiveJob = req;
            }
          }
          if (req.status === 'completed') {
            completed++;
            const compDate = new Date(req.completedAt!);
            if (compDate.getMonth() === now.getMonth() && compDate.getFullYear() === now.getFullYear()) {
              mon += req.cleanerPayout;
            }
            if (compDate >= weekAgo) {
              weeklyHours += req.hours || 0;
            }
          }
        }
      }
    }
    setStats({ available: avail, accepted: acc, completed, monthly: mon, weeklyHours });
    setActiveJob(currentActiveJob);
    setIsLoading(false);
  };

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-pink-50/30 to-orange-50/30 flex flex-col pb-24 md:pb-0">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 md:px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-pink-600 animate-zoom-pulse" />
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold font-outfit animate-shine">HollaClean</span>
              <span className="text-xs font-bold text-pink-600 bg-pink-100 px-2 py-0.5 rounded-full">PRO</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Rating Badge */}
            <div className="hidden sm:flex items-center gap-1 bg-yellow-100 px-3 py-1.5 rounded-full">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="text-sm font-bold text-yellow-700">{user.rating?.toFixed(1) || '5.0'}</span>
              <span className="text-xs text-yellow-600">({user.reviewCount || 0})</span>
            </div>

            {/* Notifications */}
            <button className="relative w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
              <Bell className="w-5 h-5 text-gray-600" />
              {stats.available > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-600 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                  {stats.available}
                </span>
              )}
            </button>

            {/* User Menu */}
            <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-gray-200">
              <div className="text-right">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Professional</p>
                <p className="text-sm font-bold text-gray-800">{user.firstName || user.name.split(' ')[0]}</p>
              </div>
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  activeTab === 'profile'
                    ? 'bg-pink-600 text-white shadow-lg shadow-pink-200'
                    : 'bg-pink-100 text-pink-600 hover:bg-pink-200'
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
        {activeTab !== 'profile' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Welcome & Quick Stats Row */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold font-outfit text-gray-900">
                  {getGreeting()}, {user.firstName || user.name.split(' ')[0]}!
                </h1>
                <p className="text-gray-500 mt-1">
                  {stats.available > 0
                    ? `${stats.available} cleaning ${stats.available === 1 ? 'job' : 'jobs'} available near you`
                    : 'Check back soon for new cleaning opportunities'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="sm:hidden flex items-center gap-1 bg-yellow-100 px-3 py-1.5 rounded-full">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-bold text-yellow-700">{user.rating?.toFixed(1) || '5.0'}</span>
                </div>
                <div className={`px-3 py-1.5 rounded-full text-sm font-semibold ${user.isAvailable !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {user.isAvailable !== false ? 'Available' : 'Unavailable'}
                </div>
              </div>
            </div>

            {/* Active Job Alert */}
            {activeJob && (
              <Card className="bg-gradient-to-r from-pink-600 to-orange-500 text-white p-5 border-0">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                      <RefreshCw className="w-6 h-6 animate-spin" />
                    </div>
                    <div>
                      <p className="text-white/70 text-sm font-medium uppercase tracking-wider">Job In Progress</p>
                      <h3 className="text-xl font-bold mt-1">{activeJob.serviceType}</h3>
                      <div className="flex items-center gap-4 mt-2 text-white/80 text-sm">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {activeJob.address.split(',')[0]}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {activeJob.hours}h
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          ${activeJob.cleanerPayout}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('my_jobs')}
                    className="flex items-center gap-1 text-white/80 hover:text-white transition-colors text-sm font-semibold"
                  >
                    Manage Job
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            )}

            {/* Earnings & Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Total Earnings Card */}
              <Card className="md:col-span-2 bg-gradient-to-br from-pink-600 via-pink-600 to-orange-500 text-white p-6 border-0 relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                        <Wallet className="w-5 h-5" />
                      </div>
                      <span className="text-white/80 text-sm font-semibold uppercase tracking-wider">Total Earnings</span>
                    </div>
                    <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-xs font-bold">
                      <TrendingUp className="w-3 h-3" />
                      80% Payout
                    </div>
                  </div>
                  <p className="text-4xl md:text-5xl font-bold font-outfit mb-4">
                    ${user.totalEarnings?.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 px-4 py-2 rounded-xl">
                      <p className="text-white/70 text-xs uppercase tracking-wider">This Month</p>
                      <p className="text-xl font-bold">${stats.monthly.toFixed(2)}</p>
                    </div>
                    <div className="bg-white/20 px-4 py-2 rounded-xl">
                      <p className="text-white/70 text-xs uppercase tracking-wider">Hours (7 days)</p>
                      <p className="text-xl font-bold">{stats.weeklyHours}h</p>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-10 -right-10 opacity-10">
                  <DollarSign className="w-48 h-48" />
                </div>
              </Card>

              {/* Stats Column */}
              <div className="flex flex-col gap-4">
                <Card className="flex-1 bg-amber-500 text-white p-4 border-0 hover:scale-[1.02] transition-transform cursor-pointer" onClick={() => setActiveTab('available')}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                      <Zap className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold font-outfit">{stats.available}</p>
                      <p className="text-white/80 text-xs font-semibold uppercase tracking-wider">Available Jobs</p>
                    </div>
                  </div>
                </Card>

                <Card className="flex-1 bg-emerald-500 text-white p-4 border-0 hover:scale-[1.02] transition-transform cursor-pointer" onClick={() => setActiveTab('my_jobs')}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                      <Briefcase className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold font-outfit">{stats.accepted}</p>
                      <p className="text-white/80 text-xs font-semibold uppercase tracking-wider">Active Jobs</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 max-w-3xl mx-auto">
              <div className="flex">
                {[
                  { id: 'available', label: 'Find Jobs', icon: Search, count: stats.available },
                  { id: 'my_jobs', label: 'My Jobs', icon: Briefcase, count: stats.accepted },
                  { id: 'history', label: 'History', icon: Calendar, count: stats.completed }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all relative ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-pink-600 to-orange-500 text-white shadow-lg'
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    {tab.count > 0 && (
                      <span className={`ml-1 min-w-[20px] h-5 px-1.5 text-xs font-bold rounded-full flex items-center justify-center ${
                        activeTab === tab.id
                          ? 'bg-white text-pink-600'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="animate-in fade-in duration-300">
              {activeTab === 'available' && (
                <RequestsFeed cleaner={user} />
              )}

              {activeTab === 'my_jobs' && (
                <MyJobs cleanerId={user.id} type="active" />
              )}

              {activeTab === 'history' && (
                <MyJobs cleanerId={user.id} type="history" />
              )}
            </div>

            {/* Tips Card */}
            {activeTab === 'available' && stats.available === 0 && (
              <Card className="p-6 bg-gradient-to-br from-pink-50 to-orange-50 border-pink-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center flex-shrink-0">
                    <Award className="w-6 h-6 text-pink-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Tips to Get More Jobs</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Keep your profile complete and up-to-date
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Respond quickly to new job opportunities
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Maintain a high rating with quality service
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Check back frequently for new listings
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <ProfileView user={user} onBack={() => setActiveTab('available')} onLogout={onLogout} />
        )}
      </main>

      {/* Bottom Navigation - Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-100 px-6 py-3 flex items-center justify-around z-40 safe-area-bottom">
        <button
          onClick={() => setActiveTab('available')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'available' ? 'text-pink-600' : 'text-gray-400'}`}
        >
          <div className="relative">
            <Search className="w-6 h-6" />
            {stats.available > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-pink-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {stats.available}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wide">Jobs</span>
        </button>

        <button
          onClick={() => setActiveTab('my_jobs')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'my_jobs' ? 'text-pink-600' : 'text-gray-400'}`}
        >
          <div className="relative">
            <Briefcase className="w-6 h-6" />
            {stats.accepted > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {stats.accepted}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wide">My Jobs</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'history' ? 'text-pink-600' : 'text-gray-400'}`}
        >
          <Calendar className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-wide">History</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'profile' ? 'text-pink-600' : 'text-gray-400'}`}
        >
          <UserIcon className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-wide">Profile</span>
        </button>
      </nav>
    </div>
  );
};

export default CleanerDashboard;
