
import React from 'react';

export const Button: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  className?: string;
  disabled?: boolean;
}> = ({ children, onClick, type = 'button', variant = 'primary', className = '', disabled }) => {
  const base = "px-6 py-3 rounded-xl font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-purple-200",
    secondary: "bg-white text-purple-600 border border-purple-100 shadow-sm hover:bg-purple-50",
    outline: "bg-transparent border-2 border-purple-600 text-purple-600 hover:bg-purple-50",
    ghost: "bg-transparent text-gray-600 hover:bg-gray-100",
    danger: "bg-red-500 text-white shadow-lg hover:bg-red-600",
  };
  
  return (
    <button 
      type={type} 
      onClick={onClick} 
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export const Input: React.FC<{
  label?: string;
  error?: string;
  [key: string]: any;
}> = ({ label, error, ...props }) => (
  <div className="flex flex-col gap-1 w-full">
    {label && <label className="text-sm font-medium text-gray-700 ml-1">{label}</label>}
    <input 
      className={`w-full px-4 py-3 rounded-xl border-2 transition-all outline-none focus:ring-2 focus:ring-purple-200 ${error ? 'border-red-400' : 'border-gray-100 focus:border-purple-500'}`}
      {...props}
    />
    {error && <span className="text-xs text-red-500 ml-1 font-medium">{error}</span>}
  </div>
);

export const Badge: React.FC<{
  status: string;
}> = ({ status }) => {
  const styles: Record<string, string> = {
    open: "bg-green-100 text-green-700",
    accepted: "bg-blue-100 text-blue-700",
    in_progress: "bg-purple-100 text-purple-700",
    awaiting_payment: "bg-orange-100 text-orange-700",
    completed: "bg-gray-100 text-gray-700",
    cancelled: "bg-red-100 text-red-700",
    paid: "bg-emerald-100 text-emerald-700",
    pending: "bg-amber-100 text-amber-700",
  };
  
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${styles[status] || styles.open}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`glass-card p-6 rounded-3xl shadow-xl border border-white/50 ${className}`}>
    {children}
  </div>
);
