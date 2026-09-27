import { motion } from "framer-motion";
import { Database, Zap, Cpu, Activity, Layers, Bot } from "lucide-react";

const metrics = [
  {
    icon: Database,
    value: "1.6M+",
    label: "Training Samples",
    subtext: "Sentiment140 Twitter corpus",
    color: "#818CF8",
  },
  {
    icon: Cpu,
    value: "Dual ML",
    label: "Model Architectures",
    subtext: "CNN + BiLSTM & Logistic Regression",
    color: "#A78BFA",
  },
  {
    icon: Layers,
    value: "10 Aspects",
    label: "ABSA Dimensions",
    subtext: "Pricing, Support, Quality, Usability & more",
    color: "#60A5FA",
  },
  {
    icon: Zap,
    value: "< 15ms",
    label: "Inference Latency",
    subtext: "FastAPI asynchronous microservice",
    color: "#34D399",
  },
];

export default function MetricsStrip() {
  return (
    <section className="metrics-strip">
      <div className="container">
        <div className="metrics-strip__inner">
          {metrics.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                className="metric-box"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                whileHover={{ y: -4, borderColor: item.color }}
              >
                <div
                  className="metric-box__icon-wrap"
                  style={{ background: `${item.color}15`, color: item.color }}
                >
                  <Icon size={20} />
                </div>
                <div className="metric-box__content">
                  <div className="metric-box__value" style={{ color: item.color }}>
                    {item.value}
                  </div>
                  <div className="metric-box__label">{item.label}</div>
                  <div className="metric-box__subtext">{item.subtext}</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
