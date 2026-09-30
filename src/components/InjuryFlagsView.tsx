import React, { useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Info,
  Activity,
  UserCheck,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { InjuryRiskFlag, Player } from '../types.js';

interface InjuryFlagsViewProps {
  injuryFlags: InjuryRiskFlag[];
  players: Player[];
  onSelectPlayer: (player: Player) => void;
  onNavigate: (view: string) => void;
}

export const InjuryFlagsView: React.FC<InjuryFlagsViewProps> = ({
  injuryFlags,
  players,
  onSelectPlayer,
  onNavigate
}) => {
  const [filterRisk, setFilterRisk] = useState<string>('ALL');

  const safeInjuryFlags: InjuryRiskFlag[] = Array.isArray(injuryFlags) ? injuryFlags : ((injuryFlags as any)?.flags || []);

  const filteredFlags = safeInjuryFlags.filter(f => {
    if (filterRisk === 'ALL') return true;
    return f.riskLevel === filterRisk;
  });

  const highRiskCount = safeInjuryFlags.filter(f => f.riskLevel === 'HIGH').length;
  const modRiskCount = safeInjuryFlags.filter(f => f.riskLevel === 'MODERATE').length;
  const lowRiskCount = safeInjuryFlags.filter(f => f.riskLevel === 'LOW').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight font-['Chakra_Petch'] flex items-center gap-2.5">
            <AlertOctagon className="h-6 w-6 text-rose-400" />
            <span>Injury-Risk Flags & Fatigue Sentinel</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Automated mathematical fatigue warnings to mitigate soft-tissue overload and fixture congestion strain.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setFilterRisk('ALL')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filterRisk === 'ALL' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            All Athletes ({injuryFlags.length})
          </button>
          <button
            onClick={() => setFilterRisk('HIGH')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filterRisk === 'HIGH' ? 'bg-rose-600 text-white shadow-sm' : 'text-rose-400 hover:text-white'
            }`}
          >
            🔴 High ({highRiskCount})
          </button>
          <button
            onClick={() => setFilterRisk('MODERATE')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filterRisk === 'MODERATE' ? 'bg-amber-600 text-white shadow-sm' : 'text-amber-400 hover:text-white'
            }`}
          >
            🟡 Moderate ({modRiskCount})
          </button>
          <button
            onClick={() => setFilterRisk('LOW')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filterRisk === 'LOW' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-400 hover:text-white'
            }`}
          >
            🟢 Low ({lowRiskCount})
          </button>
        </div>
      </div>

      {/* Critical Scientific & Legal Disclaimer Box */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-amber-500/40 flex items-start gap-3.5 shadow-lg">
        <Info className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <span className="font-bold text-amber-300 font-mono uppercase tracking-wider">
            Important Sports Science & Clinical Disclaimer
          </span>
          <p className="text-slate-300 leading-relaxed">
            Injury-risk flags are <strong>purely statistical workload heuristics</strong> computed from pitch duration, match congestion within 48 hours, and ACWR ratios. They serve as coaching decision-support flags for athlete rotation and are <strong>not a clinical medical diagnosis</strong> or medical prognosis.
          </p>
        </div>
      </div>

      {/* Risk Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredFlags.map(flag => {
          const matchingPlayer = players.find(p => p.id === flag.playerId);
          const isHigh = flag.riskLevel === 'HIGH';
          const isMod = flag.riskLevel === 'MODERATE';

          return (
            <div
              key={flag.playerId}
              className={`rounded-2xl bg-slate-900 border p-5 shadow-xl flex flex-col justify-between transition-all ${
                isHigh
                  ? 'border-rose-800/60 bg-gradient-to-b from-rose-950/20 to-slate-900'
                  : isMod
                  ? 'border-amber-800/60 bg-gradient-to-b from-amber-950/20 to-slate-900'
                  : 'border-slate-800'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={matchingPlayer?.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                      alt={flag.playerName}
                      className="h-12 w-12 rounded-xl object-cover ring-2 ring-white/10"
                    />
                    <div>
                      <h3 className="font-bold text-white text-base leading-tight">
                        {flag.playerName}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {flag.teamName} • Position: {matchingPlayer?.position || 'Forward'}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold font-mono tracking-wider flex items-center gap-1.5 shadow-sm ${
                      isHigh
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : isMod
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    <span>{isHigh ? '🔴' : isMod ? '🟡' : '🟢'}</span>
                    <span>{flag.riskLevel} RISK</span>
                  </span>
                </div>

                {/* Risk Score Meter */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-400 font-mono">Statistical Fatigue Index</span>
                    <span className="font-mono font-bold text-white text-sm">
                      {flag.riskScore} <span className="text-xs text-slate-500">/ 100</span>
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${flag.riskScore}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${
                        isHigh
                          ? 'bg-gradient-to-r from-rose-500 to-rose-400'
                          : isMod
                          ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                          : 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                      }`}
                    />
                  </div>
                </div>

                {/* Specific Risk Trigger Signals */}
                <div className="space-y-2 text-xs">
                  <span className="font-bold text-slate-300 font-mono uppercase tracking-wider text-[11px]">
                    Identified Overload Triggers:
                  </span>
                  <ul className="space-y-1.5">
                    {flag.reasons.map((r, i) => (
                      <li
                        key={i}
                        className={`p-2 rounded-xl flex items-start gap-2 ${
                          isHigh
                            ? 'bg-rose-950/40 text-rose-200 border border-rose-800/40'
                            : isMod
                            ? 'bg-amber-950/40 text-amber-200 border border-amber-800/40'
                            : 'bg-slate-950 text-slate-300 border border-slate-800'
                        }`}
                      >
                        <span className="shrink-0 mt-0.5">•</span>
                        <span className="leading-snug">{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommended Coach Action */}
                <div className="mt-3 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                  <span className="text-cyan-400 font-mono font-bold text-[10px] block uppercase mb-0.5">
                    Recommended Technical Staff Action:
                  </span>
                  <p className="text-[11px] text-slate-300">
                    {isHigh
                      ? 'Immediate squad rotation advised. Limit athlete to maximum 30 minutes in upcoming fixture or bench to allow cellular muscle recovery.'
                      : isMod
                      ? 'Monitor heart rate and sprint distance during warmups. Consider substitution at minute 60.'
                      : 'Athlete within optimal load thresholds. Cleared for standard 90-minute competitive intensity.'}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 mt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500 font-mono">
                  Assessed: {flag.lastCalculated}
                </span>

                {matchingPlayer && (
                  <button
                    onClick={() => {
                      onSelectPlayer(matchingPlayer);
                      onNavigate('players');
                    }}
                    className="text-cyan-400 hover:text-cyan-300 font-semibold text-[11px]"
                  >
                    View Player File →
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
