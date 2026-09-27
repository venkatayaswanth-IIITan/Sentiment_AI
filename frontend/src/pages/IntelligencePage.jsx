import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import {
  getEmotions, getIntents, getAspects, getTopics, getRootCauses, getBrandHealth, getCrisis
} from "../services/apiService";
import {
  Brain, Heart, Target, Tag, AlertTriangle, Shield,
  TrendingUp, TrendingDown, RefreshCw, Loader2, Activity,
  Zap, CheckCircle, XCircle, MinusCircle
} from "lucide-react";

const EMOTION_COLORS = {
  joy: "#10B981", anger: "#EF4444", sadness: "#6366F1", fear: "#F59E0B",
  surprise: "#8B5CF6", disgust: "#EC4899", trust: "#3B82F6", anticipation: "#F97316",
  neutral: "#94A3B8",
};

const RISK_COLORS = { low: "#10B981", medium: "#F59E0B", high: "#F97316", critical: "#EF4444" };

function SectionCard({ title, icon: Icon, children, loading, empty, color = "var(--accent)" }) {
  return (
    <motion.div className="dash-card intel-card"
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div className="dash-card__header">
        <div>
          <h3 className="dash-card__title">{title}</h3>
        </div>
        <div style={{ color }}><Icon size={18} /></div>
      </div>
      {loading ? (
        <div style={{ textAlign: "center", padding: "24px 0", opacity: 0.5 }}>
          <Loader2 size={22} className="spin" />
        </div>
      ) : empty ? (
        <div className="intel-empty">
          <Zap size={22} />
          <p>Run more analyses to unlock this insight.</p>
        </div>
      ) : children}
    </motion.div>
  );
}

function AspectBadge({ sentiment }) {
  if (sentiment === "POSITIVE") return <span className="badge badge--pos"><CheckCircle size={10} /> Positive</span>;
  if (sentiment === "NEGATIVE") return <span className="badge badge--neg"><XCircle size={10} /> Negative</span>;
  return <span className="badge badge--neu"><MinusCircle size={10} /> Neutral</span>;
}

export default function IntelligencePage() {
  const { compactLayout } = useTheme();
  const [data, setData] = useState({});
  const [loading, setLoading] = useState({});
  const [errors, setErrors] = useState({});

  const load = useCallback(async () => {
    const keys = ["emotions", "intents", "aspects", "topics", "rootCauses", "health", "crisis"];
    const fns  = [getEmotions, getIntents, getAspects, getTopics, getRootCauses, getBrandHealth, getCrisis];
    setLoading(Object.fromEntries(keys.map(k => [k, true])));

    await Promise.all(keys.map(async (key, i) => {
      try {
        const res = await fns[i]();
        setData(prev => ({ ...prev, [key]: res }));
        setErrors(prev => ({ ...prev, [key]: null }));
      } catch (e) {
        setErrors(prev => ({ ...prev, [key]: e.message }));
      } finally {
        setLoading(prev => ({ ...prev, [key]: false }));
      }
    }));
  }, []);

  useEffect(() => { load(); }, [load]);

  const emotions = data.emotions;
  const intents  = data.intents;
  const aspects  = data.aspects;
  const topics   = data.topics;
  const root     = data.rootCauses;
  const health   = data.health;
  const crisis   = data.crisis;

  return (
    <div className={`dash-page ${compactLayout ? "dash-page--compact" : ""}`}>
      <div className="dash-page__header">
        <div>
          <h1 className="dash-page__title">Intelligence Centre</h1>
          <p className="dash-page__subtitle">Deep AI-powered insights derived from your real sentiment data</p>
        </div>
        <button className="dash-action-btn dash-action-btn--ghost" onClick={load}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Brand Health + Crisis — Top Row */}
      <div className="intel-top-row">
        {/* Brand Health */}
        <SectionCard title="Brand Health Score" icon={Shield} loading={loading.health}
          empty={health?.insufficient_data} color="#10B981">
          {health && !health.insufficient_data && (
            <div className="health-score-wrap">
              <div className="health-score-ring" style={{
                background: `conic-gradient(${RISK_COLORS[
                  health.score >= 80 ? "low" : health.score >= 50 ? "medium" : health.score >= 25 ? "high" : "critical"
                ]} ${health.score * 3.6}deg, var(--border) 0deg)`
              }}>
                <div className="health-score-inner">
                  <span className="health-score-num">{health.score}</span>
                  <span className="health-score-denom">/100</span>
                </div>
              </div>
              <div className="health-stats">
                <div className="health-stat"><span>Status</span><strong style={{ textTransform: "capitalize" }}>{health.label}</strong></div>
                <div className="health-stat"><span>Positive Rate</span><strong>{health.positive_rate}%</strong></div>
                <div className="health-stat"><span>Avg Confidence</span><strong>{health.avg_confidence}%</strong></div>
                <div className="health-stat"><span>Trend</span>
                  <strong style={{ color: health.trend === "improving" ? "#10B981" : health.trend === "declining" ? "#EF4444" : "inherit" }}>
                    {health.trend === "improving" ? <TrendingUp size={14} /> : health.trend === "declining" ? <TrendingDown size={14} /> : "—"} {health.trend}
                  </strong>
                </div>
              </div>
              <p className="health-note">{health.note}</p>
            </div>
          )}
        </SectionCard>

        {/* Crisis Monitor */}
        <SectionCard title="Crisis Monitor" icon={AlertTriangle} loading={loading.crisis}
          empty={false} color={crisis?.is_crisis ? "#EF4444" : "#10B981"}>
          {crisis && (
            <div className="crisis-wrap">
              <div className={`crisis-status ${crisis.is_crisis ? "crisis-status--active" : "crisis-status--ok"}`}>
                {crisis.is_crisis ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
                <span>{crisis.is_crisis ? "Crisis Detected" : "All Clear"}</span>
              </div>
              <div className="crisis-score-bar">
                <div className="crisis-score-label">Crisis Score: {crisis.crisis_score}/100</div>
                <div className="crisis-bar-track">
                  <motion.div className="crisis-bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${crisis.crisis_score}%` }}
                    style={{ background: crisis.is_crisis ? "#EF4444" : "#10B981" }}
                    transition={{ duration: 1 }}
                  />
                </div>
              </div>
              <div className="crisis-stats">
                <div className="crisis-stat"><span>Last 24h</span><strong>{crisis.last_24h?.total || 0} analyses</strong></div>
                <div className="crisis-stat"><span>Negative 24h</span><strong style={{ color: "#EF4444" }}>{crisis.last_24h?.negative_rate || 0}%</strong></div>
                <div className="crisis-stat"><span>Last 1h</span><strong>{crisis.last_1h?.total || 0} analyses</strong></div>
                <div className="crisis-stat"><span>Critical</span><strong>{crisis.last_24h?.critical_count || 0}</strong></div>
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      {/* Emotion Distribution */}
      <SectionCard title="Emotion Distribution" icon={Heart} loading={loading.emotions}
        empty={emotions?.insufficient_data} color="#EC4899">
        {emotions && !emotions.insufficient_data && (
          <div className="emotion-grid">
            {Object.entries(emotions.distribution || {})
              .sort((a, b) => b[1].percentage - a[1].percentage)
              .map(([emotion, stats]) => (
                <div key={emotion} className="emotion-item">
                  <div className="emotion-label">
                    <span className="emotion-dot" style={{ background: EMOTION_COLORS[emotion] || "#94A3B8" }} />
                    <span style={{ textTransform: "capitalize" }}>{emotion}</span>
                  </div>
                  <div className="emotion-bar-wrap">
                    <div className="emotion-bar-track">
                      <motion.div className="emotion-bar-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${stats.percentage}%` }}
                        style={{ background: EMOTION_COLORS[emotion] || "#94A3B8" }}
                        transition={{ duration: 0.8 }}
                      />
                    </div>
                    <span className="emotion-pct">{stats.percentage}%</span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </SectionCard>

      {/* Intent + Root Cause Row */}
      <div className="intel-two-col">
        {/* Intent Breakdown */}
        <SectionCard title="Customer Intent" icon={Target} loading={loading.intents}
          empty={intents?.insufficient_data} color="#8B5CF6">
          {intents && !intents.insufficient_data && (
            <div className="intent-list">
              {Object.entries(intents.breakdown || {})
                .sort((a, b) => b[1].total - a[1].total)
                .slice(0, 6)
                .map(([intent, stats]) => (
                  <div key={intent} className="intent-item">
                    <div className="intent-header">
                      <span style={{ textTransform: "capitalize" }}>{intent.replace(/_/g, " ")}</span>
                      <span className="intent-count">{stats.total}</span>
                    </div>
                    <div className="intent-bar-track">
                      <motion.div className="intent-bar-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${stats.percentage}%` }}
                        transition={{ duration: 0.7 }}
                      />
                    </div>
                    <div className="intent-sub">
                      <span style={{ color: "#10B981" }}>{stats.positive} pos</span>
                      <span style={{ color: "#EF4444" }}>{stats.negative} neg</span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </SectionCard>

        {/* Root Cause Analysis */}
        <SectionCard title="Root Cause Analysis" icon={Brain} loading={loading.rootCauses}
          empty={root?.insufficient_data} color="#F59E0B">
          {root && !root.insufficient_data && (
            <div className="rootcause-list">
              <p className="rootcause-context">From {root.negative_count} negative analyses:</p>
              {(root.root_causes || []).slice(0, 6).map((rc, i) => (
                <div key={i} className="rootcause-item">
                  <div className="rootcause-left">
                    <span className={`rootcause-badge rootcause-badge--${rc.severity}`}>
                      {rc.severity}
                    </span>
                    <span style={{ textTransform: "capitalize" }}>{rc.category.replace(/_/g, " ")}</span>
                  </div>
                  <div className="rootcause-right">
                    <span>{rc.count}×</span>
                    <span className="rootcause-pct">{rc.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* ABSA Aspects */}
      <SectionCard title="Aspect-Based Sentiment (ABSA)" icon={Tag} loading={loading.aspects}
        empty={aspects?.insufficient_data} color="#3B82F6">
        {aspects && !aspects.insufficient_data && (
          <div className="aspects-grid">
            {Object.entries(aspects.aspects || {})
              .sort((a, b) => b[1].total - a[1].total)
              .map(([name, stats]) => (
                <div key={name} className="aspect-card">
                  <div className="aspect-card__header">
                    <span style={{ textTransform: "capitalize" }}>{name.replace(/_/g, " ")}</span>
                    <AspectBadge sentiment={stats.dominantSentiment} />
                  </div>
                  <div className="aspect-bars">
                    {[
                      { label: "Pos", val: stats.positive, color: "#10B981" },
                      { label: "Neg", val: stats.negative, color: "#EF4444" },
                      { label: "Neu", val: stats.neutral,  color: "#94A3B8" },
                    ].map(bar => (
                      <div key={bar.label} className="aspect-bar-row">
                        <span className="aspect-bar-lbl">{bar.label}</span>
                        <div className="aspect-bar-track">
                          <motion.div className="aspect-bar-fill"
                            initial={{ width: 0 }}
                            animate={{ width: `${stats.total > 0 ? (bar.val / stats.total * 100) : 0}%` }}
                            style={{ background: bar.color }}
                            transition={{ duration: 0.6 }}
                          />
                        </div>
                        <span className="aspect-bar-val">{bar.val}</span>
                      </div>
                    ))}
                  </div>
                  <div className="aspect-meta">Avg conf: {(stats.avgConfidence * 100).toFixed(0)}%</div>
                </div>
              ))}
          </div>
        )}
      </SectionCard>

      {/* Topic Discovery */}
      <SectionCard title="Topic Discovery" icon={Activity} loading={loading.topics}
        empty={topics?.insufficient_data} color="#F97316">
        {topics && !topics.insufficient_data && (
          <div className="topics-wrap">
            <p className="topics-meta">From {topics.total_analysed} analyses — top keywords:</p>
            <div className="topics-cloud">
              {(topics.topics || []).map((t, i) => (
                <motion.div key={t.topic} className="topic-chip"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                  style={{
                    fontSize: `${Math.max(12, Math.min(22, 12 + t.count * 2))}px`,
                    color: t.sentiment === "positive" ? "#10B981" : t.sentiment === "negative" ? "#EF4444" : "var(--text-secondary)",
                    opacity: 0.7 + Math.min(0.3, t.count * 0.03),
                  }}>
                  {t.topic}
                  <span className="topic-count">×{t.count}</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
