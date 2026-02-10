
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Button, Card, Input } from './UI';
import { storage } from '../utils/storage';
import StripeConnectSetup from './StripeConnectSetup';
import VerificationBadge from './VerificationBadge';
import OtpVerificationModal from './OtpVerificationModal';
import {
  ArrowLeft, User as UserIcon, Camera, Shield, LogOut, ChevronDown, ChevronUp,
  CreditCard, Landmark, Star, MapPin, Phone, Mail, Clock, DollarSign,
  CheckCircle, Award, Edit2, Save, X, Eye, EyeOff, Lock, Wallet, AlertCircle
} from 'lucide-react';

interface Props {
  user: User;
  onBack: () => void;
  onLogout: () => void;
  onUserUpdate?: (user: User) => void;
}

const ProfileView: React.FC<Props> = ({ user, onBack, onLogout, onUserUpdate }) => {
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
  const [showPassword, setShowPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [expandedSections, setExpandedSections] = useState({
    verification: true,
    personal: false,
    payment: false,
    professional: false,
    stripe: false
  });
  const [verifyModalType, setVerifyModalType] = useState<'email' | 'phone' | null>(null);
  const [showAddressConfirm, setShowAddressConfirm] = useState(false);
  const [editingVerification, setEditingVerification] = useState<'email' | 'phone' | 'address' | null>(null);
  const [verificationEditValue, setVerificationEditValue] = useState('');
  const [verificationAddressEdit, setVerificationAddressEdit] = useState({
    streetAddress: '', apartment: '', city: '', province: '', country: ''
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

    const updatedName = `${formData.firstName} ${formData.lastName}`.trim();
    const updatedAddress = `${formData.streetAddress}${formData.apartment ? ', ' + formData.apartment : ''}, ${formData.city}, ${formData.province}, ${formData.country}`;

    // Reset verification if phone or address changed
    const phoneChanged = formData.phone !== user.phone;
    const addressChanged = updatedAddress !== user.address;

    const updatedUser = {
      ...user,
      ...formData,
      name: updatedName,
      address: updatedAddress,
      ...(phoneChanged ? { phoneVerified: false } : {}),
      ...(addressChanged ? { addressVerified: false } : {}),
    };

    await storage.set(`user:${user.id}`, updatedUser);
    await storage.set('currentUser', updatedUser);
    if (onUserUpdate) onUserUpdate(updatedUser as User);

    setIsSaving(false);
    setIsEditing(false);
  };

  const handleVerification = async (field: 'emailVerified' | 'phoneVerified' | 'addressVerified') => {
    const updatedUser = { ...user, [field]: true };
    await storage.set(`user:${user.id}`, updatedUser);
    await storage.set('currentUser', updatedUser);
    if (onUserUpdate) onUserUpdate(updatedUser);
    setVerifyModalType(null);
    setShowAddressConfirm(false);
  };

  const startEditingVerification = (field: 'email' | 'phone' | 'address') => {
    setEditingVerification(field);
    if (field === 'email') {
      setVerificationEditValue(user.email || '');
    } else if (field === 'phone') {
      setVerificationEditValue(user.phone || '');
    } else {
      setVerificationAddressEdit({
        streetAddress: user.streetAddress || '',
        apartment: user.apartment || '',
        city: user.city || 'Toronto',
        province: user.province || 'Ontario',
        country: user.country || 'Canada',
      });
    }
  };

  const handleSaveVerificationEdit = async () => {
    if (!editingVerification) return;

    let updates: Partial<User> = {};

    if (editingVerification === 'email') {
      const newEmail = verificationEditValue.trim().toLowerCase();
      if (!newEmail || !newEmail.includes('@')) {
        alert('Please enter a valid email address');
        return;
      }
      if (newEmail === user.email) {
        setEditingVerification(null);
        return;
      }
      updates = { email: newEmail, emailVerified: false };
    } else if (editingVerification === 'phone') {
      const newPhone = verificationEditValue.trim();
      if (!newPhone || newPhone.replace(/\D/g, '').length < 10) {
        alert('Please enter a valid phone number (at least 10 digits)');
        return;
      }
      if (newPhone === user.phone) {
        setEditingVerification(null);
        return;
      }
      updates = { phone: newPhone, phoneVerified: false };
    } else {
      const addr = verificationAddressEdit;
      if (!addr.streetAddress.trim()) {
        alert('Please enter a street address');
        return;
      }
      const newFullAddress = `${addr.streetAddress}${addr.apartment ? ', ' + addr.apartment : ''}, ${addr.city}, ${addr.province}, ${addr.country}`;
      updates = {
        streetAddress: addr.streetAddress,
        apartment: addr.apartment,
        city: addr.city,
        province: addr.province,
        country: addr.country,
        address: newFullAddress,
        addressVerified: false,
      };
    }

    const updatedUser = { ...user, ...updates };
    await storage.set(`user:${user.id}`, updatedUser);
    await storage.set('currentUser', updatedUser);
    if (onUserUpdate) onUserUpdate(updatedUser as User);
    setEditingVerification(null);
  };

  const verifiedCount = [user.emailVerified, user.phoneVerified, user.addressVerified].filter(Boolean).length;

  const isCleaner = user.type === 'cleaner';
  const primaryColor = isCleaner ? 'pink' : 'purple';

  return (
    <div className="animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-500 hover:text-purple-600 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-semibold">Back to Dashboard</span>
        </button>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 text-gray-400 hover:text-red-500 font-semibold text-sm transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>

      {/* Profile Header Card */}
      <Card className={`p-6 mb-6 bg-gradient-to-br ${isCleaner ? 'from-pink-50 to-orange-50 border-pink-100' : 'from-purple-50 to-pink-50 border-purple-100'}`}>
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Avatar */}
          <div className="relative">
            {user.photoURL ? (
              <img src={user.photoURL} alt="" className="w-24 h-24 rounded-2xl border-4 border-white shadow-xl object-cover" />
            ) : (
              <div className={`w-24 h-24 rounded-2xl ${isCleaner ? 'bg-pink-100' : 'bg-purple-100'} flex items-center justify-center border-4 border-white shadow-xl`}>
                <UserIcon className={`w-12 h-12 ${isCleaner ? 'text-pink-600' : 'text-purple-600'}`} />
              </div>
            )}
            <button className={`absolute -bottom-2 -right-2 p-2 bg-white rounded-xl shadow-lg border border-gray-100 ${isCleaner ? 'text-pink-600 hover:bg-pink-50' : 'text-purple-600 hover:bg-purple-50'} transition-colors`}>
              <Camera className="w-4 h-4" />
            </button>
          </div>

          {/* Info */}
          <div className="text-center md:text-left flex-1">
            <h2 className="text-2xl font-bold font-outfit text-gray-900">
              {formData.firstName} {formData.lastName}
            </h2>
            <p className={`text-sm font-semibold uppercase tracking-wider ${isCleaner ? 'text-pink-600' : 'text-purple-600'}`}>
              {isCleaner ? 'Professional Cleaner' : 'Homeowner'}
            </p>

            {/* Stats for Cleaner */}
            {isCleaner && (
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-3">
                <div className="flex items-center gap-1 text-sm">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-bold text-gray-900">{user.rating?.toFixed(1) || '5.0'}</span>
                  <span className="text-gray-500">({user.reviewCount || 0} reviews)</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <DollarSign className="w-4 h-4" />
                  <span>${user.hourlyRate}/hr</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Award className="w-4 h-4" />
                  <span>{user.experience || 1}+ years exp.</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-center md:justify-start gap-2 mt-3 text-sm text-gray-500">
              <Mail className="w-4 h-4" />
              <span>{formData.email}</span>
            </div>
          </div>

          {/* Quick Stats Card for Cleaner */}
          {isCleaner && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-pink-100">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Total Earnings</p>
              <p className="text-3xl font-bold text-green-600">${(user.totalEarnings || 0).toLocaleString('en-CA', { minimumFractionDigits: 2 })}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Sections */}
      <div className="space-y-4">
        {/* Verification Status */}
        <Card className="overflow-hidden">
          <button
            onClick={() => toggleSection('verification')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-green-100 text-green-600 rounded-xl">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Verification Status</h3>
                <p className="text-xs text-gray-500">Verify your email, phone, and address</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                verifiedCount === 3 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {verifiedCount}/3
              </span>
              {expandedSections.verification ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </div>
          </button>

          {expandedSections.verification && (
            <div className="px-6 pb-6 border-t border-gray-100 pt-4 space-y-3">
              {verifiedCount === 3 && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <p className="text-sm text-green-700 font-medium">All verifications complete! Your profile is fully verified.</p>
                </div>
              )}

              {/* Email */}
              <div className="p-4 rounded-xl border border-gray-100 hover:bg-gray-50/50 transition-colors">
                {editingVerification === 'email' ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <p className="font-medium text-gray-900 text-sm">Update Email Address</p>
                    </div>
                    <input
                      type="email"
                      value={verificationEditValue}
                      onChange={e => setVerificationEditValue(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 focus:border-purple-500 outline-none text-sm"
                      placeholder="new@email.com"
                      autoFocus
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSaveVerificationEdit}
                        className={`px-4 py-2 ${isCleaner ? 'bg-pink-600' : 'bg-purple-600'} text-white rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity`}
                      >
                        Save & Re-verify
                      </button>
                      <button
                        onClick={() => setEditingVerification(null)}
                        className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                    <p className="text-xs text-amber-600">Changing your email will require re-verification.</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900 text-sm">Email Address</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {user.emailVerified ? (
                        <>
                          <VerificationBadge verified={true} label="Email" showLabel />
                          <button
                            onClick={() => startEditingVerification('email')}
                            className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            Change
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEditingVerification('email')}
                            className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setVerifyModalType('email')}
                            className={`px-4 py-2 ${isCleaner ? 'bg-pink-100 text-pink-600 hover:bg-pink-200' : 'bg-purple-100 text-purple-600 hover:bg-purple-200'} rounded-lg text-xs font-semibold transition-colors`}
                          >
                            Verify Email
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Phone */}
              <div className="p-4 rounded-xl border border-gray-100 hover:bg-gray-50/50 transition-colors">
                {editingVerification === 'phone' ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <p className="font-medium text-gray-900 text-sm">Update Phone Number</p>
                    </div>
                    <input
                      type="tel"
                      value={verificationEditValue}
                      onChange={e => setVerificationEditValue(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 focus:border-purple-500 outline-none text-sm"
                      placeholder="(416) 555-0199"
                      autoFocus
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSaveVerificationEdit}
                        className={`px-4 py-2 ${isCleaner ? 'bg-pink-600' : 'bg-purple-600'} text-white rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity`}
                      >
                        Save & Re-verify
                      </button>
                      <button
                        onClick={() => setEditingVerification(null)}
                        className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                    <p className="text-xs text-amber-600">Changing your phone will require re-verification.</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900 text-sm">Phone Number</p>
                        <p className="text-xs text-gray-500">{user.phone || 'Not set'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {user.phoneVerified ? (
                        <>
                          <VerificationBadge verified={true} label="Phone" showLabel />
                          <button
                            onClick={() => startEditingVerification('phone')}
                            className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            Change
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEditingVerification('phone')}
                            className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setVerifyModalType('phone')}
                            className={`px-4 py-2 ${isCleaner ? 'bg-pink-100 text-pink-600 hover:bg-pink-200' : 'bg-purple-100 text-purple-600 hover:bg-purple-200'} rounded-lg text-xs font-semibold transition-colors`}
                          >
                            Verify Phone
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Address */}
              <div className="p-4 rounded-xl border border-gray-100 hover:bg-gray-50/50 transition-colors">
                {editingVerification === 'address' ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <p className="font-medium text-gray-900 text-sm">Update Address</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2">
                        <label className="text-xs font-medium text-gray-500 block mb-1">Street Address</label>
                        <input
                          type="text"
                          value={verificationAddressEdit.streetAddress}
                          onChange={e => setVerificationAddressEdit({ ...verificationAddressEdit, streetAddress: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 focus:border-purple-500 outline-none text-sm"
                          placeholder="123 King Street West"
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1">Apartment/Unit</label>
                        <input
                          type="text"
                          value={verificationAddressEdit.apartment}
                          onChange={e => setVerificationAddressEdit({ ...verificationAddressEdit, apartment: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 focus:border-purple-500 outline-none text-sm"
                          placeholder="Apt 4B"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1">City</label>
                        <input
                          type="text"
                          value={verificationAddressEdit.city}
                          onChange={e => setVerificationAddressEdit({ ...verificationAddressEdit, city: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 focus:border-purple-500 outline-none text-sm"
                          placeholder="Toronto"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1">Province</label>
                        <select
                          value={verificationAddressEdit.province}
                          onChange={e => setVerificationAddressEdit({ ...verificationAddressEdit, province: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 focus:border-purple-500 outline-none text-sm"
                        >
                          <option value="Ontario">Ontario</option>
                          <option value="Quebec">Quebec</option>
                          <option value="British Columbia">British Columbia</option>
                          <option value="Alberta">Alberta</option>
                          <option value="Manitoba">Manitoba</option>
                          <option value="Saskatchewan">Saskatchewan</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1">Country</label>
                        <input
                          type="text"
                          value={verificationAddressEdit.country}
                          disabled
                          className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-100 bg-gray-50 text-gray-500 text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSaveVerificationEdit}
                        className={`px-4 py-2 ${isCleaner ? 'bg-pink-600' : 'bg-purple-600'} text-white rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity`}
                      >
                        Save & Re-verify
                      </button>
                      <button
                        onClick={() => setEditingVerification(null)}
                        className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                    <p className="text-xs text-amber-600">Changing your address will require re-verification.</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900 text-sm">Address</p>
                        <p className="text-xs text-gray-500 max-w-[200px] truncate">{user.address || 'Not set'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {user.addressVerified ? (
                        <>
                          <VerificationBadge verified={true} label="Address" showLabel />
                          <button
                            onClick={() => startEditingVerification('address')}
                            className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            Change
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEditingVerification('address')}
                            className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setShowAddressConfirm(true)}
                            className={`px-4 py-2 ${isCleaner ? 'bg-pink-100 text-pink-600 hover:bg-pink-200' : 'bg-purple-100 text-purple-600 hover:bg-purple-200'} rounded-lg text-xs font-semibold transition-colors`}
                          >
                            Verify Address
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {user.authProvider === 'google' && (
                <div className="flex items-center gap-2 pt-2 text-xs text-gray-400">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Signed in with Google
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Personal Information */}
        <Card className="overflow-hidden">
          <button
            onClick={() => toggleSection('personal')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2.5 ${isCleaner ? 'bg-pink-100 text-pink-600' : 'bg-purple-100 text-purple-600'} rounded-xl`}>
                <UserIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Personal Information</h3>
                <p className="text-xs text-gray-500">Name, contact details, and address</p>
              </div>
            </div>
            {expandedSections.personal ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </button>

          {expandedSections.personal && (
            <div className="p-6 border-t border-gray-100 animate-in fade-in duration-200">
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Account Details</span>
                {!isEditing && (
                  <button
                    onClick={() => startEditing('personal')}
                    className={`flex items-center gap-1 text-sm font-semibold ${isCleaner ? 'text-pink-600 bg-pink-50 hover:bg-pink-100' : 'text-purple-600 bg-purple-50 hover:bg-purple-100'} px-3 py-1.5 rounded-lg transition-colors`}
                  >
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  value={formData.firstName || ''}
                  onChange={(e: any) => setFormData({ ...formData, firstName: e.target.value })}
                  disabled={!isEditing}
                />
                <Input
                  label="Last Name"
                  value={formData.lastName || ''}
                  onChange={(e: any) => setFormData({ ...formData, lastName: e.target.value })}
                  disabled={!isEditing}
                />
                <Input
                  label="Email Address"
                  value={formData.email || ''}
                  disabled
                  className="bg-gray-50"
                />
                <Input
                  label="Phone Number"
                  value={formData.phone || ''}
                  onChange={(e: any) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!isEditing}
                />
                <div className="relative">
                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password || ''}
                    onChange={(e: any) => setFormData({ ...formData, password: e.target.value })}
                    disabled={!isEditing}
                  />
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-9 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                </div>
                {isEditing && (
                  <Input
                    label="Confirm Password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e: any) => setConfirmPassword(e.target.value)}
                  />
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-4">Address</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Input
                      label="Street Address"
                      value={formData.streetAddress || ''}
                      onChange={(e: any) => setFormData({ ...formData, streetAddress: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                  <Input
                    label="Apartment/Unit (Optional)"
                    value={formData.apartment || ''}
                    onChange={(e: any) => setFormData({ ...formData, apartment: e.target.value })}
                    disabled={!isEditing}
                  />
                  <Input
                    label="City"
                    value={formData.city || ''}
                    onChange={(e: any) => setFormData({ ...formData, city: e.target.value })}
                    disabled={!isEditing}
                  />
                  <Input
                    label="Province"
                    value={formData.province || ''}
                    onChange={(e: any) => setFormData({ ...formData, province: e.target.value })}
                    disabled={!isEditing}
                  />
                  <Input
                    label="Country"
                    value={formData.country || ''}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Payment Information */}
        <Card className="overflow-hidden">
          <button
            onClick={() => toggleSection('payment')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                {isCleaner ? <Landmark className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Payment Information</h3>
                <p className="text-xs text-gray-500">
                  {isCleaner ? 'Bank details for receiving payments' : 'Credit card for cleaning services'}
                </p>
              </div>
            </div>
            {expandedSections.payment ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </button>

          {expandedSections.payment && (
            <div className="p-6 border-t border-gray-100 animate-in fade-in duration-200">
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-gray-500">
                  {isCleaner
                    ? 'Set up your bank details to receive payments for completed jobs.'
                    : 'Manage your payment method for cleaning services.'}
                </p>
                {!isEditing && (
                  <button
                    onClick={() => startEditing('payment')}
                    className="flex items-center gap-1 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors ml-4 flex-shrink-0"
                  >
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!isCleaner ? (
                  <>
                    <Input
                      label="Cardholder Name"
                      placeholder="John Doe"
                      value={formData.cardName || ''}
                      onChange={(e: any) => setFormData({ ...formData, cardName: e.target.value })}
                      disabled={!isEditing}
                    />
                    <Input
                      label="Card Number"
                      placeholder="**** **** **** 1234"
                      value={formData.cardNumber || ''}
                      onChange={(e: any) => setFormData({ ...formData, cardNumber: e.target.value })}
                      disabled={!isEditing}
                    />
                    <Input
                      label="Expiry Date"
                      placeholder="MM/YY"
                      value={formData.expiry || ''}
                      onChange={(e: any) => setFormData({ ...formData, expiry: e.target.value })}
                      disabled={!isEditing}
                    />
                    <Input
                      label="CVV"
                      placeholder="***"
                      type="password"
                      value={formData.cvv || ''}
                      onChange={(e: any) => setFormData({ ...formData, cvv: e.target.value })}
                      disabled={!isEditing}
                    />
                  </>
                ) : (
                  <>
                    <Input
                      label="Bank Name"
                      placeholder="RBC Royal Bank"
                      value={formData.bankName || ''}
                      onChange={(e: any) => setFormData({ ...formData, bankName: e.target.value })}
                      disabled={!isEditing}
                    />
                    <Input
                      label="Account Holder"
                      placeholder="Jane Smith"
                      value={formData.accountHolder || ''}
                      onChange={(e: any) => setFormData({ ...formData, accountHolder: e.target.value })}
                      disabled={!isEditing}
                    />
                    <Input
                      label="Transit Number"
                      placeholder="00000"
                      value={formData.transitNumber || ''}
                      onChange={(e: any) => setFormData({ ...formData, transitNumber: e.target.value })}
                      disabled={!isEditing}
                    />
                    <Input
                      label="Institution Number"
                      placeholder="000"
                      value={formData.institutionNumber || ''}
                      onChange={(e: any) => setFormData({ ...formData, institutionNumber: e.target.value })}
                      disabled={!isEditing}
                    />
                    <div className="md:col-span-2">
                      <Input
                        label="Account Number"
                        placeholder="*****1234"
                        value={formData.accountNumber || ''}
                        onChange={(e: any) => setFormData({ ...formData, accountNumber: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="mt-6 flex items-center gap-3 bg-blue-50 p-4 rounded-xl border border-blue-100">
                <Lock className="w-5 h-5 text-blue-600" />
                <p className="text-sm text-blue-700">Your payment details are encrypted and stored securely.</p>
              </div>
            </div>
          )}
        </Card>

        {/* Stripe Connect Payouts (Cleaner only) */}
        {isCleaner && (
          <Card className="overflow-hidden">
            <button
              onClick={() => toggleSection('stripe')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-green-100 text-green-600 rounded-xl">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Stripe Payouts</h3>
                  <p className="text-xs text-gray-500">Set up and manage your payment account</p>
                </div>
              </div>
              {expandedSections.stripe ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>

            {expandedSections.stripe && (
              <div className="p-6 border-t border-gray-100 animate-in fade-in duration-200">
                <StripeConnectSetup user={user} />
              </div>
            )}
          </Card>
        )}

        {/* Professional Details (Cleaner only) */}
        {isCleaner && (
          <Card className="overflow-hidden">
            <button
              onClick={() => toggleSection('professional')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-pink-100 text-pink-600 rounded-xl">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Professional Details</h3>
                  <p className="text-xs text-gray-500">Rates, experience, and services</p>
                </div>
              </div>
              {expandedSections.professional ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>

            {expandedSections.professional && (
              <div className="p-6 border-t border-gray-100 animate-in fade-in duration-200">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Your Professional Profile</span>
                  {!isEditing && (
                    <button
                      onClick={() => startEditing('professional')}
                      className="flex items-center gap-1 text-sm font-semibold text-pink-600 bg-pink-50 hover:bg-pink-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 ml-1 block mb-1">Hourly Rate ($CAD)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">$</span>
                      <input
                        type="number"
                        min="20"
                        max="75"
                        value={formData.hourlyRate || 0}
                        onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
                        disabled={!isEditing}
                        className="w-full pl-8 pr-12 py-3 rounded-xl border-2 border-gray-100 focus:border-pink-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">/hr</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 ml-1 block mb-1">Years of Experience</label>
                    <select
                      value={formData.experience || 1}
                      onChange={(e) => setFormData({ ...formData, experience: Number(e.target.value) })}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-pink-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500"
                    >
                      <option value={0}>Less than 1 year</option>
                      <option value={1}>1-2 years</option>
                      <option value={3}>3-5 years</option>
                      <option value={5}>5-10 years</option>
                      <option value={10}>10+ years</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-700 ml-1 block mb-1">About You</label>
                  <textarea
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-pink-500 outline-none h-28 transition-all disabled:bg-gray-50 disabled:text-gray-500 resize-none"
                    placeholder="Tell homeowners about your experience and cleaning style..."
                    value={formData.bio || ''}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>

                {/* Services */}
                {formData.services && formData.services.length > 0 && (
                  <div className="mt-4">
                    <label className="text-sm font-medium text-gray-700 ml-1 block mb-2">Services Offered</label>
                    <div className="flex flex-wrap gap-2">
                      {formData.services.map((service, idx) => (
                        <span key={idx} className="px-3 py-1.5 bg-pink-100 text-pink-700 rounded-lg text-sm font-medium flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> {service}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        )}

        {/* Save/Cancel Buttons */}
        {isEditing && (
          <div className="flex flex-col sm:flex-row gap-3 pt-4 animate-in fade-in duration-200">
            <Button onClick={handleSave} className="flex-1" disabled={isSaving}>
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </Button>
            <Button variant="secondary" onClick={() => setIsEditing(false)} disabled={isSaving}>
              <X className="w-4 h-4" />
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <div className="flex items-center justify-center gap-2 text-gray-400">
          <Shield className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Your account is secured with HollaClean</span>
        </div>
        <p className="text-xs text-gray-400 mt-2">Member since {new Date(user.createdAt).toLocaleDateString('en-CA', { month: 'long', year: 'numeric' })}</p>
      </div>

      {/* OTP Verification Modal */}
      {verifyModalType && (
        <OtpVerificationModal
          type={verifyModalType}
          target={verifyModalType === 'email' ? user.email : user.phone}
          onVerify={() => handleVerification(verifyModalType === 'email' ? 'emailVerified' : 'phoneVerified')}
          onClose={() => setVerifyModalType(null)}
        />
      )}

      {/* Address Confirmation Dialog */}
      {showAddressConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddressConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 fade-in duration-200">
            <div className="text-center mb-4">
              <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold font-outfit text-gray-900">Confirm Your Address</h3>
              <p className="text-sm text-gray-500 mt-1">Please confirm this is your correct address</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="font-medium text-gray-900 text-sm">{user.streetAddress}{user.apartment ? `, ${user.apartment}` : ''}</p>
              <p className="text-sm text-gray-600">{user.city}, {user.province}</p>
              <p className="text-sm text-gray-600">{user.country}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleVerification('addressVerified')}
                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
              >
                Yes, this is correct
              </button>
              <button
                onClick={() => setShowAddressConfirm(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileView;
