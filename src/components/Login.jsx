import React, { useState } from 'react';
import {
  ArrowLeft,
  Mail,
  Lock,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react';
import { userStorage } from '../utils/storage';

const Login = ({ onNavigate, onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      // Find user by email
      const user = await userStorage.findUserByEmail(formData.email);

      if (!user) {
        setErrors({ submit: 'No account found with this email' });
        setLoading(false);
        return;
      }

      // Verify password
      if (user.password !== formData.password) {
        setErrors({ submit: 'Incorrect password' });
        setLoading(false);
        return;
      }

      // Set as current user and navigate
      await userStorage.setCurrentUser(user);
      onLogin(user);
    } catch (err) {
      console.error('Login error:', err);
      setErrors({ submit: 'Login failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name] || errors.submit) {
      setErrors(prev => ({ ...prev, [name]: null, submit: null }));
    }
  };

  // Demo login helper
  const handleDemoLogin = async (type) => {
    setLoading(true);
    try {
      const demoEmail = type === 'cleaner' ? 'sarah@example.com' : 'john@example.com';
      const user = await userStorage.findUserByEmail(demoEmail);
      if (user) {
        await userStorage.setCurrentUser(user);
        onLogin(user);
      } else {
        setErrors({ submit: 'Demo user not found. Please register.' });
      }
    } catch (err) {
      setErrors({ submit: 'Demo login failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 flex flex-col animate-fade-in">
      <button
        onClick={() => onNavigate('landing')}
        className="flex items-center gap-2 text-primary-600 mb-6 hover:underline"
      >
        <ArrowLeft className="w-5 h-5" />
        Back
      </button>

      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-display font-bold text-gray-800">Welcome Back</h2>
          <p className="text-gray-600 mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                className={`w-full pl-12 pr-4 py-4 rounded-xl border-2 ${
                  errors.email ? 'border-red-300' : 'border-gray-200'
                } focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-colors`}
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-sm flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.email}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className={`w-full pl-12 pr-12 py-4 rounded-xl border-2 ${
                  errors.password ? 'border-red-300' : 'border-gray-200'
                } focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-colors`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.password}
              </p>
            )}
          </div>

          <div className="text-right">
            <button
              type="button"
              className="text-sm text-primary-600 hover:underline"
              onClick={() => alert('Please contact admin at admin@hollaclean.com')}
            >
              Forgot Password?
            </button>
          </div>

          {errors.submit && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {errors.submit}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-primary-600 to-secondary-500 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-50 disabled:transform-none"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing In...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Demo Logins */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-center text-sm text-gray-500 mb-3">Quick Demo Access</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleDemoLogin('homeowner')}
              disabled={loading}
              className="py-3 px-4 bg-primary-50 text-primary-700 rounded-xl font-medium text-sm hover:bg-primary-100 transition-colors disabled:opacity-50"
            >
              Demo Homeowner
            </button>
            <button
              onClick={() => handleDemoLogin('cleaner')}
              disabled={loading}
              className="py-3 px-4 bg-secondary-50 text-secondary-700 rounded-xl font-medium text-sm hover:bg-secondary-100 transition-colors disabled:opacity-50"
            >
              Demo Cleaner
            </button>
          </div>
        </div>

        <p className="text-center text-gray-500 mt-6">
          Don't have an account?{' '}
          <button
            onClick={() => onNavigate('register')}
            className="text-primary-600 font-semibold hover:underline"
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
