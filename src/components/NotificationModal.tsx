import React from 'react';
import { PlantNotification } from '../types';
import { X, Bell, AlertTriangle, Droplets, Sparkles, Check, Trash2 } from 'lucide-react';

interface NotificationModalProps {
  notifications: PlantNotification[];
  onMarkAllRead: () => void;
  onClearAll: () => void;
  onClose: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  notifications,
  onMarkAllRead,
  onClearAll,
  onClose,
}) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-[#ba1a1a]" />;
      case 'care':
        return <Droplets className="w-5 h-5 text-[#4c6635]" />;
      case 'system':
      default:
        return <Sparkles className="w-5 h-5 text-[#4c6635]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 animate-fade-in text-[#191c1b]">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 md:p-8 flex flex-col max-h-[90vh] overflow-hidden border border-[#cdecae]/60">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-[#e1e3e0]">
          <div>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#4c6635]" />
              <h2 className="text-xl font-bold text-[#191c1b]">Notifications</h2>
            </div>
            <p className="text-xs text-[#44483e] mt-0.5">
              Botanical alerts and diagnostics summary
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#f2f4f1] text-[#74796d] flex items-center justify-center hover:bg-[#e7e9e6] active:scale-95 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Actions Bar */}
        <div className="flex justify-between items-center py-2 px-1 text-xs text-[#4c6635] font-semibold">
          <button
            onClick={onMarkAllRead}
            className="hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Mark all as read</span>
          </button>
          <button
            onClick={onClearAll}
            className="text-[#ba1a1a] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear all</span>
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto py-2 space-y-3 pr-1 hide-scrollbar">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-[#74796d] space-y-2">
              <Bell className="w-10 h-10 mx-auto text-[#c4c8ba]" />
              <p className="text-sm font-semibold">All caught up!</p>
              <p className="text-xs">No pending botanical alerts at this time.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                  notif.read
                    ? 'bg-[#f8faf7] border-[#e1e3e0]'
                    : 'bg-white border-[#8ba870]/60 shadow-xs ring-1 ring-[#8ba870]/20'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    notif.type === 'warning' ? 'bg-[#ffdad6]' : 'bg-[#cdecae]/60'
                  }`}
                >
                  {getIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-[#191c1b] truncate">{notif.title}</h4>
                    <span className="text-[10px] text-[#74796d] shrink-0 ml-2">{notif.time}</span>
                  </div>
                  <p className="text-xs text-[#44483e] mt-1 leading-relaxed">{notif.message}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#e1e3e0]">
          <button
            onClick={onClose}
            className="w-full bg-[#4c6635] hover:bg-[#354e1f] text-white py-3.5 rounded-xl text-sm font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
