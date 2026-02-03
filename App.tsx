
import React, { useState, useEffect } from 'react';
import { storage } from './utils/storage';
import { User, ServiceOffer } from './types';
import { isSessionValid, Session } from './utils/auth';
import { CONFIG } from './utils/config';
import Landing from './components/Landing';
import Login from './components/Login';
import Register from './components/Register';
import HomeownerDashboard from './components/HomeownerDashboard';
import CleanerDashboard from './components/CleanerDashboard';
import AdminDashboard from './components/AdminDashboard';
import ErrorBoundary from './components/ErrorBoundary';
import { Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<'landing' | 'login' | 'register' | 'dashboard' | 'admin_login'>('landing');
  const [registerRole, setRegisterRole] = useState<'homeowner' | 'cleaner'>('homeowner');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initApp = async () => {
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

      setIsLoading(false);
    };
    initApp();
  }, []);

  // Initialize services from config (no test users)
  const initializeServices = async () => {
    const defaultServices: ServiceOffer[] = CONFIG.services.map((s, idx) => ({
      id: String(idx + 1),
      name: s.name,
      basePrice: s.basePrice
    }));
    await storage.set('config:services', defaultServices);
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
