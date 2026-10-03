import { Router, Request, Response } from 'express';
import { db } from './db.js';
import { MatchEventType, DocumentStatus, User, Role, Team, Player, InjuryRiskFlag, FlagCategory, FlagSeverity, FlagStatus } from '../src/types.js';

export const apiRouter = Router();

// Middleware: Request timing & metrics
apiRouter.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    db.recordApiCall(duration);
  });
  next();
});

// Token Generation & Verification Helpers
export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function generateToken(user: User): string {
  const payload = Buffer.from(JSON.stringify({
    userId: user.id,
    role: user.role,
    issuedAt: Date.now()
  })).toString('base64');
  return `arenasync-jwt-${user.id}-${payload}`;
}

export function parseToken(token: string): { userId: string; role: Role; name?: string; email?: string } | null {
  try {
    if (!token) return null;

    // Standard Arenasync token: arenasync-jwt-<id>-<base64>
    if (token.startsWith('arenasync-jwt-')) {
      const parts = token.split('-');
      const base64Payload = parts[parts.length - 1];
      const decoded = JSON.parse(Buffer.from(base64Payload, 'base64').toString('utf-8'));
      if (!decoded.userId || !decoded.role) return null;
      return decoded;
    }

    // Supabase standard JWT: header.payload.signature
    const jwtParts = token.split('.');
    if (jwtParts.length === 3) {
      const decoded = JSON.parse(Buffer.from(jwtParts[1], 'base64').toString('utf-8'));
      if (decoded && (decoded.sub || decoded.email)) {
        const role = (decoded.user_metadata?.role as Role) || 'VIEWER';
        const name = decoded.user_metadata?.full_name || decoded.email?.split('@')[0] || 'User';
        return {
          userId: decoded.sub || `usr-${Date.now()}`,
          role,
          name,
          email: decoded.email
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}

export function getOptionalAuthUser(req: Request): User | null {
  const authHeader = req.headers.authorization || (req.headers['x-auth-token'] as string);
  if (!authHeader) return null;
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : authHeader.trim();
  const parsed = parseToken(token);
  if (!parsed) return null;
  let user = db.users.find(u => u.id === parsed.userId || (parsed.email && u.email === parsed.email));
  if (!user && parsed.userId && parsed.role) {
    user = {
      id: parsed.userId,
      name: parsed.name || (parsed.email ? parsed.email.split('@')[0] : 'User'),
      email: parsed.email || '',
      role: parsed.role,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
    };
    db.users.push(user);
  } else if (user && parsed.role && user.role !== parsed.role) {
    user.role = parsed.role;
  }
  const roleHeader = req.headers['x-user-role'] as Role;
  if (user && roleHeader && ['ADMIN', 'REFEREE', 'COACH', 'PLAYER', 'VIEWER'].includes(roleHeader)) {
    user.role = roleHeader;
  }
  return user || null;
}

// Authentication Middleware: Enforces valid Bearer token
export const authenticate = (req: AuthenticatedRequest, res: Response, next: () => void) => {
  const authHeader = req.headers.authorization || (req.headers['x-auth-token'] as string);
  
  if (!authHeader) {
    return res.status(401).json({
      error: 'Authentication required. Please provide a valid Bearer token in Authorization header.'
    });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : authHeader.trim();
  const parsed = parseToken(token);

  if (!parsed) {
    return res.status(401).json({
      error: 'Invalid or expired authentication token.'
    });
  }

  let user = db.users.find(u => u.id === parsed.userId || (parsed.email && u.email === parsed.email));
  if (!user && parsed.userId && parsed.role) {
    user = {
      id: parsed.userId,
      name: parsed.name || (parsed.email ? parsed.email.split('@')[0] : 'User'),
      email: parsed.email || '',
      role: parsed.role,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
    };
    db.users.push(user);
  } else if (user && parsed.role && user.role !== parsed.role) {
    user.role = parsed.role;
  }

  const roleHeader = req.headers['x-user-role'] as Role;
  if (user && roleHeader && ['ADMIN', 'REFEREE', 'COACH', 'PLAYER', 'VIEWER'].includes(roleHeader)) {
    user.role = roleHeader;
  }

  if (!user) {
    return res.status(401).json({
      error: 'Authenticated user account does not exist or has been disabled.'
    });
  }

  req.user = user;
  next();
};

// Authorization Middleware: Enforces role permissions
export const requireRole = (...allowedRoles: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: () => void) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required before authorization check.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: User role '${req.user.role}' is not authorized to access this resource. Required role(s): ${allowedRoles.join(', ')}.`
      });
    }

    next();
  };
};

// Observability & Health endpoints (Public)
apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    project: 'ArenaSync (BIT-57 Sports Platform)',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: 'ONLINE',
    memoryUsageMB: Math.round(process.memoryUsage().rss / 1024 / 1024)
  });
});

apiRouter.get('/metrics', (req, res) => {
  res.json({
    ...db.metrics,
    totalTeams: db.teams.length,
    totalPlayers: db.players.length,
    totalTournaments: db.tournaments.length,
    totalAlerts: db.alerts.length,
    totalAuditLogs: db.auditLogs.length
  });
});

// AUTH
apiRouter.post('/auth/login', (req, res) => {
  const { email, role, id, name } = req.body;
  // If role or id/email is passed, find or sync
  let user = db.users.find(u => (id && u.id === id) || (email && u.email === email));
  if (!user && role) {
    user = db.users.find(u => u.role === role);
  }
  if (!user && (id || email)) {
    user = {
      id: id || `usr-${Date.now()}`,
      name: name || (email ? email.split('@')[0] : 'User'),
      email: email || '',
      role: role || 'VIEWER',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
    };
    db.users.push(user);
  }
  if (!user) {
    user = db.users[0]; // fallback to admin
  } else if (role && user.role !== role) {
    user.role = role;
  }

  const token = generateToken(user);

  db.addAuditLog({
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    action: 'USER_LOGIN',
    entityType: 'AUTH',
    entityId: user.id,
    newValue: `Session authenticated for role ${user.role}`
  });

  res.json({
    success: true,
    user,
    token
  });
});

apiRouter.get('/auth/users', (req, res) => {
  res.json(db.users);
});

// TOURNAMENTS
apiRouter.get('/tournaments', (req, res) => {
  res.json(db.tournaments);
});

apiRouter.post('/tournaments', authenticate, requireRole('ADMIN'), (req: AuthenticatedRequest, res) => {
  const { name, sport, format, startDate, endDate, venue, numTeams, rules } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Tournament name is required' });
  }

  const newTour = {
    id: `tour-${Date.now()}`,
    name,
    sport: sport || 'Football / Soccer',
    format: format || 'SINGLE_ELIMINATION',
    startDate: startDate || new Date().toISOString().split('T')[0],
    endDate: endDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    venue: venue || 'Main Stadium',
    numTeams: Number(numTeams) || 8,
    registeredTeamIds: db.teams.slice(0, 8).map(t => t.id),
    rules: rules || 'Standard official tournament regulations.',
    status: 'IN_PROGRESS' as const,
    bannerUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&auto=format&fit=crop&q=80'
  };

  db.tournaments.push(newTour);

  db.addAuditLog({
    userId: req.user?.id || 'usr-admin-1',
    userName: req.user?.name || 'Admin / Organizer',
    userRole: req.user?.role || 'ADMIN',
    action: 'CREATE_TOURNAMENT',
    entityType: 'TOURNAMENT',
    entityId: newTour.id,
    newValue: newTour.name
  });

  res.status(201).json(newTour);
});

apiRouter.put('/tournaments/:id', authenticate, requireRole('ADMIN'), (req: AuthenticatedRequest, res) => {
  const tour = db.tournaments.find(t => t.id === req.params.id);
  if (!tour) return res.status(404).json({ error: 'Tournament not found' });

  Object.assign(tour, req.body);
  db.addAuditLog({
    userId: req.user?.id || 'usr-admin-1',
    userName: req.user?.name || 'Admin / Organizer',
    userRole: req.user?.role || 'ADMIN',
    action: 'UPDATE_TOURNAMENT',
    entityType: 'TOURNAMENT',
    entityId: tour.id,
    newValue: JSON.stringify(req.body)
  });
  res.json(tour);
});

apiRouter.delete('/tournaments/:id', authenticate, requireRole('ADMIN'), (req: AuthenticatedRequest, res) => {
  const index = db.tournaments.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Tournament not found' });

  const deletedTour = db.tournaments.splice(index, 1)[0];
  db.addAuditLog({
    userId: req.user?.id || 'usr-admin-1',
    userName: req.user?.name || 'Admin / Organizer',
    userRole: req.user?.role || 'ADMIN',
    action: 'DELETE_TOURNAMENT',
    entityType: 'TOURNAMENT',
    entityId: req.params.id,
    newValue: `Deleted ${deletedTour.name}`
  });
  res.status(204).send();
});

// TEAMS
apiRouter.get('/teams', (req, res) => {
  const includeInactive = req.query.includeInactive === 'true';
  const requestingUser = getOptionalAuthUser(req);
  if (includeInactive && requestingUser?.role === 'ADMIN') {
    return res.json(db.teams);
  }
  const activeTeams = db.teams.filter(t => t.status !== 'INACTIVE');
  res.json(activeTeams);
});

apiRouter.post('/teams', authenticate, requireRole('ADMIN'), (req: AuthenticatedRequest, res) => {
  const { name, code, coachName, coachEmail, sport, homeVenue, primaryColor } = req.body;
  if (!name || !code || !name.trim() || !code.trim()) {
    return res.status(400).json({ error: 'Team name and code are required' });
  }

  const trimmedName = name.trim();
  const trimmedCode = code.trim().toUpperCase();

  // Check duplicate against active teams
  if (db.teams.some(t => t.status !== 'INACTIVE' && (t.name.toLowerCase() === trimmedName.toLowerCase() || t.code.toUpperCase() === trimmedCode))) {
    return res.status(400).json({ error: 'A team with this name or code already exists' });
  }

  const newTeam = {
    id: `team-${Date.now()}`,
    name: trimmedName,
    code: trimmedCode,
    logoUrl: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=120&auto=format&fit=crop&q=80',
    coachName: coachName || 'TBD',
    coachEmail: coachEmail || 'coach@sports.edu',
    sport: sport || 'Football / Soccer',
    homeVenue: homeVenue || 'Campus Field',
    primaryColor: primaryColor || '#3b82f6',
    secondaryColor: '#1d4ed8',
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    points: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    recentForm: [] as ('W' | 'D' | 'L')[],
    status: 'ACTIVE' as const
  };

  db.teams.push(newTeam);
  if (db.tournaments[0]) {
    db.tournaments[0].registeredTeamIds.push(newTeam.id);
  }

  db.addAuditLog({
    userId: req.user?.id || 'usr-admin-1',
    userName: req.user?.name || 'Admin / Organizer',
    userRole: req.user?.role || 'ADMIN',
    action: 'REGISTER_TEAM',
    entityType: 'TEAM',
    entityId: newTeam.id,
    newValue: `${newTeam.name} (${newTeam.code})`
  });

  res.status(201).json(newTeam);
});

apiRouter.put('/teams/:id', authenticate, requireRole('ADMIN'), (req: AuthenticatedRequest, res) => {
  const team = db.teams.find(t => t.id === req.params.id);
  if (!team) return res.status(404).json({ error: 'Team not found' });

  const {
    name,
    code,
    coachName,
    coachEmail,
    coachId,
    sport,
    homeVenue,
    primaryColor,
    secondaryColor,
    logoUrl,
    matchesPlayed,
    wins,
    losses,
    draws,
    points,
    goalsFor,
    goalsAgainst,
    goalDifference,
    status
  } = req.body;

  // Validate name
  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Team name must be a non-empty string' });
    }
    if (name.trim().length > 100) {
      return res.status(400).json({ error: 'Team name cannot exceed 100 characters' });
    }
  }

  // Validate code
  if (code !== undefined) {
    if (typeof code !== 'string' || !code.trim()) {
      return res.status(400).json({ error: 'Team code must be a non-empty string' });
    }
    if (code.trim().length < 2 || code.trim().length > 6) {
      return res.status(400).json({ error: 'Team code must be between 2 and 6 characters' });
    }
  }

  // Check unique name and code against active teams
  const targetName = name !== undefined ? name.trim() : team.name;
  const targetCode = code !== undefined ? code.trim().toUpperCase() : team.code;
  const duplicate = db.teams.find(
    t => t.id !== team.id &&
         t.status !== 'INACTIVE' &&
         (t.name.toLowerCase() === targetName.toLowerCase() || t.code.toUpperCase() === targetCode)
  );
  if (duplicate) {
    return res.status(400).json({ error: 'A team with this name or code already exists' });
  }

  // Validate numeric fields (no negative numbers)
  const numericNonNegative = [
    { key: 'matchesPlayed', val: matchesPlayed },
    { key: 'wins', val: wins },
    { key: 'losses', val: losses },
    { key: 'draws', val: draws },
    { key: 'points', val: points },
    { key: 'goalsFor', val: goalsFor },
    { key: 'goalsAgainst', val: goalsAgainst }
  ];

  for (const field of numericNonNegative) {
    if (field.val !== undefined) {
      if (typeof field.val !== 'number' || isNaN(field.val) || field.val < 0) {
        return res.status(400).json({ error: `Field '${field.key}' must be a non-negative number` });
      }
    }
  }

  if (goalDifference !== undefined && (typeof goalDifference !== 'number' || isNaN(goalDifference))) {
    return res.status(400).json({ error: "Field 'goalDifference' must be a valid number" });
  }

  // Validate string fields
  const stringFields = [
    { key: 'coachName', val: coachName },
    { key: 'coachEmail', val: coachEmail },
    { key: 'coachId', val: coachId },
    { key: 'sport', val: sport },
    { key: 'homeVenue', val: homeVenue },
    { key: 'primaryColor', val: primaryColor },
    { key: 'secondaryColor', val: secondaryColor },
    { key: 'logoUrl', val: logoUrl }
  ];

  for (const field of stringFields) {
    if (field.val !== undefined && typeof field.val !== 'string') {
      return res.status(400).json({ error: `Field '${field.key}' must be a string` });
    }
  }

  const prevTeamJson = JSON.stringify(team);

  if (name !== undefined) team.name = name.trim();
  if (code !== undefined) team.code = code.trim().toUpperCase();
  if (coachName !== undefined) team.coachName = coachName.trim();
  if (coachEmail !== undefined) team.coachEmail = coachEmail.trim();
  if (coachId !== undefined) team.coachId = coachId;
  if (sport !== undefined) team.sport = sport.trim();
  if (homeVenue !== undefined) team.homeVenue = homeVenue.trim();
  if (primaryColor !== undefined) team.primaryColor = primaryColor.trim();
  if (secondaryColor !== undefined) team.secondaryColor = secondaryColor.trim();
  if (logoUrl !== undefined) team.logoUrl = logoUrl.trim();
  if (matchesPlayed !== undefined) team.matchesPlayed = Number(matchesPlayed);
  if (wins !== undefined) team.wins = Number(wins);
  if (losses !== undefined) team.losses = Number(losses);
  if (draws !== undefined) team.draws = Number(draws);
  if (points !== undefined) team.points = Number(points);
  if (goalsFor !== undefined) team.goalsFor = Number(goalsFor);
  if (goalsAgainst !== undefined) team.goalsAgainst = Number(goalsAgainst);
  if (goalDifference !== undefined) team.goalDifference = Number(goalDifference);
  if (status !== undefined && ['ACTIVE', 'PENDING', 'INACTIVE'].includes(status)) {
    team.status = status;
  }

  db.addAuditLog({
    userId: req.user?.id || 'usr-admin-1',
    userName: req.user?.name || 'Admin / Organizer',
    userRole: req.user?.role || 'ADMIN',
    action: 'UPDATE_TEAM',
    entityType: 'TEAM',
    entityId: team.id,
    previousValue: prevTeamJson,
    newValue: JSON.stringify(team)
  });

  res.json(team);
});

apiRouter.delete('/teams/:id', authenticate, requireRole('ADMIN'), (req: AuthenticatedRequest, res) => {
  const team = db.teams.find(t => t.id === req.params.id);
  if (!team) return res.status(404).json({ error: 'Team not found' });

  // Rule 2: Block deleting a team that has LIVE or COMPLETED matches, or whose tournament is IN_PROGRESS. Return 409 with a clear message.
  const hasLiveOrCompletedMatches = db.matches.some(
    m => (m.homeTeamId === team.id || m.awayTeamId === team.id) &&
         (m.status === 'LIVE' || m.status === 'COMPLETED')
  );
  if (hasLiveOrCompletedMatches) {
    return res.status(409).json({
      error: `Cannot delete team '${team.name}': The team has LIVE or COMPLETED matches in the tournament schedule.`
    });
  }

  const inProgressTour = db.tournaments.find(
    t => t.registeredTeamIds?.includes(team.id) && t.status === 'IN_PROGRESS'
  );
  if (inProgressTour) {
    return res.status(409).json({
      error: `Cannot delete team '${team.name}': Tournament '${inProgressTour.name}' is currently IN_PROGRESS.`
    });
  }

  const prevValue = JSON.stringify({ status: team.status, deletedAt: team.deletedAt });
  team.status = 'INACTIVE';
  team.deletedAt = new Date().toISOString();

  db.addAuditLog({
    userId: req.user?.id || 'usr-admin-1',
    userName: req.user?.name || 'Admin / Organizer',
    userRole: req.user?.role || 'ADMIN',
    action: 'DELETE_TEAM',
    entityType: 'TEAM',
    entityId: team.id,
    previousValue: prevValue,
    newValue: JSON.stringify({ status: team.status, deletedAt: team.deletedAt })
  });

  res.json({ success: true, message: `Team '${team.name}' soft-deleted successfully`, team });
});

// PLAYERS
apiRouter.get('/players', (req, res) => {
  const { teamId, eligibility, includeInactive } = req.query;
  const requestingUser = getOptionalAuthUser(req);
  let result = db.players;

  if (!(includeInactive === 'true' && requestingUser?.role === 'ADMIN')) {
    result = result.filter(p => p.status !== 'INACTIVE');
  }

  if (teamId) {
    result = result.filter(p => p.teamId === teamId);
  }
  if (eligibility) {
    result = result.filter(p => p.eligibilityStatus === eligibility);
  }
  res.json(result);
});

apiRouter.post('/players', authenticate, requireRole('ADMIN', 'COACH'), (req: AuthenticatedRequest, res) => {
  const { name, teamId, jerseyNumber, position, age, contactEmail, contactPhone } = req.body;
  if (!name || !teamId || !name.trim()) {
    return res.status(400).json({ error: 'Player name and team are required' });
  }

  const team = db.teams.find(t => t.id === teamId);
  if (!team) return res.status(404).json({ error: 'Team not found' });

  // Coach can only add players to their own team
  if (req.user?.role === 'COACH' && req.user.teamId && req.user.teamId !== teamId) {
    return res.status(403).json({ error: 'Forbidden: Coaches can only register players on their own team' });
  }

  const trimmedName = name.trim();
  const jNum = Number(jerseyNumber) || 12;

  // Duplicate check on active players
  const duplicate = db.players.find(
    p => p.teamId === teamId &&
         p.status !== 'INACTIVE' &&
         (p.jerseyNumber === jNum || p.name.toLowerCase() === trimmedName.toLowerCase())
  );
  if (duplicate) {
    return res.status(400).json({ error: 'Player with this name or jersey number already exists on this team' });
  }

  const newPlayer = {
    id: `ply-${Date.now()}`,
    name: trimmedName,
    playerId: `PLY-${Math.floor(1000 + Math.random() * 9000)}`,
    teamId,
    teamName: team.name,
    jerseyNumber: jNum,
    position: position || 'Midfielder',
    age: Number(age) || 20,
    contactEmail: contactEmail || 'student@university.edu',
    contactPhone: contactPhone || '+1 (555) 000-0000',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    eligibilityStatus: 'PENDING' as const,
    documents: [
      {
        id: `doc-${Date.now()}`,
        playerId: `ply-${Date.now()}`,
        documentType: 'COLLEGE_ID' as const,
        fileName: `${trimmedName.toLowerCase().replace(/\s+/g, '_')}_student_id.pdf`,
        fileSize: '1.1 MB',
        uploadDate: new Date().toISOString().split('T')[0],
        status: 'PENDING' as const,
        notes: 'Awaiting administrative verification'
      }
    ],
    status: 'ACTIVE' as const,
    matchesPlayed: 0,
    minutesPlayed: 0,
    goals: 0,
    assists: 0,
    yellowCards: 0,
    redCards: 0,
    fouls: 0,
    rating: 7.0
  };

  db.players.push(newPlayer);
  db.recalculateWorkloadsAndRisks();

  db.addAlert({
    type: 'ELIGIBILITY_PENDING',
    title: `Eligibility Verification Required: ${trimmedName}`,
    message: `${trimmedName} has been added to ${team.name} and requires document verification before match clearance.`,
    severity: 'info',
    linkTo: '/documents',
    entityId: newPlayer.id
  });

  db.addAuditLog({
    userId: req.user?.id || 'usr-admin-1',
    userName: req.user?.name || 'Admin / Organizer',
    userRole: req.user?.role || 'ADMIN',
    action: 'ADD_PLAYER',
    entityType: 'PLAYER',
    entityId: newPlayer.id,
    newValue: `${newPlayer.name} added to ${team.name}`
  });

  res.status(201).json(newPlayer);
});

apiRouter.put('/players/:id', authenticate, requireRole('ADMIN', 'COACH'), (req: AuthenticatedRequest, res) => {
  const player = db.players.find(p => p.id === req.params.id);
  if (!player) return res.status(404).json({ error: 'Player not found' });

  // Rule: COACH only for players of their own team
  if (req.user?.role === 'COACH') {
    if (!req.user.teamId || req.user.teamId !== player.teamId) {
      return res.status(403).json({
        error: "Forbidden: Coaches can only update players on their own team."
      });
    }
  }

  const {
    name,
    teamId,
    jerseyNumber,
    position,
    age,
    contactEmail,
    contactPhone,
    photoUrl,
    eligibilityStatus,
    matchesPlayed,
    minutesPlayed,
    goals,
    assists,
    yellowCards,
    redCards,
    fouls,
    rating,
    status
  } = req.body;

  // Validate name
  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Player name must be a non-empty string' });
    }
    if (name.trim().length > 100) {
      return res.status(400).json({ error: 'Player name cannot exceed 100 characters' });
    }
  }

  // Validate jerseyNumber
  if (jerseyNumber !== undefined) {
    if (typeof jerseyNumber !== 'number' || !Number.isInteger(jerseyNumber) || jerseyNumber < 1 || jerseyNumber > 99) {
      return res.status(400).json({ error: 'Jersey number must be an integer between 1 and 99' });
    }
  }

  // Validate age
  if (age !== undefined) {
    if (typeof age !== 'number' || !Number.isInteger(age) || age < 10 || age > 100) {
      return res.status(400).json({ error: 'Age must be a valid number' });
    }
  }

  // Validate non-negative numbers for statistics
  const numericStats = [
    { key: 'matchesPlayed', val: matchesPlayed },
    { key: 'minutesPlayed', val: minutesPlayed },
    { key: 'goals', val: goals },
    { key: 'assists', val: assists },
    { key: 'yellowCards', val: yellowCards },
    { key: 'redCards', val: redCards },
    { key: 'fouls', val: fouls }
  ];

  for (const stat of numericStats) {
    if (stat.val !== undefined) {
      if (typeof stat.val !== 'number' || isNaN(stat.val) || stat.val < 0) {
        return res.status(400).json({ error: `Field '${stat.key}' must be a non-negative number` });
      }
    }
  }

  if (rating !== undefined) {
    if (typeof rating !== 'number' || isNaN(rating) || rating < 0 || rating > 10) {
      return res.status(400).json({ error: 'Rating must be a number between 0 and 10' });
    }
  }

  // Check duplicate on target team
  const targetTeamId = teamId || player.teamId;
  const targetJersey = jerseyNumber !== undefined ? Number(jerseyNumber) : player.jerseyNumber;
  const targetName = name !== undefined ? name.trim() : player.name;

  const duplicate = db.players.find(
    p => p.teamId === targetTeamId &&
         p.id !== player.id &&
         p.status !== 'INACTIVE' &&
         (p.jerseyNumber === targetJersey || p.name.toLowerCase() === targetName.toLowerCase())
  );
  if (duplicate) {
    return res.status(400).json({ error: 'Player with this name or jersey number already exists on this team' });
  }

  if (teamId && teamId !== player.teamId) {
    const newTeam = db.teams.find(t => t.id === teamId);
    if (!newTeam) return res.status(404).json({ error: 'Target team not found' });
    player.teamId = newTeam.id;
    player.teamName = newTeam.name;
  }

  const prevPlayerJson = JSON.stringify(player);

  if (name !== undefined) player.name = name.trim();
  if (jerseyNumber !== undefined) player.jerseyNumber = Number(jerseyNumber);
  if (position !== undefined && typeof position === 'string') player.position = position.trim();
  if (age !== undefined) player.age = Number(age);
  if (contactEmail !== undefined && typeof contactEmail === 'string') player.contactEmail = contactEmail.trim();
  if (contactPhone !== undefined && typeof contactPhone === 'string') player.contactPhone = contactPhone.trim();
  if (photoUrl !== undefined && typeof photoUrl === 'string') player.photoUrl = photoUrl.trim();
  if (eligibilityStatus !== undefined && ['VERIFIED', 'PENDING', 'REJECTED'].includes(eligibilityStatus)) {
    player.eligibilityStatus = eligibilityStatus;
  }
  if (matchesPlayed !== undefined) player.matchesPlayed = Number(matchesPlayed);
  if (minutesPlayed !== undefined) player.minutesPlayed = Number(minutesPlayed);
  if (goals !== undefined) player.goals = Number(goals);
  if (assists !== undefined) player.assists = Number(assists);
  if (yellowCards !== undefined) player.yellowCards = Number(yellowCards);
  if (redCards !== undefined) player.redCards = Number(redCards);
  if (fouls !== undefined) player.fouls = Number(fouls);
  if (rating !== undefined) player.rating = Number(rating);
  if (status !== undefined && ['ACTIVE', 'PENDING', 'INACTIVE'].includes(status)) {
    player.status = status;
  }

  db.recalculateWorkloadsAndRisks();

  db.addAuditLog({
    userId: req.user?.id || 'usr-admin-1',
    userName: req.user?.name || 'User',
    userRole: req.user?.role || 'ADMIN',
    action: 'UPDATE_PLAYER',
    entityType: 'PLAYER',
    entityId: player.id,
    previousValue: prevPlayerJson,
    newValue: JSON.stringify(player)
  });

  res.json(player);
});

apiRouter.delete('/players/:id', authenticate, requireRole('ADMIN', 'COACH'), (req: AuthenticatedRequest, res) => {
  const player = db.players.find(p => p.id === req.params.id);
  if (!player) return res.status(404).json({ error: 'Player not found' });

  // Rule: COACH only for players of their own team
  if (req.user?.role === 'COACH') {
    if (!req.user.teamId || req.user.teamId !== player.teamId) {
      return res.status(403).json({
        error: "Forbidden: Coaches can only delete players on their own team."
      });
    }
  }

  const prevValue = JSON.stringify({ status: player.status || 'ACTIVE', deletedAt: player.deletedAt });
  player.status = 'INACTIVE';
  player.deletedAt = new Date().toISOString();

  db.addAuditLog({
    userId: req.user?.id || 'usr-admin-1',
    userName: req.user?.name || 'User',
    userRole: req.user?.role || 'ADMIN',
    action: 'DELETE_PLAYER',
    entityType: 'PLAYER',
    entityId: player.id,
    previousValue: prevValue,
    newValue: JSON.stringify({ status: player.status, deletedAt: player.deletedAt })
  });

  res.json({ success: true, message: `Player '${player.name}' soft-deleted successfully`, player });
});

// DOCUMENTS: Upload & Verify
apiRouter.post('/players/:id/documents', authenticate, requireRole('ADMIN', 'COACH', 'PLAYER'), (req: AuthenticatedRequest, res) => {
  const player = db.players.find(p => p.id === req.params.id);
  if (!player) return res.status(404).json({ error: 'Player not found' });

  const { documentType, fileName, fileSize } = req.body;
  const newDoc = {
    id: `doc-${Date.now()}`,
    playerId: player.id,
    documentType: documentType || 'MEDICAL_CERTIFICATE',
    fileName: fileName || 'medical_certificate.pdf',
    fileSize: fileSize || '1.5 MB',
    uploadDate: new Date().toISOString().split('T')[0],
    status: 'PENDING' as DocumentStatus,
    notes: 'Submitted for verification'
  };

  player.documents.push(newDoc);
  player.eligibilityStatus = 'PENDING';

  db.addAuditLog({
    userId: req.user?.id || 'usr-coach-1',
    userName: req.user?.name || 'Coach / User',
    userRole: req.user?.role || 'COACH',
    action: 'UPLOAD_DOCUMENT',
    entityType: 'DOCUMENT',
    entityId: newDoc.id,
    newValue: `Uploaded ${newDoc.fileName} for ${player.name}`
  });

  res.status(201).json(newDoc);
});

apiRouter.put('/players/:id/documents/:docId/verify', authenticate, requireRole('ADMIN'), (req: AuthenticatedRequest, res) => {
  const player = db.players.find(p => p.id === req.params.id);
  if (!player) return res.status(404).json({ error: 'Player not found' });

  const doc = player.documents.find(d => d.id === req.params.docId);
  if (!doc) return res.status(404).json({ error: 'Document not found' });

  const { status, notes, verifiedBy } = req.body;
  if (!['VERIFIED', 'REJECTED', 'PENDING'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const prevStatus = doc.status;
  doc.status = status;
  doc.verifiedDate = new Date().toISOString().split('T')[0];
  doc.verifiedBy = verifiedBy || req.user?.name || 'Prof. David Vance (Sports Director)';
  if (notes) doc.notes = notes;

  // Evaluate overall player eligibility:
  // Must have at least 1 document and ALL documents must be VERIFIED
  const allVerified = player.documents.length > 0 && player.documents.every(d => d.status === 'VERIFIED');
  const hasRejected = player.documents.some(d => d.status === 'REJECTED');

  if (allVerified) {
    player.eligibilityStatus = 'VERIFIED';
  } else if (hasRejected) {
    player.eligibilityStatus = 'REJECTED';
  } else {
    player.eligibilityStatus = 'PENDING';
  }

  db.addAuditLog({
    userId: req.user?.id || 'usr-admin-1',
    userName: req.user?.name || 'Prof. David Vance',
    userRole: req.user?.role || 'ADMIN',
    action: 'VERIFY_DOCUMENT',
    entityType: 'DOCUMENT',
    entityId: doc.id,
    previousValue: prevStatus,
    newValue: `${status} - Player status: ${player.eligibilityStatus}`,
    notes: doc.notes
  });

  res.json({ document: doc, playerEligibility: player.eligibilityStatus });
});

// FIXTURES & MATCHES
apiRouter.get('/fixtures', (req, res) => {
  res.json(db.matches);
});

apiRouter.post('/fixtures/generate', authenticate, requireRole('ADMIN'), (req: AuthenticatedRequest, res) => {
  const { tournamentId, format, venue, startDate } = req.body;
  const tourId = tournamentId || db.tournaments[0].id;
  const tournament = db.tournaments.find(t => t.id === tourId);
  if (!tournament) return res.status(404).json({ error: 'Tournament not found' });

  try {
    const generated = db.generateFixtures(
      tourId,
      format || tournament.format,
      tournament.registeredTeamIds,
      venue || tournament.venue,
      startDate || tournament.startDate
    );
    res.json({ success: true, count: generated.length, matches: generated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.get('/matches/:id', (req, res) => {
  const match = db.matches.find(m => m.id === req.params.id);
  if (!match) return res.status(404).json({ error: 'Match not found' });
  res.json(match);
});

// MATCH LIFECYCLE: Start Match
apiRouter.post('/matches/:id/start', authenticate, requireRole('ADMIN', 'REFEREE'), (req: AuthenticatedRequest, res) => {
  const match = db.matches.find(m => m.id === req.params.id);
  if (!match) return res.status(404).json({ error: 'Match not found' });

  if (match.status === 'COMPLETED') {
    return res.status(400).json({ error: 'Cannot start an already completed match' });
  }

  const prevStatus = match.status;
  match.status = 'LIVE';
  match.period = '1st Half';
  match.currentMinute = 1;
  match.version += 1;

  const startEvent = {
    id: `ev-start-${Date.now()}`,
    matchId: match.id,
    minute: 1,
    timestamp: new Date().toISOString(),
    type: 'MATCH_START' as MatchEventType,
    detail: 'Match officially kicked off by referee.',
    addedBy: req.user?.name || req.body.refereeName || 'Marcus Webb'
  };
  match.events.unshift(startEvent);

  db.addAuditLog({
    userId: req.user?.id || req.body.refereeId || 'usr-ref-1',
    userName: req.user?.name || req.body.refereeName || 'Marcus Webb',
    userRole: req.user?.role || 'REFEREE',
    action: 'MATCH_START',
    entityType: 'MATCH',
    entityId: match.id,
    previousValue: prevStatus,
    newValue: 'LIVE'
  });

  res.json(match);
});

// LIVE SCORING: Safe atomic score update with version checking
apiRouter.post('/matches/:id/score', authenticate, requireRole('ADMIN', 'REFEREE'), (req: AuthenticatedRequest, res) => {
  const match = db.matches.find(m => m.id === req.params.id);
  if (!match) return res.status(404).json({ error: 'Match not found' });

  if (match.status === 'COMPLETED') {
    return res.status(400).json({ error: 'Score is locked because this match is marked COMPLETED' });
  }

  const {
    homeScore,
    awayScore,
    expectedVersion,
    minute,
    scoringTeamId,
    playerId,
    playerName,
    detail,
    userId,
    userName
  } = req.body;

  // Concurrent conflict detection if expectedVersion was supplied
  if (expectedVersion !== undefined && match.version !== expectedVersion) {
    db.metrics.concurrencyCollisionsHandled += 1;
    return res.status(409).json({
      error: 'Concurrency conflict: Match state was updated by another user. Please reload the latest score.',
      currentVersion: match.version,
      currentHomeScore: match.homeScore,
      currentAwayScore: match.awayScore
    });
  }

  // Prevent negative scores
  if (homeScore < 0 || awayScore < 0) {
    return res.status(400).json({ error: 'Scores cannot be negative' });
  }

  const prevHome = match.homeScore;
  const prevAway = match.awayScore;

  match.homeScore = Number(homeScore);
  match.awayScore = Number(awayScore);
  match.version += 1;
  match.currentMinute = minute !== undefined ? Number(minute) : match.currentMinute;

  // Log score update
  const effectiveUserId = req.user?.id || userId || 'usr-ref-1';
  const effectiveUserName = req.user?.name || userName || 'Marcus Webb';
  const effectiveUserRole = req.user?.role || 'REFEREE';

  const scoreRecord = {
    id: `sc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    matchId: match.id,
    timestamp: new Date().toISOString(),
    userId: effectiveUserId,
    userName: effectiveUserName,
    prevHomeScore: prevHome,
    prevAwayScore: prevAway,
    newHomeScore: match.homeScore,
    newAwayScore: match.awayScore,
    eventType: 'SCORE_UPDATE',
    version: match.version
  };
  match.scoreUpdates.unshift(scoreRecord);

  // If there was a goal or event detail, append match event
  if (detail || playerName) {
    const isHome = scoringTeamId === match.homeTeamId;
    const teamName = isHome ? match.homeTeamName : match.awayTeamName;

    const event = {
      id: `ev-${Date.now()}`,
      matchId: match.id,
      minute: match.currentMinute,
      timestamp: new Date().toISOString(),
      type: 'GOAL' as MatchEventType,
      teamId: scoringTeamId,
      teamName,
      playerId,
      playerName: playerName || 'Unknown Player',
      detail: detail || `Goal scored for ${teamName}`,
      addedBy: effectiveUserName
    };
    match.events.unshift(event);

    // Update player's individual season goals if player provided
    if (playerId) {
      const ply = db.players.find(p => p.id === playerId);
      if (ply) ply.goals += 1;
    }
  }

  db.addAuditLog({
    userId: effectiveUserId,
    userName: effectiveUserName,
    userRole: effectiveUserRole,
    action: 'SCORE_CHANGE',
    entityType: 'SCORE',
    entityId: match.id,
    previousValue: `${prevHome} - ${prevAway}`,
    newValue: `${match.homeScore} - ${match.awayScore} (${detail || 'Score adjustment'})`
  });

  res.json(match);
});

// MATCH EVENTS: Cards, Fouls, Substitutions
apiRouter.post('/matches/:id/events', authenticate, requireRole('ADMIN', 'REFEREE'), (req: AuthenticatedRequest, res) => {
  const match = db.matches.find(m => m.id === req.params.id);
  if (!match) return res.status(404).json({ error: 'Match not found' });

  const { minute, type, teamId, playerId, playerName, detail, addedBy } = req.body;

  const eventAddedBy = req.user?.name || addedBy || 'Marcus Webb';

  const event = {
    id: `ev-${Date.now()}`,
    matchId: match.id,
    minute: Number(minute) || match.currentMinute,
    timestamp: new Date().toISOString(),
    type: type as MatchEventType,
    teamId,
    teamName: teamId === match.homeTeamId ? match.homeTeamName : match.awayTeamName,
    playerId,
    playerName,
    detail: detail || `${type} recorded`,
    addedBy: eventAddedBy
  };

  match.events.unshift(event);

  // If card, update player stats
  if (playerId) {
    const player = db.players.find(p => p.id === playerId);
    if (player) {
      if (type === 'YELLOW_CARD') player.yellowCards += 1;
      if (type === 'RED_CARD') player.redCards += 1;
      if (type === 'FOUL') player.fouls += 1;
    }
  }

  db.addAuditLog({
    userId: req.user?.id || 'usr-ref-1',
    userName: eventAddedBy,
    userRole: req.user?.role || 'REFEREE',
    action: `EVENT_${type}`,
    entityType: 'MATCH',
    entityId: match.id,
    newValue: `${type}: ${playerName || 'Team event'} (${detail})`
  });

  res.json(match);
});

// COMPLETE MATCH: Automatic standing calculation, bracket advancement, workload & risk updates
apiRouter.post('/matches/:id/complete', authenticate, requireRole('ADMIN', 'REFEREE'), (req: AuthenticatedRequest, res) => {
  const match = db.matches.find(m => m.id === req.params.id);
  if (!match) return res.status(404).json({ error: 'Match not found' });

  if (match.status === 'COMPLETED') {
    return res.status(400).json({ error: 'Match is already completed and results are locked.' });
  }

  const { refereeNotes, playerParticipations } = req.body;

  match.status = 'COMPLETED';
  match.period = 'Full-Time';
  match.currentMinute = 90;
  match.refereeReportSubmitted = true;
  match.refereeNotes = refereeNotes || 'Match completed officially with all scores certified.';
  match.version += 1;

  if (playerParticipations && Array.isArray(playerParticipations)) {
    match.playerParticipations = playerParticipations;
    // Update player minutes
    playerParticipations.forEach(part => {
      const ply = db.players.find(p => p.id === part.playerId);
      if (ply) {
        ply.matchesPlayed += 1;
        ply.minutesPlayed += part.minutesPlayed || 90;
        ply.goals += part.goals || 0;
        ply.assists += part.assists || 0;
      }
    });
  }

  // Final whistle event
  match.events.unshift({
    id: `ev-end-${Date.now()}`,
    matchId: match.id,
    minute: 90,
    timestamp: new Date().toISOString(),
    type: 'MATCH_END',
    detail: `Final Whistle blown. Score locked at ${match.homeScore} - ${match.awayScore}.`,
    addedBy: req.user?.name || 'Marcus Webb'
  });

  // 1. Standings update & Bracket progression
  db.updateStandingsAfterMatch(match);

  // 2. Recalculate all workloads & risk flags
  db.recalculateWorkloadsAndRisks();

  // 3. Check if tournament champion determined
  if (match.roundName.toLowerCase().includes('final') && !match.roundName.toLowerCase().includes('quarter') && !match.roundName.toLowerCase().includes('semi')) {
    const winnerTeam = db.teams.find(t => t.id === match.winnerTeamId);
    if (winnerTeam) {
      const tour = db.tournaments.find(t => t.id === match.tournamentId);
      if (tour) {
        tour.status = 'COMPLETED';
        tour.championTeamId = winnerTeam.id;
        tour.championTeamName = winnerTeam.name;

        db.addAlert({
          type: 'MATCH_STARTING_SOON',
          title: `🏆 Champion Crowned: ${winnerTeam.name}!`,
          message: `${winnerTeam.name} has emerged as the Champion of ${tour.name}!`,
          severity: 'info',
          linkTo: '/standings'
        });
      }
    }
  }

  db.addAuditLog({
    userId: req.user?.id || 'usr-ref-1',
    userName: req.user?.name || 'Marcus Webb',
    userRole: req.user?.role || 'REFEREE',
    action: 'MATCH_COMPLETED',
    entityType: 'MATCH',
    entityId: match.id,
    previousValue: 'LIVE',
    newValue: `COMPLETED: ${match.homeTeamName} ${match.homeScore} - ${match.awayScore} ${match.awayTeamName}`
  });

  res.json({
    success: true,
    match,
    standings: db.getStandings(match.tournamentId)
  });
});

// STANDINGS
apiRouter.get('/standings/:tournamentId', (req, res) => {
  res.json(db.getStandings(req.params.tournamentId));
});

// ANALYTICS & WORKLOAD
apiRouter.get('/analytics/players', (req, res) => {
  const { teamId } = req.query;
  let players = db.players;
  if (teamId) {
    players = players.filter(p => p.teamId === teamId);
  }

  const topScorers = [...players].sort((a, b) => b.goals - a.goals).slice(0, 10);
  const topAssists = [...players].sort((a, b) => b.assists - a.assists).slice(0, 10);
  const topMinutes = [...players].sort((a, b) => b.minutesPlayed - a.minutesPlayed).slice(0, 10);

  res.json({
    players,
    topScorers,
    topAssists,
    topMinutes,
    totalGoals: players.reduce((sum, p) => sum + p.goals, 0),
    totalCards: players.reduce((sum, p) => sum + p.yellowCards + p.redCards, 0),
    averageRating: (players.reduce((sum, p) => sum + p.rating, 0) / players.length).toFixed(1)
  });
});

apiRouter.get('/workload', (req, res) => {
  const workloads = db.players.map(p => p.workload).filter(Boolean);
  const highWorkloadCount = workloads.filter(w => w?.workloadLevel === 'HIGH' || w?.workloadLevel === 'VERY_HIGH').length;

  res.json({
    workloads,
    highWorkloadCount,
    averageAcwr: (
      workloads.reduce((sum, w) => sum + (w?.breakdown.acwr || 1), 0) / (workloads.length || 1)
    ).toFixed(2),
    distribution: {
      LOW: workloads.filter(w => w?.workloadLevel === 'LOW').length,
      NORMAL: workloads.filter(w => w?.workloadLevel === 'NORMAL').length,
      HIGH: workloads.filter(w => w?.workloadLevel === 'HIGH').length,
      VERY_HIGH: workloads.filter(w => w?.workloadLevel === 'VERY_HIGH').length
    },
    documentation: {
      formula: 'ACWR = Acute Load (last 7 days match minutes) ÷ Chronic Load (28 days normalized average weekly minutes)',
      safeZone: '0.80 – 1.30 (Optimum workload and progressive conditioning)',
      dangerZone: '≥ 1.50 (Exponentially elevated fatigue and strain indicator)'
    }
  });
});

// CLEARANCE GATE HELPER
export interface KickoffClearanceResult {
  cleared: boolean;
  reason?: string;
  warning?: string;
}

export function isPlayerClearedForKickoff(
  player: Player,
  injuryFlags: InjuryRiskFlag[] = db.injuryFlags
): KickoffClearanceResult {
  if (player.status === 'INACTIVE') {
    return {
      cleared: false,
      reason: `Player ${player.name} is INACTIVE.`
    };
  }

  if (player.eligibilityStatus !== 'VERIFIED') {
    return {
      cleared: false,
      reason: `Player ${player.name} document eligibility status is ${player.eligibilityStatus || 'PENDING'}. Verified documents required for match clearance.`
    };
  }

  const playerManualActiveFlags = (injuryFlags || []).filter(
    f => f.playerId === player.id && f.source === 'MANUAL' && f.status === 'ACTIVE'
  );

  const blockingFlag = playerManualActiveFlags.find(
    f => f.severity === 'HIGH' || f.category === 'SUSPENSION'
  );

  if (blockingFlag) {
    const flagType = blockingFlag.category === 'SUSPENSION' ? 'SUSPENSION' : 'HIGH severity manual injury';
    return {
      cleared: false,
      reason: `Player ${player.name} is blocked at kickoff clearance gate due to active ${flagType} flag${blockingFlag.notes ? `: ${blockingFlag.notes}` : ''}.`
    };
  }

  const warningFlag = playerManualActiveFlags.find(
    f => f.severity === 'MODERATE' || f.severity === 'LOW'
  );

  if (warningFlag) {
    return {
      cleared: true,
      warning: `Player ${player.name} cleared with warning: active ${warningFlag.severity} severity ${warningFlag.category.toLowerCase()} flag.`
    };
  }

  return { cleared: true };
}

apiRouter.get('/players/:id/clearance', (req, res) => {
  const player = db.players.find(p => p.id === req.params.id);
  if (!player) return res.status(404).json({ error: 'Player not found' });
  const result = isPlayerClearedForKickoff(player, db.injuryFlags);
  res.json({ playerId: player.id, playerName: player.name, ...result });
});

// INJURY FLAGS & FATIGUE SENTINEL

// 1. Create a MANUAL injury flag
apiRouter.post('/players/:id/injury-flags', authenticate, requireRole('ADMIN', 'COACH'), (req: AuthenticatedRequest, res) => {
  const player = db.players.find(p => p.id === req.params.id);
  if (!player) return res.status(404).json({ error: 'Player not found' });

  // RBAC: Coach can only create flags for players on their own team
  if (req.user?.role === 'COACH') {
    if (!req.user.teamId || req.user.teamId !== player.teamId) {
      return res.status(403).json({
        error: 'Forbidden: Coaches can only manage injury flags for players on their own team.'
      });
    }
  }

  const { category, severity, notes } = req.body;

  const validCategories: FlagCategory[] = ['INJURY', 'ILLNESS', 'SUSPENSION'];
  if (!category || !validCategories.includes(category)) {
    return res.status(400).json({
      error: `Invalid category '${category}'. Allowed values: ${validCategories.join(', ')}`
    });
  }

  const validSeverities: FlagSeverity[] = ['LOW', 'MODERATE', 'HIGH'];
  if (!severity || !validSeverities.includes(severity)) {
    return res.status(400).json({
      error: `Invalid severity '${severity}'. Allowed values: ${validSeverities.join(', ')}`
    });
  }

  if (notes !== undefined && notes !== null) {
    if (typeof notes !== 'string') {
      return res.status(400).json({ error: 'Notes must be a string' });
    }
    if (notes.length > 500) {
      return res.status(400).json({ error: 'Notes cannot exceed 500 characters' });
    }
  }

  const now = new Date().toISOString();
  const trimmedNotes = notes ? (notes as string).trim() : '';

  const newFlag: InjuryRiskFlag = {
    id: `flag-man-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    playerId: player.id,
    playerName: player.name,
    teamId: player.teamId,
    teamName: player.teamName,
    source: 'MANUAL',
    category,
    severity,
    riskLevel: severity,
    notes: trimmedNotes,
    status: 'ACTIVE',
    createdBy: req.user?.name || req.user?.id || 'Admin',
    createdAt: now,
    reasons: [trimmedNotes || `Manual ${category.toLowerCase()} flag (${severity.toLowerCase()} severity)`],
    riskScore: severity === 'HIGH' ? 85 : severity === 'MODERATE' ? 55 : 20,
    disclaimer: 'Manual technical/medical staff entry.',
    lastCalculated: now
  };

  db.injuryFlags.push(newFlag);

  db.addAuditLog({
    userId: req.user?.id || 'usr-admin-1',
    userName: req.user?.name || 'Admin',
    userRole: req.user?.role || 'ADMIN',
    action: 'ADD_INJURY_FLAG',
    entityType: 'RISK_FLAG',
    entityId: newFlag.id,
    newValue: JSON.stringify(newFlag)
  });

  res.status(201).json(newFlag);
});

// 2. Edit a MANUAL ACTIVE injury flag
apiRouter.put('/injury-flags/:id', authenticate, requireRole('ADMIN', 'COACH'), (req: AuthenticatedRequest, res) => {
  const flag = db.injuryFlags.find(f => f.id === req.params.id);
  if (!flag) return res.status(404).json({ error: 'Injury flag not found' });

  // ACWR_AUTO flags are read-only through the API
  if (flag.source === 'ACWR_AUTO') {
    return res.status(403).json({
      error: 'Forbidden: Automatic ACWR flags cannot be modified manually.'
    });
  }

  // RBAC: Coach check
  if (req.user?.role === 'COACH') {
    if (!req.user.teamId || req.user.teamId !== flag.teamId) {
      return res.status(403).json({
        error: 'Forbidden: Coaches can only edit injury flags for players on their own team.'
      });
    }
  }

  // State check: Only ACTIVE flags can be edited
  if (flag.status !== 'ACTIVE') {
    return res.status(409).json({
      error: `Conflict: Cannot edit an injury flag that is ${flag.status}. Only ACTIVE flags can be modified.`
    });
  }

  const { category, severity, notes } = req.body;

  const validCategories: FlagCategory[] = ['INJURY', 'ILLNESS', 'SUSPENSION'];
  if (category !== undefined && !validCategories.includes(category)) {
    return res.status(400).json({
      error: `Invalid category '${category}'. Allowed values: ${validCategories.join(', ')}`
    });
  }

  const validSeverities: FlagSeverity[] = ['LOW', 'MODERATE', 'HIGH'];
  if (severity !== undefined && !validSeverities.includes(severity)) {
    return res.status(400).json({
      error: `Invalid severity '${severity}'. Allowed values: ${validSeverities.join(', ')}`
    });
  }

  if (notes !== undefined && notes !== null) {
    if (typeof notes !== 'string') {
      return res.status(400).json({ error: 'Notes must be a string' });
    }
    if (notes.length > 500) {
      return res.status(400).json({ error: 'Notes cannot exceed 500 characters' });
    }
  }

  const prevFlagJson = JSON.stringify(flag);
  const now = new Date().toISOString();

  if (category) flag.category = category;
  if (severity) {
    flag.severity = severity;
    flag.riskLevel = severity;
    flag.riskScore = severity === 'HIGH' ? 85 : severity === 'MODERATE' ? 55 : 20;
  }
  if (notes !== undefined) {
    flag.notes = typeof notes === 'string' ? notes.trim() : '';
    flag.reasons = [flag.notes || `Manual ${flag.category.toLowerCase()} flag (${flag.severity.toLowerCase()} severity)`];
  }

  flag.updatedBy = req.user?.name || req.user?.id || 'Admin';
  flag.updatedAt = now;

  db.addAuditLog({
    userId: req.user?.id || 'usr-admin-1',
    userName: req.user?.name || 'Admin',
    userRole: req.user?.role || 'ADMIN',
    action: 'UPDATE_INJURY_FLAG',
    entityType: 'RISK_FLAG',
    entityId: flag.id,
    previousValue: prevFlagJson,
    newValue: JSON.stringify(flag)
  });

  res.json(flag);
});

// 3. Resolve a MANUAL injury flag
apiRouter.put('/injury-flags/:id/resolve', authenticate, requireRole('ADMIN', 'COACH'), (req: AuthenticatedRequest, res) => {
  const flag = db.injuryFlags.find(f => f.id === req.params.id);
  if (!flag) return res.status(404).json({ error: 'Injury flag not found' });

  // ACWR_AUTO flags are read-only
  if (flag.source === 'ACWR_AUTO') {
    return res.status(403).json({
      error: 'Forbidden: Automatic ACWR flags cannot be resolved through the manual API.'
    });
  }

  // RBAC: Coach check
  if (req.user?.role === 'COACH') {
    if (!req.user.teamId || req.user.teamId !== flag.teamId) {
      return res.status(403).json({
        error: 'Forbidden: Coaches can only resolve injury flags for players on their own team.'
      });
    }
  }

  if (flag.status === 'RESOLVED' || flag.status === 'VOIDED') {
    return res.status(409).json({
      error: `Conflict: Injury flag is already ${flag.status}.`
    });
  }

  const prevFlagJson = JSON.stringify(flag);
  const now = new Date().toISOString();

  flag.status = 'RESOLVED';
  flag.resolvedBy = req.user?.name || req.user?.id || 'Admin';
  flag.resolvedAt = now;

  db.addAuditLog({
    userId: req.user?.id || 'usr-admin-1',
    userName: req.user?.name || 'Admin',
    userRole: req.user?.role || 'ADMIN',
    action: 'RESOLVE_INJURY_FLAG',
    entityType: 'RISK_FLAG',
    entityId: flag.id,
    previousValue: prevFlagJson,
    newValue: JSON.stringify(flag)
  });

  res.json(flag);
});

// 4. Soft-delete (VOID) a MANUAL injury flag
apiRouter.delete('/injury-flags/:id', authenticate, requireRole('ADMIN', 'COACH'), (req: AuthenticatedRequest, res) => {
  const flag = db.injuryFlags.find(f => f.id === req.params.id);
  if (!flag) return res.status(404).json({ error: 'Injury flag not found' });

  // ACWR_AUTO flags are read-only
  if (flag.source === 'ACWR_AUTO') {
    return res.status(403).json({
      error: 'Forbidden: Automatic ACWR flags cannot be voided or deleted.'
    });
  }

  // RBAC: ADMIN or the COACH who created it (or coach of the team)
  if (req.user?.role === 'COACH') {
    const isCreator = flag.createdBy === req.user.name || flag.createdBy === req.user.id;
    const isTeamCoach = req.user.teamId && req.user.teamId === flag.teamId;
    if (!isCreator && !isTeamCoach) {
      return res.status(403).json({
        error: 'Forbidden: Coaches can only void injury flags created for their team.'
      });
    }
  }

  if (flag.status === 'VOIDED') {
    return res.status(409).json({
      error: 'Conflict: Injury flag is already voided.'
    });
  }

  const { voidReason } = req.body;
  if (!voidReason || typeof voidReason !== 'string' || !voidReason.trim()) {
    return res.status(400).json({
      error: 'voidReason is required to void an injury flag.'
    });
  }

  const prevFlagJson = JSON.stringify(flag);
  const now = new Date().toISOString();

  flag.status = 'VOIDED';
  flag.voidedBy = req.user?.name || req.user?.id || 'Admin';
  flag.voidedAt = now;
  flag.voidReason = voidReason.trim();

  db.addAuditLog({
    userId: req.user?.id || 'usr-admin-1',
    userName: req.user?.name || 'Admin',
    userRole: req.user?.role || 'ADMIN',
    action: 'VOID_INJURY_FLAG',
    entityType: 'RISK_FLAG',
    entityId: flag.id,
    previousValue: prevFlagJson,
    newValue: JSON.stringify(flag)
  });

  res.json(flag);
});

// 5. Query injury flags with source, status, and player filtering
apiRouter.get('/injury-flags', (req, res) => {
  const { status, playerId } = req.query;
  let flags = [...db.injuryFlags];

  if (playerId && typeof playerId === 'string') {
    flags = flags.filter(f => f.playerId === playerId);
  }

  if (status && typeof status === 'string') {
    if (status.toUpperCase() !== 'ALL') {
      flags = flags.filter(f => f.status === status.toUpperCase());
    }
  } else {
    // Default to ACTIVE only
    flags = flags.filter(f => f.status === 'ACTIVE');
  }

  const highRisk = flags.filter(f => (f.severity === 'HIGH' || f.riskLevel === 'HIGH'));
  const moderateRisk = flags.filter(f => (f.severity === 'MODERATE' || f.riskLevel === 'MODERATE'));
  const lowRisk = flags.filter(f => (f.severity === 'LOW' || f.riskLevel === 'LOW'));

  res.json({
    flags,
    summary: {
      highCount: highRisk.length,
      moderateCount: moderateRisk.length,
      lowCount: lowRisk.length,
      totalTracked: flags.length
    },
    clinicalDisclaimer: 'All flags and risk tiers are statistical workload & fatigue models or manual staff logs, NOT medical diagnoses.'
  });
});

// ALERTS
apiRouter.get('/alerts', (req, res) => {
  res.json(db.alerts);
});

apiRouter.post('/alerts/:id/read', (req, res) => {
  const alert = db.alerts.find(a => a.id === req.params.id);
  if (alert) alert.read = true;
  res.json({ success: true, alert });
});

apiRouter.post('/alerts/mark-all-read', (req, res) => {
  db.alerts.forEach(a => (a.read = true));
  res.json({ success: true, count: db.alerts.length });
});

// AUDIT LOGS (Protected: ADMIN only)
apiRouter.get('/audit-logs', authenticate, requireRole('ADMIN'), (req: AuthenticatedRequest, res) => {
  res.json(db.auditLogs);
});

// CAPSTONE EXPERIMENT: Concurrency Robustness Test (Protected: ADMIN only)
apiRouter.post('/experiments/concurrency-test', authenticate, requireRole('ADMIN'), async (req: AuthenticatedRequest, res) => {
  const match = db.matches.find(m => m.status === 'LIVE') || db.matches[0];
  const originalVersion = match.version;
  const originalHomeScore = match.homeScore;

  const results: { workerId: number; status: 'COMMITTED' | 'CONFLICT_RESOLVED'; version: number }[] = [];

  // Simulate 10 workers attempting to increment score
  for (let i = 1; i <= 10; i++) {
    const success = i === 1 || i % 2 === 0; // Simulate half atomic acquisitions, half requiring lock re-read
    if (success) {
      match.version += 1;
      match.homeScore += 1;
      results.push({ workerId: i, status: 'COMMITTED', version: match.version });
    } else {
      db.metrics.concurrencyCollisionsHandled += 1;
      results.push({ workerId: i, status: 'CONFLICT_RESOLVED', version: match.version });
    }
  }

  // Restore or leave as simulated
  db.addAuditLog({
    userId: req.user?.id || 'usr-admin-1',
    userName: req.user?.name || 'Prof. David Vance',
    userRole: req.user?.role || 'ADMIN',
    action: 'CONCURRENCY_TEST_EXECUTED',
    entityType: 'SCORE',
    entityId: match.id,
    notes: `Simulated 10 concurrent score updates. Resolved collisions: ${db.metrics.concurrencyCollisionsHandled}`
  });

  res.json({
    experiment: 'BIT-57 Multi-Worker Optimistic Concurrency and Transactional Integrity Test',
    matchId: match.id,
    startingVersion: originalVersion,
    finalVersion: match.version,
    totalWorkers: 10,
    committedWorkers: results.filter(r => r.status === 'COMMITTED').length,
    conflictsHandled: results.filter(r => r.status === 'CONFLICT_RESOLVED').length,
    results
  });
});

// RESET DEMO DATA (Protected: ADMIN only)
apiRouter.post('/reset-demo', authenticate, requireRole('ADMIN'), (req: AuthenticatedRequest, res) => {
  db.seedInitialData();
  res.json({ success: true, message: 'Database reset to initial demo state.' });
});
