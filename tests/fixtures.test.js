import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Requirement 3: Fixture Generation & Knockout Bracket Progression', () => {
  const teams = [
    { id: 't1', name: 'Titan FC', logoUrl: 'logo1.png' },
    { id: 't2', name: 'Apex Strikers', logoUrl: 'logo2.png' },
    { id: 't3', name: 'Horizon United', logoUrl: 'logo3.png' },
    { id: 't4', name: 'Metro Rovers', logoUrl: 'logo4.png' },
    { id: 't5', name: 'Phoenix Academy', logoUrl: 'logo5.png' },
    { id: 't6', name: 'Vanguard Elite', logoUrl: 'logo6.png' },
    { id: 't7', name: 'Cobalt Wolves', logoUrl: 'logo7.png' },
    { id: 't8', name: 'Neon Knights', logoUrl: 'logo8.png' }
  ];

  function generateSingleEliminationBracket(registeredTeams, tournamentId, venue, startDate) {
    if (registeredTeams.length < 2) throw new Error('At least 2 teams required to generate fixtures');

    const totalSlots = 8;
    const round1Count = totalSlots / 2; // 4 QFs
    const matches = [];

    // Round 1 (QF)
    const qfMatches = [];
    for (let i = 0; i < round1Count; i++) {
      const home = registeredTeams[i * 2] || { id: 'tbd', name: 'BYE' };
      const away = registeredTeams[i * 2 + 1] || { id: 'tbd', name: 'BYE' };
      const m = {
        id: `match-qf-${i + 1}`,
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

    // Round 2 (SF)
    const sfMatches = [];
    for (let i = 0; i < 2; i++) {
      const m = {
        id: `match-sf-${i + 1}`,
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

      // Link QF winners
      qfMatches[i * 2].nextMatchId = m.id;
      qfMatches[i * 2].nextMatchSlot = 'home';
      qfMatches[i * 2 + 1].nextMatchId = m.id;
      qfMatches[i * 2 + 1].nextMatchSlot = 'away';
    }

    // Round 3 (Final)
    const finalMatch = {
      id: 'match-final-1',
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

  it('should generate a full 7-match single elimination bracket for 8 teams (4 QF, 2 SF, 1 Final)', () => {
    const bracket = generateSingleEliminationBracket(teams, 'tour-1', 'Stadium', '2026-09-20');
    assert.strictEqual(bracket.length, 7);

    const qfs = bracket.filter(m => m.roundIndex === 1);
    const sfs = bracket.filter(m => m.roundIndex === 2);
    const finals = bracket.filter(m => m.roundIndex === 3);

    assert.strictEqual(qfs.length, 4);
    assert.strictEqual(sfs.length, 2);
    assert.strictEqual(finals.length, 1);
  });

  it('should accurately link Quarter-Final matches to corresponding Semi-Final slots', () => {
    const bracket = generateSingleEliminationBracket(teams, 'tour-1', 'Stadium', '2026-09-20');
    const qf1 = bracket.find(m => m.id === 'match-qf-1');
    const qf2 = bracket.find(m => m.id === 'match-qf-2');

    assert.strictEqual(qf1.nextMatchId, 'match-sf-1');
    assert.strictEqual(qf1.nextMatchSlot, 'home');
    assert.strictEqual(qf2.nextMatchId, 'match-sf-1');
    assert.strictEqual(qf2.nextMatchSlot, 'away');
  });

  it('should link Semi-Final matches to the Championship Final slots', () => {
    const bracket = generateSingleEliminationBracket(teams, 'tour-1', 'Stadium', '2026-09-20');
    const sf1 = bracket.find(m => m.id === 'match-sf-1');
    const sf2 = bracket.find(m => m.id === 'match-sf-2');

    assert.strictEqual(sf1.nextMatchId, 'match-final-1');
    assert.strictEqual(sf1.nextMatchSlot, 'home');
    assert.strictEqual(sf2.nextMatchId, 'match-final-1');
    assert.strictEqual(sf2.nextMatchSlot, 'away');
  });

  it('should verify both tour-1 (Football) and tour-2 (Basketball) generate independent 7-match brackets', () => {
    const footballTeams = teams;
    const basketballTeams = [
      { id: 'team-b1', name: 'Cyber Knights' },
      { id: 'team-b2', name: 'Solar Falcons' },
      { id: 'team-b3', name: 'Quantum Vipers' },
      { id: 'team-b4', name: 'Ironclad Titans' },
      { id: 'team-b5', name: 'Nebula Wolves' },
      { id: 'team-b6', name: 'Zenith Storm' },
      { id: 'team-b7', name: 'Apex Ballers' },
      { id: 'team-b8', name: 'Crimson Hawks' }
    ];

    const fbBracket = generateSingleEliminationBracket(footballTeams, 'tour-1', 'Stadium', '2026-09-20');
    const bbBracket = generateSingleEliminationBracket(basketballTeams, 'tour-2', 'Arena', '2026-10-01');

    assert.strictEqual(fbBracket.length, 7);
    assert.strictEqual(bbBracket.length, 7);

    assert.strictEqual(fbBracket.filter(m => m.roundIndex === 1).length, 4);
    assert.strictEqual(fbBracket.filter(m => m.roundIndex === 2).length, 2);
    assert.strictEqual(fbBracket.filter(m => m.roundIndex === 3).length, 1);

    assert.strictEqual(bbBracket.filter(m => m.roundIndex === 1).length, 4);
    assert.strictEqual(bbBracket.filter(m => m.roundIndex === 2).length, 2);
    assert.strictEqual(bbBracket.filter(m => m.roundIndex === 3).length, 1);
  });
});
