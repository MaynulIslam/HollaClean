import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  DollarSign,
  Star,
  CheckCircle,
  AlertCircle,
  XCircle,
  Sparkles,
  MessageCircle,
  User,
  RefreshCw
} from 'lucide-react';
import { requestStorage, reviewStorage } from '../utils/storage';

const MyRequests = ({ user, onNavigate, onOpenReview }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    loadRequests();
  }, [user.id]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await requestStorage.getRequestsByHomeowner(user.id);

      // Check for existing reviews
      const requestsWithReviews = await Promise.all(
        data.map(async (request) => {
          if (request.status === 'completed') {
            const review = await reviewStorage.getReviewForRequest(request.id);
            return { ...request, hasReview: !!review };
          }
          return request;
        })
      );

      setRequests(requestsWithReviews);
    } catch (err) {
      console.error('Error loading requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (requestId) => {
    if (!confirm('Are you sure you want to cancel this request?')) return;

    setCancellingId(requestId);
    try {
      const request = await requestStorage.getRequest(requestId);
      if (request) {
        await requestStorage.saveRequest({
          ...request,
          status: 'cancelled'
        });
        await loadRequests();
      }
    } catch (err) {
      console.error('Error cancelling request:', err);
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'open':
        return {
          label: 'Waiting for Cleaner',
          color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
          icon: Clock,
          description: 'Your request is visible to all cleaners'
        };
      case 'accepted':
        return {
          label: 'Cleaner Assigned',
          color: 'bg-blue-100 text-blue-700 border-blue-200',
          icon: CheckCircle,
          description: 'A cleaner has accepted your request'
        };
      case 'in_progress':
        return {
          label: 'In Progress',
          color: 'bg-purple-100 text-purple-700 border-purple-200',
          icon: Sparkles,
          description: 'The cleaner is working on your request'
        };
      case 'completed':
        return {
          label: 'Completed',
          color: 'bg-green-100 text-green-700 border-green-200',
          icon: CheckCircle,
          description: 'Job completed successfully'
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          color: 'bg-gray-100 text-gray-500 border-gray-200',
          icon: XCircle,
          description: 'This request was cancelled'
        };
      default:
        return {
          label: status,
          color: 'bg-gray-100 text-gray-700 border-gray-200',
          icon: Clock,
          description: ''
        };
    }
  };

  const filteredRequests = requests.filter(r => {
    if (filter === 'all') return true;
    if (filter === 'active') return ['open', 'accepted', 'in_progress'].includes(r.status);
    if (filter === 'completed') return r.status === 'completed';
    return true;
  });

  return (
    <div className="min-h-screen pb-24 animate-fade-in">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('homeowner-dashboard')}
              className="text-primary-600 hover:bg-primary-50 p-2 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-display font-bold text-gray-800">My Requests</h1>
          </div>
          <button
            onClick={loadRequests}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['all', 'active', 'completed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all ${
                filter === f
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'active' && requests.filter(r => ['open', 'accepted', 'in_progress'].includes(r.status)).length > 0 && (
                <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                  {requests.filter(r => ['open', 'accepted', 'in_progress'].includes(r.status)).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Requests List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-soft">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <h4 className="font-medium text-gray-800 mb-1">No Requests Found</h4>
            <p className="text-gray-500 text-sm mb-4">
              {filter === 'all'
                ? "You haven't made any cleaning requests yet"
                : `No ${filter} requests`}
            </p>
            {filter === 'all' && (
              <button
                onClick={() => onNavigate('create-request')}
                className="px-6 py-2 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
              >
                Create Request
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => {
              const statusInfo = getStatusInfo(request.status);
              const StatusIcon = statusInfo.icon;

              return (
                <div
                  key={request.id}
                  className="bg-white rounded-2xl shadow-soft overflow-hidden"
                >
                  {/* Status Header */}
                  <div className={`px-4 py-3 ${statusInfo.color} border-b flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                      <StatusIcon className="w-4 h-4" />
                      <span className="font-medium text-sm">{statusInfo.label}</span>
                    </div>
                    {request.status === 'completed' && request.totalAmount > 0 && (
                      <span className="font-bold">${request.totalAmount.toFixed(2)}</span>
                    )}
                  </div>

                  {/* Request Details */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-800 text-lg">{request.serviceType}</h3>
                        <p className="text-sm text-gray-500">{statusInfo.description}</p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>
                          {new Date(request.date).toLocaleDateString('en-CA', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>{request.time} ({request.hours} hours)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{request.address}</span>
                      </div>
                    </div>

                    {request.instructions && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-xl text-sm text-gray-600">
                        <p className="font-medium text-gray-700 mb-1">Special Instructions:</p>
                        <p>{request.instructions}</p>
                      </div>
                    )}

                    {/* Cleaner Info (when accepted/in_progress/completed) */}
                    {request.cleanerName && ['accepted', 'in_progress', 'completed'].includes(request.status) && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-sm font-medium text-gray-700 mb-2">Your Cleaner</p>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-xl flex items-center justify-center text-white font-bold">
                            {request.cleanerName.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800">{request.cleanerName}</p>
                            <p className="text-sm text-gray-500">${request.hourlyRate}/hr</p>
                          </div>
                          <a
                            href={`tel:${request.cleanerPhone}`}
                            className="p-3 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-colors"
                          >
                            <Phone className="w-5 h-5" />
                          </a>
                        </div>

                        {request.totalAmount > 0 && (
                          <div className="mt-3 p-3 bg-primary-50 rounded-xl">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Total Cost</span>
                              <span className="font-bold text-primary-700">${request.totalAmount.toFixed(2)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-4 pt-4 border-t border-gray-100 flex gap-3">
                      {request.status === 'open' && (
                        <button
                          onClick={() => handleCancel(request.id)}
                          disabled={cancellingId === request.id}
                          className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                          {cancellingId === request.id ? 'Cancelling...' : 'Cancel Request'}
                        </button>
                      )}

                      {request.status === 'accepted' && (
                        <>
                          <a
                            href={`tel:${request.cleanerPhone}`}
                            className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-medium text-center hover:bg-primary-700 transition-colors"
                          >
                            Contact Cleaner
                          </a>
                          <button
                            onClick={() => handleCancel(request.id)}
                            disabled={cancellingId === request.id}
                            className="py-3 px-4 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </>
                      )}

                      {request.status === 'completed' && !request.hasReview && (
                        <button
                          onClick={() => onOpenReview(request)}
                          className="flex-1 py-3 bg-gradient-to-r from-primary-600 to-secondary-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:shadow-lg transition-all"
                        >
                          <Star className="w-5 h-5" />
                          Leave a Review
                        </button>
                      )}

                      {request.status === 'completed' && request.hasReview && (
                        <div className="flex-1 py-3 bg-green-50 text-green-700 rounded-xl font-medium text-center flex items-center justify-center gap-2">
                          <CheckCircle className="w-5 h-5" />
                          Review Submitted
                        </div>
                      )}
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

export default MyRequests;
