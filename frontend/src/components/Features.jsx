import { useState } from "react";
import { motion } from "framer-motion";
import { BrainCircuit, Cpu, Network, Zap, CheckCircle2, ChevronRight, Activity, Layers, Bot, Sparkles } from "lucide-react";

const features = [
  {
    id: "cnn-model",
    icon: Cpu,
    title: "CNN + BiLSTM Deep Learning",
    subtitle: "Convolutional + Recurrent Architecture",
    description:
      "Combines 1D convolutional layers for local n-gram pattern extraction with Bidirectional LSTM units to capture long-range contextual dependencies across sentence structures.",
    accent: "#8B5CF6",
    gradient: "linear-gradient(135deg, rgba(139,92,246,0.14), rgba(124,58,237,0.03))",
    border: "rgba(139,92,246,0.28)",
    glow: "rgba(139,92,246,0.22)",
    demoType: "neural",
  },
  {
    id: "lr-model",
    icon: BrainCircuit,
    title: "Trained Logistic Regression",
    subtitle: "Mathematical Binary Classification",
    description:
      "Trained on over 1.6 million Sentiment140 tweets with TF-IDF vectorization. Delivers ultra-low latency, deterministic inference, and transparent token-level attribution weights.",
    accent: "#38BDF8",
    gradient: "linear-gradient(135deg, rgba(56,189,248,0.14), rgba(14,165,233,0.03))",
    border: "rgba(56,189,248,0.28)",
    glow: "rgba(56,189,248,0.22)",
    demoType: "sigmoid",
  },
  {
    id: "absa-engine",
    icon: Layers,
    title: "10-Aspect Sentiment (ABSA)",
    subtitle: "Fine-Grained Category Breakdown",
    description:
      "Dissects feedback across 10 brand dimensions: Pricing, Customer Support, Product Quality, Usability, Delivery, Reliability, Features, and Brand Reputation with negation detection.",
    accent: "#34D399",
    gradient: "linear-gradient(135deg, rgba(52,211,153,0.14), rgba(16,185,129,0.03))",
    border: "rgba(52,211,153,0.28)",
    glow: "rgba(52,211,153,0.22)",
    demoType: "aspects",
  },
  {
    id: "copilot-engine",
    icon: Bot,
    title: "AI Copilot & Live Grounding",
    subtitle: "Local DB Verification + Web Search",
    description:
      "Ask natural questions about brand trends. PulseBot verifies records directly from your local database and grounds real-world facts with live Google Search queries.",
    accent: "#F43F5E",
    gradient: "linear-gradient(135deg, rgba(244,63,94,0.14), rgba(225,29,72,0.03))",
    border: "rgba(244,63,94,0.28)",
    glow: "rgba(244,63,94,0.22)",
    demoType: "copilot",
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 36 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function Features() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section id="features" className="section features">
      <div className="container">
        {/* Heading */}
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="section-eyebrow">
            <Activity size={14} />
            <span>Architecture & Technology Stack</span>
          </div>
          <h2 className="section-title">
            Engineered for precision.
            <br />
            <span className="section-title-gradient">Built for instant answers.</span>
          </h2>
          <p className="section-subtitle">
            Explore how modern NLP vectorization and statistical classification combine to decode human expression at scale.
          </p>
        </motion.div>

        {/* Feature Cards Grid */}
        <motion.div
          className="features__grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.title}
                className="feature-card"
                variants={cardVariants}
                whileHover={{
                  y: -8,
                  boxShadow: `0 24px 60px ${feat.glow}`,
                  borderColor: feat.border,
                }}
                style={{
                  background: feat.gradient,
                  borderColor: "rgba(255,255,255,0.08)",
                }}
              >
                {/* Icon area */}
                <div className="feature-card__top">
                  <div
                    className="feature-card__icon-wrap"
                    style={{ background: `${feat.accent}18`, border: `1px solid ${feat.accent}35` }}
                  >
                    <Icon size={24} color={feat.accent} strokeWidth={1.8} />
                  </div>
                  <span className="feature-card__badge" style={{ color: feat.accent }}>
                    0{idx + 1}
                  </span>
                </div>

                <h3 className="feature-card__title">{feat.title}</h3>
                <div className="feature-card__subtitle" style={{ color: feat.accent }}>
                  {feat.subtitle}
                </div>
                <p className="feature-card__desc">{feat.description}</p>

                {/* Interactive Card Micro-Visualizer */}
                <div className="feature-card__preview">
                  {feat.demoType === "neural" && (
                    <div className="preview-tokens" style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      <span className="token-tag token-tag--strong" style={{ background: "rgba(139,92,246,0.18)", color: "#c4b5fd", borderColor: "rgba(139,92,246,0.3)" }}>Conv1D Feature Extractor</span>
                      <span className="token-tag" style={{ background: "rgba(139,92,246,0.18)", color: "#c4b5fd", borderColor: "rgba(139,92,246,0.3)" }}>Bidirectional LSTM (128)</span>
                    </div>
                  )}

                  {feat.demoType === "sigmoid" && (
                    <div className="preview-sigmoid">
                      <div className="preview-sigmoid__bar">
                        <span className="preview-sigmoid__label">P(Positive)</span>
                        <div className="preview-sigmoid__track">
                          <motion.div
                            className="preview-sigmoid__fill"
                            animate={{ width: ["30%", "92%", "45%", "88%"] }}
                            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                          />
                        </div>
                      </div>
                      <div className="preview-sigmoid__formula">TF-IDF N-Grams · Sigmoid Threshold</div>
                    </div>
                  )}

                  {feat.demoType === "aspects" && (
                    <div className="preview-tokens" style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      <span className="token-tag token-tag--strong" style={{ background: "rgba(52,211,153,0.15)", color: "#6ee7b7", borderColor: "rgba(52,211,153,0.3)" }}>Pricing: Pos</span>
                      <span className="token-tag" style={{ background: "rgba(239,68,68,0.15)", color: "#fca5a5", borderColor: "rgba(239,68,68,0.3)" }}>Support: Neg</span>
                      <span className="token-tag" style={{ background: "rgba(52,211,153,0.15)", color: "#6ee7b7", borderColor: "rgba(52,211,153,0.3)" }}>Quality: Pos</span>
                    </div>
                  )}

                  {feat.demoType === "copilot" && (
                    <div className="preview-speed">
                      <div className="preview-speed__ping">
                        <span className="ping-dot" style={{ background: "#F43F5E" }} />
                        <span>DB Grounded · Gemini Web Search</span>
                      </div>
                      <span className="preview-speed__val" style={{ color: "#f43f5e" }}>Live Verification</span>
                    </div>
                  )}
                </div>

                {/* Bottom accent line */}
                <div
                  className="feature-card__accent-line"
                  style={{ background: `linear-gradient(90deg, ${feat.accent}80, transparent)` }}
                />
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
