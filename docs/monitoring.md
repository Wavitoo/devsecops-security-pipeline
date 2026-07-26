# Monitoring & SOC Integration

## Current Logging

TaskVault currently produces two log sources:

1. Application logs (stdout/stderr from the Express process): request handling
   errors, unhandled exceptions logged via console.error in each route's catch block.
2. Docker container logs: accessible via docker compose logs backend / docker compose logs db,
   capturing container lifecycle events (start, stop, health checks) and anything
   written to stdout/stderr inside each container.

## Security-Relevant Events Worth Logging (Not Yet Implemented)

For a production deployment, the following events would be valuable to explicitly
capture as structured security logs, distinct from generic application logs:

- Failed login attempts (potential brute-force indicator)
- JWT verification failures (potential forged/tampered token attempts)
- 401/403 responses on /api/tasks routes (potential IDOR probing)
- Rate limit triggers (once rate limiting is implemented, per the threat model
  follow-ups in STRIDE.md)

## Link to SOC Home Lab (Wazuh)

This project intentionally complements the author's separate SOC Home Lab project
(Wazuh, Sysmon, Windows, Kali, MITRE ATT&CK), which focuses on detection and
incident response at the host/network level. TaskVault's pipeline focuses on
preventing vulnerabilities before deployment (Shift Left).

The conceptual link between the two:

DevSecOps (this project): Prevent vulnerabilities before code reaches production,
via SAST / SCA / Secrets / Container / DAST scanning in CI/CD.

SOC / Blue Team (separate project): Detect exploitation attempts against running
systems, via a SIEM (Wazuh) ingesting logs from running application, OS, and network.

In a real production environment, TaskVault's application logs (especially the
security-relevant events listed above) would be shipped to a log aggregator
(e.g. via Filebeat or a Wazuh agent) and forwarded into a SIEM like Wazuh. This
would allow:

- Correlating a spike in failed logins with a specific source IP (brute-force detection)
- Alerting on JWT verification failures at unusual volume (forged token attempts)
- Cross-referencing IDOR probing attempts (403s on /api/tasks) with MITRE ATT&CK
  technique T1078 (Valid Accounts) or T1213 (Data from Information Repositories)

## Why This Wasn't Fully Implemented Here

Setting up a full Wazuh agent and SIEM pipeline for a single small API is out of
scope for this project's goal (demonstrating the DevSecOps pipeline itself,
Phases 1-12). It's documented here as the logical next step and the explicit
connection point between the two portfolio projects, rather than implemented
as a shallow integration that wouldn't reflect a realistic SOC setup.
