import React from 'react';
import { AlertTriangle, Clock, DollarSign } from 'lucide-react';
import { ProjectCalculations } from '../../types';

interface ProjectProgressBarProps {
  calculations?: ProjectCalculations;
  budget: number;
  currency?: string;
  showDetails?: boolean;
}

export const ProjectProgressBar: React.FC<ProjectProgressBarProps> = ({
  calculations,
  budget,
  currency = 'USD',
  showDetails = true,
}) => {
  if (!calculations) return null;

  const { totalHours, amountSpent, remainingBudget, budgetUsagePercent, isOverBudget } = calculations;

  // Clamped percentage for bar width
  const visualPercent = Math.min(100, Math.max(0, budgetUsagePercent));

  let barColor = 'bg-blue-600';
  if (budgetUsagePercent >= 100) {
    barColor = 'bg-rose-600';
  } else if (budgetUsagePercent >= 80) {
    barColor = 'bg-amber-500';
  } else if (budgetUsagePercent >= 50) {
    barColor = 'bg-indigo-600';
  }

  const currSymbol = currency === 'USD' ? '$' : currency;

  return (
    <div className="w-full space-y-2">
      {/* Progress Bar & Badges */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-medium text-slate-700">
          <span>Budget Usage:</span>
          <span className={`font-bold ${isOverBudget ? 'text-rose-600' : 'text-slate-900'}`}>
            {budgetUsagePercent}%
          </span>
        </div>

        {isOverBudget ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold bg-rose-600 text-white rounded-full animate-pulse">
            <AlertTriangle className="w-3 h-3" /> OVER BUDGET
          </span>
        ) : (
          <span className="text-xs text-slate-500">
            {remainingBudget >= 0 ? `${currSymbol}${remainingBudget.toLocaleString()} left` : 'No budget set'}
          </span>
        )}
      </div>

      {/* Progress Bar Track */}
      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60 p-0.5">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${budget > 0 ? visualPercent : 0}%` }}
        />
      </div>

      {/* Detailed metrics grid */}
      {showDetails && (
        <div className="grid grid-cols-3 gap-2 pt-2 text-xs border-t border-slate-100">
          <div className="flex flex-col">
            <span className="text-slate-400">Total Hours</span>
            <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3 text-slate-400" />
              {totalHours} hrs
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-400">Spent / Budget</span>
            <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
              <DollarSign className="w-3 h-3 text-slate-400" />
              {currSymbol}{amountSpent.toLocaleString()} / {budget > 0 ? `${currSymbol}${budget.toLocaleString()}` : '—'}
            </span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-slate-400">Remaining</span>
            <span className={`font-semibold mt-0.5 ${remainingBudget < 0 ? 'text-rose-600 font-bold' : 'text-emerald-700'}`}>
              {currSymbol}{remainingBudget.toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
