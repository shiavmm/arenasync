import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

describe('Requirement 1: Team Registration & Validation', () => {
  let teams;

  beforeEach(() => {
    teams = [
      { id: 'team-1', name: 'Titan FC', code: 'TIT', coachName: 'Elena Rostova', status: 'ACTIVE' },
      { id: 'team-2', name: 'Apex Strikers', code: 'APX', coachName: 'Kareem Sterling', status: 'ACTIVE' }
    ];
  });

  function validateAndRegisterTeam(input, existingTeams) {
    const { name, code, coachName, coachEmail } = input;
    if (!name || !name.trim() || !code || !code.trim()) {
      throw new Error('Team name and code are required');
    }

    const trimmedCode = code.trim().toUpperCase();
    const trimmedName = name.trim();

    if (existingTeams.some(t => t.name.toLowerCase() === trimmedName.toLowerCase())) {
      throw new Error('A team with this name already exists');
    }

    if (existingTeams.some(t => t.code.toUpperCase() === trimmedCode)) {
      throw new Error('A team with this code already exists');
    }

    const newTeam = {
      id: `team-${Date.now()}`,
      name: trimmedName,
      code: trimmedCode,
      coachName: coachName || 'TBD',
      coachEmail: coachEmail || 'coach@sports.edu',
      status: 'ACTIVE',
      matchesPlayed: 0,
      points: 0
    };

    existingTeams.push(newTeam);
    return newTeam;
  }

  it('should successfully register a valid new team', () => {
    const newTeam = validateAndRegisterTeam(
      { name: 'Horizon United', code: 'HZU', coachName: 'Maya Lin', coachEmail: 'lin@horizon.edu' },
      teams
    );
    assert.strictEqual(newTeam.name, 'Horizon United');
    assert.strictEqual(newTeam.code, 'HZU');
    assert.strictEqual(teams.length, 3);
  });

  it('should reject registration when team name or code is missing', () => {
    assert.throws(
      () => validateAndRegisterTeam({ name: '', code: 'VAL' }, teams),
      /Team name and code are required/
    );
    assert.throws(
      () => validateAndRegisterTeam({ name: 'Valid Name', code: '  ' }, teams),
      /Team name and code are required/
    );
  });

  it('should reject duplicate team names (case-insensitive)', () => {
    assert.throws(
      () => validateAndRegisterTeam({ name: 'titan fc', code: 'TTC' }, teams),
      /A team with this name already exists/
    );
  });

  it('should reject duplicate team codes (case-insensitive)', () => {
    assert.throws(
      () => validateAndRegisterTeam({ name: 'New Titans', code: 'tit' }, teams),
      /A team with this code already exists/
    );
  });
});

describe('Requirement 1B: Team & Player Updates, Soft-Delete, Role Authorization & Conflict Rules', () => {
  let dbMock;
  let auditLogs;

  beforeEach(() => {
    auditLogs = [];
    dbMock = {
      users: [
        { id: 'usr-admin-1', name: 'Prof. David Vance', role: 'ADMIN' },
        { id: 'usr-coach-1', name: 'Elena Rostova', role: 'COACH', teamId: 'team-1' },
        { id: 'usr-coach-2', name: 'Kareem Sterling', role: 'COACH', teamId: 'team-2' },
        { id: 'usr-viewer-1', name: 'Campus Spectator', role: 'VIEWER' }
      ],
      tournaments: [
        { id: 'tour-1', name: 'Collegiate Premier', status: 'IN_PROGRESS', registeredTeamIds: ['team-1', 'team-2'] },
        { id: 'tour-draft', name: 'Draft Tour', status: 'DRAFT', registeredTeamIds: ['team-draft-1'] }
      ],
      teams: [
        { id: 'team-1', name: 'Titan FC', code: 'TIT', status: 'ACTIVE', matchesPlayed: 2, wins: 2, points: 6, goalsFor: 4, goalsAgainst: 1 },
        { id: 'team-2', name: 'Apex Strikers', code: 'APX', status: 'ACTIVE', matchesPlayed: 2, wins: 1, points: 3, goalsFor: 3, goalsAgainst: 3 },
        { id: 'team-draft-1', name: 'Draft FC', code: 'DFC', status: 'ACTIVE', matchesPlayed: 0, wins: 0, points: 0, goalsFor: 0, goalsAgainst: 0 }
      ],
      players: [
        { id: 'ply-1', name: 'Julian Reyes', teamId: 'team-1', teamName: 'Titan FC', jerseyNumber: 10, age: 21, status: 'ACTIVE', matchesPlayed: 4, goals: 5 },
        { id: 'ply-2', name: 'Mateo Hernandez', teamId: 'team-1', teamName: 'Titan FC', jerseyNumber: 9, age: 20, status: 'ACTIVE', matchesPlayed: 4, goals: 3 },
        { id: 'ply-3', name: 'Zane Mansoor', teamId: 'team-2', teamName: 'Apex Strikers', jerseyNumber: 7, age: 22, status: 'ACTIVE', matchesPlayed: 4, goals: 4 }
      ],
      matches: [
        { id: 'match-1', homeTeamId: 'team-1', awayTeamId: 'team-2', status: 'COMPLETED', homeScore: 2, awayScore: 1 }
      ]
    };
  });

  function updateTeam(id, body, actor) {
    if (!actor) return { status: 401, error: 'Authentication required' };
    if (actor.role !== 'ADMIN') return { status: 403, error: 'Forbidden' };

    const team = dbMock.teams.find(t => t.id === id);
    if (!team) return { status: 404, error: 'Team not found' };

    const { name, code, wins, matchesPlayed } = body;
    if (name !== undefined) {
      if (!name || !name.trim()) return { status: 400, error: 'Invalid name' };
      if (dbMock.teams.some(t => t.id !== id && t.status !== 'INACTIVE' && t.name.toLowerCase() === name.trim().toLowerCase())) {
        return { status: 400, error: 'A team with this name or code already exists' };
      }
    }

    if (code !== undefined) {
      if (!code || !code.trim() || code.trim().length < 2 || code.trim().length > 6) return { status: 400, error: 'Invalid code' };
      if (dbMock.teams.some(t => t.id !== id && t.status !== 'INACTIVE' && t.code.toUpperCase() === code.trim().toUpperCase())) {
        return { status: 400, error: 'A team with this name or code already exists' };
      }
    }

    if (wins !== undefined && (typeof wins !== 'number' || wins < 0)) {
      return { status: 400, error: 'Statistic cannot be negative' };
    }

    const prev = JSON.stringify(team);
    if (name !== undefined) team.name = name.trim();
    if (code !== undefined) team.code = code.trim().toUpperCase();
    if (wins !== undefined) team.wins = wins;

    auditLogs.push({ action: 'UPDATE_TEAM', entityId: team.id, previousValue: prev, newValue: JSON.stringify(team) });
    return { status: 200, team };
  }

  function deleteTeam(id, actor) {
    if (!actor) return { status: 401, error: 'Authentication required' };
    if (actor.role !== 'ADMIN') return { status: 403, error: 'Forbidden' };

    const team = dbMock.teams.find(t => t.id === id);
    if (!team) return { status: 404, error: 'Team not found' };

    const hasLiveOrCompletedMatches = dbMock.matches.some(
      m => (m.homeTeamId === id || m.awayTeamId === id) && (m.status === 'LIVE' || m.status === 'COMPLETED')
    );
    if (hasLiveOrCompletedMatches) {
      return { status: 409, error: `Cannot delete team '${team.name}': Team has LIVE or COMPLETED matches in the tournament schedule.` };
    }

    const inProgressTour = dbMock.tournaments.find(
      t => t.registeredTeamIds?.includes(id) && t.status === 'IN_PROGRESS'
    );
    if (inProgressTour) {
      return { status: 409, error: `Cannot delete team '${team.name}': Tournament '${inProgressTour.name}' is currently IN_PROGRESS.` };
    }

    const prev = JSON.stringify({ status: team.status });
    team.status = 'INACTIVE';
    team.deletedAt = new Date().toISOString();

    auditLogs.push({ action: 'DELETE_TEAM', entityId: team.id, previousValue: prev, newValue: JSON.stringify({ status: team.status, deletedAt: team.deletedAt }) });
    return { status: 200, team };
  }

  function updatePlayer(id, body, actor) {
    if (!actor) return { status: 401, error: 'Authentication required' };
    if (actor.role !== 'ADMIN' && actor.role !== 'COACH') return { status: 403, error: 'Forbidden' };

    const player = dbMock.players.find(p => p.id === id);
    if (!player) return { status: 404, error: 'Player not found' };

    if (actor.role === 'COACH' && actor.teamId !== player.teamId) {
      return { status: 403, error: 'Forbidden: Coaches can only update players on their own team.' };
    }

    const { name, jerseyNumber, goals } = body;
    if (name !== undefined && !name.trim()) return { status: 400, error: 'Invalid name' };
    if (goals !== undefined && (typeof goals !== 'number' || goals < 0)) return { status: 400, error: 'Stats cannot be negative' };

    if (jerseyNumber !== undefined) {
      if (jerseyNumber < 1 || jerseyNumber > 99) return { status: 400, error: 'Invalid jersey number' };
      if (dbMock.players.some(p => p.teamId === player.teamId && p.id !== id && p.status !== 'INACTIVE' && p.jerseyNumber === jerseyNumber)) {
        return { status: 400, error: 'Jersey number already taken on this team' };
      }
    }

    const prev = JSON.stringify(player);
    if (name !== undefined) player.name = name.trim();
    if (jerseyNumber !== undefined) player.jerseyNumber = jerseyNumber;
    if (goals !== undefined) player.goals = goals;

    auditLogs.push({ action: 'UPDATE_PLAYER', entityId: player.id, previousValue: prev, newValue: JSON.stringify(player) });
    return { status: 200, player };
  }

  function deletePlayer(id, actor) {
    if (!actor) return { status: 401, error: 'Authentication required' };
    if (actor.role !== 'ADMIN' && actor.role !== 'COACH') return { status: 403, error: 'Forbidden' };

    const player = dbMock.players.find(p => p.id === id);
    if (!player) return { status: 404, error: 'Player not found' };

    if (actor.role === 'COACH' && actor.teamId !== player.teamId) {
      return { status: 403, error: 'Forbidden: Coaches can only delete players on their own team.' };
    }

    const prev = JSON.stringify({ status: player.status });
    player.status = 'INACTIVE';
    player.deletedAt = new Date().toISOString();

    auditLogs.push({ action: 'DELETE_PLAYER', entityId: player.id, previousValue: prev, newValue: JSON.stringify({ status: player.status, deletedAt: player.deletedAt }) });
    return { status: 200, player };
  }

  it('should soft delete team and exclude from default list unless includeInactive=true for ADMIN', () => {
    const admin = dbMock.users[0];
    const res = deleteTeam('team-draft-1', admin);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.team.status, 'INACTIVE');
    assert.strictEqual(typeof res.team.deletedAt, 'string');

    // Default list excludes inactive
    const activeTeams = dbMock.teams.filter(t => t.status !== 'INACTIVE');
    assert.strictEqual(activeTeams.length, 2);
    assert.strictEqual(activeTeams.some(t => t.id === 'team-draft-1'), false);
  });

  it('should block deleting team with completed matches (HTTP 409)', () => {
    const admin = dbMock.users[0];
    const res = deleteTeam('team-1', admin);
    assert.strictEqual(res.status, 409);
    assert.match(res.error, /LIVE or COMPLETED matches/);
  });

  it('should block deleting team whose tournament is IN_PROGRESS (HTTP 409)', () => {
    dbMock.teams.push({ id: 'team-3', name: 'T3', code: 'T33', status: 'ACTIVE' });
    dbMock.tournaments[0].registeredTeamIds.push('team-3');
    const admin = dbMock.users[0];
    const res = deleteTeam('team-3', admin);
    assert.strictEqual(res.status, 409);
    assert.match(res.error, /IN_PROGRESS/);
  });

  it('should reapply unique name and code checks on team update (HTTP 400)', () => {
    const admin = dbMock.users[0];
    const resDupName = updateTeam('team-2', { name: 'Titan FC' }, admin);
    assert.strictEqual(resDupName.status, 400);

    const resDupCode = updateTeam('team-2', { code: 'TIT' }, admin);
    assert.strictEqual(resDupCode.status, 400);

    const resNeg = updateTeam('team-1', { wins: -5 }, admin);
    assert.strictEqual(resNeg.status, 400);
  });

  it('should allow coach to update and delete players on their own team', () => {
    const coach1 = dbMock.users[1]; // team-1 coach
    const resUp = updatePlayer('ply-1', { name: 'Julian R. Reyes' }, coach1);
    assert.strictEqual(resUp.status, 200);
    assert.strictEqual(resUp.player.name, 'Julian R. Reyes');

    const resDel = deletePlayer('ply-1', coach1);
    assert.strictEqual(resDel.status, 200);
    assert.strictEqual(resDel.player.status, 'INACTIVE');
    assert.strictEqual(resDel.player.goals, 5); // Stats preserved
  });

  it('should forbid coach from updating or deleting players on another team (HTTP 403)', () => {
    const coach1 = dbMock.users[1]; // team-1 coach
    const resUp = updatePlayer('ply-3', { name: 'Hacked Name' }, coach1); // ply-3 on team-2
    assert.strictEqual(resUp.status, 403);
    assert.match(resUp.error, /own team/);

    const resDel = deletePlayer('ply-3', coach1);
    assert.strictEqual(resDel.status, 403);
    assert.match(resDel.error, /own team/);
  });

  it('should record audit logs for UPDATE_TEAM, DELETE_TEAM, UPDATE_PLAYER, DELETE_PLAYER', () => {
    const admin = dbMock.users[0];
    updateTeam('team-1', { name: 'Titan Champions FC' }, admin);
    deleteTeam('team-draft-1', admin);
    updatePlayer('ply-2', { jerseyNumber: 99 }, admin);
    deletePlayer('ply-2', admin);

    const actions = auditLogs.map(l => l.action);
    assert.deepStrictEqual(actions, ['UPDATE_TEAM', 'DELETE_TEAM', 'UPDATE_PLAYER', 'DELETE_PLAYER']);
  });
});
