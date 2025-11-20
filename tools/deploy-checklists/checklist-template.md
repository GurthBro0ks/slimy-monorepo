# Deployment Checklist

**Generated:** <!-- TIMESTAMP -->
**Branch:** <!-- BRANCH -->
**Commit:** <!-- COMMIT -->

---

## Pre-Deploy Checks

- [ ] All CI/CD tests passing
- [ ] Code review completed and approved
- [ ] Staging environment tested
- [ ] Environment variables verified
- [ ] Dependencies updated and audit clean
- [ ] Build succeeds locally
- [ ] Database migrations tested (if applicable)
- [ ] Feature flags configured correctly
- [ ] Documentation updated

## Services Impacted

<!-- List all services/applications that will be affected by this deployment -->

- [ ] Service 1:
- [ ] Service 2:
- [ ] Service 3:

**Expected Downtime:** <!-- None / XX minutes / etc. -->

## Database Changes

<!-- Document any database schema changes, migrations, or data operations -->

- [ ] Migrations prepared: <!-- Yes/No -->
- [ ] Migrations tested: <!-- Yes/No -->
- [ ] Backup taken: <!-- Yes/No -->
- [ ] Rollback migration ready: <!-- Yes/No -->

**Migration Scripts:**
```
<!-- List migration files or commands -->
```

**Data Impact:**
<!-- Describe any data changes, deletions, or transformations -->

## Rollback Plan

<!-- Document how to roll back if deployment fails -->

**Rollback Steps:**
1. <!-- Step 1 -->
2. <!-- Step 2 -->
3. <!-- Step 3 -->

**Rollback Commit:**
```
<!-- git revert / git checkout / etc. -->
```

**Database Rollback:**
```
<!-- Migration rollback commands -->
```

**Estimated Rollback Time:** <!-- XX minutes -->

## Post-Deploy Validation

<!-- Verification steps to confirm successful deployment -->

- [ ] Application starts successfully
- [ ] Health checks passing
- [ ] Key pages/endpoints accessible
- [ ] Authentication working
- [ ] Database connections stable
- [ ] No critical errors in logs
- [ ] Monitoring dashboards green
- [ ] User-facing features functional

**Test URLs:**
- <!-- https://example.com/health -->
- <!-- https://example.com/status -->

## Monitoring & Alerts

- [ ] Monitor error rates during deployment
- [ ] Check performance metrics
- [ ] Review application logs
- [ ] Verify alerting systems active

**Dashboard Links:**
- <!-- Link to monitoring dashboard -->
- <!-- Link to logs -->

## Communication

- [ ] Stakeholders notified of deployment window
- [ ] Team available for monitoring
- [ ] Support team briefed on changes

## Notes

<!-- Additional notes, considerations, or reminders -->

---

## Deployment Timeline

**Start Time:** <!-- YYYY-MM-DD HH:MM -->
**End Time:** <!-- YYYY-MM-DD HH:MM -->
**Duration:** <!-- XX minutes -->

## Sign-Off

**Deployed By:** <!-- Name -->
**Verified By:** <!-- Name -->
**Date:** <!-- YYYY-MM-DD -->
