
import React, { useState, useEffect } from 'react';
import { User, CleaningRequest, ServiceOffer } from '../types';
import { storage } from '../utils/storage';
import { Button, Card, Input } from './UI';
import { ArrowLeft, Sparkles, MapPin, Clock, Calendar as CalendarIcon, Image as ImageIcon, X } from 'lucide-react';

interface Props {
  user: User;
  onSuccess: () => void;
  onBack: () => void;
}

const CreateRequest: React.FC<Props> = ({ user, onSuccess, onBack }) => {
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

    const hourlyRateAvg = 30; // Base estimate
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
    alert("Cleaning request posted! Cleaners in Ontario will see it and can accept.");
    onSuccess();
  };

  const estMin = formData.hours * 25;
  const estMax = formData.hours * 45;

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
      </form>
    </div>
  );
};

export default CreateRequest;
