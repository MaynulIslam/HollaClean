
import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, CheckCheck, Trash2, Clock, AlertCircle, CheckCircle, Info, Star } from 'lucide-react';
import { Notification, getNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification, clearAllNotifications } from '../utils/notifications';

interface Props {
  userId: string;
  onNotificationClick?: (notification: Notification) => void;
}

const NotificationCenter: React.FC<Props> = ({ userId, onNotificationClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    setLoading(true);
    const notifs = await getNotifications(userId);
    const count = await getUnreadCount(userId);
    setNotifications(notifs);
    setUnreadCount(count);
    setLoading(false);
  };

  useEffect(() => {
    loadNotifications();
    // Poll for new notifications
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(userId, notificationId);
    await loadNotifications();
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead(userId);
    await loadNotifications();
  };

  const handleDelete = async (notificationId: string) => {
    await deleteNotification(userId, notificationId);
    await loadNotifications();
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all notifications?')) {
      await clearAllNotifications(userId);
      await loadNotifications();
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await handleMarkAsRead(notification.id);
    }
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
    setIsOpen(false);
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
      case 'job_completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'job_accepted':
      case 'new_job':
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case 'review':
        return <Star className="w-5 h-5 text-yellow-500" />;
      default:
        return <Info className="w-5 h-5 text-purple-500" />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => { setIsOpen(!isOpen); if (isOpen) setShowAll(false); }}
        className="relative w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900">Notifications</h3>
              <p className="text-xs text-gray-500">{unreadCount} unread</p>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1"
                >
                  <CheckCheck className="w-3 h-3" />
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-xs text-gray-400 hover:text-red-500 font-semibold"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm">No notifications yet</p>
                <p className="text-gray-400 text-xs mt-1">We'll notify you when something happens</p>
              </div>
            ) : (
              (showAll ? notifications : notifications.slice(0, 5)).map(notification => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.read ? 'bg-purple-50/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm ${!notification.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-purple-600 rounded-full flex-shrink-0 mt-1.5"></span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notification.message}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(notification.createdAt)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(notification.id);
                          }}
                          className="text-xs text-gray-400 hover:text-red-500 ml-auto"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 5 && (
            <div className="p-3 border-t border-gray-100 text-center">
              <button
                onClick={() => setShowAll(!showAll)}
                className="text-xs text-purple-600 hover:text-purple-700 font-semibold"
              >
                {showAll ? 'Show less' : `View all notifications (${notifications.length})`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
