# Architecture

## Component Diagram

Internet
  |
  v
GitHub (source control, Actions runner)
  |
  v
CI/CD Pipeline (GitHub Actions)
  - Lint and Unit Tests
  - SAST (Semgrep)
  - SCA (npm audit)
  - Secret Detection (Gitleaks)
  - Container Security (Trivy)
  - DAST (OWASP ZAP)
  |
  v
Docker Compose (local/CI runtime)
  - backend container (Node.js/Express, non-root user)
  - db container (PostgreSQL)
  |
  v
Docker network (internal, backend <-> db only)

## Trust Boundaries

1. Internet <-> Backend API: anyone can send an HTTP request; validated via JWT auth
2. Backend <-> Database: only the backend container can reach PostgreSQL, via internal Docker network and credentials
3. Authenticated user <-> Unauthenticated user: JWT middleware gates all /api/tasks routes
4. User A <-> User B: all task queries scoped by user_id, preventing IDOR

See security/threat-model/STRIDE.md for the full threat analysis of these boundaries.

## Why This Structure

- Multi-stage Docker build: build tools (npm) never ship in the final runtime image
- Non-root container user: limits blast radius if the app process is compromised
- Docker Compose for local dev/CI: matches production-like multi-container setup without needing a full orchestrator for a portfolio-scale project
- GitHub Actions chosen over other CI tools: free, tightly integrated with GitHub-hosted repo, no separate infrastructure to maintain
