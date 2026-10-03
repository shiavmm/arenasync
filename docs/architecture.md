# ArenaSync — Architecture & C4 Design Specifications (BIT-57)

This document describes the concrete system architecture for **ArenaSync (BIT-57)** using the **C4 Model** (Context, Containers, Components).

---

## 1. C4 Level 1: System Context Diagram

The System Context diagram illustrates the human actors, their roles, and external evaluation/observability systems interacting with the ArenaSync boundary.

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

---

## 2. C4 Level 2: Container Architecture Diagram

The Container diagram illustrates the high-level technical building blocks that compose ArenaSync.

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

---

## 3. C4 Level 3: Component Architecture Diagram (Express Backend)

The Component diagram reveals the internal modular composition of the backend server layer (`server/api.ts`, `server/db.ts`, `server/security.ts`, `server.ts`).

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
