import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

describe('Requirement 6: Standings & Championship Table Calculation', () => {
  let teams;

  beforeEach(() => {
    teams = [
      { id: 't1', name: 'Titan FC', played: 3, won: 2, draw: 1, lost: 0, goalsFor: 6, goalsAgainst: 2, goalDifference: 4, points: 7, rank: 0 },
      { id: 't2', name: 'Apex Strikers', played: 3, won: 2, draw: 0, lost: 1, goalsFor: 5, goalsAgainst: 3, goalDifference: 2, points: 6, rank: 0 },
      { id: 't3', name: 'Horizon United', played: 3, won: 1, draw: 1, lost: 1, goalsFor: 4, goalsAgainst: 4, goalDifference: 0, points: 4, rank: 0 }
    ];
  });

  function processMatchResult(homeTeam, awayTeam, homeScore, awayScore) {
    homeTeam.played += 1;
    awayTeam.played += 1;
    homeTeam.goalsFor += homeScore;
    homeTeam.goalsAgainst += awayScore;
    homeTeam.goalDifference = homeTeam.goalsFor - homeTeam.goalsAgainst;

    awayTeam.goalsFor += awayScore;
    awayTeam.goalsAgainst += homeScore;
    awayTeam.goalDifference = awayTeam.goalsFor - awayTeam.goalsAgainst;

    if (homeScore > awayScore) {
      homeTeam.won += 1;
      homeTeam.points += 3;
      awayTeam.lost += 1;
    } else if (homeScore < awayScore) {
      awayTeam.won += 1;
      awayTeam.points += 3;
      homeTeam.lost += 1;
    } else {
      homeTeam.draw += 1;
      homeTeam.points += 1;
      awayTeam.draw += 1;
      awayTeam.points += 1;
    }
  }

  function rankStandings(standingsList) {
    const sorted = [...standingsList].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });

    sorted.forEach((team, index) => {
      team.rank = index + 1;
    });

    return sorted;
  }

  it('should accurately compute points and goal difference when home team wins (3 points to winner, 0 to loser)', () => {
    const t1 = teams.find(t => t.id === 't1');
    const t2 = teams.find(t => t.id === 't2');

    processMatchResult(t1, t2, 2, 1);

    assert.strictEqual(t1.points, 10);
    assert.strictEqual(t1.won, 3);
    assert.strictEqual(t1.goalsFor, 8);
    assert.strictEqual(t1.goalsAgainst, 3);
    assert.strictEqual(t1.goalDifference, 5);

    assert.strictEqual(t2.points, 6);
    assert.strictEqual(t2.lost, 2);
    assert.strictEqual(t2.goalDifference, 1);
  });

  it('should award 1 point each on draw and update goal difference accordingly', () => {
    const t2 = teams.find(t => t.id === 't2');
    const t3 = teams.find(t => t.id === 't3');

    processMatchResult(t2, t3, 2, 2);

    assert.strictEqual(t2.points, 7);
    assert.strictEqual(t2.draw, 1);
    assert.strictEqual(t3.points, 5);
    assert.strictEqual(t3.draw, 2);
  });

  it('should rank teams primarily by Points, then Goal Difference, then Goals For', () => {
    const ranked = rankStandings(teams);
    assert.strictEqual(ranked[0].name, 'Titan FC');
    assert.strictEqual(ranked[0].rank, 1);
    assert.strictEqual(ranked[1].name, 'Apex Strikers');
    assert.strictEqual(ranked[1].rank, 2);
    assert.strictEqual(ranked[2].name, 'Horizon United');
    assert.strictEqual(ranked[2].rank, 3);
  });
});
