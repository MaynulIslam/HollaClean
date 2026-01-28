
import React from 'react';
import { Button, Card } from './UI';
import { Sparkles, Home, Briefcase, ShieldCheck } from 'lucide-react';

interface LandingProps {
  onAction: (action: 'login' | 'register' | 'admin', role?: string) => void;
}

const Landing: React.FC<LandingProps> = ({ onAction }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Sparkles className="w-10 h-10 text-purple-600 animate-zoom-pulse" />
          <h1 className="text-5xl font-bold font-outfit animate-shine">
            HollaClean
          </h1>
        </div>
        <div className="text-xl text-gray-600 max-w-lg mx-auto leading-relaxed font-bold">
          <p>Clean your place anytime anywhere</p>
          <p>Canadian No. 1 cleaning service</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        <Card className="flex flex-col items-center text-center group hover:scale-[1.02] transition-transform">
          <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center mb-6 group-hover:bg-purple-600 transition-colors">
            <Home className="w-8 h-8 text-purple-600 group-hover:text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Homeowner</h2>
          <p className="text-gray-500 mb-8">Professional cleaning for your home, at your schedule.</p>
          <Button onClick={() => onAction('register', 'homeowner')} className="w-full mb-4">
            Find a Cleaner
          </Button>
          <button onClick={() => onAction('login')} className="text-purple-600 font-semibold text-sm hover:underline">
            Login to your account
          </button>
        </Card>

        <Card className="flex flex-col items-center text-center group hover:scale-[1.02] transition-transform">
          <div className="w-16 h-16 rounded-2xl bg-pink-100 flex items-center justify-center mb-6 group-hover:bg-pink-600 transition-colors">
            <Briefcase className="w-8 h-8 text-pink-600 group-hover:text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Cleaner</h2>
          <p className="text-gray-500 mb-8">Build your business, set your rates, and be your own boss.</p>
          <Button onClick={() => onAction('register', 'cleaner')} className="w-full mb-4 bg-gradient-to-r from-pink-600 to-orange-500">
            Start Earning
          </Button>
          <button onClick={() => onAction('login')} className="text-pink-600 font-semibold text-sm hover:underline">
            Login to your account
          </button>
        </Card>
      </div>

      <button 
        onClick={() => onAction('admin')}
        className="mt-12 flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <ShieldCheck className="w-4 h-4" />
        <span className="text-xs uppercase tracking-widest font-bold">Admin Portal</span>
      </button>
    </div>
  );
};

export default Landing;
