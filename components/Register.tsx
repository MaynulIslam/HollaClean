
import React, { useState, useEffect } from 'react';
import { Button, Input, Card } from './UI';
import { storage } from '../utils/storage';
import { User, UserType, ServiceOffer } from '../types';
import { ArrowLeft, UserPlus, Sparkles } from 'lucide-react';

interface RegisterProps {
  role: 'homeowner' | 'cleaner';
  onBack: () => void;
  onRegister: (user: User) => void;
}

const Register: React.FC<RegisterProps> = ({ role, onBack, onRegister }) => {
  const [formData, setFormData] = useState({
    name: '',
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
    hourlyRate: 25,
    experience: 1,
  });
  
  const [services, setServices] = useState<string[]>([]);
  const [serviceOptions, setServiceOptions] = useState<string[]>([]);
  const [error, setError] = useState('');

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

    const cleanEmail = formData.email.trim().toLowerCase();
    const keys = await storage.list('user:');
    for (const key of keys) {
      const existing = await storage.get(key);
      if (existing && existing.email.toLowerCase() === cleanEmail) {
        setError('Email already registered');
        return;
      }
    }

    // Split name for granular fields
    const nameParts = formData.name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');

    // Construct full address for compatibility
    const fullAddress = `${formData.streetAddress}${formData.apartment ? ', ' + formData.apartment : ''}, ${formData.city}, ${formData.province}, ${formData.country}`;

    const newUser: User = {
      id: `user_${Date.now()}`,
      type: role,
      ...formData,
      firstName,
      lastName,
      address: fullAddress,
      services: role === 'cleaner' ? services : undefined,
      rating: role === 'cleaner' ? 5.0 : undefined,
      reviewCount: role === 'cleaner' ? 0 : undefined,
      totalEarnings: role === 'cleaner' ? 0 : undefined,
      isAvailable: role === 'cleaner' ? true : undefined,
      createdAt: new Date().toISOString()
    };

    // Remove the temporary confirmPassword from the saved object
    delete (newUser as any).confirmPassword;

    await storage.set(`user:${newUser.id}`, newUser);
    await storage.set('currentUser', newUser);
    onRegister(newUser);
  };

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
    </div>
  );
};

export default Register;
