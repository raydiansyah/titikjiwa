import { LogOut } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

export function WorkspaceMobileHeader({ onLogout }) {
  return (
    <div className="workspace-mobile-head">
      <Logo />
      <button type="button" className="icon-button" onClick={onLogout} aria-label="Keluar dari titikjiwa" data-testid="mobile-logout-button">
        <LogOut size={18} aria-hidden="true" />
      </button>
    </div>
  );
}
