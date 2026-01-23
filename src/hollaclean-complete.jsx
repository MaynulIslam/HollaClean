import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Home,
  Calendar,
  User,
  Star,
  MapPin,
  Clock,
  DollarSign,
  Check,
  X,
  ChevronRight,
  Search,
  Filter,
  Heart,
  MessageCircle,
  Phone,
  Mail,
  Shield,
  Award,
  Users,
  TrendingUp,
  Settings,
  LogOut,
  Menu,
  Bell,
  CreditCard,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

// Main App Component
const HollaCleanApp = () => {
  const [currentPage, setCurrentPage] = useState('landing');
  const [userType, setUserType] = useState(null); // 'homeowner', 'cleaner', 'admin'
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  // Hide loading screen when app mounts
  useEffect(() => {
    document.body.classList.add('app-loaded');
  }, []);

  const handleLogin = (type, userData) => {
    setUserType(type);
    setUser(userData);
    setIsLoggedIn(true);
    setCurrentPage(type === 'admin' ? 'admin-dashboard' : 'dashboard');
  };

  const handleLogout = () => {
    setUserType(null);
    setUser(null);
    setIsLoggedIn(false);
    setCurrentPage('landing');
  };

  const renderPage = () => {
    switch(currentPage) {
      case 'landing':
        return <LandingPage onNavigate={setCurrentPage} />;
      case 'register':
        return <RegistrationPage onNavigate={setCurrentPage} onLogin={handleLogin} />;
      case 'login':
        return <LoginPage onNavigate={setCurrentPage} onLogin={handleLogin} />;
      case 'admin-login':
        return <AdminLogin onNavigate={setCurrentPage} onLogin={handleLogin} />;
      case 'dashboard':
        return userType === 'cleaner'
          ? <CleanerDashboard user={user} onNavigate={setCurrentPage} />
          : <HomeownerDashboard user={user} onNavigate={setCurrentPage} />;
      case 'admin-dashboard':
        return <AdminDashboard onLogout={handleLogout} />;
      case 'browse':
        return <BrowseCleaners onNavigate={setCurrentPage} />;
      case 'bookings':
        return <BookingsView user={user} userType={userType} />;
      case 'profile':
        return <ProfileView user={user} userType={userType} onLogout={handleLogout} />;
      default:
        return <LandingPage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {renderPage()}
      {isLoggedIn && userType !== 'admin' && (
        <BottomNav currentPage={currentPage} onNavigate={setCurrentPage} userType={userType} />
      )}
    </div>
  );
};

// Landing Page
const LandingPage = ({ onNavigate }) => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-purple-600" />
          <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
            HollaClean
          </span>
        </div>
        <button
          onClick={() => onNavigate('admin-login')}
          className="text-sm text-gray-500 hover:text-purple-600"
        >
          Admin
        </button>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="animate-slideUp">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Professional Cleaning,
            <span className="block bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
              Made Simple
            </span>
          </h1>
          <p className="text-gray-600 text-lg mb-8 max-w-md">
            Connect with trusted cleaning professionals in Ontario. Book services instantly.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 mb-8 w-full max-w-md">
          <FeatureCard icon={Shield} label="Verified Pros" />
          <FeatureCard icon={Star} label="5-Star Rated" />
          <FeatureCard icon={Clock} label="Book Instantly" />
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3 w-full max-w-xs">
          <button
            onClick={() => onNavigate('register')}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
          >
            Get Started
          </button>
          <button
            onClick={() => onNavigate('login')}
            className="w-full py-4 bg-white text-purple-600 rounded-2xl font-semibold text-lg border-2 border-purple-200 hover:border-purple-400 transition-all"
          >
            Sign In
          </button>
        </div>

        {/* Trust Badges */}
        <div className="mt-8 flex items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Insured
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Background Checked
          </span>
        </div>
      </main>
    </div>
  );
};

const FeatureCard = ({ icon: Icon, label }) => (
  <div className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl text-center">
    <Icon className="w-6 h-6 mx-auto mb-2 text-purple-600" />
    <span className="text-xs text-gray-600">{label}</span>
  </div>
);

// Registration Page
const RegistrationPage = ({ onNavigate, onLogin }) => {
  const [userType, setUserType] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    location: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // In production, this would call your API
    onLogin(userType, { ...formData, type: userType });
  };

  if (!userType) {
    return (
      <div className="min-h-screen p-6 flex flex-col">
        <button onClick={() => onNavigate('landing')} className="text-purple-600 mb-6">
          &larr; Back
        </button>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Join HollaClean</h2>
        <p className="text-gray-600 mb-8">How would you like to use HollaClean?</p>

        <div className="space-y-4">
          <UserTypeCard
            icon={Home}
            title="I need cleaning"
            description="Find and book trusted cleaning professionals"
            onClick={() => setUserType('homeowner')}
          />
          <UserTypeCard
            icon={Sparkles}
            title="I'm a cleaner"
            description="Grow your cleaning business and find clients"
            onClick={() => setUserType('cleaner')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <button onClick={() => setUserType(null)} className="text-purple-600 mb-6">
        &larr; Back
      </button>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {userType === 'homeowner' ? 'Create Your Account' : 'Join as a Cleaner'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Full Name"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          className="w-full p-4 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          className="w-full p-4 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none"
          required
        />
        <input
          type="tel"
          placeholder="Phone Number"
          value={formData.phone}
          onChange={(e) => setFormData({...formData, phone: e.target.value})}
          className="w-full p-4 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none"
          required
        />
        <input
          type="text"
          placeholder="City/Area"
          value={formData.location}
          onChange={(e) => setFormData({...formData, location: e.target.value})}
          className="w-full p-4 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          className="w-full p-4 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none"
          required
        />

        <button
          type="submit"
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-semibold text-lg"
        >
          Create Account
        </button>
      </form>

      <p className="text-center text-gray-500 mt-4">
        Already have an account?{' '}
        <button onClick={() => onNavigate('login')} className="text-purple-600 font-semibold">
          Sign In
        </button>
      </p>
    </div>
  );
};

const UserTypeCard = ({ icon: Icon, title, description, onClick }) => (
  <button
    onClick={onClick}
    className="w-full p-6 bg-white rounded-2xl border-2 border-gray-100 hover:border-purple-400 text-left transition-all flex items-center gap-4"
  >
    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
      <Icon className="w-6 h-6 text-purple-600" />
    </div>
    <div>
      <h3 className="font-semibold text-gray-800">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
    <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
  </button>
);

// Login Page
const LoginPage = ({ onNavigate, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Demo login - in production, validate credentials via API
    onLogin('homeowner', { name: 'Demo User', email });
  };

  return (
    <div className="min-h-screen p-6 flex flex-col">
      <button onClick={() => onNavigate('landing')} className="text-purple-600 mb-6">
        &larr; Back
      </button>

      <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome Back</h2>
      <p className="text-gray-600 mb-8">Sign in to your account</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-4 rounded-xl border border-gray-200 focus:border-purple-400 outline-none"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-4 rounded-xl border border-gray-200 focus:border-purple-400 outline-none"
          required
        />

        <button
          type="submit"
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-semibold"
        >
          Sign In
        </button>
      </form>

      <p className="text-center text-gray-500 mt-4">
        Don't have an account?{' '}
        <button onClick={() => onNavigate('register')} className="text-purple-600 font-semibold">
          Sign Up
        </button>
      </p>
    </div>
  );
};

// Admin Login
const AdminLogin = ({ onNavigate, onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';
    if (password === adminPassword) {
      onLogin('admin', { name: 'Admin' });
    } else {
      setError('Invalid password');
    }
  };

  return (
    <div className="min-h-screen p-6 flex flex-col items-center justify-center">
      <button onClick={() => onNavigate('landing')} className="absolute top-4 left-4 text-purple-600">
        &larr; Back
      </button>

      <div className="w-full max-w-sm">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Admin Access</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Admin Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-4 rounded-xl border border-gray-200 focus:border-purple-400 outline-none"
            required
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full py-4 bg-gray-800 text-white rounded-xl font-semibold"
          >
            Access Dashboard
          </button>
        </form>
      </div>
    </div>
  );
};

// Homeowner Dashboard
const HomeownerDashboard = ({ user, onNavigate }) => {
  return (
    <div className="min-h-screen pb-20">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">
          Hello, {user?.name?.split(' ')[0] || 'there'}!
        </h1>
        <p className="text-gray-500 mb-6">Ready for a sparkling clean home?</p>

        {/* Quick Book Card */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-500 rounded-2xl p-6 text-white mb-6">
          <h3 className="font-semibold mb-2">Book a Cleaning</h3>
          <p className="text-white/80 text-sm mb-4">Find trusted professionals near you</p>
          <button
            onClick={() => onNavigate('browse')}
            className="bg-white text-purple-600 px-6 py-2 rounded-xl font-semibold"
          >
            Browse Cleaners
          </button>
        </div>

        {/* Recent Activity */}
        <h3 className="font-semibold text-gray-800 mb-3">Recent Bookings</h3>
        <div className="bg-white rounded-xl p-4 text-center text-gray-500">
          <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p>No bookings yet</p>
          <p className="text-sm">Book your first cleaning today!</p>
        </div>
      </div>
    </div>
  );
};

// Cleaner Dashboard
const CleanerDashboard = ({ user, onNavigate }) => {
  const [stats] = useState({
    earnings: 0,
    bookings: 0,
    rating: 0,
    reviews: 0
  });

  return (
    <div className="min-h-screen pb-20">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">
          Hello, {user?.name?.split(' ')[0] || 'Cleaner'}!
        </h1>
        <p className="text-gray-500 mb-6">Manage your cleaning business</p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <StatCard icon={DollarSign} label="Earnings" value={`$${stats.earnings}`} color="green" />
          <StatCard icon={Calendar} label="Bookings" value={stats.bookings} color="purple" />
          <StatCard icon={Star} label="Rating" value={stats.rating || '-'} color="yellow" />
          <StatCard icon={MessageCircle} label="Reviews" value={stats.reviews} color="blue" />
        </div>

        {/* Upcoming Jobs */}
        <h3 className="font-semibold text-gray-800 mb-3">Upcoming Jobs</h3>
        <div className="bg-white rounded-xl p-4 text-center text-gray-500">
          <Sparkles className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p>No upcoming jobs</p>
          <p className="text-sm">New bookings will appear here</p>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }) => {
  const colors = {
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    blue: 'bg-blue-100 text-blue-600'
  };

  return (
    <div className="bg-white rounded-xl p-4">
      <div className={`w-10 h-10 rounded-lg ${colors[color]} flex items-center justify-center mb-2`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
};

// Admin Dashboard
const AdminDashboard = ({ onLogout }) => {
  const commissionRate = import.meta.env.VITE_COMMISSION_RATE || 20;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Admin Dashboard</h1>
        <button onClick={onLogout} className="text-red-500 flex items-center gap-2">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </header>

      <main className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-6">
            <p className="text-gray-500 text-sm">Total Revenue</p>
            <p className="text-3xl font-bold">$0</p>
          </div>
          <div className="bg-white rounded-xl p-6">
            <p className="text-gray-500 text-sm">Platform Commission ({commissionRate}%)</p>
            <p className="text-3xl font-bold">$0</p>
          </div>
          <div className="bg-white rounded-xl p-6">
            <p className="text-gray-500 text-sm">Active Users</p>
            <p className="text-3xl font-bold">0</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6">
          <h2 className="font-semibold mb-4">Recent Activity</h2>
          <p className="text-gray-500 text-center py-8">No recent activity</p>
        </div>
      </main>
    </div>
  );
};

// Browse Cleaners
const BrowseCleaners = ({ onNavigate }) => {
  const [cleaners] = useState([
    { id: 1, name: 'Sarah M.', rating: 4.9, reviews: 47, hourlyRate: 35, services: ['Deep Clean', 'Regular'], location: 'Toronto' },
    { id: 2, name: 'Maria L.', rating: 4.8, reviews: 32, hourlyRate: 30, services: ['Regular', 'Move-out'], location: 'Mississauga' },
    { id: 3, name: 'Jennifer K.', rating: 5.0, reviews: 28, hourlyRate: 40, services: ['Deep Clean', 'Office'], location: 'Brampton' }
  ]);

  return (
    <div className="min-h-screen pb-20">
      <div className="p-6">
        <button onClick={() => onNavigate('dashboard')} className="text-purple-600 mb-4">
          &larr; Back
        </button>

        <h1 className="text-2xl font-bold text-gray-800 mb-4">Find Cleaners</h1>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by location or service..."
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-purple-400 outline-none"
          />
        </div>

        {/* Cleaner List */}
        <div className="space-y-4">
          {cleaners.map(cleaner => (
            <CleanerCard key={cleaner.id} cleaner={cleaner} />
          ))}
        </div>
      </div>
    </div>
  );
};

const CleanerCard = ({ cleaner }) => {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="flex gap-4">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl flex items-center justify-center text-white text-xl font-bold">
          {cleaner.name.charAt(0)}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800">{cleaner.name}</h3>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <MapPin className="w-3 h-3" />
            {cleaner.location}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="flex items-center gap-1 text-sm">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              {cleaner.rating}
            </span>
            <span className="text-gray-300">|</span>
            <span className="text-sm text-gray-500">{cleaner.reviews} reviews</span>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-purple-600">${cleaner.hourlyRate}/hr</p>
          <button className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium">
            Book
          </button>
        </div>
      </div>
    </div>
  );
};

// Bookings View
const BookingsView = ({ user, userType }) => {
  return (
    <div className="min-h-screen pb-20">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">My Bookings</h1>

        <div className="bg-white rounded-xl p-8 text-center">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="font-semibold text-gray-800 mb-2">No Bookings Yet</h3>
          <p className="text-gray-500">
            {userType === 'cleaner'
              ? 'Bookings from clients will appear here'
              : 'Book a cleaner to see your appointments here'}
          </p>
        </div>
      </div>
    </div>
  );
};

// Profile View
const ProfileView = ({ user, userType, onLogout }) => {
  return (
    <div className="min-h-screen pb-20">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Profile</h1>

        {/* Profile Card */}
        <div className="bg-white rounded-xl p-6 mb-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <h2 className="font-semibold text-lg">{user?.name || 'User'}</h2>
              <p className="text-gray-500 text-sm">{user?.email || 'email@example.com'}</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="bg-white rounded-xl divide-y">
          <MenuItem icon={User} label="Edit Profile" />
          <MenuItem icon={Bell} label="Notifications" />
          <MenuItem icon={CreditCard} label="Payment Methods" />
          <MenuItem icon={Settings} label="Settings" />
        </div>

        <button
          onClick={onLogout}
          className="w-full mt-4 py-4 bg-red-50 text-red-600 rounded-xl font-semibold flex items-center justify-center gap-2"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

const MenuItem = ({ icon: Icon, label }) => (
  <button className="w-full p-4 flex items-center gap-3 text-gray-700 hover:bg-gray-50">
    <Icon className="w-5 h-5 text-gray-400" />
    <span>{label}</span>
    <ChevronRight className="w-5 h-5 text-gray-300 ml-auto" />
  </button>
);

// Bottom Navigation
const BottomNav = ({ currentPage, onNavigate, userType }) => {
  const navItems = [
    { id: 'dashboard', icon: Home, label: 'Home' },
    { id: 'browse', icon: Search, label: 'Browse', hideFor: 'cleaner' },
    { id: 'bookings', icon: Calendar, label: 'Bookings' },
    { id: 'profile', icon: User, label: 'Profile' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 safe-bottom">
      <div className="flex justify-around py-2">
        {navItems
          .filter(item => !item.hideFor || item.hideFor !== userType)
          .map(item => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center py-2 px-4 ${
                currentPage === item.id ? 'text-purple-600' : 'text-gray-400'
              }`}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          ))}
      </div>
    </nav>
  );
};

export default HollaCleanApp;
