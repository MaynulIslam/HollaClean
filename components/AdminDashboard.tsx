
import React, { useState, useEffect } from 'react';
import { CleaningRequest, User, ServiceOffer } from '../types';
import { storage } from '../utils/storage';
import { Card, Badge, Button, Input } from './UI';
import AdminFinance from './AdminFinance';
import AdminSettings from './AdminSettings';
import {
  getReminderConfig, setReminderConfig, getReminderLogs,
  ReminderConfig, ReminderLog
} from '../utils/reminderService';
import {
  Shield, Users, Layers, TrendingUp, DollarSign,
  Briefcase, Plus, Trash2, Edit2, LogOut, Search, Download, X, Receipt,
  MapPin, Lock, CreditCard, Landmark, Info, Wallet, Bell, Save, ToggleLeft, ToggleRight, Mail, Clock,
  Settings, ChevronDown, ChevronUp, Image as ImageIcon, AlertCircle, CheckCircle,
  Banknote, Send, Loader2, ExternalLink
} from 'lucide-react';
import { transferToCleaner } from '../utils/paymentApi';
import { getPlatformConfig } from '../utils/config';
import { sendEmail } from '../utils/externalNotifications';

interface Props {
  onBack: () => void;
  isAdmin?: boolean;
}

type AdminTab = 'requests' | 'services' | 'homeowners' | 'cleaners' | 'payments' | 'payouts' | 'finance' | 'reminders' | 'settings';

// Format room key like "bedroom_1" → "Bedroom 1"
function formatRoomKey(key: string): string {
  const parts = key.split('_');
  const num = parts.pop();
  const type = parts.join('_');
  const labels: Record<string, string> = { bedroom: 'Bedroom', bathroom: 'Bathroom', kitchen: 'Kitchen', livingRoom: 'Living Room', other: 'Other Room', bedrooms: 'Bedrooms', bathrooms: 'Bathrooms' };
  const label = labels[type] || type;
  if (!num || isNaN(Number(num))) return labels[key] || (key === 'livingRoom' ? 'Living Room' : key);
  return `${label} ${num}`;
}

const AdminDashboard: React.FC<Props> = ({ onBack }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [pass, setPass] = useState('');
  const [activeTab, setActiveTab] = useState<AdminTab>('requests');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data states
  const [requests, setRequests] = useState<CleaningRequest[]>([]);
  const [services, setServices] = useState<ServiceOffer[]>([]);
  const [homeowners, setHomeowners] = useState<User[]>([]);
  const [cleaners, setCleaners] = useState<User[]>([]);
  const [stats, setStats] = useState({ revenue: 0, requests: 0, homeowners: 0, cleaners: 0 });

  // Reminder states
  const [reminderConfig, setReminderConfigState] = useState<ReminderConfig | null>(null);
  const [reminderLogs, setReminderLogs] = useState<ReminderLog[]>([]);
  const [reminderSaving, setReminderSaving] = useState(false);
  const [reminderSaved, setReminderSaved] = useState(false);

  // Service Modal state
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [serviceModalMode, setServiceModalMode] = useState<'add' | 'edit'>('add');
  const [editingService, setEditingService] = useState<Partial<ServiceOffer>>({ name: '', basePrice: 0 });

  // User Modal state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User>>({});

  // Request expand/edit state
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<Partial<CleaningRequest>>({});

  const checkAuth = () => {
    if (pass === 'admin') setAuthenticated(true);
    else alert("Incorrect passcode.");
  };

  const loadAll = async () => {
    const rKeys = await storage.list('request:');
    const uKeys = await storage.list('user:');
    const savedServices = await storage.get('config:services') || [];
    setServices(savedServices);
    
    let rev = 0;
    const allReqs: CleaningRequest[] = [];
    for (const k of rKeys) {
      const r = await storage.get(k);
      if (r) {
        allReqs.push(r);
        if (r.status === 'completed') rev += (Number(r.platformCommission) || 0);
      }
    }

    const allHomeowners: User[] = [];
    const allCleaners: User[] = [];
    for (const k of uKeys) {
      const u = await storage.get(k);
      if (u) {
        if (u.type === 'homeowner') allHomeowners.push(u);
        if (u.type === 'cleaner') allCleaners.push(u);
      }
    }

    setHomeowners(allHomeowners);
    setCleaners(allCleaners);
    setStats({ 
      revenue: rev, 
      requests: allReqs.length, 
      homeowners: allHomeowners.length, 
      cleaners: allCleaners.length 
    });
    setRequests(allReqs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  };

  const loadReminders = async () => {
    const config = await getReminderConfig();
    setReminderConfigState(config);
    const logs = await getReminderLogs();
    setReminderLogs(logs);
  };

  useEffect(() => {
    if (authenticated) {
      loadAll();
      loadReminders();
    }
  }, [authenticated]);

  // Service CRUD
  const handleOpenAddService = () => {
    setServiceModalMode('add');
    setEditingService({ name: '', basePrice: 0 });
    setIsServiceModalOpen(true);
  };

  const handleOpenEditService = (service: ServiceOffer) => {
    setServiceModalMode('edit');
    setEditingService(service);
    setIsServiceModalOpen(true);
  };

  const handleSaveService = async () => {
    if (!editingService.name || (editingService.basePrice ?? 0) <= 0) {
      alert("Please provide a valid name and price.");
      return;
    }

    let updated: ServiceOffer[];
    if (serviceModalMode === 'add') {
      const s: ServiceOffer = {
        id: `service_${Date.now()}`,
        name: editingService.name,
        basePrice: editingService.basePrice!
      };
      updated = [...services, s];
    } else {
      updated = services.map(s => s.id === editingService.id ? (editingService as ServiceOffer) : s);
    }

    setServices(updated);
    await storage.set('config:services', updated);
    setIsServiceModalOpen(false);
  };

  const handleDeleteService = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this service? It will no longer be available for new requests.")) {
      const updated = services.filter(s => s.id !== id);
      setServices(updated);
      await storage.set('config:services', updated);
    }
  };

  // User CRUD
  const handleOpenEditUser = (user: User) => {
    setEditingUser({ ...user });
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser.id) return;

    // Concatenate computed fields for backward compatibility
    const fullName = `${editingUser.firstName || ''} ${editingUser.lastName || ''}`.trim() || editingUser.name || '';
    const fullAddress = `${editingUser.streetAddress || ''}${editingUser.apartment ? ', ' + editingUser.apartment : ''}, ${editingUser.city || ''}, ${editingUser.province || ''}, ${editingUser.country || ''}`;

    const updatedUser = {
      ...editingUser,
      name: fullName,
      address: fullAddress
    };

    await storage.set(`user:${editingUser.id}`, updatedUser);
    setIsUserModalOpen(false);
    loadAll();
  };

  const handleDeleteUser = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this user account? This action cannot be undone.")) {
      const key = id.startsWith('user:') ? id : `user:${id}`;
      await storage.delete(key);
      await loadAll();
    }
  };

  const handleExportCSV = () => {
    if (requests.length === 0) {
      alert("No data to export");
      return;
    }

    const headers = [
      "Request ID", "Status", "Homeowner", "Email", "Phone", 
      "Cleaner", "Service", "Date", "Time", "Address", 
      "Amount", "Commission", "Payout", "Created At"
    ];

    const csvRows = requests.map(req => [
      req.id,
      req.status,
      req.homeownerName,
      req.homeownerEmail,
      req.homeownerPhone,
      req.cleanerName || "Unassigned",
      req.serviceType,
      req.date,
      req.time,
      `"${req.address.replace(/"/g, '""')}"`,
      (Number(req.totalAmount) || 0).toFixed(2),
      (Number(req.platformCommission) || 0).toFixed(2),
      (Number(req.cleanerPayout) || 0).toFixed(2),
      req.createdAt
    ].join(","));

    const csvContent = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `hollaclean_requests_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Request CRUD
  const handleOpenEditRequest = (req: CleaningRequest) => {
    setEditingRequest({ ...req });
    setIsRequestModalOpen(true);
  };

  const handleSaveRequest = async () => {
    if (!editingRequest.id) return;
    // Recalculate cleaner payout if total changed
    const totalAmount = Number(editingRequest.totalAmount) || 0;
    const commission = totalAmount * 0.20;
    const updatedRequest = {
      ...editingRequest,
      totalAmount,
      platformCommission: commission,
      cleanerPayout: totalAmount - commission,
    };
    await storage.set(`request:${editingRequest.id}`, updatedRequest);
    setIsRequestModalOpen(false);
    await loadAll();
  };

  const handleCancelRequest = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this request? This cannot be undone.')) return;
    const req = await storage.get(`request:${id}`);
    if (req) {
      await storage.set(`request:${id}`, { ...req, status: 'cancelled' });
      await loadAll();
    }
  };

  const handleSaveReminders = async () => {
    if (!reminderConfig) return;
    setReminderSaving(true);
    setReminderSaved(false);
    await setReminderConfig(reminderConfig);
    setReminderSaving(false);
    setReminderSaved(true);
    setTimeout(() => setReminderSaved(false), 3000);
  };

  const filteredRequests = requests.filter(req => {
    const q = searchQuery.toLowerCase();
    return (
      req.id.toLowerCase().includes(q) ||
      req.homeownerName.toLowerCase().includes(q) ||
      (req.cleanerName && req.cleanerName.toLowerCase().includes(q)) ||
      req.serviceType.toLowerCase().includes(q) ||
      req.status.toLowerCase().includes(q) ||
      req.address.toLowerCase().includes(q)
    );
  });

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 p-6">
        <Card className="w-full max-w-sm text-center shadow-2xl">
          <Shield className="w-12 h-12 text-purple-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Admin Access Required</h2>
          <Input 
            type="password" 
            placeholder="Enter passcode" 
            value={pass} 
            onChange={(e: any) => setPass(e.target.value)}
          />
          <Button onClick={checkAuth} className="w-full mt-4">Unlock Console</Button>
          <button onClick={onBack} className="mt-6 text-gray-400 text-sm hover:underline">Exit Portal</button>
        </Card>
      </div>
    );
  }

  const renderContent = () => {
    switch(activeTab) {
      case 'requests':
        return (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="text-2xl font-bold">Cleaning Requests</h3>
              <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:min-w-[300px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search requests, owners, or cleaners..."
                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="secondary" onClick={handleExportCSV} className="text-xs flex items-center gap-2 py-2">
                  <Download className="w-4 h-4" /> Export CSV
                </Button>
              </div>
            </div>
            <Card className="p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <tr>
                      <th className="px-6 py-4"></th>
                      <th className="px-6 py-4">Request ID</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Homeowner</th>
                      <th className="px-6 py-4">Cleaner</th>
                      <th className="px-6 py-4">Service</th>
                      <th className="px-6 py-4 text-right">Rev</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredRequests.length > 0 ? (
                      filteredRequests.map(req => {
                        const isExpanded = expandedRequestId === req.id;
                        return (
                          <React.Fragment key={req.id}>
                            <tr
                              className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                              onClick={() => setExpandedRequestId(isExpanded ? null : req.id)}
                            >
                              <td className="px-3 py-4 w-8">
                                {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                              </td>
                              <td className="px-6 py-4 font-mono text-[10px] text-gray-400">{req.id.slice(-8)}</td>
                              <td className="px-6 py-4"><Badge status={req.status} /></td>
                              <td className="px-6 py-4 font-bold text-sm text-gray-800">{req.homeownerName}</td>
                              <td className="px-6 py-4 text-sm text-gray-500">{req.cleanerName || '-'}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">{req.serviceType}</td>
                              <td className="px-6 py-4 text-right font-bold text-green-600 text-sm">${(Number(req.platformCommission) || 0).toFixed(2)}</td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end items-center gap-1" onClick={e => e.stopPropagation()}>
                                  <button
                                    onClick={() => handleOpenEditRequest(req)}
                                    className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                                    title="Edit Request"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  {req.status !== 'cancelled' && req.status !== 'completed' && (
                                    <button
                                      onClick={() => handleCancelRequest(req.id)}
                                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                      title="Cancel Request"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                            {/* Expanded Details Row */}
                            {isExpanded && (
                              <tr className="bg-gray-50/80">
                                <td colSpan={8} className="px-6 py-5">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Left: Details */}
                                    <div className="space-y-3">
                                      <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest">Request Details</h4>
                                      <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                          <span className="text-gray-500">Date & Time</span>
                                          <span className="font-semibold text-gray-800">{req.date} at {req.time}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-500">Duration</span>
                                          <span className="font-semibold text-gray-800">{req.hours} hours</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-500">Address</span>
                                          <span className="font-semibold text-gray-800 text-right max-w-[200px]">{req.address}</span>
                                        </div>
                                        {req.squareFootage && (
                                          <div className="flex justify-between">
                                            <span className="text-gray-500">Sq Ft</span>
                                            <span className="font-semibold text-gray-800">{req.squareFootage.toLocaleString()}</span>
                                          </div>
                                        )}
                                        {req.floorType && (
                                          <div className="flex justify-between">
                                            <span className="text-gray-500">Floor</span>
                                            <span className="font-semibold text-gray-800">{req.floorType}</span>
                                          </div>
                                        )}
                                        {(req.numberOfBedrooms || req.numberOfBathrooms || req.numberOfKitchens || req.numberOfLivingRooms || req.numberOfOtherRooms) && (
                                          <div className="flex justify-between">
                                            <span className="text-gray-500">Rooms</span>
                                            <span className="font-semibold text-gray-800">
                                              {[
                                                req.numberOfBedrooms && `${req.numberOfBedrooms} Bed`,
                                                req.numberOfBathrooms && `${req.numberOfBathrooms} Bath`,
                                                req.numberOfKitchens && `${req.numberOfKitchens} Kit`,
                                                req.numberOfLivingRooms && `${req.numberOfLivingRooms} Liv`,
                                                req.numberOfOtherRooms && `${req.numberOfOtherRooms} Other`,
                                              ].filter(Boolean).join(', ')}
                                            </span>
                                          </div>
                                        )}
                                        {req.instructions && (
                                          <div className="pt-2 border-t border-gray-200">
                                            <p className="text-gray-500 text-xs mb-1">Instructions</p>
                                            <p className="text-gray-700 text-xs">{req.instructions}</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Middle: Financials */}
                                    <div className="space-y-3">
                                      <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest">Financials</h4>
                                      <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                          <span className="text-gray-500">Total Amount</span>
                                          <span className="font-bold text-gray-900">${(Number(req.totalAmount) || 0).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-500">Platform Commission</span>
                                          <span className="font-bold text-green-600">+${(Number(req.platformCommission) || 0).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-500">Cleaner Payout</span>
                                          <span className="font-bold text-pink-600">${(Number(req.cleanerPayout) || 0).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-500">Payment Status</span>
                                          <span className={`font-bold ${req.paymentStatus === 'paid' ? 'text-green-600' : 'text-amber-600'}`}>
                                            {req.paymentStatus}
                                          </span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-500">Contact</span>
                                          <span className="text-gray-800 text-xs">{req.homeownerPhone}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-500">Email</span>
                                          <span className="text-gray-800 text-xs">{req.homeownerEmail}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-500">Created</span>
                                          <span className="text-gray-800 text-xs">{new Date(req.createdAt).toLocaleString()}</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Right: Room Images */}
                                    <div className="space-y-3">
                                      <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest">Room Photos</h4>
                                      {req.roomImages && Object.keys(req.roomImages).some(k => (req.roomImages as Record<string, string[]>)[k]?.length > 0) ? (
                                        <div className="space-y-2">
                                          {(Object.entries(req.roomImages) as [string, string[]][]).map(([roomKey, imgs]) => (
                                            imgs && imgs.length > 0 && (
                                              <div key={roomKey}>
                                                <p className="text-xs font-semibold text-gray-500 mb-1">{formatRoomKey(roomKey)}</p>
                                                <div className="flex gap-1.5 flex-wrap">
                                                  {imgs.map((img, idx) => (
                                                    <img key={idx} src={img} alt="" className="w-16 h-16 rounded-lg object-cover" />
                                                  ))}
                                                </div>
                                              </div>
                                            )
                                          ))}
                                        </div>
                                      ) : req.images && req.images.length > 0 ? (
                                        <div className="flex gap-1.5 flex-wrap">
                                          {req.images.map((img, idx) => (
                                            <img key={idx} src={img} alt="" className="w-16 h-16 rounded-lg object-cover" />
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-xs text-gray-400">No photos attached</p>
                                      )}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-6 py-20 text-center text-gray-400">
                          {searchQuery ? `No results matching "${searchQuery}"` : "No requests found"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        );
      case 'services':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">Services and Charges</h3>
                <p className="text-gray-500 text-sm">Manage global cleaning services and platform pricing.</p>
              </div>
              <Button onClick={handleOpenAddService} className="flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Service
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map(s => (
                <Card key={s.id} className="group hover:border-purple-200 transition-all relative min-h-[160px] flex flex-col justify-between shadow-xl">
                  <div className="space-y-1">
                    <h4 className="text-xl font-bold text-gray-800">{s.name}</h4>
                    <p className="text-gray-400 text-xs font-black uppercase tracking-widest">Ontario Standard</p>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hourly Charge</p>
                      <p className="text-2xl font-black text-purple-600">${s.basePrice}/hr</p>
                    </div>
                    <div className="flex items-center gap-0 bg-white border-2 border-gray-100 rounded-xl p-0.5 shadow-sm">
                      <button 
                        onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleOpenEditService(s); }} 
                        className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                        title="Edit Service"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <div className="w-[1px] h-4 bg-gray-100 mx-1" />
                      <button 
                        onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleDeleteService(s.id); }} 
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete Service"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
      case 'homeowners':
      case 'cleaners':
        const userList = activeTab === 'homeowners' ? homeowners : cleaners;
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold capitalize">{activeTab} Management</h3>
              <Button variant="secondary" className="flex items-center gap-2 shadow-sm">
                <Plus className="w-4 h-4" /> Create Account
              </Button>
            </div>
            <Card className="p-0 overflow-hidden shadow-2xl border-none">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-50">
                    <tr>
                      <th className="px-8 py-6">User</th>
                      <th className="px-8 py-6">Contact</th>
                      <th className="px-8 py-6">Location</th>
                      <th className="px-8 py-6">Joined</th>
                      <th className="px-8 py-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 bg-white">
                    {userList.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => handleOpenEditUser(u)}>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm ${activeTab === 'homeowners' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>
                              {u.name.charAt(0)}
                            </div>
                            <span className="font-bold text-sm text-gray-900">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-xs font-bold text-gray-800 leading-tight mb-0.5">{u.email}</p>
                          <p className="text-[10px] text-gray-400 font-medium">{u.phone}</p>
                        </td>
                        <td className="px-8 py-6 text-xs text-gray-500 font-medium">{u.city}, {u.province}</td>
                        <td className="px-8 py-6 text-[11px] text-gray-400 font-bold">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex justify-end items-center gap-1">
                            <div className="flex items-center gap-0 bg-white border border-gray-100 rounded-lg p-0.5 shadow-sm group-hover:border-purple-100 transition-colors">
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleOpenEditUser(u); }}
                                className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-all"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <div className="w-[1px] h-4 bg-gray-100" />
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteUser(u.id); }}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        );
      case 'finance':
        return <AdminFinance />;
      case 'settings':
        return <AdminSettings />;
      case 'reminders': {
        const activeLogs = reminderLogs.filter(l => !l.stoppedReason);
        const stoppedLogs = reminderLogs.filter(l => !!l.stoppedReason);
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold">Payment Reminders</h2>
              <p className="text-gray-500 text-sm">Configure automatic payment reminder notifications for homeowners.</p>
            </div>

            {/* Reminder Settings */}
            <Card className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-bold text-gray-900">Reminder Settings</h3>
                </div>
                {reminderConfig && (
                  <button
                    onClick={() => setReminderConfigState({ ...reminderConfig, enabled: !reminderConfig.enabled })}
                    className="flex items-center gap-2"
                  >
                    {reminderConfig.enabled ? (
                      <ToggleRight className="w-8 h-8 text-green-500" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-gray-400" />
                    )}
                    <span className={`text-sm font-bold ${reminderConfig.enabled ? 'text-green-600' : 'text-gray-400'}`}>
                      {reminderConfig.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </button>
                )}
              </div>

              {reminderConfig && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase text-gray-400 tracking-wider block mb-2">Interval (minutes)</label>
                    <input
                      type="number"
                      min={5}
                      max={120}
                      value={reminderConfig.intervalMinutes}
                      onChange={e => setReminderConfigState({ ...reminderConfig, intervalMinutes: Number(e.target.value) })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-purple-500 outline-none transition-all"
                    />
                    <p className="text-xs text-gray-400 mt-1">Time between each reminder</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-gray-400 tracking-wider block mb-2">Start (hours before)</label>
                    <input
                      type="number"
                      min={1}
                      max={24}
                      value={reminderConfig.startHoursBefore}
                      onChange={e => setReminderConfigState({ ...reminderConfig, startHoursBefore: Number(e.target.value) })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-purple-500 outline-none transition-all"
                    />
                    <p className="text-xs text-gray-400 mt-1">Hours before scheduled cleaning</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-gray-400 tracking-wider block mb-2">Max Reminders</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={reminderConfig.maxReminders}
                      onChange={e => setReminderConfigState({ ...reminderConfig, maxReminders: Number(e.target.value) })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-purple-500 outline-none transition-all"
                    />
                    <p className="text-xs text-gray-400 mt-1">Maximum reminders per request</p>
                  </div>
                </div>
              )}
            </Card>

            {/* Admin Notifications */}
            <Card className="p-6 space-y-6">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-bold text-gray-900">Admin Notifications</h3>
              </div>

              {reminderConfig && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold uppercase text-gray-400 tracking-wider block mb-2">Admin Email</label>
                    <input
                      type="email"
                      value={reminderConfig.adminEmail}
                      onChange={e => setReminderConfigState({ ...reminderConfig, adminEmail: e.target.value })}
                      placeholder="admin@hollaclean.ca"
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-purple-500 outline-none transition-all"
                    />
                    <p className="text-xs text-gray-400 mt-1">Receive email alerts for platform events</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { key: 'adminNotifyOnRegistration' as const, label: 'New Registrations', desc: 'When a user signs up' },
                      { key: 'adminNotifyOnPayment' as const, label: 'Payments', desc: 'When a payment is made' },
                      { key: 'adminNotifyOnCompletion' as const, label: 'Job Completions', desc: 'When a job is completed' },
                    ].map(item => (
                      <button
                        key={item.key}
                        onClick={() => setReminderConfigState({ ...reminderConfig, [item.key]: !reminderConfig[item.key] })}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          reminderConfig[item.key]
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-100 bg-white hover:border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-bold text-gray-900">{item.label}</span>
                          {reminderConfig[item.key] ? (
                            <ToggleRight className="w-5 h-5 text-purple-600" />
                          ) : (
                            <ToggleLeft className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{item.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Save Button */}
            <div className="flex items-center gap-3">
              <Button onClick={handleSaveReminders} disabled={reminderSaving} className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                {reminderSaving ? 'Saving...' : 'Save Settings'}
              </Button>
              {reminderSaved && (
                <span className="text-sm text-green-600 font-semibold animate-in fade-in duration-200">Settings saved!</span>
              )}
            </div>

            {/* Active Reminders Table */}
            <Card className="p-0 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-amber-500" />
                    <h3 className="text-lg font-bold text-gray-900">Active Reminders</h3>
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">{activeLogs.length}</span>
                  </div>
                  <button onClick={loadReminders} className="text-xs text-purple-600 font-bold hover:underline">Refresh</button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <tr>
                      <th className="px-6 py-4">Request ID</th>
                      <th className="px-6 py-4">Reminders Sent</th>
                      <th className="px-6 py-4">Last Sent</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {activeLogs.length > 0 ? activeLogs.map(log => (
                      <tr key={log.requestId} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-mono text-[10px] text-gray-400">{log.requestId.slice(-8)}</td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-amber-600">{log.totalSent}</span>
                          <span className="text-xs text-gray-400 ml-1">sent</span>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500">
                          {log.lastSentAt ? new Date(log.lastSentAt).toLocaleString('en-CA', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-bold">Pending Payment</span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-gray-400">No active reminders — all homeowners have paid on time!</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Completed/Stopped Reminders */}
            {stoppedLogs.length > 0 && (
              <Card className="p-0 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-green-500" />
                    <h3 className="text-lg font-bold text-gray-900">Resolved Reminders</h3>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">{stoppedLogs.length}</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400">
                      <tr>
                        <th className="px-6 py-4">Request ID</th>
                        <th className="px-6 py-4">Total Sent</th>
                        <th className="px-6 py-4">Resolved</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {stoppedLogs.map(log => (
                        <tr key={log.requestId} className="hover:bg-gray-50/50">
                          <td className="px-6 py-4 font-mono text-[10px] text-gray-400">{log.requestId.slice(-8)}</td>
                          <td className="px-6 py-4 text-sm font-bold text-gray-600">{log.totalSent}</td>
                          <td className="px-6 py-4">
                            <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                              log.stoppedReason === 'paid' ? 'bg-green-100 text-green-700' :
                              log.stoppedReason === 'cancelled' ? 'bg-red-100 text-red-700' :
                              log.stoppedReason === 'max_reached' ? 'bg-orange-100 text-orange-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {log.stoppedReason === 'paid' ? 'Paid' :
                               log.stoppedReason === 'cancelled' ? 'Cancelled' :
                               log.stoppedReason === 'max_reached' ? 'Max Reached' :
                               log.stoppedReason === 'past_due' ? 'Past Due' : log.stoppedReason}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        );
      }
      case 'payments':
        const completedRequests = requests.filter(r => r.status === 'completed');
        const grossVolume = completedRequests.reduce((acc, r) => acc + (Number(r.totalAmount) || 0), 0);
        const totalPayouts = completedRequests.reduce((acc, r) => acc + (Number(r.cleanerPayout) || 0), 0);

        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold">Payments Ledger</h2>
                <p className="text-gray-500 text-sm">Financial reconciliation and platform revenue tracking.</p>
              </div>
              <Button variant="secondary" onClick={handleExportCSV} className="flex items-center gap-2">
                <Receipt className="w-4 h-4" /> Reconciliation Report
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card className="bg-emerald-50 border-emerald-100 border p-6">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Gross Marketplace Volume</p>
                <p className="text-3xl font-black text-emerald-900">${grossVolume.toFixed(2)}</p>
              </Card>
              <Card className="bg-pink-50 border-pink-100 border p-6">
                <p className="text-[10px] font-black text-pink-600 uppercase tracking-widest mb-1">Total Payouts to Pros</p>
                <p className="text-3xl font-black text-pink-900">-${totalPayouts.toFixed(2)}</p>
              </Card>
              <Card className="bg-purple-50 border-purple-100 border p-6">
                <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-1">Platform Net Revenue</p>
                <p className="text-3xl font-black text-purple-900">+${stats.revenue.toFixed(2)}</p>
              </Card>
            </div>

            <Card className="p-0 overflow-hidden shadow-2xl border-none">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-50">
                    <tr>
                      <th className="px-8 py-6">Transaction ID</th>
                      <th className="px-8 py-6">Date</th>
                      <th className="px-8 py-6">Total Amount</th>
                      <th className="px-8 py-6">Cleaner Payout</th>
                      <th className="px-8 py-6">Platform Rev (20%)</th>
                      <th className="px-8 py-6 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 bg-white">
                    {completedRequests.length > 0 ? completedRequests.map(req => (
                      <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-6 font-mono text-[10px] text-gray-400 uppercase">{req.id.slice(-12)}</td>
                        <td className="px-8 py-6 text-xs text-gray-500 font-bold">{req.completedAt ? new Date(req.completedAt).toLocaleDateString() : 'N/A'}</td>
                        <td className="px-8 py-6 font-bold text-gray-900">${(Number(req.totalAmount) || 0).toFixed(2)}</td>
                        <td className="px-8 py-6 text-pink-600 font-bold">-${(Number(req.cleanerPayout) || 0).toFixed(2)}</td>
                        <td className="px-8 py-6 text-emerald-600 font-black tracking-tight">+${(Number(req.platformCommission) || 0).toFixed(2)}</td>
                        <td className="px-8 py-6 text-right"><Badge status="paid" /></td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={6} className="px-8 py-20 text-center text-gray-400">No completed payments found in the ledger.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        );

      case 'payouts': {
        const platformCfg = getPlatformConfig();
        const pendingPayouts = requests.filter(r => r.status === 'completed' && r.paymentStatus === 'paid' && r.payoutStatus !== 'disbursed');
        const disbursedPayouts = requests.filter(r => r.payoutStatus === 'disbursed');
        const totalPending = pendingPayouts.reduce((acc, r) => acc + (Number(r.payoutAmount) || Number(r.cleanerPayout) || 0), 0);
        const totalDisbursed = disbursedPayouts.reduce((acc, r) => acc + (Number(r.payoutAmount) || Number(r.cleanerPayout) || 0), 0);

        const handleDisburse = async (req: CleaningRequest) => {
          const payoutAmt = Number(req.payoutAmount) || Number(req.cleanerPayout) || 0;
          if (!window.confirm(`Disburse $${payoutAmt.toFixed(2)} to ${req.cleanerName}?`)) return;

          try {
            // Find cleaner's Stripe account
            const cleaner = await storage.get(`user:${req.acceptedBy}`);
            if (cleaner?.stripeAccountId) {
              await transferToCleaner({
                paymentIntentId: req.paymentIntentId,
                cleanerId: req.acceptedBy!,
                amount: payoutAmt,
              });
            }

            // Mark as disbursed
            const updated = await storage.get(`request:${req.id}`);
            updated.payoutStatus = 'disbursed';
            updated.payoutDisbursedAt = new Date().toISOString();
            updated.payoutAmount = payoutAmt;
            await storage.set(`request:${req.id}`, updated);

            loadAll();
            alert(`Payout of $${payoutAmt.toFixed(2)} disbursed to ${req.cleanerName}`);
          } catch (err: any) {
            alert(`Disbursement failed: ${err.message}`);
          }
        };

        const handleEditPayout = async (reqId: string) => {
          const newAmount = prompt('Enter adjusted payout amount:');
          if (newAmount === null) return;
          const amt = parseFloat(newAmount);
          if (isNaN(amt) || amt <= 0) { alert('Invalid amount'); return; }

          const req = await storage.get(`request:${reqId}`);
          req.payoutAmount = Math.round(amt * 100) / 100;
          await storage.set(`request:${reqId}`, req);
          loadAll();
        };

        const handleEmailCleaner = async (req: CleaningRequest) => {
          if (!req.acceptedBy) return;
          const cleaner = await storage.get(`user:${req.acceptedBy}`);
          if (!cleaner?.email) { alert('Cleaner email not found'); return; }

          const payoutAmt = Number(req.payoutAmount) || Number(req.cleanerPayout) || 0;
          await sendEmail(
            cleaner.email,
            cleaner.name || 'Cleaner',
            `[HollaClean] Your payout of $${payoutAmt.toFixed(2)} is being processed`,
            `Hi ${cleaner.name},\n\nYour payout of $${payoutAmt.toFixed(2)} for the ${req.serviceType} job (${req.homeownerName}) is being processed.\n\nYou will receive it in your bank account within 2 business days.\n\nThank you for being a HollaClean professional!\n\n— HollaClean Team`
          );
          alert(`Email sent to ${cleaner.email}`);
        };

        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold">Cleaner Payouts</h2>
              <p className="text-gray-500 text-sm">Review, adjust, and disburse payouts to cleaners after job completion.</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-amber-50 border-amber-100 border p-6">
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Pending Payouts</p>
                <p className="text-3xl font-black text-amber-900">${totalPending.toFixed(2)}</p>
                <p className="text-xs text-amber-600 mt-1">{pendingPayouts.length} job{pendingPayouts.length !== 1 ? 's' : ''} awaiting disbursement</p>
              </Card>
              <Card className="bg-green-50 border-green-100 border p-6">
                <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">Total Disbursed</p>
                <p className="text-3xl font-black text-green-900">${totalDisbursed.toFixed(2)}</p>
                <p className="text-xs text-green-600 mt-1">{disbursedPayouts.length} payout{disbursedPayouts.length !== 1 ? 's' : ''} completed</p>
              </Card>
              <Card className="bg-purple-50 border-purple-100 border p-6">
                <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-1">Tax Collected ({platformCfg.pricing.taxLabel})</p>
                <p className="text-3xl font-black text-purple-900">
                  ${requests.filter(r => r.status === 'completed').reduce((acc, r) => acc + (Number(r.taxAmount) || 0), 0).toFixed(2)}
                </p>
              </Card>
            </div>

            {/* Pending Payouts Table */}
            <Card className="p-0 overflow-hidden shadow-2xl border-none">
              <div className="bg-amber-50 px-6 py-4 border-b border-amber-100 flex items-center gap-3">
                <Banknote className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-gray-900">Pending Payouts</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-50">
                    <tr>
                      <th className="px-6 py-4">Cleaner</th>
                      <th className="px-6 py-4">Service</th>
                      <th className="px-6 py-4">Completed</th>
                      <th className="px-6 py-4">Total Charged</th>
                      <th className="px-6 py-4">{platformCfg.pricing.taxLabel}</th>
                      <th className="px-6 py-4">Platform Fee</th>
                      <th className="px-6 py-4">Payout</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 bg-white">
                    {pendingPayouts.length > 0 ? pendingPayouts.map(req => {
                      const payoutAmt = Number(req.payoutAmount) || Number(req.cleanerPayout) || 0;
                      const subtotal = req.taxAmount ? (Number(req.totalAmount) || 0) - (Number(req.taxAmount) || 0) : (Number(req.totalAmount) || 0);
                      return (
                        <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-bold text-gray-900 text-sm">{req.cleanerName}</p>
                            <p className="text-[10px] text-gray-400">{req.homeownerName}</p>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">{req.serviceType}</td>
                          <td className="px-6 py-4 text-xs text-gray-500">{req.completedAt ? new Date(req.completedAt).toLocaleDateString() : 'N/A'}</td>
                          <td className="px-6 py-4 font-bold text-gray-900">${(Number(req.totalAmount) || 0).toFixed(2)}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">${(Number(req.taxAmount) || 0).toFixed(2)}</td>
                          <td className="px-6 py-4 text-sm text-purple-600 font-semibold">${(Number(req.platformCommission) || 0).toFixed(2)}</td>
                          <td className="px-6 py-4">
                            <span className="font-black text-green-700 text-lg">${payoutAmt.toFixed(2)}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 justify-end">
                              <button
                                onClick={() => handleEditPayout(req.id)}
                                className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                title="Edit payout amount"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEmailCleaner(req)}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Email cleaner"
                              >
                                <Mail className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDisburse(req)}
                                className="px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1.5"
                              >
                                <Send className="w-3.5 h-3.5" />
                                Disburse
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan={8} className="px-8 py-16 text-center text-gray-400">
                          <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
                          All payouts have been disbursed!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Disbursed History */}
            {disbursedPayouts.length > 0 && (
              <Card className="p-0 overflow-hidden border-none">
                <div className="bg-green-50 px-6 py-4 border-b border-green-100 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h3 className="font-bold text-gray-900">Disbursement History</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-white text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-50">
                      <tr>
                        <th className="px-6 py-4">Cleaner</th>
                        <th className="px-6 py-4">Service</th>
                        <th className="px-6 py-4">Disbursed At</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 bg-white">
                      {disbursedPayouts.map(req => (
                        <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-bold text-gray-900 text-sm">{req.cleanerName}</p>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">{req.serviceType}</td>
                          <td className="px-6 py-4 text-xs text-gray-500">
                            {req.payoutDisbursedAt ? new Date(req.payoutDisbursedAt).toLocaleString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 font-bold text-green-700">${(Number(req.payoutAmount) || Number(req.cleanerPayout) || 0).toFixed(2)}</td>
                          <td className="px-6 py-4 text-right">
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                              <CheckCircle className="w-3 h-3" /> Disbursed
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        );
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-8">
          <div>
            <h1 className="text-2xl font-black font-outfit text-gray-900 leading-none">Admin Console</h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-purple-600 mt-1">HollaClean Operations</p>
          </div>
          <nav className="hidden lg:flex items-center gap-1 ml-4 bg-gray-50 p-1 rounded-xl">
            {[
              { id: 'requests', label: 'All Requests', icon: Layers },
              { id: 'services', label: 'Services and Charges', icon: Briefcase },
              { id: 'homeowners', label: 'Homeowners', icon: Users },
              { id: 'cleaners', label: 'Cleaners', icon: TrendingUp },
              { id: 'payments', label: 'Payments', icon: DollarSign },
              { id: 'payouts', label: 'Payouts', icon: Banknote },
              { id: 'finance', label: 'Stripe Finance', icon: Wallet },
              { id: 'reminders', label: 'Reminders', icon: Bell },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${activeTab === tab.id ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <tab.icon className="w-3 h-3" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right mr-2">
            <p className="text-sm font-bold text-gray-800">Administrator</p>
            <p className="text-[10px] text-gray-400 font-medium">Session Active</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center shadow-lg cursor-pointer">
            <Shield className="w-5 h-5" />
          </div>
          <button onClick={onBack} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 p-8 lg:p-12 max-w-7xl mx-auto w-full">
        {/* Mobile Navigation */}
        <div className="lg:hidden flex overflow-x-auto gap-2 mb-8 pb-2 no-scrollbar">
          {[
              { id: 'requests', label: 'Requests' },
              { id: 'services', label: 'Charges' },
              { id: 'homeowners', label: 'Owners' },
              { id: 'cleaners', label: 'Pros' },
              { id: 'payments', label: 'Payments' },
              { id: 'payouts', label: 'Payouts' },
              { id: 'finance', label: 'Stripe' },
              { id: 'reminders', label: 'Reminders' },
              { id: 'settings', label: 'Settings' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`px-6 py-3 rounded-2xl text-xs font-black uppercase whitespace-nowrap shadow-sm transition-all ${activeTab === tab.id ? 'bg-purple-600 text-white' : 'bg-white text-gray-500'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dynamic Content */}
        <div className="animate-in fade-in duration-500">
          {renderContent()}
        </div>
      </main>

      {/* COMPREHENSIVE USER EDIT MODAL */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-white/90 backdrop-blur-sm py-2 z-10">
              <div>
                <h2 className="text-2xl font-bold">Global User Edit</h2>
                <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Type: {editingUser.type}</p>
              </div>
              <button onClick={() => setIsUserModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-8 pb-4">
              {/* Account Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-purple-600 mb-2">
                  <Info className="w-4 h-4" />
                  <h3 className="text-xs font-black uppercase tracking-widest">Account & Authentication</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input 
                    label="First Name" 
                    value={editingUser.firstName || ''} 
                    onChange={(e: any) => setEditingUser({...editingUser, firstName: e.target.value})}
                  />
                  <Input 
                    label="Last Name" 
                    value={editingUser.lastName || ''} 
                    onChange={(e: any) => setEditingUser({...editingUser, lastName: e.target.value})}
                  />
                  <Input 
                    label="Email (Read Only)" 
                    value={editingUser.email || ''} 
                    disabled
                    className="bg-gray-50 text-gray-400"
                  />
                  <Input 
                    label="Reset Password" 
                    type="text"
                    value={editingUser.password || ''} 
                    onChange={(e: any) => setEditingUser({...editingUser, password: e.target.value})}
                    placeholder="Set new password"
                  />
                  <div className="md:col-span-2">
                    <Input 
                      label="Phone Number" 
                      value={editingUser.phone || ''} 
                      onChange={(e: any) => setEditingUser({...editingUser, phone: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Address Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-purple-600 mb-2">
                  <MapPin className="w-4 h-4" />
                  <h3 className="text-xs font-black uppercase tracking-widest">Location & Address</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Input 
                      label="Street Address" 
                      value={editingUser.streetAddress || ''} 
                      onChange={(e: any) => setEditingUser({...editingUser, streetAddress: e.target.value})}
                    />
                  </div>
                  <Input 
                    label="Apartment" 
                    value={editingUser.apartment || ''} 
                    onChange={(e: any) => setEditingUser({...editingUser, apartment: e.target.value})}
                  />
                  <Input 
                    label="City" 
                    value={editingUser.city || ''} 
                    onChange={(e: any) => setEditingUser({...editingUser, city: e.target.value})}
                  />
                  <Input 
                    label="Province" 
                    value={editingUser.province || ''} 
                    onChange={(e: any) => setEditingUser({...editingUser, province: e.target.value})}
                  />
                  <Input 
                    label="Country" 
                    value={editingUser.country || ''} 
                    onChange={(e: any) => setEditingUser({...editingUser, country: e.target.value})}
                  />
                </div>
              </div>

              {/* Payment Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-purple-600 mb-2">
                  {editingUser.type === 'homeowner' ? <CreditCard className="w-4 h-4" /> : <Landmark className="w-4 h-4" />}
                  <h3 className="text-xs font-black uppercase tracking-widest">
                    {editingUser.type === 'homeowner' ? 'Payment Card (Mock)' : 'Payout Bank Details'}
                  </h3>
                </div>
                {editingUser.type === 'homeowner' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Card Name" value={(editingUser as any).cardName || ''} onChange={(e: any) => setEditingUser({...editingUser, cardName: e.target.value})} />
                    <Input label="Card Number" value={(editingUser as any).cardNumber || ''} onChange={(e: any) => setEditingUser({...editingUser, cardNumber: e.target.value})} />
                    <Input label="Expiry" value={(editingUser as any).expiry || ''} onChange={(e: any) => setEditingUser({...editingUser, expiry: e.target.value})} />
                    <Input label="CVV" value={(editingUser as any).cvv || ''} onChange={(e: any) => setEditingUser({...editingUser, cvv: e.target.value})} />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <Input label="Bank Name" value={(editingUser as any).bankName || ''} onChange={(e: any) => setEditingUser({...editingUser, bankName: e.target.value})} />
                    </div>
                    <Input label="Holder" value={(editingUser as any).accountHolder || ''} onChange={(e: any) => setEditingUser({...editingUser, accountHolder: e.target.value})} />
                    <Input label="Transit" value={(editingUser as any).transitNumber || ''} onChange={(e: any) => setEditingUser({...editingUser, transitNumber: e.target.value})} />
                    <Input label="Inst." value={(editingUser as any).institutionNumber || ''} onChange={(e: any) => setEditingUser({...editingUser, institutionNumber: e.target.value})} />
                    <Input label="Account #" value={(editingUser as any).accountNumber || ''} onChange={(e: any) => setEditingUser({...editingUser, accountNumber: e.target.value})} />
                  </div>
                )}
              </div>

              {/* Professional Profile Section (Cleaner only) */}
              {editingUser.type === 'cleaner' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-purple-600 mb-2">
                    <Briefcase className="w-4 h-4" />
                    <h3 className="text-xs font-black uppercase tracking-widest">Professional Profile</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Rate ($/hr)" type="number" value={editingUser.hourlyRate || 0} onChange={(e: any) => setEditingUser({...editingUser, hourlyRate: Number(e.target.value)})} />
                    <Input label="Exp (Years)" type="number" value={editingUser.experience || 0} onChange={(e: any) => setEditingUser({...editingUser, experience: Number(e.target.value)})} />
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-700 ml-1">Bio Description</label>
                      <textarea 
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-purple-500 outline-none h-24"
                        value={editingUser.bio || ''}
                        onChange={(e: any) => setEditingUser({...editingUser, bio: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              )}
              
              <div className="pt-6 flex gap-3 sticky bottom-0 bg-white/90 backdrop-blur-sm py-4 border-t border-gray-100">
                <Button onClick={handleSaveUser} className="flex-1 shadow-purple-200">Force Save Changes</Button>
                <Button variant="secondary" onClick={() => setIsUserModalOpen(false)}>Discard</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Service Modal */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{serviceModalMode === 'add' ? 'Add New Service' : 'Edit Service'}</h2>
              <button onClick={() => setIsServiceModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <Input 
                label="Service Name" 
                placeholder="e.g. Backyard Cleaning" 
                value={editingService.name} 
                onChange={(e: any) => setEditingService({...editingService, name: e.target.value})}
              />
              <Input 
                label="Base Hourly Rate ($)" 
                type="number"
                placeholder="40" 
                value={editingService.basePrice} 
                onChange={(e: any) => setEditingService({...editingService, basePrice: Number(e.target.value)})}
              />
              
              <div className="pt-4 flex gap-3">
                <Button onClick={handleSaveService} className="flex-1">
                  {serviceModalMode === 'add' ? 'Create Service' : 'Update Service'}
                </Button>
                <Button variant="secondary" onClick={() => setIsServiceModalOpen(false)}>Cancel</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* REQUEST EDIT MODAL */}
      {isRequestModalOpen && editingRequest.id && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-white/90 backdrop-blur-sm py-2 z-10">
              <div>
                <h2 className="text-2xl font-bold">Edit Request</h2>
                <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest">ID: {editingRequest.id}</p>
              </div>
              <button onClick={() => setIsRequestModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-8 pb-4">
              {/* Status */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-purple-600 mb-2">
                  <AlertCircle className="w-4 h-4" />
                  <h3 className="text-xs font-black uppercase tracking-widest">Status & Assignment</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 ml-1 block mb-1">Request Status</label>
                    <select
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-purple-500 outline-none transition-all"
                      value={editingRequest.status || 'open'}
                      onChange={e => setEditingRequest({ ...editingRequest, status: e.target.value as any })}
                    >
                      <option value="open">Open</option>
                      <option value="accepted">Accepted</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 ml-1 block mb-1">Payment Status</label>
                    <select
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-purple-500 outline-none transition-all"
                      value={editingRequest.paymentStatus || 'pending'}
                      onChange={e => setEditingRequest({ ...editingRequest, paymentStatus: e.target.value as any })}
                    >
                      <option value="pending">Pending</option>
                      <option value="awaiting">Awaiting</option>
                      <option value="held">Held</option>
                      <option value="paid">Paid</option>
                      <option value="demo_completed">Demo Completed</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Cleaner Assignment */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-purple-600 mb-2">
                  <Users className="w-4 h-4" />
                  <h3 className="text-xs font-black uppercase tracking-widest">Cleaner Assignment</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Cleaner Name"
                    value={editingRequest.cleanerName || ''}
                    onChange={(e: any) => setEditingRequest({ ...editingRequest, cleanerName: e.target.value || null })}
                    placeholder="Unassigned"
                  />
                  <Input
                    label="Cleaner Phone"
                    value={editingRequest.cleanerPhone || ''}
                    onChange={(e: any) => setEditingRequest({ ...editingRequest, cleanerPhone: e.target.value || null })}
                    placeholder="N/A"
                  />
                  <Input
                    label="Accepted By (User ID)"
                    value={editingRequest.acceptedBy || ''}
                    onChange={(e: any) => setEditingRequest({ ...editingRequest, acceptedBy: e.target.value || null })}
                    placeholder="Unassigned"
                  />
                  <Input
                    label="Hourly Rate ($)"
                    type="number"
                    value={editingRequest.hourlyRate || ''}
                    onChange={(e: any) => setEditingRequest({ ...editingRequest, hourlyRate: Number(e.target.value) || null })}
                    placeholder="N/A"
                  />
                </div>
              </div>

              {/* Service & Schedule */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-purple-600 mb-2">
                  <Briefcase className="w-4 h-4" />
                  <h3 className="text-xs font-black uppercase tracking-widest">Service & Schedule</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Service Type"
                    value={editingRequest.serviceType || ''}
                    onChange={(e: any) => setEditingRequest({ ...editingRequest, serviceType: e.target.value })}
                  />
                  <Input
                    label="Date"
                    type="date"
                    value={editingRequest.date || ''}
                    onChange={(e: any) => setEditingRequest({ ...editingRequest, date: e.target.value })}
                  />
                  <Input
                    label="Hours"
                    type="number"
                    value={editingRequest.hours || 3}
                    onChange={(e: any) => setEditingRequest({ ...editingRequest, hours: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 ml-1 block mb-1">Address</label>
                  <textarea
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-purple-500 outline-none h-16 resize-none text-sm"
                    value={editingRequest.address || ''}
                    onChange={(e: any) => setEditingRequest({ ...editingRequest, address: e.target.value })}
                  />
                </div>
              </div>

              {/* Financials */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-purple-600 mb-2">
                  <DollarSign className="w-4 h-4" />
                  <h3 className="text-xs font-black uppercase tracking-widest">Financial Override</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Input
                      label="Total Amount ($)"
                      type="number"
                      value={editingRequest.totalAmount || 0}
                      onChange={(e: any) => {
                        const total = Number(e.target.value) || 0;
                        setEditingRequest({
                          ...editingRequest,
                          totalAmount: total,
                          platformCommission: +(total * 0.20).toFixed(2),
                          cleanerPayout: +(total * 0.80).toFixed(2),
                        });
                      }}
                    />
                  </div>
                  <div>
                    <Input
                      label="Platform Commission ($)"
                      type="number"
                      value={editingRequest.platformCommission || 0}
                      onChange={(e: any) => setEditingRequest({ ...editingRequest, platformCommission: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Input
                      label="Cleaner Payout ($)"
                      type="number"
                      value={editingRequest.cleanerPayout || 0}
                      onChange={(e: any) => setEditingRequest({ ...editingRequest, cleanerPayout: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-xs text-amber-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  Changing the total auto-recalculates commission (20%) and payout (80%). Override individual values after if needed.
                </div>
              </div>

              <div className="pt-6 flex gap-3 sticky bottom-0 bg-white/90 backdrop-blur-sm py-4 border-t border-gray-100">
                <Button onClick={handleSaveRequest} className="flex-1 shadow-purple-200">Force Save Changes</Button>
                <Button variant="secondary" onClick={() => setIsRequestModalOpen(false)}>Discard</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Stats Quick Bar */}
      <footer className="bg-white border-t border-gray-100 p-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
           <div className="flex items-center gap-4">
              <div className="p-2 bg-green-50 text-green-600 rounded-lg shadow-sm"><DollarSign className="w-5 h-5" /></div>
              <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Revenue</p><p className="font-bold">${stats.revenue.toFixed(2)}</p></div>
           </div>
           <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg shadow-sm"><Layers className="w-5 h-5" /></div>
              <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Market</p><p className="font-bold">{stats.requests} Jobs</p></div>
           </div>
           <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shadow-sm"><Users className="w-5 h-5" /></div>
              <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Homeowners</p><p className="font-bold">{stats.homeowners}</p></div>
           </div>
           <div className="flex items-center gap-4">
              <div className="p-2 bg-pink-50 text-pink-600 rounded-lg shadow-sm"><TrendingUp className="w-5 h-5" /></div>
              <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cleaners</p><p className="font-bold">{stats.cleaners}</p></div>
           </div>
        </div>
      </footer>
    </div>
  );
};

export default AdminDashboard;
