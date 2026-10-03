# ArenaSync — Smart Sports Tournament & Analytics Platform (BIT-57)

ArenaSync is an intelligent tournament management, live scoring, and athlete workload analytics platform featuring multi-role access control, automated fixture brackets, real-time standings calculations, and AI-driven predictive insights.

---

## 🚀 Quick Start: Local Development

### Prerequisites
- **Node.js**: v20.x or v22.x LTS
- **npm**: v10.x+

### Local Setup Steps
1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   Copy the example environment configuration:
   ```bash
   cp .env.example .env.local
   ```
   Provide your `GEMINI_API_KEY` in `.env.local` if using AI analysis features.

3. **Run Development Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your web browser.

4. **Run Automated Tests & Security Audit:**
   ```bash
   # Run full 10-suite automated test suite (45 tests)
   npm test

   # Run test suite with coverage
   npm run test:coverage

   # Run automated security & secret leak audit
   npm run security:check
   ```

---

## 🐳 Containerized / Reproducible Deployment (Docker)

ArenaSync provides a production-hardened multi-stage Docker build that bundles the React frontend SPA with the Express Node.js backend into an immutable, minimal, and non-root container image.

### 1. Prerequisites
- [Docker Engine](https://docs.docker.com/engine/install/) (v24.0+) or [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Docker Compose](https://docs.docker.com/compose/) (v2.20+) *(optional, for compose workflow)*

---

### 2. Building the Docker Image

Build the production multi-stage image using Docker CLI:
```bash
docker build -t arenasync:latest .
```

*Build details:*
- **Stage 1 (Builder)**: Compiles React frontend SPA via Vite and bundles Express backend via esbuild into `dist/`.
- **Stage 2 (Runner)**: Minimal `node:20-alpine` image with only production dependencies, running as non-root user `node`.

---

### 3. Running the Container

#### Option A: Using Docker CLI
```bash
docker run -d \
  --name arenasync-app \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e GEMINI_API_KEY="your-gemini-api-key" \
  -e APP_URL="http://localhost:3000" \
  arenasync:latest
```

#### Option B: Using Docker Compose
```bash
# Start container in detached mode
docker compose up -d

# View container logs
docker compose logs -f
```

---

### 4. Accessing ArenaSync in the Browser

Once the container is running:
- **Web Application UI**: [http://localhost:3000](http://localhost:3000)
- **API Base Endpoint**: [http://localhost:3000/api](http://localhost:3000/api)
- **Actuator Health Endpoint**: [http://localhost:3000/actuator/health](http://localhost:3000/actuator/health)
- **API Health Endpoint**: [http://localhost:3000/api/health](http://localhost:3000/api/health)

---

### 5. Configuring Environment Variables

ArenaSync supports 12-factor configuration via environment variables:

| Variable | Description | Default | Required |
|---|---|---|---|
| `PORT` | HTTP port the server binds to | `3000` | Optional |
| `NODE_ENV` | Application environment (`production` / `development`) | `production` | Optional |
| `GEMINI_API_KEY` | Google Gemini API key for AI tournament analysis | `""` | Optional |
| `APP_URL` | Canonical hosting URL for self-referential links | `http://localhost:3000` | Optional |

To pass custom environment variables with Docker:
```bash
# Pass variables inline
docker run -d -p 8080:8080 -e PORT=8080 -e GEMINI_API_KEY="my-key" arenasync:latest

# Or pass an environment file
docker run -d -p 3000:3000 --env-file .env.production arenasync:latest
```

---

### 6. Verifying Container Health

The container includes an automated `HEALTHCHECK` instruction. You can inspect container health status:

#### Check Docker Health Status:
```bash
docker ps --filter "name=arenasync-app" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```
*(Status will display `Up X seconds (healthy)`)*

#### Query Health Endpoints directly:
```bash
# Query Actuator Health Endpoint
curl -i http://localhost:3000/actuator/health

# Query REST API Health & Telemetry Endpoint
curl -i http://localhost:3000/api/health
```

Expected JSON Response (`/actuator/health`):
```json
{
  "status": "UP",
  "details": {
    "diskSpace": {
      "status": "UP",
      "freeBytes": 15420000000
    },
    "db": {
      "status": "UP",
      "database": "SportsEngine-InMemTransactional"
    }
  }
}
```

---

### 7. Stopping and Removing the Container

#### Using Docker CLI:
```bash
# Stop running container
docker stop arenasync-app

# Remove container
docker rm arenasync-app

# (Optional) Remove Docker image
docker rmi arenasync:latest
```

#### Using Docker Compose:
```bash
# Stop and remove containers and network
docker compose down
```

---

## 🛡️ Security & CI/CD Pipeline

ArenaSync maintains continuous integration through GitHub Actions (`.github/workflows/ci.yml`):
- **Automated Security & Secret Audit**: Scans repository for uncommitted secrets, verifies strict `.gitignore` rules, ensures HTTP security headers (`X-Content-Type-Options`, `X-Frame-Options`), and confirms server fingerprint suppression (`x-powered-by`).
- **Automated Unit & Integration Test Suites**: Evaluates authentication, role-based access control, athlete document clearance, bracket progression, ACWR workload calculations, and optimistic locking concurrency across Node.js 20.x and 22.x matrix.
