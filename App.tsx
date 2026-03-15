
import React, { useState, useEffect } from 'react';
import { storage } from './utils/storage';
import { User, ServiceOffer } from './types';
import { isSessionValid, Session, createSession } from './utils/auth';
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
          // If user has incomplete profile (e.g. abandoned Google sign-up), redirect
          if (user.profileComplete === false && user.firebaseUid) {
            setGoogleUserData({
              uid: user.firebaseUid,
              email: user.email,
              displayName: user.name || null,
              photoURL: user.photoURL || null,
            });
            setView('profile_completion');
          } else {
            setCurrentUser(user);
            setView('dashboard');
          }
        } else {
          await storage.delete('session');
        }
      } else if (session) {
        await storage.delete('session');
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
    const googleUser = await signInWithGoogle();

    // Check if this Google user already has a local account
    const keys = await storage.list('user:');
    let existingUser: User | null = null;

    for (const key of keys) {
      const user = await storage.get(key);
      if (user && (user.firebaseUid === googleUser.uid || user.email?.toLowerCase() === googleUser.email.toLowerCase())) {
        existingUser = user;
        break;
      }
    }

    if (existingUser && existingUser.profileComplete !== false) {
      // Returning user with complete profile — go straight to dashboard
      // Update Firebase UID if not set (linking existing email/password account)
      if (!existingUser.firebaseUid) {
        existingUser.firebaseUid = googleUser.uid;
        existingUser.authProvider = 'google';
        existingUser.photoURL = googleUser.photoURL || existingUser.photoURL;
        existingUser.emailVerified = true;
        await storage.set(`user:${existingUser.id}`, existingUser);
      }

      const session = createSession(existingUser.id);
      await storage.set('session', session);
      await storage.set('currentUser', existingUser);
      setCurrentUser(existingUser);
      setView('dashboard');
    } else {
      // New user or incomplete profile — needs profile completion
      setGoogleUserData(googleUser);
      setView('profile_completion');
    }
  };

  const handleUserUpdate = (updatedUser: User) => {
    setCurrentUser(updatedUser);
  };

  const handleLogout = async () => {
    await signOutFirebase().catch(() => {});
    await storage.delete('currentUser');
    await storage.delete('session');
    setCurrentUser(null);
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

    if (view === 'profile_completion' && googleUserData) return <ProfileCompletion
      googleUser={googleUserData}
      onComplete={(user) => {
        setCurrentUser(user);
        setGoogleUserData(null);
        setView('dashboard');
      }}
      onBack={() => {
        setGoogleUserData(null);
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
