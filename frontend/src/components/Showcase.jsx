import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
  Cpu,
  BarChart3,
  Clock,
  CheckCircle2,
  Sliders,
  Share2
} from "lucide-react";

const CATEGORIES = [
  {
    id: "tech",
    label: "🚀 AI & Tech Releases",
    sentiment: "Overwhelmingly Positive",
    isPositive: true,
    score: 91,
    posPct: 91,
    negPct: 9,
    activeTweets: [
      {
        id: 1,
        author: "Devon Vance",
        handle: "@devon_vance",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=faces",
        text: "The new inference engine is insanely fast! Cut latency down by 80%. Our users are loving it.",
        sentiment: "Positive",
        prob: 96,
        keywords: [
          { word: "insanely fast", weight: "+2.31" },
          { word: "loving", weight: "+1.94" },
        ],
      },
      {
        id: 2,
        author: "Liam Zhao",
        handle: "@liam_zhao",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=faces",
        text: "Just completed our production migration. Documentation was crystal clear and setup took under 10 minutes.",
        sentiment: "Positive",
        prob: 93,
        keywords: [
          { word: "crystal clear", weight: "+1.88" },
          { word: "under 10 minutes", weight: "+1.12" },
        ],
      },
      {
        id: 3,
        author: "Chloe Taylor",
        handle: "@chloe_t",
        avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&h=80&fit=crop&crop=faces",
        text: "A few minor edge cases with older SDKs, but overall a massive leap forward in developer experience.",
        sentiment: "Positive",
        prob: 84,
        keywords: [
          { word: "massive leap", weight: "+2.05" },
          { word: "minor edge cases", weight: "-0.45" },
        ],
      },
    ],
    topTokens: [
      { token: "insanely fast", weight: "+2.31", pos: true },
      { token: "massive leap", weight: "+2.05", pos: true },
      { token: "loving", weight: "+1.94", pos: true },
      { token: "crystal clear", weight: "+1.88", pos: true },
      { token: "minor edge cases", weight: "-0.45", pos: false },
    ],
    zScore: "+2.84",
  },
  {
    id: "outages",
    label: "🚨 Cloud & Service Outages",
    sentiment: "Highly Critical",
    isPositive: false,
    score: 89,
    posPct: 11,
    negPct: 89,
    activeTweets: [
      {
        id: 4,
        author: "Marcus Ray",
        handle: "@marcus_ray",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=faces",
        text: "Payment gateway down again on a Friday evening! Customers unable to checkout. Zero response from support.",
        sentiment: "Negative",
        prob: 95,
        keywords: [
          { word: "down again", weight: "-2.45" },
          { word: "zero response", weight: "-2.10" },
        ],
      },
      {
        id: 5,
        author: "Sarah Jenkins",
        handle: "@sjenkins_ops",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=faces",
        text: "Status page still says 'All Systems Operational' while hundreds of users are blocked with 504 errors.",
        sentiment: "Negative",
        prob: 92,
        keywords: [
          { word: "blocked", weight: "-1.85" },
          { word: "504 errors", weight: "-1.72" },
        ],
      },
      {
        id: 6,
        author: "Kyle Martinez",
        handle: "@kmartinez",
        avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=80&h=80&fit=crop&crop=faces",
        text: "Terrible communication during downtime. We are strongly reconsidering our contract renewal.",
        sentiment: "Negative",
        prob: 88,
        keywords: [
          { word: "terrible communication", weight: "-2.55" },
          { word: "reconsidering", weight: "-1.40" },
        ],
      },
    ],
    topTokens: [
      { token: "terrible communication", weight: "-2.55", pos: false },
      { token: "down again", weight: "-2.45", pos: false },
      { token: "zero response", weight: "-2.10", pos: false },
      { token: "blocked", weight: "-1.85", pos: false },
      { token: "operational", weight: "+0.15", pos: true },
    ],
    zScore: "-2.71",
  },
  {
    id: "entertainment",
    label: "🍿 Cinema & Streaming Releases",
    sentiment: "Consensus Acclaim",
    isPositive: true,
    score: 87,
    posPct: 87,
    negPct: 13,
    activeTweets: [
      {
        id: 7,
        author: "Maya Lin",
        handle: "@mayafilm",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=faces",
        text: "An absolute visual triumph. The emotional depth and breathtaking score left the entire cinema speechless.",
        sentiment: "Positive",
        prob: 97,
        keywords: [
          { word: "visual triumph", weight: "+2.60" },
          { word: "breathtaking score", weight: "+2.40" },
        ],
      },
      {
        id: 8,
        author: "Alex Morgan",
        handle: "@alex_critics",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=faces",
        text: "Pacing drags slightly in Act 2, but the breathtaking climax completely redeems the film.",
        sentiment: "Positive",
        prob: 81,
        keywords: [
          { word: "redeems", weight: "+1.75" },
          { word: "drags", weight: "-0.95" },
        ],
      },
      {
        id: 9,
        author: "Noah Bell",
        handle: "@noah_cinemax",
        avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=80&h=80&fit=crop&crop=faces",
        text: "Superb acting performances from the entire cast. One of the strongest releases this year without question.",
        sentiment: "Positive",
        prob: 94,
        keywords: [
          { word: "superb acting", weight: "+2.15" },
          { word: "strongest releases", weight: "+1.90" },
        ],
      },
    ],
    topTokens: [
      { token: "visual triumph", weight: "+2.60", pos: true },
      { token: "breathtaking score", weight: "+2.40", pos: true },
      { token: "superb acting", weight: "+2.15", pos: true },
      { token: "redeems", weight: "+1.75", pos: true },
      { token: "drags", weight: "-0.95", pos: false },
    ],
    zScore: "+2.48",
  },
];

export default function Showcase() {
  const [selectedCatId, setSelectedCatId] = useState("tech");
  const [selectedTweetIdx, setSelectedTweetIdx] = useState(0);

  const activeCategory = CATEGORIES.find((c) => c.id === selectedCatId) || CATEGORIES[0];
  const activeTweet = activeCategory.activeTweets[selectedTweetIdx] || activeCategory.activeTweets[0];

  const isPos = activeCategory.isPositive;
  const moodColor = isPos ? "#34D399" : "#FB7185";

  return (
    <section id="showcase" className="section showcase-section">
      <div className="showcase-section__glow" />

      <div className="container">
        {/* Header */}
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="section-eyebrow">
            <Activity size={14} />
            <span>Interactive Sentiment Intelligence</span>
          </div>
          <h2 className="section-title">
            Real-time social sentiment.
            <br />
            <span className="section-title-gradient">Decoded with precision.</span>
          </h2>
          <p className="section-subtitle">
            Explore how SentimentAI categorizes social discourse, isolates high-impact emotional n-grams, and calculates mathematical probabilities.
          </p>
        </motion.div>

        {/* Category Pill Tabs */}
        <div className="showcase__tabs">
          {CATEGORIES.map((cat) => (
            <motion.button
              key={cat.id}
              className={`showcase-tab ${cat.id === selectedCatId ? "showcase-tab--active" : ""}`}
              onClick={() => {
                setSelectedCatId(cat.id);
                setSelectedTweetIdx(0);
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>{cat.label}</span>
              {cat.id === selectedCatId && (
                <motion.div
                  layoutId="showcase-active-pill"
                  className="showcase-tab__indicator"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </div>

        {/* Bento Console */}
        <motion.div
          className="showcase__bento"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          {/* Bento Tile 1: Stream Score & Mood Gauge */}
          <div className="bento-tile bento-tile--mood">
            <div className="bento-tile__header">
              <span className="bento-tile__label">Aggregate Mood Index</span>
              <span className="bento-badge" style={{ color: moodColor, borderColor: `${moodColor}40` }}>
                {isPos ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {activeCategory.sentiment}
              </span>
            </div>

            <div className="mood-gauge">
              <div className="mood-gauge__value" style={{ color: moodColor }}>
                {activeCategory.score}%
              </div>
              <div className="mood-gauge__sub">
                {isPos ? "Bullish / Favorable Ratio" : "Critical / Frustrated Ratio"}
              </div>
            </div>

            <div className="mood-bars">
              <div className="mood-bar-row">
                <span className="mood-bar-label">Positive Class</span>
                <div className="mood-bar-track">
                  <motion.div
                    className="mood-bar-fill mood-bar-fill--pos"
                    initial={{ width: 0 }}
                    animate={{ width: `${activeCategory.posPct}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
                <span className="mood-bar-val">{activeCategory.posPct}%</span>
              </div>
              <div className="mood-bar-row">
                <span className="mood-bar-label">Negative Class</span>
                <div className="mood-bar-track">
                  <motion.div
                    className="mood-bar-fill mood-bar-fill--neg"
                    initial={{ width: 0 }}
                    animate={{ width: `${activeCategory.negPct}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
                <span className="mood-bar-val">{activeCategory.negPct}%</span>
              </div>
            </div>

            <div className="bento-tile__footer">
              <span className="bento-meta">
                <Clock size={11} /> Updated in real-time
              </span>
              <span className="bento-meta">
                <Cpu size={11} /> 12ms inference
              </span>
            </div>
          </div>

          {/* Bento Tile 2: Live Stream Tweets (Clickable) */}
          <div className="bento-tile bento-tile--stream">
            <div className="bento-tile__header">
              <span className="bento-tile__label">Live Tweet Stream · Select to Inspect</span>
              <span className="bento-counter">{activeCategory.activeTweets.length} samples</span>
            </div>

            <div className="stream-tweets-list">
              {activeCategory.activeTweets.map((t, idx) => {
                const isSelected = idx === selectedTweetIdx;
                const isTweetPos = t.sentiment === "Positive";
                return (
                  <motion.div
                    key={t.id}
                    className={`stream-tweet-item ${isSelected ? "stream-tweet-item--selected" : ""}`}
                    onClick={() => setSelectedTweetIdx(idx)}
                    whileHover={{ x: 4 }}
                  >
                    <img src={t.avatar} alt={t.author} className="stream-tweet-avatar" />
                    <div className="stream-tweet-body">
                      <div className="stream-tweet-meta">
                        <span className="stream-tweet-name">{t.author}</span>
                        <span className="stream-tweet-handle">{t.handle}</span>
                        <span
                          className={`stream-tweet-tag ${
                            isTweetPos ? "stream-tweet-tag--pos" : "stream-tweet-tag--neg"
                          }`}
                        >
                          {t.prob}% {t.sentiment}
                        </span>
                      </div>
                      <p className="stream-tweet-text">"{t.text}"</p>
                      <div className="stream-tweet-keywords">
                        {t.keywords.map((kw) => (
                          <span
                            key={kw.word}
                            className={`keyword-pill ${
                              kw.weight.startsWith("+") ? "keyword-pill--pos" : "keyword-pill--neg"
                            }`}
                          >
                            {kw.word} <strong className="kw-weight">{kw.weight}</strong>
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Bento Tile 3: High-Impact TF-IDF N-grams */}
          <div className="bento-tile bento-tile--tokens">
            <div className="bento-tile__header">
              <span className="bento-tile__label">Top Sentiment Feature Weights</span>
              <span className="bento-meta">TF-IDF Vector Space</span>
            </div>

            <div className="token-weights-list">
              {activeCategory.topTokens.map((tok) => (
                <div key={tok.token} className="token-weight-row">
                  <span className="token-name">"{tok.token}"</span>
                  <div className="token-weight-track">
                    <motion.div
                      className={`token-weight-bar ${tok.pos ? "token-weight-bar--pos" : "token-weight-bar--neg"}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, Math.abs(parseFloat(tok.weight)) * 38)}%` }}
                      transition={{ duration: 0.7 }}
                    />
                  </div>
                  <span className={`token-weight-val ${tok.pos ? "text-emerald" : "text-coral"}`}>
                    {tok.weight}
                  </span>
                </div>
              ))}
            </div>

            <div className="bento-tile__footer">
              <span className="bento-disclaimer">
                Higher magnitude indicates stronger classification trigger
              </span>
            </div>
          </div>

          {/* Bento Tile 4: Mathematical Sigmoid Decision Boundary */}
          <div className="bento-tile bento-tile--sigmoid">
            <div className="bento-tile__header">
              <span className="bento-tile__label">Model Decision Boundary</span>
              <span className="bento-meta">Logistic Regression σ(z)</span>
            </div>

            <div className="sigmoid-visual">
              <div className="sigmoid-meta-row">
                <span className="sigmoid-label">Linear Logit z:</span>
                <span className="sigmoid-val" style={{ color: moodColor }}>
                  {activeCategory.zScore}
                </span>
              </div>

              {/* Animated Sigmoid Curve Representation */}
              <div className="sigmoid-track-box">
                <div className="sigmoid-line" />
                <div className="sigmoid-center-line" />
                <motion.div
                  className="sigmoid-marker"
                  animate={{
                    left: isPos ? "82%" : "18%",
                    borderColor: moodColor,
                    backgroundColor: `${moodColor}30`,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                  <span className="sigmoid-marker-dot" style={{ background: moodColor }} />
                  <span className="sigmoid-marker-tooltip" style={{ color: moodColor }}>
                    {activeTweet.prob}%
                  </span>
                </motion.div>
              </div>

              <div className="sigmoid-labels">
                <span>0.0 (Negative)</span>
                <span className="sigmoid-decision">Threshold: 0.50</span>
                <span>1.0 (Positive)</span>
              </div>
            </div>

            <div className="bento-tile__footer">
              <span className="bento-model-tag">
                Scikit-Learn Logistic Regression · Binary Classifier
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
