import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  LayoutDashboard, BarChart2, Activity, History,
  Bell, FileText, Settings, LogOut, Sparkles,
  ChevronLeft, ChevronRight, Menu, X, Brain, TrendingUp,
  Lightbulb, MessageSquare
} from "lucide-react";

const NAV_ITEMS = [
  { id: "overview",     label: "Overview",          icon: LayoutDashboard },
  { id: "analysis",     label: "Sentiment Analysis",icon: BarChart2 },
  { id: "analytics",    label: "Analytics",          icon: Activity },
  { id: "intelligence", label: "Intelligence",       icon: Brain },
  { id: "forecast",     label: "Forecast",           icon: TrendingUp },
  { id: "insights",     label: "Insights",           icon: Lightbulb },
  { id: "copilot",      label: "AI Copilot",         icon: MessageSquare },
  { id: "history",      label: "Analysis History",   icon: History },
  { id: "alerts",       label: "Alerts",             icon: Bell },
  { id: "reports",      label: "Reports",            icon: FileText },
];

export default function DashboardSidebar({
  activePage,
  onNavigate,
  collapsed: propCollapsed,
  setCollapsed: propSetCollapsed,
}) {
  const { user, signout } = useAuth();
  const { isDark, accentColor } = useTheme();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = propCollapsed !== undefined ? propCollapsed : internalCollapsed;
  const setCollapsed = propSetCollapsed || setInternalCollapsed;
  const [mobileOpen, setMobileOpen] = useState(false);

  const SidebarContent = () => (
    <div className="sidebar__inner">
      {/* Logo */}
      <div className="sidebar__logo-wrap">
        <div className="sidebar__logo-icon">
          <Sparkles size={18} />
        </div>
        {!collapsed && (
          <motion.span
            className="sidebar__logo-text"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          >
            BrandPulse AI
          </motion.span>
        )}
      </div>

      {/* Nav items */}
      <nav className="sidebar__nav">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              className={`sidebar__nav-item ${isActive ? "sidebar__nav-item--active" : ""}`}
              onClick={() => { onNavigate(item.id); setMobileOpen(false); }}
              title={collapsed ? item.label : ""}
            >
              <Icon size={19} className="sidebar__nav-icon" />
              {!collapsed && <span className="sidebar__nav-label">{item.label}</span>}
              {isActive && !collapsed && <div className="sidebar__active-dot" />}
            </button>
          );
        })}
      </nav>

      <div className="sidebar__divider" />

      {/* Settings */}
      <button
        className={`sidebar__nav-item ${activePage === "settings" ? "sidebar__nav-item--active" : ""}`}
        onClick={() => { onNavigate("settings", "appearance"); setMobileOpen(false); }}
        title={collapsed ? "Settings" : ""}
      >
        <Settings size={19} className="sidebar__nav-icon" />
        {!collapsed && (
          <div className="sidebar__settings-wrap">
            <span className="sidebar__nav-label">Settings</span>
            <span className="sidebar__settings-sub">Appearance, profile, security</span>
          </div>
        )}
      </button>

      {/* User + Logout */}
      <div className="sidebar__user-section">
        {collapsed ? (
          <button
            className="sidebar__avatar-btn-collapsed"
            onClick={() => onNavigate("settings", "profile")}
            title={`Logged in as ${user?.name || 'User'} — Click for Profile`}
          >
            <img
              src={user?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.id || user?.email || 'analyst'}`}
              alt="avatar"
              className="sidebar__avatar"
            />
          </button>
        ) : (
          <div
            className="sidebar__user-info sidebar__user-info--clickable"
            onClick={() => onNavigate("settings", "profile")}
            title="Click to view profile & account settings"
          >
            <img
              src={user?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.id || user?.email || 'analyst'}`}
              alt="avatar"
              className="sidebar__avatar"
            />
            <div className="sidebar__user-meta">
              <span className="sidebar__user-name">{user?.name || "User"}</span>
              <span className="sidebar__user-email">{user?.email}</span>
            </div>
          </div>
        )}
        <button
          className="sidebar__logout-btn"
          onClick={signout}
          title="Logout"
        >
          <LogOut size={16} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {/* Collapse toggle (desktop) */}
      <button
        className="sidebar__collapse-btn"
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="sidebar__mobile-toggle"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      {/* Desktop Sidebar */}
      <aside className={`sidebar ${collapsed ? "sidebar--collapsed" : ""}`}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="sidebar-overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="sidebar sidebar--mobile"
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
              <button className="sidebar__mobile-close" onClick={() => setMobileOpen(false)}>
                <X size={20} />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
