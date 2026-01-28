
import React, { useState, useEffect } from 'react';
import { User, CleaningRequest } from '../types';
import { storage } from '../utils/storage';
import { Card, Button, Badge } from './UI';
import { Clock, MapPin, Sparkles, User as UserIcon, CheckCircle2, Calendar } from 'lucide-react';

interface Props {
  cleaner: User;
}

const RequestsFeed: React.FC<Props> = ({ cleaner }) => {
  const [requests, setRequests] = useState<CleaningRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFeed = async () => {
    const keys = await storage.list('request:');
    const items: CleaningRequest[] = [];
    for (const key of keys) {
      const req = await storage.get(key);
      if (req && req.status === 'open') {
        items.push(req);
      }
    }
    setRequests(items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setLoading(false);
  };

  useEffect(() => {
    loadFeed();
    const interval = setInterval(loadFeed, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAccept = async (id: string) => {
    const req = await storage.get(`request:${id}`);
    if (req.status !== 'open') {
      alert("This job was just accepted by another cleaner.");
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
    alert(`Job Accepted! Contact ${req.homeownerName} at ${req.homeownerPhone}`);
    loadFeed();
  };

  if (loading) return <div className="text-center py-20 text-gray-400 animate-pulse font-bold">Scanning Ontario for new jobs...</div>;

  return (
    <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-xl font-bold flex items-center gap-2 font-outfit text-gray-900">
          <Sparkles className="w-5 h-5 text-pink-600" /> Available in Your Area
        </h2>
        <span className="text-[10px] font-black text-pink-600 bg-pink-50 px-3 py-1 rounded-lg uppercase tracking-widest animate-pulse border border-pink-100 shadow-sm">LIVE</span>
      </div>

      {requests.length === 0 ? (
        <Card className="py-20 text-center bg-white border border-gray-100 rounded-[32px] shadow-sm">
          <div className="mb-4 flex justify-center text-gray-200">
            <CheckCircle2 className="w-16 h-16" />
          </div>
          <p className="text-gray-400 font-bold">Your area is quiet right now.</p>
        </Card>
      ) : (
        requests.map(req => (
          <div key={req.id} className="bg-white rounded-[32px] border-[2.5px] border-slate-700 shadow-xl overflow-hidden group transition-all hover:shadow-2xl hover:scale-[1.002]">
            <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-100">
              
              {/* PORTION 1: Info (Compact) */}
              <div className="flex-[3] p-4 md:p-5 bg-white">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                  {/* Left: Identity */}
                  <div className="flex items-center gap-3 min-w-[180px]">
                    <div className="w-10 h-10 bg-[#fdf2f8] rounded-xl flex items-center justify-center border border-pink-100 flex-shrink-0">
                      <Sparkles className="w-5 h-5 text-pink-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black font-outfit text-gray-900 leading-tight">{req.serviceType}</h3>
                      <p className="text-[8px] text-gray-400 font-black uppercase tracking-[0.2em] flex items-center gap-1 mt-0.5">
                        <UserIcon className="w-2 h-2" /> FROM {req.homeownerName.toUpperCase()}
                      </p>
                    </div>
                  </div>

                  {/* Mid: Date & Time Boxes */}
                  <div className="flex flex-1 gap-2 w-full">
                    <div className="flex-1 bg-slate-50 border border-slate-100 p-2 rounded-xl flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-pink-500" />
                      <div>
                        <p className="text-[6px] font-black text-gray-400 uppercase tracking-widest leading-none mb-0.5">DATE</p>
                        <p className="text-[10px] font-bold text-gray-800 leading-none">{req.date}</p>
                      </div>
                    </div>
                    <div className="flex-1 bg-slate-50 border border-slate-100 p-2 rounded-xl flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-pink-500" />
                      <div>
                        <p className="text-[6px] font-black text-gray-400 uppercase tracking-widest leading-none mb-0.5">TIME</p>
                        <p className="text-[10px] font-bold text-gray-800 leading-none">{req.time}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom: Address Box */}
                <div className="mt-3 bg-slate-50 border border-slate-100 p-2 rounded-xl flex items-center gap-2.5">
                  <MapPin className="w-3.5 h-3.5 text-pink-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[6px] font-black text-gray-400 uppercase tracking-widest leading-none mb-0.5">ADDRESS</p>
                    <p className="text-[10px] font-bold text-gray-800 truncate leading-none">{req.address}</p>
                  </div>
                </div>
              </div>

              {/* PORTION 2: Earnings */}
              <div className="flex-[1.1] p-4 md:p-5 bg-[#fafbfc] flex flex-col justify-center items-center text-center">
                <p className="text-[8px] text-gray-400 font-black uppercase tracking-[0.1em] mb-0.5">ESTIMATED EARNINGS</p>
                <p className="text-3xl font-black text-[#db2777] font-outfit tracking-tighter">
                  ${(cleaner.hourlyRate! * req.hours * 0.8).toFixed(2)}
                </p>
                <p className="text-[7px] text-gray-400 font-bold uppercase leading-tight">After 20% platform commission</p>
              </div>

              {/* PORTION 3: Action */}
              <div className="flex-[1.1] p-4 md:p-5 bg-white flex flex-col justify-center gap-3">
                <button 
                  onClick={() => handleAccept(req.id)} 
                  className="w-full bg-gradient-to-r from-[#d946ef] to-[#db2777] text-white py-3 rounded-full font-black text-[9px] uppercase tracking-[0.2em] shadow-md shadow-pink-100 active:scale-95 transition-all"
                >
                  ACCEPT JOB
                </button>
                <button className="w-full text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] hover:text-pink-600 transition-colors text-center">
                  VIEW FULL MAP
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default RequestsFeed;
