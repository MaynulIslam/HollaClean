import React, { useState } from 'react';
import { Button, Input, Card } from './UI';
import { api, ApiError } from '../utils/api';
import { User } from '../types';
import { ArrowLeft, Shield, Eye, EyeOff } from 'lucide-react';

interface AdminLoginProps {
  onBack: () => void;
  onAdminLogin: (user: User) => void;
}

/**
 * Dedicated admin sign-in screen.
 *
 * This is a real Firebase email/password login (not a shared passcode): it
 * authenticates the account, then only grants access if the user's profile is
 * type 'admin'. The server independently enforces the same check via
 * requireRole('admin'), so this screen is just the matching front door.
 */
const AdminLogin: React.FC<AdminLoginProps> = ({ onBack, onAdminLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const user = await api.auth.login(cleanEmail, password);
      if (user.type !== 'admin') {
        // Valid account, but not an administrator — reject and sign back out.
        api.auth.logout();
        setError('This account does not have administrator access.');
        setIsLoading(false);
        return;
      }
      onAdminLogin(user);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('Invalid email or password.');
      } else if (err instanceof ApiError && err.status === 0) {
        setError('Could not reach the server. Please check your connection.');
      } else {
        setError('Sign-in failed. Please try again.');
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-6 py-12">
      <div className="w-full max-w-md">
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
              <Shield className="w-8 h-8 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold font-outfit text-gray-900">Admin Console</h2>
            <p className="text-gray-500 mt-1">Sign in with an administrator account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <Input
              label="Email Address"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e: any) => setEmail(e.target.value)}
              required
            />

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
                'Sign In to Console'
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center text-xs text-gray-400">
            Restricted area — authorized administrators only.
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;
