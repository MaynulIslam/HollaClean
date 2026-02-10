
import React, { useState, useEffect } from 'react';
import { User, CleaningRequest } from '../types';
import { storage } from '../utils/storage';
import { Card, Button, Badge } from './UI';
import VerificationBadge from './VerificationBadge';
import { NotificationHelpers } from '../utils/notifications';
import { ExternalNotify } from '../utils/externalNotifications';
import { notifyAdmin } from '../utils/adminNotifications';
import {
  Clock, MapPin, Sparkles, User as UserIcon, CheckCircle, Calendar,
  DollarSign, ChevronDown, ChevronUp, Navigation, Image as ImageIcon,
  Zap, Eye, ArrowRight, AlertCircle
} from 'lucide-react';

interface Props {
  cleaner: User;
}

const RequestsFeed: React.FC<Props> = ({ cleaner }) => {
  const [requests, setRequests] = useState<CleaningRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [homeownerVerifications, setHomeownerVerifications] = useState<Record<string, { email: boolean; phone: boolean; address: boolean }>>({});

  const loadFeed = async () => {
    const keys = await storage.list('request:');
    const items: CleaningRequest[] = [];
    const verMap: Record<string, { email: boolean; phone: boolean; address: boolean }> = {};
    for (const key of keys) {
      const req = await storage.get(key);
      if (req && req.status === 'open') {
        items.push(req);
        if (!verMap[req.homeownerId]) {
          const homeowner = await storage.get(`user:${req.homeownerId}`);
          if (homeowner) {
            verMap[req.homeownerId] = {
              email: !!homeowner.emailVerified,
              phone: !!homeowner.phoneVerified,
              address: !!homeowner.addressVerified,
            };
          }
        }
      }
    }
    setRequests(items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setHomeownerVerifications(verMap);
    setLoading(false);
  };

  useEffect(() => {
    loadFeed();
    const interval = setInterval(loadFeed, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAccept = async (id: string) => {
    setAcceptingId(id);

    // Small delay for UX
    await new Promise(resolve => setTimeout(resolve, 500));

    const req = await storage.get(`request:${id}`);
    if (req.status !== 'open') {
      alert("This job was just accepted by another cleaner. Refreshing...");
      setAcceptingId(null);
      loadFeed();
      return;
    }

    const totalAmount = cleaner.hourlyRate! * req.hours;
    const commission = totalAmount * 0.20;
    const payout = totalAmount - commission;

    const updated: CleaningRequest = {
      ...req,
      status: 'accepted',
      acceptedBy: cleaner.id,
      cleanerName: cleaner.name,
      cleanerPhone: cleaner.phone,
      hourlyRate: cleaner.hourlyRate!,
      acceptedAt: new Date().toISOString(),
      totalAmount,
      platformCommission: commission,
      cleanerPayout: payout
    };

    await storage.set(`request:${id}`, updated);

    // Send notification to homeowner that their job was accepted (in-app)
    await NotificationHelpers.jobAccepted(req.homeownerId, cleaner.name, req.serviceType);

    // Send booking confirmation notification (in-app)
    await NotificationHelpers.bookingConfirmation(req.homeownerId, cleaner.name, req.serviceType, req.date, req.time);

    // Send email + push notification to homeowner (booking confirmation + job accepted)
    const homeowner = await storage.get(`user:${req.homeownerId}`);
    if (homeowner) {
      ExternalNotify.bookingConfirmation(homeowner.email, homeowner.name || 'Homeowner', cleaner.name, req.serviceType, totalAmount, req.date, req.time);
    }

    // Notify admin about accepted job
    notifyAdmin('job_accepted', {
      serviceType: req.serviceType,
      cleanerName: cleaner.name,
      homeownerName: req.homeownerName,
      requestId: req.id,
    });

    setAcceptingId(null);
    loadFeed();
  };

  const calculateEarnings = (hours: number) => {
    const total = cleaner.hourlyRate! * hours;
    return total * 0.8; // 80% after platform fee
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="p-5 animate-pulse">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
              <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-100 rounded w-1/2"></div>
              </div>
              <div className="h-10 bg-gray-200 rounded-xl w-24"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          <h3 className="font-bold text-gray-900">Available Jobs</h3>
          <span className="text-xs text-gray-500">({requests.length} available)</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 rounded-full">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span className="text-xs font-semibold text-green-700">Live Updates</span>
        </div>
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="font-bold text-gray-900 mb-1">No jobs available right now</h3>
          <p className="text-gray-500 text-sm mb-4">
            Check back soon — new cleaning requests are posted regularly in Ontario.
          </p>
          <p className="text-xs text-gray-400">Auto-refreshing every 5 seconds</p>
        </Card>
      ) : (
        requests.map(req => {
          const isExpanded = expandedId === req.id;
          const isAccepting = acceptingId === req.id;
          const earnings = calculateEarnings(req.hours);

          return (
            <Card key={req.id} className="overflow-hidden hover:shadow-lg transition-all border-2 border-transparent hover:border-pink-200">
              <div className="p-5">
                {/* Main Row */}
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Left: Service Info */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-6 h-6 text-pink-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold font-outfit text-gray-900">{req.serviceType}</h3>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">New</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-pink-500" />
                          {new Date(req.date).toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-pink-500" />
                          {req.time} • {req.hours}h
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
                        <MapPin className="w-4 h-4 text-pink-500" />
                        <span className="truncate">{req.address.split(',').slice(0, 2).join(',')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Earnings & Action */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">You'll Earn</p>
                      <p className="text-2xl font-bold text-pink-600">${earnings.toFixed(2)}</p>
                      <p className="text-xs text-gray-400">after 20% fee</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => handleAccept(req.id)}
                        disabled={isAccepting}
                        className="bg-gradient-to-r from-pink-600 to-orange-500 text-sm px-6"
                      >
                        {isAccepting ? (
                          <span className="flex items-center gap-2">
                            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Accepting...
                          </span>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Accept Job
                          </>
                        )}
                      </Button>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : req.id)}
                        className="text-xs text-gray-500 hover:text-pink-600 font-semibold flex items-center justify-center gap-1"
                      >
                        {isExpanded ? (
                          <>Hide Details <ChevronUp className="w-3 h-3" /></>
                        ) : (
                          <>View Details <ChevronDown className="w-3 h-3" /></>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Posted By */}
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <UserIcon className="w-4 h-4" />
                    <span>Posted by <span className="font-semibold text-gray-700">{req.homeownerName}</span></span>
                    {homeownerVerifications[req.homeownerId] && (
                      <div className="flex items-center gap-0.5 ml-1">
                        <VerificationBadge verified={homeownerVerifications[req.homeownerId].email} label="Email" />
                        <VerificationBadge verified={homeownerVerifications[req.homeownerId].phone} label="Phone" />
                        <VerificationBadge verified={homeownerVerifications[req.homeownerId].address} label="Address" />
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(req.createdAt).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-gray-100 p-5 bg-gray-50/50 animate-in fade-in duration-200">
                  {/* Full Address with Navigation */}
                  <div className="mb-4 p-4 bg-white rounded-xl border border-gray-100">
                    <p className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-2">Full Address</p>
                    <p className="text-gray-700 mb-3">{req.address}</p>
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(req.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-pink-600 font-semibold hover:underline"
                    >
                      <Navigation className="w-4 h-4" />
                      Open in Google Maps
                    </a>
                  </div>

                  {/* Special Instructions */}
                  {req.instructions && (
                    <div className="mb-4 p-4 bg-white rounded-xl border border-gray-100">
                      <p className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-2">Special Instructions</p>
                      <p className="text-gray-700">{req.instructions}</p>
                    </div>
                  )}

                  {/* Photos */}
                  {req.images && req.images.length > 0 && (
                    <div className="mb-4 p-4 bg-white rounded-xl border border-gray-100">
                      <p className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-3">Photos from Homeowner</p>
                      <div className="flex gap-2 overflow-x-auto">
                        {req.images.map((img, idx) => (
                          <img key={idx} src={img} alt="" className="w-24 h-24 rounded-lg object-cover flex-shrink-0" />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Earnings Breakdown */}
                  <div className="p-4 bg-gradient-to-br from-pink-50 to-orange-50 rounded-xl border border-pink-100">
                    <p className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-3">Earnings Breakdown</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Your Rate ({req.hours}h @ ${cleaner.hourlyRate}/hr)</span>
                        <span className="font-semibold">${(cleaner.hourlyRate! * req.hours).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>Platform fee (20%)</span>
                        <span>-${(cleaner.hourlyRate! * req.hours * 0.2).toFixed(2)}</span>
                      </div>
                      <div className="pt-2 border-t border-pink-200 flex justify-between font-bold">
                        <span>Your Take-Home</span>
                        <span className="text-pink-600">${earnings.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Accept Button at Bottom */}
                  <div className="mt-4 flex justify-end">
                    <Button
                      onClick={() => handleAccept(req.id)}
                      disabled={isAccepting}
                      className="bg-gradient-to-r from-pink-600 to-orange-500 px-8"
                    >
                      {isAccepting ? 'Accepting...' : 'Accept This Job'}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })
      )}

      {/* Tips Card */}
      {requests.length > 0 && (
        <Card className="p-4 bg-amber-50 border-amber-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Quick Tip</p>
              <p className="text-xs text-amber-700">Jobs are accepted on a first-come, first-served basis. Act quickly on jobs you want!</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default RequestsFeed;
