import React, { useEffect } from 'react';
// FIX: Replaced path alias with a relative path to fix module resolution errors.
import type { NotificationType } from '../types';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface NotificationProps {
  message: string;
  type: NotificationType;
  onClose: () => void;
}

export default function Notification({ message, type, onClose }: NotificationProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  const Icon = type === 'success' ? CheckCircle : XCircle;

  return (
    <div className={`fixed bottom-5 right-5 w-full max-w-sm rounded-lg shadow-lg text-white ${bgColor}`}>
      <div className="flex items-center p-4">
        <Icon className="w-6 h-6 mr-3" />
        <p className="flex-1">{message}</p>
        <button onClick={onClose} className="ml-4 p-1 rounded-full hover:bg-white/20 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
