import { useMemo } from 'react';

export default function RateLimitIndicator({
  remainingAttempts,
  maxAttempts,
  resetTime,
  message,
  isAllowed,
  showWhenAllowed = true,
  compact = false
}) {
  const percentage = useMemo(() => {
    if (!maxAttempts || maxAttempts === Infinity) return 100;
    return (remainingAttempts / maxAttempts) * 100;
  }, [remainingAttempts, maxAttempts]);
  
  const status = useMemo(() => {
    if (!isAllowed) return 'blocked';
    if (percentage <= 30) return 'warning';
    if (percentage <= 50) return 'caution';
    return 'normal';
  }, [isAllowed, percentage]);
  
  const statusStyles = {
    blocked: {
      container: 'bg-red-50 border-red-200',
      bar: 'bg-red-500',
      text: 'text-red-700',
      icon: '🚫'
    },
    warning: {
      container: 'bg-amber-50 border-amber-200',
      bar: 'bg-amber-500',
      text: 'text-amber-700',
      icon: '⚠️'
    },
    caution: {
      container: 'bg-yellow-50 border-yellow-200',
      bar: 'bg-yellow-500',
      text: 'text-yellow-700',
      icon: '⚡'
    },
    normal: {
      container: 'bg-green-50 border-green-200',
      bar: 'bg-green-500',
      text: 'text-green-700',
      icon: '✓'
    }
  };
  
  const style = statusStyles[status];
  
  if (!showWhenAllowed && isAllowed && percentage > 50) {
    return null;
  }
  
  if (compact) {
    return (
      <div className={`flex items-center gap-1.5 text-xs ${style.text}`}>
        <span>{style.icon}</span>
        <span>{remainingAttempts}/{maxAttempts}</span>
        {resetTime > 0 && (
          <span className="opacity-75">
            (resets in {formatTime(resetTime)})
          </span>
        )}
      </div>
    );
  }
  
  return (
    <div className={`rounded-lg border p-3 ${style.container}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm">{style.icon}</span>
          <span className={`text-sm font-medium ${style.text}`}>
            {isAllowed 
              ? `${remainingAttempts} attempts remaining` 
              : 'Rate limit reached'}
          </span>
        </div>
        {resetTime > 0 && (
          <span className={`text-xs ${style.text} opacity-75`}>
            Resets in {formatTime(resetTime)}
          </span>
        )}
      </div>
      
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-300 ${style.bar}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {message && (
        <p className={`mt-2 text-xs ${style.text}`}>
          {message}
        </p>
      )}
      
      {!isAllowed && (
        <p className="mt-2 text-xs text-gray-600 italic">
          This is a client-side limit. For abuse prevention, server-side rate limiting 
          is recommended.
        </p>
      )}
    </div>
  );
}

function formatTime(ms) {
  if (ms <= 0) return 'now';
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 
      ? `${hours}h ${remainingMinutes}m` 
      : `${hours}h`;
  }
  
  if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 
      ? `${minutes}m ${remainingSeconds}s` 
      : `${minutes}m`;
  }
  
  return `${seconds}s`;
}
