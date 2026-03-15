
import React, { useState } from 'react';
import { X } from 'lucide-react';

interface TermsModalProps {
  initialTab?: 'terms' | 'privacy';
  onClose: () => void;
}

export default function TermsModal({ initialTab = 'terms', onClose }: TermsModalProps) {
  const [tab, setTab] = useState<'terms' | 'privacy'>(initialTab);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setTab('terms')}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${tab === 'terms' ? 'bg-white shadow text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Terms of Service
            </button>
            <button
              onClick={() => setTab('privacy')}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${tab === 'privacy' ? 'bg-white shadow text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Privacy Policy
            </button>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-6 py-5 text-sm text-gray-700 leading-relaxed space-y-4">
          {tab === 'terms' ? <TermsContent /> : <PrivacyContent />}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function TermsContent() {
  return (
    <>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800 text-xs">
        <strong>Important:</strong> HollaClean and its Service Providers do not carry insurance for property damage or theft. By using this platform, you assume all risk for any property damage, breakage, theft, or loss that may occur during cleaning services.
      </div>

      <p className="text-xs text-gray-500">Effective Date: March 1, 2026 &nbsp;·&nbsp; Last Updated: March 1, 2026</p>

      <Section title="1. About the Platform">
        HollaClean operates as a technology platform that connects homeowners (Customers) with independent cleaning professionals (Service Providers). HollaClean is not a cleaning service provider and does not employ Service Providers.
      </Section>

      <Section title="2. Eligibility">
        You must be at least 18 years old and legally authorized to work in Canada. The platform is currently available to users in Sudbury, Ontario and surrounding areas.
      </Section>

      <Section title="3. Account Registration">
        You must provide accurate, current information including your full name, email address, phone number, and physical address. Each person may maintain only one active account. You are responsible for maintaining the confidentiality of your credentials.
      </Section>

      <Section title="4. For Customers (Homeowners)">
        <ul className="list-disc pl-4 space-y-1">
          <li>Secure all valuables, cash, jewelry, electronics, and irreplaceable items before service begins.</li>
          <li>Neither HollaClean nor Service Providers carry insurance for property damage or theft — you assume all risk.</li>
          <li>Ensure safe property access and a hazard-free working environment.</li>
          <li>Do not request off-platform payments or engage in harassment of any kind.</li>
          <li>Report service issues within 24 hours of completion.</li>
        </ul>
      </Section>

      <Section title="5. For Service Providers (Cleaners)">
        <ul className="list-disc pl-4 space-y-1">
          <li>You are an independent contractor — not an employee of HollaClean.</li>
          <li>You are solely responsible for your taxes, including reporting income to the CRA.</li>
          <li>You set your own schedule and may accept or decline bookings.</li>
          <li>You must not solicit customers to book outside the platform for 12 months after initial contact.</li>
          <li>Background checks are not currently mandatory but may be required in the future with 30 days' notice (at your cost).</li>
        </ul>
      </Section>

      <Section title="6. Payments & Fees">
        All payments are processed through Stripe in Canadian Dollars (CAD). Cash payments are not accepted.
        <br /><br />
        <strong>Service Fee:</strong> 10–15% of the Gross Booking Value (see hollaclean.ca/pricing for current rates).<br />
        <strong>Payout:</strong> Net Payment = Booking Value − Service Fee − Stripe processing fee (~2.9% + $0.30), paid within 2 business days.<br />
        <strong>Minimum payout threshold:</strong> $25.00.
      </Section>

      <Section title="7. Cancellations & Refunds">
        <strong>Customer cancellations:</strong>
        <ul className="list-disc pl-4 mt-1 space-y-1">
          <li>More than 24 hrs before: Full refund</li>
          <li>12–24 hrs before: 50% refund</li>
          <li>Less than 12 hrs / after arrival: No refund</li>
        </ul>
        <br />
        <strong>Service Provider cancellations:</strong>
        <ul className="list-disc pl-4 mt-1 space-y-1">
          <li>Less than 12 hrs before: $25 penalty</li>
          <li>No-show: $50 penalty</li>
        </ul>
      </Section>

      <Section title="8. Liability Disclaimer">
        HollaClean's total liability for any claim shall not exceed the greater of $100 CAD or total fees paid in the preceding 12 months. HollaClean has <strong>zero liability</strong> for property damage or theft. All disputes between Customers and Service Providers must be resolved directly between those parties.
      </Section>

      <Section title="9. Prohibited Activities">
        Users must not engage in fraud, harassment, discrimination, off-platform payments, fake accounts, review manipulation, or any illegal activity. Violations may result in account suspension, withholding of payments, or legal action.
      </Section>

      <Section title="10. Termination">
        You may delete your account at any time via Account Settings. HollaClean may suspend or terminate accounts for Terms violations, fraudulent activity, or repeated poor performance.
      </Section>

      <Section title="11. Governing Law">
        These Terms are governed by the laws of Ontario, Canada. Any disputes shall be resolved in the courts of Sudbury, Ontario.
      </Section>

      <Section title="12. Contact">
        <strong>General:</strong> support@hollaclean.ca &nbsp;·&nbsp; 705-665-6826<br />
        <strong>Legal:</strong> legal@hollaclean.ca<br />
        <strong>Address:</strong> HollaClean, 1003-256 Caswell Drive, Sudbury, ON P3E 2N9, Canada
      </Section>
    </>
  );
}

function PrivacyContent() {
  return (
    <>
      <p className="text-xs text-gray-500">Effective Date: March 1, 2026 &nbsp;·&nbsp; Last Updated: March 1, 2026</p>

      <Section title="1. What We Collect">
        <ul className="list-disc pl-4 space-y-1">
          <li><strong>Account information:</strong> name, email, phone, address</li>
          <li><strong>Payment information:</strong> processed securely through Stripe — HollaClean does not store card details</li>
          <li><strong>Location data:</strong> for service delivery and matching</li>
          <li><strong>Usage data:</strong> analytics, device info, log data</li>
          <li><strong>Communications:</strong> messages between users on the platform</li>
          <li><strong>User content:</strong> profile photos, reviews, and submitted documents</li>
        </ul>
      </Section>

      <Section title="2. How We Use Your Information">
        <ul className="list-disc pl-4 space-y-1">
          <li>To operate and improve the platform</li>
          <li>To process bookings and payments</li>
          <li>To communicate booking confirmations, receipts, and notifications</li>
          <li>To verify identity and prevent fraud</li>
          <li>To comply with legal obligations</li>
          <li>To send marketing communications (you may opt out at any time)</li>
        </ul>
      </Section>

      <Section title="3. How We Share Your Information">
        We share personal information only as necessary:
        <ul className="list-disc pl-4 mt-1 space-y-1">
          <li>With the other party in a booking (name, contact, service address)</li>
          <li>With Stripe for payment processing</li>
          <li>With service providers who help operate the platform</li>
          <li>As required by law or legal process</li>
          <li>With your consent for any other purpose</li>
        </ul>
        We do not sell your personal information to third parties.
      </Section>

      <Section title="4. PIPEDA Compliance">
        HollaClean complies with Canada's Personal Information Protection and Electronic Documents Act (PIPEDA). We collect personal information only for legitimate business purposes, obtain consent, and protect it with appropriate security measures.
      </Section>

      <Section title="5. Your Privacy Rights">
        You have the right to:
        <ul className="list-disc pl-4 mt-1 space-y-1">
          <li>Access your personal information</li>
          <li>Request corrections to inaccurate data</li>
          <li>Withdraw consent for certain uses</li>
          <li>Request deletion of your account and data (subject to legal retention requirements)</li>
          <li>Lodge a complaint with the Office of the Privacy Commissioner of Canada</li>
        </ul>
      </Section>

      <Section title="6. Data Security">
        We use industry-standard security measures including encryption in transit (HTTPS) and at rest, access controls, and regular security reviews. However, no system is completely secure — you use the platform at your own risk.
      </Section>

      <Section title="7. Data Retention">
        We retain your personal information for as long as your account is active or as needed to provide services, comply with legal obligations, resolve disputes, and enforce agreements. You may request deletion at any time.
      </Section>

      <Section title="8. Cookies">
        We use cookies and similar technologies to operate the platform, remember your preferences, and analyze usage. You can control cookies through your browser settings, though disabling them may affect platform functionality.
      </Section>

      <Section title="9. Children's Privacy">
        The platform is not intended for users under 18. We do not knowingly collect personal information from minors.
      </Section>

      <Section title="10. Changes to This Policy">
        We may update this Privacy Policy from time to time. We will notify you of material changes via email or a prominent notice on the platform. Continued use after the effective date constitutes acceptance.
      </Section>

      <Section title="11. Contact">
        For privacy-related inquiries:<br />
        <strong>Email:</strong> privacy@hollaclean.ca<br />
        <strong>Address:</strong> HollaClean, 1003-256 Caswell Drive, Sudbury, ON P3E 2N9, Canada
      </Section>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
      <div className="text-gray-600">{children}</div>
    </div>
  );
}
