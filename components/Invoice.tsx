
import React from 'react';
import { CleaningRequest, InvoiceType } from '../types';
import { X, Printer, CheckCircle, Calendar, Clock, Sparkles, FileText, Shield } from 'lucide-react';

interface InvoiceProps {
  request: CleaningRequest;
  isOpen: boolean;
  onClose: () => void;
  invoiceType?: InvoiceType;
}

function getInvoiceConfig(type: InvoiceType, request: CleaningRequest) {
  switch (type) {
    case 'proforma':
      return {
        badge: 'QUOTE',
        badgeColor: 'bg-blue-100 text-blue-700',
        badgeIcon: FileText,
        prefix: 'QUO',
        date: request.acceptedAt
          ? new Date(request.acceptedAt).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })
          : new Date().toLocaleDateString('en-CA'),
        title: 'Booking Confirmation & Quote',
        totalLabel: 'Total Due',
        showCleanerPayout: false,
        footerNote: 'This is a proforma invoice. Payment is required before cleaning begins.',
        footerThank: 'Your booking is confirmed — pay before the scheduled time.',
      };
    case 'payment':
      return {
        badge: 'PAYMENT HELD',
        badgeColor: 'bg-purple-100 text-purple-700',
        badgeIcon: Shield,
        prefix: 'PAY',
        date: request.paidAt
          ? new Date(request.paidAt).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })
          : new Date().toLocaleDateString('en-CA'),
        title: 'Payment Confirmation',
        totalLabel: 'Total Charged',
        showCleanerPayout: true,
        footerNote: 'Your payment has been processed securely. A cleaner will call you before arriving.',
        footerThank: 'Payment received — thank you!',
      };
    case 'final':
    default:
      return {
        badge: 'PAID',
        badgeColor: 'bg-green-100 text-green-700',
        badgeIcon: CheckCircle,
        prefix: 'INV',
        date: request.completedAt
          ? new Date(request.completedAt).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })
          : new Date().toLocaleDateString('en-CA'),
        title: 'Invoice',
        totalLabel: 'Total Paid',
        showCleanerPayout: true,
        footerNote: '',
        footerThank: 'Thank you for choosing HollaClean!',
      };
  }
}

const Invoice: React.FC<InvoiceProps> = ({ request, isOpen, onClose, invoiceType = 'final' }) => {
  if (!isOpen) return null;

  const config = getInvoiceConfig(invoiceType, request);
  const invoiceNumber = `${config.prefix}-${request.id.slice(0, 8).toUpperCase()}`;
  const BadgeIcon = config.badgeIcon;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 fade-in duration-200">
        {/* Header Actions */}
        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between z-10 print:hidden">
          <h2 className="text-lg font-bold font-outfit text-gray-900">{config.title}</h2>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors" title="Print">
              <Printer className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors" title="Close">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="p-4 md:p-8 print:p-4">
          {/* Invoice Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 md:mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-purple-600" />
                <span className="text-xl md:text-2xl font-bold font-outfit bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  HollaClean
                </span>
              </div>
              <p className="text-xs md:text-sm text-gray-500">Ontario's Trusted Cleaning Marketplace</p>
              <p className="text-xs md:text-sm text-gray-500">support@hollaclean.ca</p>
            </div>
            <div className="sm:text-right">
              <div className={`inline-flex items-center gap-2 ${config.badgeColor} px-3 py-1 rounded-full text-xs md:text-sm font-bold mb-2`}>
                <BadgeIcon className="w-4 h-4" />
                {config.badge}
              </div>
              <p className="text-xs md:text-sm text-gray-500">#{invoiceNumber}</p>
              <p className="text-xs md:text-sm text-gray-500">{config.date}</p>
            </div>
          </div>

          {/* Customer & Service Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-2">Bill To</p>
              <p className="font-semibold text-gray-900">{request.homeownerName}</p>
              <p className="text-sm text-gray-600">{request.address}</p>
              {request.homeownerPhone && <p className="text-sm text-gray-600">{request.homeownerPhone}</p>}
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-2">Service Provider</p>
              <p className="font-semibold text-gray-900">{request.cleanerName}</p>
              <p className="text-sm text-gray-600">Professional Cleaner</p>
              <p className="text-sm text-gray-600">via HollaClean</p>
            </div>
          </div>

          {/* Scheduled Date Banner (for proforma & payment) */}
          {invoiceType !== 'final' && (
            <div className={`mb-6 p-4 rounded-xl border ${invoiceType === 'proforma' ? 'bg-blue-50 border-blue-200' : 'bg-purple-50 border-purple-200'}`}>
              <div className="flex items-center gap-3">
                <Calendar className={`w-5 h-5 ${invoiceType === 'proforma' ? 'text-blue-600' : 'text-purple-600'}`} />
                <div>
                  <p className="text-xs font-bold uppercase text-gray-400 tracking-wider">Scheduled Date & Time</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(request.date).toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} at {request.time}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Service Details */}
          <div className="mb-6 md:mb-8">
            <p className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-3 md:mb-4">Service Details</p>

            {/* Mobile Layout */}
            <div className="block md:hidden border border-gray-200 rounded-xl p-4 space-y-3">
              <div>
                <p className="font-semibold text-gray-900">{request.serviceType}</p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(request.date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {request.time}
                  </span>
                </div>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
                <span className="text-gray-600">{request.hours}h @ ${Number(request.hourlyRate) || 35}/hr</span>
                <span className="font-semibold text-gray-900">${(Number(request.totalAmount) || 0).toFixed(2)}</span>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:block border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <div className="grid grid-cols-12 gap-4 text-xs font-bold uppercase text-gray-500 tracking-wider">
                  <div className="col-span-6">Description</div>
                  <div className="col-span-2 text-center">Hours</div>
                  <div className="col-span-2 text-center">Rate</div>
                  <div className="col-span-2 text-right">Amount</div>
                </div>
              </div>
              <div className="px-4 py-4">
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-6">
                    <p className="font-semibold text-gray-900">{request.serviceType}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(request.date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {request.time}
                      </span>
                    </div>
                  </div>
                  <div className="col-span-2 text-center text-gray-700">{request.hours}h</div>
                  <div className="col-span-2 text-center text-gray-700">${Number(request.hourlyRate) || 35}/hr</div>
                  <div className="col-span-2 text-right font-semibold text-gray-900">${(Number(request.totalAmount) || 0).toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Totals */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex justify-end">
              <div className="w-full max-w-xs space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">${(Number(request.totalAmount) || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-gray-200">
                  <span className="font-bold text-gray-900">{config.totalLabel}</span>
                  <span className="text-xl font-bold text-purple-600">${(Number(request.totalAmount) || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          {config.footerNote && (
            <div className={`mt-6 p-4 rounded-xl border ${invoiceType === 'proforma' ? 'bg-blue-50 border-blue-200' : 'bg-purple-50 border-purple-200'}`}>
              <p className={`text-sm font-medium ${invoiceType === 'proforma' ? 'text-blue-700' : 'text-purple-700'}`}>
                {config.footerNote}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500 mb-2">{config.footerThank}</p>
            <p className="text-xs text-gray-400">Questions? Contact us at support@hollaclean.ca</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Invoice;
