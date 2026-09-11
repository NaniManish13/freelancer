import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const normalized = (status || '').toUpperCase();

  let styles = 'bg-slate-100 text-slate-700 border-slate-200';
  let label = status;

  switch (normalized) {
    // Project & Client Statuses
    case 'ACTIVE':
      styles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      label = 'Active';
      break;
    case 'COMPLETED':
      styles = 'bg-blue-50 text-blue-700 border-blue-200';
      label = 'Completed';
      break;
    case 'PAUSED':
      styles = 'bg-amber-50 text-amber-700 border-amber-200';
      label = 'Paused';
      break;

    // Task Statuses
    case 'TODO':
      styles = 'bg-slate-100 text-slate-700 border-slate-200';
      label = 'To Do';
      break;
    case 'IN_PROGRESS':
      styles = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      label = 'In Progress';
      break;
    case 'DONE':
      styles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      label = 'Done';
      break;

    // Priorities
    case 'HIGH':
      styles = 'bg-rose-50 text-rose-700 border-rose-200';
      label = 'High Priority';
      break;
    case 'MEDIUM':
      styles = 'bg-amber-50 text-amber-700 border-amber-200';
      label = 'Medium';
      break;
    case 'LOW':
      styles = 'bg-slate-100 text-slate-600 border-slate-200';
      label = 'Low';
      break;

    // Invoice Statuses
    case 'PAID':
      styles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      label = 'Paid';
      break;
    case 'SENT':
      styles = 'bg-sky-50 text-sky-700 border-sky-200';
      label = 'Sent / Pending';
      break;
    case 'OVERDUE':
      styles = 'bg-rose-50 text-rose-700 border-rose-200';
      label = 'Overdue';
      break;
    case 'DRAFT':
      styles = 'bg-slate-100 text-slate-600 border-slate-200';
      label = 'Draft';
      break;
    case 'CANCELLED':
      styles = 'bg-slate-100 text-slate-400 border-slate-200 line-through';
      label = 'Cancelled';
      break;

    // Over budget tag
    case 'OVER_BUDGET':
    case 'OVER BUDGET':
      styles = 'bg-rose-600 text-white border-rose-700 font-bold animate-pulse';
      label = 'OVER BUDGET';
      break;

    // Plan badges
    case 'PRO':
      styles = 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-transparent font-bold';
      label = 'PRO';
      break;
    case 'FREE':
      styles = 'bg-slate-100 text-slate-700 border-slate-300 font-semibold';
      label = 'FREE PLAN';
      break;
  }

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      id={`badge-${normalized.toLowerCase().replace(/\s+/g, '-')}`}
      className={`inline-flex items-center rounded-full border font-medium whitespace-nowrap leading-none ${sizeClass} ${styles}`}
    >
      {label}
    </span>
  );
};
