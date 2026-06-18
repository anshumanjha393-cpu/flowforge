import { useState, useEffect, useRef } from "react";
import { api } from "../api/client";
import type { Notification } from "../types";
import { socket } from "../socket";

function formatTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(diff / 3600000);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(diff / 86400000);
  if (days === 1) return "Yesterday";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await api.get<{ notifications: Notification[]; unreadCount: number }>("/users/me/notifications");
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    async function fetchNotifications() {
      try {
        const res = await api.get<{ notifications: Notification[]; unreadCount: number }>("/users/me/notifications");
        if (active) {
          setNotifications(res.data.notifications);
          setUnreadCount(res.data.unreadCount);
        }
      } catch {
        // silent
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchNotifications();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const handleNewNotification = () => fetchNotifications();
    socket.on("notification", handleNewNotification);
    socket.on("tasksChanged", handleNewNotification);
    return () => {
      socket.off("notification", handleNewNotification);
      socket.off("tasksChanged", handleNewNotification);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllRead = async () => {
    try {
      await api.put("/users/me/notifications");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // silent
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "ASSIGNMENT":
        return (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/><path d="M4 20c0-3.3 2.7-6 6-6h4c3.3 0 6 2.7 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </div>
        );
      case "COMMENT":
        return (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2"/></svg>
          </div>
        );
      default:
        return (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </div>
        );
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#757684] transition-colors hover:bg-[#f1f5f9] hover:text-[#1a1b22] dark:text-[#a8aab8] dark:hover:bg-[#1a1c26] dark:hover:text-white"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#00288e] text-[8px] font-bold text-white dark:bg-[#b8c4ff] dark:text-[#001453]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-xl dark:border-[#2a2c38] dark:bg-[#15171f]">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] px-4 py-3 dark:border-[#2a2c38]">
              <h3 className="text-sm font-bold text-[#1a1b22] dark:text-white">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[10px] font-bold text-[#00288e] hover:underline dark:text-[#b8c4ff]"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="space-y-2 p-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-100 dark:bg-[#1a1c26]" />
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <svg viewBox="0 0 24 24" fill="none" className="mb-2 h-8 w-8 text-[#757684]">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <p className="text-xs text-[#757684] dark:text-[#a8aab8]">No notifications yet</p>
                </div>
              ) : (
                notifications.slice(0, 10).map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-3 border-b border-[#f1f5f9] px-4 py-3 transition-colors hover:bg-[#f8fafc] dark:border-[#2a2c38] dark:hover:bg-[#1a1c26] ${
                      !notification.read ? "bg-[#f0f2ff]/50 dark:bg-[#1e40af]/5" : ""
                    }`}
                  >
                    {getNotificationIcon(notification.type)}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#1a1b22] dark:text-white">
                        {notification.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[#757684] line-clamp-2 dark:text-[#a8aab8]">
                        {notification.message}
                      </p>
                      <p className="mt-1 text-[10px] text-[#757684]/70 dark:text-[#a8aab8]/60">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.read && (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#00288e] dark:bg-[#b8c4ff]" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
