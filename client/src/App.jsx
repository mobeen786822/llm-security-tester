import { useState } from "react"

const CATEGORIES = {
  prompt_injection: "Prompt Injection",
  jailbreaking: "Jailbreaking",
  system_prompt_extraction: "System Prompt Extraction",
  data_exfiltration: "Data Exfiltration",
  role_confusion: "Role Confusion",
}

const resultStyles = {
  PASS: "bg-green-900 text-green-400",
  FAIL: "bg-red-900 text-red-400",
  PARTIAL: "bg-yellow-900 text-yellow-400",
  ERROR: "bg-gray-800 text-gray-400",
}

const severityStyles = {
  HIGH: "bg-red-900 text-red-400",
  MEDIUM: "bg-yellow-900 text-yellow-400",
}

function StatCard({ number, label, color }) {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-5 text-center">
      <div className={`text-4xl font-bold ${color}`}>{number}</div>
      <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider">{label}</div>
    </div>
  )
}

function CategoryCard({ name, counts }) {
  const total = counts.pass + counts.fail + counts.partial + (counts.error || 0)
  const passW = total ? (counts.pass / total) * 100 : 0
  const partW = total ? (counts.partial / total) * 100 : 0
  const failW = total ? (counts.fail / total) * 100 : 0

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
      <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-3">{name}</h3>
      <div className="h-2 rounded-full bg-gray-700 overflow-hidden flex mb-2">
        <div className="bg-green-500 h-full" style={{ width: `${passW}%` }} />
        <div className="bg-yellow-500 h-full" style={{ width: `${partW}%` }} />
        <div className="bg-red-500 h-full" style={{ width: `${failW}%` }} />
      </div>
      <div className="text-xs text-gray-500 flex gap-3">
        <span className="text-green-400">{counts.pass} pass</span>
        <span className="text-yellow-400">{counts.partial} partial</span>
        <span className="text-red-400">{counts.fail} fail</span>
      </div>
    </div>
  )
}

function ResultRow({ r }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      <tr
        className="border-b border-gray-800 hover:bg-gray-900 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-3 py-3 text-gray-500 text-xs">{r.id}</td>
        <td className="px-3 py-3 text-xs">{CATEGORIES[r.category] || r.category}</td>
        <td className="px-3 py-3 text-xs font-medium">{r.name}</td>
        <td className="px-3 py-3">
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${severityStyles[r.severity]}`}>
            {r.severity}
          </span>
        </td>
        <td className="px-3 py-3">
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${resultStyles[r.result]}`}>
            {r.result}
          </span>
        </td>
        <td className="px-3 py-3 text-gray-500 text-xs">{r.response_time_s}s</td>
        <td className="px-3 py-3 text-gray-500 text-xs">{expanded ? "▲" : "▼"}</td>
      </tr>
      {expanded && (
        <tr className="border-b border-gray-800 bg-gray-950">
          <td colSpan={7} className="px-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Prompt</p>
                <p className="text-xs text-gray-300 whitespace-pre-wrap">{r.prompt}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Response</p>
                <p className="text-xs text-gray-300 whitespace-pre-wrap">
                  {r.response || <span className="text-gray-600">No response</span>}
                </p>
                {r.matched_indicators.length > 0 && (
                  <p className="text-xs text-red-400 mt-2">
                    Matched: {r.matched_indicators.join(", ")}
                  </p>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default function App() {
  const [target, setTarget] = useState("ollama")
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState(null)
  const [status, setStatus] = useState("")

  async function runTests() {
    setLoading(true)
    setReport(null)
    setStatus("Running security tests...")
    try {
      const resp = await fetch("http://localhost:5056/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target }),
      })
      const data = await resp.json()
      setReport(data)
      setStatus(`Completed at ${new Date().toLocaleTimeString()}`)
    } catch (e) {
      setStatus("Error: " + e.message)
    } finally {
      setLoading(false)
    }
  }

  async function exportReport() {
    if (!report) return
    await fetch("http://localhost:5056/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(report),
    })
    setStatus("Report exported to project folder.")
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-700 px-8 py-4 flex items-center gap-3">
        <span className="text-xl">🔍</span>
        <h1 className="text-lg font-semibold">LLM Security Tester</h1>
        <span className="bg-green-800 text-green-300 text-xs px-2 py-0.5 rounded-full">BETA</span>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Controls */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 mb-8 flex flex-wrap items-center gap-4">
          <label className="text-sm text-gray-400">Target Model:</label>
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="bg-gray-950 text-gray-100 border border-gray-700 rounded-md px-3 py-2 text-sm"
          >
            <option value="ollama">Ollama (Local — llama3.2)</option>
            <option value="anthropic">Anthropic (Claude Haiku)</option>
          </select>
          <button
            onClick={runTests}
            disabled={loading}
            className="bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white px-5 py-2 rounded-md text-sm font-semibold transition"
          >
            {loading ? "Running..." : "▶ Run Security Tests"}
          </button>
          {report && (
            <button
              onClick={exportReport}
              className="bg-blue-700 hover:bg-blue-600 text-white px-5 py-2 rounded-md text-sm font-semibold transition"
            >
              ⬇ Export JSON Report
            </button>
          )}
          {status && <span className="text-sm text-gray-500">{status}</span>}
        </div>

        {/* Loader */}
        {loading && (
          <div className="text-center py-20 text-gray-500">
            <div className="w-8 h-8 border-4 border-gray-700 border-t-green-500 rounded-full animate-spin mx-auto mb-4" />
            <p>Running 15 security tests — this may take a few minutes...</p>
          </div>
        )}

        {/* Dashboard */}
        {report && !loading && (
          <>
            {/* Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
              <StatCard number={report.summary.total} label="Total Tests" color="text-gray-100" />
              <StatCard number={report.summary.pass} label="Resistant" color="text-green-400" />
              <StatCard number={report.summary.fail} label="Vulnerable" color="text-red-400" />
              <StatCard number={report.summary.partial} label="Partial" color="text-yellow-400" />
              <StatCard number={report.summary.error} label="Errors" color="text-gray-500" />
            </div>

            {/* By Category */}
            <h2 className="text-base font-semibold mb-4">Results by Category</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
              {Object.entries(report.summary.by_category).map(([cat, counts]) => (
                <CategoryCard key={cat} name={CATEGORIES[cat] || cat} counts={counts} />
              ))}
            </div>

            {/* Results Table */}
            <h2 className="text-base font-semibold mb-4">Full Test Results</h2>
            <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="px-3 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-3 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-3 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Test</th>
                    <th className="px-3 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Severity</th>
                    <th className="px-3 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Result</th>
                    <th className="px-3 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-3 py-3 text-left text-xs text-gray-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody>
                  {report.results.map((r) => (
                    <ResultRow key={r.id} r={r} />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}