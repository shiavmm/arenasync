# ArenaSync — REST API Specification & Contracts (BIT-57)

This document provides the exhaustive specification for all REST API endpoints implemented in **ArenaSync** (`server/api.ts` and `server.ts`).

---

## 1. Authentication & Security Headers

* **Authentication Scheme**: HTTP Bearer Token (`Authorization: Bearer arenasync-jwt-<userId>-<base64Payload>`).
* **Enforced Security Headers**:
  * `X-Content-Type-Options: nosniff`
  * `X-Frame-Options: SAMEORIGIN`
  * `X-XSS-Protection: 1; mode=block`
  * `Referrer-Policy: strict-origin-when-cross-origin`
  * Express `x-powered-by` fingerprint suppression enabled.
* **Payload Bound**: JSON body parser strictly enforces `2mb` request limit.

---

## 2. API Endpoint Catalog

### 2.1. Observability & System Health

#### `GET /actuator/health`
* **Purpose**: Academic/enterprise health probe standard.
* **Auth**: Public (No auth required).
* **Response (200 OK)**:
  ```json
  {
    "status": "UP",
    "details": {
      "diskSpace": { "status": "UP", "freeBytes": 15420000000 },
      "db": { "status": "UP", "database": "SportsEngine-InMemTransactional" }
    }
  }
  ```

#### `GET /api/health`
* **Purpose**: REST API service telemetry & memory metrics.
* **Auth**: Public.
* **Response (200 OK)**:
  ```json
  {
    "status": "UP",
    "project": "ArenaSync (BIT-57 Sports Platform)",
    "timestamp": "2026-09-21T18:00:00.000Z",
    "uptimeSeconds": 1420,
    "database": "ONLINE",
    "memoryUsageMB": 79
  }
  ```

#### `GET /api/metrics`
* **Purpose**: Operational counters and database entity tallies.
* **Auth**: Public.
* **Response (200 OK)**:
  ```json
  {
    "totalTeams": 8,
    "totalPlayers": 88,
    "totalTournaments": 1,
    "totalAlerts": 4,
    "totalAuditLogs": 24,
    "concurrencyCollisionsHandled": 0
  }
  ```

---

### 2.2. Authentication & User Management

#### `POST /api/auth/login`
* **Purpose**: Authenticate user session and issue JWT token with role claims.
* **Auth**: Public.
* **Request Body**:
  ```json
  { "email": "referee@smartsports.edu", "role": "REFEREE" }
  ```
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "user": { "id": "usr-ref-1", "name": "Marcus Webb", "role": "REFEREE" },
    "token": "arenasync-jwt-usr-ref-1-eyJ1c2VySWQiOiJ1c3ItcmVmLTEiLCJyb2xlIjoiUkVGRVJFRSJ9"
  }
  ```

#### `GET /api/auth/users`
* **Purpose**: Retrieve demo system users and assigned roles.
* **Auth**: Public.
* **Response (200 OK)**: Array of `User` objects.

---

### 2.3. Tournaments & Fixtures

#### `GET /api/tournaments`
* **Purpose**: Retrieve active tournaments and formats.
* **Auth**: Public.
* **Response (200 OK)**: Array of `Tournament` objects.

#### `POST /api/tournaments`
* **Purpose**: Create a new championship tournament.
* **Auth**: `ADMIN` role required.
* **Request Body**: `{ "name": "Cup 2026", "sport": "Soccer", "format": "SINGLE_ELIMINATION" }`
* **Response (201 Created)**: Created `Tournament` entity.
* **Errors**: `400 Bad Request` (missing name), `401 Unauthorized`, `403 Forbidden`.

#### `GET /api/fixtures`
* **Purpose**: Retrieve all scheduled and completed match fixtures.
* **Auth**: Public.
* **Response (200 OK)**: Array of `Match` objects.

#### `POST /api/fixtures/generate`
* **Purpose**: Generate knockout bracket or round-robin match fixtures.
* **Auth**: `ADMIN` role required.
* **Request Body**:
  ```json
  { "tournamentId": "tour-1", "format": "SINGLE_ELIMINATION", "venue": "Grand Olympic Stadium" }
  ```
* **Response (200 OK)**:
  ```json
  { "success": true, "count": 7, "matches": [...] }
  ```
* **Errors**: `400 Bad Request` (<2 teams registered), `404 Not Found`.

---

### 2.4. Teams & Athlete Eligibility

#### `GET /api/teams`
* **Purpose**: Retrieve registered franchises with standings metrics.
* **Auth**: Public.
* **Response (200 OK)**: Array of `Team` objects.

#### `POST /api/teams`
* **Purpose**: Register a new franchise team.
* **Auth**: `ADMIN` role required.
* **Request Body**: `{ "name": "Titan FC", "code": "TIT", "coachName": "Elena Rostova" }`
* **Response (201 Created)**: Created `Team` object.
* **Errors**: `400 Bad Request` (duplicate name/code, missing fields).

#### `GET /api/players`
* **Purpose**: Query athlete roster with optional filters (`?teamId=...`, `?eligibility=...`).
* **Auth**: Public.
* **Response (200 OK)**: Array of `Player` objects.

#### `POST /api/players`
* **Purpose**: Register a new student-athlete to a squad roster.
* **Auth**: `ADMIN` or `COACH` role required.
* **Response (201 Created)**: Created `Player` object with initial `PENDING` eligibility.

#### `POST /api/players/:id/documents`
* **Purpose**: Upload athlete eligibility certification document.
* **Auth**: `ADMIN`, `COACH`, or `PLAYER` role required.
* **Request Body**: `{ "documentType": "MEDICAL_CERTIFICATE", "fileName": "med.pdf" }`
* **Response (201 Created)**: Created `EligibilityDocument` object.

#### `PUT /api/players/:id/documents/:docId/verify`
* **Purpose**: Verify or reject student-athlete eligibility document.
* **Auth**: `ADMIN` role required.
* **Request Body**: `{ "status": "VERIFIED", "notes": "Transcript verified" }`
* **Response (200 OK)**: `{ "document": {...}, "playerEligibility": "VERIFIED" }`
* **Errors**: `400 Bad Request` (invalid status), `404 Not Found`.

---

### 2.5. Live Scoring & Concurrency Control

#### `POST /api/matches/:id/start`
* **Purpose**: Transition match from `SCHEDULED` to `LIVE`.
* **Auth**: `ADMIN` or `REFEREE` role required.
* **Response (200 OK)**: Updated `Match` object.

#### `POST /api/matches/:id/score`
* **Purpose**: Safely mutate live match score with optimistic version locking.
* **Auth**: `ADMIN` or `REFEREE` role required.
* **Request Body**:
  ```json
  {
    "homeScore": 2,
    "awayScore": 1,
    "expectedVersion": 1,
    "minute": 45,
    "detail": "Goal by Julian Reyes"
  }
  ```
* **Response (200 OK)**: Updated `Match` object (version incremented: `v1 -> v2`).
* **Errors**:
  * `400 Bad Request`: Score is locked (`match.status === 'COMPLETED'`) or negative scores submitted.
  * `409 Conflict`: OCC collision when `match.version !== expectedVersion`.
    ```json
    {
      "error": "Concurrency conflict: Match state was updated by another user. Please reload the latest score.",
      "currentVersion": 2,
      "currentHomeScore": 2,
      "currentAwayScore": 0
    }
    ```

#### `POST /api/matches/:id/events`
* **Purpose**: Record live in-game events (yellow cards, red cards, fouls, substitutions).
* **Auth**: `ADMIN` or `REFEREE` role required.
* **Response (200 OK)**: Updated `Match` object with prepended event.

#### `POST /api/matches/:id/complete`
* **Purpose**: Finalize match, lock scores, advance bracket winners, and update standings.
* **Auth**: `ADMIN` or `REFEREE` role required.
* **Response (200 OK)**: `{ "success": true, "match": {...}, "standings": [...] }`

---

### 2.6. Standings & Workload Analytics

#### `GET /api/standings/:tournamentId`
* **Purpose**: Retrieve automatically computed tournament championship table.
* **Auth**: Public.
* **Response (200 OK)**: Array of `StandingRecord` ranked by points, GD, and goals scored.

#### `GET /api/workload`
* **Purpose**: Retrieve athlete ACWR (7d vs 28d) workloads and sweet-spot distribution.
* **Auth**: Public.
* **Response (200 OK)**: `{ "workloads": [...], "highWorkloadCount": 3, "averageAcwr": "1.24" }`

#### `GET /api/injury-flags`
* **Purpose**: Retrieve statistical ACWR and manual staff flags with clinical disclaimer. Defaults to `ACTIVE` flags.
* **Auth**: Public.
* **Query Params**: `status` (`ACTIVE` | `RESOLVED` | `VOIDED` | `ALL`), `playerId` (optional string).
* **Response (200 OK)**:
  ```json
  {
    "flags": [
      {
        "id": "flag-man-1789994580-x9a",
        "playerId": "ply-1",
        "playerName": "Julian Reyes",
        "teamId": "team-1",
        "teamName": "Apex Strikers",
        "source": "MANUAL",
        "category": "INJURY",
        "severity": "HIGH",
        "notes": "Hamstring strain grade 1",
        "status": "ACTIVE",
        "createdBy": "Elena Rostova",
        "createdAt": "2026-10-03T10:00:00.000Z"
      }
    ],
    "summary": { "highCount": 1, "moderateCount": 2, "lowCount": 1, "totalTracked": 4 },
    "clinicalDisclaimer": "All flags and risk tiers are statistical workload & fatigue models or manual staff logs, NOT medical diagnoses."
  }
  ```

#### `POST /api/players/:id/injury-flags`
* **Purpose**: Create a new manual injury, illness, or suspension flag.
* **Auth**: `ADMIN`, or `COACH` (for players on their own team).
* **Request Body**:
  ```json
  {
    "category": "INJURY", // "INJURY" | "ILLNESS" | "SUSPENSION"
    "severity": "HIGH",   // "LOW" | "MODERATE" | "HIGH"
    "notes": "Hamstring strain reported during practice." // max 500 chars
  }
  ```
* **Response (201 Created)**: Created `InjuryRiskFlag` object.
* **Errors**: `400 Bad Request` (invalid input), `401 Unauthorized` (no token), `403 Forbidden` (wrong role/team), `404 Not Found` (player).

#### `PUT /api/injury-flags/:id`
* **Purpose**: Edit category, severity, or notes of an `ACTIVE` manual flag.
* **Auth**: `ADMIN`, or `COACH` (for players on their own team).
* **Request Body**: `{ "category"?: "INJURY", "severity"?: "MODERATE", "notes"?: "Swelling reduced" }`
* **Response (200 OK)**: Updated `InjuryRiskFlag` object.
* **Errors**: `400 Bad Request` (invalid input), `403 Forbidden` (ACWR_AUTO flag or wrong team), `404 Not Found`, `409 Conflict` (if RESOLVED/VOIDED).

#### `PUT /api/injury-flags/:id/resolve`
* **Purpose**: Resolve an active manual flag upon athlete medical clearance.
* **Auth**: `ADMIN`, or `COACH` (for players on their own team).
* **Response (200 OK)**: Resolved `InjuryRiskFlag` object with `resolvedBy` and `resolvedAt`.
* **Errors**: `403 Forbidden` (ACWR_AUTO flag or wrong team), `404 Not Found`, `409 Conflict` (already RESOLVED or VOIDED).

#### `DELETE /api/injury-flags/:id`
* **Purpose**: Soft-delete (VOID) a manual flag with mandatory reason. Preserves historical record.
* **Auth**: `ADMIN`, or `COACH` who created it / manages that team.
* **Request Body**: `{ "voidReason": "Flag entered in error; athlete fully cleared." }`
* **Response (200 OK)**: Voided `InjuryRiskFlag` object with `voidedBy`, `voidedAt`, and `voidReason`.
* **Errors**: `400 Bad Request` (missing `voidReason`), `403 Forbidden` (ACWR_AUTO flag or wrong team/creator), `404 Not Found`, `409 Conflict` (already VOIDED).

#### `GET /api/players/:id/clearance`
* **Purpose**: Evaluate athlete kickoff clearance gate against document verification and blocking injury/suspension flags.
* **Auth**: Public.
* **Response (200 OK)**:
  ```json
  {
    "playerId": "ply-1",
    "playerName": "Julian Reyes",
    "cleared": false,
    "reason": "Player Julian Reyes is blocked at kickoff clearance gate due to active HIGH severity manual injury flag: Hamstring strain grade 1."
  }
  ```

#### `GET /api/analytics/players`
* **Purpose**: Retrieve top scorers, assists, minutes, and disciplinary counts.
* **Auth**: Public.

---

### 2.7. Governance & Administration

#### `GET /api/audit-logs`
* **Purpose**: Stream immutable governance audit records with actor/diff provenance.
* **Auth**: `ADMIN` role required (`Authorization: Bearer <adminToken>`).
* **Response (200 OK)**: Array of `AuditLogEntry` objects.
* **Errors**: `401 Unauthorized` (no token), `403 Forbidden` (non-admin role).

#### `POST /api/experiments/concurrency-test`
* **Purpose**: Capstone verification endpoint simulating 10 concurrent score mutations.
* **Auth**: `ADMIN` role required.
* **Response (200 OK)**: Concurrency resolution metrics.

#### `POST /api/reset-demo`
* **Purpose**: Restore database to initial clean seed state.
* **Auth**: `ADMIN` role required.
* **Response (200 OK)**: `{ "success": true }`
