import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import {
  Bell, AlertTriangle, CheckCircle2, Info, X, RefreshCw, Loader2,
  Search, Check, CheckCheck, Trash2, ShieldAlert,
  Sparkles, ExternalLink, Copy, Zap, ArrowUpDown, Filter, ChevronRight
} from "lucide-react";
import {
  getAlerts, markAlertRead, markAllAlertsRead, clearReadAlerts,
  dismissAlert
} from "../services/apiService";

const TYPE_CONFIG = {
  negative_spike: {
    icon: AlertTriangle,
    color: "#f43f5e",
    bg: "rgba(244,63,94,.12)",
    border: "rgba(244,63,94,.35)",
    label: "Negative Spike",
    severity: "Critical",
  },
  ai_trend: {
    icon: Zap,
    color: "#f59e0b",
    bg: "rgba(245,158,11,.12)",
    border: "rgba(245,158,11,.35)",
    label: "AI Trend",
    severity: "High",
  },
  warning: {
    icon: AlertTriangle,
    color: "#fb923c",
    bg: "rgba(251,146,60,.12)",
    border: "rgba(251,146,60,.35)",
    label: "Warning",
    severity: "Medium",
  },
  success: {
    icon: CheckCircle2,
    color: "#10b981",
    bg: "rgba(16,185,129,.12)",
    border: "rgba(16,185,129,.35)",
    label: "Calibrated",
    severity: "Info",
  },
  batch: {
    icon: Info,
    color: "#06b6d4",
    bg: "rgba(6,182,212,.12)",
    border: "rgba(6,182,212,.35)",
    label: "Batch Import",
    severity: "System",
  },
  info: {
    icon: Info,
    color: "#818cf8",
    bg: "rgba(99,102,241,.12)",
    border: "rgba(99,102,241,.35)",
    label: "System Info",
    severity: "Low",
  },
};

function resolveTypeConfig(type = "", title = "") {
  const t = (type || "").toLowerCase();
  const tit = (title || "").toLowerCase();
  if (t.includes("negative") || tit.includes("negative spike")) return TYPE_CONFIG.negative_spike;
  if (t.includes("ai") || tit.includes("ai trend") || tit.includes("churn")) return TYPE_CONFIG.ai_trend;
  if (t.includes("calibrat") || tit.includes("model calibrated")) return TYPE_CONFIG.success;
  if (t.includes("batch") || tit.includes("csv")) return TYPE_CONFIG.batch;
  if (t.includes("warning")) return TYPE_CONFIG.warning;
  return TYPE_CONFIG.info;
}

export default function AlertsPage({ onNavigate }) {
  const { compactLayout } = useTheme();

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Modals & Drawers
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAlerts();
      setAlerts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleMarkRead = async (e, id) => {
    e.stopPropagation();
    try {
      await markAlertRead(id);
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
      if (selectedIncident?.id === id) {
        setSelectedIncident(prev => ({ ...prev, read: true }));
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleMarkAllRead = async () => {
    setActionLoading(true);
    try {
      await markAllAlertsRead();
      setAlerts(prev => prev.map(a => ({ ...a, read: true })));
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleClearRead = async () => {
    if (!window.confirm("Clear all acknowledged / read alerts?")) return;
    setActionLoading(true);
    try {
      await clearReadAlerts();
      setAlerts(prev => prev.filter(a => !a.read));
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDismiss = async (e, id) => {
    e.stopPropagation();
    try {
      await dismissAlert(id);
      setAlerts(prev => prev.filter(a => a.id !== id));
      if (selectedIncident?.id === id) setSelectedIncident(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCopy = (e, text, id) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered & Sorted Alerts
  const filtered = useMemo(() => {
    let result = alerts.filter(a => {
      const matchSearch =
        a.title?.toLowerCase().includes(search.toLowerCase()) ||
        a.message?.toLowerCase().includes(search.toLowerCase());

      const cfg = resolveTypeConfig(a.type, a.title);

      if (activeTab === "unread") return matchSearch && !a.read;
      if (activeTab === "negative") return matchSearch && cfg.label === "Negative Spike";
      if (activeTab === "ai") return matchSearch && cfg.label === "AI Trend";
      if (activeTab === "system") return matchSearch && (cfg.label === "Calibrated" || cfg.label === "Batch Import");

      return matchSearch;
    });

    if (sortBy === "newest") {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === "oldest") {
      result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === "unread_first") {
      result.sort((a, b) => (b.read ? 0 : 1) - (a.read ? 0 : 1));
    }

    return result;
  }, [alerts, search, activeTab, sortBy]);

  // Aggregate Stats
  const stats = useMemo(() => {
    const total = alerts.length;
    const unread = alerts.filter(a => !a.read).length;
    const negativeSpikes = alerts.filter(a => {
      const cfg = resolveTypeConfig(a.type, a.title);
      return cfg.label === "Negative Spike";
    }).length;
    const aiTrends = alerts.filter(a => {
      const cfg = resolveTypeConfig(a.type, a.title);
      return cfg.label === "AI Trend";
    }).length;

    return { total, unread, negativeSpikes, aiTrends };
  }, [alerts]);

  const fmtDate = (iso) =>
    new Date(iso).toLocaleString(undefined, {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });

  return (
    <div className={`dash-page ${compactLayout ? "dash-page--compact" : ""}`}>
      {/* Header */}
      <div className="dash-page__header">
        <div>
          <h1 className="dash-page__title">Alerts &amp; Anomaly Center</h1>
          <p className="dash-page__subtitle">
            Sentiment anomaly notifications, negative spike triggers, and AI intelligence warnings
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          {stats.unread > 0 && (
            <div className="alerts-unread-badge" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#f43f5e", display: "inline-block" }} />
              {stats.unread} unread
            </div>
          )}
          <button
            className="dash-action-btn dash-action-btn--ghost"
            onClick={handleMarkAllRead}
            disabled={stats.unread === 0 || actionLoading}
            title="Mark all as read"
          >
            <CheckCheck size={15} /> Mark All Read
          </button>
          <button
            className="dash-action-btn dash-action-btn--ghost"
            onClick={handleClearRead}
            disabled={alerts.filter(a => a.read).length === 0 || actionLoading}
            title="Clear all read alerts"
          >
            <Trash2 size={15} /> Clear Read
          </button>
          <button className="dash-action-btn dash-action-btn--ghost" onClick={load} disabled={loading}>
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {error && <p style={{ color: "var(--negative)", marginBottom: 12 }}>{error}</p>}

      {/* ── KPI Health Strip ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 12,
        marginBottom: 16
      }}>
        {/* Active Urgent */}
        <div style={{
          background: "var(--bg-card)",
          border: stats.unread > 0 ? "1px solid rgba(244,63,94,.4)" : "1px solid var(--border)",
          borderRadius: 14,
          padding: "14px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          boxShadow: stats.unread > 0 ? "0 4px 20px rgba(244,63,94,.12)" : "none"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Unread Alerts</span>
            {stats.unread > 0 && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#f43f5e" }} />}
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: stats.unread > 0 ? "#f43f5e" : "var(--text-primary)" }}>
            {stats.unread}
          </div>
          <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
            {stats.unread > 0 ? "Requires review" : "All alerts acknowledged"}
          </span>
        </div>

        {/* Negative Spikes */}
        <div style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          padding: "14px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 4
        }}>
          <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Negative Spikes</span>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#fb923c" }}>
            {stats.negativeSpikes}
          </div>
          <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>Threshold &gt;40% trigger rule</span>
        </div>

        {/* AI Trend Warnings */}
        <div style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          padding: "14px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 4
        }}>
          <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>AI Trend Warnings</span>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#f59e0b" }}>
            {stats.aiTrends}
          </div>
          <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>Churn hazard &amp; keyword clusters</span>
        </div>
      </div>

      {/* ── Filters & Controls Bar ── */}
      <div style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        padding: "12px 16px",
        marginBottom: 16,
        display: "flex",
        flexWrap: "wrap",
        gap: 12,
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        {/* Search */}
        <div style={{ position: "relative", minWidth: 220, flex: 1 }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            style={{
              width: "100%",
              padding: "8px 12px 8px 36px",
              background: "rgba(255,255,255,.04)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 13,
              color: "var(--text-primary)",
              outline: "none"
            }}
            placeholder="Search alerts by title, keyword, #hashtag..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Category Tabs */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          {[
            { id: "all", label: "All" },
            { id: "unread", label: `Unread (${stats.unread})` },
            { id: "negative", label: "🚨 Spikes" },
            { id: "ai", label: "⚡ AI Trends" },
            { id: "system", label: "⚙️ System" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "4px 12px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                border: activeTab === tab.id ? "1px solid #6366f1" : "1px solid var(--border)",
                background: activeTab === tab.id ? "rgba(99,102,241,.2)" : "transparent",
                color: activeTab === tab.id ? "#a5b4fc" : "var(--text-secondary)",
                transition: "all .15s"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <ArrowUpDown size={13} color="var(--text-muted)" />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{
              background: "#0f172a",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: 8,
              padding: "5px 10px",
              fontSize: 11.5,
              color: "#f8fafc",
              colorScheme: "dark",
              outline: "none",
              cursor: "pointer"
            }}
          >
            <option value="newest" style={{ background: "#0f172a", color: "#f8fafc" }}>Newest First</option>
            <option value="oldest" style={{ background: "#0f172a", color: "#f8fafc" }}>Oldest First</option>
            <option value="unread_first" style={{ background: "#0f172a", color: "#f8fafc" }}>Unread First</option>
          </select>
        </div>
      </div>

      {/* ── Alerts Feed List ── */}
      <div className="dash-card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div className="alerts-empty" style={{ padding: 60 }}>
            <Loader2 size={32} className="spin" color="#818cf8" />
            <p style={{ marginTop: 10 }}>Loading anomaly alerts…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="alerts-empty" style={{ padding: 60 }}>
            <Bell size={40} color="var(--text-muted)" />
            <p style={{ marginTop: 10, fontSize: 15, fontWeight: 600 }}>All caught up — no alerts in this view</p>
            <p style={{ fontSize: "0.85rem", opacity: 0.6 }}>
              {alerts.length === 0
                ? "Automatic alerts trigger when negative sentiment exceeds threshold."
                : "Try switching filter tabs or clearing your search query."}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {filtered.map((alert, i) => {
              const cfg = resolveTypeConfig(alert.type, alert.title);
              const Icon = cfg.icon;

              return (
                <motion.div
                  key={alert.id}
                  onClick={() => setSelectedIncident(alert)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "40px 1fr auto",
                    alignItems: "flex-start",
                    gap: 14,
                    padding: "16px 20px",
                    borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none",
                    cursor: "pointer",
                    background: !alert.read ? "rgba(255,255,255,.025)" : "transparent",
                    transition: "all .15s",
                    borderLeft: !alert.read ? `3px solid ${cfg.color}` : "3px solid transparent",
                  }}
                  whileHover={{ background: "rgba(255,255,255,.04)" }}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.3) }}
                >
                  {/* Icon */}
                  <div style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: cfg.bg,
                    color: cfg.color,
                    border: `1px solid ${cfg.border}`,
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0
                  }}>
                    <Icon size={18} />
                  </div>

                  {/* Body */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text-primary)" }}>
                        {alert.title}
                      </span>
                      {!alert.read && (
                        <span style={{
                          fontSize: 9.5,
                          fontWeight: 700,
                          padding: "1px 6px",
                          borderRadius: 8,
                          background: `${cfg.color}25`,
                          color: cfg.color,
                          border: `1px solid ${cfg.color}50`
                        }}>
                          NEW
                        </span>
                      )}
                      <span style={{
                        fontSize: 10,
                        padding: "1px 6px",
                        borderRadius: 6,
                        background: "rgba(255,255,255,.05)",
                        color: "var(--text-muted)",
                        border: "1px solid var(--border)"
                      }}>
                        {cfg.severity}
                      </span>
                    </div>

                    <p style={{
                      fontSize: 13.5,
                      color: "var(--text-secondary)",
                      margin: "0 0 8px",
                      lineHeight: 1.5
                    }}>
                      {alert.message}
                    </p>

                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                        {fmtDate(alert.createdAt)}
                      </span>

                      {!alert.read ? (
                        <button
                          onClick={(e) => handleMarkRead(e, alert.id)}
                          style={{
                            background: "rgba(16,185,129,.12)",
                            border: "1px solid rgba(16,185,129,.3)",
                            color: "#10b981",
                            padding: "2px 8px",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer"
                          }}
                        >
                          Mark read
                        </button>
                      ) : (
                        <span style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 3 }}>
                          <Check size={12} color="#10b981" /> Acknowledged
                        </span>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedIncident(alert);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#818cf8",
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 3,
                          padding: 0
                        }}
                      >
                        Investigate incident →
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button
                      onClick={(e) => handleCopy(e, `${alert.title}\n${alert.message}`, alert.id)}
                      title="Copy incident brief"
                      style={{
                        background: "none",
                        border: "none",
                        color: copiedId === alert.id ? "#10b981" : "var(--text-muted)",
                        cursor: "pointer",
                        padding: 6,
                        borderRadius: 6
                      }}
                    >
                      {copiedId === alert.id ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                    <button
                      onClick={(e) => handleDismiss(e, alert.id)}
                      title="Dismiss alert"
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        padding: 6,
                        borderRadius: 6
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = "#f43f5e"}
                      onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
                    >
                      <X size={15} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Deep Incident Investigation Modal ── */}
      <AnimatePresence>
        {selectedIncident && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 99999,
              background: "rgba(0,0,0,.75)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16
            }}
            onClick={() => setSelectedIncident(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              style={{
                width: "100%",
                maxWidth: 580,
                maxHeight: "90vh",
                overflowY: "auto",
                background: "var(--bg-card, #0f172a)",
                border: "1px solid var(--border, rgba(99,102,241,.3))",
                borderRadius: 20,
                boxShadow: "0 25px 60px rgba(0,0,0,.8)",
                padding: "24px 26px",
                color: "var(--text-primary)"
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              {(() => {
                const cfg = resolveTypeConfig(selectedIncident.type, selectedIncident.title);
                const Icon = cfg.icon;

                return (
                  <>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          background: cfg.bg,
                          color: cfg.color,
                          border: `1px solid ${cfg.border}`,
                          display: "grid",
                          placeItems: "center"
                        }}>
                          <Icon size={20} />
                        </div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
                              {selectedIncident.title}
                            </h2>
                            <span style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "2px 6px",
                              borderRadius: 6,
                              background: cfg.bg,
                              color: cfg.color,
                              border: `1px solid ${cfg.border}`
                            }}>
                              {cfg.severity}
                            </span>
                          </div>
                          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                            Triggered {fmtDate(selectedIncident.createdAt)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedIncident(null)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 6 }}
                      >
                        <X size={20} />
                      </button>
                    </div>

                    {/* Incident Body */}
                    <div style={{
                      background: "rgba(255,255,255,.03)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      padding: "14px 16px",
                      marginBottom: 16
                    }}>
                      <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>
                        Anomaly Description &amp; Signals
                      </span>
                      <p style={{ fontSize: 14, color: "var(--text-primary)", lineHeight: 1.6, marginTop: 6, marginBottom: 0 }}>
                        {selectedIncident.message}
                      </p>
                    </div>

                    {/* Root Cause & Tactical AI Action Plan */}
                    <div style={{
                      background: "linear-gradient(135deg, rgba(99,102,241,.12), rgba(168,85,247,.06))",
                      border: "1px solid rgba(99,102,241,.3)",
                      borderRadius: 12,
                      padding: "16px",
                      marginBottom: 18
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <Sparkles size={16} color="#818cf8" />
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#a5b4fc" }}>
                          AI Recommended Action
                        </span>
                      </div>
                      <div style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                        {cfg.label === "Negative Spike" ? (
                          <>
                            • <strong>Immediate Response:</strong> Inspect related logs in your checkout or API gateway. Look for webhook timeouts or payment integration drops.<br />
                            • <strong>Customer Care:</strong> Dispatch proactive communication to users who experienced transaction failures within the spike window.<br />
                            • <strong>Monitoring:</strong> Watch the Real-Time Forecast trend to verify if the spike recovers within the next 4 hours.
                          </>
                        ) : cfg.label === "AI Trend" ? (
                          <>
                            • <strong>Churn Prevention:</strong> Filter analysis records in History by <code>intent: churn_risk</code> to review specific customer complaints.<br />
                            • <strong>Targeted Retention:</strong> Route affected account managers to offer retention discounts or billing assistance.
                          </>
                        ) : (
                          <>
                            • <strong>System Health:</strong> Routine calibration completed successfully. ML pipelines are performing within standard confidence boundaries.
                          </>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => {
                            setSelectedIncident(null);
                            if (onNavigate) onNavigate("copilot");
                          }}
                          style={{
                            background: "rgba(99,102,241,.15)",
                            border: "1px solid rgba(99,102,241,.35)",
                            color: "#818cf8",
                            borderRadius: 8,
                            padding: "6px 14px",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 4
                          }}
                        >
                          💬 Consult Copilot
                        </button>
                        <button
                          onClick={() => {
                            setSelectedIncident(null);
                            if (onNavigate) onNavigate("history");
                          }}
                          style={{
                            background: "rgba(255,255,255,.05)",
                            border: "1px solid var(--border)",
                            color: "var(--text-secondary)",
                            borderRadius: 8,
                            padding: "6px 14px",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 4
                          }}
                        >
                          🔍 Inspect History
                        </button>
                      </div>

                      <div style={{ display: "flex", gap: 8 }}>
                        {!selectedIncident.read && (
                          <button
                            onClick={(e) => handleMarkRead(e, selectedIncident.id)}
                            style={{
                              background: "rgba(16,185,129,.15)",
                              border: "1px solid rgba(16,185,129,.35)",
                              color: "#10b981",
                              borderRadius: 8,
                              padding: "6px 14px",
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: "pointer"
                            }}
                          >
                            Mark as Acknowledged
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedIncident(null)}
                          style={{
                            background: "var(--border)",
                            color: "var(--text-primary)",
                            border: "none",
                            borderRadius: 8,
                            padding: "6px 14px",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer"
                          }}
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
