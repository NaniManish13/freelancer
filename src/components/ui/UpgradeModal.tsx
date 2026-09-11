import React from 'react';
import { Modal } from './Modal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Check, Sparkles, Zap, Shield, FileText, Users } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerReason?: string;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  triggerReason,
}) => {
  const { user, togglePlan } = useAuth();
  const { success } = useToast();

  const isPro = user?.plan === 'PRO';

  const handleToggle = async () => {
    await togglePlan();
    if (!isPro) {
      success('Congratulations! Your account has been upgraded to PRO tier!');
    } else {
      success('Your account is now on the FREE tier.');
    }
    onClose();
  };

  return (
    <Modal
      id="upgrade-modal"
      isOpen={isOpen}
      onClose={onClose}
      title={isPro ? 'Manage FreelanceFlow Plan' : 'Upgrade to FreelanceFlow PRO'}
      maxWidth="md"
    >
      <div className="flex flex-col gap-5">
        {triggerReason && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium">
            {triggerReason}
          </div>
        )}

        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> PRO Freelancer Plan
            </span>
            <span className="text-2xl font-black">$19<span className="text-sm font-normal text-blue-100">/month</span></span>
          </div>
          <p className="text-sm text-blue-100 mb-4">
            Unlock unlimited clients, professional Puppeteer PDF invoices, automated burn-rate tracking, and advanced financial analytics.
          </p>

          <div className="space-y-2.5 text-xs text-white/90">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-300 shrink-0" />
              <span><strong>Unlimited Clients</strong> (Free tier is capped at 2)</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-300 shrink-0" />
              <span><strong>Puppeteer PDF Invoices</strong> with custom branding & download</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-300 shrink-0" />
              <span><strong>Persistent Stopwatch & Time Logs</strong> with automatic billing</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-300 shrink-0" />
              <span><strong>Multi-Project Burn Rate & Budget Alerts</strong></span>
            </div>
          </div>
        </div>

        {/* Free vs Pro Comparison */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="font-bold text-slate-700 mb-1">Free Plan</div>
            <ul className="space-y-1 text-slate-500">
              <li>• Max 2 Clients</li>
              <li>• HTML Invoice Print Only</li>
              <li>• Basic Time Tracking</li>
            </ul>
          </div>
          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200">
            <div className="font-bold text-blue-900 mb-1">PRO Plan</div>
            <ul className="space-y-1 text-blue-700 font-medium">
              <li>• Unlimited Clients</li>
              <li>• High-Res PDF Generation</li>
              <li>• Priority Analytics & Export</li>
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <button
            id="btn-close-upgrade"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            id="btn-confirm-upgrade-toggle"
            onClick={handleToggle}
            className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <Zap className="w-4 h-4 fill-current" />
            {isPro ? 'Switch to Free Plan (for Testing)' : 'Upgrade to PRO Now'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
