import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { Activity, TrendingUp, TrendingDown, Calendar } from "lucide-react";

const MONTHLY_DATA = [
  { month: "Apr", positive: 58, negative: 42 },
  { month: "May", positive: 63, negative: 37 },
  { month: "Jun", positive: 71, negative: 29 },
  { month: "Jul", positive: 68, negative: 32 },
  { month: "Aug", positive: 75, negative: 25 },
  { month: "Sep", positive: 64.5, negative: 35.5 },
];

const SOURCES = [
  { label: "Twitter / X", count: 1204, pct: 42, color: "#1DA1F2" },
  { label: "Product Reviews", count: 863, pct: 30, color: "#F59E0B" },
  { label: "Reddit", count: 432, pct: 15, color: "#FF4500" },
  { label: "News Articles", count: 348, pct: 13, color: "#10B981" },
];

export default function AnalyticsPage() {
  const { compactLayout } = useTheme();
  const max = Math.max(...MONTHLY_DATA.map(d => d.positive));

  return (
    <div className={`dash-page ${compactLayout ? "dash-page--compact" : ""}`}>
      <div className="dash-page__header">
        <div>
          <h1 className="dash-page__title">Analytics</h1>
          <p className="dash-page__subtitle">Detailed sentiment trends and source breakdowns</p>
        </div>
        <div className="dash-page__date-chip">
          <Calendar size={14} />
          <span>Last 6 months</span>
        </div>
      </div>

      {/* Monthly Bar Chart */}
      <motion.div className="dash-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="dash-card__header">
          <div>
            <h3 className="dash-card__title">Monthly Sentiment Trend</h3>
            <p className="dash-card__sub">Positive vs Negative per month</p>
          </div>
          <Activity size={18} className="dash-card__icon" />
        </div>
        <div className="analytics-bar-chart">
          {MONTHLY_DATA.map((d, i) => (
            <div key={d.month} className="analytics-bar-group">
              <div className="analytics-bar-pair">
                <motion.div
                  className="analytics-bar analytics-bar--pos"
                  style={{ height: `${(d.positive / max) * 140}px` }}
                  initial={{ height: 0 }}
                  animate={{ height: `${(d.positive / max) * 140}px` }}
                  transition={{ delay: i * 0.06, duration: 0.5 }}
                  title={`Positive: ${d.positive}%`}
                />
                <motion.div
                  className="analytics-bar analytics-bar--neg"
                  style={{ height: `${(d.negative / max) * 140}px` }}
                  initial={{ height: 0 }}
                  animate={{ height: `${(d.negative / max) * 140}px` }}
                  transition={{ delay: i * 0.06 + 0.05, duration: 0.5 }}
                  title={`Negative: ${d.negative}%`}
                />
              </div>
              <div className="analytics-bar-values">
                <span className="analytics-bar-val--pos">{d.positive}%</span>
                <span className="analytics-bar-val--neg">{d.negative}%</span>
              </div>
              <span className="analytics-bar-label">{d.month}</span>
            </div>
          ))}
        </div>
        <div className="analytics-legend">
          <div className="analytics-legend-item"><div className="analytics-legend-dot analytics-legend-dot--pos" /><span>Positive</span></div>
          <div className="analytics-legend-item"><div className="analytics-legend-dot analytics-legend-dot--neg" /><span>Negative</span></div>
        </div>
      </motion.div>

      {/* Source Breakdown */}
      <motion.div className="dash-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <div className="dash-card__header">
          <div>
            <h3 className="dash-card__title">Data Sources</h3>
            <p className="dash-card__sub">Analysis volume by source</p>
          </div>
        </div>
        <div className="analytics-sources">
          {SOURCES.map((s, i) => (
            <div key={s.label} className="analytics-source-row">
              <div className="analytics-source-label">
                <div className="analytics-source-dot" style={{ background: s.color }} />
                <span>{s.label}</span>
              </div>
              <div className="analytics-source-bar-wrap">
                <motion.div
                  className="analytics-source-bar"
                  style={{ background: s.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${s.pct}%` }}
                  transition={{ delay: i * 0.08 + 0.2, duration: 0.6 }}
                />
              </div>
              <div className="analytics-source-meta">
                <span>{s.count.toLocaleString()}</span>
                <strong>{s.pct}%</strong>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Quick Stats Row */}
      <div className="analytics-quick-stats">
        {[
          { label: "Peak Positive Month", value: "August", sub: "75% positive rate", icon: TrendingUp, color: "#10B981" },
          { label: "Lowest Negative Month", value: "August", sub: "Only 25% negative", icon: TrendingDown, color: "#F43F5E" },
          { label: "Total Analyses", value: "2,847", sub: "Last 6 months", icon: Activity, color: "var(--accent)" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} className="analytics-quick-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.07 }}>
              <div className="analytics-quick-icon" style={{ background: `${stat.color}20`, color: stat.color }}>
                <Icon size={20} />
              </div>
              <div>
                <div className="analytics-quick-value">{stat.value}</div>
                <div className="analytics-quick-label">{stat.label}</div>
                <div className="analytics-quick-sub">{stat.sub}</div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
