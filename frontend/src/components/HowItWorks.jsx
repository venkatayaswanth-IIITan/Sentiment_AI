import { motion } from "framer-motion";
import { MessageSquare, Cpu, BarChart2, Layers, Bot, ArrowRight } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: MessageSquare,
    title: "Ingest Feedback & Posts",
    description: "Input single tweets, customer reviews, or bulk import CSV files into the system.",
    accent: "#818CF8",
  },
  {
    number: "02",
    icon: Cpu,
    title: "Dual ML Inference & ABSA",
    description:
      "Process text with CNN + BiLSTM or Logistic Regression while extracting 10 brand aspects and emotions.",
    accent: "#A78BFA",
  },
  {
    number: "03",
    icon: BarChart2,
    title: "Intelligence & Alerts",
    description:
      "Receive calibrated probability scores, aspect breakdowns, spike alerts, and conversational Copilot answers.",
    accent: "#34D399",
  },
];

const architectureNodes = [
  { label: "React 18 Dashboard", sub: "User Interface", color: "#818CF8" },
  { label: "Express.js API", sub: "JWT Auth & Prisma", color: "#A78BFA" },
  { label: "FastAPI Engine", sub: "Async Microservice", color: "#60A5FA" },
  { label: "Dual ML Models", sub: "CNN+BiLSTM / LogReg", color: "#34D399" },
  { label: "AI Copilot & ABSA", sub: "Aspects & DB Grounding", color: "#F59E0B" },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="section how-it-works">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="section-title">
            How it <span className="section-title-gradient">works</span>
          </h2>
          <p className="section-subtitle">
            A simple, transparent machine learning pipeline — from tweet to sentiment.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="steps">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                className="step"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: i * 0.18, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <motion.div
                    className="step__connector"
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.18 + 0.4, duration: 0.8, ease: "easeOut" }}
                  />
                )}

                <div
                  className="step__icon-wrap"
                  style={{ borderColor: `${step.accent}40`, background: `${step.accent}12` }}
                >
                  <Icon size={22} color={step.accent} strokeWidth={1.8} />
                </div>

                <div className="step__num" style={{ color: step.accent }}>
                  {step.number}
                </div>
                <h3 className="step__title">{step.title}</h3>
                <p className="step__desc">{step.description}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Architecture Diagram */}
        <motion.div
          className="arch-diagram"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="arch-diagram__label">System Architecture</div>
          <div className="arch-diagram__nodes">
            {architectureNodes.map((node, i) => (
              <div key={node.label} className="arch-diagram__node-wrap">
                <motion.div
                  className="arch-node"
                  whileHover={{ scale: 1.06, boxShadow: `0 8px 32px ${node.color}30` }}
                  style={{ borderColor: `${node.color}35`, background: `${node.color}10` }}
                  initial={{ opacity: 0, scale: 0.85 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12, duration: 0.5 }}
                >
                  <div
                    className="arch-node__dot"
                    style={{ background: node.color }}
                  />
                  <div className="arch-node__label" style={{ color: node.color }}>
                    {node.label}
                  </div>
                  <div className="arch-node__sub">{node.sub}</div>
                </motion.div>
                {i < architectureNodes.length - 1 && (
                  <div className="arch-diagram__arrow">
                    <ArrowRight size={14} color="#475569" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
