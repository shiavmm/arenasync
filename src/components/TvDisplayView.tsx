import React, { useState, useEffect } from 'react';
import {
  Tv,
  Maximize2,
  Minimize2,
  X,
  Clock,
  Trophy,
  Shield,
  Radio,
  Sparkles
} from 'lucide-react';
import { Match } from '../types.js';

interface TvDisplayViewProps {
  matches: Match[];
  selectedMatchId: string;
  onSelectMatch: (id: string) => void;
  onExit: () => void;
}

export const TvDisplayView: React.FC<TvDisplayViewProps> = ({
  matches,
  selectedMatchId,
  onSelectMatch,
  onExit
}) => {
  const currentMatch = matches.find(m => m.id === selectedMatchId) || matches.find(m => m.status === 'LIVE') || matches[0];
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  if (!currentMatch) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
        <p className="text-xl">No match selected for TV Broadcast.</p>
      </div>
    );
  }

  const latestEvents = [...currentMatch.events].reverse().slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col justify-between overflow-hidden font-sans select-none">
      {/* Top TV Broadcast Header */}
      <div className="px-6 lg:px-12 py-4 bg-gradient-to-b from-slate-900 via-slate-900/90 to-transparent flex items-center justify-between border-b border-slate-800/60 backdrop-blur-md">
        {/* Tournament branding */}
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-xl shadow-cyan-500/30">
            <Trophy className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg lg:text-xl font-bold tracking-tight text-white font-['Chakra_Petch']">
                {currentMatch.tournamentName}
              </h1>
              <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-mono text-xs font-bold border border-cyan-500/30">
                {currentMatch.roundName}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Venue: {currentMatch.venue} • Official Broadcast Stream
            </p>
          </div>
        </div>

        {/* Controls: Match selector, Fullscreen, Exit */}
        <div className="flex items-center gap-3">
          <select
            value={currentMatch.id}
            onChange={e => onSelectMatch(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none"
          >
            {matches.map(m => (
              <option key={m.id} value={m.id}>
                {m.status === 'LIVE' ? '🔴 ' : ''}{m.homeTeamName} vs {m.awayTeamName}
              </option>
            ))}
          </select>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </button>

          <button
            onClick={onExit}
            className="px-3.5 py-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white font-medium text-xs transition-colors flex items-center gap-1.5"
          >
            <X className="h-4 w-4" />
            <span>Exit TV Mode</span>
          </button>
        </div>
      </div>

      {/* Main Stadium Jumbotron Display */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-6xl mx-auto w-full">
        {/* Match Status & Clock Pill */}
        <div className="mb-6 flex items-center gap-3">
          <div
            className={`px-4 py-1.5 rounded-full text-sm font-bold font-mono tracking-wider flex items-center gap-2 shadow-lg ${
              currentMatch.status === 'LIVE'
                ? 'bg-rose-600 text-white animate-pulse shadow-rose-600/40'
                : currentMatch.status === 'COMPLETED'
                ? 'bg-emerald-600 text-white shadow-emerald-600/40'
                : 'bg-slate-800 text-slate-300'
            }`}
          >
            {currentMatch.status === 'LIVE' && (
              <span className="h-2.5 w-2.5 rounded-full bg-white animate-ping" />
            )}
            <span>{currentMatch.status}</span>
          </div>

          <div className="px-4 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-slate-200 font-mono text-sm font-bold flex items-center gap-2 shadow-inner">
            <Clock className="h-4 w-4 text-cyan-400" />
            <span>{currentMatch.period} • {currentMatch.currentMinute}&apos;</span>
          </div>
        </div>

        {/* Massive Team Scoreboard */}
        <div className="w-full grid grid-cols-1 md:grid-cols-7 items-center gap-6 p-8 lg:p-12 rounded-3xl bg-slate-900/90 border border-slate-800/80 shadow-2xl backdrop-blur-xl relative">
          {/* Home Team (3 cols) */}
          <div className="md:col-span-3 flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <img
                src={currentMatch.homeTeamLogo}
                alt={currentMatch.homeTeamName}
                className="h-28 w-28 lg:h-36 lg:w-36 rounded-3xl object-cover ring-4 ring-blue-500/50 shadow-2xl shadow-blue-500/30"
              />
              <span className="absolute -bottom-2 px-3 py-0.5 rounded-full bg-blue-600 text-[11px] font-bold font-mono uppercase tracking-wider text-white">
                HOME
              </span>
            </div>
            <h2 className="text-2xl lg:text-4xl font-extrabold text-white font-['Chakra_Petch'] tracking-tight">
              {currentMatch.homeTeamName}
            </h2>
          </div>

          {/* Central Scoreboard (1 col) */}
          <div className="md:col-span-1 flex flex-col items-center justify-center">
            <div className="flex items-center gap-3 lg:gap-6 px-6 lg:px-8 py-4 lg:py-6 rounded-3xl bg-black/80 border border-slate-800 font-mono text-7xl lg:text-9xl font-black tracking-tighter shadow-2xl">
              <span className="text-cyan-400">{currentMatch.homeScore}</span>
              <span className="text-slate-700 text-5xl lg:text-7xl font-light">-</span>
              <span className="text-rose-400">{currentMatch.awayScore}</span>
            </div>
            <span className="text-xs font-mono text-slate-500 mt-3 font-semibold uppercase tracking-widest">
              OFFICIAL SCORE
            </span>
          </div>

          {/* Away Team (3 cols) */}
          <div className="md:col-span-3 flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <img
                src={currentMatch.awayTeamLogo}
                alt={currentMatch.awayTeamName}
                className="h-28 w-28 lg:h-36 lg:w-36 rounded-3xl object-cover ring-4 ring-purple-500/50 shadow-2xl shadow-purple-500/30"
              />
              <span className="absolute -bottom-2 px-3 py-0.5 rounded-full bg-purple-600 text-[11px] font-bold font-mono uppercase tracking-wider text-white">
                AWAY
              </span>
            </div>
            <h2 className="text-2xl lg:text-4xl font-extrabold text-white font-['Chakra_Petch'] tracking-tight">
              {currentMatch.awayTeamName}
            </h2>
          </div>
        </div>
      </div>

      {/* Bottom Live Incident Ticker */}
      <div className="px-6 lg:px-12 py-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold font-mono text-cyan-400 uppercase tracking-wider">
            <Radio className="h-4 w-4 animate-pulse" />
            <span>INCIDENT TICKER:</span>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto">
            {latestEvents.length === 0 ? (
              <span className="text-xs text-slate-400 italic">No incidents recorded this half.</span>
            ) : (
              latestEvents.map(ev => (
                <div
                  key={ev.id}
                  className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center gap-2 shrink-0 font-medium"
                >
                  <span className="font-mono font-bold text-cyan-400">{ev.minute}&apos;</span>
                  <span>{ev.type === 'GOAL' ? '⚽' : ev.type === 'YELLOW_CARD' ? '🟨' : '🟥'}</span>
                  <span className="text-slate-200">{ev.detail}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="text-xs font-mono text-slate-500 hidden sm:block">
          Official Referee: <strong className="text-slate-300">{currentMatch.refereeName}</strong>
        </div>
      </div>
    </div>
  );
};
