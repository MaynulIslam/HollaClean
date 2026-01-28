import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  DollarSign,
  User,
  Play,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Star,
  Navigation
} from 'lucide-react';
import { requestStorage, userStorage } from '../utils/storage';

const MyJobs = ({ user, onNavigate }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [filter, setFilter] = useState('active');

  useEffect(() => {
    loadJobs();
  }, [user.id]);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const myJobs = await requestStorage.getRequestsByCleaner(user.id);
      // Sort by date
      myJobs.sort((a, b) => new Date(a.date) - new Date(b.date));
      setJobs(myJobs);
    } catch (err) {
      console.error('Error loading jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartJob = async (jobId) => {
    setProcessingId(jobId);
    try {
      const job = await requestStorage.getRequest(jobId);
      await requestStorage.saveRequest({
        ...job,
        status: 'in_progress'
      });
      await loadJobs();
    } catch (err) {
      console.error('Error starting job:', err);
      alert('Failed to start job. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCompleteJob = async (jobId) => {
    if (!confirm('Mark this job as complete? The customer will be notified.')) return;

    setProcessingId(jobId);
    try {
      const job = await requestStorage.getRequest(jobId);
      await requestStorage.saveRequest({
        ...job,
        status: 'completed',
        completedAt: new Date().toISOString(),
        paymentStatus: 'paid' // In production, trigger actual payment
      });

      // Update cleaner's total earnings
      const updatedUser = await userStorage.getUser(user.id);
      updatedUser.totalEarnings = (updatedUser.totalEarnings || 0) + job.cleanerPayout;
      await userStorage.saveUser(updatedUser);
      await userStorage.setCurrentUser(updatedUser);

      alert(`Job completed! You earned $${job.cleanerPayout.toFixed(2)}`);
      await loadJobs();
    } catch (err) {
      console.error('Error completing job:', err);
      alert('Failed to complete job. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancelJob = async (jobId) => {
    if (!confirm('Cancel this job? It will be available for other cleaners again.')) return;

    setProcessingId(jobId);
    try {
      const job = await requestStorage.getRequest(jobId);
      await requestStorage.saveRequest({
        ...job,
        status: 'open',
        acceptedBy: null,
        cleanerName: null,
        cleanerPhone: null,
        hourlyRate: null,
        acceptedAt: null,
        totalAmount: 0,
        platformCommission: 0,
        cleanerPayout: 0
      });
      await loadJobs();
    } catch (err) {
      console.error('Error cancelling job:', err);
      alert('Failed to cancel job. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'accepted':
        return {
          label: 'Scheduled',
          color: 'bg-blue-100 text-blue-700 border-blue-200',
          icon: Calendar
        };
      case 'in_progress':
        return {
          label: 'In Progress',
          color: 'bg-purple-100 text-purple-700 border-purple-200',
          icon: Play
        };
      case 'completed':
        return {
          label: 'Completed',
          color: 'bg-green-100 text-green-700 border-green-200',
          icon: CheckCircle
        };
      default:
        return {
          label: status,
          color: 'bg-gray-100 text-gray-700 border-gray-200',
          icon: Clock
        };
    }
  };

  const filteredJobs = jobs.filter(j => {
    if (filter === 'active') return ['accepted', 'in_progress'].includes(j.status);
    if (filter === 'completed') return j.status === 'completed';
    return true;
  });

  const activeJobsCount = jobs.filter(j => ['accepted', 'in_progress'].includes(j.status)).length;

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
              <h1 className="text-2xl font-display font-bold text-gray-800">My Jobs</h1>
              <p className="text-gray-500 text-sm">{activeJobsCount} active jobs</p>
            </div>
          </div>
          <button
            onClick={loadJobs}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-full font-medium text-sm transition-all ${
              filter === 'active'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Active ({jobs.filter(j => ['accepted', 'in_progress'].includes(j.status)).length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-full font-medium text-sm transition-all ${
              filter === 'completed'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Completed ({jobs.filter(j => j.status === 'completed').length})
          </button>
        </div>

        {/* Jobs List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-soft">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <h4 className="font-medium text-gray-800 mb-1">No Jobs Found</h4>
            <p className="text-gray-500 text-sm mb-4">
              {filter === 'active'
                ? 'You have no active jobs. Browse available requests!'
                : 'No completed jobs yet'}
            </p>
            {filter === 'active' && (
              <button
                onClick={() => onNavigate('requests-feed')}
                className="px-6 py-2 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
              >
                Browse Jobs
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => {
              const statusInfo = getStatusInfo(job.status);
              const StatusIcon = statusInfo.icon;
              const jobDate = new Date(job.date);
              const isToday = jobDate.toDateString() === new Date().toDateString();
              const isPast = jobDate < new Date() && !isToday;

              return (
                <div
                  key={job.id}
                  className="bg-white rounded-2xl shadow-soft overflow-hidden"
                >
                  {/* Status Header */}
                  <div className={`px-4 py-3 ${statusInfo.color} border-b flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                      <StatusIcon className="w-4 h-4" />
                      <span className="font-medium text-sm">{statusInfo.label}</span>
                      {isToday && job.status !== 'completed' && (
                        <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs font-bold animate-pulse">
                          TODAY
                        </span>
                      )}
                    </div>
                    <span className="font-bold">${job.cleanerPayout.toFixed(2)}</span>
                  </div>

                  <div className="p-4">
                    {/* Service Type */}
                    <h3 className="font-semibold text-gray-800 text-lg mb-3">{job.serviceType}</h3>

                    {/* Job Details */}
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className={isToday ? 'text-red-600 font-medium' : ''}>
                          {jobDate.toLocaleDateString('en-CA', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                          {isToday && ' (Today)'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>{job.time} ({job.hours} hours)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                        <span>{job.address}</span>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="bg-gray-50 rounded-xl p-4 mb-4">
                      <h4 className="font-medium text-gray-800 mb-3">Customer</h4>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                          {job.homeownerName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{job.homeownerName}</p>
                          <p className="text-sm text-gray-500">{job.homeownerEmail}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={`tel:${job.homeownerPhone}`}
                          className="flex-1 py-2 bg-green-100 text-green-700 rounded-lg font-medium text-center text-sm hover:bg-green-200 transition-colors flex items-center justify-center gap-2"
                        >
                          <Phone className="w-4 h-4" />
                          Call
                        </a>
                        <a
                          href={`mailto:${job.homeownerEmail}`}
                          className="flex-1 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium text-center text-sm hover:bg-blue-200 transition-colors flex items-center justify-center gap-2"
                        >
                          <Mail className="w-4 h-4" />
                          Email
                        </a>
                        <a
                          href={`https://maps.google.com/?q=${encodeURIComponent(job.address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-2 bg-primary-100 text-primary-700 rounded-lg font-medium text-center text-sm hover:bg-primary-200 transition-colors flex items-center justify-center gap-2"
                        >
                          <Navigation className="w-4 h-4" />
                          Navigate
                        </a>
                      </div>
                    </div>

                    {/* Instructions */}
                    {job.instructions && (
                      <div className="mb-4 p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                        <p className="text-sm font-medium text-yellow-800 mb-1">Special Instructions</p>
                        <p className="text-sm text-yellow-700">{job.instructions}</p>
                      </div>
                    )}

                    {/* Earnings */}
                    <div className="bg-green-50 rounded-xl p-3 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-green-700">Your Earnings</span>
                        <span className="font-bold text-green-800">${job.cleanerPayout.toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-green-600 mt-1">
                        ${job.hourlyRate}/hr × {job.hours}h - 20% fee
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      {job.status === 'accepted' && (
                        <>
                          <button
                            onClick={() => handleStartJob(job.id)}
                            disabled={processingId === job.id}
                            className="flex-1 py-3 bg-gradient-to-r from-primary-600 to-secondary-500 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {processingId === job.id ? (
                              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <>
                                <Play className="w-5 h-5" />
                                Start Job
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleCancelJob(job.id)}
                            disabled={processingId === job.id}
                            className="py-3 px-4 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </>
                      )}

                      {job.status === 'in_progress' && (
                        <button
                          onClick={() => handleCompleteJob(job.id)}
                          disabled={processingId === job.id}
                          className="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {processingId === job.id ? (
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="w-5 h-5" />
                              Mark as Complete
                            </>
                          )}
                        </button>
                      )}

                      {job.status === 'completed' && (
                        <div className="flex-1 py-3 bg-green-50 text-green-700 rounded-xl font-medium text-center flex items-center justify-center gap-2">
                          <CheckCircle className="w-5 h-5" />
                          Completed on {new Date(job.completedAt).toLocaleDateString()}
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

export default MyJobs;
