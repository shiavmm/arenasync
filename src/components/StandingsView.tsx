import React, { useState } from 'react';
import {
  Trophy,
  Shield,
  TrendingUp,
  RefreshCw,
  Medal,
  Sparkles,
  Info
} from 'lucide-react';
import { StandingRecord, Tournament } from '../types.js';

interface StandingsViewProps {
  standings: StandingRecord[];
  tournaments: Tournament[];
  onRefresh: () => void;
}

export const StandingsView: React.FC<StandingsViewProps> = ({
  standings,
  tournaments,
  onRefresh
}) => {
  const [selectedTourId, setSelectedTourId] = useState(tournaments[0]?.id || 'tour-1');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight font-['Chakra_Petch'] flex items-center gap-2.5">
            <Trophy className="h-6 w-6 text-cyan-400" />
            <span>Official Championship Standings</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic relational table computed automatically on certified match completion without manual entry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedTourId}
            onChange={e => setSelectedTourId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            {tournaments.map(t => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          <button
            onClick={onRefresh}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Refresh Standings"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Rules & Tiebreakers Note */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <Info className="h-5 w-5 text-cyan-400 shrink-0" />
          <p className="text-slate-300">
            <strong>Points System:</strong> Win = 3 PTS • Draw = 1 PT • Loss = 0 PTS. Tiebreakers ranked by: 1) Points, 2) Goal Difference (GD), 3) Goals For (GF).
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] shrink-0">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>Top 2 Advance to Finals</span>
          </span>
        </div>
      </div>

      {/* Standings Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 font-mono text-[11px]">
                <th className="py-3.5 px-4 text-center">Rank</th>
                <th className="py-3.5 px-4">Club / Team</th>
                <th className="py-3.5 px-3 text-center">Played</th>
                <th className="py-3.5 px-3 text-center">Won</th>
                <th className="py-3.5 px-3 text-center">Drawn</th>
                <th className="py-3.5 px-3 text-center">Lost</th>
                <th className="py-3.5 px-3 text-center">GF</th>
                <th className="py-3.5 px-3 text-center">GA</th>
                <th className="py-3.5 px-3 text-center">GD</th>
                <th className="py-3.5 px-4 text-center font-bold text-white">Points</th>
                <th className="py-3.5 px-4 text-center">Recent Form</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {standings.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-500">
                    No standings calculated yet. Complete official tournament matches to generate rankings.
                  </td>
                </tr>
              ) : (
                standings.map((row, idx) => {
                  const isTopSeed = idx < 2;
                  return (
                    <tr
                      key={row.teamId}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isTopSeed ? 'bg-cyan-950/10' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center">
                          {idx === 0 ? (
                            <span className="h-6 w-6 rounded-full bg-amber-500/20 text-amber-400 font-bold font-mono flex items-center justify-center border border-amber-500/40">
                              1
                            </span>
                          ) : idx === 1 ? (
                            <span className="h-6 w-6 rounded-full bg-slate-400/20 text-slate-300 font-bold font-mono flex items-center justify-center border border-slate-400/40">
                              2
                            </span>
                          ) : (
                            <span className="font-mono text-slate-500 font-bold">{idx + 1}</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={row.teamLogo}
                            alt={row.teamName}
                            className="h-8 w-8 rounded-xl object-cover ring-1 ring-white/10 shadow-sm"
                          />
                          <div>
                            <div className="font-bold text-white text-sm flex items-center gap-2">
                              <span>{row.teamName}</span>
                              {isTopSeed && (
                                <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-400 text-[9px] font-mono font-semibold uppercase">
                                  Playoffs
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-mono text-cyan-400 font-bold">
                              {row.teamCode}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-center font-mono text-slate-300">{row.played}</td>
                      <td className="py-3.5 px-3 text-center font-mono text-emerald-400 font-semibold">{row.won}</td>
                      <td className="py-3.5 px-3 text-center font-mono text-slate-400">{row.draw}</td>
                      <td className="py-3.5 px-3 text-center font-mono text-rose-400">{row.lost}</td>
                      <td className="py-3.5 px-3 text-center font-mono text-slate-400">{row.goalsFor}</td>
                      <td className="py-3.5 px-3 text-center font-mono text-slate-400">{row.goalsAgainst}</td>
                      <td className="py-3.5 px-3 text-center font-mono font-bold text-cyan-400">
                        {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-extrabold text-white text-base">
                        {row.points}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {row.form.slice(-5).map((f, i) => (
                            <span
                              key={i}
                              className={`h-5 w-5 rounded text-[10px] font-bold flex items-center justify-center text-white font-mono ${
                                f === 'W' ? 'bg-emerald-600' : f === 'D' ? 'bg-amber-600' : 'bg-rose-600'
                              }`}
                              title={f === 'W' ? 'Win' : f === 'D' ? 'Draw' : 'Loss'}
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
