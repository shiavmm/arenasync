#!/usr/bin/env node
/**
 * ==============================================================================
 * ArenaSync (BIT-57) - Synthetic Seed Data Generator
 * ==============================================================================
 * Generates deterministic synthetic data (same output every run) for:
 * - Tournament 1: BIT-57 Inter-Collegiate Premier Championship (Football / Soccer)
 * - Tournament 2: BIT-57 Collegiate Basketball Invitational (Basketball)
 * 
 * Features:
 * - 8 teams per tournament (16 teams total)
 * - 10 players per basketball team (80 basketball players + football roster)
 * - Eligibility documents with mixed statuses (VERIFIED, PENDING, REJECTED)
 * - Fixtures with 7-match knockout brackets (4 QF, 2 SF, 1 Final) per tournament
 * - Match results, minutes, events, and stats for ACWR workload modeling
 * - Strictly 100% synthetic fictional names (no real persons)
 * ==============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Seeded Pseudo-Random Number Generator (Mulberry32)
function createRng(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SEED_VALUE = 42;
const rng = createRng(SEED_VALUE);

function randChoice(arr) {
  return arr[Math.floor(rng() * arr.length)];
}

function randInt(min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

// ------------------------------------------------------------------------------
// Fictional Name Banks (100% Synthetic)
// ------------------------------------------------------------------------------
const FIRST_NAMES = [
  'Aiden', 'Bryson', 'Caleb', 'Dante', 'Ethan', 'Felix', 'Gabriel', 'Hunter',
  'Isaiah', 'Jaxon', 'Kobe', 'Leo', 'Malik', 'Nico', 'Omar', 'Preston',
  'Quincy', 'Rowan', 'Silas', 'Tariq', 'Uriah', 'Victor', 'Wyatt', 'Xavier',
  'Yusuf', 'Zane', 'Damian', 'Kendrick', 'Devin', 'Trevor', 'Sterling', 'Kofi',
  'Andre', 'Tobias', 'Luka', 'Darius', 'Julian', 'Mateo', 'Liam', 'Ezekiel'
];

const LAST_NAMES = [
  'Sterling', 'Vance', 'Cross', 'Reed', 'Thorne', 'Hayes', 'King', 'Dubois',
  'Gallagher', 'Sato', 'Mercer', 'Reyes', 'Hernandez', 'Silva', 'Chen', 'Gomez',
  'Volkov', 'Archer', 'Sinclair', 'Vanderbilt', 'Cole', 'Brooks', 'Bishop',
  'Frost', 'Winters', 'Monroe', 'Holt', 'Davenport', 'Clayton', 'Castillo'
];

const BASKETBALL_POSITIONS = [
  'Point Guard',
  'Shooting Guard',
  'Small Forward',
  'Power Forward',
  'Center'
];

// ------------------------------------------------------------------------------
// 1. Users
// ------------------------------------------------------------------------------
const users = [
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
    id: 'usr-ref-2',
    name: 'Derrick Reynolds (NCAA Basketball Ref)',
    email: 'basketball.ref@smartsports.edu',
    role: 'REFEREE',
    assignedMatchIds: ['match-b-sf-1', 'match-b-fn-1'],
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
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
    id: 'usr-coach-2',
    name: 'Malik Sterling (Head Coach)',
    email: 'coach@cyberknights.edu',
    role: 'COACH',
    teamId: 'team-b1',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
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

// ------------------------------------------------------------------------------
// 2. Tournaments
// ------------------------------------------------------------------------------
const tournaments = [
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
  },
  {
    id: 'tour-2',
    name: 'BIT-57 Collegiate Basketball Invitational',
    sport: 'Basketball',
    format: 'SINGLE_ELIMINATION',
    startDate: '2026-10-01',
    endDate: '2026-10-14',
    venue: 'Metropolitan Sports Complex - Arena Court 1',
    numTeams: 8,
    registeredTeamIds: ['team-b1', 'team-b2', 'team-b3', 'team-b4', 'team-b5', 'team-b6', 'team-b7', 'team-b8'],
    rules: 'Standard FIBA / NCAA rules: 4x10 min quarters. 24s shot clock. 5 personal fouls limit. Overtime: 5 mins for knockout ties. Player eligibility requires verified College ID and Medical Certificate.',
    status: 'IN_PROGRESS',
    bannerUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&auto=format&fit=crop&q=80'
  }
];

// ------------------------------------------------------------------------------
// 3. Teams (8 Football + 8 Basketball)
// ------------------------------------------------------------------------------
const footballTeams = [
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

const basketballTeams = [
  {
    id: 'team-b1',
    name: 'Cyber Knights',
    code: 'CBK',
    logoUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=120&auto=format&fit=crop&q=80',
    coachName: 'Malik Sterling',
    coachEmail: 'coach@cyberknights.edu',
    coachId: 'usr-coach-2',
    sport: 'Basketball',
    homeVenue: 'Metropolitan Arena Court 1',
    primaryColor: '#2563eb',
    secondaryColor: '#1d4ed8',
    matchesPlayed: 3,
    wins: 3,
    losses: 0,
    draws: 0,
    points: 9,
    goalsFor: 254,
    goalsAgainst: 220,
    goalDifference: 34,
    recentForm: ['W', 'W', 'W'],
    status: 'ACTIVE'
  },
  {
    id: 'team-b2',
    name: 'Solar Falcons',
    code: 'SLF',
    logoUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=120&auto=format&fit=crop&q=80',
    coachName: 'Maya Lin',
    coachEmail: 'coach@solarfalcons.edu',
    sport: 'Basketball',
    homeVenue: 'Solar Dome Arena',
    primaryColor: '#f59e0b',
    secondaryColor: '#d97706',
    matchesPlayed: 3,
    wins: 2,
    losses: 1,
    draws: 0,
    points: 6,
    goalsFor: 248,
    goalsAgainst: 235,
    goalDifference: 13,
    recentForm: ['W', 'W', 'L'],
    status: 'ACTIVE'
  },
  {
    id: 'team-b3',
    name: 'Quantum Vipers',
    code: 'QVP',
    logoUrl: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=120&auto=format&fit=crop&q=80',
    coachName: 'Jason Vance',
    coachEmail: 'vance@quantumvipers.org',
    sport: 'Basketball',
    homeVenue: 'Viper Pavilion',
    primaryColor: '#10b981',
    secondaryColor: '#059669',
    matchesPlayed: 3,
    wins: 2,
    losses: 1,
    draws: 0,
    points: 6,
    goalsFor: 239,
    goalsAgainst: 228,
    goalDifference: 11,
    recentForm: ['L', 'W', 'W'],
    status: 'ACTIVE'
  },
  {
    id: 'team-b4',
    name: 'Ironclad Titans',
    code: 'ICT',
    logoUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=120&auto=format&fit=crop&q=80',
    coachName: 'Robert Thorne',
    coachEmail: 'thorne@ironcladtitans.edu',
    sport: 'Basketball',
    homeVenue: 'Ironclad Center',
    primaryColor: '#6366f1',
    secondaryColor: '#4f46e5',
    matchesPlayed: 3,
    wins: 2,
    losses: 1,
    draws: 0,
    points: 6,
    goalsFor: 230,
    goalsAgainst: 225,
    goalDifference: 5,
    recentForm: ['W', 'L', 'W'],
    status: 'ACTIVE'
  },
  {
    id: 'team-b5',
    name: 'Nebula Wolves',
    code: 'NBW',
    logoUrl: 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=120&auto=format&fit=crop&q=80',
    coachName: 'Dmitri Volkov',
    coachEmail: 'volkov@nebulawolves.edu',
    sport: 'Basketball',
    homeVenue: 'Nebula Court',
    primaryColor: '#8b5cf6',
    secondaryColor: '#7c3aed',
    matchesPlayed: 2,
    wins: 1,
    losses: 1,
    draws: 0,
    points: 3,
    goalsFor: 155,
    goalsAgainst: 158,
    goalDifference: -3,
    recentForm: ['W', 'L'],
    status: 'ACTIVE'
  },
  {
    id: 'team-b6',
    name: 'Zenith Storm',
    code: 'ZST',
    logoUrl: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=120&auto=format&fit=crop&q=80',
    coachName: 'Anthony Chen',
    coachEmail: 'chen@zenithstorm.org',
    sport: 'Basketball',
    homeVenue: 'Storm Arena',
    primaryColor: '#06b6d4',
    secondaryColor: '#0891b2',
    matchesPlayed: 2,
    wins: 1,
    losses: 1,
    draws: 0,
    points: 3,
    goalsFor: 152,
    goalsAgainst: 160,
    goalDifference: -8,
    recentForm: ['W', 'L'],
    status: 'ACTIVE'
  },
  {
    id: 'team-b7',
    name: 'Apex Ballers',
    code: 'APB',
    logoUrl: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=120&auto=format&fit=crop&q=80',
    coachName: 'Sophia Gomez',
    coachEmail: 'gomez@apexballers.edu',
    sport: 'Basketball',
    homeVenue: 'Apex Hardwood Court',
    primaryColor: '#ec4899',
    secondaryColor: '#db2777',
    matchesPlayed: 2,
    wins: 0,
    losses: 2,
    draws: 0,
    points: 0,
    goalsFor: 165,
    goalsAgainst: 182,
    goalDifference: -17,
    recentForm: ['L', 'L'],
    status: 'ACTIVE'
  },
  {
    id: 'team-b8',
    name: 'Crimson Hawks',
    code: 'CRH',
    logoUrl: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=120&auto=format&fit=crop&q=80',
    coachName: 'Marcus Hayes',
    coachEmail: 'hayes@crimsonhawks.edu',
    sport: 'Basketball',
    homeVenue: 'Hawk Nest Gymnasium',
    primaryColor: '#ef4444',
    secondaryColor: '#dc2626',
    matchesPlayed: 2,
    wins: 0,
    losses: 2,
    draws: 0,
    points: 0,
    goalsFor: 148,
    goalsAgainst: 173,
    goalDifference: -25,
    recentForm: ['L', 'L'],
    status: 'ACTIVE'
  }
];

const allTeams = [...footballTeams, ...basketballTeams];

// ------------------------------------------------------------------------------
// 4. Players (Football Roster + 80 Basketball Players)
// ------------------------------------------------------------------------------
const footballPlayers = [
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

// Generate 10 basketball players for each of the 8 basketball teams (80 players total)
const basketballPlayers = [];
let docIdCounter = 100;
let playerNumber = 100;

basketballTeams.forEach((team, teamIndex) => {
  for (let p = 1; p <= 10; p++) {
    playerNumber++;
    const playerIdStr = `ply-b-${teamIndex + 1}-${p}`;
    const pNumberStr = `PLY-B${playerNumber}`;
    const firstName = FIRST_NAMES[(teamIndex * 10 + p) % FIRST_NAMES.length];
    const lastName = LAST_NAMES[(teamIndex * 7 + p * 3) % LAST_NAMES.length];
    const fullName = `${firstName} ${lastName}`;
    const position = BASKETBALL_POSITIONS[(p - 1) % BASKETBALL_POSITIONS.length];
    const jerseyNumber = p <= 5 ? [2, 3, 7, 11, 23, 30, 33, 34][(teamIndex + p) % 8] : (p + 15);
    const age = 19 + ((teamIndex + p) % 5);
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${team.name.toLowerCase().replace(/\s+/g, '')}.edu`;
    const phone = `+1 (555) ${randInt(200, 899)}-${randInt(1000, 9999)}`;

    // Eligibility status distribution: ~70% VERIFIED, ~15% PENDING, ~15% REJECTED
    let eligibilityStatus = 'VERIFIED';
    const documents = [];

    // Deterministic selection based on index
    if (p === 9) {
      eligibilityStatus = 'PENDING';
      docIdCounter++;
      documents.push({
        id: `doc-b-${docIdCounter}`,
        playerId: playerIdStr,
        documentType: 'REGISTRATION_DOC',
        fileName: `${lastName.toLowerCase()}_dean_clearance.pdf`,
        fileSize: '780 KB',
        uploadDate: '2026-10-02',
        status: 'PENDING',
        notes: 'Awaiting faculty dean clearance signature.'
      });
    } else if (p === 10) {
      eligibilityStatus = 'REJECTED';
      docIdCounter++;
      documents.push({
        id: `doc-b-${docIdCounter}`,
        playerId: playerIdStr,
        documentType: 'MEDICAL_CERTIFICATE',
        fileName: `${lastName.toLowerCase()}_sports_med_2024.pdf`,
        fileSize: '1.8 MB',
        uploadDate: '2026-10-01',
        status: 'REJECTED',
        verifiedDate: '2026-10-02',
        verifiedBy: 'Dr. Sarah Connor',
        notes: 'Expired cardiovascular screening certificate.'
      });
    } else {
      eligibilityStatus = 'VERIFIED';
      docIdCounter++;
      documents.push({
        id: `doc-b-${docIdCounter}`,
        playerId: playerIdStr,
        documentType: 'COLLEGE_ID',
        fileName: `${lastName.toLowerCase()}_student_id.pdf`,
        fileSize: '950 KB',
        uploadDate: '2026-09-25',
        status: 'VERIFIED',
        verifiedDate: '2026-09-27',
        verifiedBy: 'Prof. David Vance'
      });
      docIdCounter++;
      documents.push({
        id: `doc-b-${docIdCounter}`,
        playerId: playerIdStr,
        documentType: 'MEDICAL_CERTIFICATE',
        fileName: `${lastName.toLowerCase()}_med_eval.pdf`,
        fileSize: '1.4 MB',
        uploadDate: '2026-09-26',
        status: 'VERIFIED',
        verifiedDate: '2026-09-27',
        verifiedBy: 'Dr. Sarah Connor'
      });
    }

    // Realistic basketball playing minutes & stats
    const isStarter = p <= 5;
    const matchesPlayed = eligibilityStatus === 'REJECTED' ? 0 : isStarter ? 3 : 2;
    const minutesPlayed = eligibilityStatus === 'REJECTED' ? 0 : isStarter ? (85 + (p * 5) + (teamIndex * 3)) : (25 + p * 4);
    const pointsScored = eligibilityStatus === 'REJECTED' ? 0 : isStarter ? (28 + p * 6 + (teamIndex * 4)) : (6 + p * 2);
    const assists = eligibilityStatus === 'REJECTED' ? 0 : (isStarter ? randInt(6, 18) : randInt(1, 5));
    const fouls = eligibilityStatus === 'REJECTED' ? 0 : randInt(2, 9);
    const rating = eligibilityStatus === 'REJECTED' ? 6.0 : Number((7.4 + (p <= 3 ? 1.4 : 0.6) + (teamIndex * 0.1) % 0.8).toFixed(1));

    basketballPlayers.push({
      id: playerIdStr,
      name: fullName,
      playerId: pNumberStr,
      teamId: team.id,
      teamName: team.name,
      jerseyNumber,
      position,
      age,
      contactEmail: email,
      contactPhone: phone,
      photoUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=200&auto=format&fit=crop&q=80',
      eligibilityStatus,
      documents,
      matchesPlayed,
      minutesPlayed,
      goals: pointsScored, // basketball points stored in goals field for platform compatibility
      assists,
      yellowCards: 0,
      redCards: 0,
      fouls,
      rating
    });
  }
});

const allPlayers = [...footballPlayers, ...basketballPlayers];

// ------------------------------------------------------------------------------
// 5. Matches (Football Bracket + Basketball Bracket)
// ------------------------------------------------------------------------------
const footballMatches = [
  {
    id: 'match-qf-1',
    tournamentId: 'tour-1',
    tournamentName: 'BIT-57 Inter-Collegiate Premier Championship',
    roundName: 'Quarter-Final 1',
    roundIndex: 1,
    matchNumber: 1,
    homeTeamId: 'team-1',
    homeTeamName: 'Titan FC',
    homeTeamLogo: footballTeams[0].logoUrl,
    awayTeamId: 'team-8',
    awayTeamName: 'Neon Knights',
    awayTeamLogo: footballTeams[7].logoUrl,
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
      }
    ],
    scoreUpdates: [],
    playerParticipations: [],
    refereeReportSubmitted: true,
    refereeNotes: 'Clean, disciplined quarter-final match. Titan FC dominated midfield play.',
    version: 4,
    nextMatchId: 'match-sf-1',
    nextMatchSlot: 'home'
  },
  {
    id: 'match-qf-2',
    tournamentId: 'tour-1',
    tournamentName: 'BIT-57 Inter-Collegiate Premier Championship',
    roundName: 'Quarter-Final 2',
    roundIndex: 1,
    matchNumber: 2,
    homeTeamId: 'team-4',
    homeTeamName: 'Metro Rovers',
    homeTeamLogo: footballTeams[3].logoUrl,
    awayTeamId: 'team-5',
    awayTeamName: 'Phoenix Academy',
    awayTeamLogo: footballTeams[4].logoUrl,
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
    events: [],
    scoreUpdates: [],
    playerParticipations: [],
    refereeReportSubmitted: true,
    version: 3,
    nextMatchId: 'match-sf-1',
    nextMatchSlot: 'away'
  },
  {
    id: 'match-qf-3',
    tournamentId: 'tour-1',
    tournamentName: 'BIT-57 Inter-Collegiate Premier Championship',
    roundName: 'Quarter-Final 3',
    roundIndex: 1,
    matchNumber: 3,
    homeTeamId: 'team-2',
    homeTeamName: 'Apex Strikers',
    homeTeamLogo: footballTeams[1].logoUrl,
    awayTeamId: 'team-7',
    awayTeamName: 'Cobalt Wolves',
    awayTeamLogo: footballTeams[6].logoUrl,
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
    events: [],
    scoreUpdates: [],
    playerParticipations: [],
    refereeReportSubmitted: true,
    version: 4,
    nextMatchId: 'match-sf-2',
    nextMatchSlot: 'home'
  },
  {
    id: 'match-qf-4',
    tournamentId: 'tour-1',
    tournamentName: 'BIT-57 Inter-Collegiate Premier Championship',
    roundName: 'Quarter-Final 4',
    roundIndex: 1,
    matchNumber: 4,
    homeTeamId: 'team-3',
    homeTeamName: 'Horizon United',
    homeTeamLogo: footballTeams[2].logoUrl,
    awayTeamId: 'team-6',
    awayTeamName: 'Vanguard Elite',
    awayTeamLogo: footballTeams[5].logoUrl,
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
  {
    id: 'match-sf-1',
    tournamentId: 'tour-1',
    tournamentName: 'BIT-57 Inter-Collegiate Premier Championship',
    roundName: 'Semi-Final 1',
    roundIndex: 2,
    matchNumber: 5,
    homeTeamId: 'team-1',
    homeTeamName: 'Titan FC',
    homeTeamLogo: footballTeams[0].logoUrl,
    awayTeamId: 'team-4',
    awayTeamName: 'Metro Rovers',
    awayTeamLogo: footballTeams[3].logoUrl,
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
    events: [],
    scoreUpdates: [],
    playerParticipations: [],
    refereeReportSubmitted: false,
    version: 4,
    nextMatchId: 'match-fn-1',
    nextMatchSlot: 'home'
  },
  {
    id: 'match-sf-2',
    tournamentId: 'tour-1',
    tournamentName: 'BIT-57 Inter-Collegiate Premier Championship',
    roundName: 'Semi-Final 2',
    roundIndex: 2,
    matchNumber: 6,
    homeTeamId: 'team-2',
    homeTeamName: 'Apex Strikers',
    homeTeamLogo: footballTeams[1].logoUrl,
    awayTeamId: 'team-3',
    awayTeamName: 'Horizon United',
    awayTeamLogo: footballTeams[2].logoUrl,
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
  {
    id: 'match-fn-1',
    tournamentId: 'tour-1',
    tournamentName: 'BIT-57 Inter-Collegiate Premier Championship',
    roundName: 'Championship Final',
    roundIndex: 3,
    matchNumber: 7,
    homeTeamId: '',
    homeTeamName: 'Winner SF 1',
    homeTeamLogo: footballTeams[0].logoUrl,
    awayTeamId: '',
    awayTeamName: 'Winner SF 2',
    awayTeamLogo: footballTeams[1].logoUrl,
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

const basketballMatches = [
  {
    id: 'match-b-qf-1',
    tournamentId: 'tour-2',
    tournamentName: 'BIT-57 Collegiate Basketball Invitational',
    roundName: 'Quarter-Final 1',
    roundIndex: 1,
    matchNumber: 1,
    homeTeamId: 'team-b1',
    homeTeamName: 'Cyber Knights',
    homeTeamLogo: basketballTeams[0].logoUrl,
    awayTeamId: 'team-b8',
    awayTeamName: 'Crimson Hawks',
    awayTeamLogo: basketballTeams[7].logoUrl,
    homeScore: 84,
    awayScore: 76,
    date: '2026-10-02',
    time: '14:00',
    venue: 'Metropolitan Arena Court 1',
    refereeId: 'usr-ref-2',
    refereeName: 'Derrick Reynolds',
    status: 'COMPLETED',
    currentMinute: 40,
    period: 'Full-Time',
    winnerTeamId: 'team-b1',
    events: [
      {
        id: 'ev-b-1',
        matchId: 'match-b-qf-1',
        minute: 10,
        timestamp: '2026-10-02T14:10:00Z',
        type: 'POINT',
        teamId: 'team-b1',
        teamName: 'Cyber Knights',
        playerId: 'ply-b-1-1',
        playerName: 'Aiden Sterling',
        detail: '3-point jumper from beyond the arc',
        addedBy: 'Derrick Reynolds'
      }
    ],
    scoreUpdates: [],
    playerParticipations: [],
    refereeReportSubmitted: true,
    refereeNotes: 'Fast paced quarter final. Cyber Knights controlled the perimeter.',
    version: 5,
    nextMatchId: 'match-b-sf-1',
    nextMatchSlot: 'home'
  },
  {
    id: 'match-b-qf-2',
    tournamentId: 'tour-2',
    tournamentName: 'BIT-57 Collegiate Basketball Invitational',
    roundName: 'Quarter-Final 2',
    roundIndex: 1,
    matchNumber: 2,
    homeTeamId: 'team-b4',
    homeTeamName: 'Ironclad Titans',
    homeTeamLogo: basketballTeams[3].logoUrl,
    awayTeamId: 'team-b5',
    awayTeamName: 'Nebula Wolves',
    awayTeamLogo: basketballTeams[4].logoUrl,
    homeScore: 79,
    awayScore: 71,
    date: '2026-10-02',
    time: '16:30',
    venue: 'Metropolitan Arena Court 1',
    refereeId: 'usr-ref-2',
    refereeName: 'Derrick Reynolds',
    status: 'COMPLETED',
    currentMinute: 40,
    period: 'Full-Time',
    winnerTeamId: 'team-b4',
    events: [],
    scoreUpdates: [],
    playerParticipations: [],
    refereeReportSubmitted: true,
    version: 3,
    nextMatchId: 'match-b-sf-1',
    nextMatchSlot: 'away'
  },
  {
    id: 'match-b-qf-3',
    tournamentId: 'tour-2',
    tournamentName: 'BIT-57 Collegiate Basketball Invitational',
    roundName: 'Quarter-Final 3',
    roundIndex: 1,
    matchNumber: 3,
    homeTeamId: 'team-b2',
    homeTeamName: 'Solar Falcons',
    homeTeamLogo: basketballTeams[1].logoUrl,
    awayTeamId: 'team-b7',
    awayTeamName: 'Apex Ballers',
    awayTeamLogo: basketballTeams[6].logoUrl,
    homeScore: 92,
    awayScore: 88,
    date: '2026-10-03',
    time: '13:00',
    venue: 'Solar Dome Arena',
    refereeId: 'usr-ref-2',
    refereeName: 'Derrick Reynolds',
    status: 'COMPLETED',
    currentMinute: 40,
    period: 'Full-Time',
    winnerTeamId: 'team-b2',
    events: [],
    scoreUpdates: [],
    playerParticipations: [],
    refereeReportSubmitted: true,
    version: 4,
    nextMatchId: 'match-b-sf-2',
    nextMatchSlot: 'home'
  },
  {
    id: 'match-b-qf-4',
    tournamentId: 'tour-2',
    tournamentName: 'BIT-57 Collegiate Basketball Invitational',
    roundName: 'Quarter-Final 4',
    roundIndex: 1,
    matchNumber: 4,
    homeTeamId: 'team-b3',
    homeTeamName: 'Quantum Vipers',
    homeTeamLogo: basketballTeams[2].logoUrl,
    awayTeamId: 'team-b6',
    awayTeamName: 'Zenith Storm',
    awayTeamLogo: basketballTeams[5].logoUrl,
    homeScore: 81,
    awayScore: 74,
    date: '2026-10-03',
    time: '15:30',
    venue: 'Viper Pavilion',
    refereeId: 'usr-ref-2',
    refereeName: 'Derrick Reynolds',
    status: 'COMPLETED',
    currentMinute: 40,
    period: 'Full-Time',
    winnerTeamId: 'team-b3',
    events: [],
    scoreUpdates: [],
    playerParticipations: [],
    refereeReportSubmitted: true,
    version: 3,
    nextMatchId: 'match-b-sf-2',
    nextMatchSlot: 'away'
  },
  {
    id: 'match-b-sf-1',
    tournamentId: 'tour-2',
    tournamentName: 'BIT-57 Collegiate Basketball Invitational',
    roundName: 'Semi-Final 1',
    roundIndex: 2,
    matchNumber: 5,
    homeTeamId: 'team-b1',
    homeTeamName: 'Cyber Knights',
    homeTeamLogo: basketballTeams[0].logoUrl,
    awayTeamId: 'team-b4',
    awayTeamName: 'Ironclad Titans',
    awayTeamLogo: basketballTeams[3].logoUrl,
    homeScore: 68,
    awayScore: 65,
    date: '2026-10-05',
    time: '15:00',
    venue: 'Metropolitan Arena Court 1',
    refereeId: 'usr-ref-2',
    refereeName: 'Derrick Reynolds',
    status: 'LIVE',
    currentMinute: 32,
    period: '3rd Quarter',
    events: [
      {
        id: 'ev-b-sf1-1',
        matchId: 'match-b-sf-1',
        minute: 28,
        timestamp: '2026-10-05T15:28:00Z',
        type: 'POINT',
        teamId: 'team-b1',
        teamName: 'Cyber Knights',
        playerId: 'ply-b-1-1',
        playerName: 'Aiden Sterling',
        detail: 'Fast-break slam dunk',
        addedBy: 'Derrick Reynolds'
      }
    ],
    scoreUpdates: [],
    playerParticipations: [],
    refereeReportSubmitted: false,
    version: 3,
    nextMatchId: 'match-b-fn-1',
    nextMatchSlot: 'home'
  },
  {
    id: 'match-b-sf-2',
    tournamentId: 'tour-2',
    tournamentName: 'BIT-57 Collegiate Basketball Invitational',
    roundName: 'Semi-Final 2',
    roundIndex: 2,
    matchNumber: 6,
    homeTeamId: 'team-b2',
    homeTeamName: 'Solar Falcons',
    homeTeamLogo: basketballTeams[1].logoUrl,
    awayTeamId: 'team-b3',
    awayTeamName: 'Quantum Vipers',
    awayTeamLogo: basketballTeams[2].logoUrl,
    homeScore: 0,
    awayScore: 0,
    date: '2026-10-06',
    time: '17:00',
    venue: 'Solar Dome Arena',
    refereeId: 'usr-ref-2',
    refereeName: 'Derrick Reynolds',
    status: 'SCHEDULED',
    currentMinute: 0,
    period: 'Pre-Match',
    events: [],
    scoreUpdates: [],
    playerParticipations: [],
    version: 1,
    nextMatchId: 'match-b-fn-1',
    nextMatchSlot: 'away'
  },
  {
    id: 'match-b-fn-1',
    tournamentId: 'tour-2',
    tournamentName: 'BIT-57 Collegiate Basketball Invitational',
    roundName: 'Championship Final',
    roundIndex: 3,
    matchNumber: 7,
    homeTeamId: '',
    homeTeamName: 'Winner SF 1',
    homeTeamLogo: basketballTeams[0].logoUrl,
    awayTeamId: '',
    awayTeamName: 'Winner SF 2',
    awayTeamLogo: basketballTeams[1].logoUrl,
    homeScore: 0,
    awayScore: 0,
    date: '2026-10-10',
    time: '19:00',
    venue: 'Metropolitan Arena Court 1',
    refereeId: 'usr-ref-2',
    refereeName: 'Derrick Reynolds',
    status: 'SCHEDULED',
    currentMinute: 0,
    period: 'Pre-Match',
    events: [],
    scoreUpdates: [],
    playerParticipations: [],
    version: 1
  }
];

const allMatches = [...footballMatches, ...basketballMatches];

// ------------------------------------------------------------------------------
// 6. System Alerts
// ------------------------------------------------------------------------------
const alerts = [
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
  },
  {
    id: 'alt-5',
    type: 'MATCH_STARTING_SOON',
    title: 'Basketball Semi-Final 1 Live Now',
    message: 'Cyber Knights vs Ironclad Titans is currently LIVE in 3rd Quarter at Metropolitan Arena Court 1.',
    severity: 'info',
    timestamp: '2026-10-05T15:00:00Z',
    read: false,
    linkTo: '/fixtures',
    entityId: 'match-b-sf-1'
  },
  {
    id: 'alt-6',
    type: 'ELIGIBILITY_PENDING',
    title: 'Basketball Eligibility Review: Cyber Knights',
    message: 'Cyber Knights submitted registration documentation for freshman roster. Dean clearance pending.',
    severity: 'warning',
    timestamp: '2026-10-02T09:00:00Z',
    read: false,
    linkTo: '/documents',
    entityId: 'ply-b-1-9'
  }
];

// ------------------------------------------------------------------------------
// 7. Audit Logs
// ------------------------------------------------------------------------------
const auditLogs = [
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
  },
  {
    id: 'log-6',
    timestamp: '2026-10-01T10:00:00Z',
    userId: 'usr-admin-1',
    userName: 'Prof. David Vance',
    userRole: 'ADMIN',
    action: 'CREATE_TOURNAMENT',
    entityType: 'TOURNAMENT',
    entityId: 'tour-2',
    newValue: 'BIT-57 Collegiate Basketball Invitational (8 Teams)',
    notes: 'Initialized synthetic basketball tournament bracket'
  }
];

// ------------------------------------------------------------------------------
// Top-Level Seed Output Payload
// ------------------------------------------------------------------------------
const seedData = {
  version: '1.0.0',
  generatedAt: '2026-09-20T00:00:00.000Z',
  generator: 'scripts/generate-seed-data.js',
  seed: SEED_VALUE,
  isSynthetic: true,
  note: 'All data in this seed file is completely synthetic and generated for demonstration/testing. All person names, contact emails, phone numbers, and athletic records are fictional.',
  users,
  tournaments,
  teams: allTeams,
  players: allPlayers,
  matches: allMatches,
  alerts,
  auditLogs
};

// Write output to data/seed-v1.json
const outputDir = path.resolve(__dirname, '../data');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const outputPath = path.resolve(outputDir, 'seed-v1.json');
fs.writeFileSync(outputPath, JSON.stringify(seedData, null, 2), 'utf8');

console.log('================================================================');
console.log(' ✅ ArenaSync Synthetic Seed Data Generated Successfully');
console.log(` 📁 Destination: ${outputPath}`);
console.log(` 🏆 Tournaments: ${tournaments.length} (Football + Basketball)`);
console.log(` 🛡️  Teams:       ${allTeams.length} (8 Football + 8 Basketball)`);
console.log(` 👤 Players:     ${allPlayers.length} (11 Football + 80 Basketball)`);
console.log(` ⚽ Fixtures:    ${allMatches.length} (7 Football + 7 Basketball matches)`);
console.log(` 🎲 PRNG Seed:   ${SEED_VALUE} (Deterministic output)`);
console.log('================================================================\n');
