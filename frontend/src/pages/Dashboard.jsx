import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardSidebar from "../components/DashboardSidebar";
import DashboardHeader from "../components/DashboardHeader";
import DashboardOverview from "./DashboardOverview";
import AnalysisPage from "./AnalysisPage";
import AnalyticsPage from "./AnalyticsPage";
import HistoryPage from "./HistoryPage";
import AlertsPage from "./AlertsPage";
import ReportsPage from "./ReportsPage";
import SettingsPage from "./SettingsPage";
import CopilotPage from "./CopilotPage";
import IntelligencePage from "./IntelligencePage";
import ForecastPage from "./ForecastPage";
import InsightsPage from "./InsightsPage";
import { useTheme } from "../context/ThemeContext";
import PulseBotWidget from "../components/PulseBotWidget";

const PAGE_MAP = {
  overview:     DashboardOverview,
  analysis:     AnalysisPage,
  analytics:    AnalyticsPage,
  intelligence: IntelligencePage,
  forecast:     ForecastPage,
  insights:     InsightsPage,
  copilot:      CopilotPage,
  history:      HistoryPage,
  alerts:       AlertsPage,
  reports:      ReportsPage,
  settings:     SettingsPage,
};

export default function Dashboard() {
  const [activePage, setActivePage] = useState("overview");
  const [settingsTab, setSettingsTab] = useState("appearance");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { compactLayout } = useTheme();

  const handleNavigate = (page, tab) => {
    setActivePage(page);
    if (tab) {
      setSettingsTab(tab);
    }
  };

  const PageComponent = PAGE_MAP[activePage] || DashboardOverview;

  return (
    <div className={`dashboard-shell ${sidebarCollapsed ? "dashboard-shell--collapsed" : ""}`}>
      <DashboardSidebar
        activePage={activePage}
        onNavigate={handleNavigate}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />
      <main className={`dashboard-main ${compactLayout ? "dashboard-main--compact" : ""} ${sidebarCollapsed ? "dashboard-main--collapsed-sidebar" : ""}`}>
        <DashboardHeader
          activePage={activePage}
          onNavigate={handleNavigate}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          sidebarCollapsed={sidebarCollapsed}
        />
        <div className="dashboard-content-area">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              className="dashboard-page-wrapper"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <PageComponent
                onNavigate={handleNavigate}
                activeTab={settingsTab}
                setActiveTab={setSettingsTab}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <PulseBotWidget />
    </div>
  );
}
