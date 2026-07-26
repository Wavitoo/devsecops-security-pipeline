# Threat Model — TaskVault (STRIDE)

## Architecture Overview

Internet --> [Backend API : Express/Node] --> [PostgreSQL DB]

Trust Boundary 1: Internet <-> API
Trust Boundary 2: API <-> DB
Trust Boundary 3: Authenticated user <-> Unauthenticated user
Trust Boundary 4: User A <-> User B (data isolation)

## Assets
- User passwords (bcrypt hashed)
- JWT tokens (identity proof)
- Task data (per-user ownership)
- JWT_SECRET (root of trust for all sessions)
- Database credentials

## Threat Actors
- Anonymous internet attacker
- Authenticated malicious user (valid account, targets other users' data)
- Supply-chain attacker (compromised dependency/action)

## STRIDE Analysis

| # | Component | Threat | Category | Impact | Likelihood | Risk | Mitigation | Status |
|---|-----------|--------|----------|--------|------------|------|------------|--------|
| 1 | Login | Attacker guesses/brute-forces password | Spoofing | High | Medium | High | bcrypt (slow hash, 12 rounds); no rate limiting yet | Partial |
| 2 | Login | Username enumeration via error messages | Info Disclosure | Medium | Medium | Medium | Generic "Invalid credentials" for both wrong user/password | Mitigated |
| 3 | /api/auth/register | SQL Injection via crafted username | Tampering | Critical | Low | Medium | Parameterized queries throughout | Mitigated |
| 4 | JWT | Token forged if JWT_SECRET leaks | Spoofing/Elevation | Critical | Low | High | Secret never committed (Gitleaks + Push Protection); stored in .env, git-ignored | Mitigated |
| 5 | JWT | Token replay after logout (no revocation) | Repudiation | Medium | Medium | Medium | 1h expiry limits window; no server-side revocation list implemented | Accepted |
| 6 | /api/tasks/:id | IDOR - user A deletes/reads user B's task | Elevation of Privilege | High | Medium | High | WHERE id = $1 AND user_id = $2 on all task queries | Mitigated |
| 7 | Dependencies | Known-CVE package silently introduced | Tampering | High | Medium | High | SCA (npm audit) blocks HIGH/CRITICAL in CI | Mitigated |
| 8 | Docker image | Vulnerable base image / bundled tools (npm) | Tampering | High | Medium | Medium | Trivy scan in CI; npm/npx/yarn stripped from runtime stage | Mitigated |
| 9 | CI/CD | Compromised GitHub Action (supply chain) | Tampering | Critical | Low | High | All actions pinned to commit SHA (found via Semgrep custom rule) | Mitigated |
| 10 | API (any route) | Denial of Service via request flooding | Denial of Service | High | Medium | High | No rate limiting implemented yet | Not mitigated |
| 11 | Database | Direct DB access if port 5432 exposed publicly | Info Disclosure | Critical | Low | Medium | Only exposed on Docker internal network in prod; local dev exposes 5432 to host, documented as dev-only | Dev-only exception |
| 12 | Secrets | .env accidentally committed | Info Disclosure | Critical | Low | Medium | .gitignore + Gitleaks CI + GitHub Push Protection (defense in depth, tested in Phase 6) | Mitigated |

## Priority Follow-ups (documented, not yet implemented)

1. Rate limiting on /api/auth/login and /register - mitigates threats 1 and 10. Would use express-rate-limit in a production iteration.
2. JWT revocation list or short-lived tokens plus refresh tokens - mitigates threat 5 more completely.
3. Production deployment should never expose PostgreSQL port externally - threat 11 is acceptable only for local development.

These are intentionally left as future improvements in the README rather than
implemented, to keep the project scope focused on the DevSecOps pipeline itself
rather than exhaustive feature hardening - but they are correctly identified as
open risks, not overlooked ones.
