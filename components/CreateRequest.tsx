
import React, { useState, useEffect, useMemo } from 'react';
import { User, CleaningRequest, ServiceOffer } from '../types';
import { storage } from '../utils/storage';
import { getPlatformConfig } from '../utils/config';
import { Button, Card, Input } from './UI';
import PaymentCheckout from './PaymentCheckout';
import {
  ArrowLeft, Sparkles, MapPin, Clock, Calendar as CalendarIcon,
  Image as ImageIcon, X, DollarSign, Home, CheckCircle, Info,
  Wrench, AlertCircle, ChevronRight, Shield, Star, Ruler, Layers, Grid3X3, PawPrint, CreditCard
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

// Photo tips loaded from admin-editable config
const roomPhotoTips: Record<string, string> = getPlatformConfig().photoTips;

// Maps room key prefix to a friendly label
function formatRoomKey(key: string): string {
  const parts = key.split('_');
  const num = parts.pop();
  const type = parts.join('_');
  const labels: Record<string, string> = {
    bedroom: 'Bedroom',
    bathroom: 'Bathroom',
    kitchen: 'Kitchen',
    livingRoom: 'Living Room',
    other: 'Other Room',
  };
  return `${labels[type] || type} ${num}`;
}

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
    numberOfBedrooms: '' as string | number,
    numberOfBathrooms: '' as string | number,
    numberOfKitchens: '' as string | number,
    numberOfLivingRooms: '' as string | number,
    numberOfOtherRooms: '' as string | number,
    hasPets: false,
  });

  const [images, setImages] = useState<string[]>([]);
  const [roomImages, setRoomImages] = useState<Record<string, string[]>>({});
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

  const handleRoomImageUpload = (roomType: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file: File) => {
        if (file.size > 2 * 1024 * 1024) {
          alert("Image is too large. Please select an image under 2MB.");
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          setRoomImages(prev => ({
            ...prev,
            [roomType]: [...(prev[roomType] || []), reader.result as string]
          }));
        };
        reader.readAsDataURL(file);
      });
    }
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const removeRoomImage = (roomType: string, index: number) => {
    setRoomImages(prev => ({
      ...prev,
      [roomType]: prev[roomType].filter((_, i) => i !== index)
    }));
  };

  // Build individual room entries (e.g. Bedroom 1, Bedroom 2, Bathroom 1)
  const individualRooms = useMemo(() => {
    const rooms: { key: string; label: string; typeKey: string }[] = [];
    const counts: { typeKey: string; label: string; count: number }[] = [
      { typeKey: 'bedroom', label: 'Bedroom', count: Number(formData.numberOfBedrooms) || 0 },
      { typeKey: 'bathroom', label: 'Bathroom', count: Number(formData.numberOfBathrooms) || 0 },
      { typeKey: 'kitchen', label: 'Kitchen', count: Number(formData.numberOfKitchens) || 0 },
      { typeKey: 'livingRoom', label: 'Living Room', count: Number(formData.numberOfLivingRooms) || 0 },
      { typeKey: 'other', label: 'Other Room', count: Number(formData.numberOfOtherRooms) || 0 },
    ];
    for (const { typeKey, label, count } of counts) {
      for (let i = 1; i <= count; i++) {
        rooms.push({ key: `${typeKey}_${i}`, label: count > 1 ? `${label} ${i}` : label, typeKey });
      }
    }
    return rooms;
  }, [formData.numberOfBedrooms, formData.numberOfBathrooms, formData.numberOfKitchens, formData.numberOfLivingRooms, formData.numberOfOtherRooms]);

  const allRoomImagesValid = individualRooms.length === 0 || individualRooms.every(r => (roomImages[r.key]?.length || 0) > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const platformCfg = getPlatformConfig();
    const hourlyRateAvg = 35;
    const safeHours = Number(formData.hours) || 3;
    const subtotal = hourlyRateAvg * safeHours;
    const taxAmount = Math.round(subtotal * platformCfg.pricing.taxRate * 100) / 100;
    const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;
    const commission = Math.round(subtotal * platformCfg.pricing.platformCommissionRate * 100) / 100;

    const sqftRaw = Number(formData.squareFootage);
    const sqft = formData.squareFootage && !isNaN(sqftRaw) && sqftRaw > 0 ? sqftRaw : undefined;

    const bedrooms = Number(formData.numberOfBedrooms) || 0;
    const bathrooms = Number(formData.numberOfBathrooms) || 0;
    const kitchens = Number(formData.numberOfKitchens) || 0;
    const livingRooms = Number(formData.numberOfLivingRooms) || 0;
    const otherRooms = Number(formData.numberOfOtherRooms) || 0;
    const totalRooms = bedrooms + bathrooms + kitchens + livingRooms + otherRooms;

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
      ...(totalRooms > 0 ? { numberOfRooms: totalRooms } : {}),
      ...(bedrooms > 0 ? { numberOfBedrooms: bedrooms } : {}),
      ...(bathrooms > 0 ? { numberOfBathrooms: bathrooms } : {}),
      ...(kitchens > 0 ? { numberOfKitchens: kitchens } : {}),
      ...(livingRooms > 0 ? { numberOfLivingRooms: livingRooms } : {}),
      ...(otherRooms > 0 ? { numberOfOtherRooms: otherRooms } : {}),
      ...(formData.hasPets ? { hasPets: true } : {}),
      roomImages,
      images: (Object.values(roomImages) as string[][]).flat(),
      status: 'open',
      acceptedBy: null,
      cleanerName: null,
      cleanerPhone: null,
      hourlyRate: null,
      acceptedAt: null,
      completedAt: null,
      totalAmount,
      platformCommission: commission,
      cleanerPayout: Math.round((subtotal - commission) * 100) / 100,
      taxAmount,
      taxRate: platformCfg.pricing.taxRate,
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

  // Build preview request for payment step
  const previewRequest = useMemo((): CleaningRequest => {
    const platformCfg = getPlatformConfig();
    const safeHours = Number(formData.hours) || 3;
    const hourlyRateAvg = 35;
    const subtotal = hourlyRateAvg * safeHours;
    const taxAmount = Math.round(subtotal * platformCfg.pricing.taxRate * 100) / 100;
    const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;
    const commission = Math.round(subtotal * platformCfg.pricing.platformCommissionRate * 100) / 100;
    const bedrooms = Number(formData.numberOfBedrooms) || 0;
    const bathrooms = Number(formData.numberOfBathrooms) || 0;
    const kitchens = Number(formData.numberOfKitchens) || 0;
    const livingRooms = Number(formData.numberOfLivingRooms) || 0;
    const otherRooms = Number(formData.numberOfOtherRooms) || 0;
    const sqftRaw = Number(formData.squareFootage);
    const sqft = formData.squareFootage && !isNaN(sqftRaw) && sqftRaw > 0 ? sqftRaw : undefined;

    return {
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
      ...(bedrooms > 0 ? { numberOfBedrooms: bedrooms } : {}),
      ...(bathrooms > 0 ? { numberOfBathrooms: bathrooms } : {}),
      ...(kitchens > 0 ? { numberOfKitchens: kitchens } : {}),
      ...(livingRooms > 0 ? { numberOfLivingRooms: livingRooms } : {}),
      ...(otherRooms > 0 ? { numberOfOtherRooms: otherRooms } : {}),
      ...(formData.hasPets ? { hasPets: true } : {}),
      roomImages,
      images: (Object.values(roomImages) as string[][]).flat(),
      status: 'open',
      acceptedBy: null,
      cleanerName: null,
      cleanerPhone: null,
      hourlyRate: null,
      acceptedAt: null,
      completedAt: null,
      totalAmount,
      platformCommission: commission,
      cleanerPayout: Math.round((subtotal - commission) * 100) / 100,
      taxAmount,
      taxRate: platformCfg.pricing.taxRate,
      paymentStatus: 'pending',
      createdAt: new Date().toISOString()
    };
  }, [formData, roomImages, user]);

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    // Save the request with payment completed
    const request = { ...previewRequest, paymentStatus: 'paid' as const, paymentIntentId, paidAt: new Date().toISOString() };
    await storage.set(`request:${request.id}`, request);
    onSuccess();
  };

  const [imageError, setImageError] = useState('');
  const nextStep = () => {
    // Validate room images when leaving step 1
    if (step === 1 && individualRooms.length > 0 && !allRoomImagesValid) {
      setImageError('Please upload at least 1 photo for each room.');
      return;
    }
    setImageError('');
    setStep(step + 1);
  };
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
            {step === 1 && 'Create Your Cleaning Request'}
            {step === 2 && 'Review & Confirm'}
            {step === 3 && 'Secure Payment'}
          </h2>
          <p className="text-gray-500">
            {step === 1 && 'Choose your service, schedule, and add details'}
            {step === 2 && 'Review your request details before posting'}
            {step === 3 && 'Pay the estimated amount to post your request'}
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
        {/* Step 1: Service + Schedule + Details (merged) */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Service Selection Grid — stable layout, no col-span changes */}
            <div>
              <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Choose Your Service
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {serviceOptions.map(service => {
                  const details = serviceDetails[service] || serviceDetails['Regular Cleaning'];
                  const isSelected = formData.serviceType === service;

                  return (
                    <div
                      key={service}
                      onClick={() => setFormData({ ...formData, serviceType: service, hours: details.suggestedHours || formData.hours })}
                      className={`cursor-pointer text-left rounded-xl border-2 p-4 transition-all ${
                        isSelected
                          ? 'border-purple-500 bg-purple-50 shadow-md shadow-purple-100'
                          : 'border-gray-100 bg-white hover:border-purple-200 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isSelected ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-400'
                        }`}>
                          <Sparkles className="w-4 h-4" />
                        </div>
                        {isSelected && <CheckCircle className="w-5 h-5 text-purple-600" />}
                      </div>
                      <h4 className={`font-bold text-sm mb-1 ${isSelected ? 'text-purple-900' : 'text-gray-900'}`}>{service}</h4>
                      <p className="text-xs text-gray-500 line-clamp-2">{details.description}</p>
                      <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-400">
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />
                          {details.duration}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <DollarSign className="w-3 h-3" />
                          {details.priceRange}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Service Details — shown below grid */}
            {formData.serviceType && currentServiceDetails && (
              <Card className="p-5 border-purple-100 bg-gradient-to-br from-purple-50/50 to-pink-50/50 animate-in fade-in duration-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{formData.serviceType}</h4>
                    <p className="text-xs text-gray-500">{currentServiceDetails.duration} • {currentServiceDetails.priceRange}</p>
                  </div>
                </div>

                {/* What's Included */}
                <div className="mb-4">
                  <h5 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-2 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                    What's Included
                  </h5>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1.5">
                    {currentServiceDetails.includes.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-sm text-gray-700">
                        <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ideal For + Preparation Tip */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                    <h5 className="text-[10px] font-bold uppercase text-blue-400 tracking-wider mb-1 flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      Ideal For
                    </h5>
                    <p className="text-xs text-blue-800">{currentServiceDetails.idealFor}</p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                    <h5 className="text-[10px] font-bold uppercase text-amber-500 tracking-wider mb-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Preparation Tip
                    </h5>
                    <p className="text-xs text-amber-800">{currentServiceDetails.prepTip}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Schedule */}
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

            {/* Location */}
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

            {/* Property Details */}
            <Card className="p-6 space-y-5">
              <div>
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Home className="w-5 h-5 text-purple-600" />
                  Property Details
                  <span className="text-xs font-normal text-gray-400 ml-1">(Optional — helps with accurate estimates)</span>
                </h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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

              {/* Room Breakdown */}
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                  <Grid3X3 className="w-4 h-4 text-purple-500" />
                  Room Breakdown
                </h4>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 ml-1 mb-1 block">Bedrooms</label>
                    <select
                      className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-100 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-sm"
                      value={formData.numberOfBedrooms}
                      onChange={(e) => setFormData({ ...formData, numberOfBedrooms: e.target.value })}
                    >
                      <option value="">0</option>
                      {[1, 2, 3, 4, 5, 6].map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 ml-1 mb-1 block">Bathrooms</label>
                    <select
                      className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-100 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-sm"
                      value={formData.numberOfBathrooms}
                      onChange={(e) => setFormData({ ...formData, numberOfBathrooms: e.target.value })}
                    >
                      <option value="">0</option>
                      {[1, 2, 3, 4].map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 ml-1 mb-1 block">Kitchen</label>
                    <select
                      className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-100 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-sm"
                      value={formData.numberOfKitchens}
                      onChange={(e) => setFormData({ ...formData, numberOfKitchens: e.target.value })}
                    >
                      <option value="">0</option>
                      {[1, 2].map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 ml-1 mb-1 block">Living Room</label>
                    <select
                      className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-100 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-sm"
                      value={formData.numberOfLivingRooms}
                      onChange={(e) => setFormData({ ...formData, numberOfLivingRooms: e.target.value })}
                    >
                      <option value="">0</option>
                      {[1, 2, 3].map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 ml-1 mb-1 block">Other</label>
                    <select
                      className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-100 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-sm"
                      value={formData.numberOfOtherRooms}
                      onChange={(e) => setFormData({ ...formData, numberOfOtherRooms: e.target.value })}
                    >
                      <option value="">0</option>
                      {[1, 2, 3, 4, 5].map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {sqftNum > 0 && (
                <div className="flex items-center gap-2 text-xs text-purple-600 bg-purple-50 px-3 py-2 rounded-lg">
                  <Info className="w-3.5 h-3.5 flex-shrink-0" />
                  Estimate adjusted based on {sqftNum.toLocaleString()} sq ft{formData.hasPets ? ' + pet surcharge' : ''}
                </div>
              )}
            </Card>

            {/* Room Photos */}
            <Card className="p-6 space-y-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-purple-600" />
                Room Photos {individualRooms.length > 0 ? '(Required)' : '(Optional)'}
              </h3>
              <p className="text-sm text-gray-500">
                {individualRooms.length > 0
                  ? 'Upload at least 1 photo for each room to help cleaners prepare.'
                  : 'Add room counts above to enable per-room photo uploads, or add general photos below.'}
              </p>

              {individualRooms.length > 0 ? (
                <div className="space-y-4">
                  {individualRooms.map(room => (
                    <div key={room.key} className={`border rounded-xl p-4 ${(roomImages[room.key]?.length > 0) ? 'border-green-200 bg-green-50/30' : 'border-gray-100'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-semibold text-gray-700">{room.label}</h4>
                        {!(roomImages[room.key]?.length > 0) && (
                          <span className="text-xs text-red-500 font-semibold flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Photo required
                          </span>
                        )}
                        {(roomImages[room.key]?.length > 0) && (
                          <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            {roomImages[room.key].length} photo{roomImages[room.key].length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      {/* Photo tip */}
                      <p className="text-xs text-gray-400 mb-3 flex items-start gap-1.5">
                        <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-purple-400" />
                        {roomPhotoTips[room.typeKey] || roomPhotoTips.other}
                      </p>
                      <div className="flex flex-wrap gap-3">
                        {(roomImages[room.key] || []).map((img, idx) => (
                          <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden group shadow-md">
                            <img src={img} alt={room.label} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeRoomImage(room.key, idx)}
                              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        <label className="w-20 h-20 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-all text-gray-400">
                          <ImageIcon className="w-5 h-5 mb-0.5" />
                          <span className="text-[9px] font-bold">Add</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => handleRoomImageUpload(room.key, e)}
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
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
              )}

              {imageError && (
                <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {imageError}
                </div>
              )}
            </Card>

            <div className="flex justify-end pt-4">
              <Button type="button" onClick={nextStep} className="px-8">
                Continue to Review
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Review & Confirm */}
        {step === 2 && (
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
                {(formData.squareFootage || formData.floorType || formData.numberOfBedrooms || formData.numberOfBathrooms || formData.numberOfKitchens || formData.numberOfLivingRooms || formData.numberOfOtherRooms || formData.hasPets) && (
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
                      {Number(formData.numberOfBedrooms) > 0 && (
                        <span className="inline-flex items-center gap-1.5 text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg">
                          {formData.numberOfBedrooms} Bed
                        </span>
                      )}
                      {Number(formData.numberOfBathrooms) > 0 && (
                        <span className="inline-flex items-center gap-1.5 text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg">
                          {formData.numberOfBathrooms} Bath
                        </span>
                      )}
                      {Number(formData.numberOfKitchens) > 0 && (
                        <span className="inline-flex items-center gap-1.5 text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg">
                          {formData.numberOfKitchens} Kitchen
                        </span>
                      )}
                      {Number(formData.numberOfLivingRooms) > 0 && (
                        <span className="inline-flex items-center gap-1.5 text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg">
                          {formData.numberOfLivingRooms} Living
                        </span>
                      )}
                      {Number(formData.numberOfOtherRooms) > 0 && (
                        <span className="inline-flex items-center gap-1.5 text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg">
                          {formData.numberOfOtherRooms} Other
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

                {Object.keys(roomImages).some(k => roomImages[k]?.length > 0) ? (
                  <div className="py-3">
                    <p className="text-sm text-gray-500 mb-2">Room Photos</p>
                    {(Object.entries(roomImages) as [string, string[]][]).map(([roomKey, imgs]) => (
                      imgs && imgs.length > 0 && (
                        <div key={roomKey} className="mb-2">
                          <p className="text-xs font-semibold text-gray-600 mb-1">{formatRoomKey(roomKey)}</p>
                          <div className="flex gap-2">
                            {imgs.map((img, idx) => (
                              <img key={idx} src={img} alt="" className="w-16 h-16 rounded-lg object-cover" />
                            ))}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                ) : images.length > 0 ? (
                  <div className="py-3">
                    <p className="text-sm text-gray-500 mb-2">Photos Attached</p>
                    <div className="flex gap-2">
                      {images.map((img, idx) => (
                        <img key={idx} src={img} alt="" className="w-16 h-16 rounded-lg object-cover" />
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </Card>

            {/* Pricing Breakdown */}
            {(() => {
              const platformCfg = getPlatformConfig();
              const taxRate = platformCfg.pricing.taxRate;
              const taxLabel = platformCfg.pricing.taxLabel;
              const taxMin = Math.round(estMin * taxRate * 100) / 100;
              const taxMax = Math.round(estMax * taxRate * 100) / 100;
              const totalMin = Math.round((estMin + taxMin) * 100) / 100;
              const totalMax = Math.round((estMax + taxMax) * 100) / 100;
              return (
                <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-purple-600" />
                    Cost Estimate
                  </h3>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Subtotal ({formData.hours}h @ $25-45/hr)</span>
                      <span className="font-bold text-gray-900">${estMin} - ${estMax}</span>
                    </div>
                    {taxRate > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">{taxLabel} ({Math.round(taxRate * 100)}%)</span>
                        <span className="font-medium text-gray-700">${taxMin.toFixed(2)} - ${taxMax.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t border-purple-200 pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-900">Estimated Total</span>
                        <span className="text-xl font-bold text-purple-600">${totalMin.toFixed(2)} - ${totalMax.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-start gap-2 text-sm text-gray-600 bg-white/50 p-3 rounded-xl">
                    <Info className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <p>Final price depends on the cleaner's hourly rate. You'll see the exact amount before confirming.</p>
                  </div>
                </Card>
              );
            })()}

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
              <Button type="button" onClick={nextStep} className="px-8 py-4">
                <CreditCard className="w-5 h-5" />
                Continue to Payment
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Payment */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <Card className="p-6">
              <h3 className="font-bold text-gray-900 mb-2">Secure Payment</h3>
              <p className="text-sm text-gray-500">
                Pay the estimated amount now to post your request. A cleaner will call you before arriving.
              </p>
            </Card>

            <PaymentCheckout
              request={previewRequest}
              homeownerEmail={user.email}
              isOpen={true}
              mode="upfront"
              onClose={prevStep}
              onPaymentSuccess={handlePaymentSuccess}
            />
          </div>
        )}
      </form>
    </div>
  );
};

export default CreateRequest;
