
import React, { useState, useEffect } from 'react';
import { CleaningRequest } from '../types';
import { storage } from '../utils/storage';
import { Card, Badge, Button } from './UI';
import {
  ArrowLeft, Clock, MapPin, MessageSquare, Phone, Calendar,
  DollarSign, User, Star, CheckCircle, XCircle, AlertCircle,
  ChevronDown, ChevronUp, Sparkles, RefreshCw, Filter, Search
} from 'lucide-react';
import ReviewModal from './ReviewModal';

interface Props {
  homeownerId: string;
  onBack: () => void;
}

const MyRequests: React.FC<Props> = ({ homeownerId, onBack }) => {
  const [requests, setRequests] = useState<CleaningRequest[]>([]);
  const [selectedReq, setSelectedReq] = useState<CleaningRequest | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
  const [isLoading, setIsLoading] = useState(true);

  const loadRequests = async () => {
    setIsLoading(true);
    const keys = await storage.list('request:');
    const myItems: CleaningRequest[] = [];
    for (const key of keys) {
      const req = await storage.get(key);
      if (req && req.homeownerId === homeownerId) {
        myItems.push(req);
      }
    }
    setRequests(myItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setIsLoading(false);
  };

  useEffect(() => {
    loadRequests();
    const interval = setInterval(loadRequests, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleCancel = async (id: string) => {
    if (window.confirm("Are you sure you want to cancel this request? This action cannot be undone.")) {
      const req = await storage.get(`request:${id}`);
      if (req) {
        req.status = 'cancelled';
        await storage.set(`request:${id}`, req);
        loadRequests();
      }
    }
  };

  const filteredRequests = requests.filter(req => {
    if (filter === 'all') return true;
    if (filter === 'active') return ['open', 'accepted', 'in_progress'].includes(req.status);
    if (filter === 'completed') return req.status === 'completed';
    if (filter === 'cancelled') return req.status === 'cancelled';
    return true;
  });

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
      open: { color: 'text-green-700', bg: 'bg-green-50 border-green-200', icon: <AlertCircle className="w-5 h-5" />, label: 'Awaiting Cleaner' },
      accepted: { color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: <CheckCircle className="w-5 h-5" />, label: 'Cleaner Confirmed' },
      in_progress: { color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', icon: <RefreshCw className="w-5 h-5 animate-spin" />, label: 'Cleaning In Progress' },
      completed: { color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200', icon: <CheckCircle className="w-5 h-5" />, label: 'Completed' },
      cancelled: { color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: <XCircle className="w-5 h-5" />, label: 'Cancelled' }
    };
    return statusMap[status] || statusMap.open;
  };

  const stats = {
    total: requests.length,
    active: requests.filter(r => ['open', 'accepted', 'in_progress'].includes(r.status)).length,
    completed: requests.filter(r => r.status === 'completed').length,
    cancelled: requests.filter(r => r.status === 'cancelled').length
  };

  return (
    <div className="animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-500 hover:text-purple-600 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-semibold">Back to Dashboard</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold font-outfit text-gray-900">My Cleaning Requests</h2>
          <p className="text-gray-500 mt-1">Track and manage all your cleaning bookings</p>
        </div>
      </div>

      {/* Stats & Filters */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { key: 'all', label: 'All', count: stats.total, color: 'purple' },
          { key: 'active', label: 'Active', count: stats.active, color: 'green' },
          { key: 'completed', label: 'Completed', count: stats.completed, color: 'blue' },
          { key: 'cancelled', label: 'Cancelled', count: stats.cancelled, color: 'red' }
        ].map(item => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key as any)}
            className={`p-3 rounded-xl text-center transition-all ${
              filter === item.key
                ? `bg-${item.color}-100 border-2 border-${item.color}-500 text-${item.color}-700`
                : 'bg-white border border-gray-100 text-gray-600 hover:border-gray-200'
            }`}
          >
            <p className="text-xl font-bold">{item.count}</p>
            <p className="text-xs font-semibold uppercase tracking-wider">{item.label}</p>
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {isLoading ? (
          <>
            {[1, 2, 3].map(i => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                  </div>
                  <div className="h-8 bg-gray-200 rounded-full w-24"></div>
                </div>
              </Card>
            ))}
          </>
        ) : filteredRequests.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">
              {filter === 'all' ? 'No requests yet' : `No ${filter} requests`}
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              {filter === 'all'
                ? "You haven't made any cleaning requests yet."
                : `You don't have any ${filter} requests.`}
            </p>
            {filter === 'all' && (
              <Button onClick={onBack}>Create Your First Request</Button>
            )}
          </Card>
        ) : (
          filteredRequests.map(req => {
            const statusInfo = getStatusInfo(req.status);
            const isExpanded = expandedId === req.id;

            return (
              <Card key={req.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Main Content */}
                <div className="p-5">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    {/* Left: Service Info */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`w-12 h-12 rounded-xl ${statusInfo.bg} flex items-center justify-center flex-shrink-0 ${statusInfo.color}`}>
                        {statusInfo.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-gray-900">{req.serviceType}</h3>
                          <Badge status={req.status} />
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(req.date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {req.time} • {req.hours}h
                          </span>
                          <span className="flex items-center gap-1 font-semibold text-green-600">
                            <DollarSign className="w-4 h-4" />
                            ${req.totalAmount}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">{req.address}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : req.id)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                      </button>
                    </div>
                  </div>

                  {/* Status Banner */}
                  {req.status === 'open' && (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-amber-800">Waiting for a cleaner</p>
                        <p className="text-xs text-amber-600">Your request is visible to verified cleaners in Ontario</p>
                      </div>
                    </div>
                  )}

                  {req.status === 'in_progress' && (
                    <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                        <RefreshCw className="w-4 h-4 text-purple-600 animate-spin" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-purple-800">Cleaning in progress</p>
                        <p className="text-xs text-purple-600">{req.cleanerName} is currently cleaning your space</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-5 bg-gray-50/50 animate-in fade-in duration-200">
                    {/* Cleaner Details */}
                    {req.cleanerName && (
                      <div className="mb-4 p-4 bg-white rounded-xl border border-gray-100">
                        <p className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-3">Assigned Cleaner</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                              <User className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{req.cleanerName}</p>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span>${req.hourlyRate}/hr</span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                  4.9
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-600 hover:bg-blue-100 transition-colors">
                              <MessageSquare className="w-5 h-5" />
                            </button>
                            {req.cleanerPhone && (
                              <a
                                href={`tel:${req.cleanerPhone}`}
                                className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 hover:bg-green-100 transition-colors"
                              >
                                <Phone className="w-5 h-5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Payment Details */}
                    <div className="mb-4 p-4 bg-white rounded-xl border border-gray-100">
                      <p className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-3">Payment Details</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Service ({req.hours}h @ ${req.hourlyRate || 35}/hr)</span>
                          <span className="font-semibold">${req.totalAmount}</span>
                        </div>
                        <div className="flex justify-between text-gray-500">
                          <span>Platform fee (included)</span>
                          <span>${req.platformCommission}</span>
                        </div>
                        <div className="flex justify-between text-gray-500">
                          <span>Cleaner receives</span>
                          <span className="text-green-600">${req.cleanerPayout}</span>
                        </div>
                        <div className="pt-2 border-t border-gray-100 flex justify-between font-bold">
                          <span>Total</span>
                          <span className="text-purple-600">${req.totalAmount}</span>
                        </div>
                      </div>
                    </div>

                    {/* Special Instructions */}
                    {req.instructions && (
                      <div className="mb-4 p-4 bg-white rounded-xl border border-gray-100">
                        <p className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-2">Special Instructions</p>
                        <p className="text-sm text-gray-700">{req.instructions}</p>
                      </div>
                    )}

                    {/* Images */}
                    {req.images && req.images.length > 0 && (
                      <div className="mb-4 p-4 bg-white rounded-xl border border-gray-100">
                        <p className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-3">Photos</p>
                        <div className="flex gap-2 overflow-x-auto">
                          {req.images.map((img, idx) => (
                            <img key={idx} src={img} alt="" className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {(req.status === 'open' || req.status === 'accepted') && (
                        <Button variant="danger" onClick={() => handleCancel(req.id)} className="text-sm">
                          <XCircle className="w-4 h-4" />
                          {req.status === 'open' ? 'Cancel Request' : 'Cancel Booking'}
                        </Button>
                      )}
                      {req.status === 'completed' && (
                        <Button onClick={() => setSelectedReq(req)} className="text-sm">
                          <Star className="w-4 h-4" />
                          Leave a Review
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Review Modal */}
      {selectedReq && (
        <ReviewModal
          request={selectedReq}
          onClose={() => {
            setSelectedReq(null);
            loadRequests();
          }}
        />
      )}
    </div>
  );
};

export default MyRequests;
