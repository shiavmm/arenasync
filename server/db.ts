import {
  Tournament,
  Team,
  Player,
  Match,
  StandingRecord,
  PlayerWorkload,
  InjuryRiskFlag,
  SystemAlert,
  AuditLogEntry,
  User,
  ScoreUpdateRecord,
  MatchEvent,
  TournamentFormat,
  SystemMetrics
} from '../src/types.js';

// Global in-memory persistent database for the application
class SportsDatabase {
  users: User[] = [];
  tournaments: Tournament[] = [];
  teams: Team[] = [];
  players: Player[] = [];
  matches: Match[] = [];
  alerts: SystemAlert[] = [];
  auditLogs: AuditLogEntry[] = [];
  metrics: SystemMetrics = {
    serverUptimeSeconds: 0,
    activeMatchesCount: 1,
    totalMatchesCompleted: 4,
    totalScoreUpdates: 18,
    averageResponseTimeMs: 14,
    totalApiRequests: 142,
    concurrencyCollisionsHandled: 0,
    lastCalculatedAt: new Date().toISOString()
  };

  private startTime = Date.now();

  constructor() {
    this.seedInitialData();
  }

  seedInitialData() {
    // 1. Users
    this.users = [
      {
        id: 'usr-admin-1',
        name: 'Prof. David Vance (Sports Director)',
        email: 'admin@smartsports.edu',
        role: 'ADMIN',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
      },
      {
        id: 'usr-ref-1',
        name: 'Marcus Webb (FIFA Grade Ref)',
        email: 'referee@smartsports.edu',
        role: 'REFEREE',
        assignedMatchIds: ['match-sf-1', 'match-fn-1'],
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
      },
      {
        id: 'usr-coach-1',
        name: 'Elena Rostova (Head Coach)',
        email: 'coach@titanfc.edu',
        role: 'COACH',
        teamId: 'team-1',
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
      },
      {
        id: 'usr-player-1',
        name: 'Julian Reyes (Captain)',
        email: 'player@titanfc.edu',
        role: 'PLAYER',
        teamId: 'team-1',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
      },
      {
        id: 'usr-viewer-1',
        name: 'Campus Spectator',
        email: 'viewer@smartsports.edu',
        role: 'VIEWER',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
      }
    ];

    // 2. Teams (8 collegiate championship teams)
    this.teams = [
      {
        id: 'team-1',
        name: 'Titan FC',
        code: 'TIT',
        logoUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=120&auto=format&fit=crop&q=80',
        coachName: 'Elena Rostova',
        coachEmail: 'coach@titanfc.edu',
        coachId: 'usr-coach-1',
        sport: 'Football / Soccer',
        homeVenue: 'Grand Olympic Stadium',
        primaryColor: '#2563eb',
        secondaryColor: '#1d4ed8',
        matchesPlayed: 4,
        wins: 3,
        losses: 0,
        draws: 1,
        points: 10,
        goalsFor: 9,
        goalsAgainst: 2,
        goalDifference: 7,
        recentForm: ['W', 'W', 'D', 'W'],
        status: 'ACTIVE'
      },
      {
        id: 'team-2',
        name: 'Apex Strikers',
        code: 'APX',
        logoUrl: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=120&auto=format&fit=crop&q=80',
        coachName: 'Kareem Sterling',
        coachEmail: 'kareem@apexstrikers.org',
        sport: 'Football / Soccer',
        homeVenue: 'Apex Arena',
        primaryColor: '#dc2626',
        secondaryColor: '#991b1b',
        matchesPlayed: 4,
        wins: 3,
        losses: 1,
        draws: 0,
        points: 9,
        goalsFor: 8,
        goalsAgainst: 4,
        goalDifference: 4,
        recentForm: ['W', 'L', 'W', 'W'],
        status: 'ACTIVE'
      },
      {
        id: 'team-3',
        name: 'Horizon United',
        code: 'HZU',
        logoUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=120&auto=format&fit=crop&q=80',
        coachName: 'Maya Lin',
        coachEmail: 'lin@horizon.edu',
        sport: 'Football / Soccer',
        homeVenue: 'North Campus Pitch',
        primaryColor: '#059669',
        secondaryColor: '#047857',
        matchesPlayed: 4,
        wins: 2,
        losses: 1,
        draws: 1,
        points: 7,
        goalsFor: 6,
        goalsAgainst: 4,
        goalDifference: 2,
        recentForm: ['D', 'W', 'W', 'L'],
        status: 'ACTIVE'
      },
      {
        id: 'team-4',
        name: 'Metro Rovers',
        code: 'MTR',
        logoUrl: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=120&auto=format&fit=crop&q=80',
        coachName: 'Robert Vance',
        coachEmail: 'vance@metrorovers.edu',
        sport: 'Football / Soccer',
        homeVenue: 'Metropolitan Field',
        primaryColor: '#7c3aed',
        secondaryColor: '#6d28d9',
        matchesPlayed: 4,
        wins: 2,
        losses: 2,
        draws: 0,
        points: 6,
        goalsFor: 5,
        goalsAgainst: 6,
        goalDifference: -1,
        recentForm: ['L', 'W', 'L', 'W'],
        status: 'ACTIVE'
      },
      {
        id: 'team-5',
        name: 'Phoenix Academy',
        code: 'PHX',
        logoUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=120&auto=format&fit=crop&q=80',
        coachName: 'Sofia Gomez',
        coachEmail: 'sofia@phoenixacademy.edu',
        sport: 'Football / Soccer',
        homeVenue: 'Phoenix Complex',
        primaryColor: '#ea580c',
        secondaryColor: '#c2410c',
        matchesPlayed: 4,
        wins: 1,
        losses: 2,
        draws: 1,
        points: 4,
        goalsFor: 4,
        goalsAgainst: 7,
        goalDifference: -3,
        recentForm: ['L', 'D', 'W', 'L'],
        status: 'ACTIVE'
      },
      {
        id: 'team-6',
        name: 'Vanguard Elite',
        code: 'VGD',
        logoUrl: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=120&auto=format&fit=crop&q=80',
        coachName: 'Anthony Thorne',
        coachEmail: 'thorne@vanguard.edu',
        sport: 'Football / Soccer',
        homeVenue: 'Elite Field B',
        primaryColor: '#0284c7',
        secondaryColor: '#0369a1',
        matchesPlayed: 4,
        wins: 1,
        losses: 3,
        draws: 0,
        points: 3,
        goalsFor: 3,
        goalsAgainst: 7,
        goalDifference: -4,
        recentForm: ['W', 'L', 'L', 'L'],
        status: 'ACTIVE'
      },
      {
        id: 'team-7',
        name: 'Cobalt Wolves',
        code: 'CBW',
        logoUrl: 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=120&auto=format&fit=crop&q=80',
        coachName: 'Dmitri Volkov',
        coachEmail: 'volkov@cobaltwolves.org',
        sport: 'Football / Soccer',
        homeVenue: 'West Field',
        primaryColor: '#475569',
        secondaryColor: '#334155',
        matchesPlayed: 4,
        wins: 1,
        losses: 3,
        draws: 0,
        points: 3,
        goalsFor: 2,
        goalsAgainst: 6,
        goalDifference: -4,
        recentForm: ['L', 'L', 'L', 'W'],
        status: 'ACTIVE'
      },
      {
        id: 'team-8',
        name: 'Neon Knights',
        code: 'NNK',
        logoUrl: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=120&auto=format&fit=crop&q=80',
        coachName: 'Aiden Chen',
        coachEmail: 'chen@neonknights.edu',
        sport: 'Football / Soccer',
        homeVenue: 'Civic Sports Ground',
        primaryColor: '#0d9488',
        secondaryColor: '#0f766e',
        matchesPlayed: 4,
        wins: 0,
        losses: 3,
        draws: 1,
        points: 1,
        goalsFor: 2,
        goalsAgainst: 7,
        goalDifference: -5,
        recentForm: ['L', 'D', 'L', 'L'],
        status: 'ACTIVE'
      }
    ];

    // 3. Tournament
    this.tournaments = [
      {
        id: 'tour-1',
        name: 'BIT-57 Inter-Collegiate Premier Championship',
        sport: 'Football / Soccer',
        format: 'SINGLE_ELIMINATION',
        startDate: '2026-09-15',
        endDate: '2026-09-28',
        venue: 'Grand University Olympic Stadium & Complex',
        numTeams: 8,
        registeredTeamIds: ['team-1', 'team-2', 'team-3', 'team-4', 'team-5', 'team-6', 'team-7', 'team-8'],
        rules: 'Standard FIFA rules: 90 mins regulation (two 45m halves). Extra time: 2x15m + penalty shootouts for knockout ties. Maximum 5 substitutions. Player eligibility requires verified College ID and Medical Certificate.',
        status: 'IN_PROGRESS',
        bannerUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&auto=format&fit=crop&q=80'
      }
    ];

    // 4. Players
    this.players = [
      // Titan FC
      {
        id: 'ply-1',
        name: 'Julian Reyes',
        playerId: 'PLY-1001',
        teamId: 'team-1',
        teamName: 'Titan FC',
        jerseyNumber: 10,
        position: 'Attacking Midfielder',
        age: 21,
        contactEmail: 'j.reyes@titanfc.edu',
        contactPhone: '+1 (555) 234-8901',
        photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
        eligibilityStatus: 'VERIFIED',
        documents: [
          {
            id: 'doc-1',
            playerId: 'ply-1',
            documentType: 'COLLEGE_ID',
            fileName: 'reyes_student_id_2026.pdf',
            fileSize: '1.2 MB',
            uploadDate: '2026-09-01',
            status: 'VERIFIED',
            verifiedDate: '2026-09-03',
            verifiedBy: 'Prof. David Vance'
          },
          {
            id: 'doc-2',
            playerId: 'ply-1',
            documentType: 'MEDICAL_CERTIFICATE',
            fileName: 'cardio_clearance_reyes.pdf',
            fileSize: '2.4 MB',
            uploadDate: '2026-09-02',
            status: 'VERIFIED',
            verifiedDate: '2026-09-03',
            verifiedBy: 'Dr. Sarah Connor (Head of Sports Med)'
          }
        ],
        matchesPlayed: 4,
        minutesPlayed: 360,
        goals: 4,
        assists: 3,
        yellowCards: 1,
        redCards: 0,
        fouls: 4,
        rating: 8.9
      },
      {
        id: 'ply-2',
        name: 'Mateo Hernandez',
        playerId: 'PLY-1002',
        teamId: 'team-1',
        teamName: 'Titan FC',
        jerseyNumber: 9,
        position: 'Striker',
        age: 20,
        contactEmail: 'm.hernandez@titanfc.edu',
        contactPhone: '+1 (555) 432-1123',
        photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
        eligibilityStatus: 'VERIFIED',
        documents: [
          {
            id: 'doc-3',
            playerId: 'ply-2',
            documentType: 'COLLEGE_ID',
            fileName: 'mateo_id.pdf',
            fileSize: '890 KB',
            uploadDate: '2026-09-02',
            status: 'VERIFIED',
            verifiedDate: '2026-09-04',
            verifiedBy: 'Prof. David Vance'
          },
          {
            id: 'doc-4',
            playerId: 'ply-2',
            documentType: 'MEDICAL_CERTIFICATE',
            fileName: 'med_clearance.pdf',
            fileSize: '1.4 MB',
            uploadDate: '2026-09-03',
            status: 'VERIFIED',
            verifiedDate: '2026-09-04',
            verifiedBy: 'Dr. Sarah Connor'
          }
        ],
        matchesPlayed: 4,
        minutesPlayed: 330,
        goals: 3,
        assists: 1,
        yellowCards: 0,
        redCards: 0,
        fouls: 3,
        rating: 8.4
      },
      {
        id: 'ply-3',
        name: 'Liam Gallagher',
        playerId: 'PLY-1003',
        teamId: 'team-1',
        teamName: 'Titan FC',
        jerseyNumber: 4,
        position: 'Center Back',
        age: 22,
        contactEmail: 'l.gallagher@titanfc.edu',
        contactPhone: '+1 (555) 887-3211',
        photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
        eligibilityStatus: 'VERIFIED',
        documents: [
          {
            id: 'doc-5',
            playerId: 'ply-3',
            documentType: 'COLLEGE_ID',
            fileName: 'gallagher_id.pdf',
            fileSize: '1.1 MB',
            uploadDate: '2026-09-01',
            status: 'VERIFIED',
            verifiedDate: '2026-09-02',
            verifiedBy: 'Prof. David Vance'
          }
        ],
        matchesPlayed: 4,
        minutesPlayed: 360,
        goals: 1,
        assists: 0,
        yellowCards: 2,
        redCards: 0,
        fouls: 8,
        rating: 7.9
      },
      {
        id: 'ply-4',
        name: 'Darius Thorne',
        playerId: 'PLY-1004',
        teamId: 'team-1',
        teamName: 'Titan FC',
        jerseyNumber: 1,
        position: 'Goalkeeper',
        age: 21,
        contactEmail: 'd.thorne@titanfc.edu',
        contactPhone: '+1 (555) 992-4411',
        photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
        eligibilityStatus: 'VERIFIED',
        documents: [
          {
            id: 'doc-6',
            playerId: 'ply-4',
            documentType: 'COLLEGE_ID',
            fileName: 'thorne_pass.pdf',
            fileSize: '750 KB',
            uploadDate: '2026-09-04',
            status: 'VERIFIED',
            verifiedDate: '2026-09-05',
            verifiedBy: 'Prof. David Vance'
          }
        ],
        matchesPlayed: 4,
        minutesPlayed: 360,
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
        fouls: 1,
        rating: 8.6
      },

      // Apex Strikers
      {
        id: 'ply-5',
        name: 'Zane Al-Mansoor',
        playerId: 'PLY-2001',
        teamId: 'team-2',
        teamName: 'Apex Strikers',
        jerseyNumber: 7,
        position: 'Winger / Forward',
        age: 20,
        contactEmail: 'z.mansoor@apexstrikers.org',
        contactPhone: '+1 (555) 671-0022',
        photoUrl: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=200&auto=format&fit=crop&q=80',
        eligibilityStatus: 'VERIFIED',
        documents: [
          {
            id: 'doc-7',
            playerId: 'ply-5',
            documentType: 'COLLEGE_ID',
            fileName: 'zane_college_card.pdf',
            fileSize: '1.2 MB',
            uploadDate: '2026-09-02',
            status: 'VERIFIED',
            verifiedDate: '2026-09-04',
            verifiedBy: 'Prof. David Vance'
          }
        ],
        matchesPlayed: 4,
        minutesPlayed: 350,
        goals: 5,
        assists: 2,
        yellowCards: 1,
        redCards: 0,
        fouls: 5,
        rating: 9.1
      },
      {
        id: 'ply-6',
        name: 'Tariq O’Connor',
        playerId: 'PLY-2002',
        teamId: 'team-2',
        teamName: 'Apex Strikers',
        jerseyNumber: 11,
        position: 'Midfielder',
        age: 22,
        contactEmail: 't.oconnor@apexstrikers.org',
        contactPhone: '+1 (555) 345-6677',
        photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
        eligibilityStatus: 'VERIFIED',
        documents: [
          {
            id: 'doc-8',
            playerId: 'ply-6',
            documentType: 'MEDICAL_CERTIFICATE',
            fileName: 'tariq_physical.pdf',
            fileSize: '1.9 MB',
            uploadDate: '2026-09-05',
            status: 'VERIFIED',
            verifiedDate: '2026-09-06',
            verifiedBy: 'Dr. Sarah Connor'
          }
        ],
        matchesPlayed: 4,
        minutesPlayed: 320,
        goals: 2,
        assists: 3,
        yellowCards: 2,
        redCards: 0,
        fouls: 7,
        rating: 7.8
      },
      {
        id: 'ply-7',
        name: 'Lucas Silva',
        playerId: 'PLY-2003',
        teamId: 'team-2',
        teamName: 'Apex Strikers',
        jerseyNumber: 5,
        position: 'Defensive Midfielder',
        age: 23,
        contactEmail: 'lucas.silva@apexstrikers.org',
        contactPhone: '+1 (555) 789-2244',
        photoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80',
        eligibilityStatus: 'PENDING',
        documents: [
          {
            id: 'doc-9',
            playerId: 'ply-7',
            documentType: 'REGISTRATION_DOC',
            fileName: 'provisional_entry.pdf',
            fileSize: '650 KB',
            uploadDate: '2026-09-18',
            status: 'PENDING',
            notes: 'Awaiting signature of academic dean'
          }
        ],
        matchesPlayed: 2,
        minutesPlayed: 140,
        goals: 0,
        assists: 1,
        yellowCards: 0,
        redCards: 0,
        fouls: 2,
        rating: 7.2
      },
      {
        id: 'ply-8',
        name: 'Oliver King',
        playerId: 'PLY-2004',
        teamId: 'team-2',
        teamName: 'Apex Strikers',
        jerseyNumber: 1,
        position: 'Goalkeeper',
        age: 21,
        contactEmail: 'oliver.k@apexstrikers.org',
        contactPhone: '+1 (555) 901-2233',
        photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
        eligibilityStatus: 'VERIFIED',
        documents: [
          {
            id: 'doc-10',
            playerId: 'ply-8',
            documentType: 'COLLEGE_ID',
            fileName: 'king_card.pdf',
            fileSize: '1.5 MB',
            uploadDate: '2026-09-02',
            status: 'VERIFIED',
            verifiedDate: '2026-09-03',
            verifiedBy: 'Prof. David Vance'
          }
        ],
        matchesPlayed: 4,
        minutesPlayed: 360,
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
        fouls: 0,
        rating: 8.1
      },

      // Horizon United
      {
        id: 'ply-9',
        name: 'Kenji Sato',
        playerId: 'PLY-3001',
        teamId: 'team-3',
        teamName: 'Horizon United',
        jerseyNumber: 8,
        position: 'Playmaker',
        age: 21,
        contactEmail: 'k.sato@horizon.edu',
        contactPhone: '+1 (555) 441-9876',
        photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
        eligibilityStatus: 'VERIFIED',
        documents: [
          {
            id: 'doc-11',
            playerId: 'ply-9',
            documentType: 'COLLEGE_ID',
            fileName: 'sato_id.pdf',
            fileSize: '950 KB',
            uploadDate: '2026-09-04',
            status: 'VERIFIED',
            verifiedDate: '2026-09-05',
            verifiedBy: 'Prof. David Vance'
          }
        ],
        matchesPlayed: 4,
        minutesPlayed: 340,
        goals: 2,
        assists: 3,
        yellowCards: 1,
        redCards: 0,
        fouls: 3,
        rating: 8.3
      },
      {
        id: 'ply-10',
        name: 'Andre Dubois',
        playerId: 'PLY-3002',
        teamId: 'team-3',
        teamName: 'Horizon United',
        jerseyNumber: 3,
        position: 'Left Wing-Back',
        age: 22,
        contactEmail: 'a.dubois@horizon.edu',
        contactPhone: '+1 (555) 777-1234',
        photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
        eligibilityStatus: 'REJECTED',
        documents: [
          {
            id: 'doc-12',
            playerId: 'ply-10',
            documentType: 'MEDICAL_CERTIFICATE',
            fileName: 'expired_med_2024.pdf',
            fileSize: '2.1 MB',
            uploadDate: '2026-09-10',
            status: 'REJECTED',
            verifiedDate: '2026-09-12',
            verifiedBy: 'Dr. Sarah Connor',
            notes: 'Medical clearance expired over 12 months ago. Mandatory re-assessment needed.'
          }
        ],
        matchesPlayed: 0,
        minutesPlayed: 0,
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
        fouls: 0,
        rating: 6.0
      },

      // Metro Rovers
      {
        id: 'ply-11',
        name: 'Ezekiel Cole',
        playerId: 'PLY-4001',
        teamId: 'team-4',
        teamName: 'Metro Rovers',
        jerseyNumber: 10,
        position: 'Second Striker',
        age: 21,
        contactEmail: 'cole@metrorovers.edu',
        contactPhone: '+1 (555) 888-9900',
        photoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80',
        eligibilityStatus: 'VERIFIED',
        documents: [
          {
            id: 'doc-13',
            playerId: 'ply-11',
            documentType: 'COLLEGE_ID',
            fileName: 'cole_pass.pdf',
            fileSize: '1.2 MB',
            uploadDate: '2026-09-03',
            status: 'VERIFIED',
            verifiedDate: '2026-09-04',
            verifiedBy: 'Prof. David Vance'
          }
        ],
        matchesPlayed: 4,
        minutesPlayed: 330,
        goals: 3,
        assists: 1,
        yellowCards: 3,
        redCards: 0,
        fouls: 11,
        rating: 7.7
      }
    ];

    // 5. Fixtures / Matches
    // Tournament setup: Single Elimination 8 teams
    // Round 1: QFs (4 matches - completed)
    // Round 2: SFs (2 matches: SF1 is LIVE right now! SF2 is SCHEDULED)
    // Round 3: Final (1 match - waiting for SF winners)
    this.matches = [
      // Quarter-Final 1 (Completed)
      {
        id: 'match-qf-1',
        tournamentId: 'tour-1',
        tournamentName: 'BIT-57 Inter-Collegiate Premier Championship',
        roundName: 'Quarter-Final 1',
        roundIndex: 1,
        matchNumber: 1,
        homeTeamId: 'team-1',
        homeTeamName: 'Titan FC',
        homeTeamLogo: this.teams[0].logoUrl,
        awayTeamId: 'team-8',
        awayTeamName: 'Neon Knights',
        awayTeamLogo: this.teams[7].logoUrl,
        homeScore: 3,
        awayScore: 0,
        date: '2026-09-18',
        time: '14:00',
        venue: 'Grand Olympic Stadium - Pitch 1',
        refereeId: 'usr-ref-1',
        refereeName: 'Marcus Webb',
        status: 'COMPLETED',
        currentMinute: 90,
        period: 'Full-Time',
        winnerTeamId: 'team-1',
        events: [
          {
            id: 'ev-1',
            matchId: 'match-qf-1',
            minute: 14,
            timestamp: '2026-09-18T14:14:00Z',
            type: 'GOAL',
            teamId: 'team-1',
            teamName: 'Titan FC',
            playerId: 'ply-1',
            playerName: 'Julian Reyes',
            detail: 'Top-corner curved free-kick from 24 yards',
            addedBy: 'Marcus Webb'
          },
          {
            id: 'ev-2',
            matchId: 'match-qf-1',
            minute: 55,
            timestamp: '2026-09-18T15:10:00Z',
            type: 'GOAL',
            teamId: 'team-1',
            teamName: 'Titan FC',
            playerId: 'ply-2',
            playerName: 'Mateo Hernandez',
            detail: 'Header from close range after cross',
            addedBy: 'Marcus Webb'
          },
          {
            id: 'ev-3',
            matchId: 'match-qf-1',
            minute: 82,
            timestamp: '2026-09-18T15:37:00Z',
            type: 'GOAL',
            teamId: 'team-1',
            teamName: 'Titan FC',
            playerId: 'ply-1',
            playerName: 'Julian Reyes',
            detail: 'Fast break solo finish past keeper',
            addedBy: 'Marcus Webb'
          }
        ],
        scoreUpdates: [
          {
            id: 'sc-1',
            matchId: 'match-qf-1',
            timestamp: '2026-09-18T14:14:00Z',
            userId: 'usr-ref-1',
            userName: 'Marcus Webb',
            prevHomeScore: 0,
            prevAwayScore: 0,
            newHomeScore: 1,
            newAwayScore: 0,
            eventType: 'GOAL',
            version: 1
          },
          {
            id: 'sc-2',
            matchId: 'match-qf-1',
            timestamp: '2026-09-18T15:10:00Z',
            userId: 'usr-ref-1',
            userName: 'Marcus Webb',
            prevHomeScore: 1,
            prevAwayScore: 0,
            newHomeScore: 2,
            newAwayScore: 0,
            eventType: 'GOAL',
            version: 2
          },
          {
            id: 'sc-3',
            matchId: 'match-qf-1',
            timestamp: '2026-09-18T15:37:00Z',
            userId: 'usr-ref-1',
            userName: 'Marcus Webb',
            prevHomeScore: 2,
            prevAwayScore: 0,
            newHomeScore: 3,
            newAwayScore: 0,
            eventType: 'GOAL',
            version: 3
          }
        ],
        playerParticipations: [
          { playerId: 'ply-1', playerName: 'Julian Reyes', teamId: 'team-1', minutesPlayed: 90, goals: 2, assists: 0, yellowCards: 0, redCards: 0 },
          { playerId: 'ply-2', playerName: 'Mateo Hernandez', teamId: 'team-1', minutesPlayed: 85, goals: 1, assists: 1, yellowCards: 0, redCards: 0 },
          { playerId: 'ply-3', playerName: 'Liam Gallagher', teamId: 'team-1', minutesPlayed: 90, goals: 0, assists: 0, yellowCards: 1, redCards: 0 },
          { playerId: 'ply-4', playerName: 'Darius Thorne', teamId: 'team-1', minutesPlayed: 90, goals: 0, assists: 0, yellowCards: 0, redCards: 0 }
        ],
        refereeReportSubmitted: true,
        refereeNotes: 'Clean, disciplined quarter-final match. Titan FC dominated midfield play.',
        version: 4,
        nextMatchId: 'match-sf-1',
        nextMatchSlot: 'home'
      },

      // Quarter-Final 2 (Completed)
      {
        id: 'match-qf-2',
        tournamentId: 'tour-1',
        tournamentName: 'BIT-57 Inter-Collegiate Premier Championship',
        roundName: 'Quarter-Final 2',
        roundIndex: 1,
        matchNumber: 2,
        homeTeamId: 'team-4',
        homeTeamName: 'Metro Rovers',
        homeTeamLogo: this.teams[3].logoUrl,
        awayTeamId: 'team-5',
        awayTeamName: 'Phoenix Academy',
        awayTeamLogo: this.teams[4].logoUrl,
        homeScore: 2,
        awayScore: 1,
        date: '2026-09-18',
        time: '16:30',
        venue: 'Grand Olympic Stadium - Pitch 1',
        refereeId: 'usr-ref-1',
        refereeName: 'Marcus Webb',
        status: 'COMPLETED',
        currentMinute: 90,
        period: 'Full-Time',
        winnerTeamId: 'team-4',
        events: [
          {
            id: 'ev-4',
            matchId: 'match-qf-2',
            minute: 33,
            timestamp: '2026-09-18T17:03:00Z',
            type: 'GOAL',
            teamId: 'team-4',
            teamName: 'Metro Rovers',
            playerId: 'ply-11',
            playerName: 'Ezekiel Cole',
            detail: 'Volley inside penalty box',
            addedBy: 'Marcus Webb'
          }
        ],
        scoreUpdates: [],
        playerParticipations: [],
        refereeReportSubmitted: true,
        version: 3,
        nextMatchId: 'match-sf-1',
        nextMatchSlot: 'away'
      },

      // Quarter-Final 3 (Completed)
      {
        id: 'match-qf-3',
        tournamentId: 'tour-1',
        tournamentName: 'BIT-57 Inter-Collegiate Premier Championship',
        roundName: 'Quarter-Final 3',
        roundIndex: 1,
        matchNumber: 3,
        homeTeamId: 'team-2',
        homeTeamName: 'Apex Strikers',
        homeTeamLogo: this.teams[1].logoUrl,
        awayTeamId: 'team-7',
        awayTeamName: 'Cobalt Wolves',
        awayTeamLogo: this.teams[6].logoUrl,
        homeScore: 3,
        awayScore: 1,
        date: '2026-09-19',
        time: '13:00',
        venue: 'Apex Arena Stadium',
        refereeId: 'usr-ref-1',
        refereeName: 'Marcus Webb',
        status: 'COMPLETED',
        currentMinute: 90,
        period: 'Full-Time',
        winnerTeamId: 'team-2',
        events: [
          {
            id: 'ev-5',
            matchId: 'match-qf-3',
            minute: 22,
            timestamp: '2026-09-19T13:22:00Z',
            type: 'GOAL',
            teamId: 'team-2',
            teamName: 'Apex Strikers',
            playerId: 'ply-5',
            playerName: 'Zane Al-Mansoor',
            detail: 'Counter-attack sprint and low driven shot',
            addedBy: 'Marcus Webb'
          }
        ],
        scoreUpdates: [],
        playerParticipations: [],
        refereeReportSubmitted: true,
        version: 4,
        nextMatchId: 'match-sf-2',
        nextMatchSlot: 'home'
      },

      // Quarter-Final 4 (Completed)
      {
        id: 'match-qf-4',
        tournamentId: 'tour-1',
        tournamentName: 'BIT-57 Inter-Collegiate Premier Championship',
        roundName: 'Quarter-Final 4',
        roundIndex: 1,
        matchNumber: 4,
        homeTeamId: 'team-3',
        homeTeamName: 'Horizon United',
        homeTeamLogo: this.teams[2].logoUrl,
        awayTeamId: 'team-6',
        awayTeamName: 'Vanguard Elite',
        awayTeamLogo: this.teams[5].logoUrl,
        homeScore: 2,
        awayScore: 0,
        date: '2026-09-19',
        time: '16:00',
        venue: 'North Campus Pitch',
        refereeId: 'usr-ref-1',
        refereeName: 'Marcus Webb',
        status: 'COMPLETED',
        currentMinute: 90,
        period: 'Full-Time',
        winnerTeamId: 'team-3',
        events: [],
        scoreUpdates: [],
        playerParticipations: [],
        refereeReportSubmitted: true,
        version: 3,
        nextMatchId: 'match-sf-2',
        nextMatchSlot: 'away'
      },

      // Semi-Final 1 (LIVE SCORING ACTIVE DEMO MATCH!)
      {
        id: 'match-sf-1',
        tournamentId: 'tour-1',
        tournamentName: 'BIT-57 Inter-Collegiate Premier Championship',
        roundName: 'Semi-Final 1',
        roundIndex: 2,
        matchNumber: 5,
        homeTeamId: 'team-1',
        homeTeamName: 'Titan FC',
        homeTeamLogo: this.teams[0].logoUrl,
        awayTeamId: 'team-4',
        awayTeamName: 'Metro Rovers',
        awayTeamLogo: this.teams[3].logoUrl,
        homeScore: 2,
        awayScore: 1,
        date: '2026-09-20',
        time: '15:00',
        venue: 'Grand Olympic Stadium - Pitch 1',
        refereeId: 'usr-ref-1',
        refereeName: 'Marcus Webb',
        status: 'LIVE',
        currentMinute: 68,
        period: '2nd Half',
        events: [
          {
            id: 'ev-sf1-1',
            matchId: 'match-sf-1',
            minute: 12,
            timestamp: '2026-09-20T15:12:00Z',
            type: 'GOAL',
            teamId: 'team-1',
            teamName: 'Titan FC',
            playerId: 'ply-1',
            playerName: 'Julian Reyes',
            detail: 'Curling strike from edge of 18-yard box into upper right corner',
            addedBy: 'Marcus Webb'
          },
          {
            id: 'ev-sf1-2',
            matchId: 'match-sf-1',
            minute: 37,
            timestamp: '2026-09-20T15:37:00Z',
            type: 'GOAL',
            teamId: 'team-4',
            teamName: 'Metro Rovers',
            playerId: 'ply-11',
            playerName: 'Ezekiel Cole',
            detail: 'Deflected strike caught keeper off guard at near post',
            addedBy: 'Marcus Webb'
          },
          {
            id: 'ev-sf1-3',
            matchId: 'match-sf-1',
            minute: 52,
            timestamp: '2026-09-20T16:07:00Z',
            type: 'GOAL',
            teamId: 'team-1',
            teamName: 'Titan FC',
            playerId: 'ply-2',
            playerName: 'Mateo Hernandez',
            detail: 'Tapped in rebound after goalkeeper parried Julian Reyes shot',
            addedBy: 'Marcus Webb'
          },
          {
            id: 'ev-sf1-4',
            matchId: 'match-sf-1',
            minute: 61,
            timestamp: '2026-09-20T16:16:00Z',
            type: 'YELLOW_CARD',
            teamId: 'team-1',
            teamName: 'Titan FC',
            playerId: 'ply-3',
            playerName: 'Liam Gallagher',
            detail: 'Tactical foul breaking up a counter attack',
            addedBy: 'Marcus Webb'
          }
        ],
        scoreUpdates: [
          {
            id: 'sc-sf1-1',
            matchId: 'match-sf-1',
            timestamp: '2026-09-20T15:12:00Z',
            userId: 'usr-ref-1',
            userName: 'Marcus Webb',
            prevHomeScore: 0,
            prevAwayScore: 0,
            newHomeScore: 1,
            newAwayScore: 0,
            eventType: 'GOAL',
            version: 1
          },
          {
            id: 'sc-sf1-2',
            matchId: 'match-sf-1',
            timestamp: '2026-09-20T15:37:00Z',
            userId: 'usr-ref-1',
            userName: 'Marcus Webb',
            prevHomeScore: 1,
            prevAwayScore: 0,
            newHomeScore: 1,
            newAwayScore: 1,
            eventType: 'GOAL',
            version: 2
          },
          {
            id: 'sc-sf1-3',
            matchId: 'match-sf-1',
            timestamp: '2026-09-20T16:07:00Z',
            userId: 'usr-ref-1',
            userName: 'Marcus Webb',
            prevHomeScore: 1,
            prevAwayScore: 1,
            newHomeScore: 2,
            newAwayScore: 1,
            eventType: 'GOAL',
            version: 3
          }
        ],
        playerParticipations: [
          { playerId: 'ply-1', playerName: 'Julian Reyes', teamId: 'team-1', minutesPlayed: 68, goals: 1, assists: 1, yellowCards: 0, redCards: 0 },
          { playerId: 'ply-2', playerName: 'Mateo Hernandez', teamId: 'team-1', minutesPlayed: 68, goals: 1, assists: 0, yellowCards: 0, redCards: 0 },
          { playerId: 'ply-3', playerName: 'Liam Gallagher', teamId: 'team-1', minutesPlayed: 68, goals: 0, assists: 0, yellowCards: 1, redCards: 0 },
          { playerId: 'ply-4', playerName: 'Darius Thorne', teamId: 'team-1', minutesPlayed: 68, goals: 0, assists: 0, yellowCards: 0, redCards: 0 },
          { playerId: 'ply-11', playerName: 'Ezekiel Cole', teamId: 'team-4', minutesPlayed: 68, goals: 1, assists: 0, yellowCards: 0, redCards: 0 }
        ],
        refereeReportSubmitted: false,
        version: 4,
        nextMatchId: 'match-fn-1',
        nextMatchSlot: 'home'
      },

      // Semi-Final 2 (Scheduled)
      {
        id: 'match-sf-2',
        tournamentId: 'tour-1',
        tournamentName: 'BIT-57 Inter-Collegiate Premier Championship',
        roundName: 'Semi-Final 2',
        roundIndex: 2,
        matchNumber: 6,
        homeTeamId: 'team-2',
        homeTeamName: 'Apex Strikers',
        homeTeamLogo: this.teams[1].logoUrl,
        awayTeamId: 'team-3',
        awayTeamName: 'Horizon United',
        awayTeamLogo: this.teams[2].logoUrl,
        homeScore: 0,
        awayScore: 0,
        date: '2026-09-21',
        time: '17:00',
        venue: 'Apex Arena Stadium',
        refereeId: 'usr-ref-1',
        refereeName: 'Marcus Webb',
        status: 'SCHEDULED',
        currentMinute: 0,
        period: 'Pre-Match',
        events: [],
        scoreUpdates: [],
        playerParticipations: [],
        version: 1,
        nextMatchId: 'match-fn-1',
        nextMatchSlot: 'away'
      },

      // Grand Final (Scheduled / waiting for SF advancement)
      {
        id: 'match-fn-1',
        tournamentId: 'tour-1',
        tournamentName: 'BIT-57 Inter-Collegiate Premier Championship',
        roundName: 'Championship Final',
        roundIndex: 3,
        matchNumber: 7,
        homeTeamId: '',
        homeTeamName: 'Winner SF 1',
        homeTeamLogo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=120&auto=format&fit=crop&q=80',
        awayTeamId: '',
        awayTeamName: 'Winner SF 2',
        awayTeamLogo: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=120&auto=format&fit=crop&q=80',
        homeScore: 0,
        awayScore: 0,
        date: '2026-09-25',
        time: '18:30',
        venue: 'Grand Olympic Stadium - Pitch 1',
        refereeId: 'usr-ref-1',
        refereeName: 'Marcus Webb',
        status: 'SCHEDULED',
        currentMinute: 0,
        period: 'Pre-Match',
        events: [],
        scoreUpdates: [],
        playerParticipations: [],
        version: 1
      }
    ];

    // 6. System Alerts
    this.alerts = [
      {
        id: 'alt-1',
        type: 'INJURY_RISK_FLAG',
        title: 'High Workload Risk: Julian Reyes (Titan FC)',
        message: 'Julian Reyes has accumulated 248 match minutes across 3 fixtures within 48 hours. Acute:Chronic Workload Ratio (ACWR) reached 1.78. Flagged as 🔴 High Risk.',
        severity: 'critical',
        timestamp: '2026-09-20T06:30:00Z',
        read: false,
        linkTo: '/injury-flags',
        entityId: 'ply-1'
      },
      {
        id: 'alt-2',
        type: 'ELIGIBILITY_PENDING',
        title: 'Player Eligibility Pending: Lucas Silva',
        message: 'Provisional registration document submitted by Apex Strikers requires Academic Dean verification before match clearance.',
        severity: 'warning',
        timestamp: '2026-09-20T05:15:00Z',
        read: false,
        linkTo: '/documents',
        entityId: 'ply-7'
      },
      {
        id: 'alt-3',
        type: 'MATCH_STARTING_SOON',
        title: 'Semi-Final 2 Commences Tomorrow',
        message: 'Apex Strikers vs Horizon United is scheduled for Sep 21 at Apex Arena. Referee Marcus Webb assigned.',
        severity: 'info',
        timestamp: '2026-09-19T20:00:00Z',
        read: true,
        linkTo: '/fixtures',
        entityId: 'match-sf-2'
      },
      {
        id: 'alt-4',
        type: 'MISSING_DOCUMENTS',
        title: 'Expired Medical Clearance: Andre Dubois',
        message: 'Player Andre Dubois (Horizon United) medical certificate has been rejected. Player barred from participation until renewed certificate uploaded.',
        severity: 'warning',
        timestamp: '2026-09-18T11:00:00Z',
        read: false,
        linkTo: '/documents',
        entityId: 'ply-10'
      }
    ];

    // 7. Audit Logs
    this.auditLogs = [
      {
        id: 'log-1',
        timestamp: '2026-09-20T16:07:05Z',
        userId: 'usr-ref-1',
        userName: 'Marcus Webb',
        userRole: 'REFEREE',
        action: 'SCORE_UPDATE',
        entityType: 'SCORE',
        entityId: 'match-sf-1',
        previousValue: 'Titan FC 1 - 1 Metro Rovers',
        newValue: 'Titan FC 2 - 1 Metro Rovers (Goal: Mateo Hernandez)',
        notes: 'Recorded in 52nd minute of Semi-Final 1'
      },
      {
        id: 'log-2',
        timestamp: '2026-09-20T15:00:00Z',
        userId: 'usr-ref-1',
        userName: 'Marcus Webb',
        userRole: 'REFEREE',
        action: 'MATCH_START',
        entityType: 'MATCH',
        entityId: 'match-sf-1',
        previousValue: 'SCHEDULED',
        newValue: 'LIVE',
        notes: 'Kickoff whistle blown at Grand Olympic Stadium'
      },
      {
        id: 'log-3',
        timestamp: '2026-09-19T18:00:00Z',
        userId: 'usr-admin-1',
        userName: 'Prof. David Vance',
        userRole: 'ADMIN',
        action: 'MATCH_COMPLETED',
        entityType: 'MATCH',
        entityId: 'match-qf-4',
        previousValue: 'LIVE (2-0)',
        newValue: 'COMPLETED (Horizon United advanced)',
        notes: 'Standings and bracket updated automatically'
      },
      {
        id: 'log-4',
        timestamp: '2026-09-18T12:00:00Z',
        userId: 'usr-admin-1',
        userName: 'Prof. David Vance',
        userRole: 'ADMIN',
        action: 'DOCUMENT_VERIFIED',
        entityType: 'DOCUMENT',
        entityId: 'doc-1',
        previousValue: 'PENDING',
        newValue: 'VERIFIED',
        notes: 'Student ID proof validated against university registrar'
      },
      {
        id: 'log-5',
        timestamp: '2026-09-15T09:30:00Z',
        userId: 'usr-admin-1',
        userName: 'Prof. David Vance',
        userRole: 'ADMIN',
        action: 'FIXTURES_GENERATED',
        entityType: 'FIXTURE',
        entityId: 'tour-1',
        newValue: 'Generated 7 single-elimination bracket fixtures',
        notes: 'Automated seeding applied based on team coefficients'
      }
    ];

    // Recalculate dynamic workloads & risk flags on initial load
    this.recalculateWorkloadsAndRisks();
  }

  // Workload and Acute:Chronic Workload Ratio (ACWR) Calculation Engine
  recalculateWorkloadsAndRisks() {
    this.players.forEach(player => {
      // Calculate minutes based on participations and completed matches
      let totalMinutes = player.minutesPlayed || 0;
      let matches48h = 0;
      let minutes48h = 0;
      let matches7d = player.matchesPlayed || 0;
      let minutes7d = totalMinutes;

      // Realistic player scenario profiling:
      if (player.id === 'ply-1') {
        // Julian Reyes - High workload case
        matches48h = 3;
        minutes48h = 248;
        minutes7d = 360;
      } else if (player.id === 'ply-2') {
        // Mateo Hernandez - Moderate workload case
        matches48h = 2;
        minutes48h = 158;
        minutes7d = 330;
      } else if (player.id === 'ply-5') {
        // Zane Al-Mansoor - Moderate workload case
        matches48h = 2;
        minutes48h = 165;
        minutes7d = 350;
      } else {
        matches48h = 1;
        minutes48h = 90;
        minutes7d = totalMinutes > 0 ? totalMinutes : 90;
      }

      const acuteLoadMinutes = minutes7d;
      // Chronic load is 28 days normalized weekly average load (e.g. baseline 200 min/week)
      const chronicLoadMinutes = 195;
      const acwr = Number((acuteLoadMinutes / chronicLoadMinutes).toFixed(2));
      const recoveryGapHours = player.id === 'ply-1' ? 14 : player.id === 'ply-2' ? 26 : 52;

      // Workload score (0 - 100)
      let workloadScore = Math.min(100, Math.round((acuteLoadMinutes / 400) * 60 + (matches48h * 15)));

      let workloadLevel: 'LOW' | 'NORMAL' | 'HIGH' | 'VERY_HIGH' = 'NORMAL';
      if (acwr >= 1.7 || workloadScore >= 80) {
        workloadLevel = 'VERY_HIGH';
      } else if (acwr >= 1.4 || workloadScore >= 65) {
        workloadLevel = 'HIGH';
      } else if (acwr >= 0.8 && acwr < 1.4) {
        workloadLevel = 'NORMAL';
      } else {
        workloadLevel = 'LOW';
      }

      const summaryExplanation = `Acute Load (${acuteLoadMinutes} mins / 7d) vs Chronic Load (${chronicLoadMinutes} mins/wk) yields an ACWR of ${acwr}. Recovery gap is ${recoveryGapHours}h with ${matches48h} match(es) in the last 48 hours.`;

      const workload: PlayerWorkload = {
        playerId: player.id,
        playerName: player.name,
        teamId: player.teamId,
        teamName: player.teamName,
        workloadLevel,
        workloadScore,
        breakdown: {
          acuteLoadMinutes,
          chronicLoadMinutes,
          acwr,
          recoveryGapHours,
          matchesInLast48h: matches48h,
          matchesInLast7d: matches7d,
          totalSeasonMinutes: totalMinutes,
          workloadScore
        },
        summaryExplanation
      };

      player.workload = workload;

      // Injury Risk Flag Determination (Statistical indicator based on workload thresholds)
      const reasons: string[] = [];
      const triggers = [
        {
          label: 'Matches in last 48 hours',
          value: `${matches48h} matches`,
          threshold: '≤ 2 matches',
          exceeded: matches48h >= 3
        },
        {
          label: 'Playing time in last 48 hours',
          value: `${minutes48h} mins`,
          threshold: '≤ 180 mins',
          exceeded: minutes48h >= 180
        },
        {
          label: 'Acute:Chronic Workload Ratio (ACWR)',
          value: `${acwr}`,
          threshold: '0.80 – 1.40',
          exceeded: acwr >= 1.5 || acwr < 0.5
        },
        {
          label: 'Inter-match recovery interval',
          value: `${recoveryGapHours} hours`,
          threshold: '≥ 48 hours',
          exceeded: recoveryGapHours < 24
        }
      ];

      if (matches48h >= 3) {
        reasons.push(`${matches48h} matches played within 48-hour window (threshold: max 2).`);
      }
      if (minutes48h >= 180) {
        reasons.push(`High acute match exposure (${minutes48h} minutes in 48 hours; threshold: 180 mins).`);
      }
      if (acwr >= 1.5) {
        reasons.push(`ACWR spike detected (${acwr}; danger threshold: ≥ 1.50).`);
      }
      if (recoveryGapHours < 24) {
        reasons.push(`Severely compressed recovery window (${recoveryGapHours}h between consecutive fixtures; threshold: ≥ 48h).`);
      }

      let riskLevel: 'LOW' | 'MODERATE' | 'HIGH' = 'LOW';
      let riskScore = 20;

      if (reasons.length >= 2 || acwr >= 1.6) {
        riskLevel = 'HIGH';
        riskScore = Math.min(95, 75 + reasons.length * 5);
      } else if (reasons.length === 1 || acwr >= 1.35) {
        riskLevel = 'MODERATE';
        riskScore = 55;
      } else {
        riskLevel = 'LOW';
        riskScore = 20;
      }

      player.injuryRisk = {
        playerId: player.id,
        playerName: player.name,
        teamId: player.teamId,
        teamName: player.teamName,
        riskLevel,
        riskScore,
        reasons: reasons.length > 0 ? reasons : ['Workload metrics within standard physiological recovery tolerances.'],
        triggers,
        disclaimer: 'Workload-based statistical indicator; not a clinical medical diagnosis.',
        lastCalculated: new Date().toISOString()
      };
    });
  }

  // Standings calculation
  getStandings(tournamentId?: string): StandingRecord[] {
    const tournament = this.tournaments.find(t => t.id === tournamentId) || this.tournaments[0];
    const registeredIds = new Set(tournament.registeredTeamIds);

    const standingsMap = new Map<string, StandingRecord>();

    this.teams
      .filter(t => registeredIds.has(t.id))
      .forEach(t => {
        standingsMap.set(t.id, {
          teamId: t.id,
          teamName: t.name,
          teamLogo: t.logoUrl,
          teamCode: t.code,
          played: t.matchesPlayed,
          won: t.wins,
          lost: t.losses,
          draw: t.draws,
          points: t.points,
          goalsFor: t.goalsFor,
          goalsAgainst: t.goalsAgainst,
          goalDifference: t.goalDifference,
          form: t.recentForm,
          rank: 0
        });
      });

    const sorted = Array.from(standingsMap.values()).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });

    sorted.forEach((item, index) => {
      item.rank = index + 1;
    });

    return sorted;
  }

  // Update standings from completed match
  updateStandingsAfterMatch(match: Match) {
    const homeTeam = this.teams.find(t => t.id === match.homeTeamId);
    const awayTeam = this.teams.find(t => t.id === match.awayTeamId);

    if (!homeTeam || !awayTeam) return;

    homeTeam.matchesPlayed += 1;
    awayTeam.matchesPlayed += 1;
    homeTeam.goalsFor += match.homeScore;
    homeTeam.goalsAgainst += match.awayScore;
    homeTeam.goalDifference = homeTeam.goalsFor - homeTeam.goalsAgainst;

    awayTeam.goalsFor += match.awayScore;
    awayTeam.goalsAgainst += match.homeScore;
    awayTeam.goalDifference = awayTeam.goalsFor - awayTeam.goalsAgainst;

    if (match.homeScore > match.awayScore) {
      homeTeam.wins += 1;
      homeTeam.points += 3;
      awayTeam.losses += 1;
      homeTeam.recentForm = [...homeTeam.recentForm.slice(1), 'W'];
      awayTeam.recentForm = [...awayTeam.recentForm.slice(1), 'L'];
      match.winnerTeamId = homeTeam.id;
    } else if (match.homeScore < match.awayScore) {
      awayTeam.wins += 1;
      awayTeam.points += 3;
      homeTeam.losses += 1;
      homeTeam.recentForm = [...homeTeam.recentForm.slice(1), 'L'];
      awayTeam.recentForm = [...awayTeam.recentForm.slice(1), 'W'];
      match.winnerTeamId = awayTeam.id;
    } else {
      homeTeam.draws += 1;
      awayTeam.draws += 1;
      homeTeam.points += 1;
      awayTeam.points += 1;
      homeTeam.recentForm = [...homeTeam.recentForm.slice(1), 'D'];
      awayTeam.recentForm = [...awayTeam.recentForm.slice(1), 'D'];
    }

    // Bracket winner advancement
    if (match.nextMatchId && match.winnerTeamId) {
      const nextMatch = this.matches.find(m => m.id === match.nextMatchId);
      if (nextMatch) {
        const winningTeam = match.winnerTeamId === homeTeam.id ? homeTeam : awayTeam;
        if (match.nextMatchSlot === 'home') {
          nextMatch.homeTeamId = winningTeam.id;
          nextMatch.homeTeamName = winningTeam.name;
          nextMatch.homeTeamLogo = winningTeam.logoUrl;
        } else {
          nextMatch.awayTeamId = winningTeam.id;
          nextMatch.awayTeamName = winningTeam.name;
          nextMatch.awayTeamLogo = winningTeam.logoUrl;
        }
      }
    }
  }

  // Fixture Generator
  generateFixtures(
    tournamentId: string,
    format: TournamentFormat,
    teamIds: string[],
    venue: string,
    startDate: string
  ): Match[] {
    const tournament = this.tournaments.find(t => t.id === tournamentId);
    if (!tournament) throw new Error('Tournament not found');

    const teams = this.teams.filter(t => teamIds.includes(t.id));
    if (teams.length < 2) throw new Error('At least 2 teams required to generate fixtures');

    const newMatches: Match[] = [];
    const referee = this.users.find(u => u.role === 'REFEREE');

    if (format === 'SINGLE_ELIMINATION') {
      // Determine power of 2
      let n = teams.length;
      let roundsCount = Math.ceil(Math.log2(n));
      let totalSlots = Math.pow(2, roundsCount);

      // Round 1 matches
      const round1MatchesCount = totalSlots / 2;
      let matchCounter = 1;

      // Create QF matches
      const round1Matches: Match[] = [];
      for (let i = 0; i < round1MatchesCount; i++) {
        const home = teams[i * 2] || { id: 'tbd', name: 'BYE', logoUrl: '' };
        const away = teams[i * 2 + 1] || { id: 'tbd', name: 'BYE', logoUrl: '' };

        const m: Match = {
          id: `match-gen-r1-${i + 1}`,
          tournamentId,
          tournamentName: tournament.name,
          roundName: roundsCount === 3 ? `Quarter-Final ${i + 1}` : `Round 1 Match ${i + 1}`,
          roundIndex: 1,
          matchNumber: matchCounter++,
          homeTeamId: home.id,
          homeTeamName: home.name,
          homeTeamLogo: home.logoUrl,
          awayTeamId: away.id,
          awayTeamName: away.name,
          awayTeamLogo: away.logoUrl,
          homeScore: 0,
          awayScore: 0,
          date: startDate,
          time: `${14 + i * 2}:00`,
          venue,
          refereeId: referee?.id,
          refereeName: referee?.name,
          status: 'SCHEDULED',
          currentMinute: 0,
          period: 'Pre-Match',
          events: [],
          scoreUpdates: [],
          playerParticipations: [],
          version: 1
        };
        round1Matches.push(m);
        newMatches.push(m);
      }

      // Semi-Finals
      const sfMatches: Match[] = [];
      const sfCount = round1MatchesCount / 2;
      for (let i = 0; i < sfCount; i++) {
        const m: Match = {
          id: `match-gen-r2-${i + 1}`,
          tournamentId,
          tournamentName: tournament.name,
          roundName: roundsCount === 3 ? `Semi-Final ${i + 1}` : `Round 2 Match ${i + 1}`,
          roundIndex: 2,
          matchNumber: matchCounter++,
          homeTeamId: '',
          homeTeamName: `Winner Match ${i * 2 + 1}`,
          homeTeamLogo: '',
          awayTeamId: '',
          awayTeamName: `Winner Match ${i * 2 + 2}`,
          awayTeamLogo: '',
          homeScore: 0,
          awayScore: 0,
          date: startDate,
          time: `${15 + i * 2}:00`,
          venue,
          refereeId: referee?.id,
          refereeName: referee?.name,
          status: 'SCHEDULED',
          currentMinute: 0,
          period: 'Pre-Match',
          events: [],
          scoreUpdates: [],
          playerParticipations: [],
          version: 1
        };
        sfMatches.push(m);
        newMatches.push(m);

        // Link R1 winners to this SF
        if (round1Matches[i * 2]) {
          round1Matches[i * 2].nextMatchId = m.id;
          round1Matches[i * 2].nextMatchSlot = 'home';
        }
        if (round1Matches[i * 2 + 1]) {
          round1Matches[i * 2 + 1].nextMatchId = m.id;
          round1Matches[i * 2 + 1].nextMatchSlot = 'away';
        }
      }

      // Final
      const finalMatch: Match = {
        id: `match-gen-fn-1`,
        tournamentId,
        tournamentName: tournament.name,
        roundName: 'Championship Final',
        roundIndex: 3,
        matchNumber: matchCounter++,
        homeTeamId: '',
        homeTeamName: 'Winner Semi-Final 1',
        homeTeamLogo: '',
        awayTeamId: '',
        awayTeamName: 'Winner Semi-Final 2',
        awayTeamLogo: '',
        homeScore: 0,
        awayScore: 0,
        date: startDate,
        time: '18:00',
        venue,
        refereeId: referee?.id,
        refereeName: referee?.name,
        status: 'SCHEDULED',
        currentMinute: 0,
        period: 'Pre-Match',
        events: [],
        scoreUpdates: [],
        playerParticipations: [],
        version: 1
      };
      newMatches.push(finalMatch);

      if (sfMatches[0]) {
        sfMatches[0].nextMatchId = finalMatch.id;
        sfMatches[0].nextMatchSlot = 'home';
      }
      if (sfMatches[1]) {
        sfMatches[1].nextMatchId = finalMatch.id;
        sfMatches[1].nextMatchSlot = 'away';
      }
    } else {
      // Round Robin or Group+Knockout
      let matchNumber = 1;
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          newMatches.push({
            id: `match-rr-${i}-${j}`,
            tournamentId,
            tournamentName: tournament.name,
            roundName: `Matchday ${Math.ceil(matchNumber / 2)}`,
            roundIndex: 1,
            matchNumber: matchNumber++,
            homeTeamId: teams[i].id,
            homeTeamName: teams[i].name,
            homeTeamLogo: teams[i].logoUrl,
            awayTeamId: teams[j].id,
            awayTeamName: teams[j].name,
            awayTeamLogo: teams[j].logoUrl,
            homeScore: 0,
            awayScore: 0,
            date: startDate,
            time: '15:00',
            venue,
            refereeId: referee?.id,
            refereeName: referee?.name,
            status: 'SCHEDULED',
            currentMinute: 0,
            period: 'Pre-Match',
            events: [],
            scoreUpdates: [],
            playerParticipations: [],
            version: 1
          });
        }
      }
    }

    // Replace or append
    this.matches = newMatches;
    tournament.status = 'IN_PROGRESS';

    this.addAuditLog({
      userId: 'usr-admin-1',
      userName: 'Admin / Organizer',
      userRole: 'ADMIN',
      action: 'FIXTURE_GENERATION',
      entityType: 'FIXTURE',
      entityId: tournamentId,
      newValue: `Generated ${newMatches.length} fixtures for format ${format}`
    });

    return newMatches;
  }

  // Audit Logger
  addAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) {
    const log: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      ...entry
    };
    this.auditLogs.unshift(log);
    if (this.auditLogs.length > 200) {
      this.auditLogs.pop();
    }
  }

  // Add System Alert
  addAlert(alert: Omit<SystemAlert, 'id' | 'timestamp' | 'read'>) {
    const newAlert: SystemAlert = {
      id: `alt-${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false,
      ...alert
    };
    this.alerts.unshift(newAlert);
  }

  // Metrics update
  recordApiCall(responseTimeMs: number) {
    this.metrics.totalApiRequests += 1;
    this.metrics.serverUptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);
    this.metrics.averageResponseTimeMs = Math.round(
      (this.metrics.averageResponseTimeMs * (this.metrics.totalApiRequests - 1) + responseTimeMs) /
        this.metrics.totalApiRequests
    );
    this.metrics.activeMatchesCount = this.matches.filter(m => m.status === 'LIVE').length;
    this.metrics.totalMatchesCompleted = this.matches.filter(m => m.status === 'COMPLETED').length;
  }
}

export const db = new SportsDatabase();
