
import React from 'react';
import { Clock, Sparkles, Bell, MessageSquare, CreditCard, X } from 'lucide-react';

interface ComingSoonProps {
  feature: 'messaging' | 'payments' | 'notifications' | 'generic';
  isOpen: boolean;
  onClose: () => void;
}

const featureInfo = {
  messaging: {
    icon: MessageSquare,
    title: 'In-App Messaging',
    description: 'Soon you\'ll be able to chat directly with homeowners and cleaners through the app.',
    eta: 'Coming Soon',
  },
  payments: {
    icon: CreditCard,
    title: 'Online Payments',
    description: 'Secure payment processing with Stripe is on its way. Pay and get paid seamlessly through the platform.',
    eta: 'Coming Soon',
  },
  notifications: {
    icon: Bell,
    title: 'Push Notifications',
    description: 'Get real-time alerts about your bookings, messages, and more.',
    eta: 'Available Now',
  },
  generic: {
    icon: Sparkles,
    title: 'New Feature',
    description: 'We\'re working hard to bring you this feature. Stay tuned!',
    eta: 'Coming Soon',
  },
};

const ComingSoon: React.FC<ComingSoonProps> = ({ feature, isOpen, onClose }) => {
  if (!isOpen) return null;

  const info = featureInfo[feature];
  const IconComponent = info.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl md:rounded-3xl shadow-2xl max-w-md w-full p-5 md:p-8 animate-in zoom-in-95 fade-in duration-200 mx-4">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 md:top-4 md:right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto mb-4 md:mb-6">
            <IconComponent className="w-8 h-8 md:w-10 md:h-10 text-purple-600" />
          </div>

          <div className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold mb-3 md:mb-4">
            <Clock className="w-3 h-3" />
            {info.eta}
          </div>

          <h2 className="text-xl md:text-2xl font-bold font-outfit text-gray-900 mb-2 md:mb-3">
            {info.title}
          </h2>

          <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6 leading-relaxed">
            {info.description}
          </p>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl md:rounded-2xl p-3 md:p-4 mb-4 md:mb-6">
            <p className="text-xs md:text-sm text-gray-700">
              Want to be notified when this feature launches?
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Follow us on social media for updates!
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity active:scale-[0.98]"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;

// Hook for using the ComingSoon modal
export function useComingSoon() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [feature, setFeature] = React.useState<ComingSoonProps['feature']>('generic');

  const showComingSoon = (feat: ComingSoonProps['feature']) => {
    setFeature(feat);
    setIsOpen(true);
  };

  const hideComingSoon = () => {
    setIsOpen(false);
  };

  return {
    isOpen,
    feature,
    showComingSoon,
    hideComingSoon,
  };
}
