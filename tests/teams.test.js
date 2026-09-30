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
