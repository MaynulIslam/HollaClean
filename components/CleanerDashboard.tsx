
import React, { useState, useEffect } from 'react';
import { User, CleaningRequest } from '../types';
import { storage } from '../utils/storage';
import { Button, Card, Badge } from './UI';
import RequestsFeed from './RequestsFeed';
import MyJobs from './MyJobs';
import ProfileView from './ProfileView';
import { Search, Briefcase, DollarSign, LogOut, User as UserIcon, LayoutDashboard, Sparkles, TrendingUp, Calendar } from 'lucide-react';

interface Props {
  user: User;
  onLogout: () => void;
}

const CleanerDashboard: React.FC<Props> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'available' | 'my_jobs' | 'history' | 'profile'>('available');
  const [stats, setStats] = useState({ available: 0, accepted: 0, monthly: 0 });

  const loadStats = async () => {
    const keys = await storage.list('request:');
    let avail = 0, acc = 0, mon = 0;
    for (const key of keys) {
      const req = await storage.get(key);
      if (req) {
        if (req.status === 'open') avail++;
        if (req.acceptedBy === user.id) {
          if (['accepted', 'in_progress'].includes(req.status)) acc++;
          if (req.status === 'completed') {
             const compDate = new Date(req.completedAt!);
             const now = new Date();
             if (compDate.getMonth() === now.getMonth() && compDate.getFullYear() === now.getFullYear()) {
               mon += req.cleanerPayout;
             }
          }
        }
      }
    }
    setStats({ available: avail, accepted: acc, monthly: mon });
  };

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col pb-24 md:pb-0 font-sans">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-pink-600" />
          <h1 className="text-xl font-bold font-outfit text-gray-900">HollaClean Pro</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Professional Cleaner</p>
            <p className="text-sm font-bold text-gray-800">Hey, {user.name.split(' ')[0]}! 💪</p>
          </div>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${activeTab === 'profile' ? 'bg-pink-600 text-white' : 'bg-pink-100 text-pink-600 hover:bg-pink-200'}`}
          >
            <UserIcon className="w-5 h-5" />
          </button>
          <button onClick={onLogout} className="text-gray-400 hover:text-red-500 transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
        {activeTab !== 'profile' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 items-stretch">
              {/* Earnings Card */}
              <div className="bg-gradient-to-br from-[#ff6b6b] to-[#ff9f43] text-white p-6 md:p-10 rounded-[48px] relative overflow-hidden md:col-span-2 shadow-2xl border-4 border-white flex flex-col justify-center min-h-[160px]">
                <div className="relative z-10">
                  <p className="text-white/90 text-[11px] font-black uppercase tracking-[0.2em] mb-1">TOTAL LIFETIME EARNINGS</p>
                  <h3 className="text-5xl font-black font-outfit tracking-tight">
                    ${user.totalEarnings?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '1,250.00'}
                  </h3>
                  <div className="mt-4 flex items-center gap-2 text-white/90 bg-white/20 w-fit px-4 py-1.5 rounded-full text-xs font-black backdrop-blur-md border border-white/20">
                    <TrendingUp className="w-4 h-4" />
                    This month: ${stats.monthly.toFixed(2)}
                  </div>
                </div>
              </div>
              
              {/* Job Count Mini Cards */}
              <div className="flex flex-col gap-4">
                <div className="flex-1 bg-[#f1a100] px-6 py-4 rounded-[40px] text-white shadow-lg border-4 border-white flex flex-col justify-center items-center text-center transition-transform hover:scale-[1.02]">
                  <p className="text-5xl font-black font-outfit leading-none mb-1">{stats.available}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/90">AVAILABLE JOBS</p>
                </div>
                <div className="flex-1 bg-[#10b981] px-6 py-4 rounded-[40px] text-white shadow-lg border-4 border-white flex flex-col justify-center items-center text-center transition-transform hover:scale-[1.02]">
                  <p className="text-5xl font-black font-outfit leading-none mb-1">{stats.accepted}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/90">ACCEPTED JOBS</p>
                </div>
              </div>
            </div>

            {/* Tab Bar with Dark Gray border (slate-700) */}
            <div className="flex bg-[#f1f5f9] border-[2.5px] border-slate-700 p-1.5 rounded-full mb-12 max-w-4xl mx-auto shadow-sm">
              {[
                { id: 'available', label: 'CLEANING REQUEST', icon: Search, count: stats.available },
                { id: 'my_jobs', label: 'MY JOBS', icon: Briefcase, count: stats.accepted },
                { id: 'history', label: 'HISTORY', icon: Calendar }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 py-3 px-6 rounded-full flex items-center justify-center gap-2 text-[11px] font-black transition-all relative whitespace-nowrap overflow-hidden ${activeTab === tab.id ? 'bg-gradient-to-r from-[#d946ef] to-[#db2777] text-white shadow-xl' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-white' : 'text-slate-400'}`} />
                  <span className="uppercase tracking-widest">{tab.label}</span>
                  {(tab as any).count !== undefined && (
                    <div className="absolute top-1 right-2">
                       <span className={`flex items-center justify-center min-w-[20px] h-5 px-1 text-[9px] font-black rounded-full border-2 border-white shadow-sm ${activeTab === tab.id ? 'bg-white text-[#db2777]' : 'bg-gray-300 text-gray-600'}`}>
                         {(tab as any).count}
                       </span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </>
        )}

        {activeTab === 'available' && (
          <RequestsFeed cleaner={user} />
        )}

        {activeTab === 'my_jobs' && (
          <MyJobs cleanerId={user.id} type="active" />
        )}

        {activeTab === 'history' && (
          <MyJobs cleanerId={user.id} type="history" />
        )}

        {activeTab === 'profile' && (
          <ProfileView user={user} onBack={() => setActiveTab('available')} onLogout={onLogout} />
        )}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4 flex items-center justify-around z-40 safe-area-bottom">
        <button onClick={() => setActiveTab('available')} className={`flex flex-col items-center gap-1 ${activeTab === 'available' ? 'text-pink-600' : 'text-gray-400'}`}>
          <Search className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Requests</span>
        </button>
        <button onClick={() => setActiveTab('my_jobs')} className={`flex flex-col items-center gap-1 ${activeTab === 'my_jobs' ? 'text-pink-600' : 'text-gray-400'}`}>
          <Briefcase className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">My Jobs</span>
        </button>
        <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 ${activeTab === 'profile' ? 'text-pink-600' : 'text-gray-400'}`}>
          <UserIcon className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Profile</span>
        </button>
      </nav>
    </div>
  );
};

export default CleanerDashboard;
