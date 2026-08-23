import { getWorkspaceNavigation } from "@/components/workspace/navigation";

export function WorkspaceNavigation({ role, activeSection, unread = 0, onSelect }) {
  const items = getWorkspaceNavigation(role);

  return (
    <nav className="workspace-nav" data-testid="workspace-navigation" aria-label="Navigasi ruang titikjiwa">
      {items.map(({ id, label, icon: Icon }) => (
        <button
          type="button"
          key={id}
          className={activeSection === id ? "active" : ""}
          onClick={() => onSelect(id)}
          aria-current={activeSection === id ? "page" : undefined}
          data-testid={`workspace-nav-${id}-button`}
        >
          <Icon size={17} aria-hidden="true" />
          <span>{label}</span>
          {id === "komunitas" && unread > 0 && (
            <span className="nav-dot" aria-label={`${unread} notifikasi belum dibaca`} data-testid="nav-notif-dot" />
          )}
        </button>
      ))}
    </nav>
  );
}
