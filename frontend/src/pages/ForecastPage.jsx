import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { getForecast } from "../services/apiService";
import { TrendingUp, TrendingDown, Minus, RefreshCw, Loader2, Activity } from "lucide-react";

function MiniAreaChart({ actual = [], forecast = [] }) {
  const all = [...actual, ...forecast];
  if (all.length < 2) return null;

  const vals = all.map(p => p.positive_rate ?? p.predicted_positive_rate ?? 0);
  const maxV = Math.max(...vals, 1);
  const minV = Math.min(...vals, 0);
  const range = maxV - minV || 1;
  const W = 600, H = 160;
  const PAD = 16;
  const xScale = (i) => PAD + (i / (all.length - 1)) * (W - 2 * PAD);
  const yScale = (v) => H - PAD - ((v - minV) / range) * (H - 2 * PAD);

  const actualPoints = actual.map((p, i) => [xScale(i), yScale(p.positive_rate)]);
  const forecastPoints = forecast.map((p, i) => [xScale(actual.length - 1 + i), yScale(p.predicted_positive_rate)]);

  const toPath = (pts) => pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const toArea = (pts, bottom) => `${toPath(pts)} L${pts[pts.length - 1][0].toFixed(1)},${bottom} L${pts[0][0].toFixed(1)},${bottom} Z`;

  const joinPoint = actualPoints[actualPoints.length - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="forecast-chart" preserveAspectRatio="none">
      <defs>
        <linearGradient id="fgActual" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="fgForecast" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {[25, 50, 75, 100].map(v => {
        const y = yScale(v);
        return (
          <g key={v}>
            <line x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="4,4" />
            <text x={PAD - 4} y={y + 4} textAnchor="end" fontSize="9" fill="var(--text-secondary)">{v}%</text>
          </g>
        );
      })}

      {/* Actual area */}
      {actualPoints.length > 1 && (
        <>
          <path d={toArea(actualPoints, H - PAD)} fill="url(#fgActual)" />
          <path d={toPath(actualPoints)} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
        </>
      )}

      {/* Forecast area */}
      {forecastPoints.length > 0 && joinPoint && (
        <>
          <path d={toArea([joinPoint, ...forecastPoints], H - PAD)} fill="url(#fgForecast)" />
          <path d={toPath([joinPoint, ...forecastPoints])} fill="none" stroke="#8B5CF6" strokeWidth="2" strokeDasharray="5,4" strokeLinecap="round" />
        </>
      )}

      {/* Data point dots on actual */}
      {actualPoints.filter((_, i) => i % Math.max(1, Math.floor(actual.length / 8)) === 0).map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3" fill="var(--accent)" />
      ))}

      {/* Forecast start indicator */}
      {joinPoint && <line x1={joinPoint[0]} y1={PAD} x2={joinPoint[0]} y2={H - PAD} stroke="#8B5CF6" strokeWidth="1" strokeDasharray="3,3" opacity="0.5" />}
    </svg>
  );
}

export default function ForecastPage() {
  const { compactLayout } = useTheme();
  const [data, setData] = useState(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async (d = days) => {
    setLoading(true); setError(null);
    try {
      const res = await getForecast(d);
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { load(); }, []);

  const handleDays = (d) => { setDays(d); load(d); };

  const TREND_COLOR = data?.trend === "improving" ? "#10B981" : data?.trend === "declining" ? "#EF4444" : "var(--text-secondary)";
  const TrendIcon = data?.trend === "improving" ? TrendingUp : data?.trend === "declining" ? TrendingDown : Minus;

  return (
    <div className={`dash-page ${compactLayout ? "dash-page--compact" : ""}`}>
      <div className="dash-page__header">
        <div>
          <h1 className="dash-page__title">Sentiment Forecast</h1>
          <p className="dash-page__subtitle">Linear regression forecast based on your real historical data</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[7, 14, 30, 60, 90].map(d => (
            <button key={d}
              className={`model-chip ${days === d ? "model-chip--active" : ""}`}
              onClick={() => handleDays(d)}
            >{d}d</button>
          ))}
          <button className="dash-action-btn dash-action-btn--ghost" onClick={() => load()}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="dash-card" style={{ textAlign: "center", padding: "64px 0" }}>
          <Loader2 size={32} className="spin" style={{ opacity: 0.5 }} />
          <p style={{ marginTop: 12, opacity: 0.5 }}>Calculating forecast…</p>
        </div>
      ) : error ? (
        <div className="dash-card" style={{ textAlign: "center", padding: "32px", color: "var(--negative)" }}>
          {error}
        </div>
      ) : data?.insufficient_data ? (
        <motion.div className="dash-card" style={{ textAlign: "center", padding: "48px 24px" }}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <Activity size={40} style={{ opacity: 0.4, margin: "0 auto 16px" }} />
          <h3 style={{ marginBottom: 8 }}>Insufficient Data</h3>
          <p style={{ opacity: 0.6, maxWidth: 400, margin: "0 auto" }}>
            {data.message}
          </p>
          <div className="forecast-progress">
            <div className="forecast-progress__bar" style={{ width: `${(data.available / data.required) * 100}%` }} />
          </div>
          <p style={{ opacity: 0.5, fontSize: 13, marginTop: 8 }}>{data.available} / {data.required} analyses</p>
        </motion.div>
      ) : (
        <>
          {/* KPIs */}
          <div className="dash-kpi-grid" style={{ marginBottom: 18 }}>
            {[
              { label: "Total Analyses", value: data.total_analyses, color: "var(--accent)" },
              { label: "Trend Direction", value: <span style={{ color: TREND_COLOR, display: "flex", alignItems: "center", gap: 4 }}><TrendIcon size={16} />{data.trend}</span>, color: TREND_COLOR },
              { label: "Slope (per analysis)", value: `${data.slope > 0 ? "+" : ""}${data.slope}`, color: data.slope > 0 ? "#10B981" : "#EF4444" },
            ].map((k, i) => (
              <motion.div key={k.label} className="dash-kpi-card"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                <div className="dash-kpi-card__value" style={{ fontSize: 20 }}>{k.value}</div>
                <div className="dash-kpi-card__label">{k.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Chart */}
          <motion.div className="dash-card"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="dash-card__header">
              <div>
                <h3 className="dash-card__title">Positive Sentiment Rate</h3>
                <p className="dash-card__sub">
                  <span style={{ color: "var(--accent)" }}>— Actual</span>
                  &nbsp;&nbsp;
                  <span style={{ color: "#8B5CF6" }}>--- Forecast (7 days)</span>
                </p>
              </div>
            </div>
            <MiniAreaChart actual={data.actual || []} forecast={data.forecast || []} />
          </motion.div>

          {/* Forecast table */}
          <motion.div className="dash-card"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <div className="dash-card__header">
              <h3 className="dash-card__title">7-Day Forecast</h3>
            </div>
            <div className="dash-table">
              <div className="dash-table__head">
                <span>Date</span>
                <span>Predicted Positive Rate</span>
                <span>Signal</span>
              </div>
              {(data.forecast || []).map(f => (
                <div key={f.date} className="dash-table__row">
                  <span>{f.date}</span>
                  <div className="dash-table__score-wrap">
                    <div className="dash-table__score-bar">
                      <motion.div className="dash-table__score-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${f.predicted_positive_rate}%` }}
                        style={{ background: f.predicted_positive_rate >= 50 ? "linear-gradient(90deg,#059669,#34D399)" : "linear-gradient(90deg,#e11d48,#FB7185)" }}
                      />
                    </div>
                    <span className="dash-table__score-val">{f.predicted_positive_rate}%</span>
                  </div>
                  <span style={{ color: f.predicted_positive_rate >= 50 ? "#10B981" : "#EF4444" }}>
                    {f.predicted_positive_rate >= 50 ? "Positive" : "Negative"}
                  </span>
                </div>
              ))}
            </div>
            <p className="forecast-note">{data.note}</p>
          </motion.div>
        </>
      )}
    </div>
  );
}
