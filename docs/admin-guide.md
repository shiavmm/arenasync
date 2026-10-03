# ArenaSync — Technical Administrator & Operations Guide (BIT-57)

This guide provides technical operations instructions for System Administrators, Tournament Directors, and DevOps Engineers managing the **ArenaSync** platform.

---

## 1. System Overview & Architectural Topology

ArenaSync is built as a unified monolithic application:
* **Frontend**: React 19 Single Page Application with Tailwind CSS and Lucide icons.
* **Backend**: Express 4.21 REST API bundled with ESBuild into CommonJS (`dist/server.cjs`).
* **Database**: High-performance in-memory transactional database engine (`SportsDatabase`).
* **Observability**: Spring-compatible `/actuator/health` and `/api/metrics` telemetry endpoints.

*For detailed architectural specifications and C4 diagrams, see [docs/architecture.md](file:///c:/Users/Priya%20Yadav/Downloads/arenasync/docs/architecture.md) and [docs/solution-design-pack.md](file:///c:/Users/Priya%20Yadav/Downloads/arenasync/docs/solution-design-pack.md).*

---

## 2. Roles & Permissions (RBAC)

ArenaSync strictly enforces role claims via the `authenticate` and `requireRole` middleware in `server/api.ts`:

```typescript
// Roles defined in src/types.ts
export type Role = 'ADMIN' | 'REFEREE' | 'COACH' | 'PLAYER' | 'VIEWER';
```

| Security Role | Permissions & Scope | Protected Routes |
|---|---|---|
| **ADMIN** | Full administrative rights over tournaments, fixtures, document approvals, teams, audit logs, and demo resets. | `/api/tournaments` (POST/PUT), `/api/teams` (POST), `/api/fixtures/generate`, `/api/players/:id/documents/:docId/verify`, `/api/audit-logs`, `/api/reset-demo` |
| **REFEREE** | Match kickoff, live scoring, disciplinary card logging, and match completion reports. | `/api/matches/:id/start`, `/api/matches/:id/score`, `/api/matches/:id/events`, `/api/matches/:id/complete` |
| **COACH** | Squad player registration and document submission for their assigned team. | `/api/players` (POST), `/api/players/:id/documents` (POST) |
| **PLAYER** | Personal document uploads and stats inspection. | `/api/players/:id/documents` (POST) |
| **VIEWER** | Public read-only access to standings, brackets, fixtures, and telemetry. | All public `GET` routes |

---

## 3. Starting the Application

### 3.1. Local Node.js Development Mode
```bash
# Start with live hot-reloading (Vite middleware + tsx)
npm run dev
```

### 3.2. Production Standalone Build & Run
```bash
# 1. Compile React SPA and bundle backend into dist/server.cjs
npm run build

# 2. Start production server
npm start
```

---

## 4. Environment Configuration

ArenaSync is configured using 12-factor environment variables:

| Variable | Description | Default Value | Required in Production |
|---|---|---|---|
| `PORT` | TCP Port the server binds to | `3000` | Optional |
| `NODE_ENV` | Application environment (`production` or `development`) | `development` | Recommended (`production`) |
| `GEMINI_API_KEY` | Google Gemini AI API key for AI tournament analysis | `""` | Optional |
| `APP_URL` | Base hosting URL for self-referential links | `http://localhost:3000` | Optional |

To configure variables locally, create a `.env.local` file:
```bash
PORT=3000
NODE_ENV=production
GEMINI_API_KEY="your-gemini-api-key-here"
APP_URL="http://localhost:3000"
```

---

## 5. In-Memory Database & State Management

ArenaSync utilizes an in-process, thread-safe transactional store (`SportsDatabase` in `server/db.ts`).
* **Seeding**: On process startup, `db.seedInitialData()` pre-populates 8 teams, 88 athletes, live matches, sample audit records, and tournament configurations.
* **Resetting Database**: To restore the database to its clean seed state via API:
  ```bash
  curl -X POST http://localhost:3000/api/reset-demo \
    -H "Authorization: Bearer arenasync-jwt-usr-admin-1-..."
  ```

---

## 6. Team & Franchise Management

### Registering a New Team (`POST /api/teams`)
```bash
curl -X POST http://localhost:3000/api/teams \
  -H "Authorization: Bearer <adminToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Vanguard Elite",
    "code": "VNG",
    "coachName": "Marcus Vance",
    "coachEmail": "coach@vanguard.edu",
    "sport": "Football / Soccer",
    "homeVenue": "North Campus Stadium",
    "primaryColor": "#059669"
  }'
```
*Validation*: Rejects duplicate names or codes (`HTTP 400`).

---

## 7. Eligibility Verification Desk

### Approving or Rejecting Athlete Documents (`PUT /api/players/:id/documents/:docId/verify`)
```bash
curl -X PUT http://localhost:3000/api/players/p1/documents/doc-1/verify \
  -H "Authorization: Bearer <adminToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "VERIFIED",
    "notes": "Academic transcript confirmed with Registrar Office",
    "verifiedBy": "Prof. David Vance"
  }'
```
*Eligibility Gate*: When all uploaded documents for a player are `VERIFIED`, `player.eligibilityStatus` automatically flips to `VERIFIED`. If any document is rejected, the status becomes `REJECTED`.

---

## 8. Tournament & Fixture Generation

### Generating Knockout Brackets (`POST /api/fixtures/generate`)
```bash
curl -X POST http://localhost:3000/api/fixtures/generate \
  -H "Authorization: Bearer <adminToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "tournamentId": "tour-1",
    "format": "SINGLE_ELIMINATION",
    "venue": "Grand Olympic Stadium"
  }'
```
*Algorithmic Linking*: For 8 teams, generates 7 matches:
* 4 Quarter-Finals (`match-qf-1` to `match-qf-4`)
* 2 Semi-Finals (`match-sf-1`, `match-sf-2`)
* 1 Championship Final (`match-fn-1`)
* Sets forward pointers: `qf1.nextMatchId = 'match-sf-1'`, `qf1.nextMatchSlot = 'home'`.

---

## 9. Live Scoring & Optimistic Concurrency Control (OCC)

### Mutating Live Score (`POST /api/matches/:id/score`)
```bash
curl -X POST http://localhost:3000/api/matches/match-qf-1/score \
  -H "Authorization: Bearer <refereeOrAdminToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "homeScore": 2,
    "awayScore": 1,
    "expectedVersion": 1,
    "minute": 45,
    "detail": "Goal by Julian Reyes"
  }'
```
* **Success (`HTTP 200`)**: Increments `version: 1 -> 2`.
* **Conflict (`HTTP 409`)**: If `match.version !== expectedVersion`, the server rejects the stale update and returns the current server version.

---

## 10. Standings & Workload Analytics

* **Standings (`GET /api/standings/:tournamentId`)**: Automatically updated upon match completion (`POST /api/matches/:id/complete`).
* **Workload (`GET /api/workload`)**: Computes Acute (7-day) vs. Chronic (28-day) Workload Ratios (ACWR).
* **Injury Flags (`GET /api/injury-flags`)**: Scans for acute spikes ($\text{ACWR} \ge 1.50$) and fixture congestion ($\ge 3\text{ matches in 48h}$).

---

## 11. Immutable Audit Logging

### Querying Audit Trail (`GET /api/audit-logs`)
```bash
curl -X GET http://localhost:3000/api/audit-logs \
  -H "Authorization: Bearer <adminToken>"
```
Returns reverse-chronological list of governance events:
```json
[
  {
    "id": "log-1789994580-x9a",
    "timestamp": "2026-09-21T18:00:00.000Z",
    "userId": "usr-admin-1",
    "userName": "Prof. David Vance",
    "userRole": "ADMIN",
    "action": "VERIFY_DOCUMENT",
    "entityType": "DOCUMENT",
    "entityId": "doc-101",
    "previousValue": "PENDING",
    "newValue": "VERIFIED - Player status: VERIFIED"
  }
]
```

---

## 12. Health & Observability Endpoints

ArenaSync provides production telemetry endpoints:

```bash
# 1. Spring-compatible Actuator Health Probe
curl -i http://localhost:3000/actuator/health
# Returns HTTP 200 {"status":"UP","details":{"diskSpace":{...},"db":{...}}}

# 2. REST API Health & Process Telemetry
curl -i http://localhost:3000/api/health
# Returns HTTP 200 {"status":"UP","uptimeSeconds":1420,"memoryUsageMB":79}

# 3. Operational Relational Metrics
curl -i http://localhost:3000/api/metrics
# Returns HTTP 200 {"totalTeams":8,"totalPlayers":88,"concurrencyCollisionsHandled":19}
```

*For complete endpoint contracts, see [docs/api-specification.md](file:///c:/Users/Priya%20Yadav/Downloads/arenasync/docs/api-specification.md).*

---

## 13. Security Hardening Controls

Implemented in `server/security.ts` and `server.ts`:
1. **Fingerprint Suppression**: `app.disable('x-powered-by')` removes backend technology indicators.
2. **Payload Protection**: Express JSON body parser bound strictly capped at `2mb`.
3. **HTTP Security Headers**: Enforces `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `X-XSS-Protection: 1; mode=block`, and `Referrer-Policy: strict-origin-when-cross-origin`.
4. **Credential Scanning**: Automated security linter (`npm run security:check`) verifies zero uncommitted `.env` secrets on disk.

---

## 14. Containerized Docker Deployment

### 14.1. Building the Docker Image
```bash
docker build -t arenasync:latest .
```

### 14.2. Running with Docker CLI
```bash
docker run -d \
  --name arenasync-app \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e GEMINI_API_KEY="" \
  -e APP_URL="http://localhost:3000" \
  arenasync:latest
```

### 14.3. Running with Docker Compose
```bash
# Start container in background
docker compose up -d

# View container logs
docker compose logs -f

# Stop container
docker compose down
```

---

## 15. Continuous Integration (CI/CD)

The GitHub Actions workflow (`.github/workflows/ci.yml`) executes:
1. **Security & Dependency Verification**: Runs `npm run security:check`.
2. **Test Matrix**: Runs `npm test` and `npm run test:coverage` across Node.js `20.x` and `22.x`.
3. **Performance & Baseline Evaluation**: Runs `npm run evaluate:baseline` and `npm run evaluate:performance`.
4. **Docker Verification**: Builds container image and queries `/actuator/health` probe.

---

## 16. Backup & Data Persistence Limitations

* **In-Memory Architecture**: ArenaSync stores entity state in memory (`SportsDatabase`). 
* **State Lifespan**: State persists during active server runtime. When restarting the Node.js process or replacing a container image, data resets to the initial demo seed.
* **Persistent Migration**: For production enterprise deployments requiring multi-year longitudinal storage, administrators should attach an external SQL datastore (e.g., PostgreSQL).

---

## 17. Safe Shutdown & Restart Considerations

To safely stop or restart ArenaSync without leaving lingering zombie background processes:
```bash
# Stop Docker Container
docker stop arenasync-app

# Graceful Node process shutdown (SIGTERM / SIGINT)
# Send Ctrl+C in interactive terminal or kill -15 <PID> in Linux
```

---

## 18. Troubleshooting

| Symptom | Root Cause | Administrative Resolution |
|---|---|---|
| **`EADDRINUSE: port 3000 already in use`** | Another process is occupying port 3000. | Set `PORT=3001` or terminate the competing process using `netstat -ano \| findstr :3000`. |
| **`403 Forbidden on /api/audit-logs`** | Request sent without an `ADMIN` role token. | Re-authenticate using the Admin persona (`admin@smartsports.edu`). |
| **`409 Conflict on /api/matches/:id/score`** | Optimistic locking detected competing write. | Client re-syncs state; check audit logs to see which official committed first. |
| **`400 Bad Request on /api/fixtures/generate`** | Under 2 teams enrolled in tournament. | Ensure at least 2 teams are registered before generating bracket. |

---

## 19. Known Limitations

1. **In-Memory Store**: Data resets upon process restart.
2. **Decision-Support Analytics**: ACWR fatigue metrics and injury flags are sports science heuristics, not medical diagnoses.
3. **Loopback Benchmark Scope**: Performance benchmarks reflect in-memory Node.js processing over local loopback interfaces.
