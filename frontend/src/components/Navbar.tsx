import { Menu, Moon, Sun, X } from "lucide-react";
import { useState } from "react";

interface NavbarProps {
  onLaunch: () => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
}

export default function Navbar({ onLaunch, theme, onToggleTheme }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="site-header">
      <nav className="nav-shell container">
        <a className="brand" href="#" aria-label="CampuSync home" onClick={closeMenu}>
          <span className="brand-mark">C<span>.</span></span>
          <span className="brand-copy"><strong>campusync</strong><small>by Vortex Group</small></span>
        </a>
        <button className="mobile-menu-button icon-button" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "Close menu" : "Open menu"}>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div className={`nav-links ${menuOpen ? "nav-links-open" : ""}`}>
          <a href="#preview" onClick={closeMenu}>Live Preview</a>
          <a href="#how-it-works" onClick={closeMenu}>How it works</a>
          <a href="#pricing" onClick={closeMenu}>Pricing</a>
          <a href="/admin">Admin</a>
          <button className="icon-button theme-toggle" onClick={onToggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="button button-small button-primary nav-cta" onClick={() => { closeMenu(); onLaunch(); }}>Deploy your campus</button>
        </div>
      </nav>
    </header>
  );
}