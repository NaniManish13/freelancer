import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  fullHeight?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  label = 'Loading data...',
  size = 'md',
  fullHeight = false,
}) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
  };

  return (
    <div
      id="loading-spinner-container"
      className={`flex flex-col items-center justify-center gap-3 ${
        fullHeight ? 'min-h-[300px] h-full w-full' : 'py-8'
      }`}
    >
      <Loader2 className={`${sizeMap[size]} animate-spin text-blue-600`} />
      {label && <p className="text-sm font-medium text-slate-500">{label}</p>}
    </div>
  );
};
