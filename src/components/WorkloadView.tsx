import React, { useState } from 'react';
import {
  Flame,
  Activity,
  AlertTriangle,
  Info,
  Clock,
  Calendar,
  Zap,
  CheckCircle2,
  TrendingUp,
  AlertOctagon
} from 'lucide-react';
import { PlayerWorkload, Player, Role } from '../types.js';

interface WorkloadViewProps {
  workloads: PlayerWorkload[];
  players: Player[];
  onSelectPlayer: (player: Player) => void;
  onNavigate: (view: string) => void;
}

export const WorkloadView: React.FC<WorkloadViewProps> = ({
  workloads,
  players,
  onSelectPlayer,
  onNavigate
}) => {
  const [levelFilter, setLevelFilter] = useState<string>('ALL');

  const safeWorkloads: PlayerWorkload[] = Array.isArray(workloads) ? workloads : ((workloads as any)?.workloads || []);

  const filteredWorkloads = safeWorkloads.filter(w => {
    if (levelFilter === 'ALL') return true;
    return w.workloadLevel === levelFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight font-['Chakra_Petch'] flex items-center gap-2.5">
            <Flame className="h-6 w-6 text-amber-400" />
            <span>Player Workload & ACWR Analytics</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Sports science fatigue tracking based on the Acute:Chronic Workload Ratio (Gabbett Model).
          </p>
        </div>

        {/* Level Filters */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          {['ALL', 'LOW', 'NORMAL', 'HIGH', 'VERY_HIGH'].map(lvl => (
            <button
              key={lvl}
              onClick={() => setLevelFilter(lvl)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                levelFilter === lvl
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {lvl.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Scientific Formula & ACWR Mathematical Reference Box */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-cyan-500/30 p-5 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold border border-cyan-500/30">
                MATHEMATICAL LOAD ENGINE
              </span>
              <h3 className="text-sm font-bold text-white font-['Chakra_Petch']">
                Acute:Chronic Workload Ratio (ACWR) Formula & Thresholds
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-cyan-400 font-mono font-bold uppercase">1. Acute Load (7 Days)</span>
                <p className="text-slate-300 mt-1">
                  Sum of high-intensity competitive match minutes over the rolling past 7 days (representing fatigue).
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-blue-400 font-mono font-bold uppercase">2. Chronic Load (28 Days)</span>
                <p className="text-slate-300 mt-1">
                  Average weekly match minutes over the rolling past 28 days (representing physical fitness baseline).
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-amber-400 font-mono font-bold uppercase">3. ACWR Ratio & Sweet Spot</span>
                <p className="text-slate-300 mt-1">
                  <strong>ACWR = Acute ÷ Chronic</strong>. Optimal athletic &quot;Sweet Spot&quot; is <strong>0.80 – 1.30</strong>. Spike &gt; <strong>1.50</strong> triggers elevated injury probability.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Workload Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWorkloads.map(wl => {
          const matchingPlayer = players.find(p => p.id === wl.playerId);
          const isDanger = wl.workloadLevel === 'VERY_HIGH';
          const isHigh = wl.workloadLevel === 'HIGH';
          const isNormal = wl.workloadLevel === 'NORMAL';

          return (
            <div
              key={wl.playerId}
              className={`rounded-2xl bg-slate-900 border p-5 shadow-lg flex flex-col justify-between transition-all ${
                isDanger
                  ? 'border-rose-800/60 bg-rose-950/10'
                  : isHigh
                  ? 'border-amber-800/50 bg-amber-950/10'
                  : 'border-slate-800'
              }`}
            >
              <div>
                {/* Athlete Identity */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-bold text-white text-base leading-tight">
                      {wl.playerName}
                    </h3>
                    <span className="text-xs text-slate-400">{wl.teamName}</span>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono tracking-wider ${
                      isDanger
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : isHigh
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : isNormal
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    {wl.workloadLevel.replace('_', ' ')}
                  </span>
                </div>

                {/* Big ACWR & Score Gauge */}
                <div className="grid grid-cols-2 gap-2 text-center p-3 rounded-xl bg-slate-950/80 border border-slate-800 mb-4">
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono">ACWR RATIO</span>
                    <p
                      className={`text-2xl font-extrabold font-mono mt-0.5 ${
                        wl.breakdown.acwr > 1.4 ? 'text-rose-400' : 'text-cyan-400'
                      }`}
                    >
                      {wl.breakdown.acwr}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-mono">WORKLOAD SCORE</span>
                    <p className="text-2xl font-extrabold font-mono text-white mt-0.5">
                      {wl.workloadScore}
                      <span className="text-xs font-normal text-slate-500">/100</span>
                    </p>
                  </div>
                </div>

                {/* Workload Breakdown Details */}
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-cyan-400" />
                      <span>Acute Load (7 Days):</span>
                    </span>
                    <strong className="text-white font-mono">{wl.breakdown.acuteLoadMinutes} mins</strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-blue-400" />
                      <span>Chronic Baseline (28d avg):</span>
                    </span>
                    <strong className="text-white font-mono">{wl.breakdown.chronicLoadMinutes} mins</strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-amber-400" />
                      <span>Matches in last 48h:</span>
                    </span>
                    <strong
                      className={`font-mono ${
                        wl.breakdown.matchesInLast48h >= 2 ? 'text-rose-400 font-bold' : 'text-white'
                      }`}
                    >
                      {wl.breakdown.matchesInLast48h} matches
                    </strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-purple-400" />
                      <span>Recovery Gap:</span>
                    </span>
                    <strong
                      className={`font-mono ${
                        wl.breakdown.recoveryGapHours < 24 ? 'text-rose-400 font-bold' : 'text-emerald-400'
                      }`}
                    >
                      {wl.breakdown.recoveryGapHours} hours
                    </strong>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500 font-mono">
                  {wl.breakdown.acwr > 1.4 ? '📈 Load Spiking' : wl.breakdown.acwr < 0.8 ? '📉 Under-Loaded' : '➡️ Optimal Load (Sweet Spot)'}
                </span>

                {matchingPlayer && (
                  <button
                    onClick={() => {
                      onSelectPlayer(matchingPlayer);
                      onNavigate('injury-flags');
                    }}
                    className="text-cyan-400 hover:text-cyan-300 font-medium text-[11px]"
                  >
                    View Risk Signal →
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
