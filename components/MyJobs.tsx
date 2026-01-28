
import React, { useState, useEffect } from 'react';
import { CleaningRequest } from '../types';
import { storage } from '../utils/storage';
import { Card, Button, Badge } from './UI';
import { MessageCircle, MapPin, Clock, CheckCircle, PlayCircle, AlertCircle } from 'lucide-react';

interface Props {
  cleanerId: string;
  type: 'active' | 'history';
}

const MyJobs: React.FC<Props> = ({ cleanerId, type }) => {
  const [jobs, setJobs] = useState<CleaningRequest[]>([]);

  const loadJobs = async () => {
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
    setJobs(items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
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
      
      // Update cleaner total earnings
      const user = await storage.get(`user:${cleanerId}`);
      user.totalEarnings = (user.totalEarnings || 0) + req.cleanerPayout;
      await storage.set(`user:${cleanerId}`, user);
    }
    await storage.set(`request:${id}`, req);
    loadJobs();
  };

  const handleCancel = async (id: string) => {
    if (window.confirm("Release this job back to the marketplace?")) {
      const req = await storage.get(`request:${id}`);
      req.status = 'open';
      req.acceptedBy = null;
      req.cleanerName = null;
      req.acceptedAt = null;
      await storage.set(`request:${id}`, req);
      loadJobs();
    }
  };

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
      )}
    </div>
  );
};

export default MyJobs;
