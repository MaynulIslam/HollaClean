import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  DollarSign,
  Users,
  Calendar,
  TrendingUp,
  Star,
  LogOut,
  RefreshCw,
  Search,
  Filter,
  ChevronDown,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Home,
  Briefcase
} from 'lucide-react';
import { storage, userStorage, requestStorage, reviewStorage } from '../utils/storage';

const AdminDashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    platformCommission: 0,
    totalRequests: 0,
    completedRequests: 0,
    activeCleaners: 0,
    activeHomeowners: 0
  });
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState({ cleaners: [], homeowners: [] });
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load all users
      const allUsers = await userStorage.getAllUsers();
      const cleaners = allUsers.filter(u => u.type === 'cleaner');
      const homeowners = allUsers.filter(u => u.type === 'homeowner');

      // Load all requests
      const allRequests = await requestStorage.getAllRequests();

      // Calculate stats
      const completedRequests = allRequests.filter(r => r.status === 'completed');
      const totalRevenue = completedRequests.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
      const platformCommission = completedRequests.reduce((sum, r) => sum + (r.platformCommission || 0), 0);

      setStats({
        totalRevenue,
        platformCommission,
        totalRequests: allRequests.length,
        completedRequests: completedRequests.length,
        activeCleaners: cleaners.length,
        activeHomeowners: homeowners.length
      });

      setRequests(allRequests);
      setUsers({ cleaners, homeowners });
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearData = async () => {
    if (confirm('Are you sure you want to clear ALL data? This cannot be undone!')) {
      if (confirm('This will delete all users, requests, and reviews. Are you really sure?')) {
        await storage.clear();
        alert('All data cleared. Refreshing...');
        window.location.reload();
      }
    }
  };

  const filteredRequests = requests.filter(r => {
    if (statusFilter === 'all') return true;
    return r.status === statusFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-yellow-100 text-yellow-700';
      case 'accepted': return 'bg-blue-100 text-blue-700';
      case 'in_progress': return 'bg-purple-100 text-purple-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-gray-100 text-gray-500';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-primary-600" />
            <div>
              <h1 className="text-xl font-display font-bold text-gray-800">Admin Dashboard</h1>
              <p className="text-sm text-gray-500">HollaClean Management</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-5 h-5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-1 -mb-px">
            {['overview', 'requests', 'users', 'revenue'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-fade-in">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard
                    icon={DollarSign}
                    label="Total Revenue"
                    value={`$${stats.totalRevenue.toFixed(2)}`}
                    color="green"
                  />
                  <StatCard
                    icon={TrendingUp}
                    label="Platform Commission (20%)"
                    value={`$${stats.platformCommission.toFixed(2)}`}
                    color="purple"
                  />
                  <StatCard
                    icon={Calendar}
                    label="Total Requests"
                    value={stats.totalRequests}
                    color="blue"
                  />
                  <StatCard
                    icon={CheckCircle}
                    label="Completed"
                    value={stats.completedRequests}
                    color="emerald"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <StatCard
                    icon={Briefcase}
                    label="Active Cleaners"
                    value={stats.activeCleaners}
                    color="secondary"
                  />
                  <StatCard
                    icon={Home}
                    label="Active Homeowners"
                    value={stats.activeHomeowners}
                    color="primary"
                  />
                </div>

                {/* Recent Requests */}
                <div className="bg-white rounded-xl shadow-soft p-6">
                  <h3 className="font-semibold text-gray-800 mb-4">Recent Requests</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500 border-b">
                          <th className="pb-3 font-medium">Service</th>
                          <th className="pb-3 font-medium">Customer</th>
                          <th className="pb-3 font-medium">Cleaner</th>
                          <th className="pb-3 font-medium">Status</th>
                          <th className="pb-3 font-medium text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {requests.slice(0, 5).map(request => (
                          <tr key={request.id} className="border-b border-gray-50">
                            <td className="py-3 font-medium text-gray-800">{request.serviceType}</td>
                            <td className="py-3 text-gray-600">{request.homeownerName}</td>
                            <td className="py-3 text-gray-600">{request.cleanerName || '-'}</td>
                            <td className="py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                                {request.status}
                              </span>
                            </td>
                            <td className="py-3 text-right font-medium">
                              ${request.totalAmount?.toFixed(2) || '0.00'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Top Cleaners */}
                <div className="bg-white rounded-xl shadow-soft p-6">
                  <h3 className="font-semibold text-gray-800 mb-4">Top Cleaners</h3>
                  <div className="space-y-3">
                    {users.cleaners
                      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
                      .slice(0, 5)
                      .map((cleaner, i) => (
                        <div key={cleaner.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <span className="w-8 h-8 flex items-center justify-center bg-primary-100 text-primary-700 rounded-full font-bold text-sm">
                            {i + 1}
                          </span>
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">{cleaner.name}</p>
                            <p className="text-sm text-gray-500">{cleaner.email}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span className="font-medium">{cleaner.rating?.toFixed(1) || 'N/A'}</span>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-green-600">${cleaner.totalEarnings?.toFixed(0) || 0}</p>
                            <p className="text-xs text-gray-500">earned</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* Requests Tab */}
            {activeTab === 'requests' && (
              <div className="space-y-4 animate-fade-in">
                {/* Filters */}
                <div className="bg-white rounded-xl shadow-soft p-4 flex flex-wrap gap-3">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:border-primary-400 outline-none"
                  >
                    <option value="all">All Status</option>
                    <option value="open">Open</option>
                    <option value="accepted">Accepted</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <span className="text-sm text-gray-500 self-center">
                    {filteredRequests.length} requests
                  </span>
                </div>

                {/* Requests Table */}
                <div className="bg-white rounded-xl shadow-soft overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr className="text-left text-gray-500">
                          <th className="px-4 py-3 font-medium">ID</th>
                          <th className="px-4 py-3 font-medium">Service</th>
                          <th className="px-4 py-3 font-medium">Customer</th>
                          <th className="px-4 py-3 font-medium">Cleaner</th>
                          <th className="px-4 py-3 font-medium">Date</th>
                          <th className="px-4 py-3 font-medium">Status</th>
                          <th className="px-4 py-3 font-medium text-right">Amount</th>
                          <th className="px-4 py-3 font-medium text-right">Commission</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRequests.map(request => (
                          <tr key={request.id} className="border-t border-gray-100 hover:bg-gray-50">
                            <td className="px-4 py-3 font-mono text-xs text-gray-500">
                              {request.id.slice(-8)}
                            </td>
                            <td className="px-4 py-3 font-medium text-gray-800">{request.serviceType}</td>
                            <td className="px-4 py-3 text-gray-600">{request.homeownerName}</td>
                            <td className="px-4 py-3 text-gray-600">{request.cleanerName || '-'}</td>
                            <td className="px-4 py-3 text-gray-600">
                              {new Date(request.date).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                                {request.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-medium">
                              ${request.totalAmount?.toFixed(2) || '0.00'}
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-green-600">
                              ${request.platformCommission?.toFixed(2) || '0.00'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="space-y-6 animate-fade-in">
                {/* Cleaners */}
                <div className="bg-white rounded-xl shadow-soft overflow-hidden">
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800">Cleaners ({users.cleaners.length})</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr className="text-left text-gray-500">
                          <th className="px-4 py-3 font-medium">Name</th>
                          <th className="px-4 py-3 font-medium">Email</th>
                          <th className="px-4 py-3 font-medium">Phone</th>
                          <th className="px-4 py-3 font-medium">Rate</th>
                          <th className="px-4 py-3 font-medium">Rating</th>
                          <th className="px-4 py-3 font-medium text-right">Earnings</th>
                          <th className="px-4 py-3 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.cleaners.map(cleaner => (
                          <tr key={cleaner.id} className="border-t border-gray-100 hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-800">{cleaner.name}</td>
                            <td className="px-4 py-3 text-gray-600">{cleaner.email}</td>
                            <td className="px-4 py-3 text-gray-600">{cleaner.phone}</td>
                            <td className="px-4 py-3 text-gray-600">${cleaner.hourlyRate}/hr</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                <span>{cleaner.rating?.toFixed(1) || 'N/A'}</span>
                                <span className="text-gray-400">({cleaner.reviewCount || 0})</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-green-600">
                              ${cleaner.totalEarnings?.toFixed(2) || '0.00'}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                cleaner.isAvailable
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-500'
                              }`}>
                                {cleaner.isAvailable ? 'Available' : 'Busy'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Homeowners */}
                <div className="bg-white rounded-xl shadow-soft overflow-hidden">
                  <div className="p-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-800">Homeowners ({users.homeowners.length})</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr className="text-left text-gray-500">
                          <th className="px-4 py-3 font-medium">Name</th>
                          <th className="px-4 py-3 font-medium">Email</th>
                          <th className="px-4 py-3 font-medium">Phone</th>
                          <th className="px-4 py-3 font-medium">Address</th>
                          <th className="px-4 py-3 font-medium">Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.homeowners.map(homeowner => (
                          <tr key={homeowner.id} className="border-t border-gray-100 hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-800">{homeowner.name}</td>
                            <td className="px-4 py-3 text-gray-600">{homeowner.email}</td>
                            <td className="px-4 py-3 text-gray-600">{homeowner.phone}</td>
                            <td className="px-4 py-3 text-gray-600 truncate max-w-xs">{homeowner.address}</td>
                            <td className="px-4 py-3 text-gray-600">
                              {new Date(homeowner.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Revenue Tab */}
            {activeTab === 'revenue' && (
              <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl shadow-soft p-6">
                    <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
                    <p className="text-3xl font-bold text-gray-800">${stats.totalRevenue.toFixed(2)}</p>
                    <p className="text-sm text-gray-400 mt-2">From {stats.completedRequests} completed jobs</p>
                  </div>
                  <div className="bg-white rounded-xl shadow-soft p-6">
                    <p className="text-sm text-gray-500 mb-1">Platform Commission (20%)</p>
                    <p className="text-3xl font-bold text-green-600">${stats.platformCommission.toFixed(2)}</p>
                    <p className="text-sm text-gray-400 mt-2">Your earnings</p>
                  </div>
                  <div className="bg-white rounded-xl shadow-soft p-6">
                    <p className="text-sm text-gray-500 mb-1">Cleaner Payouts</p>
                    <p className="text-3xl font-bold text-blue-600">
                      ${(stats.totalRevenue - stats.platformCommission).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-400 mt-2">Paid to cleaners</p>
                  </div>
                </div>

                {/* Completed Jobs Revenue */}
                <div className="bg-white rounded-xl shadow-soft p-6">
                  <h3 className="font-semibold text-gray-800 mb-4">Revenue by Job</h3>
                  <div className="space-y-3">
                    {requests
                      .filter(r => r.status === 'completed')
                      .map(request => (
                        <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-800">{request.serviceType}</p>
                            <p className="text-sm text-gray-500">
                              {request.homeownerName} → {request.cleanerName}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-800">${request.totalAmount?.toFixed(2)}</p>
                            <p className="text-sm text-green-600">+${request.platformCommission?.toFixed(2)} commission</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="bg-red-50 rounded-xl p-6 border border-red-200">
                  <h3 className="font-semibold text-red-800 mb-2">Danger Zone</h3>
                  <p className="text-sm text-red-600 mb-4">This will permanently delete all data.</p>
                  <button
                    onClick={handleClearData}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                  >
                    Clear All Data
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }) => {
  const colors = {
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    primary: 'bg-primary-50 text-primary-600',
    secondary: 'bg-secondary-50 text-secondary-600'
  };

  return (
    <div className="bg-white rounded-xl shadow-soft p-6">
      <div className={`w-12 h-12 ${colors[color]} rounded-xl flex items-center justify-center mb-3`}>
        <Icon className="w-6 h-6" />
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
};

export default AdminDashboard;
