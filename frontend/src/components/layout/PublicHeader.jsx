import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, Moon, Search, Sun, UserRound, X } from "lucide-react";
import { useTheme } from "@/app/ThemeProvider";
import { Logo } from "./Logo";
export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchOpen(false);
    navigate({ to: "/ruang" });
  };

  return (
    <header className="public-header" data-testid="public-header">
      <Logo />
      <nav id="public-navigation" className={`public-nav ${open ? "public-nav-open" : ""}`} data-testid="public-navigation">
        <Link to="/" data-testid="nav-home-link">Home</Link>
        <a href="/#mengapa" data-testid="nav-about-link">Mengapa</a>
        <Link to="/fitur" data-testid="nav-pesign-link">Fitur</Link>
        <a href="/#untuk-siapa" data-testid="nav-deperients-link">Untuk siapa</a>
        <Link to="/ruang" data-testid="nav-products-link">Ruang</Link>
        <Link to="/kontak" data-testid="nav-contact-link">Kontak</Link>
      </nav>
      <div className="header-actions">
        <Link to="/masuk" className="header-signup-pill" data-testid="header-signup-button">
          Sign Up
        </Link>
        <button
          type="button"
          className="header-icon-btn"
          onClick={() => setSearchOpen(!searchOpen)}
          aria-label="Cari di titikjiwa"
          data-testid="header-search-button"
        >
          <Search size={18} />
        </button>
        <Link
          to="/masuk"
          className="header-icon-btn"
          aria-label="Akun pengguna"
          data-testid="header-user-button"
        >
          <UserRound size={18} />
        </Link>
        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Gunakan mode terang" : "Gunakan mode gelap"}
          data-testid="theme-toggle-button"
        >
          {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        <button
          className="icon-button mobile-menu"
          onClick={() => setOpen(!open)}
          aria-label="Buka menu"
          aria-expanded={open}
          aria-controls="public-navigation"
          data-testid="mobile-menu-button"
        >
          {open ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>

      {searchOpen && (
        <div className="header-search-dropdown" data-testid="header-search-dropdown">
          <form onSubmit={handleSearchSubmit} className="header-search-form">
            <Search size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari topik, jurnal, atau cerita pulih…"
              autoFocus
              data-testid="header-search-input"
            />
            <button type="button" onClick={() => setSearchOpen(false)} aria-label="Tutup pencarian">
              <X size={15} />
            </button>
          </form>
        </div>
      )}
    </header>
  );
}
