
import React, { useState, useEffect } from 'react';
import { Button, Input, Card } from './UI';
import { storage } from '../utils/storage';
import { User, ServiceOffer } from '../types';
import { hashPassword, validatePassword, createSession } from '../utils/auth';
import { CONFIG } from '../utils/config';
import { NotificationHelpers } from '../utils/notifications';
import { ExternalNotify, requestPushPermission as requestPush } from '../utils/externalNotifications';
import { notifyAdmin } from '../utils/adminNotifications';
import {
  ArrowLeft, UserPlus, Sparkles, Home, Briefcase, Mail, Phone,
  MapPin, Lock, Eye, EyeOff, CheckCircle, Clock, DollarSign,
  Star, Shield, Award, BadgeCheck, Building, User as UserIcon
} from 'lucide-react';

interface RegisterProps {
  role: 'homeowner' | 'cleaner';
  onBack: () => void;
  onRegister: (user: User) => void;
  onGoogleSignIn?: () => Promise<void>;
}

const Register: React.FC<RegisterProps> = ({ role, onBack, onRegister, onGoogleSignIn }) => {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');

  const handleGoogleSignUp = async () => {
    if (!onGoogleSignIn) return;
    setIsGoogleLoading(true);
    setGoogleError('');
    try {
      await onGoogleSignIn();
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setGoogleError(err?.code === 'auth/popup-blocked'
          ? 'Please allow popups for this site to sign up with Google.'
          : 'Google sign-up failed. Please try again.'
        );
      }
      setIsGoogleLoading(false);
    }
  };
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
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
  const [error, setError] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
    setPasswordErrors([]);

    if (currentStep === 1) {
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        setError('Please enter your full name');
        return false;
      }
      if (!formData.email.trim() || !formData.email.includes('@')) {
        setError('Please enter a valid email address');
        return false;
      }

      // Validate password strength
      const validation = validatePassword(formData.password);
      if (!validation.isValid) {
        setPasswordErrors(validation.errors);
        setError('Please fix the password issues below');
        return false;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
      if (!formData.phone.trim() || formData.phone.replace(/\D/g, '').length < 10) {
        setError('Please enter a valid phone number (at least 10 digits)');
        return false;
      }
    }

    if (currentStep === 2) {
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
    setPasswordErrors([]);
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep(step)) return;

    setIsLoading(true);
    setError('');

    try {
      const cleanEmail = formData.email.trim().toLowerCase();
      const keys = await storage.list('user:');
      for (const key of keys) {
        const existing = await storage.get(key);
        if (existing && existing.email.toLowerCase() === cleanEmail) {
          setError('This email is already registered. Please use a different email or login.');
          setIsLoading(false);
          return;
        }
      }

      // Hash the password before storing
      const hashedPassword = await hashPassword(formData.password);

      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
      const fullAddress = `${formData.streetAddress}${formData.apartment ? ', ' + formData.apartment : ''}, ${formData.city}, ${formData.province}, ${formData.country}`;

      const newUser: User = {
        id: `user_${Date.now()}`,
        type: role,
        name: fullName,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: cleanEmail,
        password: hashedPassword, // Store hashed password
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
        emailVerified: false,
        phoneVerified: false,
        addressVerified: false,
        authProvider: 'email',
        profileComplete: true,
        createdAt: new Date().toISOString()
      };

      await storage.set(`user:${newUser.id}`, newUser);

      // Create session
      const session = createSession(newUser.id);
      await storage.set('session', session);
      await storage.set('currentUser', newUser);

      // Send verification reminder notification (in-app)
      await NotificationHelpers.verificationReminder(newUser.id);

      // Request push permission + send welcome email & push notification
      requestPush();
      ExternalNotify.verificationReminder(cleanEmail, `${formData.firstName.trim()} ${formData.lastName.trim()}`);

      // Notify admin about new registration
      notifyAdmin('new_registration', {
        userName: fullName,
        userEmail: cleanEmail,
        userType: role,
      });

      onRegister(newUser);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const isHomeowner = role === 'homeowner';
  const gradientFrom = isHomeowner ? 'from-purple-600' : 'from-pink-600';
  const gradientTo = isHomeowner ? 'to-pink-600' : 'to-orange-500';

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding (hidden on mobile) */}
      <div className={`hidden lg:flex lg:w-2/5 bg-gradient-to-br ${gradientFrom} ${gradientTo} p-12 flex-col justify-between relative overflow-hidden`}>
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <Sparkles className="w-10 h-10 text-white" />
            <span className="text-3xl font-bold font-outfit text-white">HollaClean</span>
          </div>

          {isHomeowner ? (
            <>
              <h1 className="text-4xl font-bold font-outfit text-white mb-4">
                Find Trusted Cleaners for Your Home
              </h1>
              <p className="text-white/80 text-lg">
                Join thousands of Ontario homeowners who trust HollaClean for professional, reliable cleaning services.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-4xl font-bold font-outfit text-white mb-4">
                Start Your Cleaning Business Today
              </h1>
              <p className="text-white/80 text-lg">
                Set your own rates, choose your hours, and keep 80% of every job. Join Ontario's fastest-growing cleaning platform.
              </p>
            </>
          )}
        </div>

        <div className="relative z-10 space-y-4">
          {isHomeowner ? (
            <>
              <div className="flex items-center gap-3 text-white/90">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <BadgeCheck className="w-5 h-5" />
                </div>
                <span>Verified & background-checked cleaners</span>
              </div>
              <div className="flex items-center gap-3 text-white/90">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
                <span>Transparent pricing, no hidden fees</span>
              </div>
              <div className="flex items-center gap-3 text-white/90">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <span>Secure payments & satisfaction guarantee</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 text-white/90">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
                <span>Keep {CONFIG.pricing.cleanerPayoutRate * 100}% of every job — industry-leading payout</span>
              </div>
              <div className="flex items-center gap-3 text-white/90">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <span>Flexible hours — work when you want</span>
              </div>
              <div className="flex items-center gap-3 text-white/90">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Star className="w-5 h-5" />
                </div>
                <span>Build your reputation & grow your business</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right Panel - Registration Form */}
      <div className="w-full lg:w-3/5 flex items-start justify-center px-6 py-8 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 overflow-y-auto">
        <div className="w-full max-w-xl">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-6">
            <Sparkles className={`w-8 h-8 ${isHomeowner ? 'text-purple-600' : 'text-pink-600'}`} />
            <span className="text-2xl font-bold font-outfit animate-shine">HollaClean</span>
          </div>

          <Card className="p-6 md:p-8">
            {/* Back Button */}
            <button
              onClick={step > 1 ? prevStep : onBack}
              className="mb-6 flex items-center gap-2 text-gray-500 hover:text-purple-600 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-semibold">{step > 1 ? 'Previous Step' : 'Back to Home'}</span>
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <div className={`w-16 h-16 bg-gradient-to-br ${isHomeowner ? 'from-purple-100 to-pink-100' : 'from-pink-100 to-orange-100'} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                {isHomeowner ? (
                  <Home className="w-8 h-8 text-purple-600" />
                ) : (
                  <Briefcase className="w-8 h-8 text-pink-600" />
                )}
              </div>
              <h2 className="text-2xl font-bold font-outfit text-gray-900">
                {isHomeowner ? 'Create Homeowner Account' : 'Join as a Cleaning Professional'}
              </h2>
              <p className="text-gray-500 mt-1">
                {isHomeowner
                  ? 'Book trusted cleaners for your home in Ontario'
                  : 'Start earning on your own schedule in Ontario'}
              </p>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {Array.from({ length: totalSteps }).map((_, idx) => (
                <React.Fragment key={idx}>
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      idx + 1 < step
                        ? `bg-gradient-to-r ${gradientFrom} ${gradientTo} text-white`
                        : idx + 1 === step
                        ? `bg-gradient-to-r ${gradientFrom} ${gradientTo} text-white ring-4 ${isHomeowner ? 'ring-purple-200' : 'ring-pink-200'}`
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {idx + 1 < step ? <CheckCircle className="w-5 h-5" /> : idx + 1}
                  </div>
                  {idx < totalSteps - 1 && (
                    <div className={`w-12 h-1 rounded-full ${idx + 1 < step ? `bg-gradient-to-r ${gradientFrom} ${gradientTo}` : 'bg-gray-200'}`}></div>
                  )}
                </React.Fragment>
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              {/* Step 1: Account Information */}
              {step === 1 && (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                  {/* Google Sign-Up Option */}
                  {onGoogleSignIn && (
                    <>
                      <button
                        type="button"
                        onClick={handleGoogleSignUp}
                        disabled={isGoogleLoading || isLoading}
                        className="w-full py-3 px-4 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 transition-colors flex items-center justify-center gap-3 font-semibold text-gray-700 disabled:opacity-50"
                      >
                        {isGoogleLoading ? (
                          <span className="flex items-center gap-2">
                            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Connecting...
                          </span>
                        ) : (
                          <>
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            Sign up with Google
                          </>
                        )}
                      </button>
                      {googleError && (
                        <p className="text-sm text-red-500 text-center">{googleError}</p>
                      )}
                      <div className="flex items-center gap-4">
                        <div className="flex-1 h-px bg-gray-200"></div>
                        <span className="text-sm text-gray-400">OR continue with email</span>
                        <div className="flex-1 h-px bg-gray-200"></div>
                      </div>
                    </>
                  )}

                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <UserIcon className="w-4 h-4" />
                    Account Information
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="First Name"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={(e: any) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                    />
                    <Input
                      label="Last Name"
                      placeholder="Smith"
                      value={formData.lastName}
                      onChange={(e: any) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="relative">
                    <Input
                      label="Email Address"
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e: any) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                    <Mail className="absolute right-4 top-9 w-5 h-5 text-gray-400" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <Input
                        label="Password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min. 8 characters"
                        value={formData.password}
                        onChange={(e: any) => setFormData({ ...formData, password: e.target.value })}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-9 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <div className="relative">
                      <Input
                        label="Confirm Password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Re-enter password"
                        value={formData.confirmPassword}
                        onChange={(e: any) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-9 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Password Requirements */}
                  {passwordErrors.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                      <p className="text-xs font-semibold text-amber-800 mb-2">Password requirements:</p>
                      <ul className="text-xs text-amber-700 space-y-1">
                        {passwordErrors.map((err, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <span className="w-1 h-1 bg-amber-500 rounded-full"></span>
                            {err}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="relative">
                    <Input
                      label="Phone Number"
                      type="tel"
                      placeholder="(416) 555-0199"
                      value={formData.phone}
                      onChange={(e: any) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                    <Phone className="absolute right-4 top-9 w-5 h-5 text-gray-400" />
                  </div>
                </div>
              )}

              {/* Step 2: Address Information */}
              {step === 2 && (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {isHomeowner ? 'Service Address' : 'Your Location'}
                  </h3>

                  <Input
                    label="Street Address"
                    placeholder="123 King Street West"
                    value={formData.streetAddress}
                    onChange={(e: any) => setFormData({ ...formData, streetAddress: e.target.value })}
                    required
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Apartment/Unit (Optional)"
                      placeholder="Apt 4B"
                      value={formData.apartment}
                      onChange={(e: any) => setFormData({ ...formData, apartment: e.target.value })}
                    />
                    <Input
                      label="City"
                      placeholder="Toronto"
                      value={formData.city}
                      onChange={(e: any) => setFormData({ ...formData, city: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 ml-1 block mb-1">Province</label>
                      <select
                        value={formData.province}
                        onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                      >
                        <option value="Ontario">Ontario</option>
                        <option value="Quebec">Quebec</option>
                        <option value="British Columbia">British Columbia</option>
                        <option value="Alberta">Alberta</option>
                        <option value="Manitoba">Manitoba</option>
                        <option value="Saskatchewan">Saskatchewan</option>
                      </select>
                    </div>
                    <Input
                      label="Country"
                      value={formData.country}
                      onChange={(e: any) => setFormData({ ...formData, country: e.target.value })}
                      disabled
                    />
                  </div>

                  {isHomeowner && (
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mt-4">
                      <div className="flex items-start gap-3">
                        <Building className="w-5 h-5 text-purple-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-purple-900">This will be your default service address</p>
                          <p className="text-xs text-purple-700 mt-1">You can add different addresses when booking cleanings.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Professional Profile (Cleaners Only) */}
              {step === 3 && role === 'cleaner' && (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Professional Profile
                  </h3>

                  <div>
                    <label className="text-sm font-medium text-gray-700 ml-1 block mb-1">About You</label>
                    <textarea
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all h-28 resize-none"
                      placeholder="Tell homeowners about your cleaning experience, specialties, and what makes you great at what you do..."
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      maxLength={CONFIG.validation.bio.maxLength}
                    />
                    <p className="text-xs text-gray-400 mt-1 text-right">{formData.bio.length}/{CONFIG.validation.bio.maxLength}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 ml-1 block mb-1">Hourly Rate ($CAD)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">$</span>
                        <input
                          type="number"
                          min={CONFIG.pricing.minimumHourlyRate}
                          max={CONFIG.pricing.maximumHourlyRate}
                          value={formData.hourlyRate}
                          onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
                          className="w-full pl-8 pr-4 py-3 rounded-xl border-2 border-gray-100 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">/hr</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 ml-1">Range: ${CONFIG.pricing.minimumHourlyRate}-${CONFIG.pricing.maximumHourlyRate}/hr</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 ml-1 block mb-1">Years of Experience</label>
                      <select
                        value={formData.experience}
                        onChange={(e) => setFormData({ ...formData, experience: Number(e.target.value) })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all"
                      >
                        <option value={0}>Less than 1 year</option>
                        <option value={1}>1-2 years</option>
                        <option value={3}>3-5 years</option>
                        <option value={5}>5-10 years</option>
                        <option value={10}>10+ years</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 ml-1 block mb-3">Services You Offer</label>
                    <div className="grid grid-cols-2 gap-2">
                      {serviceOptions.map(service => (
                        <button
                          key={service}
                          type="button"
                          onClick={() => handleToggleService(service)}
                          className={`px-4 py-3 rounded-xl text-sm font-medium border-2 transition-all flex items-center gap-2 ${
                            services.includes(service)
                              ? 'bg-pink-100 border-pink-500 text-pink-700'
                              : 'bg-white border-gray-100 text-gray-600 hover:border-gray-200'
                          }`}
                        >
                          {services.includes(service) && <CheckCircle className="w-4 h-4" />}
                          {service}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2 ml-1">Select all services you're qualified to provide</p>
                  </div>

                  {/* Earnings Preview */}
                  <div className="bg-gradient-to-br from-pink-50 to-orange-50 border border-pink-200 rounded-xl p-4">
                    <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-pink-600" />
                      Estimated Earnings Preview
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Per 3-hour job:</span>
                        <span className="block text-lg font-bold text-green-600">
                          ${Math.round(formData.hourlyRate * 3 * CONFIG.pricing.cleanerPayoutRate)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Weekly (20 hrs):</span>
                        <span className="block text-lg font-bold text-green-600">
                          ${Math.round(formData.hourlyRate * 20 * CONFIG.pricing.cleanerPayoutRate)}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Based on {CONFIG.pricing.cleanerPayoutRate * 100}% payout after platform fee</p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 mt-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-red-500 font-bold">!</span>
                  </div>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-8 space-y-3">
                {step < totalSteps ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    className={`w-full py-4 ${!isHomeowner ? 'bg-gradient-to-r from-pink-600 to-orange-500 hover:from-pink-700 hover:to-orange-600' : ''}`}
                  >
                    Continue
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className={`w-full py-4 ${!isHomeowner ? 'bg-gradient-to-r from-pink-600 to-orange-500 hover:from-pink-700 hover:to-orange-600' : ''}`}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Creating your account...
                      </span>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Create Account
                      </>
                    )}
                  </Button>
                )}

                <p className="text-xs text-center text-gray-500">
                  By creating an account, you agree to our{' '}
                  <a href="#" className={`${isHomeowner ? 'text-purple-600' : 'text-pink-600'} font-semibold hover:underline`}>
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className={`${isHomeowner ? 'text-purple-600' : 'text-pink-600'} font-semibold hover:underline`}>
                    Privacy Policy
                  </a>
                </p>
              </div>
            </form>

            {/* Footer */}
            <div className="mt-6 pt-6 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-500">
                Already have an account?{' '}
                <button onClick={onBack} className={`${isHomeowner ? 'text-purple-600' : 'text-pink-600'} font-semibold hover:underline`}>
                  Sign in
                </button>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Register;
