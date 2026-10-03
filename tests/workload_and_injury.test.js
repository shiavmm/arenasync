import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Requirements 7 & 8: Workload Analytics (ACWR) & Injury-Risk Flags', () => {
  function computeWorkloadAndRisk(acuteMinutes, chronicMinutes, matches48h, minutes48h, recoveryGapHours) {
    const acwr = Number((acuteMinutes / (chronicMinutes || 1)).toFixed(2));
    
    let workloadLevel = 'NORMAL';
    if (acwr >= 1.5) workloadLevel = 'VERY_HIGH';
    else if (acwr >= 1.3) workloadLevel = 'HIGH';
    else if (acwr < 0.8) workloadLevel = 'LOW';

    const reasons = [];
    if (matches48h >= 3) {
      reasons.push(`${matches48h} matches played within 48-hour window.`);
    }
    if (minutes48h >= 180) {
      reasons.push(`High acute match exposure (${minutes48h} minutes in 48 hours).`);
    }
    if (acwr >= 1.5) {
      reasons.push(`ACWR spike detected (${acwr}).`);
    }
    if (recoveryGapHours < 24) {
      reasons.push(`Severely compressed recovery window (${recoveryGapHours}h).`);
    }

    let riskLevel = 'LOW';
    let riskScore = 20;

    if (reasons.length >= 2 || acwr >= 1.6) {
      riskLevel = 'HIGH';
      riskScore = 85;
    } else if (reasons.length === 1 || acwr >= 1.35) {
      riskLevel = 'MODERATE';
      riskScore = 55;
    }

    return {
      acwr,
      workloadLevel,
      riskLevel,
      riskScore,
      reasons
    };
  }

  it('should identify normal workload within the Gabbett sweet spot (ACWR 0.80 - 1.30)', () => {
    // 180 mins acute / 180 mins chronic baseline = 1.00 ACWR
    const result = computeWorkloadAndRisk(180, 180, 1, 90, 72);
    assert.strictEqual(result.acwr, 1.0);
    assert.strictEqual(result.workloadLevel, 'NORMAL');
    assert.strictEqual(result.riskLevel, 'LOW');
    assert.strictEqual(result.reasons.length, 0);
  });

  it('should classify high workload when ACWR is between 1.30 and 1.49', () => {
    // 270 mins acute / 200 mins chronic = 1.35 ACWR
    const result = computeWorkloadAndRisk(270, 200, 2, 160, 36);
    assert.strictEqual(result.acwr, 1.35);
    assert.strictEqual(result.workloadLevel, 'HIGH');
    assert.strictEqual(result.riskLevel, 'MODERATE');
  });

  it('should trigger HIGH injury-risk flag on workload spike (ACWR >= 1.50) with fixture congestion', () => {
    // 360 mins acute / 200 mins chronic = 1.80 ACWR, 3 matches in 48h, 240 mins in 48h, recovery 18h
    const result = computeWorkloadAndRisk(360, 200, 3, 240, 18);
    assert.strictEqual(result.acwr, 1.80);
    assert.strictEqual(result.workloadLevel, 'VERY_HIGH');
    assert.strictEqual(result.riskLevel, 'HIGH');
    assert.strictEqual(result.riskScore, 85);
    assert.strictEqual(result.reasons.length, 4);
  });

  it('should flag MODERATE risk when compressed recovery window (< 24h) is detected', () => {
    const result = computeWorkloadAndRisk(180, 180, 2, 150, 16);
    assert.strictEqual(result.riskLevel, 'MODERATE');
    assert.strictEqual(result.reasons.length, 1);
    assert.match(result.reasons[0], /compressed recovery window/);
  });
});
