import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sun, Moon, Monitor, Bell, Check, CheckCheck, X,
  User, Settings, LogOut, ChevronDown, Sparkles,
  AlertTriangle, CheckCircle2, Info, TrendingDown,
  Layers, Shield, BarChart2, ExternalLink, RefreshCw,
  Edit3, Palette, Camera, Flame
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { getAlerts, markAlertRead, dismissAlert } from "../services/apiService";

const ACCENT_OPTIONS = [
  { key: "violet", label: "Violet", hex: "#8B5CF6" },
  { key: "blue", label: "Blue", hex: "#3B82F6" },
  { key: "emerald", label: "Emerald", hex: "#10B981" },
  { key: "rose", label: "Rose", hex: "#F43F5E" },
];

const INITIAL_NOTIFICATIONS = [
  {
    id: "notif-1",
    type: "negative_spike",
    title: "Negative Spike Detected",
    message: "Sharp 38% increase in negative feedback detected for #ProductLaunch over the last 2 hours.",
    time: "5m ago",
    read: false,
    page: "alerts",
  },
  {
    id: "notif-2",
    type: "intelligence",
    title: "AI Trend Digest Ready",
    message: "Bi-weekly sentiment intelligence and forecasting report has finished generating.",
    time: "42m ago",
    read: false,
    page: "intelligence",
  },
  {
    id: "notif-3",
    type: "success",
    title: "Batch Analysis Complete",
    message: "Processed 450 customer reviews with 96.4% confidence using Logistic Regression.",
    time: "2h ago",
    read: false,
    page: "reports",
  },
  {
    id: "notif-4",
    type: "info",
    title: "System Performance",
    message: "Inference latency is currently optimal at 14ms per sample.",
    time: "5h ago",
    read: true,
    page: "analytics",
  },
];

const PAGE_TITLES = {
  overview:     { title: "Overview", subtitle: "Real-time Sentiment & Key Metrics" },
  analysis:     { title: "Live Analysis", subtitle: "Instant Sentiment Inference" },
  analytics:    { title: "Analytics", subtitle: "Distribution & Trend Visualizations" },
  intelligence: { title: "Intelligence", subtitle: "Predictive Signals & Topic Clusters" },
  forecast:     { title: "Forecast", subtitle: "Predictive Sentiment Projections" },
  insights:     { title: "AI Insights", subtitle: "Automated Executive Findings" },
  copilot:      { title: "AI Copilot", subtitle: "Natural Language Sentiment Assistant" },
  history:      { title: "Analysis History", subtitle: "Historical Inferences & Logs" },
  alerts:       { title: "Alerts & Spikes", subtitle: "Threshold Monitors & Notifications" },
  reports:      { title: "Reports & Export", subtitle: "CSV Ingestion & Export Center" },
  settings:     { title: "Settings", subtitle: "Preferences, Themes & Account" },
};

export default function DashboardHeader({
  activePage,
  onNavigate,
  onToggleSidebar,
  sidebarCollapsed,
}) {
  const { user, signout, updateUser } = useAuth();
  const { theme, setTheme, accentColor, setAccentColor, compactLayout, setCompactLayout, isDark } = useTheme();

  // Dropdown states
  const [themeOpen, setThemeOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [notifFilter, setNotifFilter] = useState("all"); // "all" | "unread" | "alerts"

  // Edit profile form state
  const [editName, setEditName] = useState(user?.name || "");
  const [editCompany, setEditCompany] = useState(user?.company || "BrandPulse AI");

  const themeRef = useRef(null);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Sync edit profile form when user changes
  useEffect(() => {
    if (user?.name) setEditName(user.name);
    if (user?.company) setEditCompany(user.company);
  }, [user]);

  // Load backend alerts and merge with existing notifications
  useEffect(() => {
    async function fetchBackendAlerts() {
      try {
        const backendAlerts = await getAlerts();
        if (Array.isArray(backendAlerts) && backendAlerts.length > 0) {
          const formatted = backendAlerts.map(a => ({
            id: `api-${a.id}`,
            type: a.type || "warning",
            title: a.title,
            message: a.message,
            time: new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: !!a.read,
            page: "alerts",
          }));
          setNotifications(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newItems = formatted.filter(f => !existingIds.has(f.id));
            return [...newItems, ...prev];
          });
        }
      } catch (err) {
        // Fallback to local notifications
      }
    }
    fetchBackendAlerts();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (themeRef.current && !themeRef.current.contains(e.target)) {
        setThemeOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setThemeOpen(false);
        setNotifOpen(false);
        setProfileOpen(false);
        setEditProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Notifications helpers
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    if (id.startsWith("api-")) {
      try {
        await markAlertRead(id.replace("api-", ""));
      } catch (err) {}
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const removeNotification = async (id, e) => {
    if (e) e.stopPropagation();
    if (id.startsWith("api-")) {
      try {
        await dismissAlert(id.replace("api-", ""));
      } catch (err) {}
    }
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const handleNotificationClick = (notif) => {
    markAsRead(notif.id);
    setNotifOpen(false);
    if (notif.page && onNavigate) {
      onNavigate(notif.page);
    }
  };

  // Quick theme toggle helper
  const handleToggleTheme = () => {
    if (theme === "dark") setTheme("light");
    else setTheme("dark");
  };

  // Profile save helper
  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (updateUser) {
      updateUser({
        name: editName.trim() || user?.name,
        company: editCompany.trim(),
      });
    }
    setEditProfileOpen(false);
  };

  // Randomize avatar seed
  const handleShuffleAvatar = (e) => {
    if (e) e.stopPropagation();
    const newSeed = Math.random().toString(36).substring(7);
    const newAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${newSeed}`;
    if (updateUser) {
      updateUser({ avatarUrl: newAvatar });
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (notifFilter === "unread") return !n.read;
    if (notifFilter === "alerts") return n.type === "negative_spike" || n.type === "warning";
    return true;
  });

  const pageInfo = PAGE_TITLES[activePage] || {
    title: activePage.charAt(0).toUpperCase() + activePage.slice(1),
    subtitle: "BrandPulse Analytics",
  };

  return (
    <>
      <header className="dash-header">
        <div className="dash-header__left">
          <div className="dash-header__breadcrumbs">
            <span className="dash-header__crumb-brand">BrandPulse</span>
            <span className="dash-header__crumb-divider">/</span>
            <span className="dash-header__crumb-active">{pageInfo.title}</span>
          </div>

          <div className="dash-header__status-badge" title="Real-time sentiment inference is active">
            <span className="dash-header__status-dot" />
            <span className="dash-header__status-text">Engine Online</span>
          </div>
        </div>

        <div className="dash-header__right">
          {/* Quick 1-click theme switch */}
          <button
            className="dash-header__icon-btn dash-header__quick-theme"
            onClick={handleToggleTheme}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle theme mode"
          >
            {isDark ? <Sun size={18} className="theme-icon--sun" /> : <Moon size={18} className="theme-icon--moon" />}
          </button>

          {/* Theme Palette Dropdown Button */}
          <div className="dash-header__popover-container" ref={themeRef}>
            <button
              className={`dash-header__icon-btn ${themeOpen ? "dash-header__icon-btn--active" : ""}`}
              onClick={() => {
                setThemeOpen(!themeOpen);
                setNotifOpen(false);
                setProfileOpen(false);
              }}
              title="Theme & Appearance Preferences"
              aria-label="Theme settings"
            >
              <Palette size={18} />
            </button>

            <AnimatePresence>
              {themeOpen && (
                <motion.div
                  className="dash-popover dash-popover--theme"
                  initial={{ opacity: 0, y: 10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.96 }}
                  transition={{ duration: 0.16 }}
                >
                  <div className="dash-popover__header">
                    <span className="dash-popover__title">Appearance & Theme</span>
                    <button
                      className="dash-popover__link-btn"
                      onClick={() => {
                        setThemeOpen(false);
                        onNavigate("settings", "appearance");
                      }}
                    >
                      All Settings
                    </button>
                  </div>

                  {/* Mode options */}
                  <div className="dash-theme-modes">
                    <button
                      className={`dash-theme-mode-btn ${theme === "dark" ? "dash-theme-mode-btn--active" : ""}`}
                      onClick={() => setTheme("dark")}
                    >
                      <Moon size={15} />
                      <span>Dark</span>
                      {theme === "dark" && <Check size={13} className="dash-theme-check" />}
                    </button>

                    <button
                      className={`dash-theme-mode-btn ${theme === "light" ? "dash-theme-mode-btn--active" : ""}`}
                      onClick={() => setTheme("light")}
                    >
                      <Sun size={15} />
                      <span>Light</span>
                      {theme === "light" && <Check size={13} className="dash-theme-check" />}
                    </button>

                    <button
                      className={`dash-theme-mode-btn ${theme === "system" ? "dash-theme-mode-btn--active" : ""}`}
                      onClick={() => setTheme("system")}
                    >
                      <Monitor size={15} />
                      <span>System</span>
                      {theme === "system" && <Check size={13} className="dash-theme-check" />}
                    </button>
                  </div>

                  <div className="dash-popover__divider" />

                  {/* Accent Swatches */}
                  <div className="dash-theme-accents">
                    <span className="dash-theme-label">Accent Color</span>
                    <div className="dash-theme-swatches">
                      {ACCENT_OPTIONS.map((opt) => (
                        <button
                          key={opt.key}
                          className={`dash-theme-swatch ${accentColor === opt.key ? "dash-theme-swatch--active" : ""}`}
                          style={{ background: opt.hex }}
                          onClick={() => setAccentColor(opt.key)}
                          title={opt.label}
                          aria-label={`Select ${opt.label} accent color`}
                        >
                          {accentColor === opt.key && <Check size={12} color="#fff" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="dash-popover__divider" />

                  {/* Compact Layout Toggle */}
                  <div className="dash-theme-toggle-row">
                    <div className="dash-theme-toggle-label">
                      <Layers size={15} />
                      <span>Compact Density</span>
                    </div>
                    <button
                      className={`toggle-switch ${compactLayout ? "toggle-switch--on" : ""}`}
                      onClick={() => setCompactLayout(!compactLayout)}
                      aria-label="Toggle compact layout"
                    >
                      <div className="toggle-switch__thumb" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Notifications Center Button */}
          <div className="dash-header__popover-container" ref={notifRef}>
            <button
              className={`dash-header__icon-btn ${notifOpen ? "dash-header__icon-btn--active" : ""}`}
              onClick={() => {
                setNotifOpen(!notifOpen);
                setThemeOpen(false);
                setProfileOpen(false);
              }}
              title="Notifications & Alerts"
              aria-label="Open notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="dash-header__badge">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  className="dash-popover dash-popover--notif"
                  initial={{ opacity: 0, y: 10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.96 }}
                  transition={{ duration: 0.16 }}
                >
                  <div className="dash-popover__header">
                    <div className="dash-notif-header-title">
                      <span className="dash-popover__title">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="dash-notif-pill">{unreadCount} unread</span>
                      )}
                    </div>
                    <div className="dash-notif-header-actions">
                      {unreadCount > 0 && (
                        <button
                          className="dash-notif-text-btn"
                          onClick={markAllRead}
                          title="Mark all as read"
                        >
                          <CheckCheck size={14} />
                          <span>Mark all read</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Filter tabs */}
                  <div className="dash-notif-filters">
                    <button
                      className={`dash-notif-tab ${notifFilter === "all" ? "dash-notif-tab--active" : ""}`}
                      onClick={() => setNotifFilter("all")}
                    >
                      All ({notifications.length})
                    </button>
                    <button
                      className={`dash-notif-tab ${notifFilter === "unread" ? "dash-notif-tab--active" : ""}`}
                      onClick={() => setNotifFilter("unread")}
                    >
                      Unread ({unreadCount})
                    </button>
                    <button
                      className={`dash-notif-tab ${notifFilter === "alerts" ? "dash-notif-tab--active" : ""}`}
                      onClick={() => setNotifFilter("alerts")}
                    >
                      Alerts
                    </button>
                  </div>

                  {/* Notifications list */}
                  <div className="dash-notif-list">
                    {filteredNotifications.length === 0 ? (
                      <div className="dash-notif-empty">
                        <Bell size={28} className="dash-notif-empty-icon" />
                        <p className="dash-notif-empty-title">All clear!</p>
                        <p className="dash-notif-empty-sub">No notifications matching your filter.</p>
                      </div>
                    ) : (
                      filteredNotifications.map((n) => {
                        const isSpike = n.type === "negative_spike" || n.type === "warning";
                        const isSuccess = n.type === "success";
                        const isIntelligence = n.type === "intelligence";

                        return (
                          <div
                            key={n.id}
                            className={`dash-notif-item ${!n.read ? "dash-notif-item--unread" : ""}`}
                            onClick={() => handleNotificationClick(n)}
                          >
                            <div
                              className={`dash-notif-icon-wrap ${
                                isSpike
                                  ? "dash-notif-icon--spike"
                                  : isSuccess
                                  ? "dash-notif-icon--success"
                                  : isIntelligence
                                  ? "dash-notif-icon--ai"
                                  : "dash-notif-icon--info"
                              }`}
                            >
                              {isSpike ? (
                                <AlertTriangle size={15} />
                              ) : isSuccess ? (
                                <CheckCircle2 size={15} />
                              ) : isIntelligence ? (
                                <Sparkles size={15} />
                              ) : (
                                <Info size={15} />
                              )}
                            </div>

                            <div className="dash-notif-content">
                              <div className="dash-notif-item-top">
                                <span className="dash-notif-item-title">{n.title}</span>
                                <span className="dash-notif-item-time">{n.time}</span>
                              </div>
                              <p className="dash-notif-item-msg">{n.message}</p>
                            </div>

                            <div className="dash-notif-item-actions">
                              {!n.read && (
                                <button
                                  className="dash-notif-action-btn"
                                  onClick={(e) => markAsRead(n.id, e)}
                                  title="Mark as read"
                                >
                                  <Check size={13} />
                                </button>
                              )}
                              <button
                                className="dash-notif-action-btn dash-notif-action-btn--delete"
                                onClick={(e) => removeNotification(n.id, e)}
                                title="Dismiss notification"
                              >
                                <X size={13} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Footer */}
                  <div className="dash-popover__footer">
                    <button
                      className="dash-notif-footer-btn"
                      onClick={() => {
                        setNotifOpen(false);
                        onNavigate("alerts");
                      }}
                    >
                      <span>Open Alerts Center</span>
                      <ExternalLink size={13} />
                    </button>
                    {notifications.length > 0 && (
                      <button
                        className="dash-notif-clear-btn"
                        onClick={clearAllNotifications}
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Profile Section & Dropdown */}
          <div className="dash-header__popover-container" ref={profileRef}>
            <button
              className={`dash-profile-btn ${profileOpen ? "dash-profile-btn--active" : ""}`}
              onClick={() => {
                setProfileOpen(!profileOpen);
                setThemeOpen(false);
                setNotifOpen(false);
              }}
              aria-label="User account menu"
            >
              <div className="dash-profile-avatar-wrap">
                <img
                  src={user?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.id || user?.email || 'analyst'}`}
                  alt="avatar"
                  className="dash-profile-avatar"
                />
                <span className="dash-profile-online-badge" />
              </div>
              <div className="dash-profile-meta">
                <span className="dash-profile-name">{user?.name || "Analyst"}</span>
                <span className="dash-profile-role">{user?.role || "Enterprise Pro"}</span>
              </div>
              <ChevronDown
                size={14}
                className={`dash-profile-chevron ${profileOpen ? "dash-profile-chevron--open" : ""}`}
              />
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  className="dash-popover dash-popover--profile"
                  initial={{ opacity: 0, y: 10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.96 }}
                  transition={{ duration: 0.16 }}
                >
                  {/* Profile Header Card */}
                  <div className="dash-profile-card">
                    <div className="dash-profile-card__avatar-row">
                      <div className="dash-profile-card__avatar-box">
                        <img
                          src={user?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.id || user?.email || 'analyst'}`}
                          alt="avatar"
                          className="dash-profile-card__avatar"
                        />
                        <button
                          className="dash-profile-avatar-shuffle"
                          onClick={handleShuffleAvatar}
                          title="Generate new avatar"
                        >
                          <Camera size={12} />
                        </button>
                      </div>
                      <div className="dash-profile-card__user-details">
                        <div className="dash-profile-card__name-row">
                          <span className="dash-profile-card__name">{user?.name || "Analyst"}</span>
                          <span className="dash-profile-badge-pro">PRO</span>
                        </div>
                        <span className="dash-profile-card__email">{user?.email || "analyst@brandpulse.ai"}</span>
                        <span className="dash-profile-card__company">{user?.company || "Sentiment AI Lab"}</span>
                      </div>
                    </div>

                    <div className="dash-profile-quick-stats">
                      <div className="dash-profile-stat-box">
                        <span className="dash-profile-stat-val">1,420</span>
                        <span className="dash-profile-stat-lbl">Analyses</span>
                      </div>
                      <div className="dash-profile-stat-divider" />
                      <div className="dash-profile-stat-box">
                        <span className="dash-profile-stat-val">96.8%</span>
                        <span className="dash-profile-stat-lbl">Confidence</span>
                      </div>
                      <div className="dash-profile-stat-divider" />
                      <div className="dash-profile-stat-box">
                        <span className="dash-profile-stat-val">Optimal</span>
                        <span className="dash-profile-stat-lbl">Latency</span>
                      </div>
                    </div>
                  </div>

                  {/* Navigation Links */}
                  <div className="dash-profile-menu">
                    <button
                      className="dash-profile-menu-item"
                      onClick={() => {
                        setProfileOpen(false);
                        onNavigate("settings", "profile");
                      }}
                    >
                      <User size={16} />
                      <div className="dash-profile-item-text">
                        <span>Profile & Account</span>
                        <span className="dash-profile-item-sub">Name, email, company</span>
                      </div>
                    </button>

                    <button
                      className="dash-profile-menu-item"
                      onClick={() => {
                        setProfileOpen(false);
                        onNavigate("settings", "appearance");
                      }}
                    >
                      <Palette size={16} />
                      <div className="dash-profile-item-text">
                        <span>Appearance & Colors</span>
                        <span className="dash-profile-item-sub">Dark mode, accents, density</span>
                      </div>
                    </button>

                    <button
                      className="dash-profile-menu-item"
                      onClick={() => {
                        setProfileOpen(false);
                        onNavigate("settings", "notifications");
                      }}
                    >
                      <Bell size={16} />
                      <div className="dash-profile-item-text">
                        <span>Notification Rules</span>
                        <span className="dash-profile-item-sub">Spike alerts & email digests</span>
                      </div>
                    </button>

                    <button
                      className="dash-profile-menu-item"
                      onClick={() => {
                        setProfileOpen(false);
                        onNavigate("settings", "security");
                      }}
                    >
                      <Shield size={16} />
                      <div className="dash-profile-item-text">
                        <span>Security & API Keys</span>
                        <span className="dash-profile-item-sub">REST keys, JWT tokens</span>
                      </div>
                    </button>
                  </div>

                  <div className="dash-popover__divider" />

                  {/* Quick Edit Profile Action */}
                  <div className="dash-profile-quick-actions">
                    <button
                      className="dash-profile-edit-btn"
                      onClick={() => {
                        setProfileOpen(false);
                        setEditProfileOpen(true);
                      }}
                    >
                      <Edit3 size={14} />
                      <span>Edit Name / Title</span>
                    </button>
                  </div>

                  <div className="dash-popover__divider" />

                  {/* Sign Out */}
                  <div className="dash-profile-footer">
                    <button
                      className="dash-profile-logout-btn"
                      onClick={() => {
                        setProfileOpen(false);
                        signout();
                      }}
                    >
                      <LogOut size={16} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {editProfileOpen && (
          <div className="modal-overlay" onClick={() => setEditProfileOpen(false)}>
            <motion.div
              className="modal-card edit-profile-modal"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-card__header">
                <div className="modal-card__header-text">
                  <h3 className="modal-card__title">Quick Edit Profile</h3>
                  <p className="modal-card__sub">Update your display information.</p>
                </div>
                <button
                  className="modal-card__close"
                  onClick={() => setEditProfileOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="edit-profile-form">
                <div className="edit-profile-avatar-shuffle-row">
                  <img
                    src={user?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.id || user?.email || 'analyst'}`}
                    alt="avatar"
                    className="edit-profile-preview-avatar"
                  />
                  <div>
                    <button
                      type="button"
                      className="dash-action-btn dash-action-btn--ghost"
                      onClick={handleShuffleAvatar}
                    >
                      <RefreshCw size={14} />
                      <span>Randomize Bot Avatar</span>
                    </button>
                    <p className="edit-profile-hint">Auto-generates a unique neural robot avatar</p>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g. Sarah Connor"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Company / Team</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editCompany}
                    onChange={(e) => setEditCompany(e.target.value)}
                    placeholder="e.g. Acme Intelligence Lab"
                  />
                </div>

                <div className="modal-card__actions">
                  <button
                    type="button"
                    className="dash-action-btn dash-action-btn--ghost"
                    onClick={() => setEditProfileOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="dash-action-btn dash-action-btn--primary"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
