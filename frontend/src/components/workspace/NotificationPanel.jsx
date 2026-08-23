import { Bell } from "lucide-react";

export function NotificationPanel({ open, unread = 0, notifications = [], onToggle }) {
  return (
    <div className="notif-wrap">
      <button
        type="button"
        className="logout-button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls="workspace-notification-panel"
        data-testid="notif-bell-button"
      >
        <Bell size={16} aria-hidden="true" />
        Notifikasi
        {unread > 0 && <span className="notif-dot" data-testid="notif-count">{unread}</span>}
      </button>

      {open && (
        <div id="workspace-notification-panel" className="notif-panel" data-testid="notif-panel">
          {notifications.length === 0 ? (
            <span className="notif-empty">Belum ada kabar baru. Ceritamu aman di sini.</span>
          ) : (
            notifications.map((notification) => (
              <div className={`notif-item ${notification.read ? "" : "unread"}`} key={notification.id}>
                <span>{notification.text}</span>
                <time dateTime={notification.created_at}>
                  {new Date(notification.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                </time>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
