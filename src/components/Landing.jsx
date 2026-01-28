import React from 'react';
import {
  Sparkles,
  Home,
  Shield,
  Star,
  Clock,
  CheckCircle,
  ArrowRight,
  Users,
  DollarSign,
  Award
} from 'lucide-react';

const Landing = ({ onNavigate }) => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-primary-600" />
          <span className="text-2xl font-display font-bold bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">
            HollaClean
          </span>
        </div>
        <button
          onClick={() => onNavigate('admin-login')}
          className="text-sm text-gray-500 hover:text-primary-600 transition-colors"
        >
          Admin
        </button>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="animate-slide-up">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-800 mb-4">
            Professional Cleaning,
            <span className="block bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">
              Made Simple
            </span>
          </h1>
          <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
            Connect with trusted cleaning professionals in Ontario. Book services instantly or grow your cleaning business.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 mb-8 w-full max-w-md animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <FeatureCard icon={Shield} label="Verified Pros" />
          <FeatureCard icon={Star} label="5-Star Rated" />
          <FeatureCard icon={Clock} label="Book Instantly" />
        </div>

        {/* Role Selection */}
        <div className="w-full max-w-md space-y-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-lg font-semibold text-gray-700 mb-4">I want to...</h2>

          <RoleCard
            icon={Home}
            title="Find a Cleaner"
            description="Post cleaning requests and get matched with professionals"
            onClick={() => onNavigate('register', { userType: 'homeowner' })}
            gradient="from-primary-500 to-primary-600"
          />

          <RoleCard
            icon={Sparkles}
            title="Offer Cleaning Services"
            description="Find clients and grow your cleaning business"
            onClick={() => onNavigate('register', { userType: 'cleaner' })}
            gradient="from-secondary-500 to-secondary-600"
          />
        </div>

        {/* Login Link */}
        <p className="mt-6 text-gray-500 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          Already have an account?{' '}
          <button
            onClick={() => onNavigate('login')}
            className="text-primary-600 font-semibold hover:underline"
          >
            Sign In
          </button>
        </p>

        {/* Trust Badges */}
        <div className="mt-8 flex items-center gap-4 text-sm text-gray-500 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <span className="flex items-center gap-1">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Insured
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Background Checked
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Secure Payments
          </span>
        </div>
      </main>

      {/* Stats Section */}
      <section className="bg-white/80 backdrop-blur-sm py-8 px-6">
        <div className="max-w-md mx-auto grid grid-cols-3 gap-4 text-center">
          <StatItem icon={Users} value="500+" label="Cleaners" />
          <StatItem icon={Star} value="4.8" label="Avg Rating" />
          <StatItem icon={Award} value="10K+" label="Jobs Done" />
        </div>
      </section>

      {/* Footer */}
      <footer className="p-4 text-center text-sm text-gray-500">
        <p>Serving Ontario, Canada</p>
        <p className="mt-1">20% platform fee on completed jobs</p>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon: Icon, label }) => (
  <div className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl text-center shadow-soft hover:shadow-md transition-shadow">
    <Icon className="w-6 h-6 mx-auto mb-2 text-primary-600" />
    <span className="text-xs font-medium text-gray-600">{label}</span>
  </div>
);

const RoleCard = ({ icon: Icon, title, description, onClick, gradient }) => (
  <button
    onClick={onClick}
    className="w-full p-5 bg-white rounded-2xl shadow-soft hover:shadow-lg text-left transition-all transform hover:-translate-y-0.5 active:scale-[0.98] flex items-center gap-4 group"
  >
    <div className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-md`}>
      <Icon className="w-7 h-7 text-white" />
    </div>
    <div className="flex-1">
      <h3 className="font-semibold text-gray-800 text-lg">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
    <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
  </button>
);

const StatItem = ({ icon: Icon, value, label }) => (
  <div>
    <Icon className="w-5 h-5 mx-auto mb-1 text-primary-500" />
    <p className="text-xl font-bold text-gray-800">{value}</p>
    <p className="text-xs text-gray-500">{label}</p>
  </div>
);

export default Landing;
