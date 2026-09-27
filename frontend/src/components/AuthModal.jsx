import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ShieldCheck
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function AuthModal() {
  const { authModalOpen, authModalMode, closeAuthModal, setAuthModalMode, signin, signup } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Reset form when modal opens or mode changes
  useEffect(() => {
    setError(null);
    setSuccessMsg(null);
  }, [authModalMode, authModalOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && authModalOpen) closeAuthModal();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [authModalOpen, closeAuthModal]);

  if (!authModalOpen) return null;

  const isSignUp = authModalMode === "signup";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email.trim() || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (isSignUp && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signup(name, email, password);
        setSuccessMsg("Account created! You are now signed in.");
      } else {
        await signin(email, password);
        setSuccessMsg("Signed in successfully!");
      }
    } catch (err) {
      setError(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = () => {
    setEmail("jane@brandpulse.ai");
    setPassword("Password123!");
    if (isSignUp) setName("Jane Developer");
    setError(null);
  };

  return (
    <AnimatePresence>
      <div className="auth-overlay" onClick={closeAuthModal}>
        <motion.div
          className="auth-modal"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Header */}
          <div className="auth-modal__header">
            <div className="auth-modal__title-wrap">
              <div className="auth-modal__icon">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="auth-modal__title">
                  {isSignUp ? "Create an Account" : "Welcome Back"}
                </h3>
                <p className="auth-modal__subtitle">
                  {isSignUp
                    ? "Join BrandPulse AI for real-time sentiment analysis"
                    : "Sign in to access your sentiment dashboard"}
                </p>
              </div>
            </div>
            <button
              className="auth-modal__close-btn"
              onClick={closeAuthModal}
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tab Selector */}
          <div className="auth-modal__tabs">
            <button
              type="button"
              className={`auth-modal__tab ${!isSignUp ? "auth-modal__tab--active" : ""}`}
              onClick={() => { setAuthModalMode("signin"); setError(null); }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-modal__tab ${isSignUp ? "auth-modal__tab--active" : ""}`}
              onClick={() => { setAuthModalMode("signup"); setError(null); }}
            >
              Sign Up
            </button>
          </div>

          {/* Alerts */}
          {error && (
            <motion.div
              className="auth-alert auth-alert--error"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AlertCircle size={16} className="auth-alert__icon" />
              <span>{error}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              className="auth-alert auth-alert--success"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <CheckCircle2 size={16} className="auth-alert__icon" />
              <span>{successMsg}</span>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {isSignUp && (
              <div className="auth-form__group">
                <label className="auth-form__label">Full Name</label>
                <div className="auth-form__input-wrapper">
                  <User size={18} className="auth-form__field-icon" />
                  <input
                    type="text"
                    className="auth-form__input"
                    placeholder="e.g. Sarah Connor"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                  />
                </div>
              </div>
            )}

            <div className="auth-form__group">
              <label className="auth-form__label">Email Address</label>
              <div className="auth-form__input-wrapper">
                <Mail size={18} className="auth-form__field-icon" />
                <input
                  type="email"
                  className="auth-form__input"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="auth-form__group">
              <label className="auth-form__label">Password</label>
              <div className="auth-form__input-wrapper">
                <Lock size={18} className="auth-form__field-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  className="auth-form__input auth-form__input--password"
                  placeholder={isSignUp ? "At least 6 characters" : "••••••••"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                />
                <button
                  type="button"
                  className="auth-form__toggle-pw"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="auth-form__submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="spin-icon" />
                  <span>{isSignUp ? "Creating account..." : "Signing in..."}</span>
                </>
              ) : (
                <>
                  <span>{isSignUp ? "Create Free Account" : "Sign In to Dashboard"}</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Helper */}
          <div className="auth-modal__footer">
            <div className="auth-modal__quick-demo">
              <ShieldCheck size={14} className="text-cyan" />
              <span>Testing? </span>
              <button
                type="button"
                className="auth-modal__demo-btn"
                onClick={handleDemoFill}
              >
                Autofill test credentials
              </button>
            </div>
            <div className="auth-modal__switch">
              {isSignUp ? (
                <span>
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="auth-modal__switch-link"
                    onClick={() => setAuthModalMode("signin")}
                  >
                    Sign In
                  </button>
                </span>
              ) : (
                <span>
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    className="auth-modal__switch-link"
                    onClick={() => setAuthModalMode("signup")}
                  >
                    Sign Up
                  </button>
                </span>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
