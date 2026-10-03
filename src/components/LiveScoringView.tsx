import React, { useState } from 'react';
import {
  Radio,
  Clock,
  CheckCircle2,
  Lock,
  RefreshCw,
  Trophy,
  AlertTriangle,
  History,
  Tv,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { Match, Role, User } from '../types.js';
import { sportsApi } from '../services/api.js';

interface LiveScoringViewProps {
  matches: Match[];
  selectedMatchId: string;
  onSelectMatch: (id: string) => void;
  onRefresh: () => void;
  currentUser: User;
  onNavigate: (view: string) => void;
}

export const LiveScoringView: React.FC<LiveScoringViewProps> = ({
  matches,
  selectedMatchId,
  onSelectMatch,
  onRefresh,
  currentUser,
  onNavigate
}) => {
  const currentMatch = matches.find(m => m.id === selectedMatchId) || matches.find(m => m.status === 'LIVE') || matches[0];

  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!currentMatch) {
    return (
      <div className="p-8 text-center text-slate-400">
        No active matches found. Generate fixtures first.
      </div>
    );
  }

  const isLive = currentMatch.status === 'LIVE';
  const isCompleted = currentMatch.status === 'COMPLETED';

  const handleScoreUpdate = async (homeDelta: number, awayDelta: number) => {
    if (!isLive) {
      setErrorMessage('Match scores are locked unless match is currently LIVE.');
      return;
    }

    setErrorMessage('');
    setIsUpdating(true);
    try {
      const newHome = Math.max(0, currentMatch.homeScore + homeDelta);
      const newAway = Math.max(0, currentMatch.awayScore + awayDelta);

      await sportsApi.updateScore(currentMatch.id, {
        homeScore: newHome,
        awayScore: newAway,
        expectedVersion: currentMatch.version,
        minute: currentMatch.currentMinute,
        detail: homeDelta !== 0
          ? `Home score updated to ${newHome}`
          : `Away score updated to ${newAway}`,
        userId: currentUser.id,
        userName: currentUser.name
      });
      onRefresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'Optimistic locking failure: score was updated concurrently by another official.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFinalize = async () => {
    if (!window.confirm('Finalize match? This will lock scores, compute standings, update workload analytics, and advance the winner in brackets.')) {
      return;
    }

    setIsUpdating(true);
    try {
      await sportsApi.completeMatch(currentMatch.id, {
        refereeNotes: 'Certified by Match Operations Desk.'
      });
      onRefresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to complete match');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-[10px] font-bold border border-rose-500/30">
              REAL-TIME SCORING STUDIO
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Optimistic Lock Version: v{currentMatch.version}
            </span>
          </div>
          <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight font-['Chakra_Petch'] flex items-center gap-2.5 mt-0.5">
            <Radio className="h-6 w-6 text-rose-500 animate-pulse" />
            <span>Live Scoring Studio</span>
          </h2>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate('tv-display')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <Tv className="h-4 w-4 text-cyan-400" />
            <span>Broadcast TV Mode</span>
          </button>

          <select
            value={currentMatch.id}
            onChange={e => onSelectMatch(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            {matches.map(m => (
              <option key={m.id} value={m.id}>
                {m.status === 'LIVE' ? '🔴 [LIVE] ' : ''}{m.roundName}: {m.homeTeamName} vs {m.awayTeamName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-200 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main High-Resolution Live Match Board */}
      <div className="rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 lg:p-8 shadow-2xl relative overflow-hidden">
        {/* Tournament Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-8">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-400" />
            <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
              {currentMatch.tournamentName} • {currentMatch.roundName}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${
                isLive
                  ? 'bg-rose-500 text-white animate-pulse'
                  : isCompleted
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {currentMatch.status}
            </span>
            <div className="flex items-center gap-1 text-xs text-slate-400 font-mono">
              <Clock className="h-3.5 w-3.5 text-cyan-400" />
              <span>{currentMatch.period} • {currentMatch.currentMinute}&apos;</span>
            </div>
          </div>
        </div>

        {/* Big High-Visibility Score Display */}
        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-6 py-4">
          {/* Home Team */}
          <div className="flex flex-col items-center text-center space-y-3">
            <img
              src={currentMatch.homeTeamLogo}
              alt={currentMatch.homeTeamName}
              className="h-20 w-20 rounded-2xl object-cover ring-2 ring-blue-500/40 shadow-xl shadow-blue-500/20"
            />
            <div>
              <span className="text-[11px] text-blue-400 uppercase font-mono font-bold tracking-wider">Home Club</span>
              <h3 className="text-xl font-bold text-white font-['Chakra_Petch'] leading-snug">
                {currentMatch.homeTeamName}
              </h3>
            </div>

            {/* Quick +/- score buttons for live match */}
            {isLive && (currentUser.role === 'ADMIN' || currentUser.role === 'REFEREE') && (
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => handleScoreUpdate(-1, 0)}
                  disabled={currentMatch.homeScore <= 0 || isUpdating}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 text-xs font-bold"
                >
                  -1
                </button>
                <button
                  onClick={() => handleScoreUpdate(+1, 0)}
                  disabled={isUpdating}
                  className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md"
                >
                  +1 Goal
                </button>
              </div>
            )}
          </div>

          {/* Central Digital Scoreboard */}
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="flex items-center gap-4 px-8 py-4 rounded-3xl bg-slate-950 border border-slate-800 shadow-inner font-mono text-6xl lg:text-7xl font-extrabold tracking-tight">
              <span className="text-cyan-400">{currentMatch.homeScore}</span>
              <span className="text-slate-700 text-4xl">:</span>
              <span className="text-rose-400">{currentMatch.awayScore}</span>
            </div>

            <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
              <span>Concurrency Lock:</span>
              <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-bold">
                v{currentMatch.version}
              </span>
            </div>

            {isCompleted && (
              <div className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold flex items-center gap-1.5 mt-2">
                <Lock className="h-3.5 w-3.5" />
                <span>FINAL RESULT CERTIFIED & LOCKED</span>
              </div>
            )}
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center text-center space-y-3">
            <img
              src={currentMatch.awayTeamLogo}
              alt={currentMatch.awayTeamName}
              className="h-20 w-20 rounded-2xl object-cover ring-2 ring-purple-500/40 shadow-xl shadow-purple-500/20"
            />
            <div>
              <span className="text-[11px] text-purple-400 uppercase font-mono font-bold tracking-wider">Away Club</span>
              <h3 className="text-xl font-bold text-white font-['Chakra_Petch'] leading-snug">
                {currentMatch.awayTeamName}
              </h3>
            </div>

            {/* Quick +/- score buttons for live match */}
            {isLive && (currentUser.role === 'ADMIN' || currentUser.role === 'REFEREE') && (
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => handleScoreUpdate(0, -1)}
                  disabled={currentMatch.awayScore <= 0 || isUpdating}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 text-xs font-bold"
                >
                  -1
                </button>
                <button
                  onClick={() => handleScoreUpdate(0, +1)}
                  disabled={isUpdating}
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md"
                >
                  +1 Goal
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Live Event Stream / Match Log */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <History className="h-4 w-4 text-cyan-400" />
              <span>Official Event Stream ({currentMatch.events.length} Recorded)</span>
            </h4>
            <span className="text-[11px] text-slate-400 font-mono">Referee: {currentMatch.refereeName}</span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {currentMatch.events.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">Match events will stream here live as recorded by the referee.</p>
            ) : (
              currentMatch.events.map(ev => (
                <div
                  key={ev.id}
                  className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-cyan-400 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {ev.minute}&apos;
                    </span>
                    <span className="font-semibold text-white">
                      {ev.type === 'GOAL' ? '⚽ GOAL' : ev.type === 'YELLOW_CARD' ? '🟨 YELLOW CARD' : ev.type === 'RED_CARD' ? '🟥 RED CARD' : ev.type}
                    </span>
                    <span className="text-slate-300">{ev.detail}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Actions Footer */}
        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-slate-400">
            Venue: <strong className="text-white">{currentMatch.venue}</strong> • Time: <strong className="text-white">{currentMatch.date} {currentMatch.time}</strong>
          </div>

          <div className="flex items-center gap-2.5">
            {(currentUser.role === 'ADMIN' || currentUser.role === 'REFEREE') && (
              <button
                onClick={() => onNavigate('referee-console')}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
              >
                Open Whistle Console
              </button>
            )}

            {isLive && (currentUser.role === 'ADMIN' || currentUser.role === 'REFEREE') && (
              <button
                onClick={handleFinalize}
                disabled={isUpdating}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Complete Match & Lock Scores</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
