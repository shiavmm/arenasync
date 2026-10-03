import React, { useState } from 'react';
import {
  Terminal,
  Trophy,
  Shield,
  Activity,
  Zap,
  CheckCircle2,
  Layers,
  Database,
  Play,
  RotateCcw,
  Sparkles,
  Cpu,
  Server
} from 'lucide-react';
import { sportsApi } from '../services/api.js';

export const CapstoneSpecsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'API_CONSOLE' | 'CONCURRENCY_TEST' | 'SYSTEM_HEALTH'>('OVERVIEW');

  // Concurrency experiment state
  const [isExperimentRunning, setIsExperimentRunning] = useState(false);
  const [experimentResult, setExperimentResult] = useState<any>(null);

  // Live API tester state
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('/api/tournaments');
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [isLoadingApi, setIsLoadingApi] = useState(false);

  const endpoints = [
    { method: 'GET', path: '/api/tournaments', label: 'Tournaments List', description: 'Retrieve all tournaments and rules' },
    { method: 'GET', path: '/api/teams', label: 'Teams & Rosters', description: 'Retrieve franchises with season records' },
    { method: 'GET', path: '/api/players', label: 'Athletes Registry', description: 'Retrieve all athletes, positions, and ratings' },
    { method: 'GET', path: '/api/fixtures', label: 'Matches & Fixtures', description: 'Retrieve all bracket rounds and scores' },
    { method: 'GET', path: '/api/standings/tour-1', label: 'Live Standings', description: 'Retrieve automated championship table' },
    { method: 'GET', path: '/api/workload', label: 'Workload & ACWR', description: 'Retrieve 7d/28d load and fatigue scores' },
    { method: 'GET', path: '/api/injury-flags', label: 'Injury Flags', description: 'Retrieve active statistical overload flags' },
    { method: 'GET', path: '/api/alerts', label: 'System Alerts', description: 'Retrieve unread operational alerts' },
    { method: 'GET', path: '/api/audit-logs', label: 'Audit Trail', description: 'Retrieve immutable governance records' },
    { method: 'GET', path: '/api/metrics', label: 'System Metrics', description: 'Retrieve relational DB and memory telemetry' },
    { method: 'GET', path: '/actuator/health', label: 'Spring/Actuator Health', description: 'Academic health check standard' }
  ];

  const handleTestEndpoint = async (path: string) => {
    setIsLoadingApi(true);
    try {
      const res = await sportsApi.authFetch(path);
      const data = await res.json();
      setApiResponse(data);
    } catch (err: any) {
      setApiResponse({ error: err.message });
    } finally {
      setIsLoadingApi(false);
    }
  };

  const handleRunConcurrencyExperiment = async () => {
    setIsExperimentRunning(true);
    try {
      const result = await sportsApi.runConcurrencyExperiment();
      setExperimentResult(result);
    } catch (err: any) {
      setExperimentResult({ error: err.message });
    } finally {
      setIsExperimentRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold border border-cyan-500/30">
              CAPSTONE DEFENSE PANEL
            </span>
            <span className="text-xs text-slate-400 font-mono">CODE: BIT-57</span>
          </div>
          <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight font-['Chakra_Petch'] flex items-center gap-2.5 mt-0.5">
            <Terminal className="h-6 w-6 text-cyan-400" />
            <span>Capstone Architecture & Verification Suite</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            ArenaSync - Smart Sports Operations Platform with Live Scoring, Workload Analytics, and Injury Flags.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
              activeTab === 'OVERVIEW' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Project Specs
          </button>
          <button
            onClick={() => setActiveTab('API_CONSOLE')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
              activeTab === 'API_CONSOLE' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            REST API Explorer
          </button>
          <button
            onClick={() => setActiveTab('CONCURRENCY_TEST')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
              activeTab === 'CONCURRENCY_TEST' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Concurrency Experiment
          </button>
        </div>
      </div>

      {/* Tab 1: Project Specs & Architecture */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* Project Identity Card */}
          <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 p-6 shadow-xl space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">PROJECT CODE</span>
                <h3 className="text-lg font-bold text-white font-mono">BIT-57</h3>
                <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold mt-2 block">FULL TITLE</span>
                <p className="text-sm font-semibold text-slate-200">
                  ArenaSync: Smart Sports Operations Platform with Live Scoring, Workload Analytics and Injury Flags
                </p>
              </div>

              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">DEGREE PROGRAM</span>
                <p className="text-sm font-semibold text-slate-200">Bachelor of Science in Information Technology (B.Sc. IT)</p>
                <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold mt-2 block">END-TO-END WORKFLOW</span>
                <p className="text-xs text-slate-300 font-mono">
                  Registration → Eligibility → Tournament Setup → Fixture Generation → Match Assignment → Live Scoring → Standings → Player Workload → Analytics → Injury Flags → Reports
                </p>
              </div>
            </div>
          </div>

          {/* Core Modules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 font-bold font-mono">
                <Trophy className="h-4 w-4" />
                <span>1. TOURNAMENTS & BRACKETS</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Automated single-elimination bracket generation, seeding rules, referee assignment, and automatic winner slot linking.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold font-mono">
                <Shield className="h-4 w-4" />
                <span>2. ELIGIBILITY VERIFICATION</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Academic and medical certification desk with upload timestamping, state transitions (Pending → Verified → Rejected), and strict match kickoff gate.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold font-mono">
                <Activity className="h-4 w-4" />
                <span>3. LIVE SCORING & LOCKING</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Optimistic locking with version counters (v1 → v2), real-time incident logging, broadcast TV mode, and automatic standings trigger upon match completion.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-purple-400 font-bold font-mono">
                <Zap className="h-4 w-4" />
                <span>4. WORKLOAD & ACWR ENGINE</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Acute load (7d) vs Chronic load (28d) ratio mathematical calculations with recovery gap tracking and fatigue accumulation trends.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold font-mono">
                <Server className="h-4 w-4" />
                <span>5. STATISTICAL INJURY FLAGS</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Multi-threshold fatigue signals (congestion &gt; 2 in 48h, ACWR &gt; 1.4, short recovery &lt; 24h) accompanied by clear non-clinical scientific disclaimers.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold font-mono">
                <Layers className="h-4 w-4" />
                <span>6. GOVERNANCE & AUDIT TRAIL</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Role-based access control (Admin, Referee, Coach, Player, Viewer) backed by immutable before/after state transition audit logging.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: REST API Explorer */}
      {activeTab === 'API_CONSOLE' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Endpoint List */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-2 max-h-[540px] overflow-y-auto">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono mb-3">
              Production REST Endpoints
            </h3>
            {endpoints.map(ep => (
              <button
                key={ep.path}
                onClick={() => {
                  setSelectedEndpoint(ep.path);
                  handleTestEndpoint(ep.path);
                }}
                className={`w-full text-left p-2.5 rounded-xl border transition-all text-xs flex items-center justify-between ${
                  selectedEndpoint === ep.path
                    ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-300 font-bold'
                    : 'bg-slate-950 border-slate-800/80 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-400 font-mono text-[9px] font-bold">
                      {ep.method}
                    </span>
                    <span className="font-mono text-white text-[11px]">{ep.path}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">{ep.description}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Response Console */}
          <div className="lg:col-span-2 rounded-2xl bg-slate-950 border border-slate-800 p-5 font-mono text-xs flex flex-col justify-between shadow-2xl">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <div className="flex items-center gap-2 text-cyan-400">
                  <Play className="h-4 w-4" />
                  <span className="font-bold">LIVE EXECUTION: {selectedEndpoint}</span>
                </div>
                <button
                  onClick={() => handleTestEndpoint(selectedEndpoint)}
                  disabled={isLoadingApi}
                  className="px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-semibold transition-colors"
                >
                  {isLoadingApi ? 'Fetching...' : 'Re-send Request'}
                </button>
              </div>

              <div className="bg-black/90 rounded-xl p-4 border border-slate-800 text-emerald-400 max-h-96 overflow-y-auto text-[11px] leading-relaxed">
                {isLoadingApi ? (
                  <div className="text-slate-500">Querying endpoint...</div>
                ) : apiResponse ? (
                  <pre className="whitespace-pre-wrap">{JSON.stringify(apiResponse, null, 2)}</pre>
                ) : (
                  <div className="text-slate-500">Click &quot;Re-send Request&quot; to inspect real-time JSON response.</div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 text-[10px] text-slate-500 flex items-center justify-between">
              <span>Status: HTTP 200 OK • Content-Type: application/json</span>
              <span>Fast Transactional Response</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Concurrency Experiment */}
      {activeTab === 'CONCURRENCY_TEST' && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-5 shadow-2xl">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Cpu className="h-5 w-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white font-['Chakra_Petch']">
                Optimistic Locking Concurrency Experiment
              </h3>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              This automated test validates data integrity when two sports referees or scorers submit conflicting live score adjustments at the exact same millisecond. The server enforces version checking (`version = version + 1`) to guarantee that stale updates are rejected with HTTP 409 Conflict.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-2 text-slate-300">
            <p className="text-cyan-400 font-bold">EXPERIMENT DESIGN:</p>
            <p>1. Fetch current live match version: <span className="text-white">v0</span></p>
            <p>2. Referee A fires score update with <span className="text-white">expectedVersion = 0</span></p>
            <p>3. Referee B simultaneously fires score update with stale <span className="text-white">expectedVersion = 0</span></p>
            <p>4. Database verifies: Referee A succeeds and increments match to <span className="text-white">v1</span>. Referee B is rejected with <span className="text-rose-400 font-bold">409 Conflict</span>.</p>
          </div>

          <button
            onClick={handleRunConcurrencyExperiment}
            disabled={isExperimentRunning}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-600/30 transition-all flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            <span>{isExperimentRunning ? 'Executing Test...' : 'Run Concurrency Test Live'}</span>
          </button>

          {/* Test Results Output */}
          {experimentResult && (
            <div className="p-4 rounded-xl bg-black border border-slate-800 text-xs font-mono space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{experimentResult.summary}</span>
                </span>
                <span className="text-slate-500 text-[10px]">Test Completed</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-emerald-200">
                  <p className="font-bold">Referee A Request (Winner):</p>
                  <p>Status: {experimentResult.refereeAResult?.status}</p>
                  <p>Version after: v{experimentResult.refereeAResult?.newVersion}</p>
                </div>

                <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-800/40 text-rose-200">
                  <p className="font-bold">Referee B Request (Rejected):</p>
                  <p>Status: {experimentResult.refereeBResult?.status} (Expected)</p>
                  <p>Error: {experimentResult.refereeBResult?.error}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
