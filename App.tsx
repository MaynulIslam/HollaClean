
import React, { useState, useEffect } from 'react';
import { storage } from './utils/storage';
import { api } from './utils/api';
import { User, ServiceOffer } from './types';
import { CONFIG } from './utils/config';
import { initReminderService, checkAndSendReminders } from './utils/reminderService';
import { signInWithGoogle, signOutFirebase, GoogleUserInfo } from './utils/firebase';
import Landing from './components/Landing';
import Login from './components/Login';
import Register from './components/Register';
import ProfileCompletion from './components/ProfileCompletion';
import HomeownerDashboard from './components/HomeownerDashboard';
import CleanerDashboard from './components/CleanerDashboard';
import AdminDashboard from './components/AdminDashboard';
import ErrorBoundary from './components/ErrorBoundary';
import { Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<'landing' | 'login' | 'register' | 'dashboard' | 'admin_login' | 'profile_completion'>('landing');
  const [registerRole, setRegisterRole] = useState<'homeowner' | 'cleaner'>('homeowner');
  const [isLoading, setIsLoading] = useState(true);
  const [googleUserData, setGoogleUserData] = useState<GoogleUserInfo | null>(null);
  const [pendingUser, setPendingUser] = useState<User | null>(null);

  useEffect(() => {
    const initApp = async () => {
      // Handle Stripe Connect onboarding redirects. The cleaner's connect status
      // is authoritative on the server (set via the account.updated webhook), so
      // here we just clean the URL — the fresh user fetched below reflects it.
      const params = new URLSearchParams(window.location.search);
      const stripeSuccess = params.get('stripe_success');
      const stripeRefresh = params.get('stripe_refresh');
      const stripeCleanerId = params.get('cleanerId');
      if ((stripeSuccess || stripeRefresh) && stripeCleanerId) {
        window.history.replaceState({}, '', window.location.pathname);
      }

      // Initialize service configuration if not present (static app config,
      // intentionally kept client-side).
      const existingServices = await storage.get('config:services');
      if (!existingServices) {
        await initializeServices();
      }

      // Resolve the current user from the stored JWT.
      try {
        const user = await api.auth.me();
        if (user) {
          // Incomplete profile (e.g. abandoned Google sign-up) → finish it.
          if (user.profileComplete === false && user.firebaseUid) {
            setGoogleUserData({
              uid: user.firebaseUid,
              email: user.email,
              displayName: user.name || null,
              photoURL: user.photoURL || null,
              idToken: '',
            });
            setPendingUser(user);
            setView('profile_completion');
          } else {
            setCurrentUser(user);
            setView('dashboard');
          }
        }
      } catch (err) {
        console.error('Session restore failed:', err);
      }

      setIsLoading(false);
    };
    initApp();
  }, []);

  // Start background reminder service when a user is logged in
  useEffect(() => {
    if (!currentUser) return;
    initReminderService();
    checkAndSendReminders();
    const interval = setInterval(checkAndSendReminders, CONFIG.reminders.checkIntervalMs);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Initialize services from config (no hardcoded test users)
  const initializeServices = async () => {
    const defaultServices: ServiceOffer[] = CONFIG.services.map((s, idx) => ({
      id: String(idx + 1),
      name: s.name,
      basePrice: s.basePrice
    }));
    await storage.set('config:services', defaultServices);
  };

  const handleGoogleSignIn = async () => {
    // Sign in with Firebase, then hand the ID token to our server, which
    // verifies it and returns our own user record + JWT (stored by the api).
    const googleUser = await signInWithGoogle();
    const user = await api.auth.google(googleUser.idToken);

    if (user.profileComplete === false) {
      // New or incomplete profile — finish it before entering the app.
      setGoogleUserData(googleUser);
      setPendingUser(user);
      setView('profile_completion');
    } else {
      setCurrentUser(user);
      setView('dashboard');
    }
  };

  const handleUserUpdate = (updatedUser: User) => {
    setCurrentUser(updatedUser);
  };

  const handleLogout = async () => {
    await signOutFirebase().catch(() => {});
    api.auth.logout();
    setCurrentUser(null);
    setPendingUser(null);
    setView('landing');
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <img src="/Holla Clean Logo.png" alt="HollaClean" className="h-40 w-auto animate-pulse mix-blend-multiply" />
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

    if (view === 'login') return <Login
      onBack={() => setView('landing')}
      onLogin={(user) => {
        setCurrentUser(user);
        setView('dashboard');
      }}
      onGoogleSignIn={handleGoogleSignIn}
    />;

    if (view === 'register') return <Register
      role={registerRole}
      onBack={() => setView('landing')}
      onRegister={(user) => {
        setCurrentUser(user);
        setView('dashboard');
      }}
      onGoogleSignIn={handleGoogleSignIn}
    />;

    if (view === 'profile_completion' && googleUserData && pendingUser) return <ProfileCompletion
      googleUser={googleUserData}
      pendingUser={pendingUser}
      onComplete={(user) => {
        setCurrentUser(user);
        setGoogleUserData(null);
        setPendingUser(null);
        setView('dashboard');
      }}
      onBack={() => {
        setGoogleUserData(null);
        setPendingUser(null);
        api.auth.logout();
        setView('landing');
        signOutFirebase().catch(() => {});
      }}
    />;

    if (view === 'admin_login') return <AdminDashboard onBack={() => setView('landing')} isAdmin />;

    if (currentUser) {
      if (currentUser.type === 'homeowner') {
        return <HomeownerDashboard user={currentUser} onLogout={handleLogout} onUserUpdate={handleUserUpdate} />;
      }
      if (currentUser.type === 'cleaner') {
        return <CleanerDashboard user={currentUser} onLogout={handleLogout} onUserUpdate={handleUserUpdate} />;
      }
    }

    return <Landing onAction={() => {}} />;
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen relative overflow-x-hidden">
        {renderView()}
      </div>
    </ErrorBoundary>
  );
};

export default App;
