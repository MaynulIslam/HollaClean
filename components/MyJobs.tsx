
import React, { useState, useEffect } from 'react';
import { CleaningRequest } from '../types';
import { storage } from '../utils/storage';
import { Card, Button, Badge } from './UI';
<<<<<<< HEAD
import {
  MessageCircle, MapPin, Clock, CheckCircle, PlayCircle, AlertCircle,
  Phone, DollarSign, Calendar, User, Star, ChevronDown, ChevronUp,
  Navigation, XCircle, RefreshCw, Sparkles, Image as ImageIcon
} from 'lucide-react';
=======
import { MessageCircle, MapPin, Clock, CheckCircle, PlayCircle, AlertCircle } from 'lucide-react';
>>>>>>> d06443da4cbdb3f847eedb509039380cf77654ed

interface Props {
  cleanerId: string;
  type: 'active' | 'history';
}

const MyJobs: React.FC<Props> = ({ cleanerId, type }) => {
  const [jobs, setJobs] = useState<CleaningRequest[]>([]);
<<<<<<< HEAD
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadJobs = async () => {
    setIsLoading(true);
=======

  const loadJobs = async () => {
>>>>>>> d06443da4cbdb3f847eedb509039380cf77654ed
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
<<<<<<< HEAD
    setJobs(items.sort((a, b) => {
      if (type === 'active') return new Date(a.date).getTime() - new Date(b.date).getTime();
      return new Date(b.completedAt || b.date).getTime() - new Date(a.completedAt || a.date).getTime();
    }));
    setIsLoading(false);
=======
    setJobs(items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
>>>>>>> d06443da4cbdb3f847eedb509039380cf77654ed
  };

  useEffect(() => {
    loadJobs();
    const interval = setInterval(loadJobs, 10000);
    return () => clearInterval(interval);
  }, [type]);

  const updateStatus = async (id: string, status: CleaningRequest['status']) => {
    const req = await storage.get(`request:${id}`);
    req.status = status;
    if (status === 'completed') {
      req.completedAt = new Date().toISOString();
      req.paymentStatus = 'paid';
<<<<<<< HEAD

=======
      
>>>>>>> d06443da4cbdb3f847eedb509039380cf77654ed
      // Update cleaner total earnings
      const user = await storage.get(`user:${cleanerId}`);
      user.totalEarnings = (user.totalEarnings || 0) + req.cleanerPayout;
      await storage.set(`user:${cleanerId}`, user);
    }
    await storage.set(`request:${id}`, req);
    loadJobs();
  };

  const handleCancel = async (id: string) => {
<<<<<<< HEAD
    if (window.confirm("Release this job back to the marketplace? The homeowner will need to find another cleaner.")) {
=======
    if (window.confirm("Release this job back to the marketplace?")) {
>>>>>>> d06443da4cbdb3f847eedb509039380cf77654ed
      const req = await storage.get(`request:${id}`);
      req.status = 'open';
      req.acceptedBy = null;
      req.cleanerName = null;
<<<<<<< HEAD
      req.cleanerPhone = null;
      req.hourlyRate = null;
=======
>>>>>>> d06443da4cbdb3f847eedb509039380cf77654ed
      req.acceptedAt = null;
      await storage.set(`request:${id}`, req);
      loadJobs();
    }
  };

<<<<<<< HEAD
  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { color: string; bg: string; label: string }> = {
      accepted: { color: 'text-blue-600', bg: 'bg-blue-100', label: 'Ready to Start' },
      in_progress: { color: 'text-purple-600', bg: 'bg-purple-100', label: 'In Progress' },
      completed: { color: 'text-green-600', bg: 'bg-green-100', label: 'Completed' }
    };
    return statusMap[status] || statusMap.accepted;
  };

  const totalEarnings = jobs.reduce((sum, job) => sum + (job.cleanerPayout || 0), 0);

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
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
                        ${job.cleanerPayout.toFixed(2)}
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
                      <>
                        <Button
                          onClick={() => updateStatus(job.id, 'in_progress')}
                          className="flex-1 md:flex-none bg-gradient-to-r from-purple-600 to-pink-600"
                        >
                          <PlayCircle className="w-5 h-5" />
                          Start Cleaning
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => handleCancel(job.id)}
                          className="flex-1 md:flex-none"
                        >
                          <XCircle className="w-5 h-5" />
                          Release Job
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() => updateStatus(job.id, 'completed')}
                        className="flex-1 md:flex-none bg-gradient-to-r from-green-500 to-emerald-500"
                      >
                        <CheckCircle className="w-5 h-5" />
                        Mark as Complete
                      </Button>
                    )}
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
                        <button className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-600 hover:bg-blue-100 transition-colors">
                          <MessageCircle className="w-5 h-5" />
                        </button>
                        <a
                          href={`tel:${job.homeownerPhone}`}
                          className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 hover:bg-green-100 transition-colors"
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
                  {job.images && job.images.length > 0 && (
                    <div className="mb-4 p-4 bg-white rounded-xl border border-gray-100">
                      <p className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-3">Photos from Homeowner</p>
                      <div className="flex gap-2 overflow-x-auto">
                        {job.images.map((img, idx) => (
                          <img key={idx} src={img} alt="" className="w-24 h-24 rounded-lg object-cover flex-shrink-0" />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Earnings Breakdown */}
                  <div className="p-4 bg-white rounded-xl border border-gray-100">
                    <p className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-3">Earnings Breakdown</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Service ({job.hours}h @ ${job.hourlyRate}/hr)</span>
                        <span className="font-semibold">${job.totalAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>Platform fee (20%)</span>
                        <span>-${job.platformCommission.toFixed(2)}</span>
                      </div>
                      <div className="pt-2 border-t border-gray-100 flex justify-between font-bold">
                        <span>Your Payout</span>
                        <span className="text-green-600">${job.cleanerPayout.toFixed(2)}</span>
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
=======
  return (
    <div className="space-y-6 animate-in slide-in-from-right-4">
      {jobs.length === 0 ? (
        <Card className="py-20 text-center">
          <p className="text-gray-400 font-bold">No {type === 'active' ? 'active' : 'completed'} jobs found.</p>
        </Card>
      ) : (
        jobs.map(job => (
          <Card key={job.id} className="relative overflow-hidden p-0 shadow-2xl shadow-gray-200/50 border border-gray-50">
            <div className="flex flex-col md:flex-row">
              <div className="flex-1 p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <Badge status={job.status} />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">EARN: ${job.cleanerPayout.toFixed(2)}</span>
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-3xl font-bold font-outfit text-gray-900 leading-tight">{job.serviceType}</h3>
                  <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400 font-bold">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-gray-300" /> 
                      {job.date} @ {job.time}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-gray-300" /> 
                      {job.address}
                    </div>
                  </div>
                </div>

                {/* Customer Section matching screenshot */}
                <div className="bg-[#f8fafc] p-6 rounded-[32px] flex items-center justify-between border border-gray-100 shadow-inner">
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-2">CUSTOMER</p>
                    <p className="font-black text-xl text-gray-800 leading-none mb-1">{job.homeownerName}</p>
                    <p className="text-sm text-gray-400 font-bold">{job.homeownerPhone}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-4 bg-white border border-blue-100 rounded-[20px] text-blue-500 hover:bg-blue-500 hover:text-white transition-all shadow-md group">
                      <MessageCircle className="w-7 h-7 fill-current group-hover:fill-white" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Sidebar matching screenshot */}
              {type === 'active' && (
                <div className="md:w-72 flex flex-col gap-4 p-8 md:bg-gray-50/20 border-t md:border-t-0 md:border-l border-gray-100 justify-center">
                  {job.status === 'accepted' ? (
                    <>
                      <button 
                        onClick={() => updateStatus(job.id, 'in_progress')} 
                        className="w-full bg-gradient-to-r from-[#9333ea] to-[#a855f7] text-white rounded-[24px] py-5 font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-purple-200 active:scale-95 transition-transform"
                      >
                        <PlayCircle className="w-6 h-6" /> Start Job
                      </button>
                      <button 
                        onClick={() => handleCancel(job.id)} 
                        className="w-full bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white rounded-[24px] py-5 font-black text-lg shadow-xl shadow-red-100 active:scale-95 transition-transform"
                      >
                        Release Job
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => updateStatus(job.id, 'completed')} 
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-[24px] py-5 font-black text-lg shadow-xl shadow-emerald-100 active:scale-95 transition-transform"
                    >
                      <CheckCircle className="w-6 h-6" /> Complete
                    </button>
                  )}
                  <button className="w-full py-4 text-sm font-black text-purple-600 bg-white border border-purple-50 rounded-[20px] hover:bg-purple-50 transition-colors">
                    Help / Support
                  </button>
                </div>
              )}

              {type === 'history' && (
                <div className="md:w-72 flex flex-col justify-center items-center gap-2 p-8 md:bg-gray-50/20 border-t md:border-t-0 md:border-l border-gray-100">
                   <div className="text-center">
                     <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Earnings Paid</p>
                     <p className="text-4xl font-black text-emerald-600 font-outfit mb-3 tracking-tighter">${job.cleanerPayout.toFixed(2)}</p>
                     <Badge status="paid" />
                   </div>
                </div>
              )}
            </div>
          </Card>
        ))
>>>>>>> d06443da4cbdb3f847eedb509039380cf77654ed
      )}
    </div>
  );
};

export default MyJobs;
