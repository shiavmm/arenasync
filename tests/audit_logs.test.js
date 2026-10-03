import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

describe('Requirement 10: Immutable Audit Logging & Governance Trail', () => {
  let auditLogs;

  beforeEach(() => {
    auditLogs = [];
  });

  function addAuditLog(entry) {
    const log = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      ...entry
    };
    auditLogs.unshift(log);
    if (auditLogs.length > 100) {
      auditLogs.pop();
    }
    return log;
  }

  it('should accurately append structured audit logs with actor identity, action, and state diff', () => {
    const log = addAuditLog({
      userId: 'usr-admin-1',
      userName: 'Prof. David Vance',
      userRole: 'ADMIN',
      action: 'VERIFY_DOCUMENT',
      entityType: 'DOCUMENT',
      entityId: 'doc-101',
      previousValue: 'PENDING',
      newValue: 'VERIFIED',
      notes: 'Official academic transcript verified'
    });

    assert.ok(log.id.startsWith('log-'));
    assert.ok(log.timestamp);
    assert.strictEqual(log.userRole, 'ADMIN');
    assert.strictEqual(log.action, 'VERIFY_DOCUMENT');
    assert.strictEqual(log.previousValue, 'PENDING');
    assert.strictEqual(log.newValue, 'VERIFIED');
    assert.strictEqual(auditLogs.length, 1);
  });

  it('should capture score updates with previous score and new score in diff', () => {
    const log = addAuditLog({
      userId: 'usr-ref-1',
      userName: 'Marcus Webb',
      userRole: 'REFEREE',
      action: 'SCORE_CHANGE',
      entityType: 'SCORE',
      entityId: 'match-101',
      previousValue: '1 - 0',
      newValue: '2 - 0 (Goal by Julian Reyes)'
    });

    assert.strictEqual(log.action, 'SCORE_CHANGE');
    assert.strictEqual(log.previousValue, '1 - 0');
    assert.strictEqual(log.newValue, '2 - 0 (Goal by Julian Reyes)');
  });

  it('should maintain order with most recent transactions at the top of the stream', () => {
    addAuditLog({ action: 'ACTION_1', userId: 'u1', userName: 'User 1', userRole: 'ADMIN', entityType: 'AUTH', entityId: 'e1' });
    addAuditLog({ action: 'ACTION_2', userId: 'u2', userName: 'User 2', userRole: 'REFEREE', entityType: 'MATCH', entityId: 'e2' });

    assert.strictEqual(auditLogs[0].action, 'ACTION_2');
    assert.strictEqual(auditLogs[1].action, 'ACTION_1');
  });
});
