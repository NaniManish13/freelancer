import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
}) => {
  return (
    <div
      id="error-message-box"
      className="rounded-2xl border border-rose-200 bg-rose-50/70 p-6 text-rose-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-sm">{title}</h4>
          <p className="text-sm text-rose-800 mt-0.5">{message}</p>
        </div>
      </div>
      {onRetry && (
        <button
          id="btn-error-retry"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      )}
    </div>
  );
};
