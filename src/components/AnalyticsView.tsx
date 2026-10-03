import React, { useState } from 'react';
import {
  BarChart3,
  Trophy,
  Users2,
  TrendingUp,
  Award,
  Flame,
  Star,
  Search,
  Filter
} from 'lucide-react';
import { Player, Team } from '../types.js';

interface AnalyticsViewProps {
  players: Player[];
  teams: Team[];
  onSelectPlayer: (player: Player) => void;
  onNavigate: (view: string) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  players,
  teams,
  onSelectPlayer,
  onNavigate
}) => {
  const [selectedTeamFilter, setSelectedTeamFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'goals' | 'minutes' | 'rating' | 'assists'>('goals');

  const filteredPlayers = players.filter(p => {
    if (selectedTeamFilter === 'ALL') return true;
    return p.teamId === selectedTeamFilter;
  });

  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    if (sortBy === 'goals') return b.goals - a.goals;
    if (sortBy === 'minutes') return b.minutesPlayed - a.minutesPlayed;
    if (sortBy === 'rating') return b.rating - a.rating;
    return b.assists - a.assists;
  });

  const topScorers = [...players].sort((a, b) => b.goals - a.goals).slice(0, 5);
  const maxGoals = Math.max(...players.map(p => p.goals), 1);
  const maxMinutes = Math.max(...players.map(p => p.minutesPlayed), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight font-['Chakra_Petch'] flex items-center gap-2.5">
            <BarChart3 className="h-6 w-6 text-cyan-400" />
            <span>Player Performance Analytics</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Minutes volume, attacking efficiency, discipline records, and individual match ratings.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2.5">
          <select
            value={selectedTeamFilter}
            onChange={e => setSelectedTeamFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Franchises / Clubs</option>
            {teams.map(t => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="goals">Sort by Goals</option>
            <option value="assists">Sort by Assists</option>
            <option value="minutes">Sort by Minutes Played</option>
            <option value="rating">Sort by Match Rating</option>
          </select>
        </div>
      </div>

      {/* Top Scorers Spotlight Visual Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Golden Boot Leaderboard */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-['Chakra_Petch']">
                Golden Boot Race (Top Scorers)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 font-bold">BIT-57 LEAGUE</span>
          </div>

          <div className="space-y-4">
            {topScorers.map((player, idx) => {
              const pct = (player.goals / maxGoals) * 100;
              return (
                <div key={player.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-400 w-4">{idx + 1}.</span>
                      <img src={player.photoUrl} alt="" className="h-5 w-5 rounded-full object-cover" />
                      <span className="font-semibold text-slate-200">{player.name}</span>
                      <span className="text-[10px] text-slate-400">({player.teamName})</span>
                    </div>
                    <span className="font-mono font-extrabold text-white text-sm">
                      {player.goals} <span className="text-[10px] font-normal text-slate-400">goals</span>
                    </span>
                  </div>

                  {/* Visual Bar */}
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-cyan-400 transition-all duration-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Minutes On Pitch Endurance Chart */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-['Chakra_Petch']">
                Pitch Endurance (Minutes Played)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400 font-bold">TOTAL MINS</span>
          </div>

          <div className="space-y-4">
            {[...players]
              .sort((a, b) => b.minutesPlayed - a.minutesPlayed)
              .slice(0, 5)
              .map((player, idx) => {
                const pct = (player.minutesPlayed / maxMinutes) * 100;
                return (
                  <div key={player.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-cyan-400 w-4">{idx + 1}.</span>
                        <span className="font-semibold text-slate-200">{player.name}</span>
                        <span className="text-[10px] text-slate-400">({player.position})</span>
                      </div>
                      <span className="font-mono font-bold text-cyan-300">
                        {player.minutesPlayed}&apos;
                      </span>
                    </div>

                    <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        style={{ width: `${pct}%` }}
                        className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-500"
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Performance Distribution Summary */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Star className="h-5 w-5 text-purple-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-['Chakra_Petch']">
                Athletic Efficiency Metrics
              </h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Cross-referencing attacking output with discipline records and physical pitch duration.
            </p>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Total Tournament Goals Scored</span>
                <span className="font-bold text-white font-mono">{players.reduce((acc, p) => acc + p.goals, 0)}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Total Playmaker Assists</span>
                <span className="font-bold text-purple-400 font-mono">{players.reduce((acc, p) => acc + p.assists, 0)}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Yellow Cards Issued</span>
                <span className="font-bold text-amber-400 font-mono">{players.reduce((acc, p) => acc + p.yellowCards, 0)}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Red Cards Issued</span>
                <span className="font-bold text-rose-400 font-mono">{players.reduce((acc, p) => acc + p.redCards, 0)}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('workload')}
            className="w-full mt-4 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-colors"
          >
            Check Workload & ACWR Fatigue →
          </button>
        </div>
      </div>

      {/* Complete Individual Performance Roster Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 font-mono text-[11px]">
                <th className="py-3 px-4">Athlete / Player</th>
                <th className="py-3 px-4">Club / Team</th>
                <th className="py-3 px-3 text-center">Position</th>
                <th className="py-3 px-3 text-center">Matches</th>
                <th className="py-3 px-3 text-center">Minutes</th>
                <th className="py-3 px-3 text-center">Goals</th>
                <th className="py-3 px-3 text-center">Assists</th>
                <th className="py-3 px-3 text-center">🟨 Yellow</th>
                <th className="py-3 px-3 text-center">🟥 Red</th>
                <th className="py-3 px-3 text-center">Rating</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sortedPlayers.map(player => (
                <tr key={player.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <img src={player.photoUrl} alt="" className="h-7 w-7 rounded-xl object-cover ring-1 ring-white/10" />
                      <div>
                        <div className="font-bold text-white">{player.name}</div>
                        <span className="text-[10px] text-cyan-400 font-mono">#{player.jerseyNumber}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{player.teamName}</td>
                  <td className="py-3 px-3 text-center text-slate-400 text-[11px]">{player.position}</td>
                  <td className="py-3 px-3 text-center font-mono text-slate-300">{player.matchesPlayed}</td>
                  <td className="py-3 px-3 text-center font-mono text-cyan-400 font-medium">{player.minutesPlayed}&apos;</td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-emerald-400">{player.goals}</td>
                  <td className="py-3 px-3 text-center font-mono font-semibold text-purple-400">{player.assists}</td>
                  <td className="py-3 px-3 text-center font-mono text-amber-400">{player.yellowCards}</td>
                  <td className="py-3 px-3 text-center font-mono text-rose-400">{player.redCards}</td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-white text-sm">{player.rating}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => {
                        onSelectPlayer(player);
                        onNavigate('players');
                      }}
                      className="text-cyan-400 hover:text-cyan-300 text-[11px] font-medium"
                    >
                      Profile →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
