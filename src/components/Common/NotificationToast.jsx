import React from 'react';
import { useSocket } from '../../context/SocketContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function NotificationToast() {
  const { toasts } = useSocket();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        let borderClass = 'border-indigo-500/30 text-indigo-200';
        let bgClass = 'bg-dark-850/95';
        let Icon = Info;

        if (toast.type === 'success') {
          borderClass = 'border-emerald-500/40 text-emerald-200';
          Icon = CheckCircle2;
        } else if (toast.type === 'error') {
          borderClass = 'border-rose-500/40 text-rose-200';
          Icon = AlertCircle;
        } else if (toast.type === 'warning') {
          borderClass = 'border-amber-500/40 text-amber-200';
          Icon = AlertCircle;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md border ${borderClass} ${bgClass} transition-all duration-300 transform translate-y-0`}
          >
            <Icon className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium text-slate-100 flex-1">{toast.message}</p>
          </div>
        );
      })}
    </div>
  );
}

