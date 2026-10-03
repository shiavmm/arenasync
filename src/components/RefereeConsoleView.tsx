import React, { useState } from 'react';
import {
  Radio,
  Clock,
  Play,
  CheckCircle2,
  AlertTriangle,
  FileText,
  UserCheck,
  Plus,
  Minus,
  RotateCcw,
  Shield,
  ArrowRightLeft
} from 'lucide-react';
import { Match, Player, Role, User, InjuryRiskFlag } from '../types.js';
import { sportsApi } from '../services/api.js';

interface RefereeConsoleViewProps {
  matches: Match[];
  players: Player[];
  selectedMatchId: string;
  onSelectMatch: (id: string) => void;
  onRefresh: () => void;
  currentUser: User;
  injuryFlags?: InjuryRiskFlag[];
}

export const RefereeConsoleView: React.FC<RefereeConsoleViewProps> = ({
  matches,
  players,
  selectedMatchId,
  onSelectMatch,
  onRefresh,
  currentUser,
  injuryFlags = []
}) => {
  const currentMatch = matches.find(m => m.id === selectedMatchId) || matches.find(m => m.status === 'LIVE') || matches[0];

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refereeNotes, setRefereeNotes] = useState(currentMatch?.refereeNotes || '');

  // Event modal state
  const [selectedEventType, setSelectedEventType] = useState<'GOAL' | 'YELLOW_CARD' | 'RED_CARD' | 'FOUL' | 'SUBSTITUTION' | null>(null);
  const [eventTeamId, setEventTeamId] = useState<string>(currentMatch?.homeTeamId || '');
  const [eventPlayerId, setEventPlayerId] = useState<string>('');
  const [eventSubInPlayerId, setEventSubInPlayerId] = useState<string>('');
  const [eventMinute, setEventMinute] = useState<number>(currentMatch?.currentMinute || 68);

  if (!currentMatch) {
    return (
      <div className="p-8 text-center text-slate-400">
        No matches currently scheduled or assigned.
      </div>
    );
  }

  // Kickoff Clearance Gate: Filter out inactive, unverified, or blocked manual flags (HIGH or SUSPENSION)
  const isPlayerBlockedByInjuryFlag = (playerId: string) => {
    return injuryFlags.some(
      f => f.playerId === playerId &&
           f.source === 'MANUAL' &&
           (f.status || 'ACTIVE') === 'ACTIVE' &&
           (f.severity === 'HIGH' || f.category === 'SUSPENSION')
    );
  };

  const homePlayers = players.filter(
    p => p.teamId === currentMatch.homeTeamId &&
         p.status !== 'INACTIVE' &&
         p.eligibilityStatus === 'VERIFIED' &&
         !isPlayerBlockedByInjuryFlag(p.id)
  );
  const awayPlayers = players.filter(
    p => p.teamId === currentMatch.awayTeamId &&
         p.status !== 'INACTIVE' &&
         p.eligibilityStatus === 'VERIFIED' &&
         !isPlayerBlockedByInjuryFlag(p.id)
  );
  const activeTeamPlayers = eventTeamId === currentMatch.homeTeamId ? homePlayers : awayPlayers;

  const handleStartMatch = async () => {
    setIsSubmitting(true);
    try {
      await sportsApi.startMatch(currentMatch.id, currentUser.name);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to start match');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScoreAdjust = async (isHome: boolean, delta: number) => {
    const newHomeScore = isHome ? Math.max(0, currentMatch.homeScore + delta) : currentMatch.homeScore;
    const newAwayScore = !isHome ? Math.max(0, currentMatch.awayScore + delta) : currentMatch.awayScore;

    setIsSubmitting(true);
    try {
      await sportsApi.updateScore(currentMatch.id, {
        homeScore: newHomeScore,
        awayScore: newAwayScore,
        expectedVersion: currentMatch.version,
        minute: currentMatch.currentMinute,
        scoringTeamId: delta > 0 ? (isHome ? currentMatch.homeTeamId : currentMatch.awayTeamId) : undefined,
        detail: delta > 0 ? `Goal scored by ${isHome ? currentMatch.homeTeamName : currentMatch.awayTeamName}` : 'Score corrected by referee',
        userId: currentUser.id,
        userName: currentUser.name
      });
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Score update failed. Version conflict detected.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordEvent = async () => {
    if (!selectedEventType) return;
    const player = players.find(p => p.id === eventPlayerId);
    const subInPlayer = players.find(p => p.id === eventSubInPlayerId);

    setIsSubmitting(true);
    try {
      let detail = '';
      if (selectedEventType === 'GOAL') {
        detail = `Goal scored by ${player?.name || 'Player'}`;
      } else if (selectedEventType === 'YELLOW_CARD') {
        detail = `Yellow card issued to ${player?.name || 'Player'}`;
      } else if (selectedEventType === 'RED_CARD') {
        detail = `Red card issued to ${player?.name || 'Player'}`;
      } else if (selectedEventType === 'SUBSTITUTION') {
        detail = `Sub: ${subInPlayer?.name || 'In'} replaces ${player?.name || 'Out'}`;
      } else {
        detail = `Foul committed by ${player?.name || 'Player'}`;
      }

      await sportsApi.recordEvent(currentMatch.id, {
        type: selectedEventType,
        minute: eventMinute,
        teamId: eventTeamId,
        playerId: eventPlayerId || undefined,
        playerName: player?.name,
        secondaryPlayerId: eventSubInPlayerId || undefined,
        secondaryPlayerName: subInPlayer?.name,
        detail
      });

      // If goal, also increment score automatically!
      if (selectedEventType === 'GOAL') {
        const isHome = eventTeamId === currentMatch.homeTeamId;
        await sportsApi.updateScore(currentMatch.id, {
          homeScore: isHome ? currentMatch.homeScore + 1 : currentMatch.homeScore,
          awayScore: !isHome ? currentMatch.awayScore + 1 : currentMatch.awayScore,
          expectedVersion: currentMatch.version + 1,
          minute: eventMinute,
          scoringTeamId: eventTeamId,
          playerId: player?.id,
          playerName: player?.name,
          detail: `Goal by ${player?.name}`,
          userId: currentUser.id,
          userName: currentUser.name
        });
      }

      setSelectedEventType(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to record event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteMatch = async () => {
    if (!window.confirm('Are you sure you want to finalize this match? This will lock scores, calculate standings, update player workloads, and advance the winner in the tournament bracket!')) {
      return;
    }

    setIsSubmitting(true);
    try {
      await sportsApi.completeMatch(currentMatch.id, {
        refereeNotes
      });
      alert('Match successfully completed and certified! Standings, player workloads, and tournament brackets have been updated.');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to complete match');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header with Match Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold border border-amber-500/30">
              OFFICIAL REFEREE WHISTLE
            </span>
            <span className="text-xs text-slate-400 font-mono">ID: {currentMatch.id}</span>
          </div>
          <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight font-['Chakra_Petch'] flex items-center gap-2.5 mt-0.5">
            <Radio className="h-6 w-6 text-amber-400" />
            <span>Referee Match Console</span>
          </h2>
        </div>

        {/* Match Selector */}
        <select
          value={currentMatch.id}
          onChange={e => onSelectMatch(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
        >
          {matches.map(m => (
            <option key={m.id} value={m.id}>
              {m.status === 'LIVE' ? '🔴 [LIVE] ' : ''}{m.roundName}: {m.homeTeamName} vs {m.awayTeamName}
            </option>
          ))}
        </select>
      </div>

      {/* Match Control Board */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl relative overflow-hidden">
        {/* Status Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${
                currentMatch.status === 'LIVE'
                  ? 'bg-rose-500 text-white animate-pulse'
                  : currentMatch.status === 'COMPLETED'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {currentMatch.status}
            </span>
            <span className="text-xs font-mono text-slate-400">
              {currentMatch.period} • {currentMatch.currentMinute}&apos;
            </span>
          </div>

          <div className="flex items-center gap-2">
            {currentMatch.status === 'SCHEDULED' && (
              <button
                onClick={handleStartMatch}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition-all"
              >
                <Play className="h-4 w-4" />
                <span>Kick Off / Start Match</span>
              </button>
            )}

            {currentMatch.status === 'LIVE' && (
              <button
                onClick={handleCompleteMatch}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 flex items-center gap-1.5 transition-all"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Final Whistle & Certify</span>
              </button>
            )}
          </div>
        </div>

        {/* Big Touch-Friendly Scoreboard & Steppers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Home Team Side */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-blue-500/30 text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <img
                src={currentMatch.homeTeamLogo}
                alt={currentMatch.homeTeamName}
                className="h-12 w-12 rounded-xl object-cover ring-2 ring-blue-500/40"
              />
              <div className="text-left">
                <span className="text-[10px] text-blue-400 uppercase font-mono font-bold">HOME TEAM</span>
                <h3 className="font-bold text-white text-lg leading-tight">{currentMatch.homeTeamName}</h3>
              </div>
            </div>

            {/* Score */}
            <div className="font-mono text-6xl font-extrabold text-cyan-400">
              {currentMatch.homeScore}
            </div>

            {/* Touch Adjusters */}
            {currentMatch.status === 'LIVE' && (
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => handleScoreAdjust(true, -1)}
                  disabled={currentMatch.homeScore <= 0 || isSubmitting}
                  className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 font-bold"
                  title="Decrement score"
                >
                  <Minus className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleScoreAdjust(true, +1)}
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm shadow-lg shadow-cyan-600/30 flex items-center gap-2"
                >
                  <Plus className="h-5 w-5" />
                  <span>+1 Goal</span>
                </button>
              </div>
            )}
          </div>

          {/* Away Team Side */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-purple-500/30 text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <img
                src={currentMatch.awayTeamLogo}
                alt={currentMatch.awayTeamName}
                className="h-12 w-12 rounded-xl object-cover ring-2 ring-purple-500/40"
              />
              <div className="text-left">
                <span className="text-[10px] text-purple-400 uppercase font-mono font-bold">AWAY TEAM</span>
                <h3 className="font-bold text-white text-lg leading-tight">{currentMatch.awayTeamName}</h3>
              </div>
            </div>

            {/* Score */}
            <div className="font-mono text-6xl font-extrabold text-rose-400">
              {currentMatch.awayScore}
            </div>

            {/* Touch Adjusters */}
            {currentMatch.status === 'LIVE' && (
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => handleScoreAdjust(false, -1)}
                  disabled={currentMatch.awayScore <= 0 || isSubmitting}
                  className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 font-bold"
                  title="Decrement score"
                >
                  <Minus className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleScoreAdjust(false, +1)}
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-600/30 flex items-center gap-2"
                >
                  <Plus className="h-5 w-5" />
                  <span>+1 Goal</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Official Match Incident Triggers */}
        {currentMatch.status === 'LIVE' && (
          <div className="mt-6 pt-6 border-t border-slate-800">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono mb-3">
              Quick Event Recording (Certified Log)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <button
                onClick={() => {
                  setSelectedEventType('GOAL');
                  setEventTeamId(currentMatch.homeTeamId);
                }}
                className="p-3 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/60 text-emerald-300 text-xs font-semibold flex flex-col items-center gap-1.5 transition-all"
              >
                <span className="text-lg">⚽</span>
                <span>Record Goal</span>
              </button>

              <button
                onClick={() => {
                  setSelectedEventType('YELLOW_CARD');
                  setEventTeamId(currentMatch.homeTeamId);
                }}
                className="p-3 rounded-xl bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/60 text-amber-300 text-xs font-semibold flex flex-col items-center gap-1.5 transition-all"
              >
                <span className="text-lg">🟨</span>
                <span>Yellow Card</span>
              </button>

              <button
                onClick={() => {
                  setSelectedEventType('RED_CARD');
                  setEventTeamId(currentMatch.homeTeamId);
                }}
                className="p-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/60 text-rose-300 text-xs font-semibold flex flex-col items-center gap-1.5 transition-all"
              >
                <span className="text-lg">🟥</span>
                <span>Red Card</span>
              </button>

              <button
                onClick={() => {
                  setSelectedEventType('SUBSTITUTION');
                  setEventTeamId(currentMatch.homeTeamId);
                }}
                className="p-3 rounded-xl bg-blue-950/40 hover:bg-blue-900/50 border border-blue-800/60 text-blue-300 text-xs font-semibold flex flex-col items-center gap-1.5 transition-all"
              >
                <ArrowRightLeft className="h-5 w-5 text-blue-400" />
                <span>Substitution</span>
              </button>

              <button
                onClick={() => {
                  setSelectedEventType('FOUL');
                  setEventTeamId(currentMatch.homeTeamId);
                }}
                className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold flex flex-col items-center gap-1.5 transition-all"
              >
                <span className="text-lg">⚠️</span>
                <span>Foul / Offside</span>
              </button>
            </div>
          </div>
        )}

        {/* Live Match Timeline Feed */}
        <div className="mt-6 pt-6 border-t border-slate-800">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono mb-3">
            Match Incident Feed ({currentMatch.events.length} logged)
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {currentMatch.events.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">No match incidents logged yet.</p>
            ) : (
              currentMatch.events.map(ev => (
                <div
                  key={ev.id}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-cyan-400 font-bold">{ev.minute}&apos;</span>
                    <span className="font-semibold text-white">
                      {ev.type === 'GOAL' ? '⚽ GOAL' : ev.type === 'YELLOW_CARD' ? '🟨 YELLOW' : ev.type === 'RED_CARD' ? '🟥 RED' : ev.type}
                    </span>
                    <span className="text-slate-300">{ev.detail}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Logged by Ref</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Official Referee Post-Match Report Notes */}
        <div className="mt-6 pt-6 border-t border-slate-800 space-y-2">
          <label className="block text-xs font-bold text-white uppercase tracking-wider font-mono">
            Official Referee Match Certification Notes
          </label>
          <textarea
            rows={2}
            value={refereeNotes}
            onChange={e => setRefereeNotes(e.target.value)}
            placeholder="Document match conduct, discipline incidents, injury observations, or weather impacts..."
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Record Event Modal */}
      {selectedEventType && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white font-['Chakra_Petch'] flex items-center gap-2">
                <span>Record {selectedEventType.replace('_', ' ')}</span>
              </h3>
              <button onClick={() => setSelectedEventType(null)} className="text-slate-400 hover:text-white text-sm">
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Club / Team *</label>
                <select
                  value={eventTeamId}
                  onChange={e => {
                    setEventTeamId(e.target.value);
                    setEventPlayerId('');
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value={currentMatch.homeTeamId}>{currentMatch.homeTeamName} (Home)</option>
                  <option value={currentMatch.awayTeamId}>{currentMatch.awayTeamName} (Away)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  {selectedEventType === 'SUBSTITUTION' ? 'Player Substituted Out *' : 'Athlete / Player *'}
                </label>
                <select
                  value={eventPlayerId}
                  onChange={e => setEventPlayerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">Select Athlete</option>
                  {activeTeamPlayers.map(p => (
                    <option key={p.id} value={p.id}>
                      #{p.jerseyNumber} - {p.name} ({p.position})
                    </option>
                  ))}
                </select>
              </div>

              {selectedEventType === 'SUBSTITUTION' && (
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Player Substituted In *</label>
                  <select
                    value={eventSubInPlayerId}
                    onChange={e => setEventSubInPlayerId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="">Select Replacement Athlete</option>
                    {activeTeamPlayers
                      .filter(p => p.id !== eventPlayerId)
                      .map(p => (
                        <option key={p.id} value={p.id}>
                          #{p.jerseyNumber} - {p.name} ({p.position})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-medium mb-1">Match Minute</label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={eventMinute}
                  onChange={e => setEventMinute(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedEventType(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRecordEvent}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold text-xs shadow-lg shadow-amber-600/30 transition-all"
              >
                {isSubmitting ? 'Recording...' : 'Commit Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
