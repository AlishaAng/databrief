 import { useState } from "react";

const API_URL = "http://localhost:8000";

export default function App() {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState("summary");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) { setFile(dropped); setResult(null); setError(null); }
  };

  const handleFileClick = () => {
    if (file) { setFile(null); setResult(null); return; }
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv";
    input.onchange = (e) => {
      setFile(e.target.files[0]);
      setResult(null);
      setError(null);
    };
    input.click();
  };

  const generateReport = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mode", mode);

      const response = await fetch(`${API_URL}/report`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    const blob = new Blob([result.report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report_${result.filename}.txt`;
    a.click();
  };

  const downloadProfile = () => {
    const blob = new Blob([JSON.stringify(result.profile, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `profile_${result.filename}.json`;
    a.click();
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#ffffff",
      fontFamily: "'Inter', system-ui, sans-serif",
      display: "flex",
      flexDirection: "column",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .page { animation: fadeIn 0.4s ease forwards; }

        .upload-zone { transition: all 0.2s ease; cursor: pointer; }
        .upload-zone:hover, .upload-zone.over {
          background: #f8faff !important;
          border-color: #4f7ef8 !important;
        }

        .mode-option { cursor: pointer; transition: all 0.15s ease; user-select: none; }
        .mode-option:hover { background: #f8faff !important; }
        .mode-option.selected {
          background: #f0f5ff !important;
          border-color: #4f7ef8 !important;
        }

        .generate-btn { transition: all 0.15s ease; cursor: pointer; }
        .generate-btn:hover:not(:disabled) {
          background: #3b6af5 !important;
          box-shadow: 0 4px 20px rgba(79,126,248,0.35) !important;
          transform: translateY(-1px);
        }
        .generate-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .stat-card { transition: all 0.15s ease; }
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.06) !important;
        }

        .download-btn { transition: all 0.15s ease; cursor: pointer; }
        .download-btn:hover {
          border-color: #4f7ef8 !important;
          color: #4f7ef8 !important;
          background: #f0f5ff !important;
        }

        .spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block;
          margin-right: 8px;
          vertical-align: middle;
        }

        .reset-btn { transition: all 0.15s ease; cursor: pointer; }
        .reset-btn:hover { color: #4f7ef8 !important; }
      `}</style>

      {/* Nav */}
      <nav style={{
        padding: "0 48px", height: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid #f1f1f1",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 28, height: 28, background: "#4f7ef8",
            borderRadius: 7, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 13,
          }}>🔍</div>
          <span style={{ fontWeight: 700, fontSize: 15, color: "#0f172a", letterSpacing: "-0.2px" }}>
            DataBrief
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6,
          background: "#f0fdf4", border: "1px solid #bbf7d0",
          borderRadius: 20, padding: "4px 10px",
        }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
          <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 500 }}>Local · Private</span>
        </div>
      </nav>

      {/* Main */}
      <div className="page" style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", padding: "64px 24px 80px",
      }}>

        {/* Hero */}
        {!result && (
          <div style={{ textAlign: "center", marginBottom: 48, maxWidth: 520 }}>
            <h1 style={{
              fontSize: 36, fontWeight: 700, color: "#0f172a",
              letterSpacing: "-0.8px", lineHeight: 1.2, marginBottom: 14,
            }}>
              Make sense of your data.<br />
              <span style={{ color: "#4f7ef8" }}>In plain English.</span>
            </h1>
            <p style={{ fontSize: 15, color: "#64748b", lineHeight: 1.7 }}>
              Upload a CSV and get an instant AI-generated report —
              a plain English overview or a technical breakdown for your data team.
              Runs entirely on your machine.
            </p>
          </div>
        )}

        {/* Upload card */}
        {!result && (
          <div style={{
            width: "100%", maxWidth: 560,
            background: "white", border: "1px solid #e8ecf0",
            borderRadius: 16, boxShadow: "0 2px 24px rgba(0,0,0,0.06)",
            overflow: "hidden",
          }}>
            <div style={{
              padding: "20px 28px", borderBottom: "1px solid #f1f5f9",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>New Report</span>
              <span style={{ fontSize: 11, color: "#cbd5e1" }}>CSV supported</span>
            </div>

            <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Upload zone */}
              <div
                className={`upload-zone ${dragOver ? "over" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={handleFileClick}
                style={{
                  border: `1.5px dashed ${file ? "#4f7ef8" : "#dde3ea"}`,
                  borderRadius: 10, padding: "28px 20px",
                  textAlign: "center", background: file ? "#f8faff" : "#fafbfc",
                }}
              >
                {file ? (
                  <div>
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 8,
                      background: "white", border: "1px solid #e2e8f0",
                      borderRadius: 8, padding: "8px 14px", marginBottom: 8,
                    }}>
                      <span style={{ fontSize: 16 }}>📄</span>
                      <span style={{ fontSize: 13, fontWeight: 500, color: "#0f172a" }}>{file.name}</span>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>
                        {(file.size / (1024 * 1024)).toFixed(1)} MB
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>Click to remove</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 28, marginBottom: 10 }}>☁️</div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "#334155", marginBottom: 4 }}>
                      Drop your CSV here
                    </div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>or click to browse your computer</div>
                  </div>
                )}
              </div>

              {/* Report type */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 8, letterSpacing: "0.2px" }}>
                  REPORT TYPE
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[
                    { id: "summary", icon: "📋", title: "General Summary", sub: "Plain English overview" },
                    { id: "ds", icon: "🔬", title: "Technical Analysis", sub: "Issues + code fixes" },
                  ].map((m) => (
                    <div
                      key={m.id}
                      className={`mode-option ${mode === m.id ? "selected" : ""}`}
                      onClick={() => setMode(m.id)}
                      style={{
                        border: `1.5px solid ${mode === m.id ? "#4f7ef8" : "#e8ecf0"}`,
                        borderRadius: 9, padding: "12px 14px",
                        background: mode === m.id ? "#f0f5ff" : "#fafbfc",
                        display: "flex", alignItems: "center", gap: 10,
                      }}
                    >
                      <span style={{ fontSize: 18 }}>{m.icon}</span>
                      <div>
                        <div style={{
                          fontSize: 12, fontWeight: 600, marginBottom: 2,
                          color: mode === m.id ? "#2d5be3" : "#374151",
                        }}>{m.title}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>{m.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  background: "#fef2f2", border: "1px solid #fecaca",
                  borderRadius: 8, padding: "12px 14px",
                  fontSize: 13, color: "#dc2626",
                }}>
                  ❌ {error}
                  {error.includes("Ollama") && (
                    <div style={{ marginTop: 6, fontSize: 12, color: "#94a3b8" }}>
                      Run <code>ollama serve</code> in your terminal and try again.
                    </div>
                  )}
                </div>
              )}

              {/* Generate button */}
              <button
                className="generate-btn"
                disabled={!file || loading}
                onClick={generateReport}
                style={{
                  width: "100%", padding: "13px",
                  background: "#4f7ef8", border: "none",
                  borderRadius: 9, color: "white",
                  fontSize: 14, fontWeight: 600, fontFamily: "inherit",
                  boxShadow: "0 2px 10px rgba(79,126,248,0.25)",
                }}
              >
                {loading ? (
                  <><span className="spinner" />Generating report...</>
                ) : "Generate Report →"}
              </button>

              {/* Privacy line */}
              <div style={{
                display: "flex", alignItems: "center",
                justifyContent: "center", gap: 6,
                fontSize: 11, color: "#94a3b8",
              }}>
                <span>🔒</span>
                <span>Your file is processed locally and deleted immediately after</span>
              </div>

            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div style={{ width: "100%", maxWidth: 660, animation: "fadeIn 0.4s ease" }}>

            {/* Header row */}
            <div style={{
              display: "flex", alignItems: "center",
              justifyContent: "space-between", marginBottom: 24,
            }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
                  {result.mode === "summary" ? "📋 General Summary" : "🔬 Technical Analysis"}
                </h2>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>{result.filename}</span>
              </div>
              <button
                className="reset-btn"
                onClick={() => { setResult(null); setFile(null); }}
                style={{
                  background: "none", border: "1px solid #e8ecf0",
                  borderRadius: 8, padding: "8px 14px",
                  fontSize: 12, color: "#64748b", fontFamily: "inherit",
                }}
              >
                ← New Report
              </button>
            </div>

            {/* Metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
              {[
                { label: "Rows", value: result.profile.total_rows.toLocaleString() },
                { label: "Columns", value: result.profile.total_columns },
                { label: "Null Columns", value: result.profile.columns.filter(c => c.null_percent > 0).length },
                { label: "Outlier Columns", value: result.profile.columns.filter(c => c.outlier_count > 0).length },
              ].map((m) => (
                <div key={m.label} className="stat-card" style={{
                  background: "white", border: "1px solid #f1f5f9",
                  borderRadius: 10, padding: "14px",
                  textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>
                    {m.value}
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>{m.label}</div>
                </div>
              ))}
            </div>

            {/* Sampled warning */}
            {result.profile.was_sampled && (
              <div style={{
                background: "#fffbeb", border: "1px solid #fde68a",
                borderRadius: 8, padding: "10px 14px",
                fontSize: 12, color: "#92400e", marginBottom: 16,
              }}>
                ⚠️ Large file — report is based on a 100,000 row sample.
              </div>
            )}

            {/* Report text */}
            <div style={{
              background: "white", border: "1px solid #e8ecf0",
              borderRadius: 12, padding: "28px",
              boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
              fontSize: 14, color: "#334155", lineHeight: 1.8,
              marginBottom: 16, whiteSpace: "pre-wrap",
            }}>
              {result.report}
            </div>

            {/* Export buttons */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button className="download-btn" onClick={downloadReport} style={{
                background: "white", border: "1px solid #e8ecf0",
                borderRadius: 9, padding: "12px",
                fontSize: 13, fontWeight: 500, color: "#374151",
                fontFamily: "inherit",
              }}>
                ⬇️ Download Report (.txt)
              </button>
              <button className="download-btn" onClick={downloadProfile} style={{
                background: "white", border: "1px solid #e8ecf0",
                borderRadius: 9, padding: "12px",
                fontSize: 13, fontWeight: 500, color: "#374151",
                fontFamily: "inherit",
              }}>
                ⬇️ Download Profile (.json)
              </button>
            </div>

          </div>
        )}

        {/* Stats row — only on landing */}
        {!result && (
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12, marginTop: 24, width: "100%", maxWidth: 560,
          }}>
            {[
              { icon: "⚡", value: "< 1 min", label: "Average scan time" },
              { icon: "🔒", value: "100%", label: "Data stays local" },
              { icon: "🧠", value: "2 modes", label: "Summary or technical" },
            ].map((s) => (
              <div key={s.label} className="stat-card" style={{
                background: "white", border: "1px solid #f1f5f9",
                borderRadius: 10, padding: "14px 16px",
                textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              }}>
                <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Footer */}
      <footer style={{
        padding: "16px 48px", borderTop: "1px solid #f1f5f9",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ fontSize: 11, color: "#cbd5e1" }}>Built with Ollama · FastAPI · React</span>
        <span style={{ fontSize: 11, color: "#cbd5e1" }}>DataBrief v1.0</span>
      </footer>
    </div>
  );
}