import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { requestStorage } from '../utils/storage';

const HomeownerDashboard = ({ user, onNavigate }) => {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0
  });
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user.id]);

  const loadData = async () => {
    try {
      const requests = await requestStorage.getRequestsByHomeowner(user.id);

      setStats({
        total: requests.length,
        active: requests.filter(r => ['open', 'accepted', 'in_progress'].includes(r.status)).length,
        completed: requests.filter(r => r.status === 'completed').length
      });

      setRecentRequests(requests.slice(0, 3));
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'open':
        return { label: 'Waiting for Cleaner', color: 'bg-yellow-100 text-yellow-700', icon: Clock };
      case 'accepted':
        return { label: 'Cleaner Assigned', color: 'bg-blue-100 text-blue-700', icon: CheckCircle };
      case 'in_progress':
        return { label: 'In Progress', color: 'bg-purple-100 text-purple-700', icon: Sparkles };
      case 'completed':
        return { label: 'Completed', color: 'bg-green-100 text-green-700', icon: CheckCircle };
      case 'cancelled':
        return { label: 'Cancelled', color: 'bg-gray-100 text-gray-700', icon: AlertCircle };
      default:
        return { label: status, color: 'bg-gray-100 text-gray-700', icon: Clock };
    }
  };

  const firstName = user.name.split(' ')[0];

  return (
    <div className="min-h-screen pb-24 animate-fade-in">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-gray-800">
            Hey, {firstName}! 👋
          </h1>
          <p className="text-gray-500">Ready for a sparkling clean home?</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatCard label="Total Requests" value={stats.total} color="purple" />
          <StatCard label="Active" value={stats.active} color="blue" />
          <StatCard label="Completed" value={stats.completed} color="green" />
        </div>

        {/* Quick Actions */}
        <div className="space-y-4 mb-8">
          {/* Primary Action - Request Cleaning */}
          <button
            onClick={() => onNavigate('create-request')}
            className="w-full bg-gradient-to-r from-primary-600 to-secondary-500 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <Plus className="w-8 h-8" />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-semibold text-lg">Request Cleaning</h3>
                <p className="text-white/80 text-sm">Post a job for cleaners to accept</p>
              </div>
              <ArrowRight className="w-6 h-6 text-white/70" />
            </div>
          </button>

          {/* Secondary Action - My Requests */}
          <button
            onClick={() => onNavigate('my-requests')}
            className="w-full bg-white rounded-2xl p-5 shadow-soft hover:shadow-md transition-all flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary-600" />
            </div>
            <div className="text-left flex-1">
              <h3 className="font-semibold text-gray-800">My Requests</h3>
              <p className="text-gray-500 text-sm">View and manage your requests</p>
            </div>
            <div className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
              {stats.active} active
            </div>
          </button>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Recent Activity</h3>
            {recentRequests.length > 0 && (
              <button
                onClick={() => onNavigate('my-requests')}
                className="text-sm text-primary-600 hover:underline"
              >
                View All
              </button>
            )}
          </div>

          {loading ? (
            <div className="bg-white rounded-xl p-8 text-center">
              <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
            </div>
          ) : recentRequests.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center shadow-soft">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <h4 className="font-medium text-gray-800 mb-1">No Requests Yet</h4>
              <p className="text-gray-500 text-sm mb-4">Create your first cleaning request</p>
              <button
                onClick={() => onNavigate('create-request')}
                className="px-6 py-2 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
              >
                Get Started
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentRequests.map((request) => {
                const statusInfo = getStatusInfo(request.status);
                const StatusIcon = statusInfo.icon;

                return (
                  <div
                    key={request.id}
                    onClick={() => onNavigate('my-requests')}
                    className="bg-white rounded-xl p-4 shadow-soft hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-gray-800">{request.serviceType}</h4>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(request.date).toLocaleDateString('en-CA', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })} at {request.time}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusInfo.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusInfo.label}
                      </span>
                    </div>
                    {request.status === 'accepted' && request.cleanerName && (
                      <div className="mt-2 pt-2 border-t border-gray-100 text-sm">
                        <span className="text-gray-500">Cleaner: </span>
                        <span className="text-gray-800 font-medium">{request.cleanerName}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, color }) => {
  const colors = {
    purple: 'bg-primary-50 text-primary-700',
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700'
  };

  return (
    <div className={`${colors[color]} rounded-xl p-4 text-center`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs opacity-80">{label}</p>
    </div>
  );
};

export default HomeownerDashboard;
