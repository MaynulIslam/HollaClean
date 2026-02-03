
import React, { useState, useEffect } from 'react';
import { User, CleaningRequest, ServiceOffer } from '../types';
import { storage } from '../utils/storage';
import { Button, Card, Input } from './UI';
<<<<<<< HEAD
import {
  ArrowLeft, Sparkles, MapPin, Clock, Calendar as CalendarIcon,
  Image as ImageIcon, X, DollarSign, Home, CheckCircle, Info,
  Wrench, AlertCircle, ChevronRight, Shield, Star
} from 'lucide-react';
=======
import { ArrowLeft, Sparkles, MapPin, Clock, Calendar as CalendarIcon, Image as ImageIcon, X } from 'lucide-react';
>>>>>>> d06443da4cbdb3f847eedb509039380cf77654ed

interface Props {
  user: User;
  onSuccess: () => void;
  onBack: () => void;
}

<<<<<<< HEAD
// Service details for display
const serviceDetails: Record<string, { description: string; includes: string[]; duration: string; priceRange: string }> = {
  'Regular Cleaning': {
    description: 'Routine cleaning to maintain a spotless home',
    includes: ['Dusting all surfaces', 'Vacuuming & mopping', 'Kitchen & bathroom cleaning', 'Bed making'],
    duration: '2-4 hours',
    priceRange: '$80 - $160'
  },
  'Deep Cleaning': {
    description: 'Thorough top-to-bottom cleaning for extra attention',
    includes: ['All regular cleaning', 'Inside cabinets', 'Baseboards & door frames', 'Behind appliances'],
    duration: '4-8 hours',
    priceRange: '$200 - $400'
  },
  'Move In/Out': {
    description: 'Comprehensive cleaning for empty properties',
    includes: ['Complete deep clean', 'Inside all appliances', 'All closets & storage', 'Wall spot cleaning'],
    duration: '5-10 hours',
    priceRange: '$250 - $500'
  },
  'Window Cleaning': {
    description: 'Crystal-clear windows inside and out',
    includes: ['Interior windows', 'Exterior windows', 'Sills & tracks', 'Screen dusting'],
    duration: '2-5 hours',
    priceRange: '$100 - $300'
  },
  'Carpet Cleaning': {
    description: 'Professional carpet cleaning to remove stains and odors',
    includes: ['Pre-treatment', 'Hot water extraction', 'Deodorizing', 'Speed drying'],
    duration: '2-4 hours',
    priceRange: '$150 - $350'
  },
  'Laundry': {
    description: 'Professional laundry services including ironing',
    includes: ['Sorting & washing', 'Drying & folding', 'Ironing', 'Closet organization'],
    duration: '2-4 hours',
    priceRange: '$60 - $120'
  },
  'Post-Construction': {
    description: 'Heavy-duty cleaning after renovations',
    includes: ['Debris removal', 'Dust elimination', 'Surface polishing', 'Final detailing'],
    duration: '6-12 hours',
    priceRange: '$300 - $600'
  }
};

const CreateRequest: React.FC<Props> = ({ user, onSuccess, onBack }) => {
  const [step, setStep] = useState(1);
=======
const CreateRequest: React.FC<Props> = ({ user, onSuccess, onBack }) => {
>>>>>>> d06443da4cbdb3f847eedb509039380cf77654ed
  const [formData, setFormData] = useState({
    serviceType: '',
    date: '',
    time: '09:00',
    hours: 3,
    address: user.address,
    instructions: '',
  });

  const [images, setImages] = useState<string[]>([]);
  const [serviceOptions, setServiceOptions] = useState<string[]>([]);
<<<<<<< HEAD
  const [isSubmitting, setIsSubmitting] = useState(false);
=======
>>>>>>> d06443da4cbdb3f847eedb509039380cf77654ed

  useEffect(() => {
    const loadServices = async () => {
      const services: ServiceOffer[] = await storage.get('config:services') || [];
      if (services.length > 0) {
        setServiceOptions(services.map(s => s.name));
        setFormData(prev => ({ ...prev, serviceType: services[0].name }));
      }
    };
    loadServices();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file: File) => {
        if (file.size > 2 * 1024 * 1024) {
          alert("Image is too large. Please select an image under 2MB.");
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          setImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
<<<<<<< HEAD
    setIsSubmitting(true);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const hourlyRateAvg = 35;
=======

    const hourlyRateAvg = 30; // Base estimate
>>>>>>> d06443da4cbdb3f847eedb509039380cf77654ed
    const totalAmount = hourlyRateAvg * formData.hours;
    const commission = totalAmount * 0.20;

    const request: CleaningRequest = {
      id: `req_${Date.now()}`,
      homeownerId: user.id,
      homeownerName: user.name,
      homeownerPhone: user.phone,
      homeownerEmail: user.email,
      ...formData,
      images,
      status: 'open',
      acceptedBy: null,
      cleanerName: null,
      cleanerPhone: null,
      hourlyRate: null,
      acceptedAt: null,
      completedAt: null,
      totalAmount,
      platformCommission: commission,
      cleanerPayout: totalAmount - commission,
      paymentStatus: 'pending',
      createdAt: new Date().toISOString()
    };

    await storage.set(`request:${request.id}`, request);
<<<<<<< HEAD
=======
    alert("Cleaning request posted! Cleaners in Ontario will see it and can accept.");
>>>>>>> d06443da4cbdb3f847eedb509039380cf77654ed
    onSuccess();
  };

  const estMin = formData.hours * 25;
  const estMax = formData.hours * 45;
<<<<<<< HEAD
  const currentServiceDetails = serviceDetails[formData.serviceType] || serviceDetails['Regular Cleaning'];

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  return (
    <div className="animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={step > 1 ? prevStep : onBack}
          className="flex items-center gap-2 text-gray-500 hover:text-purple-600 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-semibold">{step > 1 ? 'Previous Step' : 'Back to Dashboard'}</span>
        </button>

        {/* Step Indicator */}
        <div className="flex items-center gap-2">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                s < step
                  ? 'bg-green-500 text-white'
                  : s === step
                  ? 'bg-purple-600 text-white ring-4 ring-purple-200'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {s < step ? <CheckCircle className="w-4 h-4" /> : s}
            </div>
          ))}
        </div>
      </div>

      {/* Title Section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold font-outfit text-gray-900 mb-1">
            {step === 1 && 'Choose Your Service'}
            {step === 2 && 'Schedule & Location'}
            {step === 3 && 'Review & Confirm'}
          </h2>
          <p className="text-gray-500">
            {step === 1 && 'Select the type of cleaning service you need'}
            {step === 2 && 'Tell us when and where you need cleaning'}
            {step === 3 && 'Review your request details before posting'}
          </p>
        </div>

        {/* Cost Estimate */}
        <Card className="bg-gradient-to-br from-purple-600 to-pink-600 text-white p-4 border-0 min-w-[180px]">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-white/80" />
            <span className="text-white/80 text-xs font-semibold uppercase tracking-wider">Estimated Cost</span>
          </div>
          <p className="text-2xl font-bold font-outfit">${estMin} - ${estMax}</p>
          <p className="text-white/70 text-xs mt-1">Based on {formData.hours} hours @ $25-45/hr</p>
        </Card>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Step 1: Service Selection */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {serviceOptions.map(service => {
                const details = serviceDetails[service] || serviceDetails['Regular Cleaning'];
                const isSelected = formData.serviceType === service;

                return (
                  <button
                    key={service}
                    type="button"
                    onClick={() => setFormData({ ...formData, serviceType: service })}
                    className={`text-left p-5 rounded-2xl border-2 transition-all ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50 shadow-lg shadow-purple-100'
                        : 'border-gray-100 bg-white hover:border-purple-200 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isSelected ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-500'
                      }`}>
                        <Sparkles className="w-5 h-5" />
                      </div>
                      {isSelected && <CheckCircle className="w-6 h-6 text-purple-600" />}
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">{service}</h3>
                    <p className="text-sm text-gray-500 mb-3">{details.description}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {details.duration}
                      </span>
                      <span className="flex items-center gap-1 text-green-600 font-semibold">
                        <DollarSign className="w-3 h-3" />
                        {details.priceRange}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Service Details */}
            {formData.serviceType && (
              <Card className="p-5 bg-purple-50 border-purple-100">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Info className="w-4 h-4 text-purple-600" />
                  What's Included in {formData.serviceType}
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {currentServiceDetails.includes.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <div className="flex justify-end pt-4">
              <Button type="button" onClick={nextStep} className="px-8">
                Continue
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Schedule & Location */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <Card className="p-6 space-y-6">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-purple-600" />
                Schedule Your Cleaning
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 ml-1 block mb-1">Preferred Date</label>
                  <input
                    type="date"
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                    value={formData.date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 ml-1 block mb-1">Preferred Time</label>
                  <select
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  >
                    <option value="08:00">8:00 AM</option>
                    <option value="09:00">9:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="13:00">1:00 PM</option>
                    <option value="14:00">2:00 PM</option>
                    <option value="15:00">3:00 PM</option>
                    <option value="16:00">4:00 PM</option>
                    <option value="17:00">5:00 PM</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 ml-1 block mb-1">Estimated Hours</label>
                  <select
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                    value={formData.hours}
                    onChange={(e) => setFormData({ ...formData, hours: Number(e.target.value) })}
                  >
                    {[2, 3, 4, 5, 6, 8, 10].map(h => (
                      <option key={h} value={h}>{h} Hours</option>
                    ))}
                  </select>
                </div>
              </div>
            </Card>

            <Card className="p-6 space-y-6">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-purple-600" />
                Service Location
              </h3>

              <div>
                <label className="text-sm font-medium text-gray-700 ml-1 block mb-1">Address</label>
                <textarea
                  required
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all h-20 resize-none"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter your full address"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 ml-1 block mb-1">Special Instructions (Optional)</label>
                <textarea
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all h-24 resize-none"
                  placeholder="e.g., Focus on kitchen and bathrooms, pet-friendly products preferred, key under the mat..."
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                />
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-purple-600" />
                Photos (Optional)
              </h3>
              <p className="text-sm text-gray-500">Upload photos to help cleaners understand the space and prepare accordingly.</p>

              <div className="flex flex-wrap gap-3">
                {images.map((img, idx) => (
                  <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden group shadow-md">
                    <img src={img} alt="Cleaning location" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <label className="w-24 h-24 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-all text-gray-400">
                  <ImageIcon className="w-6 h-6 mb-1" />
                  <span className="text-[10px] font-bold">Add Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              </div>
            </Card>

            <div className="flex justify-between pt-4">
              <Button type="button" onClick={prevStep} variant="secondary">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button type="button" onClick={nextStep} className="px-8">
                Continue
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Confirm */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <Card className="p-6">
              <h3 className="font-bold text-gray-900 mb-4">Request Summary</h3>

              <div className="space-y-4">
                <div className="flex items-start justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Service Type</p>
                      <p className="font-bold text-gray-900">{formData.serviceType}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                      <CalendarIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date & Time</p>
                      <p className="font-bold text-gray-900">
                        {formData.date ? new Date(formData.date).toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Not selected'} at {formData.time}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Duration</p>
                      <p className="font-bold text-gray-900">{formData.hours} Hours</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-bold text-gray-900">{formData.address}</p>
                    </div>
                  </div>
                </div>

                {formData.instructions && (
                  <div className="py-3 border-b border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">Special Instructions</p>
                    <p className="text-gray-700">{formData.instructions}</p>
                  </div>
                )}

                {images.length > 0 && (
                  <div className="py-3">
                    <p className="text-sm text-gray-500 mb-2">Photos Attached</p>
                    <div className="flex gap-2">
                      {images.map((img, idx) => (
                        <img key={idx} src={img} alt="" className="w-16 h-16 rounded-lg object-cover" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Pricing Breakdown */}
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-purple-600" />
                Pricing Breakdown
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Estimated range ({formData.hours}h @ $25-45/hr)</span>
                  <span className="font-bold text-gray-900">${estMin} - ${estMax}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Platform fee (included)</span>
                  <span className="text-gray-500">20%</span>
                </div>
                <div className="border-t border-purple-200 pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">You Pay (Final determined by cleaner)</span>
                    <span className="text-xl font-bold text-purple-600">${estMin} - ${estMax}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-start gap-2 text-sm text-gray-600 bg-white/50 p-3 rounded-xl">
                <Info className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                <p>Final price depends on the cleaner's hourly rate. You'll see the exact amount before confirming.</p>
              </div>
            </Card>

            {/* Trust Indicators */}
            <Card className="p-4 border-green-200 bg-green-50">
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900">Secure & Protected</p>
                  <p className="text-sm text-green-700">All cleaners are verified. Payments are secure. Cancel anytime before the job starts.</p>
                </div>
              </div>
            </Card>

            <div className="flex justify-between pt-4">
              <Button type="button" onClick={prevStep} variant="secondary">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button type="submit" className="px-8 py-4" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Posting Request...
                  </span>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Post Cleaning Request
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
=======

  return (
    <div className="animate-in slide-in-from-right-4 duration-300">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-gray-500 hover:text-purple-600 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-semibold">Back to Overview</span>
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h2 className="text-3xl font-bold mb-1">Request Cleaning</h2>
          <p className="text-gray-500 text-sm">Fill in the details for your cleaning job.</p>
        </div>
        
        <div className="bg-purple-600 text-white px-5 py-3 rounded-2xl shadow-lg flex flex-col items-end min-w-[140px]">
          <p className="text-[10px] font-black uppercase opacity-70 tracking-widest leading-none mb-1">Estimated Cost</p>
          <p className="text-2xl font-black font-outfit leading-none">${estMin} - ${estMax}</p>
          <p className="text-[9px] mt-1 opacity-60 italic whitespace-nowrap">Ontario rates $25-$45/hr</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="space-y-6">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 ml-1">Service Type</label>
            <select 
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-purple-500 outline-none"
              value={formData.serviceType}
              onChange={(e) => setFormData({...formData, serviceType: e.target.value})}
            >
              {serviceOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700 ml-1">Please add picture to better understand what you need to clean</label>
            <div className="flex flex-wrap gap-3">
              {images.map((img, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden group shadow-sm">
                  <img src={img} alt="Cleaning location" className="w-full h-full object-cover" />
                  <button 
                    type="button" 
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <label className="w-20 h-20 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-all text-gray-400">
                <ImageIcon className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-bold">Add Photo</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  className="hidden" 
                  onChange={handleImageUpload} 
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 ml-1 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-purple-500" /> Preferred Date
              </label>
              <input 
                type="date"
                required
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-purple-500 outline-none"
                value={formData.date}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 ml-1 flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-500" /> Preferred Time
              </label>
              <input 
                type="time"
                required
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-purple-500 outline-none"
                value={formData.time}
                onChange={(e) => setFormData({...formData, time: e.target.value})}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 ml-1">Estimated Hours</label>
              <select 
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-purple-500 outline-none"
                value={formData.hours}
                onChange={(e) => setFormData({...formData, hours: Number(e.target.value)})}
              >
                {[2, 3, 4, 5, 6, 8].map(h => <option key={h} value={h}>{h} Hours</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 ml-1 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-purple-500" /> Address
            </label>
            <textarea 
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-purple-500 outline-none h-20"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 ml-1">Special Instructions</label>
            <textarea 
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-purple-500 outline-none h-24"
              placeholder="e.g., Focus on kitchen and bathrooms, bring own vacuum..."
              value={formData.instructions}
              onChange={(e) => setFormData({...formData, instructions: e.target.value})}
            />
          </div>
        </Card>

        <div className="flex justify-end pt-4">
          <Button type="submit" className="w-full md:w-auto px-16 py-4 text-lg bg-gradient-to-r from-purple-600 to-pink-600 shadow-xl shadow-purple-200">
            Post Request
          </Button>
        </div>
>>>>>>> d06443da4cbdb3f847eedb509039380cf77654ed
      </form>
    </div>
  );
};

export default CreateRequest;
