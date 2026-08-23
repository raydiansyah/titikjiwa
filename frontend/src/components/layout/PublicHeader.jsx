import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, Search, UserRound, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const closeMenu = () => setOpen(false);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchOpen(false);
    closeMenu();
    navigate({ to: "/ruang" });
  };

  return (
    <header className="public-header" data-testid="public-header">
      <Logo />
      <nav
        id="public-navigation"
        className={`public-nav ${open ? "public-nav-open" : ""}`}
        data-testid="public-navigation"
      >
        <Link to="/" onClick={closeMenu} data-testid="nav-home-link">Home</Link>
        <a href="/#mengapa" onClick={closeMenu} data-testid="nav-about-link">Mengapa</a>
        <Link to="/fitur" onClick={closeMenu} data-testid="nav-pesign-link">Fitur</Link>
        <a href="/#untuk-siapa" onClick={closeMenu} data-testid="nav-deperients-link">Untuk siapa</a>
        <Link to="/ruang" onClick={closeMenu} data-testid="nav-products-link">Ruang</Link>
        <Link to="/kontak" onClick={closeMenu} data-testid="nav-contact-link">Kontak</Link>
      </nav>

      <div className="header-actions">
        <Link to="/masuk" className="header-signup-pill" data-testid="header-signup-button">
          Sign Up
        </Link>
        <button
          type="button"
          className="header-icon-btn"
          onClick={() => setSearchOpen((current) => !current)}
          aria-label="Cari di titikjiwa"
          aria-expanded={searchOpen}
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
        <ThemeToggle />
        <button
          type="button"
          className="icon-button mobile-menu"
          onClick={() => setOpen((current) => !current)}
          aria-label={open ? "Tutup menu" : "Buka menu"}
          aria-expanded={open}
          aria-controls="public-navigation"
          data-testid="mobile-menu-button"
        >
          {open ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>

      {searchOpen && (
        <div className="header-search-dropdown" data-testid="header-search-dropdown">
          <form onSubmit={handleSearchSubmit} className="header-search-form" role="search">
            <Search size={16} aria-hidden="true" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
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
