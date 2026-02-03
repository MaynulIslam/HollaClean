
import React, { useState } from 'react';
import { Button, Input, Card } from './UI';
import { storage } from '../utils/storage';
import { User } from '../types';
import {
  ArrowLeft, Lock, Mail, Eye, EyeOff, Sparkles,
  ShieldCheck, CheckCircle, Home, Briefcase
} from 'lucide-react';

interface LoginProps {
  onBack: () => void;
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onBack, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate network delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));

    const cleanEmail = email.trim().toLowerCase();
    const keys = await storage.list('user:');
    let foundUser: User | null = null;

    for (const key of keys) {
      const user = await storage.get(key);
      if (user && user.email.toLowerCase() === cleanEmail) {
        foundUser = user;
        break;
      }
    }

    if (foundUser && foundUser.password === password) {
      await storage.set('currentUser', foundUser);
      onLogin(foundUser);
    } else {
      setError('Invalid email or password. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <Sparkles className="w-10 h-10 text-white" />
            <span className="text-3xl font-bold font-outfit text-white">HollaClean</span>
          </div>
          <h1 className="text-4xl font-bold font-outfit text-white mb-4">
            Welcome Back to Ontario's Trusted Cleaning Marketplace
          </h1>
          <p className="text-white/80 text-lg">
            Sign in to manage your bookings, track cleanings, and connect with verified professionals.
          </p>
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3 text-white/90">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span>Verified & background-checked cleaners</span>
          </div>
          <div className="flex items-center gap-3 text-white/90">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
            <span>Transparent pricing, no hidden fees</span>
          </div>
          <div className="flex items-center gap-3 text-white/90">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <span>Secure payments & data protection</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <Sparkles className="w-8 h-8 text-purple-600" />
            <span className="text-2xl font-bold font-outfit animate-shine">HollaClean</span>
          </div>

          <Card className="p-8">
            <button
              onClick={onBack}
              className="mb-6 flex items-center gap-2 text-gray-500 hover:text-purple-600 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-semibold">Back to Home</span>
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold font-outfit text-gray-900">Welcome Back</h2>
              <p className="text-gray-500 mt-1">Sign in to your HollaClean account</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="relative">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e: any) => setEmail(e.target.value)}
                  required
                />
                <Mail className="absolute right-4 top-9 w-5 h-5 text-gray-400" />
              </div>

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e: any) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-9 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-red-500 text-sm">!</span>
                  </div>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
                <button type="button" className="text-sm text-purple-600 font-semibold hover:underline">
                  Forgot Password?
                </button>
              </div>

              <Button type="submit" className="w-full py-4" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="my-8 flex items-center gap-4">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="text-sm text-gray-400">New to HollaClean?</span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            {/* Register Options */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onBack()}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-purple-200 text-purple-600 font-semibold hover:bg-purple-50 transition-colors"
              >
                <Home className="w-4 h-4" />
                <span className="text-sm">Homeowner</span>
              </button>
              <button
                onClick={() => onBack()}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-pink-200 text-pink-600 font-semibold hover:bg-pink-50 transition-colors"
              >
                <Briefcase className="w-4 h-4" />
                <span className="text-sm">Cleaner</span>
              </button>
            </div>

            {/* Trust Footer */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Secure Login
                </span>
                <span>•</span>
                <span>256-bit Encryption</span>
                <span>•</span>
                <span>Ontario, Canada</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
