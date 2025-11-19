# Incident Report Template

Use this template when documenting production incidents, outages, or significant service disruptions.

---

## Incident: [Brief Title]

**Date:** YYYY-MM-DD
**Severity:** [Critical/High/Medium/Low]
**Status:** [Resolved/Ongoing/Monitoring]

---

### Summary

_Brief description of what happened (2-3 sentences)._

---

### Impact

- **Services Affected:** [List affected services/components]
- **Users Affected:** [Number or percentage of users, or specific user groups]
- **Duration:** [Total time service was degraded or unavailable]
- **Business Impact:** [Revenue loss, customer complaints, SLA breaches, etc.]

---

### Timeline

All times in UTC (or specify timezone).

| Time | Event |
|------|-------|
| YYYY-MM-DD HH:MM | **Detected:** [How the incident was discovered] |
| YYYY-MM-DD HH:MM | [Key investigation/action step] |
| YYYY-MM-DD HH:MM | **Mitigated:** [Temporary fix applied] |
| YYYY-MM-DD HH:MM | [Additional actions] |
| YYYY-MM-DD HH:MM | **Resolved:** [Permanent fix deployed] |

---

### Root Cause

_Detailed explanation of what caused the incident._

OR

**Suspected Root Cause:** _If investigation is ongoing, describe leading theory._

---

### Contributing Factors

_Environmental, process, or systemic issues that made the incident possible or worse:_

- Factor 1
- Factor 2
- Factor 3

---

### What Went Well

_Positive aspects of the response:_

- Detection/alerting worked as expected
- Team responded quickly
- Communication was clear
- Rollback process was smooth

---

### What Needs Improvement

_Gaps, delays, or failures in the response:_

- Monitoring gaps
- Communication delays
- Manual processes that should be automated
- Missing documentation

---

### Action Items

| Action | Owner | Deadline | Status |
|--------|-------|----------|--------|
| [Specific action to prevent recurrence] | @owner | YYYY-MM-DD | Open |
| [Improve monitoring/alerting] | @owner | YYYY-MM-DD | Open |
| [Update documentation] | @owner | YYYY-MM-DD | Open |
| [Technical debt/refactor] | @owner | YYYY-MM-DD | Open |

---

## Example Incidents

### Example 1: Admin Login Loop

**Date:** 2025-03-15
**Severity:** High
**Status:** Resolved

#### Summary

Admin users experienced an infinite redirect loop when attempting to log into the admin dashboard. The issue affected all admin users for approximately 45 minutes during business hours.

#### Impact

- **Services Affected:** Admin dashboard
- **Users Affected:** ~12 admin users (100% of admin staff)
- **Duration:** 45 minutes
- **Business Impact:** Unable to process support tickets or manage user accounts during incident window

#### Timeline

| Time | Event |
|------|-------|
| 2025-03-15 09:23 | **Detected:** Support team reported unable to access admin panel |
| 2025-03-15 09:28 | On-call engineer confirmed redirect loop in browser network tab |
| 2025-03-15 09:35 | Identified recent deployment of session middleware changes |
| 2025-03-15 09:42 | **Mitigated:** Rolled back deployment to previous version |
| 2025-03-15 09:50 | Verified all admin users can log in successfully |
| 2025-03-15 10:08 | **Resolved:** Deployed fixed version with corrected session cookie path |

#### Root Cause

A deployment at 09:15 changed the session cookie path from `/admin` to `/` without updating the authentication redirect logic, causing the app to continuously redirect between login and dashboard routes.

#### Contributing Factors

- No automated testing for admin authentication flows
- Staging environment lacked admin user accounts for testing
- Session configuration not documented clearly

#### What Went Well

- Issue detected within 8 minutes of deployment
- Rollback process was quick and effective
- Clear communication in incident Slack channel

#### What Needs Improvement

- Add E2E tests for admin login flows
- Ensure staging environment mirrors production user types
- Add pre-deployment checklist for auth-related changes

#### Action Items

| Action | Owner | Deadline | Status |
|--------|-------|----------|--------|
| Add Playwright E2E tests for admin login | @dev-team | 2025-03-22 | Completed |
| Create admin test accounts in staging | @ops-team | 2025-03-18 | Completed |
| Document session configuration in runbook | @ops-team | 2025-03-20 | Completed |
| Add auth changes to deployment checklist | @dev-team | 2025-03-17 | Completed |

---

### Example 2: Minecraft Bedrock Unreachable

**Date:** 2025-02-28
**Severity:** Medium
**Status:** Resolved

#### Summary

Minecraft Bedrock server became unreachable to all players. Server process was running but network connectivity was broken due to a misconfigured firewall rule update.

#### Impact

- **Services Affected:** Minecraft Bedrock server
- **Users Affected:** ~45 concurrent players (100% of online players)
- **Duration:** 1 hour 15 minutes
- **Business Impact:** Player frustration, 3 support tickets filed

#### Timeline

| Time | Event |
|------|-------|
| 2025-02-28 18:45 | **Detected:** Multiple players reported connection timeouts in Discord |
| 2025-02-28 18:52 | On-call verified server process running via systemctl, but unreachable |
| 2025-02-28 19:05 | Checked iptables and found UDP port 19132 blocked |
| 2025-02-28 19:12 | Correlated with automated firewall rule update at 18:40 |
| 2025-02-28 19:20 | **Mitigated:** Manually added iptables rule to allow UDP 19132 |
| 2025-02-28 19:25 | Players confirmed they could reconnect |
| 2025-02-28 19:55 | **Resolved:** Updated firewall automation script to persist Bedrock port |
| 2025-02-28 20:00 | Rebooted server to verify rules persist after restart |

#### Root Cause

Automated firewall rule update script did not include UDP port 19132 (Bedrock) in its allowlist. The script only preserved Java edition ports (TCP 25565). When the scheduled update ran at 18:40, it removed the manually-added Bedrock port rule.

#### Contributing Factors

- Firewall rules managed manually rather than via infrastructure-as-code
- Bedrock server was added ad-hoc without updating automation
- No monitoring for Minecraft server connectivity (only process uptime)

#### What Went Well

- Community reported issue quickly via Discord
- Server logs and systemctl made it easy to rule out server crashes
- Firewall logs were detailed enough to identify the issue

#### What Needs Improvement

- Firewall rules should be managed as code (Terraform/Ansible)
- Should have tested firewall script in staging before production rollout
- Need external connectivity monitoring, not just process checks

#### Action Items

| Action | Owner | Deadline | Status |
|--------|-------|----------|--------|
| Migrate firewall rules to Terraform | @ops-team | 2025-03-15 | In Progress |
| Add uptime monitoring for MC Bedrock (external probe) | @ops-team | 2025-03-05 | Completed |
| Document all game server ports in wiki | @ops-team | 2025-03-01 | Completed |
| Review all automation scripts for hardcoded assumptions | @ops-team | 2025-03-20 | Open |

---

## Tips for Writing Incident Reports

1. **Be blameless:** Focus on systems and processes, not individuals
2. **Be specific:** Include exact times, error messages, and commands run
3. **Be actionable:** Every improvement area should have a concrete action item
4. **Be timely:** Write the report within 24-48 hours while details are fresh
5. **Be thorough:** Include enough detail that someone unfamiliar with the incident can understand what happened
