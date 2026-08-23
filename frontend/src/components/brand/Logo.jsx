import { Link } from "@tanstack/react-router";

export function Logo({ light = false }) {
  return (
    <Link
      to="/"
      className={`brand-mark ${light ? "brand-mark-light" : ""}`}
      data-testid="brand-logo-link"
    >
      <img src="/titikjiwa-logo.png" alt="Logo Titikjiwa" className="brand-logo-image" />
      <span className="brand-symbol brand-symbol-legacy" aria-hidden="true">
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="9" opacity="0.35" />
          <path d="M12 6c-3 0-5 2-5 5 0 2 1.5 3.5 3 4.5 1 0.7 2 1.5 2 2.5" />
          <path d="M12 6c3 0 5 2 5 5 0 2-1.5 3.5-3 4.5-1 0.7-2 1.5-2 2.5" />
          <circle cx="12" cy="10" r="1.5" fill="currentColor" />
        </svg>
      </span>
      <span>Titikjiwa</span>
    </Link>
  );
}
