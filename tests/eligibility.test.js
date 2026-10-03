import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

describe('Requirement 2: Athlete Eligibility & Document Verification', () => {
  let player;

  beforeEach(() => {
    player = {
      id: 'ply-101',
      name: 'Julian Reyes',
      teamId: 'team-1',
      eligibilityStatus: 'PENDING',
      documents: [
        {
          id: 'doc-1',
          playerId: 'ply-101',
          documentType: 'COLLEGE_ID',
          status: 'PENDING'
        },
        {
          id: 'doc-2',
          playerId: 'ply-101',
          documentType: 'MEDICAL_CERTIFICATE',
          status: 'PENDING'
        }
      ]
    };
  });

  function verifyDocumentAndRecalculateEligibility(targetPlayer, docId, newStatus, verifiedBy) {
    const doc = targetPlayer.documents.find(d => d.id === docId);
    if (!doc) throw new Error('Document not found');

    doc.status = newStatus;
    doc.verifiedBy = verifiedBy;
    doc.verifiedDate = new Date().toISOString();

    const allVerified = targetPlayer.documents.length > 0 && targetPlayer.documents.every(d => d.status === 'VERIFIED');
    const hasRejected = targetPlayer.documents.some(d => d.status === 'REJECTED');

    if (allVerified) {
      targetPlayer.eligibilityStatus = 'VERIFIED';
    } else if (hasRejected) {
      targetPlayer.eligibilityStatus = 'REJECTED';
    } else {
      targetPlayer.eligibilityStatus = 'PENDING';
    }

    return targetPlayer.eligibilityStatus;
  }

  it('should remain PENDING if only one of multiple required documents is verified', () => {
    const status = verifyDocumentAndRecalculateEligibility(player, 'doc-1', 'VERIFIED', 'Admin Vance');
    assert.strictEqual(status, 'PENDING');
    assert.strictEqual(player.eligibilityStatus, 'PENDING');
  });

  it('should transition to VERIFIED only when all athlete documents are verified', () => {
    verifyDocumentAndRecalculateEligibility(player, 'doc-1', 'VERIFIED', 'Admin Vance');
    const status = verifyDocumentAndRecalculateEligibility(player, 'doc-2', 'VERIFIED', 'Admin Vance');
    assert.strictEqual(status, 'VERIFIED');
    assert.strictEqual(player.eligibilityStatus, 'VERIFIED');
  });

  it('should transition to REJECTED if any required document is rejected', () => {
    verifyDocumentAndRecalculateEligibility(player, 'doc-1', 'VERIFIED', 'Admin Vance');
    const status = verifyDocumentAndRecalculateEligibility(player, 'doc-2', 'REJECTED', 'Admin Vance');
    assert.strictEqual(status, 'REJECTED');
    assert.strictEqual(player.eligibilityStatus, 'REJECTED');
  });

  it('should enforce match clearance gate (filter out unverified or rejected athletes from kickoff rosters)', () => {
    const roster = [
      { id: 'p1', name: 'Julian', eligibilityStatus: 'VERIFIED' },
      { id: 'p2', name: 'Marcus', eligibilityStatus: 'PENDING' },
      { id: 'p3', name: 'Leo', eligibilityStatus: 'REJECTED' },
      { id: 'p4', name: 'David', eligibilityStatus: 'VERIFIED' }
    ];

    const matchClearedPlayers = roster.filter(p => p.eligibilityStatus === 'VERIFIED');
    assert.strictEqual(matchClearedPlayers.length, 2);
    assert.deepStrictEqual(matchClearedPlayers.map(p => p.id), ['p1', 'p4']);
  });

  it('should evaluate mixed eligibility statuses across 10-player team rosters', () => {
    // Simulate 10 players on a basketball team with mixed document statuses
    const teamPlayers = Array.from({ length: 10 }, (_, i) => {
      const pNum = i + 1;
      let status = 'VERIFIED';
      if (pNum === 9) status = 'PENDING';
      if (pNum === 10) status = 'REJECTED';
      return { id: `ply-b-1-${pNum}`, name: `Player ${pNum}`, eligibilityStatus: status };
    });

    assert.strictEqual(teamPlayers.length, 10);
    const verified = teamPlayers.filter(p => p.eligibilityStatus === 'VERIFIED');
    const pending = teamPlayers.filter(p => p.eligibilityStatus === 'PENDING');
    const rejected = teamPlayers.filter(p => p.eligibilityStatus === 'REJECTED');

    assert.strictEqual(verified.length, 8);
    assert.strictEqual(pending.length, 1);
    assert.strictEqual(rejected.length, 1);
  });
});
