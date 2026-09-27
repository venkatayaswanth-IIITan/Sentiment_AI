import { useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import {
  Sun, Moon, Monitor, Check, Palette, Layers,
  Eye, Save, ChevronDown, User, Bell, Shield,
  BarChart2, Key, Trash2, Mail, Smartphone, Globe,
  Lock, Camera
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const ACCENT_OPTIONS = [
  { key: "violet", label: "Violet", hex: "#8B5CF6" },
  { key: "blue", label: "Blue", hex: "#3B82F6" },
  { key: "emerald", label: "Emerald", hex: "#10B981" },
  { key: "rose", label: "Rose", hex: "#F43F5E" },
];

const THEME_OPTIONS = [
  {
    key: "light",
    label: "Light Mode",
    sub: "Bright background, light cards",
    icon: Sun,
    preview: { bg: "#F1F5F9", card: "#FFFFFF", text: "#0F172A" },
  },
  {
    key: "dark",
    label: "Dark Mode",
    sub: "Dark surfaces, comfortable contrast",
    icon: Moon,
    preview: { bg: "#0B1020", card: "#111827", text: "#F8FAFC" },
  },
  {
    key: "system",
    label: "System Default",
    sub: "Follow device appearance",
    icon: Monitor,
    preview: { bg: "linear-gradient(135deg,#F1F5F9 50%,#0B1020 50%)", card: "#666", text: "#888" },
  },
];

function SectionHeader({ icon: Icon, title, sub }) {
  return (
    <div className="settings-section-header">
      <div className="settings-section-header__icon">
        <Icon size={18} />
      </div>
      <div>
        <h2 className="settings-section-header__title">{title}</h2>
        {sub && <p className="settings-section-header__sub">{sub}</p>}
      </div>
    </div>
  );
}

function SettingsCard({ children, className = "" }) {
  return <div className={`settings-card ${className}`}>{children}</div>;
}

// ─── Appearance Section ─────────────────────────────────────────────
function AppearanceSection() {
  const { theme, setTheme, accentColor, setAccentColor, compactLayout, setCompactLayout, isDark } = useTheme();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="settings-section">
      <SectionHeader icon={Palette} title="Appearance" sub="Customize your dashboard experience." />

      {/* Theme Selector */}
      <SettingsCard>
        <h3 className="settings-card__title">Theme</h3>
        <div className="theme-options">
          {THEME_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isActive = theme === opt.key;
            return (
              <button
                key={opt.key}
                className={`theme-option ${isActive ? "theme-option--active" : ""}`}
                onClick={() => setTheme(opt.key)}
              >
                <div
                  className="theme-option__preview"
                  style={{ background: opt.preview.bg }}
                >
                  <div
                    className="theme-option__preview-card"
                    style={{ background: opt.preview.card, color: opt.preview.text }}
                  >
                    <div className="theme-option__preview-bar" style={{ background: "var(--accent)", opacity: 0.8 }} />
                    <div className="theme-option__preview-line" style={{ background: opt.preview.text, opacity: 0.3 }} />
                    <div className="theme-option__preview-line" style={{ background: opt.preview.text, opacity: 0.15, width: "70%" }} />
                  </div>
                </div>
                <div className="theme-option__body">
                  <div className="theme-option__label-row">
                    <Icon size={16} />
                    <span className="theme-option__label">{opt.label}</span>
                    {isActive && <Check size={14} className="theme-option__check" />}
                  </div>
                  <p className="theme-option__sub">{opt.sub}</p>
                </div>
              </button>
            );
          })}
        </div>
      </SettingsCard>

      {/* Accent Color */}
      <SettingsCard>
        <h3 className="settings-card__title">Accent Color</h3>
        <div className="accent-options">
          {ACCENT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              className={`accent-option ${accentColor === opt.key ? "accent-option--active" : ""}`}
              onClick={() => setAccentColor(opt.key)}
              title={opt.label}
            >
              <div className="accent-option__swatch" style={{ background: opt.hex }} />
              <span className="accent-option__label">{opt.label}</span>
              {accentColor === opt.key && <Check size={12} className="accent-option__check" />}
            </button>
          ))}
        </div>
      </SettingsCard>

      {/* Layout Preferences */}
      <SettingsCard>
        <h3 className="settings-card__title">Layout</h3>
        <div className="settings-toggle-row">
          <div className="settings-toggle-info">
            <Layers size={16} />
            <div>
              <span className="settings-toggle-label">Compact Dashboard Layout</span>
              <p className="settings-toggle-sub">Reduce padding and show more content at once</p>
            </div>
          </div>
          <button
            className={`toggle-switch ${compactLayout ? "toggle-switch--on" : ""}`}
            onClick={() => setCompactLayout(!compactLayout)}
            aria-label="Toggle compact layout"
          >
            <div className="toggle-switch__thumb" />
          </button>
        </div>
      </SettingsCard>

      {/* Live Preview */}
      <SettingsCard className="settings-card--preview">
        <h3 className="settings-card__title">
          <Eye size={16} style={{ display: "inline", marginRight: 8 }} />
          Preview
        </h3>
        <div className="theme-preview-widget">
          <div className="theme-preview-widget__header">
            <div className="theme-preview-widget__logo">
              <span className="theme-preview-widget__dot" style={{ background: "var(--accent)" }} />
              BrandPulse AI
            </div>
            <div className="theme-preview-widget__actions">
              <div className="theme-preview-widget__action-dot" />
              <div className="theme-preview-widget__action-dot" />
              <div className="theme-preview-widget__action-dot" />
            </div>
          </div>
          <div className="theme-preview-widget__body">
            <div className="theme-preview-widget__card" style={{ borderColor: "var(--accent-border)" }}>
              <p className="theme-preview-widget__card-label">Positive Sentiment</p>
              <p className="theme-preview-widget__card-value" style={{ color: "var(--accent)" }}># 64.5%</p>
              <div className="theme-preview-widget__bar-track">
                <div className="theme-preview-widget__bar-fill" style={{ background: "var(--accent)", width: "64.5%" }} />
              </div>
            </div>
          </div>
        </div>
        <p className="settings-card__note">Interactive preview only. Theme applies to entire dashboard immediately.</p>
      </SettingsCard>

      <div className="settings-actions">
        <button className="settings-btn settings-btn--primary" onClick={handleSave}>
          {saved ? <><Check size={16} /> Saved!</> : <><Save size={16} /> Save Preferences</>}
        </button>
      </div>
    </div>
  );
}

// ─── Profile Section ─────────────────────────────────────────────────
function ProfileSection() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [email] = useState(user?.email || "");
  const [company, setCompany] = useState(user?.company || "");
  const [saved, setSaved] = useState(false);

  const handleShuffleAvatar = () => {
    const newSeed = Math.random().toString(36).substring(7);
    const newAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${newSeed}`;
    if (updateUser) {
      updateUser({ avatarUrl: newAvatar });
    }
  };

  const handleSave = () => {
    if (updateUser) {
      updateUser({ name, company });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="settings-section">
      <SectionHeader icon={User} title="Profile Settings" sub="Update your name, email, and account details." />

      <SettingsCard>
        <div className="profile-avatar-row">
          <div className="profile-avatar-wrap">
            <img
              src={user?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.id || user?.email || 'analyst'}`}
              alt="avatar"
              className="profile-avatar"
            />
            <button className="profile-avatar-change-btn" title="Change avatar" onClick={handleShuffleAvatar}>
              <Camera size={14} />
            </button>
          </div>
          <div className="profile-avatar-info">
            <p className="profile-avatar-name">{user?.name || "Analyst"}</p>
            <p className="profile-avatar-role">{user?.role || "Enterprise Pro"}</p>
          </div>
        </div>

        <div className="settings-form">
          <div className="settings-form__row">
            <label className="settings-form__label">Full Name</label>
            <input
              className="settings-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
            />
          </div>
          <div className="settings-form__row">
            <label className="settings-form__label">Email Address</label>
            <input
              className="settings-input settings-input--disabled"
              value={email}
              disabled
              title="Contact support to change email"
            />
            <p className="settings-form__hint">Email changes require identity verification.</p>
          </div>
          <div className="settings-form__row">
            <label className="settings-form__label">Company / Brand</label>
            <input
              className="settings-input"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Acme Corp"
            />
          </div>
        </div>

        <div className="settings-actions">
          <button className="settings-btn settings-btn--primary" onClick={handleSave}>
            {saved ? <><Check size={16} /> Saved!</> : <><Save size={16} /> Update Profile</>}
          </button>
        </div>
      </SettingsCard>
    </div>
  );
}

// ─── Notifications Section ────────────────────────────────────────────
function NotificationsSection() {
  const [settings, setSettings] = useState({
    negAlert: true,
    emailDigest: false,
    reportReminder: true,
    mobileNotif: false,
    weeklyReport: true,
  });

  const toggle = (key) => setSettings(prev => ({ ...prev, [key]: !prev[key] }));

  const rows = [
    { key: "negAlert", icon: Bell, label: "Negative Sentiment Alerts", sub: "Notify when sentiment drops below 40%" },
    { key: "emailDigest", icon: Mail, label: "Daily Email Digest", sub: "Receive a daily summary of all analyses" },
    { key: "reportReminder", icon: BarChart2, label: "Report Reminders", sub: "Get reminded when scheduled reports are ready" },
    { key: "mobileNotif", icon: Smartphone, label: "Mobile Push Notifications", sub: "Send notifications to your mobile device" },
    { key: "weeklyReport", icon: Globe, label: "Weekly Analytics Report", sub: "Receive comprehensive weekly performance summary" },
  ];

  return (
    <div className="settings-section">
      <SectionHeader icon={Bell} title="Notifications" sub="Configure how and when you receive alerts." />
      <SettingsCard>
        {rows.map((row, i) => {
          const Icon = row.icon;
          return (
            <div key={row.key} className={`settings-toggle-row ${i < rows.length - 1 ? "settings-toggle-row--bordered" : ""}`}>
              <div className="settings-toggle-info">
                <Icon size={16} />
                <div>
                  <span className="settings-toggle-label">{row.label}</span>
                  <p className="settings-toggle-sub">{row.sub}</p>
                </div>
              </div>
              <button
                className={`toggle-switch ${settings[row.key] ? "toggle-switch--on" : ""}`}
                onClick={() => toggle(row.key)}
              >
                <div className="toggle-switch__thumb" />
              </button>
            </div>
          );
        })}
      </SettingsCard>
    </div>
  );
}

// ─── Security Section ─────────────────────────────────────────────────
function SecuritySection() {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const SESSIONS = [
    { device: "Chrome on Windows", location: "Mumbai, IN", time: "Active now", current: true },
    { device: "Safari on iPhone", location: "Mumbai, IN", time: "2 hours ago", current: false },
    { device: "Firefox on Ubuntu", location: "Bangalore, IN", time: "3 days ago", current: false },
  ];

  return (
    <div className="settings-section">
      <SectionHeader icon={Shield} title="Security & Privacy" sub="Manage your password, sessions, and account data." />

      <SettingsCard>
        <h3 className="settings-card__title"><Lock size={16} style={{ display: "inline", marginRight: 8 }} />Change Password</h3>
        <div className="settings-form">
          <div className="settings-form__row">
            <label className="settings-form__label">Current Password</label>
            <input type="password" className="settings-input" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="Enter current password" />
          </div>
          <div className="settings-form__row">
            <label className="settings-form__label">New Password</label>
            <input type="password" className="settings-input" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="At least 8 characters" />
          </div>
          <div className="settings-form__row">
            <label className="settings-form__label">Confirm New Password</label>
            <input type="password" className="settings-input" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Re-enter new password" />
          </div>
        </div>
        <div className="settings-actions">
          <button className="settings-btn settings-btn--primary"><Key size={16} /> Update Password</button>
        </div>
      </SettingsCard>

      <SettingsCard>
        <h3 className="settings-card__title">Active Sessions</h3>
        {SESSIONS.map((s, i) => (
          <div key={i} className={`session-row ${i < SESSIONS.length - 1 ? "session-row--bordered" : ""}`}>
            <div className="session-info">
              <div className="session-device">{s.device}</div>
              <div className="session-meta">{s.location} · {s.time}</div>
            </div>
            {s.current
              ? <span className="session-current-badge">Current</span>
              : <button className="settings-btn settings-btn--danger-sm">Revoke</button>
            }
          </div>
        ))}
      </SettingsCard>

      <SettingsCard className="settings-card--danger">
        <h3 className="settings-card__title settings-card__title--danger">Danger Zone</h3>
        <p className="settings-danger-text">Permanently delete your account and all associated data. This action cannot be undone.</p>
        <button className="settings-btn settings-btn--danger">
          <Trash2 size={16} /> Delete My Account
        </button>
      </SettingsCard>
    </div>
  );
}

// ─── Analysis Preferences Section ────────────────────────────────────
function AnalysisPrefsSection() {
  const [defaultModel, setDefaultModel] = useState("cnn_bilstm");
  const [showConfidence, setShowConfidence] = useState(true);
  const [confidenceThreshold, setConfidenceThreshold] = useState(70);
  const [defaultFilter, setDefaultFilter] = useState("all");
  const [reportFormat, setReportFormat] = useState("pdf");

  return (
    <div className="settings-section">
      <SectionHeader icon={BarChart2} title="Analysis Preferences" sub="Configure default behaviors for sentiment analysis." />

      <SettingsCard>
        <div className="settings-form">
          <div className="settings-form__row">
            <label className="settings-form__label">Default Model</label>
            <select className="settings-select" value={defaultModel} onChange={e => setDefaultModel(e.target.value)}>
              <option value="cnn_bilstm">CNN + BiLSTM</option>
              <option value="logistic_regression">Logistic Regression</option>
            </select>
          </div>
          <div className="settings-form__row">
            <label className="settings-form__label">Sentiment Filter</label>
            <select className="settings-select" value={defaultFilter} onChange={e => setDefaultFilter(e.target.value)}>
              <option value="all">All Sentiments</option>
              <option value="positive">Positive Only</option>
              <option value="negative">Negative Only</option>
            </select>
          </div>
          <div className="settings-form__row">
            <label className="settings-form__label">Confidence Threshold: {confidenceThreshold}%</label>
            <input type="range" min="50" max="99" value={confidenceThreshold} onChange={e => setConfidenceThreshold(+e.target.value)} className="settings-range" />
            <p className="settings-form__hint">Only show results with confidence above this threshold.</p>
          </div>
          <div className="settings-form__row">
            <label className="settings-form__label">Report Format</label>
            <select className="settings-select" value={reportFormat} onChange={e => setReportFormat(e.target.value)}>
              <option value="pdf">PDF</option>
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
              <option value="xlsx">Excel (XLSX)</option>
            </select>
          </div>
        </div>

        <div className="settings-toggle-row" style={{ marginTop: 16 }}>
          <div className="settings-toggle-info">
            <BarChart2 size={16} />
            <div>
              <span className="settings-toggle-label">Show Confidence Scores</span>
              <p className="settings-toggle-sub">Display probability percentages alongside predictions</p>
            </div>
          </div>
          <button className={`toggle-switch ${showConfidence ? "toggle-switch--on" : ""}`} onClick={() => setShowConfidence(!showConfidence)}>
            <div className="toggle-switch__thumb" />
          </button>
        </div>

        <div className="settings-actions">
          <button className="settings-btn settings-btn--primary"><Save size={16} /> Save Preferences</button>
        </div>
      </SettingsCard>
    </div>
  );
}

// ─── Main Settings Page ───────────────────────────────────────────────
const SETTINGS_TABS = [
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security & Privacy", icon: Shield },
  { id: "analysis", label: "Analysis Preferences", icon: BarChart2 },
];

export default function SettingsPage({ activeTab: controlledTab, setActiveTab: setControlledTab }) {
  const [internalTab, setInternalTab] = useState("appearance");
  const activeTab = controlledTab !== undefined ? controlledTab : internalTab;
  const setActiveTab = setControlledTab || setInternalTab;
  const { compactLayout } = useTheme();

  const renderSection = () => {
    switch (activeTab) {
      case "appearance": return <AppearanceSection />;
      case "profile": return <ProfileSection />;
      case "notifications": return <NotificationsSection />;
      case "security": return <SecuritySection />;
      case "analysis": return <AnalysisPrefsSection />;
      default: return <AppearanceSection />;
    }
  };

  return (
    <div className={`dash-page ${compactLayout ? "dash-page--compact" : ""}`}>
      <div className="dash-page__header">
        <div>
          <h1 className="dash-page__title">Settings</h1>
          <p className="dash-page__subtitle">Manage your preferences, appearance, and account.</p>
        </div>
      </div>

      <div className="settings-layout">
        {/* Sidebar tabs */}
        <nav className="settings-tabs">
          {SETTINGS_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`settings-tab ${activeTab === tab.id ? "settings-tab--active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={17} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <motion.div
          key={activeTab}
          className="settings-content"
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          {renderSection()}
        </motion.div>
      </div>
    </div>
  );
}
