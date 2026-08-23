import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/components/auth/AuthProvider";
import { WorkspaceSidebar } from "@/components/workspace/WorkspaceSidebar";
import { WorkspaceMobileHeader } from "@/components/workspace/WorkspaceMobileHeader";
import { getWorkspaceNavigation } from "@/components/workspace/navigation";

export function WorkspaceShell({ children, emergency, backToTop }) {
  const { loading, user, logout } = useAuth();
  const navigate = useNavigate();
  const [section, setSection] = useState("beranda");
  const [showNotifications, setShowNotifications] = useState(false);

  const { data: aura } = useQuery({
    queryKey: ["aura"],
    queryFn: () => api.get("/me/aura").then((response) => response.data),
    staleTime: 60_000,
    enabled: Boolean(user),
  });

  const {
    data: notifications = [],
    refetch: refetchNotifications,
  } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.get("/notifications").then((response) => response.data),
    refetchInterval: 30_000,
    enabled: Boolean(user),
  });

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/masuk" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    const allowedSections = new Set(getWorkspaceNavigation(user.role).map((item) => item.id));
    if (!allowedSections.has(section)) setSection("beranda");
  }, [section, user]);

  if (loading || !user) {
    return <div className="loading-screen" data-testid="workspace-loading">Menyiapkan ruangmu…</div>;
  }

  const handleSectionChange = (nextSection) => {
    const allowedSections = new Set(getWorkspaceNavigation(user.role).map((item) => item.id));
    setSection(allowedSections.has(nextSection) ? nextSection : "beranda");
    setShowNotifications(false);
  };

  const handleToggleNotifications = async () => {
    const next = !showNotifications;
    setShowNotifications(next);

    if (next && unreadCount > 0) {
      await api.post("/notifications/read").catch(() => {});
      refetchNotifications();
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/" });
  };

  return (
    <div className="workspace">
      <WorkspaceSidebar
        user={user}
        aura={aura}
        activeSection={section}
        unread={unreadCount}
        notifications={notifications}
        notificationsOpen={showNotifications}
        onSelectSection={handleSectionChange}
        onToggleNotifications={handleToggleNotifications}
        onLogout={handleLogout}
      />

      <main className="workspace-main">
        <WorkspaceMobileHeader onLogout={handleLogout} />
        {typeof children === "function" ? children({ section, user }) : children}
      </main>

      {emergency}
      {backToTop}
    </div>
  );
}
