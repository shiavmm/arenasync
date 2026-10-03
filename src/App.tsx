import React, { useState, useEffect, useCallback } from 'react';
import {
  Tournament,
  Team,
  Player,
  Match,
  StandingRecord,
  SystemAlert,
  AuditLogEntry,
  User,
  Role
} from './types.js';
import { sportsApi } from './services/api.js';
import { supabase } from './lib/supabase.js';
import { Auth } from './components/Auth.js';

import { Header } from './components/Header.js';
import { Sidebar } from './components/Sidebar.js';
import { DashboardView } from './components/DashboardView.js';
import { TournamentsView } from './components/TournamentsView.js';
import { TeamsView } from './components/TeamsView.js';
import { PlayersView } from './components/PlayersView.js';
import { DocumentsView } from './components/DocumentsView.js';
import { FixturesView } from './components/FixturesView.js';
import { RefereeConsoleView } from './components/RefereeConsoleView.js';
import { LiveScoringView } from './components/LiveScoringView.js';
import { TvDisplayView } from './components/TvDisplayView.js';
import { StandingsView } from './components/StandingsView.js';
import { AnalyticsView } from './components/AnalyticsView.js';
import { WorkloadView } from './components/WorkloadView.js';
import { InjuryFlagsView } from './components/InjuryFlagsView.js';
import { AlertsView } from './components/AlertsView.js';
import { AuditLogsView } from './components/AuditLogsView.js';
import { CapstoneSpecsView } from './components/CapstoneSpecsView.js';
import { Menu, X, RefreshCw } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'guest',
    name: 'Guest User',
    email: '',
    role: 'VIEWER'
  });

  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const updateUserFromSession = async (currentSession: any) => {
      setSession(currentSession);
      if (currentSession?.user) {
        const userRole = (currentSession.user.user_metadata?.role as Role) || 'VIEWER';
        const userName = currentSession.user.user_metadata?.full_name || currentSession.user.email?.split('@')[0] || 'User';
        const userEmail = currentSession.user.email || '';
        const userId = currentSession.user.id;

        setCurrentUser({
          id: userId,
          name: userName,
          email: userEmail,
          role: userRole,
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
        });

        // Set token directly from session and synchronize with backend
        if (currentSession.access_token) {
          sportsApi.setToken(currentSession.access_token);
        }

        try {
          const authRes = await sportsApi.login(userEmail, userRole, userId, userName);
          if (authRes?.token) {
            sportsApi.setToken(authRes.token);
          }
        } catch (e) {
          console.warn('Backend session sync note:', e);
        }
      } else {
        sportsApi.clearToken();
        setCurrentUser({
          id: 'guest',
          name: 'Guest User',
          email: '',
          role: 'VIEWER'
        });
      }
    };

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      updateUserFromSession(initialSession);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      updateUserFromSession(currentSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [previousView, setPreviousView] = useState<string>('dashboard');
  const [isTvMode, setIsTvMode] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [selectedMatchId, setSelectedMatchId] = useState<string>('m-1');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const handleNavigate = (view: string) => {
    if (view === 'tv-display') {
      if (currentView !== 'tv-display') {
        setPreviousView(currentView);
      }
      setIsTvMode(true);
      setCurrentView('tv-display');
    } else {
      setPreviousView(currentView);
      setCurrentView(view);
    }
    setIsMobileMenuOpen(false);
  };

  const handleOpenTvMode = () => {
    if (currentView !== 'tv-display') {
      setPreviousView(currentView);
    }
    setIsTvMode(true);
    setCurrentView('tv-display');
  };

  const handleExitTvMode = () => {
    setIsTvMode(false);
    const target = (previousView && previousView !== 'tv-display') ? previousView : 'dashboard';
    setCurrentView(target);
  };

  // Core Data States
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<StandingRecord[]>([]);
  const [workloads, setWorkloads] = useState<any[]>([]);
  const [injuryFlags, setInjuryFlags] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load all data from backend
  const loadData = useCallback(async () => {
    try {
      const [
        tourRes,
        teamsRes,
        playersRes,
        matchesRes,
        standingsRes,
        workloadRes,
        injuryRes,
        alertsRes,
        auditRes
      ] = await Promise.all([
        sportsApi.getTournaments().catch(() => []),
        sportsApi.getTeams().catch(() => []),
        sportsApi.getPlayers().catch(() => []),
        sportsApi.getFixtures().catch(() => []),
        sportsApi.getStandings('tour-1').catch(() => []),
        sportsApi.getWorkload().catch(() => []),
        sportsApi.getInjuryFlags().catch(() => []),
        sportsApi.getAlerts().catch(() => []),
        currentUser.role === 'ADMIN' ? sportsApi.getAuditLogs().catch(() => []) : Promise.resolve([])
      ]);

      setTournaments(Array.isArray(tourRes) ? tourRes : []);
      setTeams(Array.isArray(teamsRes) ? teamsRes : []);
      setPlayers(Array.isArray(playersRes) ? playersRes : []);
      setMatches(Array.isArray(matchesRes) ? matchesRes : []);
      setStandings(Array.isArray(standingsRes) ? standingsRes : []);
      setWorkloads(Array.isArray(workloadRes) ? workloadRes : ((workloadRes as any)?.workloads || []));
      setInjuryFlags(Array.isArray(injuryRes) ? injuryRes : ((injuryRes as any)?.flags || []));
      setAlerts(Array.isArray(alertsRes) ? alertsRes : []);
      setAuditLogs(Array.isArray(auditRes) ? auditRes : []);

      if (Array.isArray(matchesRes) && matchesRes.length > 0 && !selectedMatchId) {
        setSelectedMatchId(matchesRes[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMatchId, currentUser.role]);

  // Initial fetch and 10-second polling for live updates
  useEffect(() => {
    const initAuthAndData = async () => {
      if (!session && !sportsApi.getToken()) {
        try {
          const auth = await sportsApi.login(undefined, currentUser.role);
          setCurrentUser(auth.user);
        } catch (err) {
          console.error('Auth initialization error:', err);
        }
      }
      await loadData();
    };

    initAuthAndData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [loadData, currentUser.role]);

  // Role Switcher for demonstration
  const handleSwitchRole = async (role: Role) => {
    try {
      const auth = await sportsApi.login(undefined, role);
      setCurrentUser(auth.user);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAlertRead = async (id: string) => {
    await sportsApi.markAlertRead(id);
    setAlerts(prev => prev.map(a => (a.id === id ? { ...a, read: true } : a)));
  };

  const handleMarkAllAlertsRead = async () => {
    await sportsApi.markAllAlertsRead();
    setAlerts(prev => prev.map(a => ({ ...a, read: true })));
  };

  const handleResetDemo = async () => {
    if (window.confirm('Reset all demo data to initial capstone state?')) {
      setIsLoading(true);
      await sportsApi.resetDemo();
      await loadData();
    }
  };

  const liveMatches = matches.filter(m => m.status === 'LIVE');
  const unreadAlerts = alerts.filter(a => !a.read);

  if (!session) {
    return <Auth onLogin={setSession} />;
  }

  // If TV Mode is active or currentView is tv-display, render the dedicated fullscreen TV display
  if (isTvMode || currentView === 'tv-display') {
    return (
      <TvDisplayView
        matches={matches}
        selectedMatchId={selectedMatchId}
        onSelectMatch={setSelectedMatchId}
        onExit={handleExitTvMode}
      />
    );
  }

  if (isLoading && tournaments.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white font-sans">
        <div className="h-12 w-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center mb-4 animate-spin">
          <RefreshCw className="h-6 w-6 text-cyan-400" />
        </div>
        <h2 className="text-xl font-bold font-['Chakra_Petch'] text-white">
          Initializing ArenaSync Sports Platform (BIT-57)
        </h2>
        <p className="text-xs text-slate-400 mt-2 font-mono">
          Loading relational store, live fixtures & ACWR models...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Header */}
      <Header
        currentUser={currentUser}
        onSwitchRole={handleSwitchRole}
        onOpenTvMode={handleOpenTvMode}
        alerts={alerts}
        onMarkAlertRead={handleMarkAlertRead}
        onResetDemo={handleResetDemo}
        activeMatchesCount={liveMatches.length}
        onNavigate={handleNavigate}
      />

      {/* Live Marquee Ticker */}
      {liveMatches.length > 0 && (
        <div className="bg-black/60 border-b border-t border-cyan-500/20 overflow-hidden py-2 shadow-lg backdrop-blur-md relative z-10">
          <div className="whitespace-nowrap animate-marquee flex items-center font-mono text-sm tracking-widest text-cyan-400">
            {/* Duplicate content to create seamless loop */}
            {[...Array(3)].map((_, i) => (
              <span key={i} className="flex items-center">
                {liveMatches.map(m => (
                  <span key={m.id} className="mx-8 flex items-center gap-4">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    <span className="font-bold text-white">{m.homeTeam?.name || 'Home'}</span>
                    <span className="text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded">{m.homeScore} - {m.awayScore}</span>
                    <span className="font-bold text-white">{m.awayTeam?.name || 'Away'}</span>
                    <span className="text-slate-500 text-xs">({m.currentTime})</span>
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Main App Body */}
      <div className="flex-1 flex overflow-hidden bg-transparent">
        {/* Mobile Sidebar Toggle Button */}
        <div className="lg:hidden fixed bottom-5 right-5 z-50">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-3.5 rounded-2xl bg-cyan-600 text-white shadow-2xl shadow-cyan-600/50 flex items-center justify-center"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Desktop & Mobile Responsive Sidebar */}
        <div
          className={`${
            isMobileMenuOpen ? 'fixed inset-y-0 left-0 z-50 flex shadow-2xl' : 'hidden lg:flex'
          }`}
        >
          <Sidebar
            currentView={currentView}
            onNavigate={handleNavigate}
            userRole={currentUser.role}
            unreadAlertsCount={unreadAlerts.length}
            liveMatchesCount={liveMatches.length}
          />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-transparent">
          <div className="max-w-7xl mx-auto">
            {currentView === 'dashboard' && (
              <DashboardView
                tournaments={tournaments}
                teams={teams}
                players={players}
                matches={matches}
                alerts={alerts}
                workloads={workloads}
                injuryFlags={injuryFlags}
                onNavigate={handleNavigate}
                onSelectMatch={setSelectedMatchId}
              />
            )}

            {currentView === 'tournaments' && (
              <TournamentsView
                tournaments={tournaments}
                onRefresh={loadData}
                userRole={currentUser.role}
                onNavigate={handleNavigate}
              />
            )}

            {currentView === 'teams' && (
              <TeamsView
                teams={teams}
                players={players}
                onRefresh={loadData}
                userRole={currentUser.role}
                onNavigate={handleNavigate}
                onSelectPlayer={setSelectedPlayer}
              />
            )}

            {currentView === 'players' && (
              <PlayersView
                players={players}
                teams={teams}
                onRefresh={loadData}
                userRole={currentUser.role}
                currentUser={currentUser}
                selectedPlayer={selectedPlayer}
                onSelectPlayer={setSelectedPlayer}
                onNavigate={handleNavigate}
              />
            )}

            {currentView === 'documents' && (
              <DocumentsView
                players={players}
                onRefresh={loadData}
                userRole={currentUser.role}
              />
            )}

            {currentView === 'fixtures' && (
              <FixturesView
                matches={matches}
                onRefresh={loadData}
                userRole={currentUser.role}
                onSelectMatch={setSelectedMatchId}
                onNavigate={handleNavigate}
              />
            )}

            {currentView === 'referee-console' && (
              <RefereeConsoleView
                matches={matches}
                players={players}
                selectedMatchId={selectedMatchId}
                onSelectMatch={setSelectedMatchId}
                onRefresh={loadData}
                currentUser={currentUser}
                injuryFlags={injuryFlags}
              />
            )}

            {currentView === 'live-scoring' && (
              <LiveScoringView
                matches={matches}
                selectedMatchId={selectedMatchId}
                onSelectMatch={setSelectedMatchId}
                onRefresh={loadData}
                currentUser={currentUser}
                onNavigate={handleNavigate}
              />
            )}

            {currentView === 'tv-display' && (
              <TvDisplayView
                matches={matches}
                selectedMatchId={selectedMatchId}
                onSelectMatch={setSelectedMatchId}
                onExit={handleExitTvMode}
              />
            )}

            {currentView === 'standings' && (
              <StandingsView
                standings={standings}
                tournaments={tournaments}
                onRefresh={loadData}
              />
            )}

            {currentView === 'analytics' && (
              <AnalyticsView
                players={players}
                teams={teams}
                onSelectPlayer={setSelectedPlayer}
                onNavigate={handleNavigate}
              />
            )}

            {currentView === 'workload' && (
              <WorkloadView
                workloads={workloads}
                players={players}
                onSelectPlayer={setSelectedPlayer}
                onNavigate={handleNavigate}
              />
            )}

            {currentView === 'injury-flags' && (
              <InjuryFlagsView
                injuryFlags={injuryFlags}
                players={players}
                onSelectPlayer={setSelectedPlayer}
                onNavigate={handleNavigate}
                userRole={currentUser.role}
                currentUser={currentUser}
                onRefresh={loadData}
              />
            )}

            {currentView === 'alerts' && (
              <AlertsView
                alerts={alerts}
                onMarkAlertRead={handleMarkAlertRead}
                onMarkAllRead={handleMarkAllAlertsRead}
                onNavigate={handleNavigate}
              />
            )}

            {currentView === 'audit-logs' && (
              <AuditLogsView logs={auditLogs} />
            )}

            {currentView === 'capstone-specs' && (
              <CapstoneSpecsView />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
