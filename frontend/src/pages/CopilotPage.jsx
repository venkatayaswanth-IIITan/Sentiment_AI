import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { sendCopilotMessage } from "../services/apiService";
import { Sparkles, Send, User, Bot, Loader2, RefreshCw, ChevronDown } from "lucide-react";


const REAL_WORLD_SUGGESTIONS = [
  "🔍 Verify real-world fact: What is Apple's latest stock price and market cap?",
  "✅ Fact-check: Is the news about Apple's iPhone Duo foldable launch real?",
  "📊 Check real-world data: What is current public sentiment for Tesla?",
  "💾 Verify local database: Do we have customer refund or chargeback claims in DB?",
  "🌐 Verify latest AI data: What are the newest developments in Gemini and AI models?",
];

function TypingDots() {
  return (
    <div className="copilot-typing">
      {[0, 1, 2].map(i => (
        <motion.div key={i} className="copilot-typing__dot"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

function CopilotMessage({ msg }) {
  const isBot = msg.role === "assistant";
  return (
    <motion.div
      className={`copilot-msg ${isBot ? "copilot-msg--bot" : "copilot-msg--user"}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="copilot-msg__avatar">
        {isBot ? <Sparkles size={14} /> : <User size={14} />}
      </div>
      <div className="copilot-msg__bubble">
        <div className="copilot-msg__content" dangerouslySetInnerHTML={{
          __html: msg.content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/^## (.+)$/gm, '<h3 class="copilot-md-h3">$1</h3>')
            .replace(/^- (.+)$/gm, '<li>$1</li>')
            .replace(/\n/g, '<br/>')
        }} />
        {msg.data_context && (
          <div className="copilot-msg__meta">
            {msg.data_context.total_analyses} analyses · {msg.data_context.positive_rate}% positive
            {msg.data_context.brand_health_score !== null && ` · Health: ${msg.data_context.brand_health_score}/100`}
          </div>
        )}
        {msg.sources && msg.sources.length > 0 && (
          <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: 10, color: "var(--text-muted, #94a3b8)", fontWeight: 600 }}>Web Sources:</span>
            {msg.sources.map((s, si) => (
              <a
                key={si}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 10,
                  color: "#38bdf8",
                  textDecoration: "none",
                  background: "rgba(14,165,233,.12)",
                  padding: "2px 8px",
                  borderRadius: 4,
                  border: "1px solid rgba(14,165,233,.3)",
                  display: "inline-block",
                  maxWidth: 180,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={s.title}
              >
                🔗 {s.title || "Web Link"}
              </a>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function CopilotPage() {
  const { compactLayout } = useTheme();
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "## Welcome to AI Copilot & Real-World Fact Verifier 👋\n\nI can verify whether real-world data, news, statistics, and claims in our world are correct or not — grounded with live Google Search and your real database.\n\nAsk any question to verify data or choose a verification question below:",
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = useCallback(async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");
    setError(null);

    const userMsg = { role: "user", content: msg };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = messages.slice(-8).map(m => ({ role: m.role, content: m.content }));
      const res = await sendCopilotMessage(msg, history);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: res.answer,
        data_context: res.data_context,
        sources: res.sources || [],
      }]);
    } catch (err) {
      setError(err.message);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I encountered an error fetching your data. Please try again.",
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, messages, loading]);

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const reset = () => {
    setMessages([{
      role: "assistant",
      content: "## Chat reset 🔄\n\nAsk any question to verify real-world data, check if claims are correct or not, or inspect your database.",
    }]);
    setError(null);
  };

  return (
    <div className={`dash-page ${compactLayout ? "dash-page--compact" : ""} copilot-page`}>
      {/* Header */}
      <div className="dash-page__header">
        <div>
          <h1 className="dash-page__title">AI Copilot &amp; Fact Verifier</h1>
          <p className="dash-page__subtitle">Ask any real-world question — verify facts, check live internet data, and inspect your database</p>
        </div>
        <button className="dash-action-btn dash-action-btn--ghost" onClick={reset}>
          <RefreshCw size={15} /> New Chat
        </button>
      </div>

      {/* Chat window */}
      <div className="copilot-window">
        <div className="copilot-messages">
          {messages.map((msg, i) => <CopilotMessage key={i} msg={msg} />)}
          {loading && (
            <div className="copilot-msg copilot-msg--bot">
              <div className="copilot-msg__avatar"><Sparkles size={14} /></div>
              <div className="copilot-msg__bubble"><TypingDots /></div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions for Real Data Verification */}
        {messages.length <= 2 && (
          <div className="copilot-suggestions">
            {REAL_WORLD_SUGGESTIONS.map(s => (
              <button key={s} className="copilot-suggestion-chip" onClick={() => sendMessage(s)}>
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="copilot-input-row">
          <textarea
            ref={inputRef}
            className="copilot-input"
            placeholder="Ask any question, verify real-world data, or check if facts are correct..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
            maxLength={2000}
          />
          <button
            className="copilot-send-btn"
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
          >
            {loading ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
          </button>
        </div>

        {error && <p className="copilot-error">{error}</p>}
      </div>

      {/* Disclaimer */}
      <p className="copilot-disclaimer">
        <Sparkles size={12} /> Real-time fact verification powered by live Google Search grounding &amp; local database records.
      </p>
    </div>
  );
}
