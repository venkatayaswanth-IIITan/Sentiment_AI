import { motion } from "framer-motion";
import { Code2, Server, FlaskConical, Brain, Hash, Cpu, Database, Sparkles, Layers, Bot } from "lucide-react";

const techs = [
  { icon: Code2, label: "React 18 + Vite", color: "#61DAFB" },
  { icon: Server, label: "Express & Node.js", color: "#4ADE80" },
  { icon: Server, label: "FastAPI", color: "#05998B" },
  { icon: Cpu, label: "CNN + BiLSTM", color: "#8B5CF6" },
  { icon: Brain, label: "Logistic Regression", color: "#38BDF8" },
  { icon: Layers, label: "10-Aspect ABSA", color: "#34D399" },
  { icon: Database, label: "Prisma ORM", color: "#A78BFA" },
  { icon: Bot, label: "Google Gemini AI", color: "#F43F5E" },
];

export default function About() {
  return (
    <section id="about" className="section about">
      <div className="container">
        <motion.div
          className="about__inner"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="about__copy">
            <h2 className="section-title">
              Dual machine learning engines.
              <br />
              <span className="section-title-gradient">Full-spectrum intelligence.</span>
            </h2>
            <p className="section-subtitle" style={{ textAlign: "left", maxWidth: "520px" }}>
              BrandPulse AI is trained on the{" "}
              <span className="about__highlight">Sentiment140 corpus (1.6M tweets)</span>.
              The architecture pairs deep convolutional & recurrent neural networks (
              <strong>CNN + BiLSTM</strong>) with ultra-fast statistical classifiers (
              <strong>Logistic Regression</strong>), complete with Aspect-Based Sentiment Analysis and real-time database-grounded Copilot assistance.
            </p>
          </div>

          {/* Tech badges */}
          <div className="about__badges">
            {techs.map((tech, i) => {
              const Icon = tech.icon;
              return (
                <motion.div
                  key={tech.label}
                  className="tech-badge"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.5, ease: "backOut" }}
                  whileHover={{
                    scale: 1.08,
                    borderColor: `${tech.color}50`,
                    boxShadow: `0 4px 24px ${tech.color}25`,
                  }}
                  style={{ borderColor: `${tech.color}25` }}
                >
                  <Icon size={16} color={tech.color} />
                  <span style={{ color: "#E2E8F0" }}>{tech.label}</span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
