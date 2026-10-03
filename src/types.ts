export type Role = 'ADMIN' | 'REFEREE' | 'COACH' | 'PLAYER' | 'VIEWER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  teamId?: string;
  assignedMatchIds?: string[];
  avatarUrl?: string;
}

export type TournamentFormat = 'SINGLE_ELIMINATION' | 'ROUND_ROBIN' | 'GROUP_KNOCKOUT';
export type TournamentStatus = 'DRAFT' | 'REGISTRATION' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';

export interface Tournament {
  id: string;
  name: string;
  sport: string;
  format: TournamentFormat;
  startDate: string;
  endDate: string;
  venue: string;
  numTeams: number;
  registeredTeamIds: string[];
  rules: string;
  status: TournamentStatus;
  bannerUrl?: string;
  championTeamId?: string;
  championTeamName?: string;
}

export interface Team {
  id: string;
  name: string;
  code: string;
  logoUrl: string;
  coachName: string;
  coachEmail: string;
  coachId?: string;
  sport: string;
  homeVenue: string;
  primaryColor: string;
  secondaryColor: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  recentForm: ('W' | 'D' | 'L')[];
  status: 'ACTIVE' | 'PENDING' | 'INACTIVE';
  deletedAt?: string;
}

export type DocumentType = 'ID_PROOF' | 'COLLEGE_ID' | 'MEDICAL_CERTIFICATE' | 'REGISTRATION_DOC';
export type DocumentStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface EligibilityDocument {
  id: string;
  playerId: string;
  documentType: DocumentType;
  fileName: string;
  fileSize: string;
  uploadDate: string;
  status: DocumentStatus;
  verifiedDate?: string;
  verifiedBy?: string;
  notes?: string;
}

export type EligibilityStatus = 'VERIFIED' | 'PENDING' | 'REJECTED';

export interface Player {
  id: string;
  name: string;
  playerId: string; // e.g., "PLY-1001"
  teamId: string;
  teamName: string;
  jerseyNumber: number;
  position: string;
  age: number;
  contactEmail: string;
  contactPhone: string;
  photoUrl: string;
  eligibilityStatus: EligibilityStatus;
  documents: EligibilityDocument[];
  status?: 'ACTIVE' | 'PENDING' | 'INACTIVE';
  deletedAt?: string;
  // Stats
  matchesPlayed: number;
  minutesPlayed: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  fouls: number;
  rating: number;
  // Dynamic fields
  workload?: PlayerWorkload;
  injuryRisk?: InjuryRiskFlag;
}

export type MatchStatus = 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED' | 'POSTPONED';
export type MatchEventType =
  | 'GOAL'
  | 'POINT'
  | 'ASSIST'
  | 'YELLOW_CARD'
  | 'RED_CARD'
  | 'SUBSTITUTION'
  | 'FOUL'
  | 'PERIOD_START'
  | 'PERIOD_END'
  | 'MATCH_START'
  | 'MATCH_END';

export interface MatchEvent {
  id: string;
  matchId: string;
  minute: number;
  timestamp: string;
  type: MatchEventType;
  teamId?: string;
  teamName?: string;
  playerId?: string;
  playerName?: string;
  detail: string;
  addedBy: string;
}

export interface ScoreUpdateRecord {
  id: string;
  matchId: string;
  timestamp: string;
  userId: string;
  userName: string;
  prevHomeScore: number;
  prevAwayScore: number;
  newHomeScore: number;
  newAwayScore: number;
  eventType: string;
  version: number;
}

export interface PlayerParticipation {
  playerId: string;
  playerName: string;
  teamId: string;
  minutesPlayed: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
}

export interface Match {
  id: string;
  tournamentId: string;
  tournamentName: string;
  roundName: string; // "Quarter-Final 1", "Semi-Final 1", "Final", "Round 1"
  roundIndex: number; // 1, 2, 3
  matchNumber: number;
  homeTeamId: string;
  homeTeamName: string;
  homeTeamLogo: string;
  awayTeamId: string;
  awayTeamName: string;
  awayTeamLogo: string;
  homeScore: number;
  awayScore: number;
  date: string;
  time: string;
  venue: string;
  refereeId?: string;
  refereeName?: string;
  status: MatchStatus;
  currentMinute: number;
  period: string; // '1st Half', 'Halftime', '2nd Half', 'Full-Time'
  events: MatchEvent[];
  scoreUpdates: ScoreUpdateRecord[];
  playerParticipations: PlayerParticipation[];
  refereeReportSubmitted?: boolean;
  refereeNotes?: string;
  winnerTeamId?: string;
  version: number; // For concurrent update control
  nextMatchId?: string; // Bracket advancement
  nextMatchSlot?: 'home' | 'away';
}

export interface StandingRecord {
  teamId: string;
  teamName: string;
  teamLogo: string;
  teamCode: string;
  played: number;
  won: number;
  lost: number;
  draw: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  form: ('W' | 'D' | 'L')[];
  rank: number;
}

export type WorkloadLevel = 'LOW' | 'NORMAL' | 'HIGH' | 'VERY_HIGH';

export interface WorkloadBreakdown {
  acuteLoadMinutes: number; // Last 7 days
  chronicLoadMinutes: number; // 28 days normalized
  acwr: number; // Acute to Chronic Workload Ratio
  recoveryGapHours: number; // Hours since previous match
  matchesInLast48h: number;
  matchesInLast7d: number;
  totalSeasonMinutes: number;
  workloadScore: number; // 0-100 scale
}

export interface PlayerWorkload {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  workloadLevel: WorkloadLevel;
  workloadScore: number;
  breakdown: WorkloadBreakdown;
  summaryExplanation: string;
}

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH';
export type FlagSource = 'ACWR_AUTO' | 'MANUAL';
export type FlagCategory = 'INJURY' | 'ILLNESS' | 'SUSPENSION';
export type FlagSeverity = 'LOW' | 'MODERATE' | 'HIGH';
export type FlagStatus = 'ACTIVE' | 'RESOLVED' | 'VOIDED';

export interface InjuryRiskFlag {
  id: string;
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  source: FlagSource;
  category: FlagCategory;
  severity: FlagSeverity;
  riskLevel?: RiskLevel;
  notes?: string;
  status: FlagStatus;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  voidedBy?: string;
  voidedAt?: string;
  voidReason?: string;
  reasons: string[];
  riskScore: number; // 0 - 100
  triggers?: {
    label: string;
    value: string;
    threshold: string;
    exceeded: boolean;
  }[];
  disclaimer: string;
  lastCalculated: string;
}

export type AlertType =
  | 'ELIGIBILITY_PENDING'
  | 'MISSING_DOCUMENTS'
  | 'MATCH_STARTING_SOON'
  | 'MATCH_DELAYED'
  | 'HIGH_WORKLOAD'
  | 'INJURY_RISK_FLAG'
  | 'FIXTURE_CONFLICT'
  | 'UNASSIGNED_REFEREE'
  | 'INVALID_MATCH_DATA';

export interface SystemAlert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: string;
  read: boolean;
  linkTo?: string;
  entityId?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: Role;
  action: string;
  entityType: 'TOURNAMENT' | 'TEAM' | 'PLAYER' | 'DOCUMENT' | 'FIXTURE' | 'MATCH' | 'SCORE' | 'AUTH' | 'RISK_FLAG';
  entityId: string;
  previousValue?: string;
  newValue?: string;
  notes?: string;
  ipAddress?: string;
}

export interface SystemMetrics {
  serverUptimeSeconds: number;
  activeMatchesCount: number;
  totalMatchesCompleted: number;
  totalScoreUpdates: number;
  averageResponseTimeMs: number;
  totalApiRequests: number;
  concurrencyCollisionsHandled: number;
  lastCalculatedAt: string;
}
