
import React, { useState, useEffect } from 'react';
import { User, CleaningRequest, ServiceOffer } from '../types';
import { storage } from '../utils/storage';
import { Button, Card, Input } from './UI';
import {
  ArrowLeft, Sparkles, MapPin, Clock, Calendar as CalendarIcon,
  Image as ImageIcon, X, DollarSign, Home, CheckCircle, Info,
  Wrench, AlertCircle, ChevronRight, Shield, Star, Ruler, Layers, Grid3X3, PawPrint
} from 'lucide-react';

interface Props {
  user: User;
  onSuccess: () => void;
  onBack: () => void;
}

// Service details for display
const serviceDetails: Record<string, {
  description: string;
  includes: string[];
  idealFor: string;
  prepTip: string;
  duration: string;
  priceRange: string;
  suggestedHours: number;
}> = {
  'Regular Cleaning': {
    description: 'Routine cleaning to maintain a spotless home',
    includes: ['Dusting all surfaces', 'Vacuuming & mopping floors', 'Kitchen counters & sink', 'Bathroom cleaning & sanitizing', 'Bed making & tidying', 'Trash removal'],
    idealFor: 'Weekly or bi-weekly upkeep for lived-in homes',
    prepTip: 'Clear countertops and pick up clutter beforehand for the best results',
    duration: '2-4 hours',
    priceRange: '$80 - $160',
    suggestedHours: 3,
  },
  'Deep Cleaning': {
    description: 'Thorough top-to-bottom cleaning for extra attention',
    includes: ['Everything in Regular Cleaning', 'Inside cabinets & drawers', 'Baseboards & door frames', 'Behind & under appliances', 'Light fixtures & ceiling fans', 'Grout scrubbing'],
    idealFor: 'Seasonal refresh, before hosting guests, or first-time clean',
    prepTip: 'Remove fragile items from shelves. Allow extra time — results are worth it',
    duration: '4-8 hours',
    priceRange: '$200 - $400',
    suggestedHours: 5,
  },
  'Move In/Out': {
    description: 'Comprehensive cleaning for empty properties',
    includes: ['Complete deep clean', 'Inside all appliances (oven, fridge)', 'All closets & storage areas', 'Wall spot cleaning', 'Window sills & tracks', 'Garage / entrance sweep'],
    idealFor: 'Preparing a home for new occupants or getting your deposit back',
    prepTip: 'Best done after furniture is moved out. Ensure all utilities are on',
    duration: '5-10 hours',
    priceRange: '$250 - $500',
    suggestedHours: 6,
  },
  'Window Cleaning': {
    description: 'Crystal-clear windows inside and out',
    includes: ['Interior glass cleaning', 'Exterior glass cleaning', 'Sills & track detailing', 'Screen dusting & wiping', 'Mirror polishing', 'Sliding door tracks'],
    idealFor: 'Spring cleaning, after construction, or improving natural light',
    prepTip: 'Move furniture away from windows. Note any hard-to-reach areas',
    duration: '2-5 hours',
    priceRange: '$100 - $300',
    suggestedHours: 3,
  },
  'Carpet Cleaning': {
    description: 'Professional carpet cleaning to remove stains and odors',
    includes: ['Pre-treatment of stains', 'Hot water extraction', 'Deodorizing treatment', 'Speed drying', 'High-traffic area focus', 'Spot treatment'],
    idealFor: 'Removing deep stains, allergens, or refreshing old carpets',
    prepTip: 'Vacuum first if possible. Point out any problem spots to the cleaner',
    duration: '2-4 hours',
    priceRange: '$150 - $350',
    suggestedHours: 3,
  },
  'Laundry': {
    description: 'Professional laundry services including ironing',
    includes: ['Sorting by color & fabric', 'Washing & drying', 'Folding & organizing', 'Ironing / steaming', 'Linen changes', 'Closet tidying'],
    idealFor: 'Busy households, after vacations, or seasonal wardrobe changeovers',
    prepTip: 'Separate any delicate or dry-clean-only items beforehand',
    duration: '2-4 hours',
    priceRange: '$60 - $120',
    suggestedHours: 3,
  },
  'Post-Construction': {
    description: 'Heavy-duty cleaning after renovations',
    includes: ['Construction debris removal', 'Fine dust elimination', 'Surface polishing & wiping', 'Vent & duct cleaning', 'Floor scrubbing', 'Final detailing walkthrough'],
    idealFor: 'After renovations, new builds, or major repair work',
    prepTip: 'Ensure all construction work is complete. Remove large debris first',
    duration: '6-12 hours',
    priceRange: '$300 - $600',
    suggestedHours: 8,
  }
};

const CreateRequest: React.FC<Props> = ({ user, onSuccess, onBack }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    serviceType: '',
    date: '',
    time: '09:00',
    hours: 3,
    address: user.address,
    instructions: '',
    squareFootage: '' as string | number,
    floorType: '',
    numberOfRooms: '' as string | number,
    hasPets: false,
  });

  const [images, setImages] = useState<string[]>([]);
  const [serviceOptions, setServiceOptions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setIsSubmitting(true);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const hourlyRateAvg = 35;
    const safeHours = Number(formData.hours) || 3;
    const totalAmount = hourlyRateAvg * safeHours;
    const commission = totalAmount * 0.20;

    const sqftRaw = Number(formData.squareFootage);
    const sqft = formData.squareFootage && !isNaN(sqftRaw) && sqftRaw > 0 ? sqftRaw : undefined;
    const roomsRaw = Number(formData.numberOfRooms);
    const rooms = formData.numberOfRooms && !isNaN(roomsRaw) && roomsRaw > 0 ? roomsRaw : undefined;

    const request: CleaningRequest = {
      id: `req_${Date.now()}`,
      homeownerId: user.id,
      homeownerName: user.name,
      homeownerPhone: user.phone,
      homeownerEmail: user.email,
      serviceType: formData.serviceType,
      date: formData.date,
      time: formData.time,
      hours: safeHours,
      address: formData.address,
      instructions: formData.instructions,
      ...(sqft ? { squareFootage: sqft } : {}),
      ...(formData.floorType ? { floorType: formData.floorType } : {}),
      ...(rooms ? { numberOfRooms: rooms } : {}),
      ...(formData.hasPets ? { hasPets: true } : {}),
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
    onSuccess();
  };

  // Smart estimate: base on hours, adjust if square footage provided
  const sqftNumRaw = Number(formData.squareFootage);
  const sqftNum = !isNaN(sqftNumRaw) && sqftNumRaw > 0 ? sqftNumRaw : 0;
  const sqftMultiplier = sqftNum > 2000 ? 1.2 : sqftNum > 1000 ? 1.1 : 1.0;
  const petAddon = formData.hasPets ? 1.05 : 1.0;
  const hours = Number(formData.hours) || 3;
  const estMin = Math.round(hours * 25 * sqftMultiplier * petAddon);
  const estMax = Math.round(hours * 45 * sqftMultiplier * petAddon);
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
          <p className="text-white/70 text-xs mt-1">Based on {formData.hours}h{sqftNum > 0 ? ` • ${sqftNum.toLocaleString()} sq ft` : ''}</p>
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
                  <div
                    key={service}
                    onClick={() => setFormData({ ...formData, serviceType: service, hours: details.suggestedHours || formData.hours })}
                    className={`cursor-pointer text-left rounded-2xl border-2 transition-all overflow-hidden ${
                      isSelected
                        ? 'border-purple-500 shadow-lg shadow-purple-100 md:col-span-2 lg:col-span-3'
                        : 'border-gray-100 bg-white hover:border-purple-200 hover:shadow-md'
                    }`}
                  >
                    {/* Compact Header (always visible) */}
                    <div className={`p-5 ${isSelected ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' : ''}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                        }`}>
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <div className="flex items-center gap-2">
                          {isSelected && <CheckCircle className="w-6 h-6 text-white" />}
                          {!isSelected && (
                            <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              {details.priceRange}
                            </span>
                          )}
                        </div>
                      </div>
                      <h3 className={`font-bold mb-1 ${isSelected ? 'text-white text-lg font-outfit' : 'text-gray-900'}`}>{service}</h3>
                      <p className={`text-sm mb-3 ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>{details.description}</p>
                      <div className={`flex items-center gap-3 text-xs ${isSelected ? 'text-white/70' : 'text-gray-500'}`}>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {details.duration}
                        </span>
                        {isSelected && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {details.priceRange}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Expanded Details (only for selected) */}
                    {isSelected && (
                      <div className="bg-white p-6 space-y-5 animate-in fade-in duration-200">
                        {/* What's Included */}
                        <div>
                          <h5 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-3 flex items-center gap-2">
                            <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                            What's Included
                          </h5>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2">
                            {details.includes.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                {item}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Ideal For + Preparation Tip */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                            <h5 className="text-xs font-bold uppercase text-blue-400 tracking-wider mb-2 flex items-center gap-1.5">
                              <Star className="w-3.5 h-3.5" />
                              Ideal For
                            </h5>
                            <p className="text-sm text-blue-800">{details.idealFor}</p>
                          </div>
                          <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                            <h5 className="text-xs font-bold uppercase text-amber-500 tracking-wider mb-2 flex items-center gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5" />
                              Preparation Tip
                            </h5>
                            <p className="text-sm text-amber-800">{details.prepTip}</p>
                          </div>
                        </div>

                        {/* Duration + Suggested Hours */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 pt-1">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-purple-500" />
                            Typical: <span className="font-semibold text-gray-700">{details.duration}</span>
                          </span>
                          <span className="text-gray-300">|</span>
                          <span className="flex items-center gap-1.5">
                            <Info className="w-4 h-4 text-purple-500" />
                            Suggested: <span className="font-semibold text-gray-700">{details.suggestedHours}h</span>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

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

            {/* Property Details (Optional) */}
            <Card className="p-6 space-y-5">
              <div>
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Home className="w-5 h-5 text-purple-600" />
                  Property Details
                  <span className="text-xs font-normal text-gray-400 ml-1">(Optional — helps with accurate estimates)</span>
                </h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 ml-1 flex items-center gap-1 mb-1">
                    <Ruler className="w-3.5 h-3.5 text-gray-400" />
                    Square Footage
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 1200"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                    value={formData.squareFootage}
                    onChange={(e) => setFormData({ ...formData, squareFootage: e.target.value })}
                  />
                  <p className="text-[10px] text-gray-400 mt-1 ml-1">sq ft</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 ml-1 flex items-center gap-1 mb-1">
                    <Layers className="w-3.5 h-3.5 text-gray-400" />
                    Floor Type
                  </label>
                  <select
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                    value={formData.floorType}
                    onChange={(e) => setFormData({ ...formData, floorType: e.target.value })}
                  >
                    <option value="">Not specified</option>
                    <option value="Hardwood">Hardwood</option>
                    <option value="Tile">Tile / Ceramic</option>
                    <option value="Carpet">Carpet</option>
                    <option value="Laminate">Laminate</option>
                    <option value="Vinyl">Vinyl / LVP</option>
                    <option value="Marble">Marble / Stone</option>
                    <option value="Mixed">Mixed</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 ml-1 flex items-center gap-1 mb-1">
                    <Grid3X3 className="w-3.5 h-3.5 text-gray-400" />
                    Rooms
                  </label>
                  <select
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                    value={formData.numberOfRooms}
                    onChange={(e) => setFormData({ ...formData, numberOfRooms: e.target.value })}
                  >
                    <option value="">Not specified</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                      <option key={n} value={n}>{n} {n === 1 ? 'room' : 'rooms'}</option>
                    ))}
                    <option value="11">10+ rooms</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 ml-1 flex items-center gap-1 mb-1">
                    <PawPrint className="w-3.5 h-3.5 text-gray-400" />
                    Pets
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, hasPets: !formData.hasPets })}
                    className={`w-full px-4 py-3 rounded-xl border-2 text-left text-sm font-medium transition-all ${
                      formData.hasPets
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-100 text-gray-500 hover:border-gray-200'
                    }`}
                  >
                    {formData.hasPets ? 'Yes, I have pets' : 'No pets'}
                  </button>
                </div>
              </div>

              {sqftNum > 0 && (
                <div className="flex items-center gap-2 text-xs text-purple-600 bg-purple-50 px-3 py-2 rounded-lg">
                  <Info className="w-3.5 h-3.5 flex-shrink-0" />
                  Estimate adjusted based on {sqftNum.toLocaleString()} sq ft{formData.hasPets ? ' + pet surcharge' : ''}
                </div>
              )}
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

                {/* Property Details (if any provided) */}
                {(formData.squareFootage || formData.floorType || formData.numberOfRooms || formData.hasPets) && (
                  <div className="py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                        <Home className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Property Details</p>
                        <p className="font-bold text-gray-900">Additional Info</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 ml-[52px]">
                      {formData.squareFootage && (
                        <span className="inline-flex items-center gap-1.5 text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg">
                          <Ruler className="w-3.5 h-3.5 text-gray-400" />
                          {(Number(formData.squareFootage) || 0).toLocaleString()} sq ft
                        </span>
                      )}
                      {formData.floorType && (
                        <span className="inline-flex items-center gap-1.5 text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg">
                          <Layers className="w-3.5 h-3.5 text-gray-400" />
                          {formData.floorType}
                        </span>
                      )}
                      {formData.numberOfRooms && (
                        <span className="inline-flex items-center gap-1.5 text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg">
                          <Grid3X3 className="w-3.5 h-3.5 text-gray-400" />
                          {formData.numberOfRooms} {Number(formData.numberOfRooms) === 1 ? 'room' : 'rooms'}
                        </span>
                      )}
                      {formData.hasPets && (
                        <span className="inline-flex items-center gap-1.5 text-sm bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg">
                          <PawPrint className="w-3.5 h-3.5" />
                          Has pets
                        </span>
                      )}
                    </div>
                  </div>
                )}

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
      </form>
    </div>
  );
};

export default CreateRequest;
