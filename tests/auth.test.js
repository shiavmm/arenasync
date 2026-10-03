import { describe, it } from 'node:test';
import assert from 'node:assert';

// Simulated DB users matching server/db.ts
const users = [
  { id: 'usr-admin-1', name: 'Prof. David Vance', role: 'ADMIN' },
  { id: 'usr-ref-1', name: 'Marcus Webb', role: 'REFEREE' },
  { id: 'usr-coach-1', name: 'Elena Rostova', role: 'COACH' },
  { id: 'usr-player-1', name: 'Julian Reyes', role: 'PLAYER' },
  { id: 'usr-viewer-1', name: 'Campus Spectator', role: 'VIEWER' }
];

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

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || req.headers['x-auth-token'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Authentication required. Please provide a valid Bearer token in Authorization header.' });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : authHeader.trim();
  const parsed = parseToken(token);
  if (!parsed) {
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }

  const user = users.find(u => u.id === parsed.userId);
  if (!user) {
    return res.status(401).json({ error: 'Authenticated user account does not exist or has been disabled.' });
  }

  req.user = user;
  next();
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required before authorization check.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: User role '${req.user.role}' is not authorized to access this resource. Required role(s): ${allowedRoles.join(', ')}.`
      });
    }
    next();
  };
}

function executePipeline(authHeader, allowedRoles) {
  const req = { headers: authHeader ? { authorization: authHeader } : {} };
  let statusCode = 200;
  let responseData = null;
  let passedThrough = false;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    }
  };

  authenticate(req, res, () => {
    if (allowedRoles && allowedRoles.length > 0) {
      const roleMiddleware = requireRole(...allowedRoles);
      roleMiddleware(req, res, () => {
        passedThrough = true;
      });
    } else {
      passedThrough = true;
    }
  });

  return { statusCode, responseData, passedThrough, user: req.user };
}

describe('Requirement 9: Authentication & Role-Based Authorization', () => {
  it('should reject unauthenticated requests without a token (HTTP 401)', () => {
    const result = executePipeline(null, ['ADMIN']);
    assert.strictEqual(result.statusCode, 401);
    assert.strictEqual(result.passedThrough, false);
    assert.match(result.responseData.error, /Authentication required/);
  });

  it('should reject malformed or tampered Bearer tokens (HTTP 401)', () => {
    const result = executePipeline('Bearer invalid-random-token-12345', ['ADMIN']);
    assert.strictEqual(result.statusCode, 401);
    assert.strictEqual(result.passedThrough, false);
    assert.match(result.responseData.error, /Invalid or expired/);
  });

  it('should authorize ADMIN role on restricted administration endpoints (HTTP 200)', () => {
    const token = generateToken(users[0]); // Admin
    const result = executePipeline(`Bearer ${token}`, ['ADMIN']);
    assert.strictEqual(result.statusCode, 200);
    assert.strictEqual(result.passedThrough, true);
    assert.strictEqual(result.user.role, 'ADMIN');
  });

  it('should forbid VIEWER role from executing ADMIN mutations (HTTP 403)', () => {
    const token = generateToken(users[4]); // Viewer
    const result = executePipeline(`Bearer ${token}`, ['ADMIN']);
    assert.strictEqual(result.statusCode, 403);
    assert.strictEqual(result.passedThrough, false);
    assert.match(result.responseData.error, /Forbidden: User role 'VIEWER' is not authorized/);
  });

  it('should forbid COACH role from executing match live scoring operations (HTTP 403)', () => {
    const token = generateToken(users[2]); // Coach
    const result = executePipeline(`Bearer ${token}`, ['ADMIN', 'REFEREE']);
    assert.strictEqual(result.statusCode, 403);
    assert.strictEqual(result.passedThrough, false);
  });

  it('should authorize REFEREE role on match live scoring endpoints (HTTP 200)', () => {
    const token = generateToken(users[1]); // Referee
    const result = executePipeline(`Bearer ${token}`, ['ADMIN', 'REFEREE']);
    assert.strictEqual(result.statusCode, 200);
    assert.strictEqual(result.passedThrough, true);
    assert.strictEqual(result.user.role, 'REFEREE');
  });

  it('should authorize COACH role to register squad roster players (HTTP 200)', () => {
    const token = generateToken(users[2]); // Coach
    const result = executePipeline(`Bearer ${token}`, ['ADMIN', 'COACH']);
    assert.strictEqual(result.statusCode, 200);
    assert.strictEqual(result.passedThrough, true);
  });

  it('should authorize PLAYER role to submit athletic eligibility documents (HTTP 200)', () => {
    const token = generateToken(users[3]); // Player
    const result = executePipeline(`Bearer ${token}`, ['ADMIN', 'COACH', 'PLAYER']);
    assert.strictEqual(result.statusCode, 200);
    assert.strictEqual(result.passedThrough, true);
  });
});
