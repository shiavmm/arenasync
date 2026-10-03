import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

describe('Team & Player Update, Soft-Delete, Role Authorization & Validation Tests', () => {
  let dbMock;
  let adminUser;
  let coachTeam1;
  let coachTeam2;
  let viewerUser;
  let adminToken;
  let coach1Token;
  let coach2Token;
  let viewerToken;

  function generateToken(user) {
    const payload = Buffer.from(JSON.stringify({
      userId: user.id,
      role: user.role,
      issuedAt: Date.now()
    })).toString('base64');
    return `arenasync-jwt-${user.id}-${payload}`;
  }

  function parseToken(token) {
    try {
      if (!token || !token.startsWith('arenasync-jwt-')) return null;
      const parts = token.split('-');
      const base64Payload = parts[parts.length - 1];
      const decoded = JSON.parse(Buffer.from(base64Payload, 'base64').toString('utf-8'));
      if (!decoded.userId || !decoded.role) return null;
      return decoded;
    } catch {
      return null;
    }
  }

  function getOptionalAuthUser(req, db) {
    const authHeader = req.headers?.authorization || req.headers?.['x-auth-token'];
    if (!authHeader) return null;
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : authHeader.trim();
    const parsed = parseToken(token);
    if (!parsed) return null;
    return db.users.find(u => u.id === parsed.userId) || null;
  }

  function authenticateRequest(req, db) {
    const authHeader = req.headers?.authorization || req.headers?.['x-auth-token'];
    if (!authHeader) {
      return { status: 401, body: { error: 'Authentication required' } };
    }
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : authHeader.trim();
    const parsed = parseToken(token);
    if (!parsed) {
      return { status: 401, body: { error: 'Invalid or expired token' } };
    }
    const user = db.users.find(u => u.id === parsed.userId);
    if (!user) {
      return { status: 401, body: { error: 'User does not exist' } };
    }
    req.user = user;
    return null;
  }

  function requireRoleCheck(req, ...allowedRoles) {
    if (!req.user) {
      return { status: 401, body: { error: 'Authentication required' } };
    }
    if (!allowedRoles.includes(req.user.role)) {
      return { status: 403, body: { error: `Forbidden for role ${req.user.role}` } };
    }
    return null;
  }

  // Implementation handlers mimicking server/api.ts
  function handleGetTeams(req, db) {
    const includeInactive = req.query?.includeInactive === 'true';
    const requestingUser = getOptionalAuthUser(req, db);
    if (includeInactive && requestingUser?.role === 'ADMIN') {
      return { status: 200, body: db.teams };
    }
    return { status: 200, body: db.teams.filter(t => t.status !== 'INACTIVE') };
  }

  function handlePutTeam(id, req, db) {
    const authErr = authenticateRequest(req, db);
    if (authErr) return authErr;
    const roleErr = requireRoleCheck(req, 'ADMIN');
    if (roleErr) return roleErr;

    const team = db.teams.find(t => t.id === id);
    if (!team) return { status: 404, body: { error: 'Team not found' } };

    const { name, code, matchesPlayed, wins, losses, draws, points, goalsFor, goalsAgainst } = req.body || {};

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return { status: 400, body: { error: 'Team name must be a non-empty string' } };
      }
      if (name.trim().length > 100) {
        return { status: 400, body: { error: 'Team name cannot exceed 100 characters' } };
      }
    }

    if (code !== undefined) {
      if (typeof code !== 'string' || !code.trim()) {
        return { status: 400, body: { error: 'Team code must be a non-empty string' } };
      }
      if (code.trim().length < 2 || code.trim().length > 6) {
        return { status: 400, body: { error: 'Team code must be between 2 and 6 characters' } };
      }
    }

    const targetName = name !== undefined ? name.trim() : team.name;
    const targetCode = code !== undefined ? code.trim().toUpperCase() : team.code;

    const duplicate = db.teams.find(
      t => t.id !== team.id &&
           t.status !== 'INACTIVE' &&
           (t.name.toLowerCase() === targetName.toLowerCase() || t.code.toUpperCase() === targetCode)
    );
    if (duplicate) {
      return { status: 400, body: { error: 'A team with this name or code already exists' } };
    }

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
          return { status: 400, body: { error: `Field '${field.key}' must be a non-negative number` } };
        }
      }
    }

    const prevVal = JSON.stringify(team);

    if (name !== undefined) team.name = name.trim();
    if (code !== undefined) team.code = code.trim().toUpperCase();
    if (matchesPlayed !== undefined) team.matchesPlayed = matchesPlayed;
    if (wins !== undefined) team.wins = wins;
    if (losses !== undefined) team.losses = losses;
    if (draws !== undefined) team.draws = draws;
    if (points !== undefined) team.points = points;
    if (goalsFor !== undefined) team.goalsFor = goalsFor;
    if (goalsAgainst !== undefined) team.goalsAgainst = goalsAgainst;

    db.auditLogs.unshift({
      id: `log-${Date.now()}`,
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'UPDATE_TEAM',
      entityType: 'TEAM',
      entityId: team.id,
      previousValue: prevVal,
      newValue: JSON.stringify(team)
    });

    return { status: 200, body: team };
  }

  function handleDeleteTeam(id, req, db) {
    const authErr = authenticateRequest(req, db);
    if (authErr) return authErr;
    const roleErr = requireRoleCheck(req, 'ADMIN');
    if (roleErr) return roleErr;

    const team = db.teams.find(t => t.id === id);
    if (!team) return { status: 404, body: { error: 'Team not found' } };

    const hasLiveOrCompletedMatches = db.matches.some(
      m => (m.homeTeamId === team.id || m.awayTeamId === team.id) &&
           (m.status === 'LIVE' || m.status === 'COMPLETED')
    );
    if (hasLiveOrCompletedMatches) {
      return {
        status: 409,
        body: { error: `Cannot delete team '${team.name}': The team has LIVE or COMPLETED matches in the tournament schedule.` }
      };
    }

    const inProgressTour = db.tournaments.find(
      t => t.registeredTeamIds?.includes(team.id) && t.status === 'IN_PROGRESS'
    );
    if (inProgressTour) {
      return {
        status: 409,
        body: { error: `Cannot delete team '${team.name}': Tournament '${inProgressTour.name}' is currently IN_PROGRESS.` }
      };
    }

    const prevValue = JSON.stringify({ status: team.status, deletedAt: team.deletedAt });
    team.status = 'INACTIVE';
    team.deletedAt = new Date().toISOString();

    db.auditLogs.unshift({
      id: `log-${Date.now()}`,
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'DELETE_TEAM',
      entityType: 'TEAM',
      entityId: team.id,
      previousValue: prevValue,
      newValue: JSON.stringify({ status: team.status, deletedAt: team.deletedAt })
    });

    return { status: 200, body: { success: true, team } };
  }

  function handleGetPlayers(req, db) {
    const includeInactive = req.query?.includeInactive === 'true';
    const requestingUser = getOptionalAuthUser(req, db);
    let result = db.players;

    if (!(includeInactive && requestingUser?.role === 'ADMIN')) {
      result = result.filter(p => p.status !== 'INACTIVE');
    }

    if (req.query?.teamId) {
      result = result.filter(p => p.teamId === req.query.teamId);
    }
    return { status: 200, body: result };
  }

  function handlePutPlayer(id, req, db) {
    const authErr = authenticateRequest(req, db);
    if (authErr) return authErr;
    const roleErr = requireRoleCheck(req, 'ADMIN', 'COACH');
    if (roleErr) return roleErr;

    const player = db.players.find(p => p.id === id);
    if (!player) return { status: 404, body: { error: 'Player not found' } };

    if (req.user.role === 'COACH') {
      if (!req.user.teamId || req.user.teamId !== player.teamId) {
        return { status: 403, body: { error: 'Forbidden: Coaches can only update players on their own team.' } };
      }
    }

    const { name, jerseyNumber, age, matchesPlayed, minutesPlayed, goals, assists, yellowCards, redCards, fouls } = req.body || {};

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return { status: 400, body: { error: 'Player name must be a non-empty string' } };
      }
    }

    if (jerseyNumber !== undefined) {
      if (typeof jerseyNumber !== 'number' || !Number.isInteger(jerseyNumber) || jerseyNumber < 1 || jerseyNumber > 99) {
        return { status: 400, body: { error: 'Jersey number must be an integer between 1 and 99' } };
      }
    }

    if (age !== undefined) {
      if (typeof age !== 'number' || !Number.isInteger(age) || age < 10 || age > 100) {
        return { status: 400, body: { error: 'Age must be a valid number' } };
      }
    }

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
          return { status: 400, body: { error: `Field '${stat.key}' must be a non-negative number` } };
        }
      }
    }

    const targetTeamId = req.body?.teamId || player.teamId;
    const targetJersey = jerseyNumber !== undefined ? Number(jerseyNumber) : player.jerseyNumber;
    const targetName = name !== undefined ? name.trim() : player.name;

    const duplicate = db.players.find(
      p => p.teamId === targetTeamId &&
           p.id !== player.id &&
           p.status !== 'INACTIVE' &&
           (p.jerseyNumber === targetJersey || p.name.toLowerCase() === targetName.toLowerCase())
    );
    if (duplicate) {
      return { status: 400, body: { error: 'Player with this name or jersey number already exists on this team' } };
    }

    const prevPlayerJson = JSON.stringify(player);

    if (name !== undefined) player.name = name.trim();
    if (jerseyNumber !== undefined) player.jerseyNumber = jerseyNumber;
    if (age !== undefined) player.age = age;
    if (goals !== undefined) player.goals = goals;

    db.auditLogs.unshift({
      id: `log-${Date.now()}`,
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'UPDATE_PLAYER',
      entityType: 'PLAYER',
      entityId: player.id,
      previousValue: prevPlayerJson,
      newValue: JSON.stringify(player)
    });

    return { status: 200, body: player };
  }

  function handleDeletePlayer(id, req, db) {
    const authErr = authenticateRequest(req, db);
    if (authErr) return authErr;
    const roleErr = requireRoleCheck(req, 'ADMIN', 'COACH');
    if (roleErr) return roleErr;

    const player = db.players.find(p => p.id === id);
    if (!player) return { status: 404, body: { error: 'Player not found' } };

    if (req.user.role === 'COACH') {
      if (!req.user.teamId || req.user.teamId !== player.teamId) {
        return { status: 403, body: { error: "Forbidden: Coaches can only delete players on their own team." } };
      }
    }

    const prevValue = JSON.stringify({ status: player.status || 'ACTIVE', deletedAt: player.deletedAt });
    player.status = 'INACTIVE';
    player.deletedAt = new Date().toISOString();

    db.auditLogs.unshift({
      id: `log-${Date.now()}`,
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'DELETE_PLAYER',
      entityType: 'PLAYER',
      entityId: player.id,
      previousValue: prevValue,
      newValue: JSON.stringify({ status: player.status, deletedAt: player.deletedAt })
    });

    return { status: 200, body: { success: true, player } };
  }

  beforeEach(() => {
    adminUser = { id: 'usr-admin-1', name: 'David Vance', role: 'ADMIN' };
    coachTeam1 = { id: 'usr-coach-1', name: 'Elena Rostova', role: 'COACH', teamId: 'team-1' };
    coachTeam2 = { id: 'usr-coach-2', name: 'Kareem Sterling', role: 'COACH', teamId: 'team-2' };
    viewerUser = { id: 'usr-viewer-1', name: 'Spectator', role: 'VIEWER' };

    adminToken = generateToken(adminUser);
    coach1Token = generateToken(coachTeam1);
    coach2Token = generateToken(coachTeam2);
    viewerToken = generateToken(viewerUser);

    dbMock = {
      users: [adminUser, coachTeam1, coachTeam2, viewerUser],
      tournaments: [
        {
          id: 'tour-1',
          name: 'Collegiate Championship',
          status: 'IN_PROGRESS',
          registeredTeamIds: ['team-1', 'team-2']
        },
        {
          id: 'tour-draft',
          name: 'Draft Tournament',
          status: 'DRAFT',
          registeredTeamIds: ['team-draft-1']
        }
      ],
      teams: [
        {
          id: 'team-1',
          name: 'Titan FC',
          code: 'TIT',
          status: 'ACTIVE',
          matchesPlayed: 2,
          wins: 2,
          points: 6,
          goalsFor: 4,
          goalsAgainst: 1
        },
        {
          id: 'team-2',
          name: 'Apex Strikers',
          code: 'APX',
          status: 'ACTIVE',
          matchesPlayed: 2,
          wins: 1,
          points: 3,
          goalsFor: 3,
          goalsAgainst: 3
        },
        {
          id: 'team-draft-1',
          name: 'Draft Team One',
          code: 'DTO',
          status: 'ACTIVE',
          matchesPlayed: 0,
          wins: 0,
          points: 0,
          goalsFor: 0,
          goalsAgainst: 0
        }
      ],
      players: [
        {
          id: 'ply-1',
          name: 'Julian Reyes',
          teamId: 'team-1',
          teamName: 'Titan FC',
          jerseyNumber: 10,
          age: 21,
          status: 'ACTIVE',
          matchesPlayed: 4,
          goals: 5
        },
        {
          id: 'ply-2',
          name: 'Mateo Hernandez',
          teamId: 'team-1',
          teamName: 'Titan FC',
          jerseyNumber: 9,
          age: 20,
          status: 'ACTIVE',
          matchesPlayed: 4,
          goals: 3
        },
        {
          id: 'ply-3',
          name: 'Zane Mansoor',
          teamId: 'team-2',
          teamName: 'Apex Strikers',
          jerseyNumber: 7,
          age: 22,
          status: 'ACTIVE',
          matchesPlayed: 4,
          goals: 4
        }
      ],
      matches: [
        {
          id: 'match-1',
          homeTeamId: 'team-1',
          awayTeamId: 'team-2',
          status: 'COMPLETED',
          homeScore: 2,
          awayScore: 1
        }
      ],
      auditLogs: []
    };
  });

  // RULE 1: Soft Delete
  it('Rule 1: should soft-delete a team (set status INACTIVE & deletedAt), preserving record for references', () => {
    const res = handleDeleteTeam('team-draft-1', { headers: { authorization: `Bearer ${adminToken}` } }, dbMock);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);

    const team = dbMock.teams.find(t => t.id === 'team-draft-1');
    assert.ok(team, 'Record must not be deleted from database');
    assert.strictEqual(team.status, 'INACTIVE');
    assert.strictEqual(typeof team.deletedAt, 'string');
  });

  it('Rule 1: should exclude inactive teams from default list and include when includeInactive=true for ADMIN', () => {
    // Soft delete draft team
    handleDeleteTeam('team-draft-1', { headers: { authorization: `Bearer ${adminToken}` } }, dbMock);

    // Default list without auth
    const defaultList = handleGetTeams({}, dbMock);
    assert.strictEqual(defaultList.body.length, 2);
    assert.strictEqual(defaultList.body.some(t => t.id === 'team-draft-1'), false);

    // List with includeInactive=true for VIEWER (non-admin)
    const viewerList = handleGetTeams(
      { query: { includeInactive: 'true' }, headers: { authorization: `Bearer ${viewerToken}` } },
      dbMock
    );
    assert.strictEqual(viewerList.body.length, 2);
    assert.strictEqual(viewerList.body.some(t => t.id === 'team-draft-1'), false);

    // List with includeInactive=true for ADMIN
    const adminList = handleGetTeams(
      { query: { includeInactive: 'true' }, headers: { authorization: `Bearer ${adminToken}` } },
      dbMock
    );
    assert.strictEqual(adminList.body.length, 3);
    assert.strictEqual(adminList.body.some(t => t.id === 'team-draft-1'), true);
  });

  // RULE 2: Block deleting a team with live/completed matches or tournament in progress
  it('Rule 2: should return 409 when deleting a team that has LIVE or COMPLETED matches', () => {
    const res = handleDeleteTeam('team-1', { headers: { authorization: `Bearer ${adminToken}` } }, dbMock);
    assert.strictEqual(res.status, 409);
    assert.match(res.body.error, /LIVE or COMPLETED matches/);
  });

  it('Rule 2: should return 409 when deleting a team whose tournament is IN_PROGRESS', () => {
    // Create a team with no matches but in an IN_PROGRESS tournament
    dbMock.teams.push({
      id: 'team-active-tour',
      name: 'Active Tour Team',
      code: 'ATT',
      status: 'ACTIVE'
    });
    dbMock.tournaments[0].registeredTeamIds.push('team-active-tour');

    const res = handleDeleteTeam('team-active-tour', { headers: { authorization: `Bearer ${adminToken}` } }, dbMock);
    assert.strictEqual(res.status, 409);
    assert.match(res.body.error, /IN_PROGRESS/);
  });

  // RULE 3: Deleting a player keeps past stats but removes them from future squads
  it('Rule 3: should soft delete a player, keep stats, and exclude them from future squad lists', () => {
    const res = handleDeletePlayer('ply-1', { headers: { authorization: `Bearer ${adminToken}` } }, dbMock);
    assert.strictEqual(res.status, 200);

    const player = dbMock.players.find(p => p.id === 'ply-1');
    assert.strictEqual(player.status, 'INACTIVE');
    assert.strictEqual(typeof player.deletedAt, 'string');
    assert.strictEqual(player.goals, 5); // Stats preserved
    assert.strictEqual(player.matchesPlayed, 4);

    // Team squad list excludes inactive player
    const team1Squad = handleGetPlayers({ query: { teamId: 'team-1' } }, dbMock);
    assert.strictEqual(team1Squad.body.length, 1);
    assert.strictEqual(team1Squad.body[0].id, 'ply-2');
  });

  // RULE 4: Validation and unique name/code checks on team and player updates
  it('Rule 4: should reject duplicate team names and codes on update (HTTP 400)', () => {
    // Try updating team-2 to have team-1's name
    const resName = handlePutTeam(
      'team-2',
      { headers: { authorization: `Bearer ${adminToken}` }, body: { name: 'Titan FC' } },
      dbMock
    );
    assert.strictEqual(resName.status, 400);
    assert.match(resName.body.error, /already exists/);

    // Try updating team-2 to have team-1's code
    const resCode = handlePutTeam(
      'team-2',
      { headers: { authorization: `Bearer ${adminToken}` }, body: { code: 'TIT' } },
      dbMock
    );
    assert.strictEqual(resCode.status, 400);
    assert.match(resCode.body.error, /already exists/);
  });

  it('Rule 4: should reject negative stats and invalid types on team update', () => {
    const resNegative = handlePutTeam(
      'team-1',
      { headers: { authorization: `Bearer ${adminToken}` }, body: { wins: -1 } },
      dbMock
    );
    assert.strictEqual(resNegative.status, 400);
    assert.match(resNegative.body.error, /non-negative/);

    const resEmptyName = handlePutTeam(
      'team-1',
      { headers: { authorization: `Bearer ${adminToken}` }, body: { name: '   ' } },
      dbMock
    );
    assert.strictEqual(resEmptyName.status, 400);
  });

  it('Rule 4: should reject duplicate jersey number on same team for player update', () => {
    // ply-2 (jersey 9) tries to take ply-1's jersey 10 on team-1
    const res = handlePutPlayer(
      'ply-2',
      { headers: { authorization: `Bearer ${adminToken}` }, body: { jerseyNumber: 10 } },
      dbMock
    );
    assert.strictEqual(res.status, 400);
    assert.match(res.body.error, /already exists on this team/);
  });

  it('Rule 4: should reject negative stats on player update', () => {
    const res = handlePutPlayer(
      'ply-1',
      { headers: { authorization: `Bearer ${adminToken}` }, body: { goals: -3 } },
      dbMock
    );
    assert.strictEqual(res.status, 400);
    assert.match(res.body.error, /non-negative/);
  });

  // RULE 5: Audit Logs
  it('Rule 5: should create UPDATE_TEAM and DELETE_TEAM audit logs with before and after diff', () => {
    handlePutTeam(
      'team-1',
      { headers: { authorization: `Bearer ${adminToken}` }, body: { name: 'Titan Champions FC' } },
      dbMock
    );
    assert.strictEqual(dbMock.auditLogs[0].action, 'UPDATE_TEAM');
    assert.strictEqual(dbMock.auditLogs[0].entityType, 'TEAM');
    assert.match(dbMock.auditLogs[0].previousValue, /Titan FC/);
    assert.match(dbMock.auditLogs[0].newValue, /Titan Champions FC/);

    handleDeleteTeam('team-draft-1', { headers: { authorization: `Bearer ${adminToken}` } }, dbMock);
    assert.strictEqual(dbMock.auditLogs[0].action, 'DELETE_TEAM');
    assert.match(dbMock.auditLogs[0].newValue, /INACTIVE/);
  });

  it('Rule 5: should create UPDATE_PLAYER and DELETE_PLAYER audit logs with before and after diff', () => {
    handlePutPlayer(
      'ply-1',
      { headers: { authorization: `Bearer ${adminToken}` }, body: { name: 'Julian R. Reyes' } },
      dbMock
    );
    assert.strictEqual(dbMock.auditLogs[0].action, 'UPDATE_PLAYER');
    assert.strictEqual(dbMock.auditLogs[0].entityType, 'PLAYER');
    assert.match(dbMock.auditLogs[0].previousValue, /Julian Reyes/);
    assert.match(dbMock.auditLogs[0].newValue, /Julian R. Reyes/);

    handleDeletePlayer('ply-1', { headers: { authorization: `Bearer ${adminToken}` } }, dbMock);
    assert.strictEqual(dbMock.auditLogs[0].action, 'DELETE_PLAYER');
    assert.match(dbMock.auditLogs[0].newValue, /INACTIVE/);
  });

  // RULE 6 & 8: Auth checks, role boundaries & Coach permission rules
  it('Rule 6: should return 401 for requests without token', () => {
    const resTeam = handlePutTeam('team-1', { headers: {} }, dbMock);
    assert.strictEqual(resTeam.status, 401);

    const resPlayer = handleDeletePlayer('ply-1', { headers: {} }, dbMock);
    assert.strictEqual(resPlayer.status, 401);
  });

  it('Rule 6: should return 403 for unauthorized roles (e.g. VIEWER or COACH on team mutation)', () => {
    const resViewer = handlePutTeam(
      'team-1',
      { headers: { authorization: `Bearer ${viewerToken}` }, body: { name: 'New Name' } },
      dbMock
    );
    assert.strictEqual(resViewer.status, 403);

    const resCoachTeamDelete = handleDeleteTeam(
      'team-draft-1',
      { headers: { authorization: `Bearer ${coach1Token}` } },
      dbMock
    );
    assert.strictEqual(resCoachTeamDelete.status, 403);
  });

  it('Rule 6: should return 404 for unknown team or player IDs', () => {
    const resTeam = handlePutTeam(
      'team-unknown-999',
      { headers: { authorization: `Bearer ${adminToken}` }, body: { name: 'Nonexistent' } },
      dbMock
    );
    assert.strictEqual(resTeam.status, 404);

    const resPlayer = handleDeletePlayer(
      'ply-unknown-999',
      { headers: { authorization: `Bearer ${adminToken}` } },
      dbMock
    );
    assert.strictEqual(resPlayer.status, 404);
  });

  it('Rule 8: COACH can update and delete their own team player (HTTP 200)', () => {
    // Coach 1 coaches team-1, ply-1 is on team-1
    const resUpdate = handlePutPlayer(
      'ply-1',
      { headers: { authorization: `Bearer ${coach1Token}` }, body: { name: 'Julian Reyes Captain' } },
      dbMock
    );
    assert.strictEqual(resUpdate.status, 200);
    assert.strictEqual(resUpdate.body.name, 'Julian Reyes Captain');

    const resDelete = handleDeletePlayer(
      'ply-1',
      { headers: { authorization: `Bearer ${coach1Token}` } },
      dbMock
    );
    assert.strictEqual(resDelete.status, 200);
    assert.strictEqual(resDelete.body.player.status, 'INACTIVE');
  });

  it("Rule 8: COACH trying to update or delete another team's player returns HTTP 403", () => {
    // Coach 1 coaches team-1, but ply-3 is on team-2
    const resUpdate = handlePutPlayer(
      'ply-3',
      { headers: { authorization: `Bearer ${coach1Token}` }, body: { name: 'Hacked Name' } },
      dbMock
    );
    assert.strictEqual(resUpdate.status, 403);
    assert.match(resUpdate.body.error, /Forbidden: Coaches can only update players on their own team/);

    const resDelete = handleDeletePlayer(
      'ply-3',
      { headers: { authorization: `Bearer ${coach1Token}` } },
      dbMock
    );
    assert.strictEqual(resDelete.status, 403);
    assert.match(resDelete.body.error, /Forbidden: Coaches can only delete players on their own team/);
  });
});
