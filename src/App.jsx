import React, { useState, useEffect } from 'react';
import {
  Home,
  Search,
  Calendar,
  User,
  Briefcase,
  DollarSign,
  Sparkles
} from 'lucide-react';

// Components
import Landing from './components/Landing';
import Register from './components/Register';
import Login from './components/Login';
import HomeownerDashboard from './components/HomeownerDashboard';
import CleanerDashboard from './components/CleanerDashboard';
import AdminDashboard from './components/AdminDashboard';
import CreateRequest from './components/CreateRequest';
import RequestsFeed from './components/RequestsFeed';
import MyRequests from './components/MyRequests';
import MyJobs from './components/MyJobs';
import ProfileView from './components/ProfileView';
import ReviewModal from './components/ReviewModal';

// Storage
import { userStorage, initializeSampleData } from './utils/storage';

const App = () => {
  const [currentPage, setCurrentPage] = useState('landing');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registerUserType, setRegisterUserType] = useState(null);
  const [reviewRequest, setReviewRequest] = useState(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize sample data
      await initializeSampleData();

      // Check for existing session
      const currentUser = await userStorage.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setCurrentPage(currentUser.type === 'cleaner' ? 'cleaner-dashboard' : 'homeowner-dashboard');
      }
    } catch (err) {
      console.error('Error initializing app:', err);
    } finally {
      setLoading(false);
      // Hide loading screen
      document.body.classList.add('app-loaded');
    }
  };

  const handleNavigate = (page, params = {}) => {
    if (params.userType) {
      setRegisterUserType(params.userType);
    }
    setCurrentPage(page);
    // Scroll to top on navigation
    window.scrollTo(0, 0);
  };

  const handleLogin = (userData) => {
    setUser(userData);
    if (userData.type === 'admin') {
      setCurrentPage('admin-dashboard');
    } else if (userData.type === 'cleaner') {
      setCurrentPage('cleaner-dashboard');
    } else {
      setCurrentPage('homeowner-dashboard');
    }
  };

  const handleLogout = async () => {
    await userStorage.logout();
    setUser(null);
    setCurrentPage('landing');
  };

  const handleUpdateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const handleAdminLogin = (password) => {
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';
    if (password === adminPassword) {
      setUser({ type: 'admin', name: 'Admin' });
      setCurrentPage('admin-dashboard');
      return true;
    }
    return false;
  };

  const handleOpenReview = (request) => {
    setReviewRequest(request);
  };

  const handleCloseReview = () => {
    setReviewRequest(null);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <Landing onNavigate={handleNavigate} />;

      case 'register':
        return (
          <Register
            onNavigate={handleNavigate}
            onLogin={handleLogin}
            initialUserType={registerUserType}
          />
        );

      case 'login':
        return <Login onNavigate={handleNavigate} onLogin={handleLogin} />;

      case 'admin-login':
        return <AdminLoginPage onNavigate={handleNavigate} onLogin={handleAdminLogin} />;

      case 'admin-dashboard':
        return <AdminDashboard onLogout={handleLogout} />;

      case 'homeowner-dashboard':
        return <HomeownerDashboard user={user} onNavigate={handleNavigate} />;

      case 'cleaner-dashboard':
        return <CleanerDashboard user={user} onNavigate={handleNavigate} />;

      case 'create-request':
        return <CreateRequest user={user} onNavigate={handleNavigate} />;

      case 'my-requests':
        return (
          <MyRequests
            user={user}
            onNavigate={handleNavigate}
            onOpenReview={handleOpenReview}
          />
        );

      case 'requests-feed':
        return <RequestsFeed user={user} onNavigate={handleNavigate} />;

      case 'my-jobs':
        return <MyJobs user={user} onNavigate={handleNavigate} />;

      case 'profile':
        return (
          <ProfileView
            user={user}
            onLogout={handleLogout}
            onNavigate={handleNavigate}
            onUpdateUser={handleUpdateUser}
          />
        );

      default:
        return <Landing onNavigate={handleNavigate} />;
    }
  };

  // Show loading state
  if (loading) {
    return null; // HTML loading screen handles this
  }

  // Determine if we should show bottom navigation
  const showBottomNav = user && user.type !== 'admin' && ![
    'landing', 'register', 'login', 'admin-login', 'admin-dashboard'
  ].includes(currentPage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {renderPage()}

      {/* Bottom Navigation */}
      {showBottomNav && (
        <BottomNav
          currentPage={currentPage}
          onNavigate={handleNavigate}
          userType={user.type}
        />
      )}

      {/* Review Modal */}
      {reviewRequest && (
        <ReviewModal
          request={reviewRequest}
          currentUser={user}
          onClose={handleCloseReview}
          onSubmitted={handleCloseReview}
        />
      )}
    </div>
  );
};

// Admin Login Page Component
const AdminLoginPage = ({ onNavigate, onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const success = onLogin(password);
    if (!success) {
      setError('Invalid password');
    }
  };

  return (
    <div className="min-h-screen p-6 flex flex-col items-center justify-center animate-fade-in">
      <button
        onClick={() => onNavigate('landing')}
        className="absolute top-4 left-4 text-primary-600 hover:underline"
      >
        &larr; Back
      </button>

      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-display font-bold text-gray-800">Admin Access</h2>
          <p className="text-gray-500">Enter admin password to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Admin Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none"
            required
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full py-4 bg-gray-800 text-white rounded-xl font-semibold hover:bg-gray-900 transition-colors"
          >
            Access Dashboard
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          Default password: admin123
        </p>
      </div>
    </div>
  );
};

// Bottom Navigation Component
const BottomNav = ({ currentPage, onNavigate, userType }) => {
  const homeownerItems = [
    { id: 'homeowner-dashboard', icon: Home, label: 'Home' },
    { id: 'create-request', icon: Sparkles, label: 'Request' },
    { id: 'my-requests', icon: Calendar, label: 'Requests' },
    { id: 'profile', icon: User, label: 'Profile' }
  ];

  const cleanerItems = [
    { id: 'cleaner-dashboard', icon: Home, label: 'Home' },
    { id: 'requests-feed', icon: Search, label: 'Find Jobs' },
    { id: 'my-jobs', icon: Briefcase, label: 'My Jobs' },
    { id: 'profile', icon: User, label: 'Profile' }
  ];

  const navItems = userType === 'cleaner' ? cleanerItems : homeownerItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 safe-area-bottom z-40">
      <div className="flex justify-around py-2 px-4 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = currentPage === item.id ||
            (item.id === 'homeowner-dashboard' && currentPage === 'homeowner-dashboard') ||
            (item.id === 'cleaner-dashboard' && currentPage === 'cleaner-dashboard');

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center py-2 px-4 rounded-xl transition-all ${
                isActive
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <item.icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default App;
