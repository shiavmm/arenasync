import React from 'react';
import {
  Trophy,
  Users2,
  Calendar,
  Activity,
  Flame,
  AlertOctagon,
  ArrowUpRight,
  Tv,
  CheckCircle2,
  Clock,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  Radio
} from 'lucide-react';
import { Tournament, Team, Player, Match, SystemAlert, PlayerWorkload, InjuryRiskFlag } from '../types.js';

interface DashboardViewProps {
  tournaments: Tournament[];
  teams: Team[];
  players: Player[];
  matches: Match[];
  alerts: SystemAlert[];
  workloads: PlayerWorkload[];
  injuryFlags: InjuryRiskFlag[];
  onNavigate: (view: string) => void;
  onSelectMatch: (matchId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tournaments,
  teams,
  players,
  matches,
  alerts,
  workloads,
  injuryFlags,
  onNavigate,
  onSelectMatch
}) => {
  const safeMatches = Array.isArray(matches) ? matches : [];
  const safeInjuryFlags: InjuryRiskFlag[] = Array.isArray(injuryFlags) ? injuryFlags : ((injuryFlags as any)?.flags || []);
  const safeWorkloads: PlayerWorkload[] = Array.isArray(workloads) ? workloads : ((workloads as any)?.workloads || []);
  const safePlayers = Array.isArray(players) ? players : [];

  const liveMatch = safeMatches.find(m => m.status === 'LIVE');
  const completedMatches = safeMatches.filter(m => m.status === 'COMPLETED');
  const upcomingMatches = safeMatches.filter(m => m.status === 'SCHEDULED');
  const highRiskPlayers = safeInjuryFlags.filter(f => f.riskLevel === 'HIGH');
  const moderateRiskPlayers = safeInjuryFlags.filter(f => f.riskLevel === 'MODERATE');
  const pendingDocs = safePlayers.filter(p => p.eligibilityStatus === 'PENDING');

  // Workload distributions
  const lowWorkloadCount = safeWorkloads.filter(w => w.workloadLevel === 'LOW').length;
  const normalWorkloadCount = safeWorkloads.filter(w => w.workloadLevel === 'NORMAL').length;
  const highWorkloadCount = safeWorkloads.filter(w => w.workloadLevel === 'HIGH').length;
  const veryHighWorkloadCount = safeWorkloads.filter(w => w.workloadLevel === 'VERY_HIGH').length;
  const totalWorkloads = safeWorkloads.length || 1;

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero Overview */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/60 p-6 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-mono">
                Project Code: BIT-57
              </span>
              <span className="text-xs text-slate-400 font-medium">B.Sc. IT Capstone Platform</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight font-['Chakra_Petch']">
              ArenaSync Operations & Workload Platform
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Real-time match scoring engine, automated bracket progression, ACWR player workload analytics, and statistical injury-risk flags.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigate('fixtures')}
              className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-lg shadow-cyan-600/30 transition-all flex items-center gap-1.5"
            >
              <Calendar className="h-4 w-4" />
              <span>Fixtures & Bracket</span>
            </button>
            <button
              onClick={() => onNavigate('tv-display')}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-all flex items-center gap-1.5"
            >
              <Tv className="h-4 w-4 text-cyan-400" />
              <span>Broadcast TV</span>
            </button>
          </div>
        </div>

        {/* Decorative background grid line */}
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-cyan-500/10 to-transparent pointer-events-none" />
      </div>

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-xl yinz-panel transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Tournament</span>
            <Trophy className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono text-glow-cyan">{tournaments.length}</div>
          <p className="text-[10px] text-slate-500 mt-1 uppercase font-mono">Inter-Collegiate 2026</p>
        </div>

        <div className="p-4 rounded-xl yinz-panel transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Teams</span>
            <Users2 className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono text-glow-cyan">{teams.length}</div>
          <p className="text-[10px] text-slate-500 mt-1 uppercase font-mono">8 Seeded Rosters</p>
        </div>

        <div className="p-4 rounded-xl yinz-panel transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Live Match</span>
            <Radio className="h-4 w-4 text-rose-500 animate-pulse" />
          </div>
          <div className="text-3xl font-extrabold text-rose-400 font-mono text-glow-red">
            {liveMatch ? '1 LIVE' : '0'}
          </div>
          <p className="text-[10px] text-slate-500 mt-1 uppercase font-mono">
            {liveMatch ? `${liveMatch.period} • ${liveMatch.currentMinute}'` : 'None in progress'}
          </p>
        </div>

        <div className="p-4 rounded-xl yinz-panel transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Completed</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 font-mono">{completedMatches.length}</div>
          <p className="text-[10px] text-slate-500 mt-1 uppercase font-mono">QF Rounds Certified</p>
        </div>

        <div className="p-4 rounded-xl yinz-panel transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">High Risk</span>
            <AlertOctagon className="h-4 w-4 text-rose-400" />
          </div>
          <div className="text-3xl font-extrabold text-rose-400 font-mono text-glow-red">{highRiskPlayers.length} <span className="text-xl">🔴</span></div>
          <p className="text-[10px] text-slate-500 mt-1 uppercase font-mono">ACWR Spike / Congestion</p>
        </div>

        <div className="p-4 rounded-xl yinz-panel transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Verification</span>
            <ShieldCheck className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-extrabold text-cyan-400 font-mono text-glow-cyan">{pendingDocs.length} <span className="text-xl">PEND</span></div>
          <p className="text-[10px] text-slate-500 mt-1 uppercase font-mono">Eligibility Gate Active</p>
        </div>
      </div>

      {/* Main Content: Live Match Spotlight + Workload/Risk Gauges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Match Spotlight & Recent Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Live Match Spotlight Card */}
          {liveMatch && (
            <div className="rounded-2xl yinz-panel border-glow p-5 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                  </span>
                  <span className="text-xs font-bold text-rose-400 uppercase tracking-widest font-mono">
                    OFFICIAL LIVE MATCH IN PROGRESS
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                  <Clock className="h-3.5 w-3.5 text-cyan-400" />
                  <span>{liveMatch.period} • {liveMatch.currentMinute}&apos;</span>
                </div>
              </div>

              {/* Match Scoreboard Component */}
              <div className="grid grid-cols-3 items-center py-4">
                {/* Home Team */}
                <div className="flex flex-col items-center text-center">
                  <img
                    src={liveMatch.homeTeamLogo}
                    alt={liveMatch.homeTeamName}
                    className="h-16 w-16 object-cover rounded-2xl ring-2 ring-blue-500/40 shadow-lg shadow-blue-500/20 mb-2"
                  />
                  <h3 className="font-bold text-white text-base leading-tight">{liveMatch.homeTeamName}</h3>
                  <span className="text-[11px] text-slate-400 mt-0.5">Home Seed</span>
                </div>

                {/* Live Score Display */}
                <div className="flex flex-col items-center justify-center">
                  <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-inner font-mono text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
                    <span className="text-cyan-400">{liveMatch.homeScore}</span>
                    <span className="text-slate-600 text-3xl">:</span>
                    <span className="text-rose-400">{liveMatch.awayScore}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono mt-2 font-medium">
                    {liveMatch.roundName}
                  </span>
                </div>

                {/* Away Team */}
                <div className="flex flex-col items-center text-center">
                  <img
                    src={liveMatch.awayTeamLogo}
                    alt={liveMatch.awayTeamName}
                    className="h-16 w-16 object-cover rounded-2xl ring-2 ring-purple-500/40 shadow-lg shadow-purple-500/20 mb-2"
                  />
                  <h3 className="font-bold text-white text-base leading-tight">{liveMatch.awayTeamName}</h3>
                  <span className="text-[11px] text-slate-400 mt-0.5">Away Seed</span>
                </div>
              </div>

              {/* Action Buttons for Live Match */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 mt-2">
                <div className="text-xs text-slate-400">
                  Venue: <span className="text-slate-200">{liveMatch.venue}</span> • Referee:{' '}
                  <span className="text-amber-300 font-medium">{liveMatch.refereeName}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onSelectMatch(liveMatch.id);
                      onNavigate('referee-console');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all flex items-center gap-1.5"
                  >
                    <span>Referee Whistle</span>
                  </button>
                  <button
                    onClick={() => {
                      onSelectMatch(liveMatch.id);
                      onNavigate('live-scoring');
                    }}
                    className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-1.5"
                  >
                    <span>Open Live Scoring</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tournament Standings & Recent Results Preview */}
          <div className="rounded-2xl yinz-panel p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-['Chakra_Petch']">
                  Championship Standings
                </h3>
                <p className="text-xs text-slate-400">Calculated dynamically after each certified match</p>
              </div>
              <button
                onClick={() => onNavigate('standings')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
              >
                <span>Full Table</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                    <th className="pb-2.5 font-semibold">Rank</th>
                    <th className="pb-2.5 font-semibold">Club / Team</th>
                    <th className="pb-2.5 font-semibold text-center">P</th>
                    <th className="pb-2.5 font-semibold text-center">W</th>
                    <th className="pb-2.5 font-semibold text-center">D</th>
                    <th className="pb-2.5 font-semibold text-center">L</th>
                    <th className="pb-2.5 font-semibold text-center">GD</th>
                    <th className="pb-2.5 font-semibold text-center text-white">PTS</th>
                    <th className="pb-2.5 font-semibold text-center">Form</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {teams.slice(0, 5).map((team, idx) => (
                    <tr key={team.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 font-mono text-slate-400 font-bold">{idx + 1}</td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={team.logoUrl}
                            alt={team.name}
                            className="h-6 w-6 rounded-lg object-cover ring-1 ring-white/10"
                          />
                          <span className="font-medium text-slate-200">{team.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 text-center font-mono text-slate-400">{team.matchesPlayed}</td>
                      <td className="py-2.5 text-center font-mono text-slate-400">{team.wins}</td>
                      <td className="py-2.5 text-center font-mono text-slate-400">{team.draws}</td>
                      <td className="py-2.5 text-center font-mono text-slate-400">{team.losses}</td>
                      <td className="py-2.5 text-center font-mono font-medium text-cyan-400">
                        {team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}
                      </td>
                      <td className="py-2.5 text-center font-mono font-bold text-white text-sm">{team.points}</td>
                      <td className="py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {team.recentForm.slice(-4).map((f, i) => (
                            <span
                              key={i}
                              className={`h-4 w-4 rounded text-[9px] font-bold flex items-center justify-center text-white font-mono ${
                                f === 'W' ? 'bg-emerald-600' : f === 'D' ? 'bg-amber-600' : 'bg-rose-600'
                              }`}
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Player Workload & Injury Risk Distribution */}
        <div className="space-y-6">
          {/* Workload Distribution Card */}
          <div className="rounded-2xl yinz-panel p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-['Chakra_Petch']">
                  Workload Status (ACWR)
                </h3>
              </div>
              <button
                onClick={() => onNavigate('workload')}
                className="text-[11px] text-cyan-400 hover:underline"
              >
                View Analytics →
              </button>
            </div>

            <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
              Acute:Chronic Workload Ratio tracking matches played in 48h, recovery gap hours, and fatigue accumulation.
            </p>

            {/* Distribution Stacked Bar */}
            <div className="h-3 w-full rounded-full overflow-hidden flex bg-slate-800 mb-3">
              <div
                style={{ width: `${(lowWorkloadCount / totalWorkloads) * 100}%` }}
                className="bg-emerald-500 h-full transition-all"
                title={`Low Workload: ${lowWorkloadCount}`}
              />
              <div
                style={{ width: `${(normalWorkloadCount / totalWorkloads) * 100}%` }}
                className="bg-blue-500 h-full transition-all"
                title={`Normal Workload: ${normalWorkloadCount}`}
              />
              <div
                style={{ width: `${(highWorkloadCount / totalWorkloads) * 100}%` }}
                className="bg-amber-500 h-full transition-all"
                title={`High Workload: ${highWorkloadCount}`}
              />
              <div
                style={{ width: `${(veryHighWorkloadCount / totalWorkloads) * 100}%` }}
                className="bg-rose-500 h-full transition-all"
                title={`Very High Workload: ${veryHighWorkloadCount}`}
              />
            </div>

            {/* Legend with counts */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-slate-300 text-[11px]">Low: {lowWorkloadCount}</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="text-slate-300 text-[11px]">Optimal: {normalWorkloadCount}</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span className="text-slate-300 text-[11px]">Elevated: {highWorkloadCount}</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                <span className="text-slate-300 text-[11px]">Danger: {veryHighWorkloadCount}</span>
              </div>
            </div>
          </div>

          {/* Injury-Risk Flag Warnings Card */}
          <div className="rounded-2xl yinz-panel p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertOctagon className="h-4 w-4 text-rose-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-['Chakra_Petch']">
                  Injury-Risk Flags
                </h3>
              </div>
              <button
                onClick={() => onNavigate('injury-flags')}
                className="text-[11px] text-rose-400 hover:underline"
              >
                Inspect All Flags →
              </button>
            </div>

            <div className="space-y-3">
              {highRiskPlayers.map(flag => (
                <div
                  key={flag.playerId}
                  className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/40 text-xs text-rose-200"
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>{flag.playerName} ({flag.teamName})</span>
                    <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-[10px]">
                      🔴 HIGH RISK
                    </span>
                  </div>
                  <ul className="mt-2 space-y-1 text-[11px] text-rose-300/80 list-disc list-inside">
                    {flag.reasons.slice(0, 2).map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              ))}

              {moderateRiskPlayers.slice(0, 1).map(flag => (
                <div
                  key={flag.playerId}
                  className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 text-xs text-amber-200"
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>{flag.playerName} ({flag.teamName})</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px]">
                      🟡 MODERATE
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-amber-300/80">{flag.reasons[0]}</p>
                </div>
              ))}
            </div>

            <div className="mt-3 p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-[10px] text-slate-400 italic">
              Statistical risk indicators based on physical load thresholds; not clinical medical diagnoses.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
