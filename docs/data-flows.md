# ArenaSync — Data-Flow & Sequence Diagrams (BIT-57)

This document details the core data flows, state changes, and component interactions across the 6 primary business workflows in **ArenaSync**.

---

## Workflow A: User Authentication & Role Token Generation

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Official
    participant Client as React Client (Header / Login)
    participant Server as Express Server (/api/auth/login)
    participant DB as SportsDatabase Store
    participant Audit as Audit Logger

    User->>Client: Selects User Profile (e.g. Referee Marcus Webb)
    Client->>Server: POST /api/auth/login { email: "referee@smartsports.edu", role: "REFEREE" }
    Server->>DB: Lookup user record by email / role
    DB-->>Server: Return User Object { id: "usr-ref-1", role: "REFEREE", name: "Marcus Webb" }
    Server->>Server: Generate Bearer token: arenasync-jwt-usr-ref-1-<base64Payload>
    Server->>Audit: Append Log { userId: "usr-ref-1", action: "USER_LOGIN", entityType: "AUTH" }
    Server-->>Client: HTTP 200 { success: true, user, token }
    Client->>Client: Store token in LocalStorage & Context State
    Client-->>User: Render authorized Referee Console UI
```

---

## Workflow B: Live Score Update (Happy Path with Optimistic Lock Increment)

```mermaid
sequenceDiagram
    autonumber
    actor Ref as Match Referee
    participant Client as RefereeConsoleView
    participant Server as Express Server (/api/matches/:id/score)
    participant DB as SportsDatabase Store
    participant Audit as Audit Logger

    Ref->>Client: Increments Home Goal (Titan FC +1)
    Client->>Server: POST /api/matches/match-qf-1/score<br/>Header: Authorization: Bearer <token><br/>Body: { homeScore: 2, awayScore: 0, expectedVersion: 1, detail: "Goal by Julian Reyes" }
    Server->>Server: Authenticate token & verify role in [ADMIN, REFEREE]
    Server->>DB: Find match "match-qf-1"
    Server->>Server: Verify match.status !== "COMPLETED"
    Server->>Server: Verify match.version (1) === expectedVersion (1) -> MATCH!
    Server->>Server: Verify homeScore (2) >= 0 && awayScore (0) >= 0
    Server->>DB: Mutate: homeScore = 2, version = 2, prepend ScoreUpdateRecord & MatchEvent
    Server->>Audit: Append Log { action: "SCORE_CHANGE", entityId: "match-qf-1", prev: "1-0", new: "2-0" }
    Server-->>Client: HTTP 200 { id: "match-qf-1", homeScore: 2, awayScore: 0, version: 2, ... }
    Client-->>Ref: Display updated score (2 - 0) with new version v2
```

---

## Workflow C: Concurrent Score Update Collision Resulting in HTTP 409 Conflict

```mermaid
sequenceDiagram
    autonumber
    actor OfficialA as Table Official A
    actor OfficialB as Table Official B
    participant Server as Express Server (/api/matches/:id/score)
    participant DB as SportsDatabase Store

    Note over OfficialA, OfficialB: Both officials view Match v1 (Home: 1, Away: 0)
    OfficialA->>Server: POST /score { homeScore: 2, awayScore: 0, expectedVersion: 1 } (Timestamp t1)
    OfficialB->>Server: POST /score { homeScore: 1, awayScore: 1, expectedVersion: 1 } (Timestamp t1 + 1ms)

    Server->>DB: Process Official A request: match.version (1) === expectedVersion (1)
    DB->>DB: Commit: homeScore = 2, version = 2
    Server-->>OfficialA: HTTP 200 OK (Match version updated to v2)

    Server->>DB: Process Official B request: match.version (2) !== expectedVersion (1)
    Server->>Server: OCC Mismatch Detected! Increment db.metrics.concurrencyCollisionsHandled (+1)
    Server-->>OfficialB: HTTP 409 Conflict { error: "Concurrency conflict", currentVersion: 2, currentHomeScore: 2, currentAwayScore: 0 }
    Note over OfficialB: Client UI catches 409, refreshes state to v2 without corrupting score
```

---

## Workflow D: Fixture Generation & Knockout Bracket Progression

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Tournament Director
    participant Client as FixturesView
    participant Server as Express Server (/api/fixtures/generate)
    participant Engine as Fixture & Bracket Engine
    participant DB as SportsDatabase Store

    Admin->>Client: Clicks "Generate Knockout Bracket" (8 Registered Teams)
    Client->>Server: POST /api/fixtures/generate { tournamentId: "tour-1", format: "SINGLE_ELIMINATION" }
    Server->>Server: Verify ADMIN authorization
    Server->>Engine: generateFixtures(tourId, "SINGLE_ELIMINATION", teamIds, venue, startDate)
    
    Engine->>Engine: Create 4 Quarter-Final matches (match-qf-1 to match-qf-4) with seeded teams
    Engine->>Engine: Create 2 Semi-Final matches (match-sf-1, match-sf-2) with TBD slots
    Engine->>Engine: Link QF1 -> SF1(home), QF2 -> SF1(away), QF3 -> SF2(home), QF4 -> SF2(away)
    Engine->>Engine: Create 1 Final match (match-fn-1) with TBD slots
    Engine->>Engine: Link SF1 -> Final(home), SF2 -> Final(away)
    
    Engine->>DB: Save 7 generated matches & update tournament.status = "IN_PROGRESS"
    Server-->>Client: HTTP 200 { success: true, count: 7, matches: [...] }
    Client-->>Admin: Render interactive 3-round knockout bracket visualizer
```

---

## Workflow E: Workload Calculation (ACWR) → Statistical Injury-Risk Flag

```mermaid
sequenceDiagram
    autonumber
    participant Engine as Workload Analytics Engine (recalculateWorkloadsAndRisks)
    participant Match as Completed Matches Store
    participant Player as Athlete Registry
    participant Risk as Injury Risk Evaluator
    participant Alert as System Alert Stream

    Engine->>Match: Query player match minutes over last 7 days (Acute Load)
    Engine->>Match: Query player match minutes over last 28 days normalized (Chronic Load)
    Engine->>Match: Calculate matches played in last 48h and recovery gap hours
    
    Engine->>Player: Compute ACWR = AcuteMinutes / ChronicMinutes
    Engine->>Risk: Evaluate multi-factor risk triggers
    
    alt ACWR >= 1.50 OR (matchesIn48h >= 3 AND minutesIn48h >= 180)
        Risk->>Player: Set workloadLevel = "VERY_HIGH", riskLevel = "HIGH", riskScore = 85
        Risk->>Player: Append trigger reasons ["ACWR spike detected (1.80)", "3 matches in 48h"]
        Risk->>Alert: Emit SystemAlert { type: "INJURY_RISK_FLAG", severity: "critical", athlete: player.name }
    else ACWR between 1.30 and 1.49 OR recoveryGap < 24h
        Risk->>Player: Set workloadLevel = "HIGH", riskLevel = "MODERATE", riskScore = 55
        Risk->>Alert: Emit SystemAlert { type: "HIGH_WORKLOAD", severity: "warning", athlete: player.name }
    else 0.80 <= ACWR <= 1.30 (Gabbett Sweet Spot)
        Risk->>Player: Set workloadLevel = "NORMAL", riskLevel = "LOW", riskScore = 20
    end
```

---

## Workflow F: Immutable Audit Trail Logging

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Admin Official
    participant Server as Express Server (/api/players/:id/documents/:docId/verify)
    participant DB as SportsDatabase
    participant Audit as AuditLog Stream

    Admin->>Server: PUT /api/players/p1/documents/doc-1/verify { status: "VERIFIED", notes: "Official ID Confirmed" }
    Server->>Server: Enforce ADMIN RBAC check
    Server->>DB: Update document status "PENDING" -> "VERIFIED"
    Server->>DB: Evaluate player eligibility (all documents VERIFIED -> player.eligibilityStatus = "VERIFIED")
    Server->>Audit: addAuditLog({<br/>  userId: "usr-admin-1",<br/>  userRole: "ADMIN",<br/>  action: "VERIFY_DOCUMENT",<br/>  entityType: "DOCUMENT",<br/>  entityId: "doc-1",<br/>  previousValue: "PENDING",<br/>  newValue: "VERIFIED - Player status: VERIFIED"<br/>})
    Audit->>Audit: Generate unique ID & ISO timestamp; prepend to immutable array (FIFO capped 200)
    Server-->>Admin: HTTP 200 { document: doc, playerEligibility: "VERIFIED" }
```
