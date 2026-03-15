
import React, { useState, useEffect } from 'react';
import { Card, Button, Input } from './UI';
import { storage } from '../utils/storage';
import { User, ServiceOffer } from '../types';
import { createSession } from '../utils/auth';
import { CONFIG } from '../utils/config';
import { GoogleUserInfo } from '../utils/firebase';
import { NotificationHelpers } from '../utils/notifications';
import { ExternalNotify, requestPushPermission } from '../utils/externalNotifications';
import { notifyAdmin } from '../utils/adminNotifications';
import {
  ArrowLeft, ArrowRight, Home, Briefcase, Sparkles, Phone, MapPin,
  CheckCircle, DollarSign, Star, Shield, Building, User as UserIcon,
  ChevronDown, Clock
} from 'lucide-react';

interface ProfileCompletionProps {
  googleUser: GoogleUserInfo;
  onComplete: (user: User) => void;
  onBack: () => void;
}

const ProfileCompletion: React.FC<ProfileCompletionProps> = ({ googleUser, onComplete, onBack }) => {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<'homeowner' | 'cleaner' | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Split Google display name
  const nameParts = (googleUser.displayName || '').split(' ');
  const defaultFirst = nameParts[0] || '';
  const defaultLast = nameParts.slice(1).join(' ') || '';

  const [formData, setFormData] = useState({
    firstName: defaultFirst,
    lastName: defaultLast,
    phone: '',
    streetAddress: '',
    apartment: '',
    city: 'Toronto',
    province: 'Ontario',
    country: 'Canada',
    bio: '',
    hourlyRate: CONFIG.pricing.defaultHourlyRate,
    experience: 1,
  });

  const [services, setServices] = useState<string[]>([]);
  const [serviceOptions, setServiceOptions] = useState<string[]>([]);

  const totalSteps = role === 'cleaner' ? 3 : 2;

  useEffect(() => {
    const loadServices = async () => {
      const saved: ServiceOffer[] = await storage.get('config:services') || [];
      if (saved.length > 0) {
        setServiceOptions(saved.map(s => s.name));
      }
    };
    loadServices();
  }, []);

  const handleToggleService = (service: string) => {
    setServices(prev =>
      prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]
    );
  };

  const validateStep = (currentStep: number): boolean => {
    setError('');

    if (currentStep === 1) {
      if (!role) {
        setError('Please select your role');
        return false;
      }
    }

    if (currentStep === 2) {
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        setError('Please enter your full name');
        return false;
      }
      if (!formData.phone.trim() || formData.phone.replace(/\D/g, '').length < 10) {
        setError('Please enter a valid phone number (at least 10 digits)');
        return false;
      }
      if (!formData.streetAddress.trim()) {
        setError('Please enter your street address');
        return false;
      }
      if (!formData.city.trim()) {
        setError('Please enter your city');
        return false;
      }
    }

    if (currentStep === 3 && role === 'cleaner') {
      if (services.length === 0) {
        setError('Please select at least one service you offer');
        return false;
      }
      if (formData.hourlyRate < CONFIG.pricing.minimumHourlyRate || formData.hourlyRate > CONFIG.pricing.maximumHourlyRate) {
        setError(`Hourly rate must be between $${CONFIG.pricing.minimumHourlyRate} and $${CONFIG.pricing.maximumHourlyRate}`);
        return false;
      }
    }

    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setError('');
    if (step === 1) {
      onBack();
    } else {
      setStep(step - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(step) || !role) return;

    setIsLoading(true);
    setError('');

    try {
      // Check if there's an existing user with this email (link accounts)
      const cleanEmail = googleUser.email.trim().toLowerCase();
      const keys = await storage.list('user:');
      let existingUser: User | null = null;

      for (const key of keys) {
        const existing = await storage.get(key);
        if (existing && existing.email?.toLowerCase() === cleanEmail) {
          existingUser = existing;
          break;
        }
      }

      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
      const fullAddress = `${formData.streetAddress}${formData.apartment ? ', ' + formData.apartment : ''}, ${formData.city}, ${formData.province}, ${formData.country}`;

      if (existingUser) {
        // Link Google to existing email/password account
        existingUser.firebaseUid = googleUser.uid;
        existingUser.authProvider = 'google';
        existingUser.photoURL = googleUser.photoURL || undefined;
        existingUser.emailVerified = true;
        existingUser.profileComplete = true;
        await storage.set(`user:${existingUser.id}`, existingUser);

        const session = createSession(existingUser.id);
        await storage.set('session', session);
        await storage.set('currentUser', existingUser);
        onComplete(existingUser);
        return;
      }

      const newUser: User = {
        id: `user_${Date.now()}`,
        type: role,
        name: fullName,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: cleanEmail,
        phone: formData.phone,
        address: fullAddress,
        streetAddress: formData.streetAddress,
        apartment: formData.apartment,
        city: formData.city,
        province: formData.province,
        country: formData.country,
        bio: role === 'cleaner' ? formData.bio : undefined,
        hourlyRate: role === 'cleaner' ? formData.hourlyRate : undefined,
        experience: role === 'cleaner' ? formData.experience : undefined,
        services: role === 'cleaner' ? services : undefined,
        rating: role === 'cleaner' ? 5.0 : undefined,
        reviewCount: role === 'cleaner' ? 0 : undefined,
        totalEarnings: role === 'cleaner' ? 0 : undefined,
        isAvailable: role === 'cleaner' ? true : undefined,
        emailVerified: true, // Google email is pre-verified
        phoneVerified: false,
        addressVerified: false,
        authProvider: 'google',
        firebaseUid: googleUser.uid,
        photoURL: googleUser.photoURL || undefined,
        profileComplete: true,
        createdAt: new Date().toISOString()
      };

      await storage.set(`user:${newUser.id}`, newUser);

      const session = createSession(newUser.id);
      await storage.set('session', session);
      await storage.set('currentUser', newUser);

      // Send verification reminder (phone + address still need verifying)
      await NotificationHelpers.verificationReminder(newUser.id);
      requestPushPermission();
      ExternalNotify.verificationReminder(cleanEmail, fullName);

      // Notify admin about new registration
      notifyAdmin('new_registration', {
        userName: fullName,
        userEmail: cleanEmail,
        userType: role,
      });

      onComplete(newUser);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button onClick={prevStep} className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </button>
          <div className="flex items-center gap-2">
            <img src="/Holla Clean Logo.png" alt="HollaClean" className="h-14 w-auto mix-blend-multiply" />
          </div>
          <div className="w-16" />
        </div>
      </header>

      <div className="flex-1 p-4 md:p-8">
        <div className="max-w-lg mx-auto">
          {/* Google User Info */}
          <div className="text-center mb-6">
            {googleUser.photoURL && (
              <img
                src={googleUser.photoURL}
                alt=""
                className="w-16 h-16 rounded-full mx-auto mb-3 border-2 border-purple-200"
              />
            )}
            <h2 className="text-2xl font-bold font-outfit text-gray-900">
              Welcome, {googleUser.displayName || 'there'}!
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Let's set up your HollaClean profile
            </p>
            <p className="text-xs text-gray-400 mt-1">{googleUser.email}</p>
          </div>

          {/* Progress */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  i + 1 < step ? 'bg-green-500 text-white' :
                  i + 1 === step ? 'bg-purple-600 text-white scale-110' :
                  'bg-gray-200 text-gray-400'
                }`}>
                  {i + 1 < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </div>
                {i < totalSteps - 1 && (
                  <div className={`w-12 h-1 rounded ${i + 1 < step ? 'bg-green-500' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Step 1: Choose Role */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <h3 className="text-lg font-bold text-gray-900 text-center mb-6">How will you use HollaClean?</h3>

                <div className="grid grid-cols-1 gap-4">
                  <button
                    type="button"
                    onClick={() => setRole('homeowner')}
                    className={`p-6 rounded-2xl border-2 text-left transition-all ${
                      role === 'homeowner'
                        ? 'border-purple-500 bg-purple-50 shadow-lg shadow-purple-100'
                        : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                        role === 'homeowner' ? 'bg-purple-500 text-white' : 'bg-purple-100 text-purple-600'
                      }`}>
                        <Home className="w-7 h-7" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-bold text-gray-900">I need cleaning</h4>
                          {role === 'homeowner' && <CheckCircle className="w-5 h-5 text-purple-600" />}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Book trusted, verified cleaners for your home. Post requests and get matched instantly.
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('cleaner')}
                    className={`p-6 rounded-2xl border-2 text-left transition-all ${
                      role === 'cleaner'
                        ? 'border-pink-500 bg-pink-50 shadow-lg shadow-pink-100'
                        : 'border-gray-200 hover:border-pink-300 hover:bg-pink-50/50'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                        role === 'cleaner' ? 'bg-pink-500 text-white' : 'bg-pink-100 text-pink-600'
                      }`}>
                        <Briefcase className="w-7 h-7" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-bold text-gray-900">I provide cleaning</h4>
                          {role === 'cleaner' && <CheckCircle className="w-5 h-5 text-pink-600" />}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Earn money by joining Ontario's cleaning marketplace. Set your rates and schedule.
                        </p>
                      </div>
                    </div>
                  </button>
                </div>

                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={!role}
                  className="w-full mt-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl disabled:opacity-50"
                >
                  Continue <ArrowRight className="w-4 h-4 inline ml-1" />
                </Button>
              </div>
            )}

            {/* Step 2: Contact Info + Address */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Contact & Address</h3>
                <p className="text-sm text-gray-500 text-center mb-6">We need these details to match you with local services</p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">First Name</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                        placeholder="First name"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      placeholder="Last name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      placeholder="(416) 555-0199"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Street Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={formData.streetAddress}
                      onChange={e => setFormData({ ...formData, streetAddress: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      placeholder="123 Main Street"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Apartment / Unit (optional)</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={formData.apartment}
                      onChange={e => setFormData({ ...formData, apartment: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      placeholder="Apt 4B"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={e => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      placeholder="Toronto"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Province</label>
                    <div className="relative">
                      <select
                        value={formData.province}
                        onChange={e => setFormData({ ...formData, province: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm appearance-none bg-white"
                      >
                        <option value="Ontario">Ontario</option>
                        <option value="Quebec">Quebec</option>
                        <option value="British Columbia">British Columbia</option>
                        <option value="Alberta">Alberta</option>
                        <option value="Manitoba">Manitoba</option>
                        <option value="Saskatchewan">Saskatchewan</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={formData.country}
                    disabled
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 text-sm"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200"
                  >
                    <ArrowLeft className="w-4 h-4 inline mr-1" /> Back
                  </Button>
                  {role === 'homeowner' ? (
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl disabled:opacity-50"
                    >
                      {isLoading ? 'Creating...' : 'Complete Setup'}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl"
                    >
                      Continue <ArrowRight className="w-4 h-4 inline ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Professional Profile (Cleaners only) */}
            {step === 3 && role === 'cleaner' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Professional Profile</h3>
                <p className="text-sm text-gray-500 text-center mb-6">Set your rates and select your services</p>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Bio (optional)</label>
                  <textarea
                    value={formData.bio}
                    onChange={e => setFormData({ ...formData, bio: e.target.value.slice(0, CONFIG.validation.bio.maxLength) })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm resize-none"
                    placeholder="Tell homeowners about yourself and your experience..."
                  />
                  <p className="text-xs text-gray-400 text-right mt-1">{formData.bio.length}/{CONFIG.validation.bio.maxLength}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      <DollarSign className="w-4 h-4 inline text-gray-400" /> Hourly Rate (CAD)
                    </label>
                    <input
                      type="number"
                      min={CONFIG.pricing.minimumHourlyRate}
                      max={CONFIG.pricing.maximumHourlyRate}
                      value={formData.hourlyRate}
                      onChange={e => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    />
                    <p className="text-xs text-gray-400 mt-1">${CONFIG.pricing.minimumHourlyRate}-${CONFIG.pricing.maximumHourlyRate}/hr</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      <Clock className="w-4 h-4 inline text-gray-400" /> Experience
                    </label>
                    <div className="relative">
                      <select
                        value={formData.experience}
                        onChange={e => setFormData({ ...formData, experience: Number(e.target.value) })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm appearance-none bg-white"
                      >
                        <option value={0}>Less than 1 year</option>
                        <option value={1}>1-2 years</option>
                        <option value={3}>3-5 years</option>
                        <option value={5}>5-10 years</option>
                        <option value={10}>10+ years</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Services You Offer</label>
                  <div className="flex flex-wrap gap-2">
                    {serviceOptions.map(service => (
                      <button
                        key={service}
                        type="button"
                        onClick={() => handleToggleService(service)}
                        className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                          services.includes(service)
                            ? 'bg-pink-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {services.includes(service) && <CheckCircle className="w-3.5 h-3.5 inline mr-1" />}
                        {service}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Earnings Preview */}
                <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <span className="font-bold text-green-800">Earnings Preview</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-green-600">Per 3-hour job</p>
                      <p className="font-bold text-green-800">${((Number(formData.hourlyRate) || 0) * 3 * CONFIG.pricing.cleanerPayoutRate).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-green-600">Weekly (20 hours)</p>
                      <p className="font-bold text-green-800">${((Number(formData.hourlyRate) || 0) * 20 * CONFIG.pricing.cleanerPayoutRate).toFixed(2)}</p>
                    </div>
                  </div>
                  <p className="text-xs text-green-500 mt-2">Based on {Math.round(CONFIG.pricing.cleanerPayoutRate * 100)}% payout rate</p>
                </Card>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200"
                  >
                    <ArrowLeft className="w-4 h-4 inline mr-1" /> Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-3 bg-gradient-to-r from-pink-600 to-orange-500 text-white font-semibold rounded-xl disabled:opacity-50"
                  >
                    {isLoading ? 'Creating...' : 'Complete Setup'}
                  </Button>
                </div>
              </div>
            )}
          </form>

          {/* Trust indicators */}
          <div className="flex items-center justify-center gap-4 mt-8 text-xs text-gray-400">
            <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> Secure</span>
            <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5" /> Ontario, Canada</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletion;
