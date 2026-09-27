import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, ChevronDown, CheckCircle2 } from "lucide-react";

const FAQ_ITEMS = [
  {
    q: "How does BrandPulse AI analyze sentiment in under 15ms?",
    a: "BrandPulse AI pairs serialized machine learning pipelines with high-throughput FastAPI inference. When text is ingested, it is preprocessed and passed to your selected model (CNN + BiLSTM deep learning or TF-IDF Logistic Regression), computing instant calibrated probability scores without GPU cold starts.",
  },
  {
    q: "What is the difference between CNN + BiLSTM and Logistic Regression?",
    a: "CNN + BiLSTM uses 1D convolutional layers to detect key phrase patterns and Bidirectional LSTM recurrent units to maintain sequential context across full sentences. Logistic Regression combines TF-IDF n-gram vectorization with mathematical sigmoid scoring for ultra-fast, lightweight statistical inference. You can choose either model at any time.",
  },
  {
    q: "How does Aspect-Based Sentiment Analysis (ABSA) work?",
    a: "Our ABSA engine evaluates 10 dedicated brand dimensions (pricing, customer service, product quality, usability, delivery, reliability, and more). It applies keyword matching with negation context windows and intensifier multipliers to pinpoint exactly which product areas receive praise or criticism.",
  },
  {
    q: "How does PulseBot AI Copilot verify records and search the web?",
    a: "PulseBot has two-way grounding: it directly queries your local Prisma database to verify whether specific reviews, brands, or complaints exist in your historical records, and utilizes Google Search grounding via Gemini to answer questions with real-time live internet information.",
  },
  {
    q: "What dataset is the platform trained on?",
    a: "BrandPulse AI models are trained on the Stanford Sentiment140 corpus, which contains 1.6 million tweets labeled for binary sentiment polarity, giving the models deep exposure to modern slang, idioms, and informal social phrasing.",
  },
  {
    q: "Can this pipeline be integrated into automated workflows?",
    a: "Yes. The backend exposes standard REST endpoints for real-time text analysis (`/api/analyses`), CSV bulk imports (`/api/reports/import`), and automated spike alerts (`/api/alerts`) that trigger when negative feedback surges.",
  },
];

export default function Faq() {
  const [openIdx, setOpenIdx] = useState(0);

  const toggle = (idx) => {
    setOpenIdx(openIdx === idx ? -1 : idx);
  };

  return (
    <section id="faq" className="section faq-section">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="section-eyebrow">
            <HelpCircle size={14} />
            <span>Machine Learning & Architecture FAQ</span>
          </div>
          <h2 className="section-title">
            Frequently asked
            <br />
            <span className="section-title-gradient">questions.</span>
          </h2>
          <p className="section-subtitle">
            Understand the science, engineering decisions, and mathematical pipeline powering SentimentAI.
          </p>
        </motion.div>

        <div className="faq-list">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openIdx === idx;
            return (
              <motion.div
                key={item.q}
                className={`faq-item ${isOpen ? "faq-item--open" : ""}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
              >
                <button
                  className="faq-question"
                  onClick={() => toggle(idx)}
                  aria-expanded={isOpen}
                >
                  <span className="faq-question__text">{item.q}</span>
                  <motion.div
                    className="faq-question__icon"
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <ChevronDown size={18} />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      className="faq-answer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <p className="faq-answer__text">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
