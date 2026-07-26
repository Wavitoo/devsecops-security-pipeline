# Security Policy

## Reporting a Vulnerability

This is a portfolio/educational project (TaskVault), not a production service handling
real user data. That said, if you find a security issue in the code or pipeline
configuration, please open a GitHub issue or contact the maintainer directly rather
than a public pull request, so any fix can be reviewed before disclosure.

## Severity Thresholds & Pipeline Gates

This project's CI/CD pipeline enforces the following policy across all security tools
(SAST, SCA, Secret Detection, Container Security, DAST):

| Severity | Action |
|----------|--------|
| **CRITICAL** | Pipeline blocked immediately. No merge possible. |
| **HIGH** | Pipeline blocked. Must be fixed or explicitly risk-accepted (see below) before merge. |
| **MEDIUM** | Reported as a warning. Does not block the pipeline, but must be reviewed and tracked. |
| **LOW / INFO** | Informational only. Logged for awareness, no action required. |

### Rationale

- **CRITICAL/HIGH block by default** because these represent exploitable, high-impact
  issues (e.g. SQL injection, known-exploited CVEs, hardcoded secrets). Shipping code
  with these unresolved is not an acceptable trade-off for velocity.
- **MEDIUM/LOW do not block** because blocking on every low-signal finding would
  create alert fatigue and encourage developers to bypass the gate entirely
  (`--admin` overrides, disabling checks). A gate that is too strict gets circumvented;
  a gate that flags real risk gets respected.

## Tool-Specific Configuration

| Tool | Command / Flag | Behavior |
|------|-----------------|----------|
| Semgrep (SAST) | `--error` | Blocks on any finding classified `ERROR` severity |
| npm audit (SCA) | `--audit-level=high` | Blocks on HIGH or CRITICAL severity CVEs only |
| Gitleaks (Secrets) | full history scan (`fetch-depth: 0`) | Blocks on any detected secret, no severity threshold — a leaked secret is always critical |
| Trivy (Container) | `--severity CRITICAL,HIGH --exit-code 1 --ignore-unfixed` | Blocks on fixable CRITICAL/HIGH CVEs; CVEs with no available patch are logged but non-blocking (no actionable remediation exists yet) |
| OWASP ZAP (DAST) | `-I` flag | Blocks only on `FAIL` (active exploitation confirmed); `WARN` findings are reviewed manually (see Accepted Risks) |

## Branch Protection

Both `main` and `develop` require all 5 CI security jobs to pass (`strict` status
checks) before merge, including for repository admins (`enforce_admins: true`).
Pull request review count is set to 0 given this is a solo-maintained project;
the automated status checks serve as the review gate instead.

## Accepted Risks (Documented Exceptions)

The following findings have been reviewed and are intentionally not blocking,
with justification:

1. **CSRF middleware absence** (Semgrep `express-check-csurf-middleware-usage`)
   Authentication uses JWT via the `Authorization: Bearer` header, never cookies.
   Browsers do not automatically attach custom headers to cross-origin requests,
   so classic cookie-based CSRF does not apply to this architecture. Suppressed
   inline via `nosemgrep` with justification comment in `backend/index.js`.

2. **ZAP: CSP "Failure to Define Directive with No Fallback" [10055]**
   Only triggers on 404 error pages (`/`, `/robots.txt`, `/sitemap.xml`), which
   don't exist as real application routes. The application's actual API routes
   (`/api/auth/*`, `/api/tasks/*`, `/health`) are unaffected.

3. **ZAP: Non-Storable Content classification [10049]**
   This ZAP rule flags content as a warning even when the actual behavior
   (content is correctly NOT cached, per our `Cache-Control: no-store` header)
   is the desired secure outcome.

## Known Limitations

- Solo-maintainer project: PR review count is 0; automated checks are the
  primary review mechanism, not human code review.
- DAST baseline scan is passive-only; no active scan (real exploitation attempts)
  is run in CI to keep pipeline runtime reasonable for a portfolio project.
- Container scan only checks the final built image against the Trivy vulnerability
  database at scan time; it does not run on a schedule, so newly disclosed CVEs
  in already-deployed images are not automatically re-flagged (would require a
  scheduled workflow in a production setting).
