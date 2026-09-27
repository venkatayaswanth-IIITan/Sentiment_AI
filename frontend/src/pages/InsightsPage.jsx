import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { getExecutiveSummary, getRecommendations } from "../services/apiService";
import {
  Lightbulb, FileText, RefreshCw, Loader2, AlertTriangle,
  CheckCircle, ArrowRight, TrendingUp, Shield, Target, Zap,
  Building, BarChart2
} from "lucide-react";

const PRIORITY_CONFIG = {
  critical: { color: "#EF4444", icon: AlertTriangle, label: "Critical" },
  high:     { color: "#F97316", icon: AlertTriangle, label: "High" },
  medium:   { color: "#F59E0B", icon: Target,        label: "Medium" },
  low:      { color: "#10B981", icon: CheckCircle,   label: "Low" },
};

function PriorityBadge({ priority }) {
  const cfg = PRIORITY_CONFIG[priority?.toLowerCase()] || PRIORITY_CONFIG.low;
  const Icon = cfg.icon;
  return (
    <span className="priority-badge" style={{ color: cfg.color, borderColor: cfg.color + "40", background: cfg.color + "15" }}>
      <Icon size={11} /> {cfg.label}
    </span>
  );
}

export default function InsightsPage() {
  const { compactLayout } = useTheme();
  const [summary, setSummary] = useState(null);
  const [recs, setRecs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, r] = await Promise.all([
        getExecutiveSummary().catch(e => ({ error: e.message })),
        getRecommendations().catch(e => ({ error: e.message })),
      ]);

      if (s.error) throw new Error(s.error);
      setSummary(s);
      setRecs(r);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading && !summary) {
    return (
      <div className={`dash-page ${compactLayout ? "dash-page--compact" : ""}`}>
        <div className="dash-page__header">
          <h1 className="dash-page__title">Executive Insights & Recommendations</h1>
        </div>
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <Loader2 size={36} className="spin" style={{ color: "var(--accent)" }} />
          <p style={{ marginTop: 16, fontSize: "0.95rem", color: "var(--text-muted)" }}>
            Synthesizing customer intelligence and generating recommendations...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`dash-page ${compactLayout ? "dash-page--compact" : ""}`}>
      {/* Top Header */}
      <div className="dash-page__header">
        <div>
          <h1 className="dash-page__title">Executive Insights & Recommendations</h1>
          <p className="dash-page__subtitle">
            AI-driven strategic analysis and actionable roadmaps derived from verified feedback
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button className="dash-action-btn dash-action-btn--ghost" onClick={loadData} disabled={loading}>
            <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: "14px 18px", borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171", marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* Strategic Narrative / Executive Summary Card */}
      {summary && !summary.insufficient_data && (
        <motion.div className="dash-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="dash-card__header">
            <div>
              <h3 className="dash-card__title">Executive Intelligence Briefing</h3>
              <p className="dash-card__sub">
                Generated {new Date(summary.generated_at).toLocaleString()} · {summary.period}
              </p>
            </div>
            <FileText size={18} className="dash-card__icon" />
          </div>

          {/* Strategic High-Level Narrative */}
          {summary.strategic_narrative && (
            <div
              style={{
                margin: "12px 0 18px",
                padding: "14px 18px",
                borderRadius: "10px",
                background: "var(--surface-hover)",
                borderLeft: "4px solid var(--accent)",
                fontSize: "0.95rem",
                lineHeight: "1.6",
                color: "var(--text)",
                fontWeight: 500,
              }}
            >
              {summary.strategic_narrative}
            </div>
          )}

          {/* Brand Health & Outlook Strip */}
          {summary.brand_health && !summary.brand_health.insufficient_data && (
            <div className="exec-health-strip" style={{ marginBottom: 16 }}>
              <Shield size={14} />
              <span>
                Brand Health: <strong>{summary.brand_health.score}/100</strong> ({summary.brand_health.label})
              </span>
              <span style={{ color: summary.brand_health.trend === "improving" ? "#10B981" : summary.brand_health.trend === "declining" ? "#EF4444" : "inherit" }}>
                <TrendingUp size={13} /> {summary.brand_health.trend}
              </span>
              {summary.sentiment_outlook && (
                <span style={{ marginLeft: "auto", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  Outlook: <strong style={{ color: "var(--accent)", textTransform: "capitalize" }}>{summary.sentiment_outlook.replace(/_/g, " ")}</strong>
                </span>
              )}
            </div>
          )}

          {/* Key Intelligence Bullets */}
          <ul className="exec-bullets">
            {(summary.summary_bullets || []).map((b, i) => (
              <motion.li key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}>
                <ArrowRight size={14} style={{ flexShrink: 0, color: "var(--accent)", marginTop: 3 }} />
                <span dangerouslySetInnerHTML={{ __html: b.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
              </motion.li>
            ))}
          </ul>

          {/* Top intents & emotions */}
          <div className="exec-tags-row" style={{ marginTop: 20 }}>
            {summary.top_intents?.length > 0 && (
              <div className="exec-tags">
                <span className="exec-tags-label">Key Customer Intents:</span>
                {summary.top_intents.map(t => (
                  <span key={t.intent} className="exec-tag">
                    {t.intent.replace(/_/g, " ")} <strong>×{t.count}</strong>
                  </span>
                ))}
              </div>
            )}
            {summary.top_emotions?.length > 0 && (
              <div className="exec-tags">
                <span className="exec-tags-label">Emotional Drivers:</span>
                {summary.top_emotions.map(e => (
                  <span key={e.emotion} className="exec-tag">
                    {e.emotion} <strong>×{e.count}</strong>
                  </span>
                ))}
              </div>
            )}
          </div>

          <p className="forecast-note" style={{ marginTop: 16 }}>{summary.note}</p>
        </motion.div>
      )}

      {summary?.insufficient_data && (
        <div className="dash-card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <Zap size={32} style={{ opacity: 0.4, marginBottom: 12 }} />
          <h3 style={{ fontSize: "1.1rem", marginBottom: 6 }}>Insufficient Analysis History</h3>
          <p style={{ color: "var(--text-muted)", maxWidth: 440, margin: "0 auto" }}>
            {summary.message}
          </p>
        </div>
      )}

      {/* Recommendations Section */}
      {recs && (
        <motion.div className="dash-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="dash-card__header">
            <div>
              <h3 className="dash-card__title">Prioritized Strategic Recommendations</h3>
              <p className="dash-card__sub">Action items prioritized by urgency, sentiment velocity, and retention impact</p>
            </div>
            <Lightbulb size={18} className="dash-card__icon" />
          </div>

          <div className="recs-list">
            {(recs.recommendations || []).map((rec, i) => (
              <motion.div
                key={rec.id || i}
                className="rec-item"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.06 }}
                style={{
                  borderLeft: `4px solid ${
                    rec.priority === "critical"
                      ? "#EF4444"
                      : rec.priority === "high"
                      ? "#F97316"
                      : rec.priority === "medium"
                      ? "#F59E0B"
                      : "#10B981"
                  }`,
                }}
              >
                <div className="rec-item__header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <PriorityBadge priority={rec.priority} />
                    <span className="rec-item__category">{rec.category || "General"}</span>
                  </div>

                  {rec.owner && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      <Building size={12} /> {rec.owner}
                    </span>
                  )}
                </div>

                <h4 className="rec-item__title" style={{ fontSize: "1rem", fontWeight: 600, margin: "6px 0" }}>
                  {rec.title}
                </h4>

                <p className="rec-item__desc" style={{ fontSize: "0.88rem", lineHeight: "1.5", color: "var(--text-muted)" }}>
                  {rec.description}
                </p>

                {rec.expected_impact && (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      marginTop: 8,
                      marginBottom: 10,
                      padding: "4px 8px",
                      borderRadius: 6,
                      fontSize: "0.78rem",
                      background: "rgba(16,185,129,0.1)",
                      color: "#10b981",
                      fontWeight: 500,
                    }}
                  >
                    <BarChart2 size={13} /> Projected Impact: {rec.expected_impact}
                  </div>
                )}

                <div className="rec-item__action" style={{ marginTop: 6, paddingTop: 10, borderTop: "1px dashed var(--border)" }}>
                  <ArrowRight size={14} style={{ color: "var(--accent)", flexShrink: 0 }} />
                  <span style={{ fontWeight: 500, color: "var(--text)" }}>{rec.action}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
