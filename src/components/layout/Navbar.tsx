import React from 'react';
import { Menu, Sparkles, Zap, Plus, Layers } from 'lucide-react';
import { TimerWidget } from '../timer/TimerWidget';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

interface NavbarProps {
  onOpenMobileMenu: () => void;
  onOpenUpgrade: () => void;
  onLoadSampleData: () => void;
  isLoadingSample: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenMobileMenu,
  onOpenUpgrade,
  onLoadSampleData,
  isLoadingSample,
}) => {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      {/* Left: Mobile Menu Trigger & Page Title */}
      <div className="flex items-center gap-3">
        <button
          id="btn-mobile-menu"
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="md:hidden flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-xs">
            FF
          </div>
          <span className="font-extrabold text-slate-900 text-sm">FreelanceFlow</span>
        </div>
      </div>

      {/* Center: Live Stopwatch Pill */}
      <div className="flex items-center">
        <TimerWidget mode="bar" />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Sample data button */}
        <button
          id="btn-navbar-sample-data"
          onClick={onLoadSampleData}
          disabled={isLoadingSample}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>{isLoadingSample ? 'Loading...' : 'Sample Data'}</span>
        </button>

        {/* Create Invoice Quick Button */}
        <Link
          id="btn-quick-create-invoice"
          to="/invoices/create"
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Invoice</span>
        </Link>

        {/* Pro Plan Tag */}
        <button
          id="btn-navbar-plan"
          onClick={onOpenUpgrade}
          className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase transition-transform hover:scale-105 ${
            user?.plan === 'PRO'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
              : 'bg-amber-100 text-amber-900 border border-amber-300'
          }`}
        >
          {user?.plan === 'PRO' ? 'PRO' : 'FREE'}
        </button>
      </div>
    </header>
  );
};
