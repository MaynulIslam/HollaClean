import React, { useState } from 'react';
import {
  ArrowLeft,
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  FileText,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { requestStorage } from '../utils/storage';

const SERVICE_TYPES = [
  { value: 'Deep Cleaning', description: 'Thorough cleaning of all areas', minRate: 30, maxRate: 50 },
  { value: 'Regular Cleaning', description: 'Standard maintenance cleaning', minRate: 25, maxRate: 40 },
  { value: 'Move-in/Move-out Cleaning', description: 'Complete cleaning for moving', minRate: 35, maxRate: 55 },
  { value: 'Laundry Service', description: 'Washing, drying, and folding', minRate: 20, maxRate: 35 },
  { value: 'Ironing', description: 'Professional ironing service', minRate: 20, maxRate: 30 },
  { value: 'Window Cleaning', description: 'Interior and exterior windows', minRate: 25, maxRate: 45 },
  { value: 'Carpet Cleaning', description: 'Deep carpet and rug cleaning', minRate: 30, maxRate: 50 }
];

const HOUR_OPTIONS = [2, 3, 4, 5, 6, 8];

const CreateRequest = ({ user, onNavigate }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    serviceType: '',
    date: '',
    time: '',
    hours: '',
    address: user.address || '',
    instructions: ''
  });

  const selectedService = SERVICE_TYPES.find(s => s.value === formData.serviceType);

  const getEstimatedCost = () => {
    if (!selectedService || !formData.hours) return null;
    const hours = parseInt(formData.hours);
    return {
      min: selectedService.minRate * hours,
      max: selectedService.maxRate * hours
    };
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.serviceType) {
      newErrors.serviceType = 'Please select a service type';
    }

    if (!formData.date) {
      newErrors.date = 'Please select a date';
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        newErrors.date = 'Please select a future date';
      }
    }

    if (!formData.time) {
      newErrors.time = 'Please select a time';
    }

    if (!formData.hours) {
      newErrors.hours = 'Please select estimated hours';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Please enter the service address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      const request = {
        id: `req_${Date.now()}`,
        homeownerId: user.id,
        homeownerName: user.name,
        homeownerPhone: user.phone,
        homeownerEmail: user.email,
        serviceType: formData.serviceType,
        date: formData.date,
        time: formData.time,
        hours: parseInt(formData.hours),
        address: formData.address.trim(),
        instructions: formData.instructions.trim(),
        status: 'open',
        acceptedBy: null,
        cleanerName: null,
        cleanerPhone: null,
        hourlyRate: null,
        acceptedAt: null,
        completedAt: null,
        totalAmount: 0,
        platformCommission: 0,
        cleanerPayout: 0,
        paymentStatus: 'pending',
        createdAt: new Date().toISOString()
      };

      await requestStorage.saveRequest(request);
      setSuccess(true);

      // Auto-navigate after showing success
      setTimeout(() => {
        onNavigate('my-requests');
      }, 2000);
    } catch (err) {
      console.error('Error creating request:', err);
      setErrors({ submit: 'Failed to create request. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 animate-fade-in">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-in">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-display font-bold text-gray-800 mb-2">Request Posted!</h2>
          <p className="text-gray-600 mb-4">Cleaners can now see and accept your request</p>
          <p className="text-sm text-gray-500">Redirecting to your requests...</p>
        </div>
      </div>
    );
  }

  const estimatedCost = getEstimatedCost();

  return (
    <div className="min-h-screen pb-24 animate-fade-in">
      <div className="p-6">
        {/* Header */}
        <button
          onClick={() => onNavigate('homeowner-dashboard')}
          className="flex items-center gap-2 text-primary-600 mb-6 hover:underline"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-gray-800">Request Cleaning</h1>
          <p className="text-gray-500">Fill in the details and cleaners will see your request</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Service Type */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              <Sparkles className="w-4 h-4 inline mr-1" />
              Service Type *
            </label>
            <select
              name="serviceType"
              value={formData.serviceType}
              onChange={handleChange}
              className={`w-full p-4 rounded-xl border-2 ${
                errors.serviceType ? 'border-red-300' : 'border-gray-200'
              } focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none appearance-none bg-white`}
            >
              <option value="">Select a service...</option>
              {SERVICE_TYPES.map(service => (
                <option key={service.value} value={service.value}>
                  {service.value}
                </option>
              ))}
            </select>
            {selectedService && (
              <p className="text-sm text-gray-500">{selectedService.description}</p>
            )}
            {errors.serviceType && (
              <p className="text-red-500 text-sm flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.serviceType}
              </p>
            )}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date *
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                min={getMinDate()}
                className={`w-full p-4 rounded-xl border-2 ${
                  errors.date ? 'border-red-300' : 'border-gray-200'
                } focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none`}
              />
              {errors.date && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.date}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                <Clock className="w-4 h-4 inline mr-1" />
                Time *
              </label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                className={`w-full p-4 rounded-xl border-2 ${
                  errors.time ? 'border-red-300' : 'border-gray-200'
                } focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none`}
              />
              {errors.time && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.time}
                </p>
              )}
            </div>
          </div>

          {/* Hours */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              <Clock className="w-4 h-4 inline mr-1" />
              Estimated Hours *
            </label>
            <div className="grid grid-cols-6 gap-2">
              {HOUR_OPTIONS.map(hours => (
                <button
                  key={hours}
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, hours: hours.toString() }));
                    if (errors.hours) setErrors(prev => ({ ...prev, hours: null }));
                  }}
                  className={`py-3 rounded-xl font-medium transition-all ${
                    formData.hours === hours.toString()
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {hours}h
                </button>
              ))}
            </div>
            {errors.hours && (
              <p className="text-red-500 text-sm flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.hours}
              </p>
            )}
          </div>

          {/* Estimated Cost */}
          {estimatedCost && (
            <div className="bg-primary-50 rounded-xl p-4 flex items-center gap-3">
              <DollarSign className="w-6 h-6 text-primary-600" />
              <div>
                <p className="text-sm text-primary-700 font-medium">Estimated Cost</p>
                <p className="text-lg font-bold text-primary-800">
                  ${estimatedCost.min} - ${estimatedCost.max}
                </p>
              </div>
              <Info className="w-4 h-4 text-primary-400 ml-auto" />
            </div>
          )}

          {/* Address */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              <MapPin className="w-4 h-4 inline mr-1" />
              Service Address *
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="123 Main St, Toronto, ON"
              className={`w-full p-4 rounded-xl border-2 ${
                errors.address ? 'border-red-300' : 'border-gray-200'
              } focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none`}
            />
            {errors.address && (
              <p className="text-red-500 text-sm flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.address}
              </p>
            )}
          </div>

          {/* Instructions */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              <FileText className="w-4 h-4 inline mr-1" />
              Special Instructions (Optional)
            </label>
            <textarea
              name="instructions"
              value={formData.instructions}
              onChange={handleChange}
              placeholder="Any special requests or instructions for the cleaner..."
              rows={3}
              className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none resize-none"
            />
          </div>

          {errors.submit && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {errors.submit}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-primary-600 to-secondary-500 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-50 disabled:transform-none"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Posting Request...
              </span>
            ) : (
              'Post Cleaning Request'
            )}
          </button>

          <p className="text-center text-sm text-gray-500">
            All cleaners will be able to see and accept your request
          </p>
        </form>
      </div>
    </div>
  );
};

export default CreateRequest;
