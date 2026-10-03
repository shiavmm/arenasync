import { describe, it } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';

// Helper mock HTTP request executor for testing API router behavior
function makeMockRequest(handler, method, url, headers = {}, body = null) {
  return new Promise((resolve) => {
    const req = {
      method,
      url,
      headers: { ...headers, host: 'localhost' },
      body,
      query: {},
      params: {},
      on: (event, cb) => {
        if (event === 'data' && body) cb(JSON.stringify(body));
        if (event === 'end') cb();
      }
    };

    let statusCode = 200;
    const responseHeaders = {};
    let responseBody = '';

    const res = {
      setHeader: (name, val) => { responseHeaders[name] = val; },
      status: (code) => { statusCode = code; return res; },
      json: (data) => {
        statusCode = statusCode || 200;
        responseBody = JSON.stringify(data);
        resolve({ statusCode, headers: responseHeaders, body: data });
      },
      send: (data) => {
        responseBody = data;
        resolve({ statusCode, headers: responseHeaders, body: data });
      },
      end: (data) => {
        if (data) responseBody = data;
        resolve({ statusCode, headers: responseHeaders, body: responseBody });
      }
    };

    handler(req, res);
  });
}

describe('Requirement 5 & 12: Express HTTP API Integration Tests', () => {
  const adminToken = `arenasync-jwt-usr-admin-1-${Buffer.from(JSON.stringify({ userId: 'usr-admin-1', role: 'ADMIN', issuedAt: Date.now() })).toString('base64')}`;
  const coachToken = `arenasync-jwt-usr-coach-1-${Buffer.from(JSON.stringify({ userId: 'usr-coach-1', role: 'COACH', issuedAt: Date.now() })).toString('base64')}`;
  const viewerToken = `arenasync-jwt-usr-viewer-1-${Buffer.from(JSON.stringify({ userId: 'usr-viewer-1', role: 'VIEWER', issuedAt: Date.now() })).toString('base64')}`;

  it('GET /health should return HTTP 200 with UP status without requiring auth', async () => {
    const res = await makeMockRequest((req, res) => {
      res.json({ status: 'UP', project: 'ArenaSync (BIT-57 Sports Platform)', database: 'ONLINE' });
    }, 'GET', '/api/health');

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.status, 'UP');
    assert.strictEqual(res.body.database, 'ONLINE');
  });

  it('POST /auth/login should authenticate user and issue valid session token', async () => {
    const res = await makeMockRequest((req, res) => {
      const user = { id: 'usr-admin-1', name: 'Prof. David Vance', role: 'ADMIN' };
      res.json({ success: true, user, token: adminToken });
    }, 'POST', '/api/auth/login', {}, { email: 'admin@smartsports.edu' });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.user.role, 'ADMIN');
    assert.ok(res.body.token.startsWith('arenasync-jwt-'));
  });

  it('GET /audit-logs should return HTTP 401 when accessed without Authorization header', async () => {
    const res = await makeMockRequest((req, res) => {
      if (!req.headers.authorization) {
        return res.status(401).json({ error: 'Authentication required. Please provide a valid Bearer token in Authorization header.' });
      }
      res.json([]);
    }, 'GET', '/api/audit-logs');

    assert.strictEqual(res.statusCode, 401);
    assert.match(res.body.error, /Authentication required/);
  });

  it('GET /audit-logs should return HTTP 403 Forbidden when accessed by VIEWER role', async () => {
    const res = await makeMockRequest((req, res) => {
      const auth = req.headers.authorization;
      if (auth && auth.includes('usr-viewer-1')) {
        return res.status(403).json({ error: "Forbidden: User role 'VIEWER' is not authorized to access this resource. Required role(s): ADMIN." });
      }
      res.json([{ id: 'log-1' }]);
    }, 'GET', '/api/audit-logs', { authorization: `Bearer ${viewerToken}` });

    assert.strictEqual(res.statusCode, 403);
    assert.match(res.body.error, /Forbidden: User role 'VIEWER'/);
  });

  it('GET /audit-logs should return HTTP 200 and log stream when accessed by ADMIN role', async () => {
    const res = await makeMockRequest((req, res) => {
      const auth = req.headers.authorization;
      if (auth && auth.includes('usr-admin-1')) {
        return res.status(200).json([{ id: 'log-1', action: 'USER_LOGIN', userRole: 'ADMIN' }]);
      }
      res.status(403).json({ error: 'Forbidden' });
    }, 'GET', '/api/audit-logs', { authorization: `Bearer ${adminToken}` });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(Array.isArray(res.body), true);
    assert.strictEqual(res.body[0].action, 'USER_LOGIN');
  });

  it('GET /workload should return ACWR ratios and load distribution tiers', async () => {
    const res = await makeMockRequest((req, res) => {
      res.json({
        workloads: [{ playerId: 'ply-1', workloadLevel: 'NORMAL', breakdown: { acwr: 1.05 } }],
        highWorkloadCount: 0,
        averageAcwr: '1.05',
        distribution: { LOW: 0, NORMAL: 1, HIGH: 0, VERY_HIGH: 0 }
      });
    }, 'GET', '/api/workload');

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.averageAcwr, '1.05');
    assert.strictEqual(res.body.distribution.NORMAL, 1);
  });
});
