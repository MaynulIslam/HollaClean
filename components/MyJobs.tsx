
import React, { useState, useEffect } from 'react';
import { CleaningRequest } from '../types';
import { storage } from '../utils/storage';
import { Card, Button, Badge } from './UI';
import ComingSoon, { useComingSoon } from './ComingSoon';
import { CONFIG } from '../utils/config';
import { NotificationHelpers } from '../utils/notifications';
import { ExternalNotify } from '../utils/externalNotifications';
import { stopRemindersForRequest } from '../utils/reminderService';
import { notifyAdmin } from '../utils/adminNotifications';
import {
  MessageCircle, MapPin, Clock, CheckCircle, PlayCircle, AlertCircle,
  Phone, DollarSign, Calendar, User, Star, ChevronDown, ChevronUp,
  Navigation, XCircle, RefreshCw, Sparkles, Image as ImageIcon, CreditCard, Mail, X,
  LocateFixed, Loader2
} from 'lucide-react';
import { getPlatformConfig } from '../utils/config';
import { getCleanerPosition, checkProximity, formatDistance, Coordinates } from '../utils/geolocation';

// Format room key like "bedroom_1" → "Bedroom 1"
function formatRoomKey(key: string): string {
  const parts = key.split('_');
  const num = parts.pop();
  const type = parts.join('_');
  const labels: Record<string, string> = { bedroom: 'Bedroom', bathroom: 'Bathroom', kitchen: 'Kitchen', livingRoom: 'Living Room', other: 'Other Room', bedrooms: 'Bedrooms', bathrooms: 'Bathrooms' };
  const label = labels[type] || type;
  if (!num || isNaN(Number(num))) return labels[key] || (key === 'livingRoom' ? 'Living Room' : key);
  return `${label} ${num}`;
}

interface Props {
  cleanerId: string;
  type: 'active' | 'history';
}

const MyJobs: React.FC<Props> = ({ cleanerId, type }) => {
  const [jobs, setJobs] = useState<CleaningRequest[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; email?: string } | null>(null);
  const [startingJobId, setStartingJobId] = useState<string | null>(null);
  const [proximityError, setProximityError] = useState<string | null>(null);
  const { isOpen: isComingSoonOpen, feature: comingSoonFeature, showComingSoon, hideComingSoon } = useComingSoon();

  const loadJobs = async () => {
    setIsLoading(true);
    const keys = await storage.list('request:');
    const items: CleaningRequest[] = [];
    for (const key of keys) {
      const req = await storage.get(key);
      if (req && req.acceptedBy === cleanerId) {
        const isActive = ['accepted', 'in_progress'].includes(req.status);
        if (type === 'active' && isActive) items.push(req);
        if (type === 'history' && req.status === 'completed') items.push(req);
      }
    }
    setJobs(items.sort((a, b) => {
      if (type === 'active') return new Date(a.date).getTime() - new Date(b.date).getTime();
      return new Date(b.completedAt || b.date).getTime() - new Date(a.completedAt || a.date).getTime();
    }));
    setIsLoading(false);
  };

  useEffect(() => {
    loadJobs();
    const interval = setInterval(loadJobs, 10000);
    return () => clearInterval(interval);
  }, [type]);

  const updateStatus = async (id: string, status: CleaningRequest['status']) => {
    const req = await storage.get(`request:${id}`);

    if (status === 'in_progress') {
      // Payment already collected at request creation — go directly to in_progress
      req.status = 'in_progress';

      // Notify homeowner that cleaning has started (in-app)
      await NotificationHelpers.paymentHeld(req.homeownerId, req.serviceType);

      // Send email + push notification to homeowner
      if (req.homeownerEmail) {
        ExternalNotify.paymentHeld(req.homeownerEmail, req.homeownerName || 'Homeowner', req.serviceType);
      }

      // Show confirmation toast to cleaner
      setToast({ message: `Cleaning started! ${req.homeownerName} has been notified.` });
      setTimeout(() => setToast(null), 5000);
    } else if (status === 'completed') {
      // Cleaner marks job as done → payment already completed
      req.status = 'completed';
      req.completedAt = new Date().toISOString();
      req.paymentStatus = 'paid';
      req.paidAt = req.paidAt || new Date().toISOString();

      // Stop any remaining reminders
      await stopRemindersForRequest(id, 'paid');

      // Credit cleaner earnings (payment was already collected)
      const user = await storage.get(`user:${cleanerId}`);
      if (user) {
        user.totalEarnings = (Number(user.totalEarnings) || 0) + (Number(req.cleanerPayout) || 0);
        await storage.set(`user:${cleanerId}`, user);
      }

      // Notify admin about job completion
      notifyAdmin('job_completed', {
        serviceType: req.serviceType,
        amount: req.cleanerPayout,
        cleanerName: req.cleanerName || undefined,
        homeownerName: req.homeownerName,
        requestId: req.id,
      });

      // Notify both parties — payment released (in-app)
      await NotificationHelpers.paymentReleased(req.homeownerId, req.cleanerName || 'Your cleaner', req.serviceType, req.cleanerPayout);
      await NotificationHelpers.paymentReceived(cleanerId, req.cleanerPayout, req.serviceType);

      // Send email + push to homeowner about job completion
      if (req.homeownerEmail) {
        ExternalNotify.jobCompleted(req.homeownerEmail, req.homeownerName || 'Homeowner', req.cleanerName || 'Your cleaner', req.serviceType, req.cleanerPayout);
      }
      // Send email + push to cleaner about payment
      if (user) {
        ExternalNotify.paymentReceived(user.email, user.name || 'Cleaner', req.cleanerPayout, req.serviceType);
      }
    } else {
      req.status = status;
    }

    await storage.set(`request:${id}`, req);
    loadJobs();
  };

  const handleStartCleaning = async (jobId: string, jobAddress: string) => {
    setStartingJobId(jobId);
    setProximityError(null);

    try {
      const cleanerPos = await getCleanerPosition();
      const maxDist = getPlatformConfig().geolocation.maxAcceptDistance;
      const result = await checkProximity(cleanerPos, jobAddress, maxDist);

      if (result.distance !== null && result.distance > maxDist) {
        setProximityError(`You are ${formatDistance(result.distance)} away. You must be within ${maxDist}m of the job address to start cleaning.`);
        setStartingJobId(null);
        return;
      }

      if (result.distance === null) {
        // Geocoding failed — ask for confirmation
        if (!window.confirm('Unable to verify your distance to the job address. Start cleaning anyway?')) {
          setStartingJobId(null);
          return;
        }
      }

      // Within range — start the job
      await updateStatus(jobId, 'in_progress');
      setStartingJobId(null);
    } catch (err: any) {
      setProximityError(err.message || 'Unable to get your location. Please enable location services.');
      setStartingJobId(null);
    }
  };

  const handleMessageClick = () => {
    if (!CONFIG.features.messaging) {
      showComingSoon('messaging');
    }
  };

  const handleCancel = async (id: string) => {
    if (window.confirm("Release this job back to the marketplace? The homeowner will need to find another cleaner.")) {
      const req = await storage.get(`request:${id}`);
      req.status = 'open';
      req.acceptedBy = null;
      req.cleanerName = null;
      req.cleanerPhone = null;
      req.hourlyRate = null;
      req.acceptedAt = null;
      await storage.set(`request:${id}`, req);
      await stopRemindersForRequest(id, 'cancelled');
      loadJobs();
    }
  };

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { color: string; bg: string; label: string }> = {
      accepted: { color: 'text-blue-600', bg: 'bg-blue-100', label: 'Ready to Start' },
      in_progress: { color: 'text-purple-600', bg: 'bg-purple-100', label: 'In Progress' },
      completed: { color: 'text-green-600', bg: 'bg-green-100', label: 'Completed' }
    };
    return statusMap[status] || statusMap.accepted;
  };

  const totalEarnings = jobs.reduce((sum, job) => sum + (Number(job.cleanerPayout) || 0), 0);

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Toast notification */}
      {toast && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 animate-in slide-in-from-top duration-300">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-green-800 text-sm">{toast.message}</p>
              {toast.email && (
                <p className="text-xs text-green-600 mt-1">
                  Email sent to: {toast.email}
                </p>
              )}
              <p className="text-xs text-green-500 mt-1">The homeowner has been notified.</p>
            </div>
            <button onClick={() => setToast(null)} className="text-green-400 hover:text-green-600 flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header Stats for History */}
      {type === 'history' && jobs.length > 0 && (
        <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-green-700 font-medium">{jobs.length} Completed Jobs</p>
                <p className="text-2xl font-bold text-green-600">${totalEarnings.toFixed(2)} earned</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Jobs List */}
      {isLoading ? (
        <>
          {[1, 2].map(i => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-gray-200 rounded-xl"></div>
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                </div>
              </div>
            </Card>
          ))}
        </>
      ) : jobs.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            {type === 'active' ? (
              <Sparkles className="w-8 h-8 text-gray-400" />
            ) : (
              <CheckCircle className="w-8 h-8 text-gray-400" />
            )}
          </div>
          <h3 className="font-bold text-gray-900 mb-1">
            {type === 'active' ? 'No active jobs' : 'No completed jobs yet'}
          </h3>
          <p className="text-gray-500 text-sm">
            {type === 'active'
              ? 'Accept a job from the available requests to get started.'
              : 'Complete your first job to see it here.'}
          </p>
        </Card>
      ) : (
        jobs.map(job => {
          const statusInfo = getStatusInfo(job.status);
          const isExpanded = expandedId === job.id;

          return (
            <Card key={job.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-5">
                {/* Header Row */}
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  {/* Left: Job Info */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`w-14 h-14 rounded-xl ${statusInfo.bg} flex items-center justify-center flex-shrink-0`}>
                      {job.status === 'in_progress' ? (
                        <RefreshCw className={`w-7 h-7 ${statusInfo.color} animate-spin`} />
                      ) : job.status === 'completed' ? (
                        <CheckCircle className={`w-7 h-7 ${statusInfo.color}`} />
                      ) : (
                        <PlayCircle className={`w-7 h-7 ${statusInfo.color}`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold font-outfit text-gray-900">{job.serviceType}</h3>
                        <Badge status={job.status} />
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(job.date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {job.time} • {job.hours}h
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{job.address}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Earnings & Actions */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                        {type === 'history' ? 'Earned' : 'You\'ll Earn'}
                      </p>
                      <p className={`text-2xl font-bold ${type === 'history' ? 'text-green-600' : 'text-pink-600'}`}>
                        ${(Number(job.cleanerPayout) || 0).toFixed(2)}
                      </p>
                    </div>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : job.id)}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                    </button>
                  </div>
                </div>

                {/* Quick Actions for Active Jobs */}
                {type === 'active' && (
                  <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-100">
                    {job.status === 'accepted' ? (
                      <div className="flex flex-col gap-2 flex-1">
                        <div className="flex flex-wrap gap-3">
                          <Button
                            onClick={() => handleStartCleaning(job.id, job.address)}
                            disabled={startingJobId === job.id}
                            className="flex-1 md:flex-none bg-gradient-to-r from-purple-600 to-pink-600"
                          >
                            {startingJobId === job.id ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Checking Location...
                              </>
                            ) : (
                              <>
                                <PlayCircle className="w-5 h-5" />
                                Start Cleaning
                              </>
                            )}
                          </Button>
                          <Button
                            variant="danger"
                            onClick={() => handleCancel(job.id)}
                            className="flex-1 md:flex-none"
                          >
                            <XCircle className="w-5 h-5" />
                            Release Job
                          </Button>
                        </div>
                        {proximityError && startingJobId === null && (
                          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm">
                            <LocateFixed className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-red-700">{proximityError}</p>
                          </div>
                        )}
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <LocateFixed className="w-3 h-3" />
                          You must be within {getPlatformConfig().geolocation.maxAcceptDistance}m of the address to start
                        </p>
                      </div>
                    ) : job.status === 'in_progress' ? (
                      <div className="flex flex-col sm:flex-row gap-3 flex-1">
                        <Button
                          onClick={() => {
                            if (window.confirm('Mark this job as complete? Payment will be released to you.')) {
                              updateStatus(job.id, 'completed');
                            }
                          }}
                          className="flex-1 md:flex-none bg-gradient-to-r from-green-500 to-emerald-500"
                        >
                          <CheckCircle className="w-5 h-5" />
                          Mark as Complete
                        </Button>
                        <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                          <CreditCard className="w-4 h-4" />
                          <span>Payment complete</span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-gray-100 p-5 bg-gray-50/50 animate-in fade-in duration-200">
                  {/* Customer Details */}
                  <div className="mb-4 p-4 bg-white rounded-xl border border-gray-100">
                    <p className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-3">Customer Details</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                          <User className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{job.homeownerName}</p>
                          <p className="text-sm text-gray-500">{job.homeownerPhone}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleMessageClick}
                          className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-600 hover:bg-blue-100 transition-colors"
                          title="Send message to homeowner (Coming Soon)"
                        >
                          <MessageCircle className="w-5 h-5" />
                        </button>
                        <a
                          href={`tel:${job.homeownerPhone}`}
                          className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 hover:bg-green-100 transition-colors"
                          title={`Call ${job.homeownerName}`}
                        >
                          <Phone className="w-5 h-5" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Location with Navigation */}
                  <div className="mb-4 p-4 bg-white rounded-xl border border-gray-100">
                    <p className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-2">Service Location</p>
                    <p className="text-gray-700 mb-3">{job.address}</p>
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(job.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-pink-600 font-semibold hover:underline"
                    >
                      <Navigation className="w-4 h-4" />
                      Open in Maps
                    </a>
                  </div>

                  {/* Special Instructions */}
                  {job.instructions && (
                    <div className="mb-4 p-4 bg-white rounded-xl border border-gray-100">
                      <p className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-2">Special Instructions</p>
                      <p className="text-gray-700">{job.instructions}</p>
                    </div>
                  )}

                  {/* Images */}
                  {job.roomImages ? (
                    (Object.entries(job.roomImages) as [string, string[]][]).some(([, imgs]) => imgs && imgs.length > 0) && (
                      <div className="mb-4 p-4 bg-white rounded-xl border border-gray-100">
                        <p className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-3">Photos from Homeowner</p>
                        {(Object.entries(job.roomImages) as [string, string[]][]).map(([roomKey, imgs]) => (
                          imgs && imgs.length > 0 && (
                            <div key={roomKey} className="mb-2">
                              <p className="text-xs font-semibold text-gray-500 mb-1">{formatRoomKey(roomKey)}</p>
                              <div className="flex gap-2 overflow-x-auto">
                                {imgs.map((img, idx) => (
                                  <img key={idx} src={img} alt="" className="w-24 h-24 rounded-lg object-cover flex-shrink-0" />
                                ))}
                              </div>
                            </div>
                          )
                        ))}
                      </div>
                    )
                  ) : job.images && job.images.length > 0 ? (
                    <div className="mb-4 p-4 bg-white rounded-xl border border-gray-100">
                      <p className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-3">Photos from Homeowner</p>
                      <div className="flex gap-2 overflow-x-auto">
                        {job.images.map((img, idx) => (
                          <img key={idx} src={img} alt="" className="w-24 h-24 rounded-lg object-cover flex-shrink-0" />
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {/* Earnings Breakdown */}
                  <div className="p-4 bg-white rounded-xl border border-gray-100">
                    <p className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-3">Your Earnings</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Service ({job.hours}h)</span>
                        <span className="font-semibold">${(Number(job.cleanerPayout) || 0).toFixed(2)}</span>
                      </div>
                      <div className="pt-2 border-t border-gray-100 flex justify-between font-bold">
                        <span>Your Payout</span>
                        <span className="text-green-600">${(Number(job.cleanerPayout) || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Support */}
                  <div className="mt-4 flex justify-center">
                    <button className="text-sm text-gray-500 hover:text-pink-600 font-semibold transition-colors">
                      Need Help? Contact Support
                    </button>
                  </div>
                </div>
              )}
            </Card>
          );
        })
      )}

      {/* Coming Soon Modal */}
      <ComingSoon
        feature={comingSoonFeature}
        isOpen={isComingSoonOpen}
        onClose={hideComingSoon}
      />
    </div>
  );
};

export default MyJobs;
