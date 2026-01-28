import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Star,
  DollarSign,
  Briefcase,
  Settings,
  LogOut,
  Bell,
  Shield,
  ChevronRight,
  Edit3,
  CheckCircle,
  Clock
} from 'lucide-react';
import { userStorage } from '../utils/storage';

const ProfileView = ({ user, onLogout, onNavigate, onUpdateUser }) => {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    phone: user.phone,
    address: user.address,
    bio: user.bio || '',
    hourlyRate: user.hourlyRate || '',
    isAvailable: user.isAvailable !== false
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedUser = {
        ...user,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        ...(user.type === 'cleaner' && {
          bio: formData.bio.trim(),
          hourlyRate: parseFloat(formData.hourlyRate) || user.hourlyRate,
          isAvailable: formData.isAvailable
        })
      };

      await userStorage.saveUser(updatedUser);
      await userStorage.setCurrentUser(updatedUser);
      if (onUpdateUser) onUpdateUser(updatedUser);
      setEditing(false);
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      await userStorage.logout();
      onLogout();
    }
  };

  return (
    <div className="min-h-screen pb-24 animate-fade-in">
      <div className="p-6">
        <h1 className="text-2xl font-display font-bold text-gray-800 mb-6">Profile</h1>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl p-6 shadow-soft mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-xl text-gray-800">{user.name}</h2>
              <p className="text-gray-500">{user.email}</p>
              <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                user.type === 'cleaner'
                  ? 'bg-secondary-100 text-secondary-700'
                  : 'bg-primary-100 text-primary-700'
              }`}>
                {user.type === 'cleaner' ? 'Cleaner' : 'Homeowner'}
              </span>
            </div>
            <button
              onClick={() => setEditing(!editing)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Edit3 className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Stats for Cleaners */}
          {user.type === 'cleaner' && (
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="font-bold text-gray-800">
                    {user.rating ? user.rating.toFixed(1) : 'N/A'}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{user.reviewCount} reviews</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-800">${user.totalEarnings?.toFixed(0) || 0}</p>
                <p className="text-xs text-gray-500">Total Earned</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-800">{user.experience || 0}</p>
                <p className="text-xs text-gray-500">Years Exp.</p>
              </div>
            </div>
          )}
        </div>

        {/* Edit Form */}
        {editing && (
          <div className="bg-white rounded-2xl p-6 shadow-soft mb-6 animate-slide-down">
            <h3 className="font-semibold text-gray-800 mb-4">Edit Profile</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-primary-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-primary-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-primary-400 outline-none"
                />
              </div>

              {user.type === 'cleaner' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-primary-400 outline-none resize-none"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate ($)</label>
                    <input
                      type="number"
                      value={formData.hourlyRate}
                      onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                      className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-primary-400 outline-none"
                      min="15"
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-800">Available for Jobs</p>
                      <p className="text-sm text-gray-500">Turn off when you're busy</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isAvailable}
                        onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Contact Info */}
        <div className="bg-white rounded-2xl shadow-soft divide-y divide-gray-100 mb-6">
          <InfoItem icon={Mail} label="Email" value={user.email} />
          <InfoItem icon={Phone} label="Phone" value={user.phone} />
          <InfoItem icon={MapPin} label="Address" value={user.address} />
          {user.type === 'cleaner' && (
            <>
              <InfoItem icon={DollarSign} label="Hourly Rate" value={`$${user.hourlyRate}/hr`} />
              <InfoItem icon={Briefcase} label="Experience" value={`${user.experience} years`} />
            </>
          )}
        </div>

        {/* Services (for cleaners) */}
        {user.type === 'cleaner' && user.services && (
          <div className="bg-white rounded-2xl p-5 shadow-soft mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">Services Offered</h3>
            <div className="flex flex-wrap gap-2">
              {user.services.map((service, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium"
                >
                  {service}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Menu Items */}
        <div className="bg-white rounded-2xl shadow-soft divide-y divide-gray-100 mb-6">
          <MenuItem icon={Bell} label="Notifications" onClick={() => alert('Coming soon!')} />
          <MenuItem icon={Shield} label="Privacy & Security" onClick={() => alert('Coming soon!')} />
          <MenuItem icon={Settings} label="Settings" onClick={() => alert('Coming soon!')} />
        </div>

        {/* Sign Out */}
        <button
          onClick={handleLogout}
          className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>

        {/* Member Since */}
        <p className="text-center text-gray-400 text-sm mt-6">
          Member since {new Date(user.createdAt).toLocaleDateString('en-CA', {
            year: 'numeric',
            month: 'long'
          })}
        </p>
      </div>
    </div>
  );
};

const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="p-4 flex items-center gap-3">
    <Icon className="w-5 h-5 text-gray-400" />
    <div className="flex-1">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-medium text-gray-800">{value}</p>
    </div>
  </div>
);

const MenuItem = ({ icon: Icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors"
  >
    <Icon className="w-5 h-5 text-gray-400" />
    <span className="flex-1 text-left font-medium text-gray-700">{label}</span>
    <ChevronRight className="w-5 h-5 text-gray-300" />
  </button>
);

export default ProfileView;
