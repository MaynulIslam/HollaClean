import React, { useState } from 'react';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  Briefcase,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Home
} from 'lucide-react';
import { userStorage } from '../utils/storage';

const SERVICE_OPTIONS = [
  'Deep Cleaning',
  'Regular Cleaning',
  'Move-in/Move-out Cleaning',
  'Laundry Service',
  'Ironing',
  'Window Cleaning',
  'Carpet Cleaning'
];

const Register = ({ onNavigate, onLogin, initialUserType }) => {
  const [userType, setUserType] = useState(initialUserType || null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: '',
    // Cleaner-specific
    bio: '',
    hourlyRate: '',
    experience: '',
    services: [],
    isAvailable: true
  });

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Cleaner-specific validation
    if (userType === 'cleaner') {
      if (!formData.hourlyRate || parseFloat(formData.hourlyRate) < 15) {
        newErrors.hourlyRate = 'Hourly rate must be at least $15';
      }
      if (!formData.experience || parseInt(formData.experience) < 0) {
        newErrors.experience = 'Please enter years of experience';
      }
      if (formData.services.length === 0) {
        newErrors.services = 'Please select at least one service';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      // Check if email already exists
      const existingUser = await userStorage.findUserByEmail(formData.email);
      if (existingUser) {
        setErrors({ email: 'An account with this email already exists' });
        setLoading(false);
        return;
      }

      // Create user object
      const userId = `${userType}_${Date.now()}`;
      const user = {
        id: userId,
        type: userType,
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password, // In production, hash this
        phone: formData.phone.replace(/\D/g, ''),
        address: formData.address.trim(),
        createdAt: new Date().toISOString(),
        ...(userType === 'cleaner' && {
          bio: formData.bio.trim(),
          hourlyRate: parseFloat(formData.hourlyRate),
          experience: parseInt(formData.experience),
          services: formData.services,
          rating: 0,
          reviewCount: 0,
          totalEarnings: 0,
          isAvailable: formData.isAvailable
        })
      };

      // Save user
      await userStorage.saveUser(user);
      await userStorage.setCurrentUser(user);

      // Navigate to dashboard
      onLogin(user);
    } catch (err) {
      console.error('Registration error:', err);
      setErrors({ submit: 'Registration failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleServiceToggle = (service) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
    if (errors.services) {
      setErrors(prev => ({ ...prev, services: null }));
    }
  };

  // User type selection screen
  if (!userType) {
    return (
      <div className="min-h-screen p-6 animate-fade-in">
        <button
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2 text-primary-600 mb-6 hover:underline"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <h2 className="text-2xl font-display font-bold text-gray-800 mb-2">Join HollaClean</h2>
        <p className="text-gray-600 mb-8">How would you like to use HollaClean?</p>

        <div className="space-y-4">
          <UserTypeCard
            icon={Home}
            title="I need cleaning"
            description="Find and book trusted cleaning professionals"
            onClick={() => setUserType('homeowner')}
          />
          <UserTypeCard
            icon={Sparkles}
            title="I'm a cleaner"
            description="Grow your cleaning business and find clients"
            onClick={() => setUserType('cleaner')}
          />
        </div>

        <p className="text-center text-gray-500 mt-8">
          Already have an account?{' '}
          <button onClick={() => onNavigate('login')} className="text-primary-600 font-semibold hover:underline">
            Sign In
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 pb-20 animate-fade-in">
      <button
        onClick={() => setUserType(null)}
        className="flex items-center gap-2 text-primary-600 mb-6 hover:underline"
      >
        <ArrowLeft className="w-5 h-5" />
        Back
      </button>

      <h2 className="text-2xl font-display font-bold text-gray-800 mb-2">
        {userType === 'homeowner' ? 'Create Your Account' : 'Join as a Cleaner'}
      </h2>
      <p className="text-gray-600 mb-6">
        {userType === 'homeowner'
          ? 'Start finding cleaning professionals near you'
          : 'Set up your profile and start getting clients'}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Information */}
        <InputField
          icon={User}
          label="Full Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter your full name"
          error={errors.name}
          required
        />

        <InputField
          icon={Mail}
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="your@email.com"
          error={errors.email}
          required
        />

        <InputField
          icon={Phone}
          label="Phone Number"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleChange}
          placeholder="(416) 555-0100"
          error={errors.phone}
          required
        />

        <InputField
          icon={MapPin}
          label={userType === 'homeowner' ? 'Home Address' : 'Your Address'}
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="123 Main St, Toronto, ON"
          error={errors.address}
          required
        />

        <InputField
          icon={Lock}
          label="Password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Minimum 6 characters"
          error={errors.password}
          required
        />

        <InputField
          icon={Lock}
          label="Confirm Password"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Re-enter your password"
          error={errors.confirmPassword}
          required
        />

        {/* Cleaner-specific fields */}
        {userType === 'cleaner' && (
          <>
            <div className="pt-4 border-t border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-4">Professional Details</h3>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">About Me (Optional)</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Tell clients about yourself and your cleaning experience..."
                className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none resize-none"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InputField
                icon={DollarSign}
                label="Hourly Rate ($)"
                name="hourlyRate"
                type="number"
                value={formData.hourlyRate}
                onChange={handleChange}
                placeholder="35"
                error={errors.hourlyRate}
                min="15"
                required
              />

              <InputField
                icon={Clock}
                label="Years Experience"
                name="experience"
                type="number"
                value={formData.experience}
                onChange={handleChange}
                placeholder="3"
                error={errors.experience}
                min="0"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Services Offered *</label>
              <div className="grid grid-cols-2 gap-2">
                {SERVICE_OPTIONS.map(service => (
                  <button
                    key={service}
                    type="button"
                    onClick={() => handleServiceToggle(service)}
                    className={`p-3 rounded-xl text-sm font-medium transition-all ${
                      formData.services.includes(service)
                        ? 'bg-primary-100 text-primary-700 border-2 border-primary-400'
                        : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                    }`}
                  >
                    {formData.services.includes(service) && (
                      <CheckCircle className="w-4 h-4 inline mr-1" />
                    )}
                    {service}
                  </button>
                ))}
              </div>
              {errors.services && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.services}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium text-gray-800">Available for Jobs</p>
                <p className="text-sm text-gray-500">Turn off when you're busy</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="isAvailable"
                  checked={formData.isAvailable}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </>
        )}

        {errors.submit && (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
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
              Creating Account...
            </span>
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      <p className="text-center text-gray-500 mt-6">
        Already have an account?{' '}
        <button onClick={() => onNavigate('login')} className="text-primary-600 font-semibold hover:underline">
          Sign In
        </button>
      </p>
    </div>
  );
};

const UserTypeCard = ({ icon: Icon, title, description, onClick }) => (
  <button
    onClick={onClick}
    className="w-full p-6 bg-white rounded-2xl border-2 border-gray-100 hover:border-primary-400 text-left transition-all flex items-center gap-4 shadow-soft hover:shadow-md"
  >
    <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center">
      <Icon className="w-7 h-7 text-primary-600" />
    </div>
    <div className="flex-1">
      <h3 className="font-semibold text-gray-800 text-lg">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  </button>
);

const InputField = ({ icon: Icon, label, error, ...props }) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <div className="relative">
      <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        {...props}
        className={`w-full pl-12 pr-4 py-4 rounded-xl border-2 ${
          error ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-primary-400'
        } focus:ring-2 focus:ring-primary-100 outline-none transition-colors`}
      />
    </div>
    {error && (
      <p className="text-red-500 text-sm flex items-center gap-1">
        <AlertCircle className="w-4 h-4" />
        {error}
      </p>
    )}
  </div>
);

export default Register;
