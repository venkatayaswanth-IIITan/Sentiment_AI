import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

export default function FinalCTA() {
  const scrollToShowcase = () => {
    document.querySelector("#showcase")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="section final-cta">
      {/* Glow bg */}
      <div className="final-cta__glow" />

      <div className="container">
        <motion.div
          className="final-cta__inner"
          initial={{ opacity: 0, y: 36 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="section-eyebrow" style={{ marginInline: "auto" }}>
            <Sparkles size={14} />
            <span>Next-Generation Sentiment Intelligence</span>
          </div>

          <h2 className="final-cta__headline">
            Ready to decode
            <br />
            <span className="final-cta__headline-gradient">the social conversation?</span>
          </h2>
          <p className="final-cta__description">
            Experience real-time Twitter sentiment analysis powered by Scikit-Learn Logistic Regression and TF-IDF feature vectorization.
          </p>
          <motion.button
            className="btn btn--primary btn--lg"
            onClick={scrollToShowcase}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
          >
            Explore Sentiment Showcase
            <ArrowRight size={18} />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
