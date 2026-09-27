import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { FileText, Download, Upload, Loader2, CheckCircle2, AlertCircle, BarChart2, Tag } from "lucide-react";
import { importCsv, downloadReport } from "../services/apiService";

const MODELS = [
  { value: "cnn_bilstm",          label: "CNN + BiLSTM" },
  { value: "logistic_regression", label: "Logistic Regression" },
];

export default function ReportsPage() {
  const { compactLayout } = useTheme();
  const fileRef = useRef(null);

  const [model,      setModel]      = useState("cnn_bilstm");
  const [importing,  setImporting]  = useState(false);
  const [exporting,  setExporting]  = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [error,      setError]      = useState(null);

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setImporting(true);
    setError(null);
    setImportResult(null);

    try {
      const data = await importCsv(file, model);
      setImportResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    try {
      await downloadReport();
    } catch (err) {
      setError(err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className={`dash-page ${compactLayout ? "dash-page--compact" : ""}`}>
      <div className="dash-page__header">
        <div>
          <h1 className="dash-page__title">Reports</h1>
          <p className="dash-page__subtitle">Import CSV datasets for bulk analysis, and export your results</p>
        </div>
      </div>

      {error && (
        <motion.div className="dash-card" style={{ borderLeft: "4px solid var(--negative)", padding: "14px 18px", marginBottom: 18 }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", color: "var(--negative)" }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        </motion.div>
      )}

      <div className="reports-grid">
        {/* CSV Import */}
        <motion.div className="dash-card report-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <div className="report-card__icon"><Upload size={22} /></div>
          <div className="report-card__body">
            <h3 className="report-card__title">Import CSV for Bulk Analysis</h3>
            <p style={{ fontSize: "0.85rem", opacity: 0.7, marginBottom: 14 }}>
              Upload a CSV with a <code>text</code> column (max 500 rows, 2 MB).
              Each row is analyzed and saved to your history.
            </p>

            {/* Model picker */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: "0.82rem", opacity: 0.7, display: "block", marginBottom: 6 }}>ML Model</label>
              <select
                value={model}
                onChange={e => setModel(e.target.value)}
                style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "#0f1424", color: "#f8fafc", colorScheme: "dark", fontSize: "0.88rem" }}
              >
                {MODELS.map(m => <option key={m.value} value={m.value} style={{ background: "#0f1424", color: "#f8fafc" }}>{m.label}</option>)}
              </select>
            </div>

            {importResult && (
              <motion.div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 8, background: "var(--accent-muted)", display: "flex", gap: 10, alignItems: "center" }}
                initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
                <CheckCircle2 size={16} style={{ color: "#10B981" }} />
                <span style={{ fontSize: "0.88rem" }}>
                  Imported <strong>{importResult.imported}</strong> rows
                  {importResult.negative > 0 && <> · <strong style={{ color: "var(--negative)" }}>{importResult.negative} negative</strong></>}
                  {importResult.failed > 0 && <> · {importResult.failed} failed</>}
                </span>
              </motion.div>
            )}

            <div className="report-card__footer">
              <div className="report-card__info">
                <span className="report-badge">CSV</span>
                <span className="report-size">Max 500 rows</span>
              </div>
              <button
                className="report-download-btn"
                onClick={() => fileRef.current?.click()}
                disabled={importing}
              >
                {importing ? <><Loader2 size={14} className="spin" /> Importing…</> : <><Upload size={14} /> Import CSV</>}
              </button>
              <input ref={fileRef} type="file" accept=".csv,text/csv" style={{ display: "none" }} onChange={handleImport} />
            </div>
          </div>
        </motion.div>

        {/* CSV Export */}
        <motion.div className="dash-card report-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <div className="report-card__icon"><FileText size={22} /></div>
          <div className="report-card__body">
            <h3 className="report-card__title">Export Analysis Report</h3>
            <p style={{ fontSize: "0.85rem", opacity: 0.7, marginBottom: 14 }}>
              Download all your sentiment analyses as a CSV file. Includes text, sentiment, model, confidence, and timestamp.
            </p>
            <div className="report-card__meta">
              <span><BarChart2 size={12} /> Up to 10 000 rows</span>
              <span><Tag size={12} /> All models</span>
            </div>
            <div className="report-card__footer" style={{ marginTop: 18 }}>
              <div className="report-card__info">
                <span className="report-badge">CSV</span>
                <span className="report-size">UTF-8</span>
              </div>
              <button className="report-download-btn" onClick={handleExport} disabled={exporting}>
                {exporting ? <><Loader2 size={14} className="spin" /> Exporting…</> : <><Download size={14} /> Download</>}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
