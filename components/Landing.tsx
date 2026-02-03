
import React, { useState } from 'react';
import { Button, Card } from './UI';
import {
  Sparkles, Home, Briefcase, ShieldCheck, Star, Clock, DollarSign,
  CheckCircle, Users, Lock, CreditCard, BadgeCheck, Phone, Mail,
  Droplets, Wind, Shirt, Sofa, SprayCan, Trash2, ArrowRight,
  Calendar, MapPin, Wallet, ThumbsUp, MessageSquare, Award,
  Wrench, Package, AlertCircle, ChevronDown, ChevronUp,
  Calculator, TrendingUp, Target, Heart, Shield, Eye
} from 'lucide-react';

interface LandingProps {
  onAction: (action: 'login' | 'register' | 'admin', role?: string) => void;
}

// Service data for SEO-optimized service cards
const services = [
  {
    id: 'regular',
    name: 'Regular House Cleaning',
    description: 'Maintain a spotless home with routine professional cleaning services. Perfect for weekly or bi-weekly maintenance.',
    hours: '2-4 hours',
    priceRange: '$80 - $160',
    includes: ['Dusting all surfaces', 'Vacuuming & mopping floors', 'Kitchen & bathroom cleaning', 'Bed making & tidying'],
    cleanerTools: ['Vacuum cleaner', 'Mop & bucket', 'Cleaning solutions', 'Microfiber cloths'],
    homeownerTools: ['Trash bags', 'Paper towels (optional)'],
    addOns: ['Inside fridge cleaning', 'Oven cleaning', 'Laundry folding'],
    icon: Home,
    color: 'purple'
  },
  {
    id: 'deep',
    name: 'Deep Cleaning Services',
    description: 'Thorough top-to-bottom cleaning for homes needing extra attention. Ideal for seasonal refreshes or first-time cleanings.',
    hours: '4-8 hours',
    priceRange: '$200 - $400',
    includes: ['All regular cleaning tasks', 'Inside cabinets & drawers', 'Baseboards & door frames', 'Light fixtures & ceiling fans', 'Behind furniture & appliances'],
    cleanerTools: ['Professional-grade equipment', 'Steam cleaner', 'Extension dusters', 'Degreasing agents'],
    homeownerTools: ['Access to all rooms', 'Decluttered spaces preferred'],
    addOns: ['Garage cleaning', 'Basement cleaning', 'Attic dusting'],
    icon: Sparkles,
    color: 'pink'
  },
  {
    id: 'moveinout',
    name: 'Move-In / Move-Out Cleaning',
    description: 'Comprehensive cleaning for empty properties. Get your deposit back or welcome new tenants with pristine spaces.',
    hours: '5-10 hours',
    priceRange: '$250 - $500',
    includes: ['Complete deep cleaning', 'Inside all appliances', 'All closets & storage', 'Window sills & tracks', 'Wall spot cleaning'],
    cleanerTools: ['Heavy-duty cleaning supplies', 'Floor polisher', 'Stain removers', 'Sanitizing products'],
    homeownerTools: ['Empty property access', 'Utilities connected'],
    addOns: ['Carpet shampooing', 'Wall washing', 'Exterior window cleaning'],
    icon: Package,
    color: 'orange'
  },
  {
    id: 'window',
    name: 'Window Cleaning',
    description: 'Crystal-clear windows inside and out. Professional streak-free cleaning for residential properties.',
    hours: '2-5 hours',
    priceRange: '$100 - $300',
    includes: ['Interior window cleaning', 'Exterior window cleaning', 'Window sill wiping', 'Screen dusting', 'Track cleaning'],
    cleanerTools: ['Squeegees', 'Extension poles', 'Window cleaning solution', 'Lint-free cloths'],
    homeownerTools: ['Ladder access (for 2+ stories)', 'Clear window areas'],
    addOns: ['Screen washing', 'Skylight cleaning', 'Glass door cleaning'],
    icon: Wind,
    color: 'blue'
  },
  {
    id: 'carpet',
    name: 'Carpet Cleaning',
    description: 'Professional carpet cleaning to remove stains, odors, and allergens. Extends carpet life and improves air quality.',
    hours: '2-4 hours',
    priceRange: '$150 - $350',
    includes: ['Pre-treatment of stains', 'Hot water extraction', 'Deodorizing treatment', 'Speed drying', 'Furniture moving (light)'],
    cleanerTools: ['Professional carpet cleaner', 'Stain treatment products', 'Deodorizers', 'Air movers'],
    homeownerTools: ['Vacuumed carpets', 'Fragile items moved'],
    addOns: ['Pet stain treatment', 'Scotchgard protection', 'Area rug cleaning'],
    icon: Sofa,
    color: 'teal'
  },
  {
    id: 'laundry',
    name: 'Laundry & Ironing',
    description: 'Professional laundry services including washing, drying, folding, and ironing. Perfect for busy households.',
    hours: '2-4 hours',
    priceRange: '$60 - $120',
    includes: ['Sorting & washing', 'Drying & folding', 'Ironing & pressing', 'Closet organization', 'Linen changing'],
    cleanerTools: ['Iron & ironing board', 'Fabric steamer', 'Laundry baskets', 'Hangers'],
    homeownerTools: ['Washer & dryer access', 'Detergent (or provided)'],
    addOns: ['Dry cleaning drop-off', 'Closet reorganization', 'Seasonal clothing rotation'],
    icon: Shirt,
    color: 'indigo'
  }
];

// Testimonials data
const testimonials = [
  {
    id: 1,
    type: 'homeowner',
    name: 'Sarah M.',
    location: 'Toronto, ON',
    rating: 5,
    text: 'HollaClean made finding a reliable cleaner so easy! The transparent pricing and verified profiles gave me complete peace of mind. My home has never looked better.',
    avatar: '👩'
  },
  {
    id: 2,
    type: 'cleaner',
    name: 'Maria G.',
    location: 'Mississauga, ON',
    rating: 5,
    text: 'I love setting my own schedule and rates. The platform handles all the payments, so I can focus on what I do best—making homes sparkle!',
    avatar: '👩‍🦱'
  },
  {
    id: 3,
    type: 'homeowner',
    name: 'James L.',
    location: 'Ottawa, ON',
    rating: 5,
    text: 'The cost estimator was spot-on, and there were no hidden fees. Booking a deep clean for our move-out was seamless. Highly recommend!',
    avatar: '👨'
  },
  {
    id: 4,
    type: 'cleaner',
    name: 'David K.',
    location: 'Hamilton, ON',
    rating: 5,
    text: 'The 80% payout is amazing compared to other platforms. I\'ve built a steady client base and earn more than I ever did with my previous job.',
    avatar: '👨‍🦲'
  }
];

// FAQ data for schema-ready answers
const faqs = [
  {
    question: 'How much do cleaning services cost?',
    answer: 'Cleaning service costs in Ontario typically range from $80 to $500 depending on the service type, home size, and specific requirements. Regular house cleaning starts at approximately $30-40 per hour, while deep cleaning and move-in/move-out services are priced higher due to the comprehensive nature of the work. Our platform provides transparent, upfront pricing with no hidden fees—use our instant cost estimator to get an accurate quote for your specific needs.'
  },
  {
    question: 'Are cleaners background checked?',
    answer: 'Yes, all cleaners on HollaClean undergo a thorough verification process. This includes identity verification, reference checks, and review of their professional experience. We maintain a rating and review system where homeowners can share their experiences, helping ensure accountability and quality. Only cleaners who meet our standards and maintain positive ratings remain active on the platform.'
  },
  {
    question: 'Do cleaners bring their own supplies?',
    answer: 'Most cleaners on our platform bring their own professional-grade cleaning supplies and equipment, including vacuums, mops, cleaning solutions, and microfiber cloths. However, some specialized services may require homeowner-provided items (like specific cleaning products for sensitive surfaces). Each service listing clearly indicates what the cleaner provides and what the homeowner should have available.'
  },
  {
    question: 'How many hours does a typical cleaning take?',
    answer: 'Cleaning duration varies based on home size and service type. Regular house cleaning typically takes 2-4 hours for an average home (2-3 bedrooms). Deep cleaning requires 4-8 hours, while move-in/move-out cleaning can take 5-10 hours for thorough results. Our cost estimator provides accurate time estimates based on your specific home size and selected services.'
  },
  {
    question: 'How do cleaners get paid?',
    answer: 'Cleaners receive 80% of each job payment, which is among the highest payouts in the industry. Payments are processed securely through our platform after job completion. Cleaners can track their earnings in real-time through their dashboard and receive payouts via direct deposit. The remaining 20% covers platform fees, payment processing, and support services.'
  },
  {
    question: 'Is payment secure?',
    answer: 'Absolutely. All payments on HollaClean are processed through our secure, encrypted payment system. Homeowners pay through the platform—never in cash directly to cleaners. This protects both parties: homeowners get service guarantees, and cleaners have payment protection. You can cancel before the cleaning starts at no charge, and our support team is available to resolve any payment-related issues.'
  },
  {
    question: 'What areas do you serve in Ontario?',
    answer: 'HollaClean currently serves homeowners and cleaners across Ontario, including the Greater Toronto Area (GTA), Ottawa, Hamilton, London, Kitchener-Waterloo, and surrounding regions. We\'re continuously expanding to new areas. Enter your postal code during booking to confirm service availability in your specific location.'
  },
  {
    question: 'Can I request the same cleaner for recurring bookings?',
    answer: 'Yes! Once you find a cleaner you love, you can request them for future bookings. Many homeowners build ongoing relationships with their preferred cleaners for weekly or bi-weekly services. Cleaners also benefit from recurring clients, creating a win-win relationship built on trust and consistency.'
  }
];

const Landing: React.FC<LandingProps> = ({ onAction }) => {
  // State for interactive elements
  const [estimatorData, setEstimatorData] = useState({
    serviceType: 'regular',
    bedrooms: 2,
    bathrooms: 2
  });

  const [cleanerEstimator, setCleanerEstimator] = useState({
    hourlyRate: 35,
    hoursPerWeek: 20
  });

  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [activeServiceTab, setActiveServiceTab] = useState('regular');

  // Calculate homeowner estimate
  const calculateHomeownerEstimate = () => {
    const baseRates: Record<string, number> = {
      regular: 35,
      deep: 45,
      moveinout: 50,
      window: 40,
      carpet: 45,
      laundry: 30
    };

    const baseHours: Record<string, number> = {
      regular: 2,
      deep: 5,
      moveinout: 6,
      window: 3,
      carpet: 2.5,
      laundry: 2
    };

    const rate = baseRates[estimatorData.serviceType] || 35;
    const baseTime = baseHours[estimatorData.serviceType] || 2;
    const sizeMultiplier = 1 + (estimatorData.bedrooms * 0.3) + (estimatorData.bathrooms * 0.2);

    const hours = Math.round(baseTime * sizeMultiplier * 10) / 10;
    const subtotal = Math.round(rate * hours);
    const platformFee = Math.round(subtotal * 0.20);
    const total = subtotal;
    const cleanerPayout = subtotal - platformFee;

    return { hours, total, platformFee, cleanerPayout };
  };

  // Calculate cleaner earnings estimate
  const calculateCleanerEarnings = () => {
    const weeklyGross = cleanerEstimator.hourlyRate * cleanerEstimator.hoursPerWeek;
    const weeklyNet = weeklyGross * 0.80;
    const monthlyNet = weeklyNet * 4;
    const platformFee = weeklyGross * 0.20;

    return {
      weeklyGross: Math.round(weeklyGross),
      weeklyNet: Math.round(weeklyNet),
      monthlyNet: Math.round(monthlyNet),
      platformFee: Math.round(platformFee)
    };
  };

  const homeownerEstimate = calculateHomeownerEstimate();
  const cleanerEarnings = calculateCleanerEarnings();

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 glass-card border-b border-white/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-purple-600 animate-zoom-pulse" />
              <span className="text-2xl font-bold font-outfit animate-shine">HollaClean</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <button onClick={() => scrollToSection('services')} className="text-gray-600 hover:text-purple-600 font-medium transition-colors">Services</button>
              <button onClick={() => scrollToSection('how-it-works')} className="text-gray-600 hover:text-purple-600 font-medium transition-colors">How It Works</button>
              <button onClick={() => scrollToSection('pricing')} className="text-gray-600 hover:text-purple-600 font-medium transition-colors">Pricing</button>
              <button onClick={() => scrollToSection('for-cleaners')} className="text-gray-600 hover:text-purple-600 font-medium transition-colors">For Cleaners</button>
              <button onClick={() => scrollToSection('faq')} className="text-gray-600 hover:text-purple-600 font-medium transition-colors">FAQ</button>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => onAction('login')} className="text-purple-600 font-semibold hover:underline hidden sm:block">Login</button>
              <Button onClick={() => onAction('register', 'homeowner')} className="text-sm px-4 py-2">
                Book Now
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* ==================== HERO SECTION ==================== */}
      <section className="relative overflow-hidden py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            {/* H1 - SEO Optimized */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-outfit text-gray-900 mb-6 leading-tight">
              Trusted Home Cleaning Services in Ontario — Simple, Safe, Transparent
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Book professional, verified cleaners in minutes. Upfront pricing, secure payments, and no hidden fees.
            </p>

            {/* Primary CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Button onClick={() => onAction('register', 'homeowner')} className="w-full sm:w-auto text-lg px-8 py-4">
                <Calendar className="w-5 h-5" />
                Book a Cleaning
              </Button>
              <Button
                onClick={() => onAction('register', 'cleaner')}
                variant="secondary"
                className="w-full sm:w-auto text-lg px-8 py-4 bg-gradient-to-r from-pink-50 to-orange-50 border-pink-200 text-pink-600 hover:from-pink-100 hover:to-orange-100"
              >
                <Wallet className="w-5 h-5" />
                Start Earning as a Cleaner
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
              <div className="flex items-center gap-2 text-gray-700">
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star className="w-5 h-5 fill-current" />
                </div>
                <span className="font-semibold">4.8/5 average rating</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Home className="w-5 h-5 text-purple-600" />
                <span className="font-semibold">Thousands of homes cleaned</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <BadgeCheck className="w-5 h-5 text-green-600" />
                <span className="font-semibold">Background-checked cleaners</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Lock className="w-5 h-5 text-blue-600" />
                <span className="font-semibold">Secure payments</span>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
      </section>

      {/* ==================== SERVICES SECTION ==================== */}
      <section id="services" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-outfit text-gray-900 mb-4">
              Professional Cleaning Services We Offer
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From regular maintenance to deep cleaning, our verified professionals deliver exceptional results for homes across Ontario.
            </p>
          </div>

          {/* Service Tabs - Mobile */}
          <div className="flex overflow-x-auto gap-2 mb-8 pb-2 md:hidden">
            {services.map((service) => (
              <button
                key={service.id}
                onClick={() => setActiveServiceTab(service.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full font-medium transition-all ${
                  activeServiceTab === service.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-200'
                }`}
              >
                {service.name.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* Service Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => {
              const IconComponent = service.icon;
              const colorClasses: Record<string, { bg: string; text: string; lightBg: string }> = {
                purple: { bg: 'bg-purple-600', text: 'text-purple-600', lightBg: 'bg-purple-100' },
                pink: { bg: 'bg-pink-600', text: 'text-pink-600', lightBg: 'bg-pink-100' },
                orange: { bg: 'bg-orange-600', text: 'text-orange-600', lightBg: 'bg-orange-100' },
                blue: { bg: 'bg-blue-600', text: 'text-blue-600', lightBg: 'bg-blue-100' },
                teal: { bg: 'bg-teal-600', text: 'text-teal-600', lightBg: 'bg-teal-100' },
                indigo: { bg: 'bg-indigo-600', text: 'text-indigo-600', lightBg: 'bg-indigo-100' }
              };
              const colors = colorClasses[service.color] || colorClasses.purple;

              return (
                <Card
                  key={service.id}
                  className={`flex flex-col h-full ${activeServiceTab !== service.id ? 'hidden md:flex' : ''}`}
                >
                  {/* Service Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-14 h-14 rounded-2xl ${colors.lightBg} flex items-center justify-center flex-shrink-0`}>
                      <IconComponent className={`w-7 h-7 ${colors.text}`} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold font-outfit text-gray-900">{service.name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          {service.hours}
                        </span>
                        <span className="flex items-center gap-1 text-sm font-semibold text-green-600">
                          <DollarSign className="w-4 h-4" />
                          {service.priceRange}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 mb-4 text-sm leading-relaxed">{service.description}</p>

                  {/* What's Included */}
                  <div className="mb-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">What's Included</h4>
                    <ul className="space-y-1">
                      {service.includes.slice(0, 4).map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Tools Required */}
                  <div className="mb-4 flex-grow">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Tools & Supplies</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-green-50 rounded-lg p-2">
                        <span className="font-semibold text-green-700 block mb-1">Cleaner Provides:</span>
                        <span className="text-green-600">{service.cleanerTools.slice(0, 2).join(', ')}</span>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-2">
                        <span className="font-semibold text-blue-700 block mb-1">You Provide:</span>
                        <span className="text-blue-600">{service.homeownerTools.slice(0, 2).join(', ')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Optional Add-ons */}
                  <div className="mb-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Optional Add-ons</h4>
                    <div className="flex flex-wrap gap-1">
                      {service.addOns.map((addon, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                          + {addon}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* CTA */}
                  <Button
                    onClick={() => onAction('register', 'homeowner')}
                    variant="outline"
                    className="w-full mt-auto"
                  >
                    Book This Service
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================== COST & TIME ESTIMATOR ==================== */}
      <section id="pricing" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-outfit text-gray-900 mb-4">
              Get an Instant Cleaning Cost & Time Estimate
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Transparent pricing with no hidden fees. See exactly what you'll pay before booking.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Inputs */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Service Type</label>
                    <select
                      value={estimatorData.serviceType}
                      onChange={(e) => setEstimatorData({...estimatorData, serviceType: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                    >
                      <option value="regular">Regular House Cleaning</option>
                      <option value="deep">Deep Cleaning Services</option>
                      <option value="moveinout">Move-In / Move-Out Cleaning</option>
                      <option value="window">Window Cleaning</option>
                      <option value="carpet">Carpet Cleaning</option>
                      <option value="laundry">Laundry & Ironing</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Number of Bedrooms</label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setEstimatorData({...estimatorData, bedrooms: Math.max(1, estimatorData.bedrooms - 1)})}
                        className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl font-bold transition-colors"
                      >
                        -
                      </button>
                      <span className="text-2xl font-bold w-12 text-center">{estimatorData.bedrooms}</span>
                      <button
                        onClick={() => setEstimatorData({...estimatorData, bedrooms: Math.min(6, estimatorData.bedrooms + 1)})}
                        className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl font-bold transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Number of Bathrooms</label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setEstimatorData({...estimatorData, bathrooms: Math.max(1, estimatorData.bathrooms - 1)})}
                        className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl font-bold transition-colors"
                      >
                        -
                      </button>
                      <span className="text-2xl font-bold w-12 text-center">{estimatorData.bathrooms}</span>
                      <button
                        onClick={() => setEstimatorData({...estimatorData, bathrooms: Math.min(5, estimatorData.bathrooms + 1)})}
                        className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl font-bold transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Results */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6">
                  <h3 className="text-lg font-bold font-outfit text-gray-900 mb-4 flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-purple-600" />
                    Your Estimate
                  </h3>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Estimated Time</span>
                      <span className="text-xl font-bold text-gray-900">{homeownerEstimate.hours} hours</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Cost</span>
                      <span className="text-3xl font-bold text-purple-600">${homeownerEstimate.total}</span>
                    </div>

                    <div className="border-t border-purple-200 pt-4 mt-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Cleaner receives (80%)</span>
                        <span className="font-semibold text-green-600">${homeownerEstimate.cleanerPayout}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm mt-1">
                        <span className="text-gray-500">Platform fee (20%)</span>
                        <span className="font-semibold text-gray-600">${homeownerEstimate.platformFee}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      No hidden fees — what you see is what you pay
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Cancel before start — no charge
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Transparent cleaner payout
                    </div>
                  </div>

                  <Button onClick={() => onAction('register', 'homeowner')} className="w-full mt-6">
                    Book at This Price
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ==================== HOW IT WORKS - HOMEOWNERS ==================== */}
      <section id="how-it-works" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-outfit text-gray-900 mb-4">
              How Our Cleaning Service Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Book professional home cleaning in four simple steps. Fast, easy, and transparent.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: 1,
                icon: Calendar,
                title: 'Choose Your Service',
                description: 'Select the cleaning service you need, pick a date and time that works for you.'
              },
              {
                step: 2,
                icon: Users,
                title: 'Get Matched',
                description: 'We connect you with a trusted, verified cleaner in your area.'
              },
              {
                step: 3,
                icon: Sparkles,
                title: 'Cleaning Complete',
                description: 'Your cleaner arrives and delivers professional-quality results.'
              },
              {
                step: 4,
                icon: ThumbsUp,
                title: 'Pay & Review',
                description: 'Pay securely through the app and share your experience.'
              }
            ].map((item) => {
              const IconComponent = item.icon;
              return (
                <Card key={item.step} className="text-center relative">
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-sm flex items-center justify-center">
                      {item.step}
                    </span>
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto mb-4 mt-4">
                    <IconComponent className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold font-outfit text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================== TRUST, SAFETY & COMPLIANCE ==================== */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-outfit text-gray-900 mb-4">
              Safe, Secure, and Fully Transparent Cleaning Services
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Your peace of mind is our priority. Here's how we ensure every cleaning experience is safe and reliable.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: BadgeCheck,
                title: 'Verified Cleaner Identities',
                description: 'Every cleaner undergoes identity verification before joining our platform. We confirm who they are so you know who\'s entering your home.',
                color: 'green'
              },
              {
                icon: Star,
                title: 'Review & Rating System',
                description: 'Transparent ratings and detailed reviews from real homeowners help you choose the right cleaner with confidence.',
                color: 'yellow'
              },
              {
                icon: Lock,
                title: 'Secure In-App Payments',
                description: 'All transactions are processed securely through our platform. No cash exchanges, full payment protection for both parties.',
                color: 'blue'
              },
              {
                icon: Eye,
                title: 'Clear Pricing Breakdown',
                description: 'See exactly where your money goes—cleaner payout, platform fee, everything transparent before you book.',
                color: 'purple'
              },
              {
                icon: Shield,
                title: 'Compliance-Aware Onboarding',
                description: 'Our cleaner onboarding ensures professionals understand service standards and platform guidelines.',
                color: 'indigo'
              },
              {
                icon: Phone,
                title: 'Support & Resolution',
                description: 'Our support team is here to help resolve any issues quickly. Your satisfaction is guaranteed.',
                color: 'pink'
              }
            ].map((item, idx) => {
              const IconComponent = item.icon;
              const colorClasses: Record<string, string> = {
                green: 'bg-green-100 text-green-600',
                yellow: 'bg-yellow-100 text-yellow-600',
                blue: 'bg-blue-100 text-blue-600',
                purple: 'bg-purple-100 text-purple-600',
                indigo: 'bg-indigo-100 text-indigo-600',
                pink: 'bg-pink-100 text-pink-600'
              };

              return (
                <Card key={idx} className="flex flex-col">
                  <div className={`w-14 h-14 rounded-2xl ${colorClasses[item.color]} flex items-center justify-center mb-4`}>
                    <IconComponent className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-bold font-outfit text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================== TOOLS & PREPARATION ==================== */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-outfit text-gray-900 mb-4">
              What Tools Are Needed for Cleaning?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Transparency about equipment ensures smooth service. Here's what to expect.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="bg-green-50 border-green-200">
              <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mb-4">
                <Wrench className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-xl font-bold font-outfit text-gray-900 mb-3">What Cleaners Bring</h3>
              <ul className="space-y-2">
                {['Vacuum cleaner', 'Mop & bucket', 'All-purpose cleaning solutions', 'Microfiber cloths & sponges', 'Glass cleaner', 'Bathroom disinfectant', 'Dusting tools'].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mb-4">
                <Home className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold font-outfit text-gray-900 mb-3">What Homeowners Provide</h3>
              <ul className="space-y-2">
                {['Access to your home', 'Running water & electricity', 'Trash bags (helpful)', 'Special products for sensitive surfaces', 'Clear communication about priorities'].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="bg-purple-50 border-purple-200">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center mb-4">
                <Package className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold font-outfit text-gray-900 mb-3">Optional Special Equipment</h3>
              <ul className="space-y-2">
                {['Steam cleaner (deep cleaning)', 'Carpet extraction machine', 'Professional floor polisher', 'Extension ladders (windows)', 'Pressure washer (exteriors)'].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-purple-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-purple-600 mt-4 italic">
                * Special equipment available for add-on services
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* ==================== CLEANER SECTION - VALUE PROPOSITION ==================== */}
      <section id="for-cleaners" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-pink-50 via-purple-50 to-orange-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1 bg-pink-100 text-pink-600 rounded-full text-sm font-semibold mb-4">FOR CLEANING PROFESSIONALS</span>
            <h2 className="text-3xl md:text-4xl font-bold font-outfit text-gray-900 mb-4">
              Find Cleaning Jobs and Earn on Your Schedule
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Join Ontario's growing network of professional cleaners. Set your own rates, choose your hours, and keep 80% of every job.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[
              {
                icon: Clock,
                title: 'Choose Your Hours',
                description: 'Work when it suits you. Accept jobs that fit your schedule—mornings, evenings, weekends.',
                highlight: 'Full flexibility'
              },
              {
                icon: MapPin,
                title: 'Jobs Near You',
                description: 'Get matched with cleaning jobs in your area. Less travel time, more earning potential.',
                highlight: 'Local opportunities'
              },
              {
                icon: DollarSign,
                title: '80% Payout',
                description: 'Keep the lion\'s share of your earnings. One of the highest payouts in the cleaning industry.',
                highlight: 'Industry-leading'
              },
              {
                icon: Target,
                title: 'No Bidding Wars',
                description: 'No competing for jobs or undercutting prices. Set your rate and get matched fairly.',
                highlight: 'Fair matching'
              },
              {
                icon: TrendingUp,
                title: 'Build Your Reputation',
                description: 'Great reviews lead to more bookings. Build a loyal client base over time.',
                highlight: 'Growth potential'
              },
              {
                icon: CreditCard,
                title: 'Reliable Payments',
                description: 'Get paid securely through the platform after every completed job. No chasing invoices.',
                highlight: 'Guaranteed pay'
              }
            ].map((item, idx) => {
              const IconComponent = item.icon;
              return (
                <Card key={idx} className="relative overflow-hidden">
                  <span className="absolute top-4 right-4 text-xs font-semibold text-pink-600 bg-pink-100 px-2 py-1 rounded-full">
                    {item.highlight}
                  </span>
                  <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center mb-4">
                    <IconComponent className="w-6 h-6 text-pink-600" />
                  </div>
                  <h3 className="text-lg font-bold font-outfit text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                </Card>
              );
            })}
          </div>

          <div className="text-center">
            <Button
              onClick={() => onAction('register', 'cleaner')}
              className="text-lg px-8 py-4 bg-gradient-to-r from-pink-600 to-orange-500 hover:from-pink-700 hover:to-orange-600"
            >
              <Wallet className="w-5 h-5" />
              Start Earning Today
            </Button>
          </div>
        </div>
      </section>

      {/* ==================== CLEANER EARNINGS ESTIMATOR ==================== */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-outfit text-gray-900 mb-4">
              Estimate Your Cleaning Earnings
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              See how much you could earn as a cleaner on HollaClean. Transparent calculations, no surprises.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <Card className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Inputs */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Your Hourly Rate ($)</label>
                    <input
                      type="range"
                      min="25"
                      max="60"
                      value={cleanerEstimator.hourlyRate}
                      onChange={(e) => setCleanerEstimator({...cleanerEstimator, hourlyRate: parseInt(e.target.value)})}
                      className="w-full h-3 bg-pink-200 rounded-lg appearance-none cursor-pointer accent-pink-600"
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-1">
                      <span>$25</span>
                      <span className="text-xl font-bold text-pink-600">${cleanerEstimator.hourlyRate}/hr</span>
                      <span>$60</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Hours Per Week</label>
                    <input
                      type="range"
                      min="5"
                      max="40"
                      value={cleanerEstimator.hoursPerWeek}
                      onChange={(e) => setCleanerEstimator({...cleanerEstimator, hoursPerWeek: parseInt(e.target.value)})}
                      className="w-full h-3 bg-pink-200 rounded-lg appearance-none cursor-pointer accent-pink-600"
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-1">
                      <span>5 hrs</span>
                      <span className="text-xl font-bold text-pink-600">{cleanerEstimator.hoursPerWeek} hrs/week</span>
                      <span>40 hrs</span>
                    </div>
                  </div>
                </div>

                {/* Results */}
                <div className="bg-gradient-to-br from-pink-50 to-orange-50 rounded-2xl p-6">
                  <h3 className="text-lg font-bold font-outfit text-gray-900 mb-4 flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-pink-600" />
                    Your Earnings Estimate
                  </h3>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Weekly Gross</span>
                      <span className="text-lg font-bold text-gray-700">${cleanerEarnings.weeklyGross}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Platform Fee (20%)</span>
                      <span className="text-lg font-bold text-gray-500">-${cleanerEarnings.platformFee}</span>
                    </div>

                    <div className="border-t border-pink-200 pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-900 font-semibold">Weekly Take-Home</span>
                        <span className="text-2xl font-bold text-pink-600">${cleanerEarnings.weeklyNet}</span>
                      </div>
                    </div>

                    <div className="bg-white/50 rounded-xl p-4 mt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-semibold">Monthly Earnings</span>
                        <span className="text-3xl font-bold text-green-600">${cleanerEarnings.monthlyNet}</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => onAction('register', 'cleaner')}
                    className="w-full mt-6 bg-gradient-to-r from-pink-600 to-orange-500"
                  >
                    Start Earning Now
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ==================== CLEANER REQUIREMENTS ==================== */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-outfit text-gray-900 mb-4">
              Cleaner Requirements & Service Standards
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              What it takes to join our network of trusted cleaning professionals in Ontario.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              {
                icon: BadgeCheck,
                title: 'Identity Verification',
                description: 'Provide valid ID and complete our verification process. Builds trust with homeowners.',
                color: 'green'
              },
              {
                icon: Award,
                title: 'Experience',
                description: 'Professional cleaning experience preferred. Training resources available for skill development.',
                color: 'blue'
              },
              {
                icon: Wrench,
                title: 'Own Equipment',
                description: 'Bring your own basic cleaning supplies and equipment. Quality tools deliver quality results.',
                color: 'purple'
              },
              {
                icon: Star,
                title: 'Maintain Ratings',
                description: 'Deliver consistent quality to maintain your rating. Higher ratings mean more job opportunities.',
                color: 'yellow'
              }
            ].map((item, idx) => {
              const IconComponent = item.icon;
              const colorClasses: Record<string, string> = {
                green: 'bg-green-100 text-green-600',
                blue: 'bg-blue-100 text-blue-600',
                purple: 'bg-purple-100 text-purple-600',
                yellow: 'bg-yellow-100 text-yellow-600'
              };

              return (
                <Card key={idx} className="text-center">
                  <div className={`w-16 h-16 rounded-2xl ${colorClasses[item.color]} flex items-center justify-center mx-auto mb-4`}>
                    <IconComponent className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold font-outfit text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================== SOCIAL PROOF / TESTIMONIALS ==================== */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-outfit text-gray-900 mb-4">
              Trusted by Homeowners and Cleaners Across Ontario
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Real experiences from our community of satisfied customers and successful cleaners.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id} className={`${testimonial.type === 'cleaner' ? 'bg-pink-50/50' : 'bg-purple-50/50'}`}>
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{testimonial.avatar}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-900">{testimonial.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        testimonial.type === 'cleaner'
                          ? 'bg-pink-100 text-pink-600'
                          : 'bg-purple-100 text-purple-600'
                      }`}>
                        {testimonial.type === 'cleaner' ? 'Cleaner' : 'Homeowner'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">{testimonial.location}</span>
                      <div className="flex items-center gap-0.5 ml-2">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 text-yellow-500 fill-current" />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed italic">"{testimonial.text}"</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== FAQ SECTION ==================== */}
      <section id="faq" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-outfit text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to know about our home cleaning services and platform.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, idx) => (
              <Card key={idx} className="overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between text-left p-2"
                >
                  <h3 className="text-lg font-semibold text-gray-900 pr-4">{faq.question}</h3>
                  {expandedFaq === idx ? (
                    <ChevronUp className="w-5 h-5 text-purple-600 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                {expandedFaq === idx && (
                  <div className="px-2 pb-2">
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== FINAL CTA SECTION ==================== */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-outfit text-white mb-4">
            Ready to Experience Hassle-Free Cleaning?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Transparent pricing. Trusted professionals. No commitment required.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={() => onAction('register', 'homeowner')}
              className="w-full sm:w-auto text-lg px-8 py-4 bg-white text-purple-600 hover:bg-gray-100"
            >
              <Calendar className="w-5 h-5" />
              Book Your Cleaning
            </Button>
            <Button
              onClick={() => onAction('register', 'cleaner')}
              variant="outline"
              className="w-full sm:w-auto text-lg px-8 py-4 border-white text-white hover:bg-white/10"
            >
              <Wallet className="w-5 h-5" />
              Start Earning as a Cleaner
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-white/80">
            <span className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Transparent pricing
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Verified professionals
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              No commitment
            </span>
          </div>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-6 h-6 text-purple-400" />
                <span className="text-xl font-bold font-outfit">HollaClean</span>
              </div>
              <p className="text-gray-400 text-sm">
                Ontario's trusted home cleaning marketplace. Connecting homeowners with verified cleaning professionals.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4">For Homeowners</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><button onClick={() => scrollToSection('services')} className="hover:text-white transition-colors">Our Services</button></li>
                <li><button onClick={() => scrollToSection('pricing')} className="hover:text-white transition-colors">Pricing</button></li>
                <li><button onClick={() => scrollToSection('how-it-works')} className="hover:text-white transition-colors">How It Works</button></li>
                <li><button onClick={() => onAction('register', 'homeowner')} className="hover:text-white transition-colors">Book a Cleaning</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">For Cleaners</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><button onClick={() => scrollToSection('for-cleaners')} className="hover:text-white transition-colors">Why Join</button></li>
                <li><button onClick={() => scrollToSection('for-cleaners')} className="hover:text-white transition-colors">Earnings</button></li>
                <li><button onClick={() => scrollToSection('for-cleaners')} className="hover:text-white transition-colors">Requirements</button></li>
                <li><button onClick={() => onAction('register', 'cleaner')} className="hover:text-white transition-colors">Start Earning</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><button onClick={() => scrollToSection('faq')} className="hover:text-white transition-colors">FAQ</button></li>
                <li><a href="mailto:support@hollaclean.ca" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><button onClick={() => onAction('login')} className="hover:text-white transition-colors">Login</button></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">
              © 2025 HollaClean. All rights reserved. Serving Ontario, Canada.
            </p>
            <div className="flex items-center gap-4 text-gray-500 text-sm">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Admin Portal Link (Hidden) */}
      <button
        onClick={() => onAction('admin')}
        className="fixed bottom-4 right-4 p-2 text-gray-300 hover:text-gray-600 transition-colors opacity-30 hover:opacity-100"
      >
        <ShieldCheck className="w-5 h-5" />
      </button>
    </div>
  );
};

export default Landing;
