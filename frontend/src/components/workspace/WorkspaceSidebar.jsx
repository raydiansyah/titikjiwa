import { LogOut, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { getWorkspaceRoleLabel } from "@/components/workspace/navigation";
import { WorkspaceNavigation } from "@/components/workspace/WorkspaceNavigation";
import { NotificationPanel } from "@/components/workspace/NotificationPanel";

export function WorkspaceSidebar({
  user,
  aura,
  activeSection,
  unread,
  notifications,
  notificationsOpen,
  onSelectSection,
  onToggleNotifications,
  onLogout,
}) {
  return (
    <aside className="workspace-sidebar">
      <Logo />

      <div className="user-chip">
        <span
          className="user-avatar"
          style={aura ? { background: `conic-gradient(from 40deg, ${[...aura.colors, aura.colors[0]].join(", ")})`, color: "#fff" } : {}}
          title={aura ? `Aura: ${aura.name}` : undefined}
          data-testid="user-aura-avatar"
        >
          {user.alias.slice(0, 2).toUpperCase()}
        </span>
        <div>
          <strong data-testid="current-user-alias">{user.alias}</strong>
          <span>{getWorkspaceRoleLabel(user.role)}</span>
        </div>
      </div>

      <WorkspaceNavigation
        role={user.role}
        activeSection={activeSection}
        unread={unread}
        onSelect={onSelectSection}
      />

      <NotificationPanel
        open={notificationsOpen}
        unread={unread}
        notifications={notifications}
        onToggle={onToggleNotifications}
      />

      <div className="sidebar-safe">
        <ShieldCheck size={17} aria-hidden="true" />
        <span>Semua cerita komunitas ditulis anonim.</span>
      </div>

      <button type="button" className="logout-button" onClick={onLogout} data-testid="logout-button">
        <LogOut size={16} aria-hidden="true" /> Keluar
      </button>
    </aside>
  );
}
