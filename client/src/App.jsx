import { useState } from "react"

const CATEGORIES = {
  prompt_injection: "Prompt Injection",
  jailbreaking: "Jailbreaking",
  system_prompt_extraction: "System Prompt Extraction",
  data_exfiltration: "Data Exfiltration",
  role_confusion: "Role Confusion",
}

const resultStyles = {
  PASS: "border border-emerald-300/40 bg-emerald-500/20 text-emerald-200",
  FAIL: "border border-rose-300/40 bg-rose-500/20 text-rose-200",
  PARTIAL: "border border-amber-300/40 bg-amber-500/20 text-amber-200",
  ERROR: "border border-slate-400/40 bg-slate-700/50 text-slate-200",
}

const severityStyles = {
  HIGH: "border border-rose-300/40 bg-rose-500/20 text-rose-200",
  MEDIUM: "border border-amber-300/40 bg-amber-500/20 text-amber-200",
}

function StatCard({ number, label, color }) {
  return (
    <div className="rounded-2xl border border-cyan-900/70 bg-slate-950/70 p-5 text-center shadow-[0_18px_60px_-24px_rgba(6,182,212,0.45)] backdrop-blur-sm">
      <div className={`font-[Space_Grotesk] text-4xl font-bold ${color}`}>{number}</div>
      <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{label}</div>
    </div>
  )
}

function CategoryCard({ name, counts }) {
  const total = counts.pass + counts.fail + counts.partial + (counts.error || 0)
  const passW = total ? (counts.pass / total) * 100 : 0
  const partW = total ? (counts.partial / total) * 100 : 0
  const failW = total ? (counts.fail / total) * 100 : 0

  return (
    <div className="rounded-2xl border border-cyan-900/70 bg-slate-950/70 p-4 shadow-[0_18px_60px_-24px_rgba(6,182,212,0.45)] backdrop-blur-sm">
      <h3 className="mb-3 text-xs uppercase tracking-[0.18em] text-cyan-100">{name}</h3>
      <div className="mb-2 flex h-2 overflow-hidden rounded-full bg-slate-800">
        <div className="h-full bg-emerald-400" style={{ width: `${passW}%` }} />
        <div className="h-full bg-amber-400" style={{ width: `${partW}%` }} />
        <div className="h-full bg-rose-400" style={{ width: `${failW}%` }} />
      </div>
      <div className="flex gap-3 text-xs text-slate-300">
        <span className="text-emerald-300">{counts.pass} pass</span>
        <span className="text-amber-300">{counts.partial} partial</span>
        <span className="text-rose-300">{counts.fail} fail</span>
      </div>
    </div>
  )
}

function ResultRow({ r }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      <tr
        className="cursor-pointer border-b border-slate-800 transition hover:bg-slate-800/40"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-3 py-3 text-xs text-slate-400">{r.id}</td>
        <td className="px-3 py-3 text-xs text-slate-200">{CATEGORIES[r.category] || r.category}</td>
        <td className="px-3 py-3 text-xs font-medium text-slate-100">{r.name}</td>
        <td className="px-3 py-3">
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${severityStyles[r.severity]}`}>
            {r.severity}
          </span>
        </td>
        <td className="px-3 py-3">
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${resultStyles[r.result]}`}>
            {r.result}
          </span>
        </td>
        <td className="px-3 py-3 text-xs text-slate-400">{r.response_time_s}s</td>
        <td className="px-3 py-3 text-xs text-slate-400">{expanded ? "Hide" : "View"}</td>
      </tr>
      {expanded && (
        <tr className="border-b border-slate-800 bg-slate-950/50">
          <td colSpan={7} className="px-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="mb-1 text-xs uppercase tracking-[0.18em] text-cyan-200">Prompt</p>
                <p className="whitespace-pre-wrap text-xs text-slate-300">{r.prompt}</p>
              </div>
              <div>
                <p className="mb-1 text-xs uppercase tracking-[0.18em] text-cyan-200">Response</p>
                <p className="whitespace-pre-wrap text-xs text-slate-300">
                  {r.response || <span className="text-slate-500">No response</span>}
                </p>
                {r.matched_indicators.length > 0 && (
                  <p className="mt-2 text-xs text-rose-300">Matched: {r.matched_indicators.join(", ")}</p>
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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_15%_10%,rgba(34,197,94,0.15),transparent_34%),radial-gradient(circle_at_80%_12%,rgba(6,182,212,0.2),transparent_36%),radial-gradient(circle_at_50%_85%,rgba(14,116,144,0.2),transparent_42%)]" />

      <header className="border-b border-cyan-900/70 bg-slate-900/80 px-6 py-4 backdrop-blur-sm sm:px-8">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-cyan-300/50 bg-cyan-500/25 text-cyan-100">
            SK
          </div>
          <h1 className="font-[Space_Grotesk] text-lg font-semibold text-cyan-100 sm:text-xl">LLM Security Tester</h1>
          <span className="rounded-full border border-emerald-300/40 bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-200">
            Beta
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-8 rounded-3xl border border-cyan-900/70 bg-slate-950/70 p-5 shadow-[0_18px_60px_-24px_rgba(6,182,212,0.45)] backdrop-blur-sm sm:p-6">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <label className="text-sm uppercase tracking-wide text-slate-300">Target Model</label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="rounded-xl border border-cyan-900/70 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 transition hover:border-cyan-300/50 focus:border-cyan-300/50 focus:outline-none"
            >
              <option value="ollama">Ollama (Local - llama3.2)</option>
              <option value="anthropic">Anthropic (Claude Haiku)</option>
            </select>
            <button
              onClick={runTests}
              disabled={loading}
              className="rounded-xl border border-cyan-300/50 bg-cyan-500/25 px-5 py-2 text-sm font-semibold text-cyan-100 transition hover:-translate-y-0.5 hover:border-cyan-300 disabled:opacity-50"
            >
              {loading ? "Running..." : "Run Security Tests"}
            </button>
            {report && (
              <button
                onClick={exportReport}
                className="rounded-xl border border-emerald-300/40 bg-emerald-500/20 px-5 py-2 text-sm font-semibold text-emerald-200 transition hover:-translate-y-0.5 hover:border-emerald-300"
              >
                Export JSON Report
              </button>
            )}
          </div>
          {status && <div className="mt-3 text-sm text-slate-400">{status}</div>}
        </div>

        {loading && (
          <div className="py-20 text-center text-slate-400">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-300" />
            <p>Running 15 security tests - this may take a few minutes...</p>
          </div>
        )}

        {report && !loading && (
          <>
            <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
              <StatCard number={report.summary.total} label="Total Tests" color="text-cyan-100" />
              <StatCard number={report.summary.pass} label="Resistant" color="text-emerald-300" />
              <StatCard number={report.summary.fail} label="Vulnerable" color="text-rose-300" />
              <StatCard number={report.summary.partial} label="Partial" color="text-amber-300" />
              <StatCard number={report.summary.error} label="Errors" color="text-slate-400" />
            </div>

            <h2 className="mb-4 font-[Space_Grotesk] text-base font-semibold text-cyan-100">Results by Category</h2>
            <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {Object.entries(report.summary.by_category).map(([cat, counts]) => (
                <CategoryCard key={cat} name={CATEGORIES[cat] || cat} counts={counts} />
              ))}
            </div>

            <h2 className="mb-4 font-[Space_Grotesk] text-base font-semibold text-cyan-100">Full Test Results</h2>
            <div className="overflow-x-auto rounded-3xl border border-cyan-900/70 bg-slate-950/70 shadow-[0_18px_60px_-24px_rgba(6,182,212,0.45)] backdrop-blur-sm">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="px-3 py-3 text-left text-xs uppercase tracking-[0.18em] text-slate-400">ID</th>
                    <th className="px-3 py-3 text-left text-xs uppercase tracking-[0.18em] text-slate-400">Category</th>
                    <th className="px-3 py-3 text-left text-xs uppercase tracking-[0.18em] text-slate-400">Test</th>
                    <th className="px-3 py-3 text-left text-xs uppercase tracking-[0.18em] text-slate-400">Severity</th>
                    <th className="px-3 py-3 text-left text-xs uppercase tracking-[0.18em] text-slate-400">Result</th>
                    <th className="px-3 py-3 text-left text-xs uppercase tracking-[0.18em] text-slate-400">Time</th>
                    <th className="px-3 py-3 text-left text-xs uppercase tracking-[0.18em] text-slate-400"></th>
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
