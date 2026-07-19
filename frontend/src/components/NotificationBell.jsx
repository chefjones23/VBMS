import { useEffect, useRef, useState } from 'react';
import { api, connectNotificationSocket } from '../api/client';
import { IconBell } from './Icon';

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr.replace(' ', 'T') + 'Z').getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const wrapRef = useRef(null);

  const load = async () => {
    try {
      const data = await api.myNotifications();
      setNotifications(data.notifications);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    load();
    const ws = connectNotificationSocket(() => load());
    const handleClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => {
      ws?.close();
      document.removeEventListener('mousedown', handleClick);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleOpen = async () => {
    setOpen(o => !o);
  };

  const markAll = async () => {
    await api.markAllNotificationsRead();
    load();
  };

  return (
    <div className="bell-wrap" ref={wrapRef}>
      <button className="bell-btn" onClick={handleOpen} aria-label="Notifications">
        <IconBell />
        {unreadCount > 0 && <span className="bell-dot" />}
      </button>
      {open && (
        <div className="notif-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid var(--line)' }}>
            <strong style={{ fontSize: 13.5 }}>Notifications</strong>
            {unreadCount > 0 && (
              <button className="btn btn-ghost btn-sm" onClick={markAll}>Mark all read</button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 14px' }}>
              <p style={{ margin: 0 }}>No notifications yet.</p>
            </div>
          ) : (
            notifications.map(n => (
              <div key={n.id} className={`notif-item ${n.is_read ? '' : 'unread'}`}>
                {n.message}
                <div className="notif-time">{timeAgo(n.created_at)}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
