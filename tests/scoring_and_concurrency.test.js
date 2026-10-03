import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

describe('Requirements 5 & 11: Live Scoring, Optimistic Locking & Concurrency Control', () => {
  let match;

  beforeEach(() => {
    match = {
      id: 'match-1',
      homeTeamName: 'Titan FC',
      awayTeamName: 'Apex Strikers',
      homeScore: 1,
      awayScore: 0,
      version: 1,
      status: 'LIVE',
      scoreUpdates: []
    };
  });

  function updateScore(targetMatch, homeScore, awayScore, expectedVersion, userId, userName) {
    if (targetMatch.status === 'COMPLETED') {
      const err = new Error('Score is locked because this match is marked COMPLETED');
      err.status = 400;
      throw err;
    }

    // Optimistic Concurrency Conflict Detection
    if (expectedVersion !== undefined && targetMatch.version !== expectedVersion) {
      const err = new Error('Concurrency conflict: Match state was updated by another user');
      err.status = 409;
      err.currentVersion = targetMatch.version;
      throw err;
    }

    if (homeScore < 0 || awayScore < 0) {
      const err = new Error('Scores cannot be negative');
      err.status = 400;
      throw err;
    }

    const prevHome = targetMatch.homeScore;
    const prevAway = targetMatch.awayScore;

    targetMatch.homeScore = homeScore;
    targetMatch.awayScore = awayScore;
    targetMatch.version += 1;

    targetMatch.scoreUpdates.unshift({
      id: `sc-${Date.now()}`,
      userId,
      userName,
      prevHomeScore: prevHome,
      prevAwayScore: prevAway,
      newHomeScore: homeScore,
      newAwayScore: awayScore,
      version: targetMatch.version
    });

    return targetMatch;
  }

  it('should successfully update score and increment atomic version counter (v1 -> v2)', () => {
    const updated = updateScore(match, 2, 0, 1, 'usr-ref-1', 'Marcus Webb');
    assert.strictEqual(updated.homeScore, 2);
    assert.strictEqual(updated.awayScore, 0);
    assert.strictEqual(updated.version, 2);
    assert.strictEqual(updated.scoreUpdates.length, 1);
  });

  it('should reject stale updates with a Concurrency Conflict (HTTP 409) when version does not match', () => {
    // Official 1 increments score (version becomes 2)
    updateScore(match, 2, 0, 1, 'usr-ref-1', 'Marcus Webb');
    assert.strictEqual(match.version, 2);

    // Official 2 sends an update with stale expectedVersion 1
    assert.throws(
      () => updateScore(match, 1, 1, 1, 'usr-ref-2', 'Assistant Official'),
      err => {
        assert.strictEqual(err.status, 409);
        assert.match(err.message, /Concurrency conflict/);
        return true;
      }
    );
  });

  it('should reject negative scores with HTTP 400', () => {
    assert.throws(
      () => updateScore(match, -1, 0, 1, 'usr-ref-1', 'Marcus Webb'),
      err => {
        assert.strictEqual(err.status, 400);
        assert.match(err.message, /Scores cannot be negative/);
        return true;
      }
    );
  });

  it('should lock score adjustments once a match is marked COMPLETED', () => {
    match.status = 'COMPLETED';
    assert.throws(
      () => updateScore(match, 2, 0, 1, 'usr-ref-1', 'Marcus Webb'),
      err => {
        assert.strictEqual(err.status, 400);
        assert.match(err.message, /Score is locked/);
        return true;
      }
    );
  });
});
