import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

describe('Manual Injury Flags, ACWR Auto Immutability, Clearance Gate & Audit Trail', () => {
  let db;
  let adminUser;
  let coachTeam1User;
  let coachTeam2User;
  let playerUser;
  let viewerUser;

  let adminToken;
  let coach1Token;
  let coach2Token;
  let playerToken;
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

  function authenticateRequest(req, dbInstance) {
    const authHeader = req.headers?.authorization || req.headers?.['x-auth-token'];
    if (!authHeader) {
      return { status: 401, body: { error: 'Authentication required. Please provide a valid Bearer token in Authorization header.' } };
    }
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : authHeader.trim();
    const parsed = parseToken(token);
    if (!parsed) {
      return { status: 401, body: { error: 'Invalid or expired authentication token.' } };
    }
    const user = dbInstance.users.find(u => u.id === parsed.userId);
    if (!user) {
      return { status: 401, body: { error: 'Authenticated user account does not exist or has been disabled.' } };
    }
    req.user = user;
    return null;
  }

  function requireRoleCheck(req, ...allowedRoles) {
    if (!req.user) {
      return { status: 401, body: { error: 'Authentication required before authorization check.' } };
    }
    if (!allowedRoles.includes(req.user.role)) {
      return { status: 403, body: { error: `Forbidden: User role '${req.user.role}' is not authorized to access this resource. Required role(s): ${allowedRoles.join(', ')}.` } };
    }
    return null;
  }

  function isPlayerClearedForKickoff(player, injuryFlags) {
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

  function recalculateWorkloadsAndRisks(dbInstance) {
    const manualFlags = (dbInstance.injuryFlags || []).filter(f => f.source === 'MANUAL');
    const autoFlags = [];

    dbInstance.players.forEach(player => {
      let riskLevel = 'LOW';
      if (player.id === 'ply-1') riskLevel = 'HIGH';
      else if (player.id === 'ply-2') riskLevel = 'MODERATE';

      const autoFlag = {
        id: `flag-auto-${player.id}`,
        playerId: player.id,
        playerName: player.name,
        teamId: player.teamId,
        teamName: player.teamName,
        source: 'ACWR_AUTO',
        category: 'INJURY',
        severity: riskLevel,
        riskLevel,
        notes: `Automated ACWR workload assessment (${riskLevel} risk).`,
        status: 'ACTIVE',
        createdBy: 'SYSTEM_ACWR_ENGINE',
        createdAt: new Date().toISOString(),
        reasons: ['Workload metrics within standard physiological recovery tolerances.'],
        riskScore: riskLevel === 'HIGH' ? 85 : riskLevel === 'MODERATE' ? 55 : 20,
        disclaimer: 'Workload-based statistical indicator; not a clinical medical diagnosis.',
        lastCalculated: new Date().toISOString()
      };

      player.injuryRisk = autoFlag;
      autoFlags.push(autoFlag);
    });

    dbInstance.injuryFlags = [...autoFlags, ...manualFlags];
  }

  function handleCreateInjuryFlag(playerId, req, dbInstance) {
    const authErr = authenticateRequest(req, dbInstance);
    if (authErr) return authErr;
    const roleErr = requireRoleCheck(req, 'ADMIN', 'COACH');
    if (roleErr) return roleErr;

    const player = dbInstance.players.find(p => p.id === playerId);
    if (!player) return { status: 404, body: { error: 'Player not found' } };

    if (req.user.role === 'COACH') {
      if (!req.user.teamId || req.user.teamId !== player.teamId) {
        return { status: 403, body: { error: 'Forbidden: Coaches can only manage injury flags for players on their own team.' } };
      }
    }

    const { category, severity, notes } = req.body || {};

    const validCategories = ['INJURY', 'ILLNESS', 'SUSPENSION'];
    if (!category || !validCategories.includes(category)) {
      return { status: 400, body: { error: `Invalid category '${category}'. Allowed values: ${validCategories.join(', ')}` } };
    }

    const validSeverities = ['LOW', 'MODERATE', 'HIGH'];
    if (!severity || !validSeverities.includes(severity)) {
      return { status: 400, body: { error: `Invalid severity '${severity}'. Allowed values: ${validSeverities.join(', ')}` } };
    }

    if (notes !== undefined && notes !== null) {
      if (typeof notes !== 'string') {
        return { status: 400, body: { error: 'Notes must be a string' } };
      }
      if (notes.length > 500) {
        return { status: 400, body: { error: 'Notes cannot exceed 500 characters' } };
      }
    }

    const now = new Date().toISOString();
    const trimmedNotes = notes ? notes.trim() : '';

    const newFlag = {
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
      createdBy: req.user.name || req.user.id || 'Admin',
      createdAt: now,
      reasons: [trimmedNotes || `Manual ${category.toLowerCase()} flag (${severity.toLowerCase()} severity)`],
      riskScore: severity === 'HIGH' ? 85 : severity === 'MODERATE' ? 55 : 20,
      disclaimer: 'Manual technical/medical staff entry.',
      lastCalculated: now
    };

    dbInstance.injuryFlags.push(newFlag);

    dbInstance.auditLogs.unshift({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: now,
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'ADD_INJURY_FLAG',
      entityType: 'RISK_FLAG',
      entityId: newFlag.id,
      newValue: JSON.stringify(newFlag)
    });

    return { status: 201, body: newFlag };
  }

  function handleUpdateInjuryFlag(flagId, req, dbInstance) {
    const authErr = authenticateRequest(req, dbInstance);
    if (authErr) return authErr;
    const roleErr = requireRoleCheck(req, 'ADMIN', 'COACH');
    if (roleErr) return roleErr;

    const flag = dbInstance.injuryFlags.find(f => f.id === flagId);
    if (!flag) return { status: 404, body: { error: 'Injury flag not found' } };

    if (flag.source === 'ACWR_AUTO') {
      return { status: 403, body: { error: 'Forbidden: Automatic ACWR flags cannot be modified manually.' } };
    }

    if (req.user.role === 'COACH') {
      if (!req.user.teamId || req.user.teamId !== flag.teamId) {
        return { status: 403, body: { error: 'Forbidden: Coaches can only edit injury flags for players on their own team.' } };
      }
    }

    if (flag.status !== 'ACTIVE') {
      return { status: 409, body: { error: `Conflict: Cannot edit an injury flag that is ${flag.status}. Only ACTIVE flags can be modified.` } };
    }

    const { category, severity, notes } = req.body || {};

    const validCategories = ['INJURY', 'ILLNESS', 'SUSPENSION'];
    if (category !== undefined && !validCategories.includes(category)) {
      return { status: 400, body: { error: `Invalid category '${category}'. Allowed values: ${validCategories.join(', ')}` } };
    }

    const validSeverities = ['LOW', 'MODERATE', 'HIGH'];
    if (severity !== undefined && !validSeverities.includes(severity)) {
      return { status: 400, body: { error: `Invalid severity '${severity}'. Allowed values: ${validSeverities.join(', ')}` } };
    }

    if (notes !== undefined && notes !== null) {
      if (typeof notes !== 'string') {
        return { status: 400, body: { error: 'Notes must be a string' } };
      }
      if (notes.length > 500) {
        return { status: 400, body: { error: 'Notes cannot exceed 500 characters' } };
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

    flag.updatedBy = req.user.name || req.user.id || 'Admin';
    flag.updatedAt = now;

    dbInstance.auditLogs.unshift({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: now,
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'UPDATE_INJURY_FLAG',
      entityType: 'RISK_FLAG',
      entityId: flag.id,
      previousValue: prevFlagJson,
      newValue: JSON.stringify(flag)
    });

    return { status: 200, body: flag };
  }

  function handleResolveInjuryFlag(flagId, req, dbInstance) {
    const authErr = authenticateRequest(req, dbInstance);
    if (authErr) return authErr;
    const roleErr = requireRoleCheck(req, 'ADMIN', 'COACH');
    if (roleErr) return roleErr;

    const flag = dbInstance.injuryFlags.find(f => f.id === flagId);
    if (!flag) return { status: 404, body: { error: 'Injury flag not found' } };

    if (flag.source === 'ACWR_AUTO') {
      return { status: 403, body: { error: 'Forbidden: Automatic ACWR flags cannot be resolved through the manual API.' } };
    }

    if (req.user.role === 'COACH') {
      if (!req.user.teamId || req.user.teamId !== flag.teamId) {
        return { status: 403, body: { error: 'Forbidden: Coaches can only resolve injury flags for players on their own team.' } };
      }
    }

    if (flag.status === 'RESOLVED' || flag.status === 'VOIDED') {
      return { status: 409, body: { error: `Conflict: Injury flag is already ${flag.status}.` } };
    }

    const prevFlagJson = JSON.stringify(flag);
    const now = new Date().toISOString();

    flag.status = 'RESOLVED';
    flag.resolvedBy = req.user.name || req.user.id || 'Admin';
    flag.resolvedAt = now;

    dbInstance.auditLogs.unshift({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: now,
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'RESOLVE_INJURY_FLAG',
      entityType: 'RISK_FLAG',
      entityId: flag.id,
      previousValue: prevFlagJson,
      newValue: JSON.stringify(flag)
    });

    return { status: 200, body: flag };
  }

  function handleVoidInjuryFlag(flagId, req, dbInstance) {
    const authErr = authenticateRequest(req, dbInstance);
    if (authErr) return authErr;
    const roleErr = requireRoleCheck(req, 'ADMIN', 'COACH');
    if (roleErr) return roleErr;

    const flag = dbInstance.injuryFlags.find(f => f.id === flagId);
    if (!flag) return { status: 404, body: { error: 'Injury flag not found' } };

    if (flag.source === 'ACWR_AUTO') {
      return { status: 403, body: { error: 'Forbidden: Automatic ACWR flags cannot be voided or deleted.' } };
    }

    if (req.user.role === 'COACH') {
      const isCreator = flag.createdBy === req.user.name || flag.createdBy === req.user.id;
      const isTeamCoach = req.user.teamId && req.user.teamId === flag.teamId;
      if (!isCreator && !isTeamCoach) {
        return { status: 403, body: { error: 'Forbidden: Coaches can only void injury flags created for their team.' } };
      }
    }

    if (flag.status === 'VOIDED') {
      return { status: 409, body: { error: 'Conflict: Injury flag is already voided.' } };
    }

    const { voidReason } = req.body || {};
    if (!voidReason || typeof voidReason !== 'string' || !voidReason.trim()) {
      return { status: 400, body: { error: 'voidReason is required to void an injury flag.' } };
    }

    const prevFlagJson = JSON.stringify(flag);
    const now = new Date().toISOString();

    flag.status = 'VOIDED';
    flag.voidedBy = req.user.name || req.user.id || 'Admin';
    flag.voidedAt = now;
    flag.voidReason = voidReason.trim();

    dbInstance.auditLogs.unshift({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: now,
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'VOID_INJURY_FLAG',
      entityType: 'RISK_FLAG',
      entityId: flag.id,
      previousValue: prevFlagJson,
      newValue: JSON.stringify(flag)
    });

    return { status: 200, body: flag };
  }

  function handleGetInjuryFlags(req, dbInstance) {
    const { status, playerId } = req.query || {};
    let flags = [...dbInstance.injuryFlags];

    if (playerId && typeof playerId === 'string') {
      flags = flags.filter(f => f.playerId === playerId);
    }

    if (status && typeof status === 'string') {
      if (status.toUpperCase() !== 'ALL') {
        flags = flags.filter(f => f.status === status.toUpperCase());
      }
    } else {
      flags = flags.filter(f => f.status === 'ACTIVE');
    }

    const highRisk = flags.filter(f => (f.severity === 'HIGH' || f.riskLevel === 'HIGH'));
    const moderateRisk = flags.filter(f => (f.severity === 'MODERATE' || f.riskLevel === 'MODERATE'));
    const lowRisk = flags.filter(f => (f.severity === 'LOW' || f.riskLevel === 'LOW'));

    return {
      status: 200,
      body: {
        flags,
        summary: {
          highCount: highRisk.length,
          moderateCount: moderateRisk.length,
          lowCount: lowRisk.length,
          totalTracked: flags.length
        },
        clinicalDisclaimer: 'All flags and risk tiers are statistical workload & fatigue models or manual staff logs, NOT medical diagnoses.'
      }
    };
  }

  beforeEach(() => {
    adminUser = { id: 'usr-admin-1', name: 'Prof. David Vance', role: 'ADMIN' };
    coachTeam1User = { id: 'usr-coach-1', name: 'Elena Rostova', role: 'COACH', teamId: 'team-1' };
    coachTeam2User = { id: 'usr-coach-2', name: 'Marcus Sterling', role: 'COACH', teamId: 'team-2' };
    playerUser = { id: 'usr-ply-1', name: 'Julian Reyes', role: 'PLAYER', teamId: 'team-1' };
    viewerUser = { id: 'usr-viewer-1', name: 'Campus Spectator', role: 'VIEWER' };

    adminToken = generateToken(adminUser);
    coach1Token = generateToken(coachTeam1User);
    coach2Token = generateToken(coachTeam2User);
    playerToken = generateToken(playerUser);
    viewerToken = generateToken(viewerUser);

    db = {
      users: [adminUser, coachTeam1User, coachTeam2User, playerUser, viewerUser],
      players: [
        { id: 'ply-1', name: 'Julian Reyes', teamId: 'team-1', teamName: 'Apex Strikers', eligibilityStatus: 'VERIFIED', status: 'ACTIVE' },
        { id: 'ply-2', name: 'Mateo Hernandez', teamId: 'team-1', teamName: 'Apex Strikers', eligibilityStatus: 'VERIFIED', status: 'ACTIVE' },
        { id: 'ply-3', name: 'Andre Dubois', teamId: 'team-2', teamName: 'Vanguard FC', eligibilityStatus: 'VERIFIED', status: 'ACTIVE' }
      ],
      injuryFlags: [],
      auditLogs: []
    };

    recalculateWorkloadsAndRisks(db);
  });

  describe('1. Permissions & Access Control', () => {
    it('should return 401 when no token is provided', () => {
      const res = handleCreateInjuryFlag('ply-1', { headers: {} }, db);
      assert.strictEqual(res.status, 401);
      assert.match(res.body.error, /Authentication required/);
    });

    it('should return 403 when PLAYER or VIEWER role attempts to create flag', () => {
      const resPlayer = handleCreateInjuryFlag('ply-1', {
        headers: { authorization: `Bearer ${playerToken}` },
        body: { category: 'INJURY', severity: 'HIGH', notes: 'Test' }
      }, db);
      assert.strictEqual(resPlayer.status, 403);

      const resViewer = handleCreateInjuryFlag('ply-1', {
        headers: { authorization: `Bearer ${viewerToken}` },
        body: { category: 'INJURY', severity: 'HIGH', notes: 'Test' }
      }, db);
      assert.strictEqual(resViewer.status, 403);
    });

    it('should return 403 when COACH attempts to create flag for a player on another team', () => {
      const res = handleCreateInjuryFlag('ply-1', {
        headers: { authorization: `Bearer ${coach2Token}` },
        body: { category: 'INJURY', severity: 'HIGH', notes: 'Ankle sprain' }
      }, db);
      assert.strictEqual(res.status, 403);
      assert.match(res.body.error, /own team/);
    });

    it('should succeed (201) when COACH creates flag for player on their own team', () => {
      const res = handleCreateInjuryFlag('ply-1', {
        headers: { authorization: `Bearer ${coach1Token}` },
        body: { category: 'INJURY', severity: 'HIGH', notes: 'Hamstring strain during training' }
      }, db);
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.source, 'MANUAL');
      assert.strictEqual(res.body.category, 'INJURY');
      assert.strictEqual(res.body.severity, 'HIGH');
      assert.strictEqual(res.body.status, 'ACTIVE');
      assert.strictEqual(res.body.createdBy, 'Elena Rostova');
    });

    it('should succeed (201) when ADMIN creates flag for any player', () => {
      const res = handleCreateInjuryFlag('ply-3', {
        headers: { authorization: `Bearer ${adminToken}` },
        body: { category: 'SUSPENSION', severity: 'HIGH', notes: 'Red card suspension' }
      }, db);
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.source, 'MANUAL');
      assert.strictEqual(res.body.category, 'SUSPENSION');
    });

    it('should return 404 for unknown player ID', () => {
      const res = handleCreateInjuryFlag('unknown-player-id', {
        headers: { authorization: `Bearer ${adminToken}` },
        body: { category: 'INJURY', severity: 'LOW' }
      }, db);
      assert.strictEqual(res.status, 404);
      assert.match(res.body.error, /Player not found/);
    });
  });

  describe('2. Input Validation', () => {
    it('should return 400 for invalid category', () => {
      const res = handleCreateInjuryFlag('ply-1', {
        headers: { authorization: `Bearer ${coach1Token}` },
        body: { category: 'INVALID_CATEGORY', severity: 'HIGH' }
      }, db);
      assert.strictEqual(res.status, 400);
      assert.match(res.body.error, /Invalid category/);
    });

    it('should return 400 for invalid severity', () => {
      const res = handleCreateInjuryFlag('ply-1', {
        headers: { authorization: `Bearer ${coach1Token}` },
        body: { category: 'INJURY', severity: 'SUPER_HIGH' }
      }, db);
      assert.strictEqual(res.status, 400);
      assert.match(res.body.error, /Invalid severity/);
    });

    it('should return 400 when notes exceed 500 characters', () => {
      const res = handleCreateInjuryFlag('ply-1', {
        headers: { authorization: `Bearer ${coach1Token}` },
        body: { category: 'INJURY', severity: 'LOW', notes: 'x'.repeat(501) }
      }, db);
      assert.strictEqual(res.status, 400);
      assert.match(res.body.error, /Notes cannot exceed 500 characters/);
    });
  });

  describe('3. Edit Active Manual Flags & Conflicts', () => {
    let createdFlag;

    beforeEach(() => {
      const res = handleCreateInjuryFlag('ply-1', {
        headers: { authorization: `Bearer ${coach1Token}` },
        body: { category: 'INJURY', severity: 'HIGH', notes: 'Initial severe sprain' }
      }, db);
      createdFlag = res.body;
    });

    it('should edit category, severity, and notes of an ACTIVE manual flag', () => {
      const res = handleUpdateInjuryFlag(createdFlag.id, {
        headers: { authorization: `Bearer ${coach1Token}` },
        body: { category: 'INJURY', severity: 'MODERATE', notes: 'Swelling reduced to moderate strain' }
      }, db);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.severity, 'MODERATE');
      assert.strictEqual(res.body.notes, 'Swelling reduced to moderate strain');
      assert.strictEqual(res.body.status, 'ACTIVE');
      assert.strictEqual(res.body.updatedBy, coachTeam1User.name);
      assert.ok(res.body.updatedAt);
    });

    it('should return 409 when editing a RESOLVED flag', () => {
      handleResolveInjuryFlag(createdFlag.id, {
        headers: { authorization: `Bearer ${coach1Token}` }
      }, db);

      const res = handleUpdateInjuryFlag(createdFlag.id, {
        headers: { authorization: `Bearer ${coach1Token}` },
        body: { notes: 'Trying to modify after resolve' }
      }, db);
      assert.strictEqual(res.status, 409);
      assert.match(res.body.error, /RESOLVED/);
    });

    it('should return 409 when editing a VOIDED flag', () => {
      handleVoidInjuryFlag(createdFlag.id, {
        headers: { authorization: `Bearer ${coach1Token}` },
        body: { voidReason: 'Entered in error' }
      }, db);

      const res = handleUpdateInjuryFlag(createdFlag.id, {
        headers: { authorization: `Bearer ${coach1Token}` },
        body: { notes: 'Trying to modify after void' }
      }, db);
      assert.strictEqual(res.status, 409);
      assert.match(res.body.error, /VOIDED/);
    });

    it('should return 403 when a coach from another team tries to edit the flag', () => {
      const res = handleUpdateInjuryFlag(createdFlag.id, {
        headers: { authorization: `Bearer ${coach2Token}` },
        body: { severity: 'LOW' }
      }, db);
      assert.strictEqual(res.status, 403);
    });
  });

  describe('4. Resolve Flow & Double-Resolve Prevention', () => {
    let createdFlag;

    beforeEach(() => {
      const res = handleCreateInjuryFlag('ply-1', {
        headers: { authorization: `Bearer ${coach1Token}` },
        body: { category: 'ILLNESS', severity: 'MODERATE', notes: 'Fever and fatigue' }
      }, db);
      createdFlag = res.body;
    });

    it('should mark flag as RESOLVED with resolvedBy and resolvedAt', () => {
      const res = handleResolveInjuryFlag(createdFlag.id, {
        headers: { authorization: `Bearer ${coach1Token}` }
      }, db);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.status, 'RESOLVED');
      assert.strictEqual(res.body.resolvedBy, coachTeam1User.name);
      assert.ok(res.body.resolvedAt);
    });

    it('should return 409 on double resolve attempt', () => {
      handleResolveInjuryFlag(createdFlag.id, {
        headers: { authorization: `Bearer ${coach1Token}` }
      }, db);

      const res = handleResolveInjuryFlag(createdFlag.id, {
        headers: { authorization: `Bearer ${coach1Token}` }
      }, db);
      assert.strictEqual(res.status, 409);
      assert.match(res.body.error, /already RESOLVED/);
    });
  });

  describe('5. Soft-Delete (Void) Flow & Required Reason', () => {
    let createdFlag;

    beforeEach(() => {
      const res = handleCreateInjuryFlag('ply-1', {
        headers: { authorization: `Bearer ${coach1Token}` },
        body: { category: 'INJURY', severity: 'HIGH', notes: 'Knee inflammation' }
      }, db);
      createdFlag = res.body;
    });

    it('should return 400 if voidReason is missing', () => {
      const res = handleVoidInjuryFlag(createdFlag.id, {
        headers: { authorization: `Bearer ${coach1Token}` },
        body: {}
      }, db);
      assert.strictEqual(res.status, 400);
      assert.match(res.body.error, /voidReason is required/);
    });

    it('should soft-delete flag, set VOIDED, voidReason, and retain record in db', () => {
      const initialCount = db.injuryFlags.length;

      const res = handleVoidInjuryFlag(createdFlag.id, {
        headers: { authorization: `Bearer ${coach1Token}` },
        body: { voidReason: 'Medical scan confirmed no structural knee damage; athlete cleared.' }
      }, db);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.status, 'VOIDED');
      assert.strictEqual(res.body.voidReason, 'Medical scan confirmed no structural knee damage; athlete cleared.');
      assert.strictEqual(res.body.voidedBy, coachTeam1User.name);
      assert.ok(res.body.voidedAt);

      // Verify record is preserved in db (not deleted)
      assert.strictEqual(db.injuryFlags.length, initialCount);
      const found = db.injuryFlags.find(f => f.id === createdFlag.id);
      assert.ok(found);
      assert.strictEqual(found.status, 'VOIDED');
    });

    it('should return 409 when attempting to void an already voided flag', () => {
      handleVoidInjuryFlag(createdFlag.id, {
        headers: { authorization: `Bearer ${coach1Token}` },
        body: { voidReason: 'Initial void' }
      }, db);

      const res = handleVoidInjuryFlag(createdFlag.id, {
        headers: { authorization: `Bearer ${coach1Token}` },
        body: { voidReason: 'Second void attempt' }
      }, db);
      assert.strictEqual(res.status, 409);
      assert.match(res.body.error, /already voided/);
    });
  });

  describe('6. ACWR_AUTO Immutability (Read-Only Protection)', () => {
    let autoFlag;

    beforeEach(() => {
      autoFlag = db.injuryFlags.find(f => f.source === 'ACWR_AUTO');
      assert.ok(autoFlag, 'Must have auto flag in db');
    });

    it('should return 403 with clear message when attempting to edit ACWR_AUTO flag', () => {
      const res = handleUpdateInjuryFlag(autoFlag.id, {
        headers: { authorization: `Bearer ${adminToken}` },
        body: { severity: 'LOW', notes: 'Trying to override automated flag' }
      }, db);
      assert.strictEqual(res.status, 403);
      assert.match(res.body.error, /Automatic ACWR flags cannot be modified manually/);
    });

    it('should return 403 when attempting to resolve ACWR_AUTO flag', () => {
      const res = handleResolveInjuryFlag(autoFlag.id, {
        headers: { authorization: `Bearer ${adminToken}` }
      }, db);
      assert.strictEqual(res.status, 403);
      assert.match(res.body.error, /Automatic ACWR flags cannot be resolved/);
    });

    it('should return 403 when attempting to void ACWR_AUTO flag', () => {
      const res = handleVoidInjuryFlag(autoFlag.id, {
        headers: { authorization: `Bearer ${adminToken}` },
        body: { voidReason: 'Trying to delete ACWR flag' }
      }, db);
      assert.strictEqual(res.status, 403);
      assert.match(res.body.error, /Automatic ACWR flags cannot be voided/);
    });
  });

  describe('7. Kickoff Clearance Gate Enforcements', () => {
    it('should block player at kickoff clearance gate when ACTIVE HIGH manual flag exists', () => {
      const flagRes = handleCreateInjuryFlag('ply-1', {
        headers: { authorization: `Bearer ${coach1Token}` },
        body: { category: 'INJURY', severity: 'HIGH', notes: 'Hamstring tear' }
      }, db);

      const targetPlayer = db.players.find(p => p.id === 'ply-1');
      const clearance = isPlayerClearedForKickoff(targetPlayer, db.injuryFlags);

      assert.strictEqual(clearance.cleared, false);
      assert.match(clearance.reason, /blocked at kickoff clearance gate/);
      assert.match(clearance.reason, /HIGH/);

      // Resolve flag -> player must be cleared
      handleResolveInjuryFlag(flagRes.body.id, {
        headers: { authorization: `Bearer ${coach1Token}` }
      }, db);

      const clearanceAfterResolve = isPlayerClearedForKickoff(targetPlayer, db.injuryFlags);
      assert.strictEqual(clearanceAfterResolve.cleared, true);
    });

    it('should block player at kickoff clearance gate when ACTIVE SUSPENSION flag exists', () => {
      const flagRes = handleCreateInjuryFlag('ply-1', {
        headers: { authorization: `Bearer ${adminToken}` },
        body: { category: 'SUSPENSION', severity: 'LOW', notes: 'Direct red card match ban' }
      }, db);

      const targetPlayer = db.players.find(p => p.id === 'ply-1');
      const clearance = isPlayerClearedForKickoff(targetPlayer, db.injuryFlags);

      assert.strictEqual(clearance.cleared, false);
      assert.match(clearance.reason, /SUSPENSION/);

      // Void flag -> player must be cleared
      handleVoidInjuryFlag(flagRes.body.id, {
        headers: { authorization: `Bearer ${adminToken}` },
        body: { voidReason: 'Disciplinary appeal upheld' }
      }, db);

      const clearanceAfterVoid = isPlayerClearedForKickoff(targetPlayer, db.injuryFlags);
      assert.strictEqual(clearanceAfterVoid.cleared, true);
    });

    it('should allow player with MODERATE or LOW flag with a warning', () => {
      handleCreateInjuryFlag('ply-1', {
        headers: { authorization: `Bearer ${coach1Token}` },
        body: { category: 'ILLNESS', severity: 'MODERATE', notes: 'Mild chest cold' }
      }, db);

      const targetPlayer = db.players.find(p => p.id === 'ply-1');
      const clearance = isPlayerClearedForKickoff(targetPlayer, db.injuryFlags);

      assert.strictEqual(clearance.cleared, true);
      assert.ok(clearance.warning);
      assert.match(clearance.warning, /MODERATE/);
    });
  });

  describe('8. Recalculation Safety (Preservation of Manual Flags)', () => {
    it('should strictly preserve manual flags across multiple recalculations', () => {
      const createRes = handleCreateInjuryFlag('ply-1', {
        headers: { authorization: `Bearer ${coach1Token}` },
        body: { category: 'INJURY', severity: 'HIGH', notes: 'Preservation test note' }
      }, db);
      const manualFlagId = createRes.body.id;

      // Recalculate 3 times
      recalculateWorkloadsAndRisks(db);
      recalculateWorkloadsAndRisks(db);
      recalculateWorkloadsAndRisks(db);

      const preservedFlag = db.injuryFlags.find(f => f.id === manualFlagId);
      assert.ok(preservedFlag, 'Manual flag must survive ACWR recalculation');
      assert.strictEqual(preservedFlag.source, 'MANUAL');
      assert.strictEqual(preservedFlag.category, 'INJURY');
      assert.strictEqual(preservedFlag.severity, 'HIGH');
      assert.strictEqual(preservedFlag.notes, 'Preservation test note');
      assert.strictEqual(preservedFlag.status, 'ACTIVE');
      assert.strictEqual(preservedFlag.createdBy, 'Elena Rostova');
    });
  });

  describe('9. Audit Trail Logging', () => {
    it('should write structured audit logs for ADD, UPDATE, RESOLVE, and VOID actions', () => {
      // 1. ADD
      const addRes = handleCreateInjuryFlag('ply-1', {
        headers: { authorization: `Bearer ${coach1Token}` },
        body: { category: 'INJURY', severity: 'HIGH', notes: 'Audit note' }
      }, db);
      const flagId = addRes.body.id;

      const addLog = db.auditLogs.find(l => l.action === 'ADD_INJURY_FLAG' && l.entityId === flagId);
      assert.ok(addLog);
      assert.strictEqual(addLog.entityType, 'RISK_FLAG');
      assert.strictEqual(addLog.userName, 'Elena Rostova');

      // 2. UPDATE
      handleUpdateInjuryFlag(flagId, {
        headers: { authorization: `Bearer ${coach1Token}` },
        body: { severity: 'MODERATE', notes: 'Audit note updated' }
      }, db);

      const updateLog = db.auditLogs.find(l => l.action === 'UPDATE_INJURY_FLAG' && l.entityId === flagId);
      assert.ok(updateLog);
      assert.ok(updateLog.previousValue);
      assert.ok(updateLog.newValue);

      // 3. RESOLVE
      handleResolveInjuryFlag(flagId, {
        headers: { authorization: `Bearer ${coach1Token}` }
      }, db);

      const resolveLog = db.auditLogs.find(l => l.action === 'RESOLVE_INJURY_FLAG' && l.entityId === flagId);
      assert.ok(resolveLog);
      assert.ok(resolveLog.previousValue);
      assert.ok(resolveLog.newValue);

      // 4. VOID (on new flag)
      const secondFlagRes = handleCreateInjuryFlag('ply-2', {
        headers: { authorization: `Bearer ${coach1Token}` },
        body: { category: 'SUSPENSION', severity: 'HIGH', notes: 'Void audit test' }
      }, db);
      const secondFlagId = secondFlagRes.body.id;

      handleVoidInjuryFlag(secondFlagId, {
        headers: { authorization: `Bearer ${coach1Token}` },
        body: { voidReason: 'Void audit reason' }
      }, db);

      const voidLog = db.auditLogs.find(l => l.action === 'VOID_INJURY_FLAG' && l.entityId === secondFlagId);
      assert.ok(voidLog);
      assert.ok(voidLog.previousValue);
      assert.ok(voidLog.newValue);
    });
  });

  describe('10. Query & Filter API', () => {
    it('should filter by default to ACTIVE, and support ?status=ALL, ?status=RESOLVED, and ?playerId=', () => {
      // Add and resolve one flag
      const flag1 = handleCreateInjuryFlag('ply-1', {
        headers: { authorization: `Bearer ${adminToken}` },
        body: { category: 'INJURY', severity: 'HIGH', notes: 'Flag 1' }
      }, db).body;

      handleResolveInjuryFlag(flag1.id, {
        headers: { authorization: `Bearer ${adminToken}` }
      }, db);

      // Add one active flag
      const flag2 = handleCreateInjuryFlag('ply-2', {
        headers: { authorization: `Bearer ${adminToken}` },
        body: { category: 'ILLNESS', severity: 'LOW', notes: 'Flag 2' }
      }, db).body;

      // Default query (ACTIVE only)
      const defaultRes = handleGetInjuryFlags({}, db);
      assert.strictEqual(defaultRes.status, 200);
      assert.ok(defaultRes.body.flags.every(f => f.status === 'ACTIVE'));
      assert.ok(defaultRes.body.flags.some(f => f.id === flag2.id));
      assert.ok(!defaultRes.body.flags.some(f => f.id === flag1.id));
      assert.ok(defaultRes.body.summary);
      assert.ok(defaultRes.body.clinicalDisclaimer);

      // Query ?status=ALL
      const allRes = handleGetInjuryFlags({ query: { status: 'ALL' } }, db);
      assert.ok(allRes.body.flags.some(f => f.id === flag1.id));
      assert.ok(allRes.body.flags.some(f => f.id === flag2.id));

      // Query ?status=RESOLVED
      const resolvedRes = handleGetInjuryFlags({ query: { status: 'RESOLVED' } }, db);
      assert.ok(resolvedRes.body.flags.every(f => f.status === 'RESOLVED'));
      assert.ok(resolvedRes.body.flags.some(f => f.id === flag1.id));

      // Query ?playerId=
      const playerRes = handleGetInjuryFlags({ query: { status: 'ALL', playerId: 'ply-2' } }, db);
      assert.ok(playerRes.body.flags.every(f => f.playerId === 'ply-2'));
    });
  });
});
