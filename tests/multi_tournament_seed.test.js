import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Multi-Tournament Support & Synthetic Basketball Seed Validation', () => {
  let seedData;

  beforeEach(() => {
    const seedPath = path.resolve(__dirname, '../data/seed-v1.json');
    assert.strictEqual(fs.existsSync(seedPath), true, 'data/seed-v1.json must exist');
    seedData = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
  });

  it('should contain valid top-level metadata in seed-v1.json', () => {
    assert.strictEqual(seedData.version, '1.0.0');
    assert.strictEqual(typeof seedData.generatedAt, 'string');
    assert.strictEqual(seedData.generator, 'scripts/generate-seed-data.js');
    assert.strictEqual(seedData.seed, 42);
    assert.strictEqual(seedData.isSynthetic, true);
    assert.match(seedData.note, /synthetic/i);
  });

  it('should confirm both tournaments exist (tour-1 Football and tour-2 Basketball)', () => {
    const tournaments = seedData.tournaments;
    assert.strictEqual(tournaments.length >= 2, true);

    const tour1 = tournaments.find(t => t.id === 'tour-1');
    const tour2 = tournaments.find(t => t.id === 'tour-2');

    assert.ok(tour1, 'tour-1 (Football) must exist');
    assert.strictEqual(tour1.sport, 'Football / Soccer');
    assert.strictEqual(tour1.format, 'SINGLE_ELIMINATION');

    assert.ok(tour2, 'tour-2 (Basketball) must exist');
    assert.strictEqual(tour2.sport, 'Basketball');
    assert.strictEqual(tour2.format, 'SINGLE_ELIMINATION');
  });

  it('should confirm both tournaments have exactly 8 registered teams', () => {
    const tour1 = seedData.tournaments.find(t => t.id === 'tour-1');
    const tour2 = seedData.tournaments.find(t => t.id === 'tour-2');

    assert.strictEqual(tour1.registeredTeamIds.length, 8);
    assert.strictEqual(tour2.registeredTeamIds.length, 8);

    const tour1Teams = seedData.teams.filter(t => tour1.registeredTeamIds.includes(t.id));
    const tour2Teams = seedData.teams.filter(t => tour2.registeredTeamIds.includes(t.id));

    assert.strictEqual(tour1Teams.length, 8);
    assert.strictEqual(tour2Teams.length, 8);

    // Verify sport attribution
    tour1Teams.forEach(t => assert.strictEqual(t.sport, 'Football / Soccer'));
    tour2Teams.forEach(t => assert.strictEqual(t.sport, 'Basketball'));
  });

  it('should generate a 7-match single elimination bracket with correct topological linkage for both tournaments', () => {
    function generateBracket(registeredTeams, tournamentId) {
      const totalSlots = 8;
      const round1Count = totalSlots / 2;
      const matches = [];

      const qfMatches = [];
      for (let i = 0; i < round1Count; i++) {
        const home = registeredTeams[i * 2] || { id: 'tbd', name: 'BYE' };
        const away = registeredTeams[i * 2 + 1] || { id: 'tbd', name: 'BYE' };
        const m = {
          id: `match-${tournamentId}-qf-${i + 1}`,
          tournamentId,
          roundName: `Quarter-Final ${i + 1}`,
          roundIndex: 1,
          homeTeamId: home.id,
          homeTeamName: home.name,
          awayTeamId: away.id,
          awayTeamName: away.name,
          status: 'SCHEDULED'
        };
        qfMatches.push(m);
        matches.push(m);
      }

      const sfMatches = [];
      for (let i = 0; i < 2; i++) {
        const m = {
          id: `match-${tournamentId}-sf-${i + 1}`,
          tournamentId,
          roundName: `Semi-Final ${i + 1}`,
          roundIndex: 2,
          homeTeamId: '',
          homeTeamName: `Winner QF ${i * 2 + 1}`,
          awayTeamId: '',
          awayTeamName: `Winner QF ${i * 2 + 2}`,
          status: 'SCHEDULED'
        };
        sfMatches.push(m);
        matches.push(m);

        qfMatches[i * 2].nextMatchId = m.id;
        qfMatches[i * 2].nextMatchSlot = 'home';
        qfMatches[i * 2 + 1].nextMatchId = m.id;
        qfMatches[i * 2 + 1].nextMatchSlot = 'away';
      }

      const finalMatch = {
        id: `match-${tournamentId}-fn-1`,
        tournamentId,
        roundName: 'Championship Final',
        roundIndex: 3,
        homeTeamId: '',
        homeTeamName: 'Winner SF 1',
        awayTeamId: '',
        awayTeamName: 'Winner SF 2',
        status: 'SCHEDULED'
      };
      matches.push(finalMatch);

      sfMatches[0].nextMatchId = finalMatch.id;
      sfMatches[0].nextMatchSlot = 'home';
      sfMatches[1].nextMatchId = finalMatch.id;
      sfMatches[1].nextMatchSlot = 'away';

      return matches;
    }

    const tour1Teams = seedData.teams.filter(t => seedData.tournaments.find(tour => tour.id === 'tour-1').registeredTeamIds.includes(t.id));
    const tour2Teams = seedData.teams.filter(t => seedData.tournaments.find(tour => tour.id === 'tour-2').registeredTeamIds.includes(t.id));

    const bracket1 = generateBracket(tour1Teams, 'tour-1');
    const bracket2 = generateBracket(tour2Teams, 'tour-2');

    assert.strictEqual(bracket1.length, 7);
    assert.strictEqual(bracket2.length, 7);

    // Verify round counts: 4 QF, 2 SF, 1 Final
    assert.strictEqual(bracket1.filter(m => m.roundIndex === 1).length, 4);
    assert.strictEqual(bracket1.filter(m => m.roundIndex === 2).length, 2);
    assert.strictEqual(bracket1.filter(m => m.roundIndex === 3).length, 1);

    assert.strictEqual(bracket2.filter(m => m.roundIndex === 1).length, 4);
    assert.strictEqual(bracket2.filter(m => m.roundIndex === 2).length, 2);
    assert.strictEqual(bracket2.filter(m => m.roundIndex === 3).length, 1);

    // Verify progression linking in basketball bracket
    const qf1 = bracket2.find(m => m.id === 'match-tour-2-qf-1');
    const qf2 = bracket2.find(m => m.id === 'match-tour-2-qf-2');
    const sf1 = bracket2.find(m => m.id === 'match-tour-2-sf-1');
    const finalMatch = bracket2.find(m => m.id === 'match-tour-2-fn-1');

    assert.strictEqual(qf1.nextMatchId, sf1.id);
    assert.strictEqual(qf1.nextMatchSlot, 'home');
    assert.strictEqual(qf2.nextMatchId, sf1.id);
    assert.strictEqual(qf2.nextMatchSlot, 'away');
    assert.strictEqual(sf1.nextMatchId, finalMatch.id);
  });

  it('should maintain completely independent standings for each tournament', () => {
    function calculateStandings(tournamentId, tournaments, teams) {
      const tournament = tournaments.find(t => t.id === tournamentId);
      const registeredIds = new Set(tournament.registeredTeamIds);

      const standingsMap = new Map();
      teams
        .filter(t => registeredIds.has(t.id))
        .forEach(t => {
          standingsMap.set(t.id, {
            teamId: t.id,
            teamName: t.name,
            teamCode: t.code,
            played: t.matchesPlayed,
            won: t.wins,
            lost: t.losses,
            draw: t.draws,
            points: t.points,
            goalsFor: t.goalsFor,
            goalsAgainst: t.goalsAgainst,
            goalDifference: t.goalDifference,
            rank: 0
          });
        });

      const sorted = Array.from(standingsMap.values()).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        return b.goalsFor - a.goalsFor;
      });

      sorted.forEach((item, index) => {
        item.rank = index + 1;
      });

      return sorted;
    }

    const standings1 = calculateStandings('tour-1', seedData.tournaments, seedData.teams);
    const standings2 = calculateStandings('tour-2', seedData.tournaments, seedData.teams);

    assert.strictEqual(standings1.length, 8);
    assert.strictEqual(standings2.length, 8);

    // Ensure zero overlap between tournament standings
    const teamIds1 = new Set(standings1.map(s => s.teamId));
    const teamIds2 = new Set(standings2.map(s => s.teamId));

    standings1.forEach(s => {
      assert.strictEqual(teamIds2.has(s.teamId), false, `Team ${s.teamId} should not appear in tour-2`);
    });

    standings2.forEach(s => {
      assert.strictEqual(teamIds1.has(s.teamId), false, `Team ${s.teamId} should not appear in tour-1`);
    });

    // Check rank assignment independence
    assert.strictEqual(standings1[0].rank, 1);
    assert.strictEqual(standings1[7].rank, 8);
    assert.strictEqual(standings2[0].rank, 1);
    assert.strictEqual(standings2[7].rank, 8);
  });

  it('should verify basketball teams have 10 players each with mixed eligibility document statuses', () => {
    const tour2 = seedData.tournaments.find(t => t.id === 'tour-2');
    const basketballTeamIds = tour2.registeredTeamIds;

    let totalBasketballPlayers = 0;
    const eligibilityCounts = { VERIFIED: 0, PENDING: 0, REJECTED: 0 };

    basketballTeamIds.forEach(teamId => {
      const teamPlayers = seedData.players.filter(p => p.teamId === teamId);
      assert.strictEqual(teamPlayers.length, 10, `Team ${teamId} must have exactly 10 players`);
      totalBasketballPlayers += teamPlayers.length;

      teamPlayers.forEach(player => {
        assert.ok(['VERIFIED', 'PENDING', 'REJECTED'].includes(player.eligibilityStatus));
        eligibilityCounts[player.eligibilityStatus]++;
        assert.strictEqual(Array.isArray(player.documents), true);
        assert.strictEqual(player.documents.length >= 1, true, 'Each player must have at least one document');
      });
    });

    assert.strictEqual(totalBasketballPlayers, 80);
    assert.strictEqual(eligibilityCounts.VERIFIED > 0, true, 'Must have verified players');
    assert.strictEqual(eligibilityCounts.PENDING > 0, true, 'Must have pending eligibility players');
    assert.strictEqual(eligibilityCounts.REJECTED > 0, true, 'Must have rejected eligibility players');
  });
});
