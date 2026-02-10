
import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface VerificationBadgeProps {
  verified: boolean;
  label?: string;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  verified, label, size = 'sm', showLabel = false
}) => {
  if (size === 'sm') {
    return verified ? (
      <span className="inline-flex items-center gap-1" title={`${label || ''} verified`}>
        <CheckCircle className="w-4 h-4 text-green-500" />
        {showLabel && <span className="text-xs text-green-600 font-medium">Verified</span>}
      </span>
    ) : (
      <span className="inline-flex items-center gap-1" title={`${label || ''} unverified`}>
        <AlertCircle className="w-4 h-4 text-amber-400" />
        {showLabel && <span className="text-xs text-amber-500 font-medium">Unverified</span>}
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
      verified
        ? 'bg-green-50 text-green-700 border border-green-200'
        : 'bg-amber-50 text-amber-700 border border-amber-200'
    }`}>
      {verified ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      {label} {verified ? 'Verified' : 'Unverified'}
    </div>
  );
};

export default VerificationBadge;
