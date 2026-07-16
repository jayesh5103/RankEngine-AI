import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import type { ReactNode } from 'react';

import api from '../lib/api';
import { useAuth } from './AuthContext';

interface INotification {
  _id: string;
  message: string;
  read: boolean;
  createdAt: string;
  keywordId: string;
  projectId: string;
}

interface NotificationContextValue {
  notifications: INotification[];
  unreadCount: number;
  markRead: (id: string) => Promise<void>;
  refresh: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      const { data } = await api.get<{
        notifications: INotification[];
        unreadCount: number;
      }>('/notifications');
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // Silently ignore network errors
    }
  }, [token]);

  const markRead = useCallback(async (id: string) => {
    await api.patch(`/notifications/${id}/read`);
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  // Poll every 60 seconds while the user is logged in
  useEffect(() => {
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    refresh();
    const interval = setInterval(refresh, 60_000);
    return () => clearInterval(interval);
  }, [token, refresh]);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, markRead, refresh }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error('useNotifications must be used inside <NotificationProvider>');
  return ctx;
}
