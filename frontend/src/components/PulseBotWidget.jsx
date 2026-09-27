import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Send, Sparkles, ChevronDown, Loader2
} from "lucide-react";
import pulsebotIcon from "../assets/pulsebot.jpg";

const API_BASE = "http://localhost:5000/api/chatbot";

const QUICK_QUESTIONS = [
  "Is there data for refund or API in our database?",
  "What is the latest news and stock price of Apple?",
  "How many total analyses are in the database?",
  "Check live internet for latest AI advancements",
  "What ML models does BrandPulse AI use?",
  "What is ABSA and how does it work?",
];

function formatText(text) {
  // code blocks
  text = text.replace(/```[\w]*\n?([\s\S]*?)```/g, (_, c) =>
    `<pre style="background:rgba(0,0,0,.45);border:1px solid rgba(99,102,241,.25);border-radius:8px;padding:10px 12px;font-family:'JetBrains Mono',monospace;font-size:11px;color:#93c5fd;overflow-x:auto;margin:8px 0;line-height:1.5">${c.trim()}</pre>`
  );
  // inline code
  text = text.replace(/`([^`]+)`/g,
    `<code style="background:rgba(0,0,0,.35);padding:1px 5px;border-radius:4px;font-family:monospace;font-size:11.5px;color:#93c5fd">$1</code>`
  );
  // bold
  text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  // line breaks
  text = text.replace(/\n/g, "<br/>");
  return text;
}

export default function PulseBotWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, loading]);

  async function sendMessage(text) {
    const q = (text || input).trim();
    if (!q || loading) return;
    setInput("");
    setShowWelcome(false);
    setMsgs((p) => [...p, { role: "user", text: q }]);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q }),
      });
      const data = await res.json();
      setMsgs((p) => [
        ...p,
        {
          role: "bot",
          text: data.answer || "No answer received.",
          related: data.related,
          source: data.source,
          model: data.model,
          sources: data.sources || [],
          db_checked: data.db_checked,
          db_match: data.db_match,
        },
      ]);
    } catch {
      setMsgs((p) => [
        ...p,
        {
          role: "bot",
          text: "Cannot connect to backend. Make sure the server is running on port 5000.",
          related: false,
          source: "error",
        },
      ]);
    }
    setLoading(false);
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function clearChat() {
    setMsgs([]);
    setShowWelcome(true);
  }

  return (
    <>
      {/* ── Chat Panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 28, stiffness: 350 }}
            style={{
              position: "fixed",
              bottom: "86px",
              right: "24px",
              width: "380px",
              maxHeight: "560px",
              zIndex: 9999,
              background: "var(--surface, #0a1628)",
              border: "1px solid var(--border, rgba(99,102,241,.25))",
              borderRadius: "20px",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              boxShadow: "0 20px 60px rgba(0,0,0,.65), 0 0 0 1px rgba(99,102,241,.1)",
            }}
          >
            {/* Header */}
            <div style={{
              padding: "12px 16px",
              borderBottom: "1px solid rgba(99,102,241,.2)",
              background: "linear-gradient(135deg, rgba(99,102,241,.18), rgba(167,139,250,.08))",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <img
                  src={pulsebotIcon}
                  alt="PulseBot"
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    objectFit: "cover",
                    boxShadow: "0 0 16px rgba(99,102,241,.5)",
                    border: "1px solid rgba(167,139,250,.4)",
                    flexShrink: 0,
                  }}
                />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary, #e2e8f0)", display: "flex", alignItems: "center", gap: 6 }}>
                    PulseBot
                    <span style={{
                      fontSize: 9.5,
                      fontWeight: 700,
                      padding: "1px 6px",
                      borderRadius: 10,
                      background: "rgba(16,185,129,.15)",
                      color: "#10b981",
                      border: "1px solid rgba(16,185,129,.35)",
                    }}>
                      ✦ Live Web &amp; DB Connected
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text-muted, #94a3b8)", display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                    Live Database · Real-time Internet Grounded
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {msgs.length > 0 && (
                  <button
                    onClick={clearChat}
                    title="Clear chat"
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: "var(--text-muted, #64748b)", padding: "4px 6px",
                      borderRadius: 6, fontSize: 11, transition: "color .2s",
                    }}
                    onMouseEnter={e => e.target.style.color = "#f43f5e"}
                    onMouseLeave={e => e.target.style.color = "var(--text-muted, #64748b)"}
                  >
                    Clear
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "var(--text-muted, #64748b)", display: "grid",
                    placeItems: "center", padding: 4, borderRadius: 6,
                    transition: "color .2s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = "#e2e8f0"}
                  onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted, #64748b)"}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1,
              overflowY: "auto",
              padding: "14px 14px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}>
              {/* Welcome state */}
              {showWelcome && msgs.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    textAlign: "center",
                    padding: "16px 8px 8px",
                  }}
                >
                  <img
                    src={pulsebotIcon}
                    alt="PulseBot"
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 16,
                      objectFit: "cover",
                      boxShadow: "0 0 20px rgba(99,102,241,.45)",
                      border: "1.5px solid rgba(167,139,250,.5)",
                      margin: "0 auto 10px",
                      display: "block",
                    }}
                  />
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-primary, #e2e8f0)", marginBottom: 4 }}>
                    BrandPulse AI Smart Copilot
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted, #94a3b8)", lineHeight: 1.5, marginBottom: 12 }}>
                    Ask ANY question: verify if real data exists in the database, search the live internet for updated information, or ask about BrandPulse AI.
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
                    {QUICK_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        onClick={() => sendMessage(q)}
                        style={{
                          background: "rgba(99,102,241,.1)",
                          border: "1px solid rgba(99,102,241,.25)",
                          color: "#818cf8",
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "5px 10px",
                          borderRadius: 20,
                          cursor: "pointer",
                          transition: "all .2s",
                          fontFamily: "inherit",
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = "rgba(99,102,241,.22)";
                          e.currentTarget.style.borderColor = "#6366f1";
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = "rgba(99,102,241,.1)";
                          e.currentTarget.style.borderColor = "rgba(99,102,241,.25)";
                        }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Chat messages */}
              {msgs.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    display: "flex",
                    flexDirection: m.role === "user" ? "row-reverse" : "row",
                    gap: 7,
                    alignItems: "flex-start",
                  }}
                >
                  {/* avatar */}
                  {m.role === "bot" ? (
                    <img
                      src={pulsebotIcon}
                      alt="PulseBot"
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        objectFit: "cover",
                        boxShadow: "0 0 10px rgba(99,102,241,.35)",
                        border: "1px solid rgba(167,139,250,.3)",
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div style={{
                      width: 28, height: 28,
                      borderRadius: 8,
                      background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
                      display: "grid", placeItems: "center",
                      fontSize: 13,
                      flexShrink: 0,
                    }}>
                      👤
                    </div>
                  )}

                  {/* bubble */}
                  <div style={{ maxWidth: "80%" }}>
                    <div
                      style={{
                        padding: "9px 12px",
                        borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                        fontSize: 12.5,
                        lineHeight: 1.65,
                        ...(m.role === "user"
                          ? {
                              background: "linear-gradient(135deg, #3730a3, #4338ca)",
                              border: "1px solid rgba(99,102,241,.4)",
                              color: "white",
                            }
                          : {
                              background: "rgba(15,31,53,1)",
                              border: "1px solid rgba(99,102,241,.18)",
                              color: "var(--text-primary, #e2e8f0)",
                            }),
                      }}
                      dangerouslySetInnerHTML={{ __html: m.role === "bot" ? formatText(m.text) : m.text }}
                    />
                    {/* source and grounding badges */}
                    {m.role === "bot" && (
                      <div style={{
                        marginTop: 4, fontSize: 9.5, color: "var(--text-muted, #64748b)",
                        paddingLeft: 2, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 5,
                      }}>
                        {m.db_checked && (
                          <span style={{
                            padding: "1px 6px", borderRadius: 10, fontSize: 9, fontWeight: 700,
                            background: m.db_match ? "rgba(16,185,129,.15)" : "rgba(99,102,241,.12)",
                            color: m.db_match ? "#10b981" : "#a5b4fc",
                            border: `1px solid ${m.db_match ? "rgba(16,185,129,.35)" : "rgba(99,102,241,.25)"}`,
                          }}>
                            {m.db_match ? "💾 DB Match Found" : "💾 DB Verified"}
                          </span>
                        )}
                        {m.source === "internet_grounded" && (
                          <span style={{
                            padding: "1px 6px", borderRadius: 10, fontSize: 9, fontWeight: 700,
                            background: "rgba(14,165,233,.15)", color: "#38bdf8",
                            border: "1px solid rgba(14,165,233,.35)",
                          }}>
                            🌐 Live Web Search
                          </span>
                        )}
                        <span style={{
                          padding: "1px 6px", borderRadius: 10, fontSize: 9, fontWeight: 700,
                          background: "rgba(168,85,247,.12)", color: "#c084fc",
                          border: "1px solid rgba(168,85,247,.25)",
                        }}>
                          ✦ {m.model || 'Gemini AI'}
                        </span>

                        {/* Web Citations */}
                        {m.sources && m.sources.length > 0 && (
                          <div style={{ width: "100%", marginTop: 4, display: "flex", flexWrap: "wrap", gap: 4 }}>
                            <span style={{ fontSize: 9, color: "#94a3b8", width: "100%", fontWeight: 600 }}>Web Sources:</span>
                            {m.sources.map((s, si) => (
                              <a
                                key={si}
                                href={s.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  fontSize: 9,
                                  color: "#38bdf8",
                                  textDecoration: "none",
                                  background: "rgba(14,165,233,.08)",
                                  padding: "2px 6px",
                                  borderRadius: 4,
                                  border: "1px solid rgba(14,165,233,.22)",
                                  display: "inline-block",
                                  maxWidth: 150,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                                title={s.title}
                              >
                                🔗 {s.title || "Source"}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ display: "flex", gap: 7, alignItems: "flex-start" }}
                >
                  <img
                    src={pulsebotIcon}
                    alt="PulseBot"
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      objectFit: "cover",
                      boxShadow: "0 0 10px rgba(99,102,241,.35)",
                      border: "1px solid rgba(167,139,250,.3)",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{
                    padding: "11px 14px",
                    background: "rgba(15,31,53,1)",
                    border: "1px solid rgba(99,102,241,.18)",
                    borderRadius: "14px 14px 14px 4px",
                    display: "flex",
                    gap: 5,
                    alignItems: "center",
                  }}>
                    {[0, 0.15, 0.3].map((d, i) => (
                      <div
                        key={i}
                        style={{
                          width: 6, height: 6,
                          borderRadius: "50%",
                          background: "#818cf8",
                          animation: `bounce 1.3s ${d}s infinite`,
                        }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{
              padding: "10px 12px 12px",
              borderTop: "1px solid rgba(99,102,241,.15)",
              background: "rgba(10,22,40,.6)",
            }}>
              <div style={{
                display: "flex",
                gap: 8,
                alignItems: "flex-end",
                background: "rgba(15,31,53,.8)",
                border: "1px solid rgba(99,102,241,.2)",
                borderRadius: 12,
                padding: "8px 10px",
                transition: "border-color .2s",
              }}
                onFocus={e => e.currentTarget.style.borderColor = "#6366f1"}
                onBlur={e => e.currentTarget.style.borderColor = "rgba(99,102,241,.2)"}
              >
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Ask any question (check database or search live internet)..."
                  maxLength={1500}
                  rows={1}
                  disabled={loading}
                  style={{
                    flex: 1,
                    background: "none",
                    border: "none",
                    outline: "none",
                    color: "var(--text-primary, #e2e8f0)",
                    fontSize: 12.5,
                    fontFamily: "inherit",
                    resize: "none",
                    maxHeight: 80,
                    minHeight: 20,
                    lineHeight: 1.5,
                  }}
                  onInput={e => {
                    e.target.style.height = "auto";
                    e.target.style.height = Math.min(e.target.scrollHeight, 80) + "px";
                  }}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={loading || !input.trim()}
                  style={{
                    width: 30, height: 30,
                    borderRadius: 8,
                    background: loading || !input.trim()
                      ? "rgba(99,102,241,.2)"
                      : "linear-gradient(135deg, #6366f1, #a78bfa)",
                    border: "none",
                    cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                    display: "grid", placeItems: "center",
                    color: "white",
                    flexShrink: 0,
                    transition: "all .2s",
                    boxShadow: loading || !input.trim() ? "none" : "0 2px 10px rgba(99,102,241,.35)",
                  }}
                >
                  {loading ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={13} />}
                </button>
              </div>
              <div style={{
                fontSize: 9.5, color: "var(--text-muted, #64748b)",
                marginTop: 5, textAlign: "center",
              }}>
                Ask any question · Live DB verification &amp; real-time Google search
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Toggle Button ── */}
      <motion.button
        onClick={() => setOpen((p) => !p)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        title={open ? "Close PulseBot" : "Open PulseBot — Project Q&A Assistant"}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          width: 52,
          height: 52,
          borderRadius: 16,
          background: "none",
          border: "none",
          cursor: "pointer",
          display: "grid",
          placeItems: "center",
          zIndex: 9998,
          padding: 0,
        }}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                background: "rgba(10,22,40,.9)",
                border: "1.5px solid rgba(99,102,241,.5)",
                display: "grid",
                placeItems: "center",
                color: "#a78bfa",
                boxShadow: "0 4px 20px rgba(0,0,0,.5)",
              }}
            >
              <ChevronDown size={24} />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                overflow: "hidden",
                border: "2px solid rgba(167,139,250,.6)",
                boxShadow: "0 4px 20px rgba(99,102,241,.5), 0 0 0 3px rgba(99,102,241,.15)",
                display: "block",
              }}
            >
              <img
                src={pulsebotIcon}
                alt="PulseBot"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* unread badge */}
        {!open && msgs.length === 0 && (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              position: "absolute",
              top: -3, right: -3,
              width: 14, height: 14,
              borderRadius: "50%",
              background: "#10b981",
              border: "2px solid #040d1a",
              fontSize: 7,
              display: "grid",
              placeItems: "center",
              color: "white",
              fontWeight: 800,
            }}
          >
            AI
          </motion.div>
        )}
      </motion.button>

      {/* keyframe styles */}
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: .5; }
          50%       { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
