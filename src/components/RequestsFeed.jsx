import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  User,
  Sparkles,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Filter,
  Phone,
  Mail
} from 'lucide-react';
import { requestStorage, userStorage } from '../utils/storage';

const RequestsFeed = ({ user, onNavigate }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showDetails, setShowDetails] = useState(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const openRequests = await requestStorage.getOpenRequests();
      setRequests(openRequests);
    } catch (err) {
      console.error('Error loading requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId) => {
    if (!confirm('Accept this job? The customer will be notified.')) return;

    setAccepting(requestId);
    try {
      // Get the request
      const request = await requestStorage.getRequest(requestId);

      // Check if still open
      if (request.status !== 'open') {
        alert('Sorry, this request was already accepted by another cleaner.');
        await loadRequests();
        return;
      }

      // Calculate payment
      const totalAmount = user.hourlyRate * request.hours;
      const commission = totalAmount * 0.20;
      const cleanerPayout = totalAmount - commission;

      // Update request
      const updatedRequest = {
        ...request,
        status: 'accepted',
        acceptedBy: user.id,
        cleanerName: user.name,
        cleanerPhone: user.phone,
        hourlyRate: user.hourlyRate,
        acceptedAt: new Date().toISOString(),
        totalAmount,
        platformCommission: commission,
        cleanerPayout
      };

      await requestStorage.saveRequest(updatedRequest);

      alert(`Job accepted! Contact ${request.homeownerName} at ${request.homeownerPhone}`);
      onNavigate('my-jobs');
    } catch (err) {
      console.error('Error accepting request:', err);
      alert('Failed to accept request. Please try again.');
    } finally {
      setAccepting(null);
    }
  };

  const getServiceIcon = (serviceType) => {
    return Sparkles;
  };

  const calculateEarnings = (hours) => {
    const total = user.hourlyRate * hours;
    const commission = total * 0.20;
    return {
      total,
      commission,
      payout: total - commission
    };
  };

  const filteredRequests = requests.filter(r => {
    if (filter === 'all') return true;
    // Filter by service types the cleaner offers
    if (filter === 'my-services') {
      return user.services && user.services.includes(r.serviceType);
    }
    return true;
  });

  return (
    <div className="min-h-screen pb-24 animate-fade-in">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('cleaner-dashboard')}
              className="text-primary-600 hover:bg-primary-50 p-2 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-display font-bold text-gray-800">Available Jobs</h1>
              <p className="text-gray-500 text-sm">{requests.length} open requests</p>
            </div>
          </div>
          <button
            onClick={loadRequests}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Your Rate Info */}
        <div className="bg-primary-50 rounded-xl p-4 mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-primary-700">Your hourly rate</p>
            <p className="font-bold text-primary-800">${user.hourlyRate}/hr</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-primary-700">Platform fee</p>
            <p className="font-bold text-primary-800">20%</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all ${
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Jobs ({requests.length})
          </button>
          <button
            onClick={() => setFilter('my-services')}
            className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all ${
              filter === 'my-services'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            My Services
          </button>
        </div>

        {/* Requests List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-soft">
            <Sparkles className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <h4 className="font-medium text-gray-800 mb-1">No Jobs Available</h4>
            <p className="text-gray-500 text-sm mb-4">
              {filter === 'my-services'
                ? 'No jobs matching your services right now'
                : 'Check back soon for new requests'}
            </p>
            <button
              onClick={loadRequests}
              className="px-6 py-2 bg-primary-100 text-primary-700 rounded-xl font-medium hover:bg-primary-200 transition-colors"
            >
              Refresh
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => {
              const ServiceIcon = getServiceIcon(request.serviceType);
              const earnings = calculateEarnings(request.hours);
              const isExpanded = showDetails === request.id;

              return (
                <div
                  key={request.id}
                  className="bg-white rounded-2xl shadow-soft overflow-hidden"
                >
                  {/* Service Badge */}
                  <div className="bg-gradient-to-r from-primary-500 to-secondary-500 px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white">
                      <ServiceIcon className="w-4 h-4" />
                      <span className="font-medium">{request.serviceType}</span>
                    </div>
                    <span className="bg-white/20 px-2 py-0.5 rounded text-white text-xs font-medium">
                      OPEN
                    </span>
                  </div>

                  <div className="p-4">
                    {/* Quick Info */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>
                          {new Date(request.date).toLocaleDateString('en-CA', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>{request.time} ({request.hours}h)</span>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="flex items-start gap-2 text-sm text-gray-600 mb-4">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span>{request.address}</span>
                    </div>

                    {/* Earnings Preview */}
                    <div className="bg-green-50 rounded-xl p-3 mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-green-700">Your Earnings</p>
                          <p className="text-xl font-bold text-green-800">${earnings.payout.toFixed(2)}</p>
                        </div>
                        <div className="text-right text-sm text-green-600">
                          <p>${user.hourlyRate} × {request.hours}h = ${earnings.total.toFixed(2)}</p>
                          <p>-20% fee = -${earnings.commission.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="mb-4 p-4 bg-gray-50 rounded-xl animate-slide-down">
                        <h4 className="font-medium text-gray-800 mb-3">Customer Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">{request.homeownerName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">{request.homeownerPhone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">{request.homeownerEmail}</span>
                          </div>
                        </div>

                        {request.instructions && (
                          <div className="mt-4">
                            <h4 className="font-medium text-gray-800 mb-2">Special Instructions</h4>
                            <p className="text-sm text-gray-600 bg-white p-3 rounded-lg">
                              {request.instructions}
                            </p>
                          </div>
                        )}

                        <p className="text-xs text-gray-500 mt-3">
                          Posted {new Date(request.createdAt).toLocaleString()}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowDetails(isExpanded ? null : request.id)}
                        className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                      >
                        {isExpanded ? 'Hide Details' : 'View Details'}
                      </button>
                      <button
                        onClick={() => handleAccept(request.id)}
                        disabled={accepting === request.id}
                        className="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {accepting === request.id ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Accepting...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5" />
                            Accept Job
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestsFeed;
