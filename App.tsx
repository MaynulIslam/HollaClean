
import React, { useState, useEffect } from 'react';
import { storage } from './utils/storage';
<<<<<<< HEAD
import { User, ServiceOffer } from './types';
import { isSessionValid, Session } from './utils/auth';
import { CONFIG } from './utils/config';
=======
import { User, CleaningRequest, ServiceOffer } from './types';
>>>>>>> d06443da4cbdb3f847eedb509039380cf77654ed
import Landing from './components/Landing';
import Login from './components/Login';
import Register from './components/Register';
import HomeownerDashboard from './components/HomeownerDashboard';
import CleanerDashboard from './components/CleanerDashboard';
import AdminDashboard from './components/AdminDashboard';
<<<<<<< HEAD
import ErrorBoundary from './components/ErrorBoundary';
=======
>>>>>>> d06443da4cbdb3f847eedb509039380cf77654ed
import { Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<'landing' | 'login' | 'register' | 'dashboard' | 'admin_login'>('landing');
  const [registerRole, setRegisterRole] = useState<'homeowner' | 'cleaner'>('homeowner');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initApp = async () => {
<<<<<<< HEAD
      // Initialize service configuration if not present
      const existingServices = await storage.get('config:services');
      if (!existingServices) {
        await initializeServices();
      }

      // Check for valid session
      const session: Session | null = await storage.get('session');
      if (session && isSessionValid(session)) {
        const user = await storage.get(`user:${session.userId}`);
        if (user) {
          setCurrentUser(user);
          setView('dashboard');
        } else {
          // Invalid session - user doesn't exist, clear session
          await storage.delete('session');
        }
      } else if (session) {
        // Session expired, clear it
        await storage.delete('session');
      }

=======
      // Seed data first if first time
      const usersKeys = await storage.list('user:');
      if (usersKeys.length === 0) {
        await seedData();
      }

      const user = await storage.get('currentUser');
      if (user) {
        setCurrentUser(user);
        setView('dashboard');
      }
      
>>>>>>> d06443da4cbdb3f847eedb509039380cf77654ed
      setIsLoading(false);
    };
    initApp();
  }, []);

<<<<<<< HEAD
  // Initialize services from config (no test users)
  const initializeServices = async () => {
    const defaultServices: ServiceOffer[] = CONFIG.services.map((s, idx) => ({
      id: String(idx + 1),
      name: s.name,
      basePrice: s.basePrice
    }));
    await storage.set('config:services', defaultServices);
=======
  const seedData = async () => {
    // Standard Seed Services
    const defaultServices: ServiceOffer[] = [
      { id: '1', name: 'Regular Cleaning', basePrice: 25 },
      { id: '2', name: 'Deep Cleaning', basePrice: 45 },
      { id: '3', name: 'Move-in/Move-out Cleaning', basePrice: 50 },
      { id: '4', name: 'Laundry Service', basePrice: 20 },
      { id: '5', name: 'Ironing', basePrice: 20 },
      { id: '6', name: 'Window Cleaning', basePrice: 35 },
      { id: '7', name: 'Carpet Cleaning', basePrice: 40 }
    ];
    await storage.set('config:services', defaultServices);

    // Standard Seed Cleaner
    const sampleCleaner: User = {
      id: 'cleaner_1',
      type: 'cleaner',
      name: 'Maria Santos',
      firstName: 'Maria',
      lastName: 'Santos',
      email: 'maria@clean.com',
      password: 'password123',
      phone: '4165551234',
      address: '123 King St W, Toronto, ON, Canada',
      streetAddress: '123 King St W',
      city: 'Toronto',
      province: 'Ontario',
      country: 'Canada',
      createdAt: new Date().toISOString(),
      bio: 'Professional cleaner with 5 years of experience in luxury homes.',
      hourlyRate: 35,
      experience: 5,
      services: ['Deep Cleaning', 'Regular Cleaning', 'Laundry Service'],
      rating: 4.8,
      reviewCount: 12,
      totalEarnings: 1250,
      isAvailable: true
    };
    
    // Standard Seed Homeowner
    const sampleHomeowner: User = {
      id: 'homeowner_1',
      type: 'homeowner',
      name: 'John Doe',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@gmail.com',
      password: 'password123',
      phone: '6475556789',
      address: '456 Queen St E, Toronto, ON, Canada',
      streetAddress: '456 Queen St E',
      city: 'Toronto',
      province: 'Ontario',
      country: 'Canada',
      createdAt: new Date().toISOString()
    };

    // Requested Test Account
    const testAccount: User = {
      id: 'user_maynul',
      type: 'homeowner',
      name: 'Maynul Islam',
      firstName: 'Maynul',
      lastName: 'Islam',
      email: 'maynul@gmail.com',
      password: 'maynul@gmail.com',
      phone: '4165550000',
      address: '789 Bay St, Toronto, ON, Canada',
      streetAddress: '789 Bay St',
      city: 'Toronto',
      province: 'Ontario',
      country: 'Canada',
      createdAt: new Date().toISOString()
    };

    await storage.set(`user:${sampleCleaner.id}`, sampleCleaner);
    await storage.set(`user:${sampleHomeowner.id}`, sampleHomeowner);
    await storage.set(`user:${testAccount.id}`, testAccount);
    
    // Sample open request
    const sampleReq: CleaningRequest = {
      id: `req_${Date.now()}`,
      homeownerId: sampleHomeowner.id,
      homeownerName: sampleHomeowner.name,
      homeownerPhone: sampleHomeowner.phone,
      homeownerEmail: sampleHomeowner.email,
      serviceType: 'Deep Cleaning',
      date: '2024-05-20',
      time: '10:00',
      hours: 4,
      address: sampleHomeowner.address,
      instructions: 'Please bring your own vacuum.',
      status: 'open',
      acceptedBy: null,
      cleanerName: null,
      cleanerPhone: null,
      hourlyRate: null,
      acceptedAt: null,
      completedAt: null,
      totalAmount: 140,
      platformCommission: 28,
      cleanerPayout: 112,
      paymentStatus: 'pending',
      createdAt: new Date().toISOString()
    };
    await storage.set(`request:${sampleReq.id}`, sampleReq);
>>>>>>> d06443da4cbdb3f847eedb509039380cf77654ed
  };

  const handleLogout = async () => {
    await storage.delete('currentUser');
    setCurrentUser(null);
    setView('landing');
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Sparkles className="w-12 h-12 text-purple-600 animate-pulse" />
          <p className="text-purple-600 font-bold text-xl animate-pulse">HollaClean...</p>
        </div>
      </div>
    );
  }

  const renderView = () => {
    if (view === 'landing') return <Landing onAction={(action, role) => {
      if (action === 'register') {
        setRegisterRole(role as any);
        setView('register');
      } else if (action === 'login') {
        setView('login');
      } else if (action === 'admin') {
        setView('admin_login');
      }
    }} />;
    
    if (view === 'login') return <Login onBack={() => setView('landing')} onLogin={(user) => {
      setCurrentUser(user);
      setView('dashboard');
    }} />;
    
    if (view === 'register') return <Register role={registerRole} onBack={() => setView('landing')} onRegister={(user) => {
      setCurrentUser(user);
      setView('dashboard');
    }} />;
    
    if (view === 'admin_login') return <AdminDashboard onBack={() => setView('landing')} isAdmin />;

    if (currentUser) {
      if (currentUser.type === 'homeowner') {
        return <HomeownerDashboard user={currentUser} onLogout={handleLogout} />;
      }
      if (currentUser.type === 'cleaner') {
        return <CleanerDashboard user={currentUser} onLogout={handleLogout} />;
      }
    }
    
    return <Landing onAction={() => {}} />;
  };

  return (
    <div className="max-w-7xl mx-auto min-h-screen relative overflow-x-hidden">
      {renderView()}
    </div>
  );
};

export default App;
