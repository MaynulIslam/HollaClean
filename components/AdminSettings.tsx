
import React, { useState, useEffect } from 'react';
import { Card, Button, Input } from './UI';
import { PlatformConfig, getPlatformConfig, savePlatformConfig, DEFAULT_PHOTO_TIPS } from '../utils/config';
import {
  Save, DollarSign, MapPin, Calendar, Image as ImageIcon,
  ToggleLeft, ToggleRight, Zap, Info, CheckCircle, RotateCcw,
  Settings, Navigation, Clock, Shield
} from 'lucide-react';

const featureLabels: Record<string, { label: string; desc: string }> = {
  messaging: { label: 'In-App Messaging', desc: 'Allow direct messaging between homeowners and cleaners' },
  notifications: { label: 'Push Notifications', desc: 'In-app notification center and alerts' },
  payments: { label: 'Stripe Payments', desc: 'Live Stripe payment processing' },
  mapIntegration: { label: 'Map Integration', desc: 'Google Maps links for addresses' },
  imageUpload: { label: 'Image Upload', desc: 'Allow photo uploads for room images' },
  reviews: { label: 'Reviews & Ratings', desc: 'Enable the review system after job completion' },
  googleAuth: { label: 'Google Sign-In', desc: 'Firebase Google authentication' },
  verificationSystem: { label: 'Verification System', desc: 'Email, phone, and address verification badges' },
  paymentReminders: { label: 'Payment Reminders', desc: 'Automatic payment reminder notifications' },
};

const photoTipLabels: Record<string, string> = {
  bedroom: 'Bedroom',
  bathroom: 'Bathroom',
  kitchen: 'Kitchen',
  livingRoom: 'Living Room',
  other: 'Other Room',
};

const AdminSettings: React.FC = () => {
  const [config, setConfig] = useState<PlatformConfig>(getPlatformConfig());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [section, setSection] = useState<'pricing' | 'geolocation' | 'booking' | 'photos' | 'features'>('pricing');

  const handleSave = () => {
    setSaving(true);
    savePlatformConfig(config);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = (sectionKey: string) => {
    if (!window.confirm(`Reset ${sectionKey} settings to defaults?`)) return;
    const defaults = getPlatformConfig();
    // Remove any saved config so defaults load
    if (sectionKey === 'all') {
      localStorage.removeItem('config:platform');
      setConfig(getPlatformConfig());
    } else {
      setConfig({ ...config, [sectionKey]: (defaults as any)[sectionKey] });
    }
  };

  const sections = [
    { id: 'pricing', label: 'Pricing', icon: DollarSign },
    { id: 'geolocation', label: 'Geolocation', icon: Navigation },
    { id: 'booking', label: 'Booking', icon: Calendar },
    { id: 'photos', label: 'Photo Tips', icon: ImageIcon },
    { id: 'features', label: 'Feature Flags', icon: Zap },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Platform Settings</h2>
          <p className="text-gray-500 text-sm">Configure pricing, features, and platform behavior.</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-sm text-green-600 font-semibold animate-in fade-in duration-200 flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              Settings saved!
            </span>
          )}
          <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save All Settings'}
          </Button>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all whitespace-nowrap ${
              section === s.id
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white text-gray-400 hover:text-gray-600 border border-gray-100'
            }`}
          >
            <s.icon className="w-3.5 h-3.5" />
            {s.label}
          </button>
        ))}
      </div>

      {/* Pricing Section */}
      {section === 'pricing' && (
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-bold text-gray-900">Pricing & Commission</h3>
            </div>
            <button onClick={() => handleReset('pricing')} className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1">
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-bold uppercase text-gray-400 tracking-wider block mb-2">Platform Commission (%)</label>
              <input
                type="number"
                min={1}
                max={50}
                step={1}
                value={Math.round(config.pricing.platformCommissionRate * 100)}
                onChange={e => setConfig({
                  ...config,
                  pricing: {
                    ...config.pricing,
                    platformCommissionRate: Number(e.target.value) / 100,
                    cleanerPayoutRate: 1 - Number(e.target.value) / 100,
                  },
                })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-purple-500 outline-none transition-all"
              />
              <p className="text-xs text-gray-400 mt-1">Cleaner gets {Math.round((1 - config.pricing.platformCommissionRate) * 100)}%</p>
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-gray-400 tracking-wider block mb-2">Default Hourly Rate ($)</label>
              <input
                type="number"
                min={10}
                max={200}
                value={config.pricing.defaultHourlyRate}
                onChange={e => setConfig({ ...config, pricing: { ...config.pricing, defaultHourlyRate: Number(e.target.value) } })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-purple-500 outline-none transition-all"
              />
              <p className="text-xs text-gray-400 mt-1">Used for cost estimates</p>
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-gray-400 tracking-wider block mb-2">Min Hourly Rate ($)</label>
              <input
                type="number"
                min={5}
                max={100}
                value={config.pricing.minimumHourlyRate}
                onChange={e => setConfig({ ...config, pricing: { ...config.pricing, minimumHourlyRate: Number(e.target.value) } })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-purple-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-gray-400 tracking-wider block mb-2">Max Hourly Rate ($)</label>
              <input
                type="number"
                min={20}
                max={500}
                value={config.pricing.maximumHourlyRate}
                onChange={e => setConfig({ ...config, pricing: { ...config.pricing, maximumHourlyRate: Number(e.target.value) } })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-purple-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Live preview */}
          <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
            <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" /> Live Preview
            </p>
            <p className="text-sm text-gray-700">
              For a <strong>{config.pricing.defaultHourlyRate}$/hr</strong> job at <strong>3 hours</strong>:
              Total = <strong>${config.pricing.defaultHourlyRate * 3}</strong>,
              Platform gets <strong>${(config.pricing.defaultHourlyRate * 3 * config.pricing.platformCommissionRate).toFixed(2)}</strong> ({Math.round(config.pricing.platformCommissionRate * 100)}%),
              Cleaner gets <strong>${(config.pricing.defaultHourlyRate * 3 * (1 - config.pricing.platformCommissionRate)).toFixed(2)}</strong> ({Math.round((1 - config.pricing.platformCommissionRate) * 100)}%).
            </p>
          </div>
        </Card>
      )}

      {/* Geolocation Section */}
      {section === 'geolocation' && (
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Navigation className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-bold text-gray-900">Geolocation & Proximity</h3>
            </div>
            <button onClick={() => handleReset('geolocation')} className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1">
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>

          <div className="max-w-md">
            <label className="text-xs font-bold uppercase text-gray-400 tracking-wider block mb-2">Max Accept Distance (meters)</label>
            <input
              type="number"
              min={10}
              max={50000}
              value={config.geolocation.maxAcceptDistance}
              onChange={e => setConfig({ ...config, geolocation: { ...config.geolocation, maxAcceptDistance: Number(e.target.value) } })}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-purple-500 outline-none transition-all"
            />
            <p className="text-xs text-gray-400 mt-1">
              Cleaners must be within this distance to accept a job.
              Current: <strong>{config.geolocation.maxAcceptDistance >= 1000 ? `${(config.geolocation.maxAcceptDistance / 1000).toFixed(1)} km` : `${config.geolocation.maxAcceptDistance} m`}</strong>
            </p>
          </div>

          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3">
            <MapPin className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-900">How it works</p>
              <p className="text-xs text-blue-700 mt-1">
                When a cleaner views available jobs, their GPS location is checked against the job address.
                If they are farther than the configured distance, the "Accept" button is disabled.
                Set a higher value (e.g., 5000m = 5km) for wider coverage, or lower (e.g., 100m) for strict proximity.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Booking Section */}
      {section === 'booking' && (
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-bold text-gray-900">Booking Rules</h3>
            </div>
            <button onClick={() => handleReset('booking')} className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1">
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold uppercase text-gray-400 tracking-wider block mb-2">Min Hours per Job</label>
              <input
                type="number"
                min={1}
                max={8}
                value={config.booking.minHours}
                onChange={e => setConfig({ ...config, booking: { ...config.booking, minHours: Number(e.target.value) } })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-purple-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-gray-400 tracking-wider block mb-2">Max Hours per Job</label>
              <input
                type="number"
                min={4}
                max={24}
                value={config.booking.maxHours}
                onChange={e => setConfig({ ...config, booking: { ...config.booking, maxHours: Number(e.target.value) } })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-purple-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-gray-400 tracking-wider block mb-2">Advance Booking (days)</label>
              <input
                type="number"
                min={7}
                max={365}
                value={config.booking.advanceBookingDays}
                onChange={e => setConfig({ ...config, booking: { ...config.booking, advanceBookingDays: Number(e.target.value) } })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-purple-500 outline-none transition-all"
              />
              <p className="text-xs text-gray-400 mt-1">How far ahead homeowners can book</p>
            </div>
          </div>
        </Card>
      )}

      {/* Photo Tips Section */}
      {section === 'photos' && (
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ImageIcon className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-bold text-gray-900">Room Photo Tips</h3>
            </div>
            <button onClick={() => handleReset('photoTips')} className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1">
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>
          <p className="text-sm text-gray-500">
            These suggestions are shown to homeowners when they upload photos for each room type.
          </p>

          <div className="space-y-4">
            {Object.entries(photoTipLabels).map(([key, label]) => (
              <div key={key}>
                <label className="text-xs font-bold uppercase text-gray-400 tracking-wider block mb-2">{label}</label>
                <textarea
                  value={config.photoTips[key] || ''}
                  onChange={e => setConfig({ ...config, photoTips: { ...config.photoTips, [key]: e.target.value } })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-purple-500 outline-none transition-all h-20 resize-none text-sm"
                  placeholder={DEFAULT_PHOTO_TIPS[key]}
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Feature Flags Section */}
      {section === 'features' && (
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-bold text-gray-900">Feature Flags</h3>
            </div>
            <button onClick={() => handleReset('features')} className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1">
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>
          <p className="text-sm text-gray-500">
            Toggle platform features on or off. Changes take effect immediately after saving.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(featureLabels).map(([key, { label, desc }]) => (
              <button
                key={key}
                onClick={() => setConfig({ ...config, features: { ...config.features, [key]: !config.features[key] } })}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  config.features[key]
                    ? 'border-green-400 bg-green-50'
                    : 'border-gray-100 bg-white hover:border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-gray-900">{label}</span>
                  {config.features[key] ? (
                    <ToggleRight className="w-6 h-6 text-green-500" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <p className="text-xs text-gray-500">{desc}</p>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Sticky Save Bar */}
      <div className="sticky bottom-4 flex items-center justify-end gap-3">
        <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2 shadow-lg">
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save All Settings'}
        </Button>
      </div>
    </div>
  );
};

export default AdminSettings;
