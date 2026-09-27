import { motion } from "framer-motion";
import { Sparkles, TrendingUp, TrendingDown, ArrowUpRight } from "lucide-react";

const TICKER_TWEETS = [
  {
    id: 1,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=faces",
    name: "Elena Rostova",
    handle: "@elena_tech",
    text: "The new release is insanely fast and delightful to use! Team did an incredible job. 🔥",
    sentiment: "Positive",
    score: 95,
  },
  {
    id: 2,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=faces",
    name: "Marcus Vance",
    handle: "@marcus_builds",
    text: "Flight delayed 6 hours with zero updates. Customer service desk is completely deserted. 😡",
    sentiment: "Negative",
    score: 93,
  },
  {
    id: 3,
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&h=80&fit=crop&crop=faces",
    name: "Sarah Chen",
    handle: "@sarahc_dev",
    text: "Just deployed our first ML pipeline with FastAPI and React. Super clean architecture! 🚀",
    sentiment: "Positive",
    score: 91,
  },
  {
    id: 4,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=faces",
    name: "David Kim",
    handle: "@dkim_ai",
    text: "App keeps crashing right after the payment screen. Lost my cart items again... terrible bug.",
    sentiment: "Negative",
    score: 89,
  },
  {
    id: 5,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=faces",
    name: "Aria Nova",
    handle: "@arianova",
    text: "This keyboard feels sublime to type on. Build quality exceeded every expectation!",
    sentiment: "Positive",
    score: 96,
  },
  {
    id: 6,
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=80&h=80&fit=crop&crop=faces",
    name: "Jordan Lee",
    handle: "@jlee_audio",
    text: "Horrible battery life on these headphones, barely lasted two hours on full charge.",
    sentiment: "Negative",
    score: 92,
  },
];

export default function LiveTicker() {
  const handleClick = () => {
    document.querySelector("#showcase")?.scrollIntoView({ behavior: "smooth" });
  };

  const duplicated = [...TICKER_TWEETS, ...TICKER_TWEETS];

  return (
    <section className="live-ticker-section">
      <div className="live-ticker__header">
        <div className="live-ticker__badge">
          <span className="live-ticker__pulse" />
          <Sparkles size={13} className="text-accent" />
          <span>Real-time Twitter Stream · Ingested & Classified In Under 15ms</span>
        </div>
      </div>

      <div className="live-ticker__viewport">
        <div className="live-ticker__fade-left" />
        <div className="live-ticker__fade-right" />

        <div className="live-ticker__track">
          {duplicated.map((item, idx) => {
            const isPos = item.sentiment === "Positive";
            return (
              <motion.div
                key={`${item.id}-${idx}`}
                className={`ticker-card ${isPos ? "ticker-card--pos" : "ticker-card--neg"}`}
                onClick={handleClick}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="ticker-card__top">
                  <img
                    src={item.avatar}
                    alt={item.name}
                    className="ticker-card__avatar"
                    loading="lazy"
                  />
                  <div className="ticker-card__author">
                    <span className="ticker-card__name">{item.name}</span>
                    <span className="ticker-card__handle">{item.handle}</span>
                  </div>

                  <div className={`ticker-card__tag ${isPos ? "tag--pos" : "tag--neg"}`}>
                    {isPos ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    <span>{item.score}% {item.sentiment}</span>
                  </div>
                </div>

                <p className="ticker-card__text">{item.text}</p>

                <div className="ticker-card__footer">
                  <span className="ticker-card__cta">
                    Inspect in showcase <ArrowUpRight size={13} />
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
