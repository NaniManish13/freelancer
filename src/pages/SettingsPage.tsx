import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { sampleDataService } from '../services/sampleDataService';
import { authService } from '../services/authService';
import { UpgradeModal } from '../components/ui/UpgradeModal';
import {
  User,
  Settings,
  Shield,
  Sparkles,
  Database,
  CheckCircle2,
  Trash2,
  Building2,
  DollarSign,
  Zap,
  Mail,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, updateUser, refreshProfile } = useAuth();
  const { success, error } = useToast();

  const [name, setName] = useState<string>(user?.name || '');
  const [email, setEmail] = useState<string>(user?.email || '');
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);

  // Sample Data Loading States
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [isClearing, setIsClearing] = useState<boolean>(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState<boolean>(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const updated = await authService.updateProfile({ name });
      updateUser(updated);
      success('Profile details updated successfully');
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePopulateSampleData = async () => {
    setIsSeeding(true);
    try {
      const res = await sampleDataService.seedSampleData();
      success(res.message || 'Realistic sample data loaded!');
      window.dispatchEvent(new CustomEvent('freelanceflow:data-updated'));
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to populate sample data');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleClearData = async () => {
    if (!window.confirm('Are you sure you want to delete all your clients, projects, tasks, time logs, and invoices? This action cannot be undone.')) {
      return;
    }

    setIsClearing(true);
    try {
      const res = await sampleDataService.clearSampleData();
      success(res.message || 'All user data cleared');
      window.dispatchEvent(new CustomEvent('freelanceflow:data-updated'));
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to clear data');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Settings & Account</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage your freelancer profile, subscription tier, and sandbox demo data.
        </p>
      </div>

      {/* Plan & Subscription Card */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-white/20 uppercase tracking-wider backdrop-blur-xs">
            <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
            {user?.plan === 'PRO' ? 'FreelanceFlow Pro Member' : 'Free Starter Plan'}
          </div>
          <h3 className="text-xl font-black">
            {user?.plan === 'PRO' ? 'Unlimited High-Volume Freelancing' : 'Unlock Unlimited Clients & PDF Invoices'}
          </h3>
          <p className="text-xs text-blue-100 max-w-xl">
            {user?.plan === 'PRO'
              ? 'You have full access to unlimited client profiles, real-time stopwatch budgets, and Puppeteer PDF exports.'
              : 'Free plans include up to 2 active clients. Upgrade to Pro for unlimited clients, PDF generation, and priority features.'}
          </p>
        </div>

        {user?.plan !== 'PRO' ? (
          <button
            id="btn-settings-upgrade"
            onClick={() => setIsUpgradeModalOpen(true)}
            className="px-5 py-2.5 bg-white hover:bg-blue-50 text-blue-700 text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors shrink-0"
          >
            Upgrade to Pro ($19/mo)
          </button>
        ) : (
          <div className="px-4 py-2 bg-emerald-500/20 border border-emerald-300/30 rounded-xl text-xs font-bold text-emerald-200">
            Active Pro Subscription
          </div>
        )}
      </div>

      {/* Profile Settings */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <User className="w-4 h-4 text-blue-600" /> Profile Information
        </h3>

        <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <input
              id="input-settings-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              disabled
              value={email}
              className="w-full px-3.5 py-2 text-sm bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Contact support to change your account email address.
            </span>
          </div>

          <button
            id="btn-save-profile"
            type="submit"
            disabled={isSavingProfile}
            className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            {isSavingProfile ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>

      {/* Demo & Sample Data Management */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Database className="w-4 h-4 text-indigo-600" /> Demo & Sample Data
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Instantly populate realistic clients (Acme Corp, Nova Brands), projects, milestones, time logs, and invoices to test out FreelanceFlow's dashboard analytics and burn rates.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            id="btn-seed-sample-data"
            onClick={handlePopulateSampleData}
            disabled={isSeeding}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {isSeeding ? 'Populating data...' : 'Populate Realistic Sample Data'}
          </button>

          <button
            id="btn-clear-all-data"
            onClick={handleClearData}
            disabled={isClearing}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            {isClearing ? 'Clearing...' : 'Clear All My Data'}
          </button>
        </div>
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />
    </div>
  );
};
