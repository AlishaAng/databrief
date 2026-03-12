import { useState } from "react";

const API_URL = "http://localhost:8000";

function TechnicalReport({ report }) {
  const sections = report.split(/\n---\n/).filter(Boolean);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {sections.map((section, i) => {

        // Data Quality Score
        if (section.includes("## Data Quality Score")) {
          const scoreMatch = section.match(/(\d+)\/10/);
          const score = scoreMatch ? parseInt(scoreMatch[1]) : null;
          const justification = section
            .split("\n")
            .filter(l => l.trim() && !l.includes("##") && !l.match(/\d+\/10/))
            .join(" ").trim();
          const scoreColor = score >= 8 ? "#16a34a" : score >= 5 ? "#d97706" : "#dc2626";
          const scoreBg   = score >= 8 ? "#f0fdf4" : score >= 5 ? "#fffbeb" : "#fef2f2";
          const scoreBorder = score >= 8 ? "#bbf7d0" : score >= 5 ? "#fde68a" : "#fecaca";

          return (
            <div key={i} style={{
              background: scoreBg, border: `1px solid ${scoreBorder}`,
              borderRadius: 12, padding: "20px 24px",
              display: "flex", alignItems: "center", gap: 20,
            }}>
              <div style={{ textAlign: "center", minWidth: 80 }}>
                <div style={{ fontSize: 42, fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{score ?? "?"}</div>
                <div style={{ fontSize: 12, color: scoreColor, fontWeight: 600 }}>/10</div>
                <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>QUALITY SCORE</div>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 4 }}>Data Quality Assessment</div>
                <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>{justification}</div>
              </div>
            </div>
          );
        }

        // Column Analysis
        if (section.includes("## Column Analysis")) {
          const columnBlocks = section.split(/\n### /).slice(1);

          return (
            <div key={i}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 12, letterSpacing: "1px" }}>
                COLUMN ANALYSIS
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {columnBlocks.map((block, j) => {
                  const lines = block.split("\n");
                  const title = lines[0].trim();

                  // Robust status detection — handles STATUS: or **Status:** or plain text
                  const statusMatch = block.match(/STATUS:\s*(PASS|WARNING|CRITICAL)/i)
                    || block.match(/\*\*Status:\*\*\s*(PASS|WARNING|CRITICAL)/i)
                    || block.match(/Status:\s*(PASS|WARNING|CRITICAL)/i);
                  const status = statusMatch ? statusMatch[1].toUpperCase() : "PASS";

                  const cfg = {
                    PASS:     { bg: "#f0fdf4", border: "#bbf7d0", badge: "#16a34a", text: "#15803d" },
                    WARNING:  { bg: "#fffbeb", border: "#fde68a", badge: "#d97706", text: "#92400e" },
                    CRITICAL: { bg: "#fef2f2", border: "#fecaca", badge: "#dc2626", text: "#991b1b" },
                  }[status] || { bg: "#f9fafb", border: "#e5e7eb", badge: "#6b7280", text: "#374151" };

                  // Extract code block
                  const codeMatch = block.match(/```python\n?([\s\S]*?)```/);
                  const codeContent = codeMatch ? codeMatch[1].trim() : null;

                  // Remove code block from text before extracting fields
                  const blockNoCode = block.replace(/```python[\s\S]*?```/g, "").replace(/```[\s\S]*?```/g, "");

                  // Robust field extraction — handles both STATUS:/ISSUES:/IMPACT: and **Status:**/**Issues:**/**Impact:**
                  const extractField = (text, ...labels) => {
                    for (const label of labels) {
                      const re = new RegExp(`(?:${label}):\\s*([\\s\\S]*?)(?=\\n(?:STATUS|ISSUES|IMPACT|FIX|\\*\\*Status|\\*\\*Issues|\\*\\*Impact|\\*\\*Fix|###|$))`, "i");
                      const m = text.match(re);
                      if (m) return m[1].replace(/\*\*/g, "").trim();
                    }
                    return "";
                  };

                  const issues = extractField(blockNoCode, "ISSUES", "\\*\\*Issues\\*\\*", "Issues");
                  const impact = extractField(blockNoCode, "IMPACT", "\\*\\*Impact\\*\\*", "Impact");

                  return (
                    <div key={j} style={{
                      background: cfg.bg, border: `1px solid ${cfg.border}`,
                      borderRadius: 10, overflow: "hidden",
                    }}>
                      {/* Header */}
                      <div style={{
                        padding: "11px 16px", borderBottom: `1px solid ${cfg.border}`,
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                      }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", fontFamily: "monospace" }}>
                          {title}
                        </span>
                        <span style={{
                          fontSize: 10, fontWeight: 700, background: cfg.badge,
                          color: "white", padding: "3px 8px", borderRadius: 4, letterSpacing: "0.5px",
                        }}>
                          {status}
                        </span>
                      </div>

                      {/* Body */}
                      <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                        {issues && (
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: "1px", marginBottom: 4 }}>ISSUES</div>
                            <div style={{ fontSize: 12, color: cfg.text, lineHeight: 1.6 }}>{issues}</div>
                          </div>
                        )}
                        {impact && (
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: "1px", marginBottom: 4 }}>IMPACT</div>
                            <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>{impact}</div>
                          </div>
                        )}
                        {codeContent && codeContent !== "# No fix required" && (
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: "1px", marginBottom: 4 }}>FIX</div>
                            <pre style={{
                              background: "#0f172a", borderRadius: 8,
                              padding: "12px 14px", fontSize: 12, color: "#7dd3fc",
                              overflowX: "auto", margin: 0, lineHeight: 1.6,
                              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                            }}>
                              <code>{codeContent}</code>
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }

        // Top 3 Priority Fixes
        if (section.includes("## Top 3 Priority Fixes")) {
          const lines = section
            .split("\n")
            .filter(l => l.trim() && !l.includes("##"))
            .map(l => l.replace(/^\d+\.\s*/, "").replace(/\*\*/g, "").trim())
            .filter(Boolean)
            .slice(0, 3);

          return (
            <div key={i} style={{
              background: "#f8faff", border: "1px solid #e0e7ff",
              borderRadius: 10, padding: "16px 20px",
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>
                🎯 Top 3 Priority Fixes
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {lines.map((line, k) => (
                  <div key={k} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{
                      minWidth: 22, height: 22, background: "#4f7ef8",
                      borderRadius: "50%", display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: 11, fontWeight: 700,
                      color: "white", marginTop: 1, flexShrink: 0,
                    }}>
                      {k + 1}
                    </div>
                    <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{line}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        // Overall Assessment
        if (section.includes("## Overall Assessment")) {
          const text = section
            .split("\n")
            .filter(l => l.trim() && !l.includes("##"))
            .map(l => l.replace(/\*\*/g, ""))
            .join(" ").trim();

          return (
            <div key={i} style={{
              background: "white", border: "1px solid #e8ecf0",
              borderRadius: 10, padding: "16px 20px",
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>📝 Overall Assessment</div>
              <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.7 }}>{text}</div>
            </div>
          );
        }

        // Fallback — plain text
        return (
          <div key={i} style={{
            fontSize: 13, color: "#64748b", lineHeight: 1.7,
            whiteSpace: "pre-wrap",
            background: "white", border: "1px solid #e8ecf0",
            borderRadius: 10, padding: "16px 20px",
          }}>
            {section.replace(/\*\*/g, "")}
          </div>
        );
      })}
    </div>
  );
}

function SummaryReport({ report }) {
  return (
    <div style={{
      background: "white", border: "1px solid #e8ecf0",
      borderRadius: 12, padding: "28px",
      fontSize: 14, color: "#334155", lineHeight: 1.9,
      whiteSpace: "pre-wrap",
    }}>
      {report}
    </div>
  );
}

export default function App() {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState("summary");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) { setFile(dropped); setResult(null); setError(null); }
  };

  const handleFileClick = () => {
    if (file) { setFile(null); setResult(null); return; }
    const input = document.createElement("input");
    input.type = "file"; input.accept = ".csv";
    input.onchange = (e) => { setFile(e.target.files[0]); setResult(null); setError(null); };
    input.click();
  };

  const generateReport = async () => {
    if (!file) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mode", mode);
      const response = await fetch(`${API_URL}/report`, { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Something went wrong.");
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    const blob = new Blob([result.report], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `report_${result.filename}.txt`; a.click();
  };

  const downloadProfile = () => {
    const blob = new Blob([JSON.stringify(result.profile, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `profile_${result.filename}.json`; a.click();
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#ffffff",
      fontFamily: "'Inter', system-ui, sans-serif",
      display: "flex", flexDirection: "column",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .page { animation: fadeIn 0.4s ease forwards; }
        .upload-zone { transition: all 0.2s ease; cursor: pointer; }
        .upload-zone:hover, .upload-zone.over { background: #f8faff !important; border-color: #4f7ef8 !important; }
        .mode-option { cursor: pointer; transition: all 0.15s ease; user-select: none; }
        .mode-option:hover { background: #f8faff !important; }
        .mode-option.selected { background: #f0f5ff !important; border-color: #4f7ef8 !important; }
        .generate-btn { transition: all 0.15s ease; cursor: pointer; }
        .generate-btn:hover:not(:disabled) { background: #3b6af5 !important; box-shadow: 0 4px 20px rgba(79,126,248,0.35) !important; transform: translateY(-1px); }
        .generate-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .download-btn { transition: all 0.15s ease; cursor: pointer; }
        .download-btn:hover { border-color: #4f7ef8 !important; color: #4f7ef8 !important; background: #f0f5ff !important; }
        .spinner { width:16px; height:16px; border:2px solid rgba(255,255,255,0.3); border-top-color:white; border-radius:50%; animation:spin 0.7s linear infinite; display:inline-block; margin-right:8px; vertical-align:middle; }
        .reset-btn { transition: all 0.15s ease; cursor: pointer; }
        .reset-btn:hover { color: #4f7ef8 !important; border-color: #4f7ef8 !important; }
      `}</style>

      {/* Nav */}
      <nav style={{ padding: "0 48px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f1f1f1" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, background: "#4f7ef8", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>🔍</div>
          <span style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>DataBrief</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 20, padding: "4px 10px" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
          <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 500 }}>Local · Private</span>
        </div>
      </nav>

      <div className="page" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 24px 80px" }}>

        {/* Upload view */}
        {!result && (
          <>
            <div style={{ textAlign: "center", marginBottom: 40, maxWidth: 520 }}>
              <h1 style={{ fontSize: 34, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.8px", lineHeight: 1.2, marginBottom: 14 }}>
                Make sense of your data.<br />
                <span style={{ color: "#4f7ef8" }}>In plain English.</span>
              </h1>
              <p style={{ fontSize: 15, color: "#64748b", lineHeight: 1.7 }}>
                Upload a CSV and get an instant AI-generated report. Runs entirely on your machine.
              </p>
            </div>

            <div style={{ width: "100%", maxWidth: 540, background: "white", border: "1px solid #e8ecf0", borderRadius: 16, boxShadow: "0 2px 24px rgba(0,0,0,0.06)", overflow: "hidden" }}>
              <div style={{ padding: "18px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>New Report</span>
                <span style={{ fontSize: 11, color: "#cbd5e1" }}>CSV supported</span>
              </div>

              <div style={{ padding: "22px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
                <div
                  className={`upload-zone ${dragOver ? "over" : ""}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={handleFileClick}
                  style={{ border: `1.5px dashed ${file ? "#4f7ef8" : "#dde3ea"}`, borderRadius: 10, padding: "26px 20px", textAlign: "center", background: file ? "#f8faff" : "#fafbfc" }}
                >
                  {file ? (
                    <div>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "white", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 14px", marginBottom: 6 }}>
                        <span style={{ fontSize: 16 }}>📄</span>
                        <span style={{ fontSize: 13, fontWeight: 500, color: "#0f172a" }}>{file.name}</span>
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>{(file.size / (1024 * 1024)).toFixed(1)} MB</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>Click to remove</div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: 26, marginBottom: 10 }}>☁️</div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: "#334155", marginBottom: 4 }}>Drop your CSV here</div>
                      <div style={{ fontSize: 12, color: "#94a3b8" }}>or click to browse</div>
                    </div>
                  )}
                </div>

                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", marginBottom: 8, letterSpacing: "0.5px" }}>REPORT TYPE</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {[
                      { id: "summary", icon: "📋", title: "General Summary", sub: "Plain English overview" },
                      { id: "ds", icon: "🔬", title: "Technical Analysis", sub: "Issues + code fixes" },
                    ].map((m) => (
                      <div key={m.id} className={`mode-option ${mode === m.id ? "selected" : ""}`} onClick={() => setMode(m.id)}
                        style={{ border: `1.5px solid ${mode === m.id ? "#4f7ef8" : "#e8ecf0"}`, borderRadius: 9, padding: "11px 13px", background: mode === m.id ? "#f0f5ff" : "#fafbfc", display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 18 }}>{m.icon}</span>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 1, color: mode === m.id ? "#2d5be3" : "#374151" }}>{m.title}</div>
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>{m.sub}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {error && (
                  <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "12px 14px", fontSize: 13, color: "#dc2626" }}>
                    ❌ {error}
                  </div>
                )}

                <button className="generate-btn" disabled={!file || loading} onClick={generateReport}
                  style={{ width: "100%", padding: "13px", background: "#4f7ef8", border: "none", borderRadius: 9, color: "white", fontSize: 14, fontWeight: 600, fontFamily: "inherit", boxShadow: "0 2px 10px rgba(79,126,248,0.25)" }}>
                  {loading ? <><span className="spinner" />Generating report...</> : "Generate Report →"}
                </button>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 11, color: "#94a3b8" }}>
                  <span>🔒</span><span>File processed locally and deleted immediately after</span>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 20, width: "100%", maxWidth: 540 }}>
              {[
                { icon: "⚡", value: "< 1 min", label: "Average scan time" },
                { icon: "🔒", value: "100%", label: "Data stays local" },
                { icon: "🧠", value: "2 modes", label: "Summary or technical" },
              ].map((s) => (
                <div key={s.label} style={{ background: "white", border: "1px solid #f1f5f9", borderRadius: 10, padding: "14px", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                  <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Results view */}
        {result && (
          <div style={{ width: "100%", maxWidth: 720, animation: "fadeIn 0.4s ease" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 3 }}>
                  {result.mode === "summary" ? "📋 General Summary" : "🔬 Technical Analysis"}
                </h2>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>{result.filename}</span>
              </div>
              <button className="reset-btn" onClick={() => { setResult(null); setFile(null); }}
                style={{ background: "none", border: "1px solid #e8ecf0", borderRadius: 8, padding: "8px 14px", fontSize: 12, color: "#64748b", fontFamily: "inherit" }}>
                ← New Report
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
              {[
                { label: "Rows", value: result.profile.total_rows.toLocaleString() },
                { label: "Columns", value: result.profile.total_columns },
                { label: "Null Columns", value: result.profile.columns.filter(c => c.null_percent > 0).length },
                { label: "Outlier Columns", value: result.profile.columns.filter(c => (c.outlier_count || 0) > 0).length },
              ].map((m) => (
                <div key={m.label} style={{ background: "white", border: "1px solid #f1f5f9", borderRadius: 10, padding: "14px", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>{m.value}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>{m.label}</div>
                </div>
              ))}
            </div>

            {result.mode === "ds"
              ? <TechnicalReport report={result.report} />
              : <SummaryReport report={result.report} />
            }

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16 }}>
              <button className="download-btn" onClick={downloadReport} style={{ background: "white", border: "1px solid #e8ecf0", borderRadius: 9, padding: "12px", fontSize: 13, fontWeight: 500, color: "#374151", fontFamily: "inherit" }}>
                ⬇️ Download Report (.txt)
              </button>
              <button className="download-btn" onClick={downloadProfile} style={{ background: "white", border: "1px solid #e8ecf0", borderRadius: 9, padding: "12px", fontSize: 13, fontWeight: 500, color: "#374151", fontFamily: "inherit" }}>
                ⬇️ Download Profile (.json)
              </button>
            </div>
          </div>
        )}
      </div>

      <footer style={{ padding: "16px 48px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "#cbd5e1" }}>Built with Ollama · FastAPI · React</span>
        <span style={{ fontSize: 11, color: "#cbd5e1" }}>DataBrief v1.0</span>
      </footer>
    </div>
  );
}