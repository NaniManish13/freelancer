import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CheckSquare,
  Clock,
  FileSpreadsheet,
  FileText,
  Settings,
  Sparkles,
  Zap,
  Layers,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  onClose?: () => void;
  onOpenUpgrade?: () => void;
  onLoadSampleData?: () => void;
  isLoadingSample?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onClose,
  onOpenUpgrade,
  onLoadSampleData,
  isLoadingSample,
}) => {
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Clients', path: '/clients', icon: Users },
    { name: 'Projects', path: '/projects', icon: FolderKanban },
    { name: 'Tasks', path: '/tasks', icon: CheckSquare },
    { name: 'Live Stopwatch', path: '/time-tracking', icon: Clock },
    { name: 'Time Logs', path: '/time-logs', icon: FileSpreadsheet },
    { name: 'Invoices', path: '/invoices', icon: FileText },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 h-full bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-base text-white tracking-tight flex items-center gap-1.5">
              Freelance<span className="text-blue-400">Flow</span>
            </div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              SaaS Suite
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Management
        </div>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`
            }
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Plan Card & Quick Tools */}
      <div className="p-3 border-t border-slate-800 space-y-3">
        {/* Sample Data Quick Loader */}
        {onLoadSampleData && (
          <button
            id="btn-sidebar-sample-data"
            onClick={onLoadSampleData}
            disabled={isLoadingSample}
            className="w-full px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            {isLoadingSample ? 'Populating...' : 'Load Sample Data'}
          </button>
        )}

        {/* Plan status card */}
        <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Plan</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                user?.plan === 'PRO'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                  : 'bg-slate-700 text-slate-300'
              }`}
            >
              {user?.plan || 'FREE'}
            </span>
          </div>

          <p className="text-[11px] text-slate-400 leading-snug mb-2">
            {user?.plan === 'PRO'
              ? 'Unlimited clients & PDF invoice exports unlocked.'
              : 'Free plan: Max 2 clients. Upgrade for unlimited & PDF exports.'}
          </p>

          {onOpenUpgrade && (
            <button
              id="btn-sidebar-upgrade"
              onClick={onOpenUpgrade}
              className="w-full py-1.5 text-xs font-bold bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 rounded-lg transition-all flex items-center justify-center gap-1"
            >
              <Zap className="w-3.5 h-3.5" />
              {user?.plan === 'PRO' ? 'Manage Plan' : 'Upgrade to PRO'}
            </button>
          )}
        </div>

        {/* User profile & Logout */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-7 h-7 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-xs uppercase shrink-0">
              {user?.name ? user.name[0] : 'U'}
            </div>
            <div className="overflow-hidden text-left">
              <div className="text-xs font-semibold text-white truncate">{user?.name}</div>
              <div className="text-[10px] text-slate-400 truncate">{user?.email}</div>
            </div>
          </div>
          <button
            id="btn-sidebar-logout"
            onClick={logout}
            title="Log Out"
            className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
