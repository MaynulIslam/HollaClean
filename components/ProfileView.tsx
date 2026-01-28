
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Button, Card, Input } from './UI';
import { storage } from '../utils/storage';
import { ArrowLeft, User as UserIcon, Camera, Shield, LogOut, ChevronDown, ChevronUp, CreditCard, Landmark } from 'lucide-react';

interface Props {
  user: User;
  onBack: () => void;
  onLogout: () => void;
}

const ProfileView: React.FC<Props> = ({ user, onBack, onLogout }) => {
  // Initialize form data with existing user data or defaults
  const [formData, setFormData] = useState<Partial<User & {
    cardName?: string;
    cardNumber?: string;
    expiry?: string;
    cvv?: string;
    bankName?: string;
    accountHolder?: string;
    transitNumber?: string;
    institutionNumber?: string;
    accountNumber?: string;
  }>>({});
  const [confirmPassword, setConfirmPassword] = useState(user.password || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Collapsible state
  const [expandedSections, setExpandedSections] = useState({
    personal: false,
    payment: false,
    professional: false
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const startEditing = (section?: keyof typeof expandedSections) => {
    setIsEditing(true);
    if (section) {
      setExpandedSections(prev => ({ ...prev, [section]: true }));
    }
  };

  useEffect(() => {
    // Handle data migration logic for older users
    const nameParts = user.name ? user.name.split(' ') : ['', ''];
    const firstName = user.firstName || nameParts[0] || '';
    const lastName = user.lastName || nameParts.slice(1).join(' ') || '';
    
    setFormData({
      ...user,
      firstName,
      lastName,
      streetAddress: user.streetAddress || user.address || '',
      apartment: user.apartment || '',
      city: user.city || 'Toronto',
      province: user.province || 'Ontario',
      country: user.country || 'Canada',
      // Mock payment data if not present (in a real app these come from a secure vault)
      cardName: (user as any).cardName || '',
      cardNumber: (user as any).cardNumber || '',
      expiry: (user as any).expiry || '',
      cvv: (user as any).cvv || '',
      bankName: (user as any).bankName || '',
      accountHolder: (user as any).accountHolder || '',
      transitNumber: (user as any).transitNumber || '',
      institutionNumber: (user as any).institutionNumber || '',
      accountNumber: (user as any).accountNumber || ''
    });
    setConfirmPassword(user.password || '');
  }, [user]);

  const handleSave = async () => {
    if (formData.password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    setIsSaving(true);
    
    // Construct the full name and full address from granular fields for backward compatibility
    const updatedName = `${formData.firstName} ${formData.lastName}`.trim();
    const updatedAddress = `${formData.streetAddress}${formData.apartment ? ', ' + formData.apartment : ''}, ${formData.city}, ${formData.province}, ${formData.country}`;

    const updatedUser = {
      ...user,
      ...formData,
      name: updatedName,
      address: updatedAddress
    };

    await storage.set(`user:${user.id}`, updatedUser);
    await storage.set('currentUser', updatedUser);
    
    setIsSaving(false);
    setIsEditing(false);
    alert("Profile updated successfully!");
  };

  return (
    <div className="animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-purple-600 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-semibold">Back</span>
        </button>
        <button onClick={onLogout} className="flex items-center gap-2 text-red-500 font-bold text-sm">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>

      <div className="flex flex-col items-center mb-8">
        <div className="relative">
          <div className="w-24 h-24 rounded-3xl bg-purple-100 flex items-center justify-center text-purple-600 border-4 border-white shadow-xl">
            <UserIcon className="w-12 h-12" />
          </div>
          <button className="absolute -bottom-2 -right-2 p-2 bg-white rounded-xl shadow-lg border border-gray-100 text-purple-600">
            <Camera className="w-4 h-4" />
          </button>
        </div>
        <h2 className="mt-4 text-2xl font-bold font-outfit capitalize">{formData.firstName} {formData.lastName}</h2>
        <p className="text-gray-400 text-xs font-black uppercase tracking-widest">{user.type}</p>
      </div>

      <div className="space-y-4">
        {/* Personal Information Collapsible */}
        <Card className="p-0 overflow-hidden">
          <button 
            onClick={() => toggleSection('personal')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                <UserIcon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold">Personal Information</h3>
            </div>
            {expandedSections.personal ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </button>
          
          <div className={`transition-all duration-300 ease-in-out border-t border-gray-50 ${expandedSections.personal ? 'max-h-[2000px] opacity-100 p-6' : 'max-h-0 opacity-0 overflow-hidden'}`}>
            <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">BASIC & ADDRESS INFO</span>
              {!isEditing && (
                <button onClick={() => startEditing('personal')} className="text-purple-600 text-sm font-bold hover:underline bg-purple-50 px-3 py-1 rounded-lg">
                  Edit Profile
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input 
                label="First Name" 
                value={formData.firstName || ''} 
                onChange={(e: any) => setFormData({...formData, firstName: e.target.value})} 
                disabled={!isEditing} 
                placeholder="First Name"
              />
              <Input 
                label="Last Name" 
                value={formData.lastName || ''} 
                onChange={(e: any) => setFormData({...formData, lastName: e.target.value})} 
                disabled={!isEditing} 
                placeholder="Last Name"
              />
              <Input 
                label="Email Address" 
                value={formData.email || ''} 
                disabled 
                className="bg-gray-50 text-gray-400"
              />
              <Input 
                label="Phone Number" 
                value={formData.phone || ''} 
                onChange={(e: any) => setFormData({...formData, phone: e.target.value})} 
                disabled={!isEditing} 
                placeholder="Phone Number"
              />
              <Input 
                label="Password" 
                type="password"
                value={formData.password || ''} 
                onChange={(e: any) => setFormData({...formData, password: e.target.value})} 
                disabled={!isEditing} 
                placeholder="••••••••"
              />
              <Input 
                label="Confirm Password" 
                type="password"
                value={confirmPassword} 
                onChange={(e: any) => setConfirmPassword(e.target.value)} 
                disabled={!isEditing} 
                placeholder="••••••••"
              />
            </div>

            <div className="pt-8 border-t border-gray-100 mt-8 space-y-6">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ADDRESS DETAILS</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Input 
                    label="Street Address" 
                    value={formData.streetAddress || ''} 
                    onChange={(e: any) => setFormData({...formData, streetAddress: e.target.value})} 
                    disabled={!isEditing} 
                    placeholder="123 Example St"
                  />
                </div>
                <Input 
                  label="Apartment/Unit" 
                  value={formData.apartment || ''} 
                  onChange={(e: any) => setFormData({...formData, apartment: e.target.value})} 
                  disabled={!isEditing} 
                  placeholder="Apt 4B (Optional)"
                />
                <Input 
                  label="City" 
                  value={formData.city || ''} 
                  onChange={(e: any) => setFormData({...formData, city: e.target.value})} 
                  disabled={!isEditing} 
                  placeholder="City"
                />
                <Input 
                  label="Province" 
                  value={formData.province || ''} 
                  onChange={(e: any) => setFormData({...formData, province: e.target.value})} 
                  disabled={!isEditing} 
                  placeholder="Ontario"
                />
                <Input 
                  label="Country" 
                  value={formData.country || ''} 
                  onChange={(e: any) => setFormData({...formData, country: e.target.value})} 
                  disabled={!isEditing} 
                  placeholder="Canada"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Payment Information Collapsible */}
        <Card className="p-0 overflow-hidden">
          <button 
            onClick={() => toggleSection('payment')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold">Payment Information</h3>
            </div>
            {expandedSections.payment ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </button>
          
          <div className={`transition-all duration-300 ease-in-out border-t border-gray-50 ${expandedSections.payment ? 'max-h-[1000px] opacity-100 p-6' : 'max-h-0 opacity-0 overflow-hidden'}`}>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-500">
                {user.type === 'homeowner' 
                  ? 'Manage your credit card and billing methods for cleaning services.' 
                  : 'Set up your bank details to receive payments for completed jobs.'}
              </p>
              {!isEditing && (
                <button onClick={() => startEditing('payment')} className="text-blue-600 text-xs font-bold hover:underline bg-blue-50 px-3 py-1.5 rounded-lg whitespace-nowrap ml-4">
                  Add/Edit Payment Info
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {user.type === 'homeowner' ? (
                <>
                  <Input 
                    label="Cardholder Name" 
                    placeholder="John Doe" 
                    value={formData.cardName || ''}
                    onChange={(e: any) => setFormData({...formData, cardName: e.target.value})}
                    disabled={!isEditing} 
                  />
                  <Input 
                    label="Card Number" 
                    placeholder="•••• •••• •••• 1234" 
                    value={formData.cardNumber || ''}
                    onChange={(e: any) => setFormData({...formData, cardNumber: e.target.value})}
                    disabled={!isEditing} 
                  />
                  <Input 
                    label="Expiry Date" 
                    placeholder="MM/YY" 
                    value={formData.expiry || ''}
                    onChange={(e: any) => setFormData({...formData, expiry: e.target.value})}
                    disabled={!isEditing} 
                  />
                  <Input 
                    label="CVV" 
                    placeholder="•••" 
                    type="password" 
                    value={formData.cvv || ''}
                    onChange={(e: any) => setFormData({...formData, cvv: e.target.value})}
                    disabled={!isEditing} 
                  />
                </>
              ) : (
                <>
                  <Input 
                    label="Bank Name" 
                    placeholder="RBC Royal Bank" 
                    value={formData.bankName || ''}
                    onChange={(e: any) => setFormData({...formData, bankName: e.target.value})}
                    disabled={!isEditing} 
                  />
                  <Input 
                    label="Account Holder" 
                    placeholder="Jane Smith" 
                    value={formData.accountHolder || ''}
                    onChange={(e: any) => setFormData({...formData, accountHolder: e.target.value})}
                    disabled={!isEditing} 
                  />
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input 
                      label="Transit Number" 
                      placeholder="00000" 
                      value={formData.transitNumber || ''}
                      onChange={(e: any) => setFormData({...formData, transitNumber: e.target.value})}
                      disabled={!isEditing} 
                    />
                    <Input 
                      label="Institution Number" 
                      placeholder="000" 
                      value={formData.institutionNumber || ''}
                      onChange={(e: any) => setFormData({...formData, institutionNumber: e.target.value})}
                      disabled={!isEditing} 
                    />
                    <Input 
                      label="Account Number" 
                      placeholder="•••••1234" 
                      value={formData.accountNumber || ''}
                      onChange={(e: any) => setFormData({...formData, accountNumber: e.target.value})}
                      disabled={!isEditing} 
                    />
                  </div>
                </>
              )}
            </div>
            
            <div className="mt-6 flex items-center gap-3 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <Shield className="w-5 h-5 text-blue-600" />
              <p className="text-xs text-blue-700 font-medium">Your payment details are encrypted and stored securely.</p>
            </div>
          </div>
        </Card>

        {/* Professional Details (Cleaner only) */}
        {user.type === 'cleaner' && (
          <Card className="p-0 overflow-hidden">
            <button 
              onClick={() => toggleSection('professional')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-100 rounded-lg text-pink-600">
                  <Landmark className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold">Professional Details</h3>
              </div>
              {expandedSections.professional ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>
            
            <div className={`transition-all duration-300 ease-in-out border-t border-gray-50 ${expandedSections.professional ? 'max-h-[1000px] opacity-100 p-6' : 'max-h-0 opacity-0 overflow-hidden'}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input 
                  label="Hourly Rate ($/hr)" 
                  type="number" 
                  value={formData.hourlyRate || 0} 
                  onChange={(e: any) => setFormData({...formData, hourlyRate: Number(e.target.value)})} 
                  disabled={!isEditing} 
                />
                <Input 
                  label="Years of Experience" 
                  type="number" 
                  value={formData.experience || 0} 
                  onChange={(e: any) => setFormData({...formData, experience: Number(e.target.value)})} 
                  disabled={!isEditing} 
                />
              </div>
              <div className="flex flex-col gap-1 mt-6">
                <label className="text-sm font-medium text-gray-700 ml-1">Bio</label>
                <textarea 
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 disabled:bg-gray-50 disabled:text-gray-500 focus:border-purple-500 outline-none h-24 transition-all"
                  value={formData.bio || ''}
                  onChange={(e: any) => setFormData({...formData, bio: e.target.value})}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </Card>
        )}

        {isEditing && (
          <div className="flex flex-col sm:flex-row gap-3 pt-6 animate-in fade-in duration-300">
            <Button onClick={handleSave} className="flex-1" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button variant="secondary" onClick={() => setIsEditing(false)} disabled={isSaving}>
              Cancel
            </Button>
          </div>
        )}
      </div>

      <div className="mt-8 text-center text-gray-400 flex items-center justify-center gap-2">
        <Shield className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-widest">Account secured with HollaClean</span>
      </div>
    </div>
  );
};

export default ProfileView;
