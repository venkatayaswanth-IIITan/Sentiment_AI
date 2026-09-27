import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Sparkles, LogIn, LogOut, User, UserPlus } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "Live Showcase", href: "#showcase" },
  { label: "Features", href: "#features" },
  { label: "Architecture", href: "#how-it-works" },
  { label: "About", href: "#about" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, isAuthenticated, openAuthModal, signout } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (href) => {
    setMenuOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`navbar ${scrolled ? "navbar--scrolled" : ""}`}
      >
        <div className="navbar__inner">
          {/* Logo */}
          <a
            href="#home"
            className="navbar__logo"
            onClick={(e) => { e.preventDefault(); scrollTo("#home"); }}
          >
            <div className="navbar__logo-icon">
              <Sparkles size={16} />
            </div>
            <span className="navbar__logo-text">SentimentAI</span>
          </a>

          {/* Desktop Nav */}
          <ul className="navbar__links">
            {navLinks.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="navbar__link"
                  onClick={(e) => { e.preventDefault(); scrollTo(link.href); }}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Auth Controls */}
          <div className="navbar__auth-actions">
            {isAuthenticated ? (
              <div className="navbar__user-pill">
                <img
                  src={user?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.id}`}
                  alt="Avatar"
                  className="navbar__avatar"
                />
                <span className="navbar__username" title={user?.email}>
                  {user?.name || user?.email?.split('@')[0]}
                </span>
                <button
                  className="navbar__signout-btn"
                  onClick={signout}
                  title="Sign Out"
                  aria-label="Sign out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <div className="navbar__auth-btns">
                <button
                  className="navbar__btn navbar__btn--signin"
                  onClick={() => openAuthModal("signin")}
                >
                  <LogIn size={15} />
                  <span>Sign In</span>
                </button>
                <button
                  className="navbar__btn navbar__btn--signup"
                  onClick={() => openAuthModal("signup")}
                >
                  <UserPlus size={15} />
                  <span>Sign Up</span>
                </button>
              </div>
            )}
          </div>

          {/* Hamburger */}
          <button
            className="navbar__hamburger"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="mobile-menu"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}
          >
            {navLinks.map((link, i) => (
              <motion.a
                key={link.label}
                href={link.href}
                className="mobile-menu__link"
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={(e) => { e.preventDefault(); scrollTo(link.href); }}
              >
                {link.label}
              </motion.a>
            ))}

            <div className="mobile-menu__auth">
              {isAuthenticated ? (
                <div className="mobile-menu__user">
                  <div className="mobile-menu__user-info">
                    <img
                      src={user?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.id}`}
                      alt="Avatar"
                      className="navbar__avatar"
                    />
                    <span>{user?.name || user?.email}</span>
                  </div>
                  <button
                    className="mobile-menu__signout-btn"
                    onClick={() => { signout(); setMenuOpen(false); }}
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="mobile-menu__auth-btns">
                  <button
                    className="navbar__btn navbar__btn--signin"
                    onClick={() => { openAuthModal("signin"); setMenuOpen(false); }}
                  >
                    <LogIn size={16} />
                    <span>Sign In</span>
                  </button>
                  <button
                    className="navbar__btn navbar__btn--signup"
                    onClick={() => { openAuthModal("signup"); setMenuOpen(false); }}
                  >
                    <UserPlus size={16} />
                    <span>Sign Up</span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

