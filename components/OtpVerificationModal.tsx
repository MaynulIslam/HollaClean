
import React, { useState, useRef, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Mail, Phone, Loader2 } from 'lucide-react';

interface OtpVerificationModalProps {
  type: 'email' | 'phone';
  target: string;
  onVerify: () => void;
  onClose: () => void;
}

const DEMO_CODE = '123456';

const OtpVerificationModal: React.FC<OtpVerificationModalProps> = ({ type, target, onVerify, onClose }) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'input' | 'verifying' | 'success'>('input');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);
    setError('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = () => {
    const code = digits.join('');
    if (code.length < 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setStep('verifying');

    setTimeout(() => {
      if (code === DEMO_CODE) {
        setStep('success');
        setTimeout(() => onVerify(), 1500);
      } else {
        setStep('input');
        setError('Invalid code. For demo, use: 123456');
        setDigits(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    }, 1000);
  };

  const Icon = type === 'email' ? Mail : Phone;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={step === 'input' ? onClose : undefined} />

      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 fade-in duration-200">
        {step !== 'verifying' && step !== 'success' && (
          <button onClick={onClose} className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        )}

        {step === 'input' && (
          <>
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold font-outfit text-gray-900">
                Verify your {type}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                We sent a 6-digit code to
              </p>
              <p className="text-sm font-semibold text-gray-700">{target}</p>
            </div>

            {/* Demo hint */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <p className="text-xs text-amber-700">
                  <span className="font-semibold">Demo Mode:</span> Use code <span className="font-mono font-bold">123456</span>
                </p>
              </div>
            </div>

            {/* OTP Input */}
            <div className="flex justify-center gap-2 mb-5" onPaste={handlePaste}>
              {digits.map((digit, i) => (
                <input
                  key={i}
                  ref={el => inputRefs.current[i] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleDigitChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  className={`w-12 h-14 text-center text-xl font-bold border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                    error ? 'border-red-300' : 'border-gray-200'
                  }`}
                />
              ))}
            </div>

            {error && (
              <p className="text-sm text-red-500 text-center mb-4">{error}</p>
            )}

            <button
              onClick={handleSubmit}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
            >
              Verify
            </button>

            <p className="text-xs text-gray-400 text-center mt-4">
              Didn't receive the code? <button className="text-purple-600 font-semibold hover:underline">Resend</button>
            </p>
          </>
        )}

        {step === 'verifying' && (
          <div className="text-center py-8">
            <Loader2 className="w-10 h-10 text-purple-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Verifying...</p>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold font-outfit text-gray-900 mb-1">
              {type === 'email' ? 'Email' : 'Phone'} Verified!
            </h3>
            <p className="text-sm text-gray-500">Your {type} has been successfully verified.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OtpVerificationModal;
