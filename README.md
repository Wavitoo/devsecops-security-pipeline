# TaskVault — DevSecOps Security Pipeline

A complete DevSecOps pipeline built from scratch around a small Node.js/Express/PostgreSQL API, demonstrating shift-left security practices integrated into every stage of the software development lifecycle.

This is not a collection of security tools bolted onto an app — it's a working CI/CD pipeline where each security gate was tested against both clean code and intentionally vulnerable code, with every incident documented.

## 1. Project Overview

TaskVault is a minimal task-management API (register, login, CRUD tasks) — deliberately simple so the focus stays on the security pipeline wrapped around it, not the application's business logic.

## 2. Objectives

- Understand and demonstrate the DevSecOps philosophy: security as a continuous, automated part of the SDLC, not a manual gate at the end
- Build a real CI/CD pipeline with 6 automated security controls (SAST, SCA, Secret Detection, Container Security, DAST, plus unit tests)
- Prove each control actually works: not just installed, but validated against real vulnerable code in isolated demo branches
- Document every real incident encountered while building it (8 in total, see docs/security-report.md)

## 3. Architecture

Developer
-> Git Push -> Pull Request
-> GitHub Actions CI/CD (6 parallel jobs)
   - Lint and Unit Tests
   - SAST (Semgrep, including custom taint-mode rule)
   - SCA (npm audit, blocks HIGH/CRITICAL)
   - Secret Detection (Gitleaks, full history scan)
   - Container Security (Trivy, blocks fixable HIGH/CRITICAL)
   - DAST (OWASP ZAP baseline scan against live container)
-> Security Gate (all 6 must pass)
-> Merge to develop/main (branch-protected, admin included)

Full architecture diagram and component explanations: docs/architecture.md

## 4. Technology Stack

| Layer | Technology | Why |
|---|---|---|
| Backend | Node.js / Express | Standard, large ecosystem for demonstrating SCA |
| Database | PostgreSQL | Realistic relational DB, good injection-testing surface |
| Auth | JWT (Bearer header) + bcrypt | Stateless auth, avoids classic cookie-based CSRF by design |
| Containerization | Docker (multi-stage builds) | Minimal attack surface, non-root user |
| CI/CD | GitHub Actions | Free, integrated, industry-standard |
| SAST | Semgrep (official image + custom rule) | Fast, supports custom taint-tracking rules |
| SCA | npm audit | Native, zero extra setup |
| Secrets | Gitleaks | Industry standard, entropy and pattern detection |
| Container | Trivy | Scans OS packages and app dependencies in one tool |
| DAST | OWASP ZAP | Free, scriptable baseline scan |

## 5. DevSecOps Lifecycle

Shift-left security means catching issues as early as possible in the SDLC, where the cost of fixing them is lowest. This pipeline applies that at every stage:

| Stage | Control | Catches |
|---|---|---|
| Write code | SAST (Semgrep) | Vulnerable patterns (SQLi, hardcoded secrets in code) |
| Add a dependency | SCA (npm audit) | Known CVEs in third-party packages |
| Commit | Secret Detection (Gitleaks + GitHub Push Protection) | Leaked credentials, API keys |
| Build image | Container Security (Trivy) | OS/base-image CVEs, build reproducibility bugs |
| Deploy to test env | DAST (OWASP ZAP) | Runtime misconfigurations (missing headers, etc.) |

## 6. CI/CD Pipeline

6 jobs run in parallel on every pull request targeting main or develop. All 6 are required status checks: no merge is possible, even for the repo admin, unless every job is green (enforce_admins: true on both branches).

See the live workflow: .github/workflows/ci.yml

## 7. Security Controls (Detail)

### SAST — Semgrep
Runs the auto ruleset plus a custom taint-mode rule (security/sast/custom-rules.yml) written specifically because generic rulesets failed to detect the SQL injection demo (a documented false negative, see report). The custom rule tracks tainted input (req.query/body/params) to the raw SQL string argument of pool.query() specifically, correctly ignoring safely-parameterized values.

### SCA — Dependency Audit
npm audit --audit-level=high blocks on HIGH/CRITICAL CVEs. Demonstrated against lodash@4.17.4 (10 known advisories, including CVE-2019-10744).

### Secret Detection — Gitleaks
Full git history scan (fetch-depth: 0). Demonstrated two-layer defense: a Stripe-formatted fake key was blocked by GitHub's native Push Protection before even reaching CI; a generic high-entropy token bypassed that and was caught by Gitleaks in the pipeline instead.

### Container Security — Trivy
Scans the built image for OS and application-level CVEs. A real Dockerfile bug (missing .dockerignore, causing stale local node_modules to leak into the image) was discovered via this scan, not staged. npm/npx/yarn are stripped from the final runtime image to eliminate their own internal CVEs and reduce attack surface.

### DAST — OWASP ZAP
Baseline (passive) scan against the live container. Found 4 real header misconfigurations; fixed 2 via helmet (X-Powered-By leak, missing Permissions-Policy), documented 2 as accepted risk (both only affect nonexistent 404 pages).

## 8. Threat Modeling

Full STRIDE analysis of the architecture: security/threat-model/STRIDE.md — 12 identified threats, mitigation status, and 3 documented follow-ups (rate limiting, JWT revocation, DB port exposure) intentionally left as future work.

## 9. Security Gates

| Severity | Action |
|---|---|
| CRITICAL / HIGH | Pipeline blocked |
| MEDIUM | Warning, non-blocking, tracked |
| LOW / INFO | Logged only |

Full policy: SECURITY.md

## 10. Vulnerabilities Found and Remediation

8 real findings/incidents: 3 intentional demos plus 5 genuinely discovered while building this. Full write-up with CWE/CVSS/OWASP mapping, proof of concept, and verification for each: docs/security-report.md

Highlights:
- A false-green Security Gate (deprecated Semgrep action silently crashed but reported success) — arguably the most important finding, since a broken gate is worse than no gate.
- A supply-chain risk in our own pipeline (mutable GitHub Action tags), caught by Semgrep's own rule, including automatically catching a second instance added later.
- A build reproducibility bug where local filesystem state leaked into a supposedly clean Docker image.

## 11. Accepted Risks

Documented in SECURITY.md — every non-blocking finding has a written justification, not a silent suppression.

## 12. Lessons Learned

- Generic SAST rulesets missed our SQL injection demo entirely. Writing a custom taint-mode rule was necessary and is a stronger portfolio signal than "I ran a scanner."
- A security tool that silently fails and reports green is more dangerous than no tool at all. Always verify a Security Gate blocks on both good and bad code, not just that it runs.
- .dockerignore isn't optional. Its absence caused a real, hard-to-diagnose build reproducibility bug that looked like a false Trivy finding at first.
- Branch protection needs to be applied to every branch PRs target, not just main. An incident during this project (a broken commit merged into develop) revealed protection had only been configured on main.

## 13. Future Improvements

- Rate limiting on auth endpoints
- JWT revocation / refresh token rotation
- Scheduled (not just on-push) container rescans for newly disclosed CVEs
- Full Wazuh/SIEM log shipping integration (see docs/monitoring.md)

## Skills Demonstrated

DevSecOps, CI/CD (GitHub Actions), Application Security, SAST, SCA, DAST, Container Security, Secret Management, Threat Modeling (STRIDE), Docker, OWASP Top 10, Secure SDLC, Custom Security Tooling (Semgrep rule authoring)

## Project Structure

devsecops-security-pipeline/
- README.md
- SECURITY.md
- .github/workflows/ci.yml
- backend/
- docker-compose.yml
- security/threat-model/STRIDE.md
- security/sast/custom-rules.yml
- docs/architecture.md
- docs/security-report.md
- docs/monitoring.md
