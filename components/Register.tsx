
import React, { useState, useEffect } from 'react';
import { Button, Input, Card } from './UI';
import { storage } from '../utils/storage';
import { User, UserType, ServiceOffer } from '../types';
<<<<<<< HEAD
import {
  ArrowLeft, UserPlus, Sparkles, Home, Briefcase, Mail, Phone,
  MapPin, Lock, Eye, EyeOff, CheckCircle, Clock, DollarSign,
  Star, Shield, Award, BadgeCheck, Building, User as UserIcon
} from 'lucide-react';
=======
import { ArrowLeft, UserPlus, Sparkles } from 'lucide-react';
>>>>>>> d06443da4cbdb3f847eedb509039380cf77654ed

interface RegisterProps {
  role: 'homeowner' | 'cleaner';
  onBack: () => void;
  onRegister: (user: User) => void;
}

const Register: React.FC<RegisterProps> = ({ role, onBack, onRegister }) => {
<<<<<<< HEAD
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
=======
  const [formData, setFormData] = useState({
    name: '',
>>>>>>> d06443da4cbdb3f847eedb509039380cf77654ed
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
<<<<<<< HEAD
    hourlyRate: 35,
    experience: 1,
  });

  const [services, setServices] = useState<string[]>([]);
  const [serviceOptions, setServiceOptions] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const totalSteps = role === 'cleaner' ? 3 : 2;
=======
    hourlyRate: 25,
    experience: 1,
  });
  
  const [services, setServices] = useState<string[]>([]);
  const [serviceOptions, setServiceOptions] = useState<string[]>([]);
  const [error, setError] = useState('');
>>>>>>> d06443da4cbdb3f847eedb509039380cf77654ed

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
<<<<<<< HEAD
    setServices(prev =>
=======
    setServices(prev => 
>>>>>>> d06443da4cbdb3f847eedb509039380cf77654ed
      prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]
    );
  };

<<<<<<< HEAD
  const validateStep = (currentStep: number): boolean => {
    setError('');

    if (currentStep === 1) {
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        setError('Please enter your full name');
        return false;
      }
      if (!formData.email.trim() || !formData.email.includes('@')) {
        setError('Please enter a valid email address');
        return false;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
      if (!formData.phone.trim()) {
        setError('Please enter your phone number');
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
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep(step)) return;

    setIsLoading(true);
    setError('');

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
=======
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
>>>>>>> d06443da4cbdb3f847eedb509039380cf77654ed

    const cleanEmail = formData.email.trim().toLowerCase();
    const keys = await storage.list('user:');
    for (const key of keys) {
      const existing = await storage.get(key);
      if (existing && existing.email.toLowerCase() === cleanEmail) {
<<<<<<< HEAD
        setError('This email is already registered. Please use a different email or login.');
        setIsLoading(false);
=======
        setError('Email already registered');
>>>>>>> d06443da4cbdb3f847eedb509039380cf77654ed
        return;
      }
    }

<<<<<<< HEAD
    const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
=======
    // Split name for granular fields
    const nameParts = formData.name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');

    // Construct full address for compatibility
>>>>>>> d06443da4cbdb3f847eedb509039380cf77654ed
    const fullAddress = `${formData.streetAddress}${formData.apartment ? ', ' + formData.apartment : ''}, ${formData.city}, ${formData.province}, ${formData.country}`;

    const newUser: User = {
      id: `user_${Date.now()}`,
      type: role,
<<<<<<< HEAD
      name: fullName,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: cleanEmail,
      password: formData.password,
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
=======
      ...formData,
      firstName,
      lastName,
      address: fullAddress,
>>>>>>> d06443da4cbdb3f847eedb509039380cf77654ed
      services: role === 'cleaner' ? services : undefined,
      rating: role === 'cleaner' ? 5.0 : undefined,
      reviewCount: role === 'cleaner' ? 0 : undefined,
      totalEarnings: role === 'cleaner' ? 0 : undefined,
      isAvailable: role === 'cleaner' ? true : undefined,
      createdAt: new Date().toISOString()
    };

<<<<<<< HEAD
=======
    // Remove the temporary confirmPassword from the saved object
    delete (newUser as any).confirmPassword;

>>>>>>> d06443da4cbdb3f847eedb509039380cf77654ed
    await storage.set(`user:${newUser.id}`, newUser);
    await storage.set('currentUser', newUser);
    onRegister(newUser);
  };

<<<<<<< HEAD
  const isHomeowner = role === 'homeowner';
  const primaryColor = isHomeowner ? 'purple' : 'pink';
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
                <span>Keep 80% of every job — industry-leading payout</span>
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
                        placeholder="Min. 6 characters"
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
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 ml-1 block mb-1">Hourly Rate ($CAD)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">$</span>
                        <input
                          type="number"
                          min="20"
                          max="75"
                          value={formData.hourlyRate}
                          onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
                          className="w-full pl-8 pr-4 py-3 rounded-xl border-2 border-gray-100 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">/hr</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 ml-1">Avg. rate: $30-45/hr</p>
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
                          ${Math.round(formData.hourlyRate * 3 * 0.8)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Weekly (20 hrs):</span>
                        <span className="block text-lg font-bold text-green-600">
                          ${Math.round(formData.hourlyRate * 20 * 0.8)}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Based on 80% payout after platform fee</p>
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
=======
  return (
    <div className="min-h-screen py-12 px-6 flex justify-center">
      <Card className="w-full max-w-2xl">
        <button onClick={onBack} className="mb-6 flex items-center gap-2 text-gray-500 hover:text-purple-600 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-semibold">Back</span>
        </button>

        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            {role === 'homeowner' ? <UserPlus className="w-6 h-6 text-purple-600" /> : <Sparkles className="w-6 h-6 text-pink-600" />}
          </div>
          <h2 className="text-3xl font-bold">Register as {role === 'homeowner' ? 'Homeowner' : 'Holla Cleaner'}</h2>
          <p className="text-gray-500">Join the HollaClean community in Ontario</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Account Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Full Name" value={formData.name} onChange={(e: any) => setFormData({...formData, name: e.target.value})} required />
              <Input label="Email Address" type="email" value={formData.email} onChange={(e: any) => setFormData({...formData, email: e.target.value})} required />
              <Input label="Password" type="password" value={formData.password} onChange={(e: any) => setFormData({...formData, password: e.target.value})} required />
              <Input label="Confirm Password" type="password" value={formData.confirmPassword} onChange={(e: any) => setFormData({...formData, confirmPassword: e.target.value})} required />
              <div className="md:col-span-2">
                <Input label="Phone Number" value={formData.phone} onChange={(e: any) => setFormData({...formData, phone: e.target.value})} placeholder="e.g., 4165550199" required />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Address Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Input label="Street Address" value={formData.streetAddress} onChange={(e: any) => setFormData({...formData, streetAddress: e.target.value})} placeholder="123 King St W" required />
              </div>
              <Input label="Apartment/Unit" value={formData.apartment} onChange={(e: any) => setFormData({...formData, apartment: e.target.value})} placeholder="Apt 4B (Optional)" />
              <Input label="City" value={formData.city} onChange={(e: any) => setFormData({...formData, city: e.target.value})} required />
              <Input label="Province" value={formData.province} onChange={(e: any) => setFormData({...formData, province: e.target.value})} required />
              <Input label="Country" value={formData.country} onChange={(e: any) => setFormData({...formData, country: e.target.value})} required />
            </div>
          </div>

          {role === 'cleaner' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-4 border-t border-gray-100 pt-6">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Professional Profile</h3>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700 ml-1">About Me</label>
                <textarea 
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-pink-500 outline-none h-32"
                  placeholder="Describe your cleaning experience..."
                  value={formData.bio}
                  onChange={(e: any) => setFormData({...formData, bio: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Hourly Rate ($/hr)" type="number" min="15" value={formData.hourlyRate} onChange={(e: any) => setFormData({...formData, hourlyRate: Number(e.target.value)})} required />
                <Input label="Experience (Years)" type="number" min="0" value={formData.experience} onChange={(e: any) => setFormData({...formData, experience: Number(e.target.value)})} required />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 ml-1 block mb-3">Services Offered</label>
                <div className="grid grid-cols-2 gap-2">
                  {serviceOptions.map(service => (
                    <button
                      key={service}
                      type="button"
                      onClick={() => handleToggleService(service)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${services.includes(service) ? 'bg-pink-100 border-pink-500 text-pink-700' : 'bg-white border-gray-100 text-gray-600'}`}
                    >
                      {service}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-500 font-bold text-center">{error}</p>}

          <Button type="submit" className="w-full">
            Create Account
          </Button>
        </form>
      </Card>
>>>>>>> d06443da4cbdb3f847eedb509039380cf77654ed
    </div>
  );
};

export default Register;
