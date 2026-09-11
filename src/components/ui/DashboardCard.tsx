import React, { ReactNode } from 'react';

interface DashboardCardProps {
  id?: string;
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  accentColor?: 'blue' | 'emerald' | 'amber' | 'purple' | 'rose';
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  id,
  title,
  value,
  subtitle,
  icon,
  trend,
  accentColor = 'blue',
}) => {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
  };

  return (
    <div
      id={id || `card-${title.toLowerCase().replace(/\s+/g, '-')}`}
      className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">{value}</h3>
        </div>
        <div className={`p-2.5 rounded-xl border ${colorMap[accentColor]}`}>
          {icon}
        </div>
      </div>
      {(subtitle || trend) && (
        <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 border-t border-slate-100 pt-3">
          {trend && (
            <span
              className={`font-semibold ${
                trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {trend.value}
            </span>
          )}
          {subtitle && <span>{subtitle}</span>}
        </div>
      )}
    </div>
  );
};
