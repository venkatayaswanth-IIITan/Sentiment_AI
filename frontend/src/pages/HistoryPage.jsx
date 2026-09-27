import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import {
  History, Clock, TrendingUp, TrendingDown, Search, Filter, Trash2,
  RefreshCw, Loader2, Download, Eye, Sparkles, HelpCircle,
  Copy, Check, AlertTriangle, ShieldAlert, Tag, ArrowUpDown, X, ExternalLink
} from "lucide-react";
import { getHistory, deleteAnalysis } from "../services/apiService";

const EMOTION_META = {
  joy: { emoji: "😊", label: "Joy", color: "#10b981", bg: "rgba(16,185,129,.12)", border: "rgba(16,185,129,.3)" },
  anger: { emoji: "😡", label: "Anger", color: "#f43f5e", bg: "rgba(244,63,94,.12)", border: "rgba(244,63,94,.3)" },
  sadness: { emoji: "😢", label: "Sadness", color: "#38bdf8", bg: "rgba(56,189,248,.12)", border: "rgba(56,189,248,.3)" },
  fear: { emoji: "😨", label: "Fear", color: "#f59e0b", bg: "rgba(245,158,11,.12)", border: "rgba(245,158,11,.3)" },
  disgust: { emoji: "🤢", label: "Disgust", color: "#14b8a6", bg: "rgba(20,184,166,.12)", border: "rgba(20,184,166,.3)" },
  trust: { emoji: "🤝", label: "Trust", color: "#06b6d4", bg: "rgba(6,182,212,.12)", border: "rgba(6,182,212,.3)" },
  anticipation: { emoji: "🔮", label: "Anticipation", color: "#a855f7", bg: "rgba(168,85,247,.12)", border: "rgba(168,85,247,.3)" },
  surprise: { emoji: "😲", label: "Surprise", color: "#ec4899", bg: "rgba(236,72,153,.12)", border: "rgba(236,72,153,.3)" },
  neutral: { emoji: "😐", label: "Neutral", color: "#94a3b8", bg: "rgba(148,163,184,.12)", border: "rgba(148,163,184,.3)" },
};

const RISK_META = {
  critical: { label: "Critical Risk", color: "#f43f5e", bg: "rgba(244,63,94,.15)", border: "rgba(244,63,94,.4)" },
  high: { label: "High Risk", color: "#fb923c", bg: "rgba(251,146,60,.15)", border: "rgba(251,146,60,.4)" },
  medium: { label: "Medium", color: "#facc15", bg: "rgba(250,204,21,.15)", border: "rgba(250,204,21,.4)" },
  low: { label: "Low Risk", color: "#10b981", bg: "rgba(16,185,129,.15)", border: "rgba(16,185,129,.4)" },
};

function parseAspects(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getAIUnderstandingExplanation(item) {
  const isPos = item.sentiment === "positive";
  const conf = Math.round((item.confidence || 0.8) * 100);
  const emotion = item.emotion || "neutral";
  const intent = item.intent || "general_feedback";
  const aspectsList = parseAspects(item.aspects);
  const aspectNames = aspectsList.map(a => typeof a === "string" ? a : a.aspect).filter(Boolean);

  let explanation = `The model classified this as **${isPos ? "Positive" : "Negative"} Sentiment** with **${conf}% confidence** using ${item.model || "Logistic Regression"}.\n\n`;

  if (emotion && emotion !== "neutral") {
    explanation += `• **Emotional Tone**: Displays notable markers of **${emotion.toUpperCase()}**, reinforcing the ${isPos ? "favorable" : "critical"} sentiment.\n`;
  }

  if (intent && intent !== "general_feedback") {
    explanation += `• **Customer Intent**: Categorized as **${intent.replace(/_/g, " ").toUpperCase()}**, indicating actionable customer friction or intent.\n`;
  } else {
    explanation += `• **Customer Intent**: General opinion / sentiment reaction.\n`;
  }

  if (aspectNames.length > 0) {
    explanation += `• **Aspects Evaluated**: Specifically targets **${aspectNames.join(", ")}**.\n`;
  }

  if (item.riskLevel === "critical" || item.riskLevel === "high") {
    explanation += `• **Action Required**: ⚠️ **${item.riskLevel.toUpperCase()} RISK** — Recommended for immediate customer support or product team review.`;
  } else {
    explanation += `• **Action Required**: Routine monitoring. No immediate crisis detected.`;
  }

  return explanation;
}

export default function HistoryPage() {
  const { compactLayout } = useTheme();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Controls
  const [search, setSearch] = useState("");
  const [filterSentiment, setFilterSentiment] = useState("all");
  const [filterEmotion, setFilterEmotion] = useState("all");
  const [filterRisk, setFilterRisk] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Interaction State
  const [selectedItem, setSelectedItem] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getHistory(p, 50);
      setItems(data.items || []);
      setTotal(data.total || 0);
      setPage(p);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(1); }, [load]);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this analysis record?")) return;
    setDeleting(id);
    try {
      await deleteAnalysis(id);
      setItems(prev => prev.filter(i => i.id !== id));
      setTotal(prev => prev - 1);
      if (selectedItem?.id === id) setSelectedItem(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(null);
    }
  };

  const handleCopy = (e, text, id) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered & Sorted items
  const filtered = useMemo(() => {
    let result = items.filter(h => {
      const textMatch = h.text?.toLowerCase().includes(search.toLowerCase());
      const aspectMatch = parseAspects(h.aspects).some(a =>
        (typeof a === "string" ? a : a.aspect)?.toLowerCase().includes(search.toLowerCase())
      );
      const matchSearch = textMatch || aspectMatch || (h.intent || "").toLowerCase().includes(search.toLowerCase());

      const matchSentiment = filterSentiment === "all" || h.sentiment === filterSentiment;
      const matchEmotion = filterEmotion === "all" || (h.emotion || "neutral") === filterEmotion;
      const matchRisk = filterRisk === "all" || (h.riskLevel || "low") === filterRisk;

      return matchSearch && matchSentiment && matchEmotion && matchRisk;
    });

    if (sortBy === "newest") {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === "oldest") {
      result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === "highest_conf") {
      result.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
    } else if (sortBy === "lowest_conf") {
      result.sort((a, b) => (a.confidence || 0) - (b.confidence || 0));
    } else if (sortBy === "risk") {
      const riskOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      result.sort((a, b) => (riskOrder[b.riskLevel || "low"] || 0) - (riskOrder[a.riskLevel || "low"] || 0));
    }

    return result;
  }, [items, search, filterSentiment, filterEmotion, filterRisk, sortBy]);

  // Aggregate Stats
  const stats = useMemo(() => {
    const totalCount = items.length;
    if (!totalCount) return { positivePercent: 0, negativePercent: 0, avgConfidence: 0, criticalCount: 0 };
    const pos = items.filter(i => i.sentiment === "positive").length;
    const neg = items.filter(i => i.sentiment === "negative").length;
    const confTotal = items.reduce((acc, i) => acc + (i.confidence || 0.8), 0);
    const critical = items.filter(i => i.riskLevel === "critical" || i.riskLevel === "high").length;

    return {
      positivePercent: Math.round((pos / totalCount) * 100),
      negativePercent: Math.round((neg / totalCount) * 100),
      avgConfidence: Math.round((confTotal / totalCount) * 100),
      criticalCount: critical,
    };
  }, [items]);

  const exportCSV = () => {
    const headers = ["ID", "Text", "Sentiment", "Confidence", "Emotion", "Intent", "Aspects", "Risk Level", "Model", "Date"];
    const rows = filtered.map(i => [
      `"${i.id}"`,
      `"${(i.text || "").replace(/"/g, '""')}"`,
      `"${i.sentiment || ""}"`,
      i.confidence ? (i.confidence * 100).toFixed(1) + "%" : "N/A",
      `"${i.emotion || ""}"`,
      `"${i.intent || ""}"`,
      `"${parseAspects(i.aspects).map(a => typeof a === "string" ? a : a.aspect).join(", ")}"`,
      `"${i.riskLevel || "low"}"`,
      `"${i.model || ""}"`,
      `"${new Date(i.createdAt).toISOString()}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `analysis_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fmtDate = (iso) =>
    new Date(iso).toLocaleString(undefined, {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  return (
    <div className={`dash-page ${compactLayout ? "dash-page--compact" : ""}`}>
      {/* Header */}
      <div className="dash-page__header">
        <div>
          <h1 className="dash-page__title">Analysis History &amp; Intelligence</h1>
          <p className="dash-page__subtitle">
            Complete log of all predictions — understand sentiments, emotional drivers, and aspect breakdowns
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button
            className="dash-action-btn dash-action-btn--ghost"
            onClick={exportCSV}
            disabled={filtered.length === 0}
            title="Export filtered records as CSV"
          >
            <Download size={15} /> Export CSV
          </button>
          <button className="dash-action-btn dash-action-btn--ghost" onClick={() => load(1)} disabled={loading}>
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Summary & Comprehension KPI Strip ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 12,
        marginBottom: 16
      }}>
        <div style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          padding: "14px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 4
        }}>
          <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Total Analyzed</span>
          <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)" }}>{total}</div>
          <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{items.length} loaded in current view</span>
        </div>

        <div style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          padding: "14px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 4
        }}>
          <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Positive Ratio</span>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#10b981" }}>{stats.positivePercent}%</div>
          <div style={{ height: 4, width: "100%", background: "rgba(16,185,129,.2)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${stats.positivePercent}%`, background: "#10b981" }} />
          </div>
        </div>

        <div style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          padding: "14px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 4
        }}>
          <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Negative Ratio</span>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#f43f5e" }}>{stats.negativePercent}%</div>
          <div style={{ height: 4, width: "100%", background: "rgba(244,63,94,.2)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${stats.negativePercent}%`, background: "#f43f5e" }} />
          </div>
        </div>

        <div style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          padding: "14px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 4
        }}>
          <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Avg Confidence</span>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#818cf8" }}>{stats.avgConfidence}%</div>
          <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>High reliability threshold</span>
        </div>

        <div style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          padding: "14px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 4
        }}>
          <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Urgent / Risk Alerts</span>
          <div style={{ fontSize: 22, fontWeight: 800, color: stats.criticalCount > 0 ? "#fb923c" : "#10b981" }}>
            {stats.criticalCount}
          </div>
          <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
            {stats.criticalCount > 0 ? "Requires customer action" : "No urgent spikes"}
          </span>
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
            placeholder="Search text, aspects (pricing, quality), intent..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Sentiment Filter */}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>Sentiment:</span>
          {["all", "positive", "negative"].map(f => (
            <button
              key={f}
              onClick={() => setFilterSentiment(f)}
              style={{
                padding: "4px 10px",
                borderRadius: 20,
                fontSize: 11.5,
                fontWeight: 600,
                cursor: "pointer",
                border: filterSentiment === f ? "1px solid #6366f1" : "1px solid var(--border)",
                background: filterSentiment === f ? "rgba(99,102,241,.2)" : "transparent",
                color: filterSentiment === f ? "#a5b4fc" : "var(--text-secondary)"
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Emotion Filter */}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>Emotion:</span>
          <select
            value={filterEmotion}
            onChange={e => setFilterEmotion(e.target.value)}
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
            <option value="all" style={{ background: "#0f172a", color: "#f8fafc" }}>All Emotions</option>
            {Object.keys(EMOTION_META).map(em => (
              <option key={em} value={em} style={{ background: "#0f172a", color: "#f8fafc" }}>
                {EMOTION_META[em].emoji} {EMOTION_META[em].label}
              </option>
            ))}
          </select>
        </div>

        {/* Risk Filter */}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>Risk:</span>
          <select
            value={filterRisk}
            onChange={e => setFilterRisk(e.target.value)}
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
            <option value="all" style={{ background: "#0f172a", color: "#f8fafc" }}>All Risk Levels</option>
            <option value="critical" style={{ background: "#0f172a", color: "#f87171" }}>🔴 Critical Risk</option>
            <option value="high" style={{ background: "#0f172a", color: "#fb923c" }}>🟠 High Risk</option>
            <option value="medium" style={{ background: "#0f172a", color: "#facc15" }}>🟡 Medium</option>
            <option value="low" style={{ background: "#0f172a", color: "#4ade80" }}>🟢 Low Risk</option>
          </select>
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
            <option value="highest_conf" style={{ background: "#0f172a", color: "#f8fafc" }}>Highest Confidence</option>
            <option value="lowest_conf" style={{ background: "#0f172a", color: "#f8fafc" }}>Lowest Confidence</option>
            <option value="risk" style={{ background: "#0f172a", color: "#f8fafc" }}>Highest Risk First</option>
          </select>
        </div>
      </div>

      {error && <p style={{ color: "var(--negative)", marginBottom: 12 }}>{error}</p>}

      {/* ── History Table & Rows ── */}
      <div className="dash-card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div className="history-empty" style={{ padding: 60 }}>
            <Loader2 size={32} className="spin" color="#818cf8" />
            <p style={{ marginTop: 10 }}>Loading analysis intelligence…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="history-empty" style={{ padding: 60 }}>
            <History size={40} color="var(--text-muted)" />
            <p style={{ marginTop: 10 }}>
              {items.length === 0 ? "No analyses found. Run your first analysis in the Live Analyzer!" : "No results matching current filters."}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {filtered.map((item, i) => {
              const isPos = item.sentiment === "positive";
              const emo = EMOTION_META[item.emotion] || EMOTION_META.neutral;
              const risk = RISK_META[item.riskLevel] || RISK_META.low;
              const aspects = parseAspects(item.aspects);

              return (
                <motion.div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "36px 1fr auto",
                    alignItems: "center",
                    gap: 14,
                    padding: "16px 20px",
                    borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none",
                    cursor: "pointer",
                    transition: "background .15s",
                    background: selectedItem?.id === item.id ? "rgba(99,102,241,.08)" : "transparent"
                  }}
                  whileHover={{ background: "rgba(255,255,255,.02)" }}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                >
                  {/* Icon */}
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    display: "grid",
                    placeItems: "center",
                    background: isPos ? "rgba(16,185,129,.12)" : "rgba(244,63,94,.12)",
                    color: isPos ? "#10b981" : "#f43f5e",
                    flexShrink: 0
                  }}>
                    {isPos ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                  </div>

                  {/* Body & Tags */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                      <p style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: "var(--text-primary)",
                        margin: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}>
                        {item.text}
                      </p>
                    </div>

                    {/* Understanding Meta Pills */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      {/* Sentiment */}
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 6,
                        background: isPos ? "rgba(16,185,129,.15)" : "rgba(244,63,94,.15)",
                        color: isPos ? "#10b981" : "#f43f5e",
                        border: `1px solid ${isPos ? "rgba(16,185,129,.3)" : "rgba(244,63,94,.3)"}`
                      }}>
                        {isPos ? "Positive" : "Negative"}
                      </span>

                      {/* Confidence Score */}
                      {item.confidence !== null && item.confidence !== undefined && (
                        <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>
                          {(item.confidence * 100).toFixed(0)}% conf
                        </span>
                      )}

                      {/* Emotion Pill */}
                      <span style={{
                        fontSize: 11,
                        padding: "1px 7px",
                        borderRadius: 6,
                        background: emo.bg,
                        color: emo.color,
                        border: `1px solid ${emo.border}`,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4
                      }}>
                        <span>{emo.emoji}</span>
                        <span>{emo.label}</span>
                      </span>

                      {/* Intent Pill */}
                      {item.intent && item.intent !== "general_feedback" && (
                        <span style={{
                          fontSize: 10.5,
                          padding: "1px 7px",
                          borderRadius: 6,
                          background: "rgba(99,102,241,.12)",
                          color: "#818cf8",
                          border: "1px solid rgba(99,102,241,.25)",
                          textTransform: "capitalize"
                        }}>
                          🎯 {item.intent.replace(/_/g, " ")}
                        </span>
                      )}

                      {/* Risk Level */}
                      {item.riskLevel && item.riskLevel !== "low" && (
                        <span style={{
                          fontSize: 10.5,
                          padding: "1px 7px",
                          borderRadius: 6,
                          background: risk.bg,
                          color: risk.color,
                          border: `1px solid ${risk.border}`,
                          fontWeight: 700
                        }}>
                          ⚠️ {risk.label}
                        </span>
                      )}

                      {/* Aspect Badges */}
                      {aspects.slice(0, 2).map((a, ai) => {
                        const name = typeof a === "string" ? a : a.aspect;
                        return (
                          <span
                            key={ai}
                            style={{
                              fontSize: 10,
                              padding: "1px 6px",
                              borderRadius: 4,
                              background: "rgba(255,255,255,.05)",
                              color: "var(--text-secondary)",
                              border: "1px solid var(--border)"
                            }}
                          >
                            🏷️ {name}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, color: "var(--text-muted)" }}>
                      <Clock size={12} />
                      <span>{fmtDate(item.createdAt)}</span>
                    </div>

                    <button
                      onClick={(e) => handleCopy(e, item.text, item.id)}
                      title="Copy text"
                      style={{
                        background: "none",
                        border: "none",
                        color: copiedId === item.id ? "#10b981" : "var(--text-muted)",
                        cursor: "pointer",
                        padding: 4,
                        borderRadius: 6
                      }}
                    >
                      {copiedId === item.id ? <Check size={14} /> : <Copy size={14} />}
                    </button>

                    <button
                      onClick={(e) => handleDelete(e, item.id)}
                      disabled={deleting === item.id}
                      title="Delete analysis record"
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        padding: 4,
                        borderRadius: 6
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = "#f43f5e"}
                      onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
                    >
                      {deleting === item.id ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />}
                    </button>

                    <button
                      onClick={() => setSelectedItem(item)}
                      title="Inspect analysis details"
                      style={{
                        background: "rgba(99,102,241,.12)",
                        border: "1px solid rgba(99,102,241,.3)",
                        color: "#818cf8",
                        cursor: "pointer",
                        padding: "4px 8px",
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: 4
                      }}
                    >
                      <Eye size={12} /> Inspect
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > 50 && (
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 16
        }}>
          <button
            disabled={page === 1 || loading}
            onClick={() => load(page - 1)}
            className="dash-action-btn dash-action-btn--ghost"
          >
            ← Previous
          </button>
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            Page {page} of {Math.ceil(total / 50)}
          </span>
          <button
            disabled={page >= Math.ceil(total / 50) || loading}
            onClick={() => load(page + 1)}
            className="dash-action-btn dash-action-btn--ghost"
          >
            Next →
          </button>
        </div>
      )}

      {/* ── Deep Understanding Inspector Modal ── */}
      <AnimatePresence>
        {selectedItem && (
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
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              style={{
                width: "100%",
                maxWidth: 620,
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
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    background: selectedItem.sentiment === "positive" ? "rgba(16,185,129,.15)" : "rgba(244,63,94,.15)",
                    color: selectedItem.sentiment === "positive" ? "#10b981" : "#f43f5e",
                    display: "grid",
                    placeItems: "center"
                  }}>
                    {selectedItem.sentiment === "positive" ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                  </div>
                  <div>
                    <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>
                      Analysis Deep Understanding
                    </h2>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      Record ID: {selectedItem.id.slice(0, 13)}… · {fmtDate(selectedItem.createdAt)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 6 }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Analyzed Text Box */}
              <div style={{
                background: "rgba(255,255,255,.03)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: "14px 16px",
                marginBottom: 18
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>
                    Original Customer Text
                  </span>
                  <button
                    onClick={(e) => handleCopy(e, selectedItem.text, selectedItem.id)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 11,
                      color: copiedId === selectedItem.id ? "#10b981" : "#818cf8",
                      display: "flex",
                      alignItems: "center",
                      gap: 4
                    }}
                  >
                    {copiedId === selectedItem.id ? <Check size={12} /> : <Copy size={12} />}
                    {copiedId === selectedItem.id ? "Copied" : "Copy"}
                  </button>
                </div>
                <p style={{ fontSize: 14, color: "var(--text-primary)", lineHeight: 1.6, margin: 0 }}>
                  "{selectedItem.text}"
                </p>
              </div>

              {/* AI Understanding Narrative Box */}
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
                    Why the AI Reached This Verdict
                  </span>
                </div>
                <div
                  style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.6, whiteSpace: "pre-line" }}
                  dangerouslySetInnerHTML={{
                    __html: getAIUnderstandingExplanation(selectedItem)
                      .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#e2e8f0">$1</strong>')
                  }}
                />
              </div>

              {/* Multi-Dimensional Metrics Grid */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 12,
                marginBottom: 18
              }}>
                {/* Confidence Gauge */}
                <div style={{
                  background: "rgba(255,255,255,.03)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  padding: "12px 14px"
                }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Confidence Level</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
                    {((selectedItem.confidence || 0.8) * 100).toFixed(1)}%
                  </div>
                  <div style={{ height: 6, background: "rgba(255,255,255,.1)", borderRadius: 3, marginTop: 8, overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${(selectedItem.confidence || 0.8) * 100}%`,
                      background: selectedItem.sentiment === "positive" ? "#10b981" : "#f43f5e"
                    }} />
                  </div>
                </div>

                {/* Dominant Emotion */}
                <div style={{
                  background: "rgba(255,255,255,.03)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  padding: "12px 14px"
                }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Dominant Emotion</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: (EMOTION_META[selectedItem.emotion] || EMOTION_META.neutral).color }}>
                    {(EMOTION_META[selectedItem.emotion] || EMOTION_META.neutral).emoji} {(EMOTION_META[selectedItem.emotion] || EMOTION_META.neutral).label}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>
                    Plutchik Emotion Dimension
                  </div>
                </div>

                {/* Customer Intent */}
                <div style={{
                  background: "rgba(255,255,255,.03)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  padding: "12px 14px"
                }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Customer Intent</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#818cf8", textTransform: "capitalize" }}>
                    🎯 {(selectedItem.intent || "general_feedback").replace(/_/g, " ")}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>
                    Operational Classification
                  </div>
                </div>

                {/* Priority & Risk */}
                <div style={{
                  background: "rgba(255,255,255,.03)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  padding: "12px 14px"
                }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Risk / Urgency Level</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: (RISK_META[selectedItem.riskLevel] || RISK_META.low).color }}>
                    ⚠️ {(RISK_META[selectedItem.riskLevel] || RISK_META.low).label}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>
                    Priority Score: {((selectedItem.priorityScore || 0) * 100).toFixed(0)}/100
                  </div>
                </div>
              </div>

              {/* Aspects Extracted */}
              <div style={{
                background: "rgba(255,255,255,.03)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: "12px 16px",
                marginBottom: 18
              }}>
                <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>
                  Aspects Detected (ABSA)
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                  {parseAspects(selectedItem.aspects).length === 0 ? (
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>No specific aspect keywords isolated (general sentiment).</span>
                  ) : (
                    parseAspects(selectedItem.aspects).map((a, i) => {
                      const name = typeof a === "string" ? a : a.aspect;
                      const sent = typeof a === "object" ? a.sentiment : selectedItem.sentiment;
                      return (
                        <span
                          key={i}
                          style={{
                            fontSize: 11,
                            padding: "3px 10px",
                            borderRadius: 6,
                            background: sent === "positive" ? "rgba(16,185,129,.15)" : "rgba(244,63,94,.15)",
                            color: sent === "positive" ? "#10b981" : "#f43f5e",
                            border: `1px solid ${sent === "positive" ? "rgba(16,185,129,.3)" : "rgba(244,63,94,.3)"}`,
                            fontWeight: 600
                          }}
                        >
                          🏷️ {name} ({sent || "neutral"})
                        </span>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  Model Pipeline: <code>{selectedItem.model}</code>
                </span>
                <button
                  onClick={() => setSelectedItem(null)}
                  style={{
                    background: "linear-gradient(135deg, #6366f1, #a855f7)",
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    padding: "7px 18px",
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
