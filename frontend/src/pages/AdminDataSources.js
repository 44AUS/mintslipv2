import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import {
  Database, Globe, Search, RefreshCw, Play, Trash2,
  CheckCircle, XCircle, Clock, Loader2, ChevronDown, ChevronUp,
  AlertTriangle, Info,
} from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

const CATEGORY_LABELS = {
  api:      { label: "Live API",    color: "bg-blue-50 text-blue-700" },
  database: { label: "Database",   color: "bg-purple-50 text-purple-700" },
  scraper:  { label: "Scraper",    color: "bg-green-50 text-green-700" },
  import:   { label: "Import",     color: "bg-amber-50 text-amber-700" },
};

const SOURCE_ICONS = {
  whitepages:  Globe,
  internal:    Database,
  nsopw:       Search,
  nppes:       Search,
  fec:         Search,
  faa:         Search,
  voter_rolls: Search,
};

const SCRAPER_SOURCES = ["nsopw", "nppes", "fec", "faa"];

function StatusBadge({ job }) {
  if (!job) return <span className="text-xs text-slate-400">Never run</span>;
  const map = {
    running:   { icon: Loader2, cls: "text-blue-600 animate-spin",  label: "Running" },
    completed: { icon: CheckCircle, cls: "text-green-600",           label: "Done" },
    failed:    { icon: XCircle, cls: "text-red-500",                 label: "Failed" },
  };
  const { icon: Icon, cls, label } = map[job.status] || map.failed;
  return (
    <span className={`flex items-center gap-1 text-xs font-medium ${cls}`}>
      <Icon className="w-3.5 h-3.5" /> {label}
    </span>
  );
}

function JobRow({ job }) {
  const [open, setOpen] = useState(false);
  if (!job) return null;
  return (
    <div className="border border-slate-100 rounded-lg overflow-hidden text-xs">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <StatusBadge job={job} />
          <span className="text-slate-500">
            {job.startedAt ? new Date(job.startedAt).toLocaleString() : "–"}
          </span>
          <span className="text-green-700">+{job.recordsAdded ?? 0} added</span>
          <span className="text-slate-500">{job.recordsUpdated ?? 0} updated</span>
          {(job.errors?.length > 0) && (
            <span className="text-red-500">{job.errors.length} errors</span>
          )}
        </div>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
      </button>
      {open && job.errors?.length > 0 && (
        <div className="px-3 py-2 bg-red-50 space-y-1">
          {job.errors.slice(0, 10).map((e, i) => (
            <p key={i} className="text-red-600 font-mono">{e}</p>
          ))}
          {job.errors.length > 10 && (
            <p className="text-red-400">…and {job.errors.length - 10} more</p>
          )}
        </div>
      )}
    </div>
  );
}

function SourceCard({ source, runningSet, onToggle, onTrigger, onClear }) {
  const [toggling, setToggling] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const Icon = SOURCE_ICONS[source.source] || Database;
  const catInfo = CATEGORY_LABELS[source.category] || CATEGORY_LABELS.database;
  const isRunning = runningSet.has(source.source);
  const isScrapable = SCRAPER_SOURCES.includes(source.source);

  const handleToggle = async () => {
    setToggling(true);
    await onToggle(source.source, !source.enabled);
    setToggling(false);
  };

  return (
    <div className={`bg-white rounded-xl border transition-all ${source.enabled ? "border-green-200 shadow-sm" : "border-slate-200"}`}>
      {/* Header */}
      <div className="px-5 py-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${source.enabled ? "bg-green-50" : "bg-slate-50"}`}>
            <Icon className={`w-4.5 h-4.5 ${source.enabled ? "text-green-600" : "text-slate-400"}`} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-slate-800">{source.label}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${catInfo.color}`}>
                {catInfo.label}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{source.description}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs text-slate-400">
                <span className="font-semibold text-slate-600">{(source.recordCount || 0).toLocaleString()}</span> records
              </span>
              {source.lastJob && (
                <StatusBadge job={source.lastJob} />
              )}
            </div>
          </div>
        </div>

        {/* Toggle */}
        <button
          onClick={handleToggle}
          disabled={toggling}
          className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
            source.enabled ? "bg-green-500" : "bg-slate-200"
          } ${toggling ? "opacity-50" : ""}`}
          title={source.enabled ? "Disable source" : "Enable source"}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
              source.enabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* Actions row */}
      {(isScrapable || source.recordCount > 0) && (
        <div className="px-5 pb-4 flex items-center gap-2">
          {isScrapable && (
            <button
              onClick={() => onTrigger(source.source)}
              disabled={isRunning}
              className="flex items-center gap-1.5 text-xs font-medium bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {isRunning
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Running…</>
                : <><Play className="w-3.5 h-3.5" /> Run Scraper</>}
            </button>
          )}
          {source.recordCount > 0 && (
            <>
              <button
                onClick={() => setShowDetails(d => !d)}
                className="flex items-center gap-1.5 text-xs font-medium border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
              >
                {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {showDetails ? "Hide" : "Details"}
              </button>
              <button
                onClick={() => onClear(source.source)}
                className="flex items-center gap-1.5 text-xs font-medium border border-red-200 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear Records
              </button>
            </>
          )}
        </div>
      )}

      {/* Last job details */}
      {showDetails && source.lastJob && (
        <div className="px-5 pb-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Last Job</p>
          <JobRow job={source.lastJob} />
        </div>
      )}
    </div>
  );
}

export default function AdminDataSources() {
  const navigate = useNavigate();
  const [sources, setSources] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [runningSet, setRunningSet] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [jobsOpen, setJobsOpen] = useState(false);

  const token = localStorage.getItem("adminToken");

  const fetchSources = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/data-sources`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { navigate("/admin/login"); return; }
      if (!res.ok) { toast.error(`Server error (${res.status})`); return; }
      const data = await res.json();
      setSources(data.sources || []);
    } catch { toast.error("Failed to load data sources"); }
    finally { setLoading(false); }
  }, [token, navigate]);

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/scrapers/jobs?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setJobs(data.jobs || []);
      setRunningSet(new Set(data.running || []));
    } catch {}
  }, [token]);

  useEffect(() => {
    if (!token) { navigate("/admin/login"); return; }
    fetchSources();
    fetchJobs();
  }, [fetchSources, fetchJobs, navigate, token]);

  // Poll for running scraper status
  useEffect(() => {
    if (runningSet.size === 0) return;
    const interval = setInterval(() => {
      fetchSources();
      fetchJobs();
    }, 5000);
    return () => clearInterval(interval);
  }, [runningSet.size, fetchSources, fetchJobs]);

  const handleToggle = async (source, enabled) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/data-sources/${source}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) { toast.error("Failed to update source"); return; }
      setSources(prev => prev.map(s => s.source === source ? { ...s, enabled } : s));
      toast.success(`${enabled ? "Enabled" : "Disabled"} ${source}`);
    } catch { toast.error("Failed to update source"); }
  };

  const handleTrigger = async (source) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/scrapers/${source}/trigger`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.detail || "Failed to start scraper"); return; }
      setRunningSet(prev => new Set([...prev, source]));
      toast.success(`Scraper started for ${source} (Job: ${data.jobId?.slice(0, 8)}…)`);
      setTimeout(fetchJobs, 1000);
    } catch { toast.error("Failed to start scraper"); }
  };

  const handleClear = async (source) => {
    if (!window.confirm(`Delete ALL scraped records for "${source}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/people-records?source=${source}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.detail || "Failed to clear records"); return; }
      toast.success(`Deleted ${data.deleted} records for ${source}`);
      fetchSources();
    } catch { toast.error("Failed to clear records"); }
  };

  const totalRecords = sources.reduce((s, src) => s + (src.recordCount || 0), 0);
  const enabledCount = sources.filter(s => s.enabled).length;

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Data Sources</h1>
            <p className="text-sm text-slate-500 mt-1">
              Toggle which data sources power people search, and run scrapers to populate your internal database.
            </p>
          </div>
          <button
            onClick={() => { fetchSources(); fetchJobs(); }}
            className="flex items-center gap-1.5 text-xs border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 px-5 py-4">
            <p className="text-xl font-bold text-slate-900">{enabledCount}</p>
            <p className="text-sm text-slate-500 mt-0.5">Active Sources</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 px-5 py-4">
            <p className="text-xl font-bold text-slate-900">{totalRecords.toLocaleString()}</p>
            <p className="text-sm text-slate-500 mt-0.5">Internal Records</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 px-5 py-4">
            <p className="text-xl font-bold text-slate-900">{runningSet.size}</p>
            <p className="text-sm text-slate-500 mt-0.5">Running Scrapers</p>
          </div>
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-5 py-4 mb-6">
          <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700">
            When multiple sources are enabled, results are merged and shown together on the search page.
            Whitepages API is the highest-quality source. Internal database results come from scrapers you run below.
          </p>
        </div>

        {/* Source cards */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-7 h-7 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="space-y-3 mb-8">
            {/* API + DB sources first */}
            {sources.filter(s => s.category !== "scraper").map(source => (
              <SourceCard
                key={source.source}
                source={source}
                runningSet={runningSet}
                onToggle={handleToggle}
                onTrigger={handleTrigger}
                onClear={handleClear}
              />
            ))}

            {/* Divider */}
            {sources.some(s => s.category === "scraper") && (
              <div className="flex items-center gap-3 py-2">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Scrapers — Public Data</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
            )}

            {sources.filter(s => s.category === "scraper").map(source => (
              <SourceCard
                key={source.source}
                source={source}
                runningSet={runningSet}
                onToggle={handleToggle}
                onTrigger={handleTrigger}
                onClear={handleClear}
              />
            ))}

            {/* Import sources */}
            {sources.some(s => s.category === "import") && (
              <>
                <div className="flex items-center gap-3 py-2">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Manual Import</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>
                {sources.filter(s => s.category === "import").map(source => (
                  <SourceCard
                    key={source.source}
                    source={source}
                    runningSet={runningSet}
                    onToggle={handleToggle}
                    onTrigger={handleTrigger}
                    onClear={handleClear}
                  />
                ))}
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl px-5 py-4">
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-700">
                    <p className="font-semibold mb-1">How to import voter roll data</p>
                    <ol className="list-decimal ml-4 space-y-1 text-xs">
                      <li>Purchase voter registration data from your target state (Texas: free, Florida: $5)</li>
                      <li>Convert CSV to the <code className="bg-amber-100 px-1 rounded">people_records</code> schema (see docs)</li>
                      <li>Use <code className="bg-amber-100 px-1 rounded">mongoimport</code> to bulk-load the JSON file</li>
                      <li>Set <code className="bg-amber-100 px-1 rounded">source: "voter_rolls"</code> on each record</li>
                      <li>Enable the "Internal Database" source above to include these in searches</li>
                    </ol>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Job history */}
        {jobs.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
            <button
              onClick={() => setJobsOpen(o => !o)}
              className="w-full flex items-center justify-between px-5 py-4 border-b border-slate-100"
            >
              <h2 className="text-sm font-semibold text-slate-800">
                Scraper Job History
                <span className="ml-2 text-xs font-normal text-slate-400">({jobs.length} recent)</span>
              </h2>
              {jobsOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
            {jobsOpen && (
              <div className="divide-y divide-slate-100">
                {jobs.map(job => (
                  <div key={job.jobId} className="px-5 py-3">
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className="text-xs font-semibold text-slate-700 uppercase">{job.source}</span>
                      <StatusBadge job={job} />
                      <span className="text-xs text-slate-400 ml-auto">
                        {job.startedAt ? new Date(job.startedAt).toLocaleString() : "–"}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>+{job.recordsAdded ?? 0} added</span>
                      <span>{job.recordsUpdated ?? 0} updated</span>
                      {job.errors?.length > 0 && (
                        <span className="text-red-500">{job.errors.length} errors</span>
                      )}
                      {job.finishedAt && (
                        <span className="text-slate-400 ml-auto">
                          Finished {new Date(job.finishedAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Admin notes */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Scraper Notes</p>
          <div className="space-y-2 text-xs text-slate-600">
            <p><span className="font-semibold">NSOPW:</span> Searches the National Sex Offender Public Website across all 50 states + territories. Results are public records.</p>
            <p><span className="font-semibold">NPPES:</span> ~6M healthcare providers from CMS. Scraping all states takes 30–60 minutes. Run once per quarter.</p>
            <p><span className="font-semibold">FEC:</span> Uses DEMO_KEY (1000 req/day). For full data, get a free key at <span className="text-blue-600">api.data.gov/signup</span> and update <code className="bg-slate-100 px-1 rounded">backend/scrapers/fec.py</code>.</p>
            <p><span className="font-semibold">FAA:</span> Downloads a ~50MB ZIP from registry.faa.gov and parses ~900K pilot records. First run may take several minutes.</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
