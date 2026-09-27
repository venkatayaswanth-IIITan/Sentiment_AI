import { useAuth } from "./context/AuthContext";
import { useTheme } from "./context/ThemeContext";
import Dashboard from "./pages/Dashboard";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import LiveTicker from "./components/LiveTicker";
import MetricsStrip from "./components/MetricsStrip";
import Showcase from "./components/Showcase";
import Features from "./components/Features";
import HowItWorks from "./components/HowItWorks";
import About from "./components/About";
import Faq from "./components/Faq";
import FinalCTA from "./components/FinalCTA";
import Footer from "./components/Footer";
import AuthModal from "./components/AuthModal";
import PulseBotWidget from "./components/PulseBotWidget";

export default function App() {
  const { isAuthenticated, loading } = useAuth();
  const { isDark } = useTheme();

  // Show loading state briefly
  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loading__spinner" />
      </div>
    );
  }

  // Authenticated users go to dashboard
  if (isAuthenticated) {
    return (
      <>
        <Dashboard />
        <AuthModal />
      </>
    );
  }

  // Landing page for unauthenticated visitors
  return (
    <div className="app">
      <Navbar />
      <Hero />
      <LiveTicker />
      <MetricsStrip />
      <Showcase />
      <Features />
      <HowItWorks />
      <About />
      <Faq />
      <FinalCTA />
      <Footer />
      <AuthModal />
      <PulseBotWidget />
    </div>
  );
}
