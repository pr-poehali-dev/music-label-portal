import React from 'react';
import Icon from '@/components/ui/icon';

interface OnlineStatusBadgeProps {
  isOnline: boolean;
  lastSeen?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const OnlineStatusBadge = React.memo(function OnlineStatusBadge({ 
  isOnline, 
  lastSeen, 
  showLabel = false,
  size = 'md'
}: OnlineStatusBadgeProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const dotSize = sizeClasses[size];

  if (showLabel) {
    return (
      <div className="flex items-center gap-2">
        <div className="relative">
          <div className={`${dotSize} rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
          {isOnline && (
            <div className={`absolute inset-0 ${dotSize} rounded-full bg-green-500 animate-ping opacity-75`} />
          )}
        </div>
        <span className={`text-sm ${isOnline ? 'text-green-400 font-medium' : 'text-gray-400'}`}>
          {isOnline ? 'Онлайн' : lastSeen || 'Оффлайн'}
        </span>
      </div>
    );
  }

  return (
    <div className="relative inline-block" title={isOnline ? 'Онлайн' : lastSeen || 'Оффлайн'}>
      <div className={`${dotSize} rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-500'}`} />
      {isOnline && (
        <div className={`absolute inset-0 ${dotSize} rounded-full bg-green-500 animate-ping opacity-75`} />
      )}
    </div>
  );
});

export default OnlineStatusBadge;
