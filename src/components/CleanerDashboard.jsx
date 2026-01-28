import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  DollarSign,
  Calendar,
  Star,
  Briefcase,
  TrendingUp,
  Clock,
  CheckCircle,
  Search,
  Bell
} from 'lucide-react';
import { requestStorage, reviewStorage } from '../utils/storage';

const CleanerDashboard = ({ user, onNavigate }) => {
  const [stats, setStats] = useState({
    availableJobs: 0,
    myJobs: 0,
    completedThisMonth: 0,
    totalEarnings: user.totalEarnings || 0,
    monthlyEarnings: 0
  });
  const [recentReviews, setRecentReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user.id]);

  const loadData = async () => {
    try {
      // Get all requests
      const allRequests = await requestStorage.getAllRequests();

      // Count open requests (available jobs)
      const openRequests = allRequests.filter(r => r.status === 'open');

      // Get my accepted/in-progress jobs
      const myActiveJobs = allRequests.filter(
        r => r.acceptedBy === user.id && ['accepted', 'in_progress'].includes(r.status)
      );

      // Get completed jobs this month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const completedThisMonth = allRequests.filter(
        r => r.acceptedBy === user.id &&
          r.status === 'completed' &&
          new Date(r.completedAt) >= startOfMonth
      );

      // Calculate monthly earnings
      const monthlyEarnings = completedThisMonth.reduce(
        (sum, r) => sum + (r.cleanerPayout || 0), 0
      );

      setStats({
        availableJobs: openRequests.length,
        myJobs: myActiveJobs.length,
        completedThisMonth: completedThisMonth.length,
        totalEarnings: user.totalEarnings || 0,
        monthlyEarnings
      });

      // Get recent reviews
      const reviews = await reviewStorage.getReviewsForCleaner(user.id);
      setRecentReviews(reviews.slice(0, 3));
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const firstName = user.name.split(' ')[0];

  return (
    <div className="min-h-screen pb-24 animate-fade-in">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-800">
              Hey, {firstName}! 💪
            </h1>
            <p className="text-gray-500">Let's find you some jobs</p>
          </div>
          {user.isAvailable ? (
            <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Available
            </span>
          ) : (
            <span className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
              <span className="w-2 h-2 bg-gray-400 rounded-full" />
              Busy
            </span>
          )}
        </div>

        {/* Earnings Card */}
        <div className="bg-gradient-to-r from-primary-600 to-secondary-500 rounded-2xl p-6 text-white shadow-lg mb-6">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-white/70" />
            <span className="text-white/80 text-sm">Total Earnings</span>
          </div>
          <p className="text-4xl font-bold mb-4">${stats.totalEarnings.toFixed(2)}</p>
          <div className="flex items-center justify-between text-white/80 text-sm">
            <span>This month: ${stats.monthlyEarnings.toFixed(2)}</span>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              <span>{stats.completedThisMonth} jobs</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatCard
            icon={Search}
            label="Available"
            value={stats.availableJobs}
            color="yellow"
            badge={stats.availableJobs > 0}
          />
          <StatCard
            icon={Briefcase}
            label="My Jobs"
            value={stats.myJobs}
            color="blue"
          />
          <StatCard
            icon={CheckCircle}
            label="Done"
            value={stats.completedThisMonth}
            color="green"
          />
        </div>

        {/* Quick Actions */}
        <div className="space-y-3 mb-6">
          <button
            onClick={() => onNavigate('requests-feed')}
            className="w-full bg-white rounded-2xl p-5 shadow-soft hover:shadow-md transition-all flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Search className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="text-left flex-1">
              <h3 className="font-semibold text-gray-800">Browse Available Jobs</h3>
              <p className="text-gray-500 text-sm">Find and accept new cleaning requests</p>
            </div>
            {stats.availableJobs > 0 && (
              <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-bold animate-pulse-soft">
                {stats.availableJobs} new
              </span>
            )}
          </button>

          <button
            onClick={() => onNavigate('my-jobs')}
            className="w-full bg-white rounded-2xl p-5 shadow-soft hover:shadow-md transition-all flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-left flex-1">
              <h3 className="font-semibold text-gray-800">My Jobs</h3>
              <p className="text-gray-500 text-sm">Manage your accepted jobs</p>
            </div>
            {stats.myJobs > 0 && (
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
                {stats.myJobs} active
              </span>
            )}
          </button>
        </div>

        {/* Your Rating */}
        <div className="bg-white rounded-2xl p-5 shadow-soft mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Your Rating</h3>
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              <span className="font-bold text-gray-800">
                {user.rating ? user.rating.toFixed(1) : 'N/A'}
              </span>
              <span className="text-gray-500 text-sm">({user.reviewCount} reviews)</span>
            </div>
          </div>

          {recentReviews.length > 0 ? (
            <div className="space-y-3">
              {recentReviews.map((review) => (
                <div key={review.id} className="p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-1 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < review.rating
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-200'
                        }`}
                      />
                    ))}
                    <span className="text-xs text-gray-500 ml-2">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-gray-600">"{review.comment}"</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-4">
              Complete jobs to receive reviews
            </p>
          )}
        </div>

        {/* Your Services */}
        <div className="bg-white rounded-2xl p-5 shadow-soft">
          <h3 className="font-semibold text-gray-800 mb-3">Your Services</h3>
          <div className="flex flex-wrap gap-2">
            {user.services && user.services.map((service, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium"
              >
                {service}
              </span>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-gray-600">Hourly Rate</span>
            <span className="font-bold text-primary-600">${user.hourlyRate}/hr</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color, badge }) => {
  const colors = {
    yellow: 'bg-yellow-50 text-yellow-600',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-primary-50 text-primary-600'
  };

  const iconColors = {
    yellow: 'bg-yellow-100 text-yellow-600',
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-primary-100 text-primary-600'
  };

  return (
    <div className={`${colors[color]} rounded-xl p-4 text-center relative`}>
      {badge && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
      )}
      <div className={`w-10 h-10 ${iconColors[color]} rounded-lg flex items-center justify-center mx-auto mb-2`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs opacity-80">{label}</p>
    </div>
  );
};

export default CleanerDashboard;
