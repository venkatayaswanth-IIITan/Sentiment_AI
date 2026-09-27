import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronDown, Sparkles, RefreshCw, Cpu, Zap, CheckCircle2, Bot, Layers, Smile, Frown } from "lucide-react";

const HERO_EXAMPLES = [
  {
    author: "Elena Vance",
    handle: "@elena_vance",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=faces",
    text: "The new product release is absolutely incredible! Performance is silky smooth and intuitive.",
    highlight: "incredible!",
    sentiment: "Positive",
    isPositive: true,
    posProb: 94,
    negProb: 6,
    aspect: "Performance",
    aspectSentiment: "Positive",
    emotion: "Joy",
  },
  {
    author: "Marcus Brody",
    handle: "@marcus_b",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=faces",
    text: "Worst customer support experience ever. Waited 4 hours on hold and got disconnected!",
    highlight: "Worst customer support",
    sentiment: "Negative",
    isPositive: false,
    posProb: 8,
    negProb: 92,
    aspect: "Customer Service",
    aspectSentiment: "Negative",
    emotion: "Anger",
  },
  {
    author: "Aria Sterling",
    handle: "@ariasterling",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=faces",
    text: "Mind blown by this AI interface. It feels so futuristic, clean, and blazingly fast!",
    highlight: "Mind blown",
    sentiment: "Positive",
    isPositive: true,
    posProb: 97,
    negProb: 3,
    aspect: "Usability",
    aspectSentiment: "Positive",
    emotion: "Surprise",
  },
];

const WORDS = ["Tells a Story.", "Reveals Emotion.", "Drives Decisions.", "Unlocks Truth."];

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  }),
};

function InteractiveTweetCard() {
  const [index, setIndex] = useState(0);
  const [selectedModel, setSelectedModel] = useState("cnn_bilstm");
  const current = HERO_EXAMPLES[index];

  const handleNext = () => {
    setIndex((prev) => (prev + 1) % HERO_EXAMPLES.length);
  };

  return (
    <motion.div
      className="tweet-card"
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Floating glow */}
      <div
        className="tweet-card__glow"
        style={{
          background: current.isPositive
            ? "radial-gradient(circle at 50% 50%, rgba(52, 211, 153, 0.22), transparent 70%)"
            : "radial-gradient(circle at 50% 50%, rgba(251, 113, 133, 0.22), transparent 70%)",
        }}
      />

      {/* Header */}
      <div className="tweet-card__header">
        <img src={current.avatar} alt={current.author} className="tweet-card__avatar-img" />
        <div className="tweet-card__user-info">
          <span className="tweet-card__name">{current.author}</span>
          <span className="tweet-card__handle">{current.handle}</span>
        </div>
        <button
          className="tweet-card__switch-btn"
          onClick={handleNext}
          title="Click to test another tweet sample"
        >
          <RefreshCw size={12} className="tweet-card__switch-icon" />
          <span>Next Sample</span>
        </button>
      </div>

      {/* Model toggle pills (NO accuracy scores) */}
      <div style={{ display: "flex", gap: "6px", margin: "10px 0 6px 0", background: "rgba(255,255,255,0.03)", padding: "4px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
        <button
          onClick={() => setSelectedModel("cnn_bilstm")}
          style={{
            flex: 1,
            padding: "5px 8px",
            fontSize: "11px",
            fontWeight: 600,
            borderRadius: "6px",
            border: selectedModel === "cnn_bilstm" ? "1px solid rgba(139,92,246,0.6)" : "1px solid transparent",
            background: selectedModel === "cnn_bilstm" ? "rgba(139,92,246,0.22)" : "transparent",
            color: selectedModel === "cnn_bilstm" ? "#c4b5fd" : "#94a3b8",
            cursor: "pointer",
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px"
          }}
        >
          <Cpu size={12} /> CNN + BiLSTM
        </button>
        <button
          onClick={() => setSelectedModel("logistic_regression")}
          style={{
            flex: 1,
            padding: "5px 8px",
            fontSize: "11px",
            fontWeight: 600,
            borderRadius: "6px",
            border: selectedModel === "logistic_regression" ? "1px solid rgba(52,211,153,0.6)" : "1px solid transparent",
            background: selectedModel === "logistic_regression" ? "rgba(52,211,153,0.18)" : "transparent",
            color: selectedModel === "logistic_regression" ? "#6ee7b7" : "#94a3b8",
            cursor: "pointer",
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px"
          }}
        >
          <Zap size={12} /> Logistic Regression
        </button>
      </div>

      {/* Tweet Text with AnimatePresence */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${index}-${selectedModel}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3 }}
          className="tweet-card__content-wrap"
        >
          <p className="tweet-card__text">
            "{current.text}"
          </p>

          {/* Sentiment Badge & Aspect Tags */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center", margin: "10px 0" }}>
            <div
              className={`tweet-card__sentiment ${
                current.isPositive ? "positive" : "negative"
              }`}
            >
              <span className="tweet-card__sentiment-dot" />
              <span>{current.sentiment} Sentiment</span>
              <span className="tweet-card__confidence-chip">
                {current.isPositive ? current.posProb : current.negProb}% confidence
              </span>
            </div>

            {/* Granular ABSA Aspect Tag */}
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "3px 8px",
              borderRadius: "999px",
              fontSize: "10.5px",
              fontWeight: 500,
              background: "rgba(99,102,241,0.12)",
              color: "#a5b4fc",
              border: "1px solid rgba(99,102,241,0.25)"
            }}>
              <Layers size={11} /> {current.aspect}: {current.aspectSentiment}
            </span>

            {/* Emotion Tag */}
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "3px 8px",
              borderRadius: "999px",
              fontSize: "10.5px",
              fontWeight: 500,
              background: current.isPositive ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
              color: current.isPositive ? "#6ee7b7" : "#fca5a5",
              border: current.isPositive ? "1px solid rgba(16,185,129,0.25)" : "1px solid rgba(239,68,68,0.25)"
            }}>
              {current.isPositive ? <Smile size={11} /> : <Frown size={11} />} Emotion: {current.emotion}
            </span>
          </div>

          {/* Probability bars */}
          <div className="tweet-card__probs">
            <div className="tweet-card__prob-row">
              <span className="prob-label">Positive</span>
              <div className="tweet-card__bar-track">
                <motion.div
                  className="tweet-card__bar positive-bar"
                  initial={{ width: 0 }}
                  animate={{ width: `${current.posProb}%` }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                />
              </div>
              <span className="prob-val">{current.posProb}%</span>
            </div>
            <div className="tweet-card__prob-row">
              <span className="prob-label">Negative</span>
              <div className="tweet-card__bar-track">
                <motion.div
                  className="tweet-card__bar negative-bar"
                  initial={{ width: 0 }}
                  animate={{ width: `${current.negProb}%` }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                />
              </div>
              <span className="prob-val">{current.negProb}%</span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Model tag & micro-badges */}
      <div className="tweet-card__footer">
        <div className="tweet-card__footer-tags">
          <span className="tweet-card__model-tag">
            <Cpu size={12} /> {selectedModel === "cnn_bilstm" ? "CNN + BiLSTM Deep Learning" : "Logistic Regression · TF-IDF"}
          </span>
          <span className="tweet-card__speed-tag">
            <Zap size={11} /> {selectedModel === "cnn_bilstm" ? "14ms inference" : "11ms inference"}
          </span>
        </div>
        <div className="tweet-card__dots-indicator">
          {HERO_EXAMPLES.map((_, i) => (
            <span
              key={i}
              className={`tweet-dot ${i === index ? "active" : ""}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      </div>

      {/* Floating particles */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="tweet-card__particle"
          style={{
            top: `${15 + i * 18}%`,
            right: `${-4 - i * 2}px`,
            width: `${4 + i}px`,
            height: `${4 + i}px`,
          }}
          animate={{ y: [0, -10, 0], opacity: [0.3, 0.9, 0.3] }}
          transition={{
            duration: 2.5 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.3,
          }}
        />
      ))}
    </motion.div>
  );
}

export default function Hero() {
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % WORDS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const scrollToShowcase = () => {
    document.querySelector("#showcase")?.scrollIntoView({ behavior: "smooth" });
  };
  const scrollToHowItWorks = () => {
    document.querySelector("#how-it-works")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="home" className="hero">
      {/* Background orbs */}
      <div className="hero__bg">
        <motion.div
          className="hero__orb hero__orb--1"
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="hero__orb hero__orb--2"
          animate={{ x: [0, -25, 0], y: [0, 25, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        />
        <motion.div
          className="hero__orb hero__orb--3"
          animate={{ x: [0, 15, 0], y: [0, -15, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 6 }}
        />
        {/* Subtle grid pattern overlay */}
        <div className="hero__grid-overlay" />
      </div>

      <div className="hero__inner">
        {/* Left: Copy */}
        <div className="hero__copy">
          {/* Announcement badge */}
          <motion.div
            className="hero__badge"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
          >
            <span className="hero__badge-dot" />
            <span>Next-Gen Machine Learning · Live Sentiment Pipeline</span>
          </motion.div>

          {/* Headline with rotating word */}
          <motion.h1
            className="hero__headline"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
          >
            Every Tweet
            <br />
            <span className="hero__headline-rotating">
              <AnimatePresence mode="wait">
                <motion.span
                  key={wordIndex}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="hero__headline-gradient"
                >
                  {WORDS[wordIndex]}
                </motion.span>
              </AnimatePresence>
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            className="hero__description"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
          >
            Instantly decode opinions and emotions across customer feedback and social streams.
            Powered by deep neural networks (<strong>CNN + BiLSTM</strong>) and statistical models (<strong>Logistic Regression</strong>),
            featuring real-time aspect analysis and AI Copilot intelligence.
          </motion.p>

          {/* CTAs */}
          <motion.div
            className="hero__ctas"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={3}
          >
            <motion.button
              className="btn btn--primary"
              onClick={scrollToShowcase}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              <Sparkles size={16} />
              Explore Live Intelligence
              <ArrowRight size={16} />
            </motion.button>
            <motion.button
              className="btn btn--ghost"
              onClick={scrollToHowItWorks}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Explore Architecture
            </motion.button>
          </motion.div>

          {/* Compact feature tags */}
          <motion.div
            className="hero__info-points"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={4}
          >
            {[
              "Dual Models: CNN + BiLSTM & Logistic Regression",
              "10-Dimension Aspect-Based Sentiment (ABSA)",
              "AI Copilot with DB & Web Grounding",
              "Real-time sub-15ms inference",
            ].map((point) => (
              <div key={point} className="hero__info-point">
                <CheckCircle2 size={14} className="hero__info-check" />
                <span>{point}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right: Floating product visual */}
        <div className="hero__visual">
          <motion.div
            className="hero__visual-float"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            <InteractiveTweetCard />
          </motion.div>

          {/* Floating badge top-right */}
          <motion.div
            className="hero__floating-badge hero__floating-badge--top"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1, duration: 0.6 }}
          >
            <Zap size={14} className="text-emerald" />
            <span>FastAPI Backend Active</span>
          </motion.div>

          {/* Floating badge bottom-left */}
          <motion.div
            className="hero__floating-badge hero__floating-badge--bottom"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2, duration: 0.6 }}
          >
            <Layers size={14} className="text-accent" />
            <span>Dual ML + ABSA Intelligence</span>
          </motion.div>

          {/* Decorative ring */}
          <div className="hero__ring" />
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="hero__scroll"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        onClick={scrollToShowcase}
        style={{ cursor: "pointer" }}
      >
        <span className="hero__scroll-text">Scroll to inspect</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.6, repeat: Infinity }}
        >
          <ChevronDown size={18} />
        </motion.div>
      </motion.div>
    </section>
  );
}
