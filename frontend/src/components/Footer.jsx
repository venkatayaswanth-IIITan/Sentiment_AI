import { Sparkles } from "lucide-react";

const footerLinks = ["Home", "Features", "How It Works", "About"];

export default function Footer() {
  const scrollTo = (id) => {
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__inner">
          {/* Brand */}
          <div className="footer__brand">
            <div className="footer__logo">
              <div className="navbar__logo-icon">
                <Sparkles size={14} />
              </div>
              <span>SentimentAI</span>
            </div>
            <p className="footer__tagline">
              Built with machine learning and a passion for meaningful insights.
            </p>
          </div>

          {/* Nav links */}
          <nav className="footer__nav">
            {footerLinks.map((label) => (
              <a
                key={label}
                href={`#${label.toLowerCase().replace(/\s+/g, "-")}`}
                className="footer__link"
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo(`#${label.toLowerCase().replace(/\s+/g, "-")}`);
                }}
              >
                {label}
              </a>
            ))}
          </nav>

          {/* Attribution */}
          <div className="footer__attribution">
            <span className="footer__tech-tag">React</span>
            <span className="footer__tech-tag">FastAPI</span>
            <span className="footer__tech-tag">Scikit-learn</span>
            <span className="footer__tech-tag">Sentiment140</span>
          </div>
        </div>

        <div className="footer__bottom">
          <span>© {new Date().getFullYear()} SentimentAI · Logistic Regression + TF-IDF</span>
        </div>
      </div>
    </footer>
  );
}
