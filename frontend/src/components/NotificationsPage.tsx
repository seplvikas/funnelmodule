import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle, Trash2 } from 'lucide-react';
import { notificationsApi } from '../services/api';
import { formatISTDate, formatISTTime } from '../utils/dateTime';

interface Notification {
  id: number;
  item_id: number;
  type: 'task' | 'product';
  item_title: string;
  description?: string;
  vendor?: string;
  due_at?: string;
  expiry_date?: string;
  purchase_date?: string;
  status?: string;
  is_read: boolean;
  created_at: string;
  created_by_name: string;
  created_by_email: string;
}

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationsApi.getAll();
      setNotifications(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark as read
      if (!notification.is_read) {
        await notificationsApi.markAsRead(notification.id, notification.type);
      }

      // Navigate to task or product
      if (notification.type === 'task') {
        navigate(`/tasks/${notification.item_id}`);
      } else {
        navigate(`/products/${notification.item_id}`);
      }
    } catch (err) {
      console.error('Error handling notification click:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      fetchNotifications();
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleDeleteNotification = async (e: React.MouseEvent, notification: Notification) => {
    e.stopPropagation(); // Prevent navigation when clicking delete
    
    if (!window.confirm('Are you sure you want to delete this notification?')) {
      return;
    }

    try {
      await notificationsApi.deleteNotification(notification.id, notification.type);
      // Remove from local state immediately
      setNotifications(notifications.filter(n => 
        !(n.id === notification.id && n.type === notification.type)
      ));
    } catch (err) {
      console.error('Error deleting notification:', err);
      setError('Failed to delete notification');
    }
  };

  const formatDate = (dateString: string) => {
    return formatISTDate(dateString);
  };

  const formatTime = (dateString: string) => {
    return formatISTTime(dateString);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-600">Loading notifications...</div>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-800">Notifications</h1>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white rounded-full px-3 py-1 text-sm font-semibold">
              {unreadCount} unread
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <CheckCircle className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-12 text-center">
          <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={`${notification.type}-${notification.id}`}
              onClick={() => handleNotificationClick(notification)}
              className={`p-4 border rounded-lg cursor-pointer transition ${
                notification.is_read
                  ? 'bg-white border-gray-200 hover:bg-gray-50'
                  : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                      notification.type === 'task'
                        ? 'bg-blue-200 text-blue-800'
                        : 'bg-green-200 text-green-800'
                    }`}>
                      {notification.type === 'task' ? 'Task' : 'Product'}
                    </span>
                    {!notification.is_read && (
                      <span className="inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mt-2">
                    {notification.item_title}
                  </h3>
                  {notification.description && (
                    <p className="text-gray-600 text-sm mt-1">
                      {notification.description.substring(0, 100)}
                      {notification.description.length > 100 ? '...' : ''}
                    </p>
                  )}
                  {notification.vendor && (
                    <p className="text-gray-600 text-sm mt-1">
                      Vendor: <span className="font-medium">{notification.vendor}</span>
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    {notification.due_at && (
                      <span>Due: {formatDate(notification.due_at)} at {formatTime(notification.due_at)}</span>
                    )}
                    {notification.expiry_date && (
                      <span>Expires: {formatDate(notification.expiry_date)}</span>
                    )}
                    <span>From: {notification.created_by_name}</span>
                    <span>{formatDate(notification.created_at)}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => handleDeleteNotification(e, notification)}
                  className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition flex-shrink-0"
                  title="Delete notification"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
