import {
  Tournament,
  Team,
  Player,
  Match,
  StandingRecord,
  SystemAlert,
  AuditLogEntry,
  User,
  SystemMetrics
} from '../types.js';

const API_BASE = '/api';

// In-memory token storage with initial fallback
let currentToken: string = typeof window !== 'undefined' ? localStorage.getItem('arenasync_token') || '' : '';

export const sportsApi = {
  // Token Management
  setToken(token: string) {
    currentToken = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('arenasync_token', token);
    }
  },

  getToken(): string {
    return currentToken;
  },

  clearToken() {
    currentToken = '';
    if (typeof window !== 'undefined') {
      localStorage.removeItem('arenasync_token');
    }
  },

  // Authenticated fetch wrapper
  async authFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {})
    };

    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
    }

    return fetch(endpoint, {
      ...options,
      headers
    });
  },

  // Auth
  async login(email?: string, role?: string): Promise<{ success: boolean; user: User; token: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role })
    });
    const data = await res.json();
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  },

  async getUsers(): Promise<User[]> {
    const res = await fetch(`${API_BASE}/auth/users`);
    return res.json();
  },

  // Tournaments
  async getTournaments(): Promise<Tournament[]> {
    const res = await this.authFetch(`${API_BASE}/tournaments`);
    return res.json();
  },

  async createTournament(data: Partial<Tournament>): Promise<Tournament> {
    const res = await this.authFetch(`${API_BASE}/tournaments`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create tournament');
    }
    return res.json();
  },

  async deleteTournament(id: string): Promise<void> {
    const res = await this.authFetch(`${API_BASE}/tournaments/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete tournament');
    }
  },

  // Teams
  async getTeams(): Promise<Team[]> {
    const res = await this.authFetch(`${API_BASE}/teams`);
    return res.json();
  },

  async createTeam(data: Partial<Team>): Promise<Team> {
    const res = await this.authFetch(`${API_BASE}/teams`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create team');
    }
    return res.json();
  },

  // Players
  async getPlayers(params?: { teamId?: string; eligibility?: string }): Promise<Player[]> {
    const query = new URLSearchParams(params as any).toString();
    const res = await this.authFetch(`${API_BASE}/players${query ? `?${query}` : ''}`);
    return res.json();
  },

  async createPlayer(data: Partial<Player>): Promise<Player> {
    const res = await this.authFetch(`${API_BASE}/players`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to add player');
    }
    return res.json();
  },

  // Documents
  async uploadDocument(playerId: string, doc: { documentType: string; fileName: string; fileSize?: string }) {
    const res = await this.authFetch(`${API_BASE}/players/${playerId}/documents`, {
      method: 'POST',
      body: JSON.stringify(doc)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to upload document');
    }
    return res.json();
  },

  async verifyDocument(playerId: string, docId: string, status: 'VERIFIED' | 'REJECTED' | 'PENDING', notes?: string, verifiedBy?: string) {
    const res = await this.authFetch(`${API_BASE}/players/${playerId}/documents/${docId}/verify`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes, verifiedBy })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to verify document');
    }
    return res.json();
  },

  // Fixtures & Matches
  async getFixtures(): Promise<Match[]> {
    const res = await this.authFetch(`${API_BASE}/fixtures`);
    return res.json();
  },

  async generateFixtures(data: { tournamentId?: string; format?: string; venue?: string; startDate?: string }) {
    const res = await this.authFetch(`${API_BASE}/fixtures/generate`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to generate fixtures');
    }
    return res.json();
  },

  async getMatch(id: string): Promise<Match> {
    const res = await this.authFetch(`${API_BASE}/matches/${id}`);
    return res.json();
  },

  async startMatch(id: string, refereeName?: string) {
    const res = await this.authFetch(`${API_BASE}/matches/${id}/start`, {
      method: 'POST',
      body: JSON.stringify({ refereeName })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to start match');
    }
    return res.json();
  },

  async updateScore(
    id: string,
    data: {
      homeScore: number;
      awayScore: number;
      expectedVersion?: number;
      minute?: number;
      scoringTeamId?: string;
      playerId?: string;
      playerName?: string;
      detail?: string;
      userId?: string;
      userName?: string;
    }
  ): Promise<Match> {
    const res = await this.authFetch(`${API_BASE}/matches/${id}/score`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update score');
    }
    return res.json();
  },

  async recordEvent(id: string, eventData: any): Promise<Match> {
    const res = await this.authFetch(`${API_BASE}/matches/${id}/events`, {
      method: 'POST',
      body: JSON.stringify(eventData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to record match event');
    }
    return res.json();
  },

  async completeMatch(id: string, data: { refereeNotes?: string; playerParticipations?: any[] }) {
    const res = await this.authFetch(`${API_BASE}/matches/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to complete match');
    }
    return res.json();
  },

  // Standings
  async getStandings(tournamentId: string = 'tour-1'): Promise<StandingRecord[]> {
    const res = await this.authFetch(`${API_BASE}/standings/${tournamentId}`);
    return res.json();
  },

  // Analytics & Workload & Injury Flags
  async getPlayerAnalytics(teamId?: string) {
    const res = await this.authFetch(`${API_BASE}/analytics/players${teamId ? `?teamId=${teamId}` : ''}`);
    return res.json();
  },

  async getWorkload(): Promise<any[]> {
    const res = await this.authFetch(`${API_BASE}/workload`);
    const data = await res.json();
    return Array.isArray(data) ? data : (data?.workloads || []);
  },

  async getInjuryFlags(): Promise<any[]> {
    const res = await this.authFetch(`${API_BASE}/injury-flags`);
    const data = await res.json();
    return Array.isArray(data) ? data : (data?.flags || []);
  },

  // Alerts
  async getAlerts(): Promise<SystemAlert[]> {
    const res = await this.authFetch(`${API_BASE}/alerts`);
    return res.json();
  },

  async markAlertRead(id: string) {
    const res = await this.authFetch(`${API_BASE}/alerts/${id}/read`, { method: 'POST' });
    return res.json();
  },

  async markAllAlertsRead() {
    const res = await this.authFetch(`${API_BASE}/alerts/mark-all-read`, { method: 'POST' });
    return res.json();
  },

  // Audit Logs (ADMIN only)
  async getAuditLogs(): Promise<AuditLogEntry[]> {
    const res = await this.authFetch(`${API_BASE}/audit-logs`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch audit logs');
    }
    return res.json();
  },

  // Observability & Experiments
  async getMetrics(): Promise<SystemMetrics & any> {
    const res = await this.authFetch(`${API_BASE}/metrics`);
    return res.json();
  },

  async runConcurrencyExperiment() {
    const res = await this.authFetch(`${API_BASE}/experiments/concurrency-test`, { method: 'POST' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to execute concurrency experiment');
    }
    return res.json();
  },

  async resetDemo() {
    const res = await this.authFetch(`${API_BASE}/reset-demo`, { method: 'POST' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to reset demo data');
    }
    return res.json();
  }
};
