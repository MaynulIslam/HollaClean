
import React, { useState, useEffect } from 'react';
import { User, CleaningRequest } from '../types';
import { storage } from '../utils/storage';
import { Button, Card, Badge } from './UI';
import CreateRequest from './CreateRequest';
import MyRequests from './MyRequests';
import ProfileView from './ProfileView';
import { Plus, Calendar, LogOut, User as UserIcon, LayoutDashboard, Sparkles } from 'lucide-react';

interface Props {
  user: User;
  onLogout: () => void;
}

const HomeownerDashboard: React.FC<Props> = ({ user, onLogout }) => {
  const [view, setView] = useState<'overview' | 'create' | 'my_requests' | 'profile'>('overview');
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0 });
  const [recentRequests, setRecentRequests] = useState<CleaningRequest[]>([]);

  const loadData = async () => {
    const keys = await storage.list('request:');
    let total = 0, active = 0, completed = 0;
    const items: CleaningRequest[] = [];

    for (const key of keys) {
      const req = await storage.get(key);
      if (req && req.homeownerId === user.id) {
        total++;
        if (['open', 'accepted', 'in_progress'].includes(req.status)) active++;
        if (req.status === 'completed') completed++;
        items.push(req);
      }
    }
    setStats({ total, active, completed });
    setRecentRequests(items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3));
  };

  useEffect(() => {
    loadData();
  }, [view]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-24 md:pb-0">
      {/* Top Nav */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-600" />
          <h1 className="text-xl font-bold font-outfit">HollaClean</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Homeowner</p>
            <p className="text-sm font-bold text-gray-800">Hey, {user.name.split(' ')[0]}! 👋</p>
          </div>
          <button 
            onClick={() => setView('profile')}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${view === 'profile' ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-600 hover:bg-purple-200'}`}
          >
            <UserIcon className="w-5 h-5" />
          </button>
          <button onClick={onLogout} className="text-gray-400 hover:text-red-500 transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-6 md:p-8 max-w-5xl mx-auto w-full">
        {view === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Requests', val: stats.total, color: 'bg-purple-600 text-white shadow-lg shadow-purple-100' },
                { label: 'Active', val: stats.active, color: 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' },
                { label: 'Completed', val: stats.completed, color: 'bg-slate-600 text-white shadow-lg shadow-slate-100' }
              ].map((s, i) => (
                <div key={i} className={`p-4 rounded-2xl ${s.color} text-center transition-all hover:scale-105`}>
                  <p className="text-2xl font-black">{s.val}</p>
                  <p className="text-[10px] uppercase font-black tracking-widest opacity-80">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Main Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={() => setView('create')}
                className="group relative overflow-hidden bg-gradient-to-br from-purple-600 to-pink-500 p-8 rounded-3xl text-white shadow-xl shadow-purple-200 text-left active:scale-[0.98] transition-transform"
              >
                <div className="relative z-10">
                  <Plus className="w-10 h-10 mb-4 bg-white/20 p-2 rounded-xl" />
                  <h3 className="text-2xl font-bold mb-1">Request Cleaning</h3>
                  <p className="text-white/80 text-sm">Post a new job and get matched with top local cleaners.</p>
                </div>
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
                  <Sparkles className="w-32 h-32" />
                </div>
              </button>

              <button 
                onClick={() => setView('my_requests')}
                className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-left hover:shadow-md transition-shadow active:scale-[0.98]"
              >
                <Calendar className="w-10 h-10 mb-4 text-purple-600 bg-purple-50 p-2 rounded-xl" />
                <h3 className="text-2xl font-bold mb-1">My Requests</h3>
                <p className="text-gray-500 text-sm">View and manage your active and past cleaning jobs.</p>
              </button>
            </div>

            {/* Recent Activity */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold">Recent Activity</h3>
              {recentRequests.length > 0 ? (
                <div className="space-y-3">
                  {recentRequests.map(req => (
                    <Card key={req.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                          <Sparkles className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">{req.serviceType}</p>
                          <p className="text-xs text-gray-500">{new Date(req.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <Badge status={req.status} />
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200">
                  <p className="text-gray-400">No recent requests.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'create' && (
          <CreateRequest 
            user={user} 
            onSuccess={() => setView('my_requests')} 
            onBack={() => setView('overview')} 
          />
        )}

        {view === 'my_requests' && (
          <MyRequests 
            homeownerId={user.id} 
            onBack={() => setView('overview')} 
          />
        )}

        {view === 'profile' && (
          <ProfileView user={user} onBack={() => setView('overview')} onLogout={onLogout} />
        )}
      </main>

      {/* Bottom Nav Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4 flex items-center justify-around z-40 safe-area-bottom">
        <button onClick={() => setView('overview')} className={`flex flex-col items-center gap-1 ${view === 'overview' ? 'text-purple-600' : 'text-gray-400'}`}>
          <LayoutDashboard className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase">Home</span>
        </button>
        <button onClick={() => setView('my_requests')} className={`flex flex-col items-center gap-1 ${view === 'my_requests' ? 'text-purple-600' : 'text-gray-400'}`}>
          <Calendar className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase">Requests</span>
        </button>
        <button onClick={() => setView('profile')} className={`flex flex-col items-center gap-1 ${view === 'profile' ? 'text-purple-600' : 'text-gray-400'}`}>
          <UserIcon className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase">Profile</span>
        </button>
      </nav>
    </div>
  );
};

export default HomeownerDashboard;
