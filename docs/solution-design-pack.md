# ArenaSync — Comprehensive Solution Design Pack (BIT-57)

**Project Title**: ArenaSync — Intelligent Sports Tournament Operations & Analytics Platform  
**Capstone Code**: BIT-57  
**Degree Program**: Bachelor of Science in Information Technology (B.Sc. IT)  
**Document Version**: 1.0 (Production & Academic Capstone Release)  
**Evaluation Date**: 2026-09-21  

---

## 1. System Overview

**ArenaSync** is an enterprise-grade, intelligent sports tournament operations, live scoring, and athlete workload analytics platform developed for collegiate and institutional athletic departments.

The platform addresses the severe operational hazards identified in the **BIT-57 problem statement**—including fixture mispairings, uncoordinated live score race conditions, lack of accountability in athlete eligibility verification, and unmonitored athletic fatigue accumulation.

ArenaSync unifies the end-to-end tournament lifecycle into a reactive, high-performance platform:
$$\text{Registration} \longrightarrow \text{Eligibility Desk} \longrightarrow \text{Fixture Engine} \longrightarrow \text{Live Scoring \& OCC} \longrightarrow \text{Standings} \longrightarrow \text{ACWR Analytics} \longrightarrow \text{Injury Flags} \longrightarrow \text{Audit Trail}$$

---

## 2. System Architecture & C4 Model

### 2.1. C4 Level 1: System Context Diagram

```mermaid
C4Context
    title System Context Diagram for ArenaSync Sports Operations Platform (BIT-57)

    Person(admin, "Tournament Director / Admin", "Configures tournaments, generates fixtures, verifies athlete documents, audits governance logs.")
    Person(referee, "Match Referee / Official", "Kicks off matches, inputs live scores and match events, submits official match reports.")
    Person(coach, "Team Head Coach", "Registers squad rosters, uploads athlete eligibility documents, reviews workload analytics.")
    Person(player, "Student-Athlete", "Uploads identity/medical verification documents, reviews personal match statistics.")
    Person(viewer, "Campus Spectator / Media", "Views live tournament scores, standings tables, top scorers, and TV broadcast displays.")

    System(arenasync, "ArenaSync Platform", "Monolithic TypeScript application providing React UI, Express REST APIs, transactional in-memory store, ACWR analytics, and audit logging.")

    System_Ext(gemini, "Google Gemini AI API", "Provides optional LLM-driven match summary generation and predictive performance insights.")
    System_Ext(monitoring, "Observability & Probes", "Scrapes /actuator/health and /api/metrics for uptime, memory telemetry, and container health.")

    Rel(admin, arenasync, "Administers tournaments, verifies eligibility, audits logs", "HTTPS / REST")
    Rel(referee, arenasync, "Live scores matches, records cards/goals", "HTTPS / REST")
    Rel(coach, arenasync, "Manages team rosters & views workload", "HTTPS / REST")
    Rel(player, arenasync, "Submits documents & tracks stats", "HTTPS / REST")
    Rel(viewer, arenasync, "Views broadcast TV & live standings", "HTTPS / Read-only")

    Rel(arenasync, gemini, "Generates AI tournament insights", "HTTPS / REST / JSON")
    Rel(monitoring, arenasync, "Polls health probes and telemetry", "HTTP / GET")
```

### 2.2. C4 Level 2: Container Architecture Diagram

```mermaid
C4Container
    title Container Architecture Diagram for ArenaSync

    Person(users, "System Actors", "Admin, Referee, Coach, Player, Viewer")

    Container_Boundary(c1, "ArenaSync Containerized Deployment (Docker)") {
        Container(react_spa, "React Single Page App", "TypeScript, React 19, Tailwind CSS, Lucide Icons", "Delivers responsive UI dashboards, referee live consoles, broadcast TV displays, and document review desks.")
        
        Container(express_api, "Express HTTP Server / API", "Node.js 20/24, Express 4.21, ESBuild Bundler", "Exposes secure RESTful endpoints (/api, /actuator), enforces RBAC, handles optimistic concurrency, and validates inputs.")

        ContainerDb(inmem_db, "Transactional In-Memory Store", "TypeScript Engine (SportsDatabase)", "Maintains state for users, tournaments, teams, athletes, matches, fixtures, audit logs, and metrics.")
    }

    System_Ext(gemini_api, "Google Gemini AI", "LLM Analysis Service")

    Rel(users, react_spa, "Interacts via browser", "HTTPS")
    Rel(react_spa, express_api, "Consumes REST endpoints with Bearer tokens", "JSON / HTTP")
    Rel(express_api, inmem_db, "Atomic reads, updates, OCC version increments", "In-Process Memory")
    Rel(express_api, gemini_api, "Requests automated tournament summaries", "HTTPS / API Key")
```

### 2.3. C4 Level 3: Backend Component Architecture Diagram

```mermaid
C4Component
    title Component Diagram for ArenaSync Backend Service

    Container_Boundary(backend, "Express Backend & Domain Layer") {
        Component(security_middleware, "Security Middleware", "server/security.ts", "Enforces X-Content-Type-Options, X-Frame-Options, suppresses X-Powered-By, applies rate bounds.")
        
        Component(auth_module, "Authentication & RBAC Guard", "server/api.ts", "Validates Bearer tokens, extracts role claims (ADMIN, REFEREE, COACH, PLAYER, VIEWER), enforces route permissions.")

        Component(fixture_engine, "Fixture & Bracket Engine", "server/db.ts", "Generates single-elimination DAG knockout trees with deterministic winner slot forwarding.")

        Component(scoring_engine, "Live Scoring & OCC Controller", "server/api.ts, server/db.ts", "Executes atomic score mutations with version checks (HTTP 409 on stale reads) and match lifecycle locks.")

        Component(workload_engine, "Workload & ACWR Calculator", "server/db.ts", "Calculates Acute:Chronic Workload Ratios (7d vs 28d load) and triggers multi-factor injury-risk flags.")

        Component(audit_logger, "Audit Logger & Governance Stream", "server/db.ts", "Appends immutable timestamped records capturing actor ID, role, action, and before/after state diffs.")

        Component(standings_calculator, "Standings Table Calculator", "server/db.ts", "Computes W/D/L, points, goal difference, goals scored, and rank progression upon match completion.")

        Component(health_actuator, "Health & Telemetry Actuator", "server.ts, server/api.ts", "Provides /actuator/health, /api/health, and /api/metrics for system monitoring and container health checks.")

        ComponentDb(db_store, "SportsDatabase State Store", "server/db.ts", "Thread-safe in-memory collections of entities, indexes, and performance counters.")
    }

    Rel(security_middleware, auth_module, "Filters inbound HTTP requests")
    Rel(auth_module, scoring_engine, "Dispatches authorized match mutations")
    Rel(auth_module, fixture_engine, "Dispatches authorized bracket setups")
    Rel(auth_module, audit_logger, "Records authentication events")
    Rel(scoring_engine, standings_calculator, "Triggers table updates on match end")
    Rel(scoring_engine, workload_engine, "Triggers player minutes & ACWR recalculation")
    Rel(scoring_engine, audit_logger, "Emits SCORE_CHANGE audit records")
    Rel(scoring_engine, db_store, "Atomic version updates (version + 1)")
    Rel(fixture_engine, db_store, "Writes generated match nodes")
    Rel(workload_engine, db_store, "Attaches workload & risk objects to players")
    Rel(health_actuator, db_store, "Reads telemetry counters & DB status")
```

---

## 3. Data-Flow & Sequence Diagrams

### 3.1. User Authentication & Role Token Issuance
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

### 3.2. Live Score Update (Optimistic Locking Commit)
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

### 3.3. Concurrent Score Update Collision (`HTTP 409 Conflict`)
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

### 3.4. Fixture Generation & Knockout Bracket Progression
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

### 3.5. Workload Calculation (ACWR) → Statistical Injury Risk Flags
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

### 3.6. Immutable Audit Trail Logging
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

---

## 4. Domain Data Model & Entity Schema

```mermaid
erDiagram
    TOURNAMENT ||--o{ TEAM : "registers"
    TOURNAMENT ||--o{ MATCH : "schedules"
    TEAM ||--o{ PLAYER : "rosters"
    TEAM ||--o{ MATCH : "competes_in (home/away)"
    PLAYER ||--o{ ELIGIBILITY_DOCUMENT : "submits"
    PLAYER ||--o| PLAYER_WORKLOAD : "accumulates"
    PLAYER ||--o| INJURY_RISK_FLAG : "triggers"
    MATCH ||--o{ MATCH_EVENT : "logs"
    MATCH ||--o{ SCORE_UPDATE_RECORD : "versions"
    MATCH ||--o{ PLAYER_PARTICIPATION : "tracks"
    USER ||--o{ AUDIT_LOG_ENTRY : "authorizes"
    MATCH ||--o{ SYSTEM_ALERT : "raises"
```

### Entity Dictionary Summary
* **`Tournament`**: `id`, `name`, `sport`, `format` (`SINGLE_ELIMINATION` | `ROUND_ROBIN`), `startDate`, `endDate`, `venue`, `numTeams`, `registeredTeamIds`, `rules`, `status` (`DRAFT` | `REGISTRATION` | `IN_PROGRESS` | `COMPLETED`), `championTeamId`.
* **`Team`**: `id`, `name`, `code` (unique 3-letter uppercase), `logoUrl`, `coachName`, `coachEmail`, `coachId`, `sport`, `homeVenue`, `primaryColor`, `secondaryColor`, `matchesPlayed`, `wins`, `losses`, `draws`, `points`, `goalsFor`, `goalsAgainst`, `goalDifference`, `recentForm`, `status`.
* **`Player`**: `id`, `playerId` (e.g. `PLY-1001`), `name`, `teamId`, `teamName`, `jerseyNumber`, `position`, `age`, `contactEmail`, `contactPhone`, `photoUrl`, `eligibilityStatus` (`PENDING` | `VERIFIED` | `REJECTED`), `documents`, `workload`, `injuryRisk`, performance stats.
* **`EligibilityDocument`**: `id`, `playerId`, `documentType` (`COLLEGE_ID` | `ID_PROOF` | `MEDICAL_CERTIFICATE` | `REGISTRATION_DOC`), `fileName`, `fileSize`, `uploadDate`, `status` (`PENDING` | `VERIFIED` | `REJECTED`), `verifiedDate`, `verifiedBy`, `notes`.
* **`Match`**: `id`, `tournamentId`, `roundName`, `roundIndex`, `homeTeamId`, `homeTeamName`, `awayTeamId`, `awayTeamName`, `homeScore`, `awayScore`, `date`, `time`, `venue`, `refereeId`, `status` (`SCHEDULED` | `LIVE` | `COMPLETED`), `currentMinute`, `period`, `events`, `scoreUpdates`, `playerParticipations`, `version` (atomic OCC integer), `nextMatchId`, `nextMatchSlot`.
* **`AuditLogEntry`**: `id`, `timestamp`, `userId`, `userName`, `userRole`, `action`, `entityType`, `entityId`, `previousValue`, `newValue`, `notes`.

---

## 5. API Contract Summary

| HTTP Method | Endpoint Path | Role Required | Purpose | Response Codes |
|---|---|---|---|---|
| `GET` | `/actuator/health` | Public | Standard Actuator health probe (`diskSpace`, `db` UP) | `200` |
| `GET` | `/api/health` | Public | REST service health & memory usage telemetry | `200` |
| `GET` | `/api/metrics` | Public | Relational entity tallies and collision counters | `200` |
| `POST` | `/api/auth/login` | Public | Authenticates user & issues Bearer token | `200` |
| `GET` | `/api/tournaments` | Public | Lists all tournaments and competition rules | `200` |
| `POST` | `/api/tournaments` | `ADMIN` | Creates a new tournament configuration | `201`, `400`, `401`, `403` |
| `GET` | `/api/teams` | Public | Lists teams, coaches, and season records | `200` |
| `POST` | `/api/teams` | `ADMIN` | Registers team with uniqueness validation | `201`, `400`, `401`, `403` |
| `GET` | `/api/players` | Public | Queries athlete roster with team/eligibility filters | `200` |
| `POST` | `/api/players` | `ADMIN`, `COACH` | Registers athlete and creates initial document | `201`, `400`, `401`, `403` |
| `POST` | `/api/players/:id/documents` | `ADMIN`, `COACH`, `PLAYER` | Uploads clearance certificate | `201`, `401`, `403`, `404` |
| `PUT` | `/api/players/:id/documents/:docId/verify` | `ADMIN` | Approves/rejects document & clears eligibility | `200`, `400`, `401`, `403`, `404` |
| `GET` | `/api/fixtures` | Public | Queries all scheduled & completed matches | `200` |
| `POST` | `/api/fixtures/generate` | `ADMIN` | Generates 7-match knockout bracket with DAG links | `200`, `400`, `401`, `403` |
| `POST` | `/api/matches/:id/start` | `ADMIN`, `REFEREE` | Kicks off match (transitions to `LIVE`) | `200`, `400`, `401`, `403`, `404` |
| `POST` | `/api/matches/:id/score` | `ADMIN`, `REFEREE` | Atomic score update with OCC version check | `200`, `400`, `401`, `403`, `409` |
| `POST` | `/api/matches/:id/events` | `ADMIN`, `REFEREE` | Records cards, fouls, substitutions, and goals | `200`, `401`, `403`, `404` |
| `POST` | `/api/matches/:id/complete` | `ADMIN`, `REFEREE` | Seals match, updates standings & workload | `200`, `400`, `401`, `403`, `404` |
| `GET` | `/api/standings/:tournamentId` | Public | Computes ranked standings (Pts -> GD -> GF) | `200` |
| `GET` | `/api/workload` | Public | Computes 7d vs 28d ACWR ratios and safe zones | `200` |
| `GET` | `/api/injury-flags` | Public | Active fatigue & fixture congestion flags | `200` |
| `GET` | `/api/audit-logs` | `ADMIN` | Streams immutable governance audit records | `200`, `401`, `403` |

---

## 6. Threat Model & Security Architecture

### 6.1. STRIDE Analysis
* **Spoofing**: Bearer JWT parsing (`authenticate`) rejecting forged/missing headers with `HTTP 401`.
* **Tampering**: Optimistic Concurrency Control rejecting stale writes with `HTTP 409 Conflict`; input validation blocking negative scores and completed match mutations (`HTTP 400`).
* **Repudiation**: Append-only `AuditLogEntry` capturing actor identity, user role, action type, entity ID, and before/after diffs.
* **Information Disclosure**: Removal of `x-powered-by` server fingerprinting; strict HTTP security headers (`nosniff`, `SAMEORIGIN`, `1; mode=block`); athlete contact info gated from viewers.
* **Denial of Service**: Body parser strictly bounded to `2mb`; loopback throughput verified over $3,300\text{ req/s}$.
* **Elevation of Privilege**: Role-based access control (`requireRole('ADMIN')`) preventing unauthorized mutations by coaches, players, or spectators (`HTTP 403 Forbidden`).

---

## 7. Test Strategy & Verification Matrix

The test strategy verifies every layer of the architecture without mocks on business logic:
* **Automated Test Suite (`npm test`)**: 10 test suites containing 45 unit/integration tests covering team validation, document eligibility, bracket progression, live scoring, optimistic locking, security headers, standings, ACWR workload calculations, and express API integration.
* **Baseline Comparison (`npm run evaluate:baseline`)**: Programmatic benchmark validating ArenaSync's +100% bracket completeness, 100% input validation integrity, zero lost updates, 100% audit attribution, and real-time ACWR fatigue risk flags.
* **Performance Benchmark (`npm run evaluate:performance`)**: High-resolution latency profiling across 11 routes ($0.20\text{--}0.67\text{ms}$ p50), multi-worker load testing (10, 25, 50 workers, $>3,300\text{ req/s}$), and 20-worker live scoring collision testing.
* **Security Audit (`npm run security:check`)**: Automated verification of zero dependency CVE vulnerabilities, zero committed secrets, strict `.gitignore` rules, and active security headers.
* **Container Build Verification (`Dockerfile`, `compose.yaml`)**: Multi-stage production build running as non-root user `node` with automated `/actuator/health` health probes.

---

## 8. Traceability Matrix to BIT-57 Capstone Requirements

| BIT-57 Requirement | Description | Implementation Artifact | Verification Suite |
|---|---|---|---|
| **Requirement 1** | Team Registration & Validation | [`server/api.ts:210-262`](file:///c:/Users/Priya%20Yadav/Downloads/arenasync/server/api.ts), [`src/components/TeamsView.tsx`](file:///c:/Users/Priya%20Yadav/Downloads/arenasync/src/components/TeamsView.tsx) | [`tests/teams.test.js`](file:///c:/Users/Priya%20Yadav/Downloads/arenasync/tests/teams.test.js) |
| **Requirement 2** | Athlete Eligibility & Document Verification | [`server/api.ts:355-431`](file:///c:/Users/Priya%20Yadav/Downloads/arenasync/server/api.ts), [`src/components/DocumentsView.tsx`](file:///c:/Users/Priya%20Yadav/Downloads/arenasync/src/components/DocumentsView.tsx) | [`tests/eligibility.test.js`](file:///c:/Users/Priya%20Yadav/Downloads/arenasync/tests/eligibility.test.js) |
| **Requirement 3** | Fixture Generation & Knockout Bracket | [`server/db.ts:1620-1723`](file:///c:/Users/Priya%20Yadav/Downloads/arenasync/server/db.ts), [`src/components/FixturesView.tsx`](file:///c:/Users/Priya%20Yadav/Downloads/arenasync/src/components/FixturesView.tsx) | [`tests/fixtures.test.js`](file:///c:/Users/Priya%20Yadav/Downloads/arenasync/tests/fixtures.test.js) |
| **Requirement 4** | Match Assignment & Lifecycle Management | [`server/api.ts:465-502`](file:///c:/Users/Priya%20Yadav/Downloads/arenasync/server/api.ts), [`src/components/RefereeConsoleView.tsx`](file:///c:/Users/Priya%20Yadav/Downloads/arenasync/src/components/RefereeConsoleView.tsx) | [`tests/api_integration.test.js`](file:///c:/Users/Priya%20Yadav/Downloads/arenasync/tests/api_integration.test.js) |
| **Requirement 5** | Live Scoring & Incident Logging | [`server/api.ts:504-609`](file:///c:/Users/Priya%20Yadav/Downloads/arenasync/server/api.ts), [`src/components/LiveScoringView.tsx`](file:///c:/Users/Priya%20Yadav/Downloads/arenasync/src/components/LiveScoringView.tsx) | [`tests/scoring_and_concurrency.test.js`](file:///c:/Users/Priya%20Yadav/Downloads/arenasync/tests/scoring_and_concurrency.test.js) |
| **Requirement 6** | Championship Standings Calculation | [`server/db.ts:1400-1480`](file:///c:/Users/Priya%20Yadav/Downloads/arenasync/server/db.ts), [`src/components/StandingsView.tsx`](file:///c:/Users/Priya%20Yadav/Downloads/arenasync/src/components/StandingsView.tsx) | [`tests/standings.test.js`](file:///c:/Users/Priya%20Yadav/Downloads/arenasync/tests/standings.test.js) |
| **Requirement 7** | Workload Analytics (ACWR Gabbett Model) | [`server/db.ts:1490-1550`](file:///c:/Users/Priya%20Yadav/Downloads/arenasync/server/db.ts), [`src/components/WorkloadView.tsx`](file:///c:/Users/Priya%20Yadav/Downloads/arenasync/src/components/WorkloadView.tsx) | [`tests/workload_and_injury.test.js`](file:///c:/Users/Priya%20Yadav/Downloads/arenasync/tests/workload_and_injury.test.js) |
| **Requirement 8** | Proactive Statistical Injury-Risk Flags | [`server/db.ts:1551-1610`](file:///c:/Users/Priya%20Yadav/Downloads/arenasync/server/db.ts), [`src/components/InjuryFlagsView.tsx`](file:///c:/Users/Priya%20Yadav/Downloads/arenasync/src/components/InjuryFlagsView.tsx) | [`tests/workload_and_injury.test.js`](file:///c:/Users/Priya%20Yadav/Downloads/arenasync/tests/workload_and_injury.test.js) |
| **Requirement 9** | Multi-Role Authentication & Authorization | [`server/api.ts:17-91`](file:///c:/Users/Priya%20Yadav/Downloads/arenasync/server/api.ts), [`src/components/Header.tsx`](file:///c:/Users/Priya%20Yadav/Downloads/arenasync/src/components/Header.tsx) | [`tests/auth.test.js`](file:///c:/Users/Priya%20Yadav/Downloads/arenasync/tests/auth.test.js) |
| **Requirement 10** | Immutable Audit Logging & Governance | [`server/db.ts:1725-1736`](file:///c:/Users/Priya%20Yadav/Downloads/arenasync/server/db.ts), [`src/components/AuditLogsView.tsx`](file:///c:/Users/Priya%20Yadav/Downloads/arenasync/src/components/AuditLogsView.tsx) | [`tests/audit_logs.test.js`](file:///c:/Users/Priya%20Yadav/Downloads/arenasync/tests/audit_logs.test.js) |
| **Requirement 11** | Optimistic Concurrency & Collision Control | [`server/api.ts:526-535`](file:///c:/Users/Priya%20Yadav/Downloads/arenasync/server/api.ts), [`server/db.ts:34`](file:///c:/Users/Priya%20Yadav/Downloads/arenasync/server/db.ts) | [`tests/scoring_and_concurrency.test.js`](file:///c:/Users/Priya%20Yadav/Downloads/arenasync/tests/scoring_and_concurrency.test.js) |
| **Requirement 12** | Express RESTful API Architecture | [`server/api.ts`](file:///c:/Users/Priya%20Yadav/Downloads/arenasync/server/api.ts), [`server.ts`](file:///c:/Users/Priya%20Yadav/Downloads/arenasync/server.ts) | [`tests/api_integration.test.js`](file:///c:/Users/Priya%20Yadav/Downloads/arenasync/tests/api_integration.test.js) |
| **Requirement 13** | HTTP Security Headers & DoS Bounds | [`server/security.ts`](file:///c:/Users/Priya%20Yadav/Downloads/arenasync/server/security.ts), [`server.ts:12-16`](file:///c:/Users/Priya%20Yadav/Downloads/arenasync/server.ts) | [`tests/security.test.js`](file:///c:/Users/Priya%20Yadav/Downloads/arenasync/tests/security.test.js), [`scripts/security-audit.js`](file:///c:/Users/Priya%20Yadav/Downloads/arenasync/scripts/security-audit.js) |
| **Requirement 14** | Automated Test Suite & Coverage | [`tests/*.test.js`](file:///c:/Users/Priya%20Yadav/Downloads/arenasync/tests), [`package.json:12-13`](file:///c:/Users/Priya%20Yadav/Downloads/arenasync/package.json) | Full 45-test suite |
| **Requirement 15** | Containerized Deployment (Docker) | [`Dockerfile`](file:///c:/Users/Priya%20Yadav/Downloads/arenasync/Dockerfile), [`compose.yaml`](file:///c:/Users/Priya%20Yadav/Downloads/arenasync/compose.yaml), [`.dockerignore`](file:///c:/Users/Priya%20Yadav/Downloads/arenasync/.dockerignore) | Multi-stage Docker builder + runner |
| **Requirement 16** | Baseline Comparison & Performance Evaluation | [`docs/baseline-comparison.md`](file:///c:/Users/Priya%20Yadav/Downloads/arenasync/docs/baseline-comparison.md), [`docs/performance-evaluation.md`](file:///c:/Users/Priya%20Yadav/Downloads/arenasync/docs/performance-evaluation.md) | [`scripts/evaluate-baseline.js`](file:///c:/Users/Priya%20Yadav/Downloads/arenasync/scripts/evaluate-baseline.js), [`scripts/evaluate-performance.js`](file:///c:/Users/Priya%20Yadav/Downloads/arenasync/scripts/evaluate-performance.js) |
