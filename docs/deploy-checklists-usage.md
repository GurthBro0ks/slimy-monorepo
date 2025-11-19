# Deployment Checklists Usage Guide

This guide explains how to use the deployment checklist tool to generate and manage checklists for new releases.

## Overview

The deployment checklist tool helps ensure consistent, safe deployments by providing a comprehensive template for tracking pre-deployment checks, rollback plans, and post-deployment validation steps.

## Quick Start

### Generating a New Checklist

Before each deployment, generate a new checklist:

```bash
# From the repository root
./tools/deploy-checklists/new-checklist.sh "deployment-name"
```

Example:
```bash
./tools/deploy-checklists/new-checklist.sh "auth-fixes"
```

You can also run the script without arguments to be prompted for a name:
```bash
./tools/deploy-checklists/new-checklist.sh
```

### What the Script Does

The script will:

1. **Create a timestamped checklist** - Generates a file with format: `YYYYMMDD-HHMMSS-deployment-name.md`
2. **Insert git information** - Automatically adds:
   - Current branch name
   - Current commit hash (full and short)
   - Generation timestamp
3. **Save to history** - Stores the checklist in `docs/deploy-checklists/history/`

### Output Example

```
✓ Checklist created successfully!

File: docs/deploy-checklists/history/20250119-143022-auth-fixes.md
Branch: main
Commit: a1b2c3d

Next steps:
1. Open the checklist: docs/deploy-checklists/history/20250119-143022-auth-fixes.md
2. Fill out all sections before deployment
3. Check off items as you complete them
4. Store the completed checklist in version control
```

## Using the Checklist

### Before Deployment

1. **Generate the checklist** using the script
2. **Open the generated file** in your editor
3. **Fill out all sections:**
   - List services impacted
   - Document database changes
   - Plan rollback steps
   - Define validation steps
4. **Review with your team**
5. **Check off pre-deploy items** as you complete them

### During Deployment

1. **Follow the checklist** step by step
2. **Record actual times** in the Deployment Timeline section
3. **Take notes** in the Notes section for any unexpected issues
4. **Check off items** as they're completed

### After Deployment

1. **Complete post-deploy validation** steps
2. **Fill in the Sign-Off section**
3. **Commit the completed checklist** to version control:
   ```bash
   git add docs/deploy-checklists/history/
   git commit -m "docs: deployment checklist for [deployment-name]"
   ```

## Checklist Sections

### Pre-Deploy Checks
Verify that all preparation work is complete before starting the deployment.

### Services Impacted
List all services, applications, or components that will be affected. This helps with:
- Communication to stakeholders
- Planning monitoring
- Estimating impact

### Database Changes
Document any schema changes, migrations, or data operations. Critical for:
- Risk assessment
- Rollback planning
- Backup requirements

### Rollback Plan
Detailed steps to reverse the deployment if something goes wrong. Include:
- Code rollback steps
- Database rollback procedures
- Estimated rollback time

### Post-Deploy Validation
Verification steps to confirm the deployment was successful. Test:
- Application functionality
- Health checks
- Key user flows
- Integration points

### Monitoring & Alerts
Dashboard and log locations to watch during and after deployment.

### Communication
Track stakeholder notifications and team coordination.

## Storage and Organization

### File Location
All generated checklists are stored in:
```
docs/deploy-checklists/history/
```

### Naming Convention
Files follow the pattern:
```
YYYYMMDD-HHMMSS-short-name.md
```

Examples:
- `20250119-143022-auth-fixes.md`
- `20250120-090000-database-migration.md`
- `20250121-153000-performance-updates.md`

### Version Control

**Always commit completed checklists** to version control. This provides:

- **Audit trail** - Historical record of all deployments
- **Learning resource** - Reference for similar future deployments
- **Incident investigation** - Context if issues arise later
- **Team knowledge** - Shared understanding of deployment practices

```bash
# After completing a deployment
git add docs/deploy-checklists/history/20250119-143022-auth-fixes.md
git commit -m "docs: completed deployment checklist for auth fixes"
git push
```

### Cleanup

Checklists are small markdown files, so they can be kept indefinitely. If cleanup is needed:

- Keep checklists for at least 6-12 months
- Archive old checklists to a separate directory
- Consider compressing very old checklists

## Best Practices

### 1. Generate Early
Create the checklist during planning, not right before deployment. This allows time to:
- Think through all steps
- Get team review
- Identify missing information

### 2. Be Specific
Avoid vague entries like "test the app". Instead:
- "Test login flow with email/password"
- "Verify API endpoint /api/users returns 200"
- "Check dashboard loads within 2 seconds"

### 3. Include URLs
Add direct links to:
- Monitoring dashboards
- Log viewers
- Health check endpoints
- Documentation

### 4. Document the Unexpected
If something unusual happens during deployment, record it in the Notes section. Future deployments will benefit.

### 5. Review Past Checklists
Before creating a new checklist for a similar deployment, review previous ones to:
- Reuse rollback plans
- Remember common gotchas
- Improve your process

### 6. Keep It Updated
If you discover missing steps during a deployment:
- Add them to the current checklist
- Consider updating the template for future deployments

## Integration with Existing Processes

### CI/CD Integration
The checklist tool doesn't modify existing deploy scripts. It complements them by:
- Providing human verification steps
- Documenting decisions and context
- Creating an audit trail

### Deployment Scripts
Your existing deployment scripts (e.g., `apps/web/deploy-to-server.sh`) remain unchanged. Use the checklist to:
- Verify prerequisites before running scripts
- Validate results after scripts complete
- Document manual steps that scripts don't cover

### Team Workflow
Integrate checklists into your workflow:
1. **Planning** - Generate checklist during sprint planning
2. **Review** - Include checklist review in PR process
3. **Deployment** - Use checklist during deployment window
4. **Retrospective** - Reference checklist in post-mortems

## Customization

### Modifying the Template

The template is located at:
```
tools/deploy-checklists/checklist-template.md
```

You can customize it to match your team's needs:
- Add company-specific sections
- Include required compliance checks
- Add links to runbooks or documentation

**Note:** Changes to the template only affect future checklists. Existing checklists remain unchanged.

### Creating Specialized Templates

For different types of deployments, you can create specialized templates:

1. Copy the template:
   ```bash
   cp tools/deploy-checklists/checklist-template.md \
      tools/deploy-checklists/checklist-template-emergency.md
   ```

2. Modify for your use case

3. Update the script to support template selection (or create a new script)

## Troubleshooting

### Script Fails with "Template not found"
Ensure you're running from the repository root or the script directory.

### Git information shows "unknown"
The script tries to get git info but falls back to "unknown" if:
- You're not in a git repository
- Git is not installed
- The repository is corrupted

This is safe - the checklist will still be created.

### Permission denied
Make sure the script is executable:
```bash
chmod +x tools/deploy-checklists/new-checklist.sh
```

## Examples

### Example 1: Minor Bug Fix Deployment

```bash
./tools/deploy-checklists/new-checklist.sh "fix-login-button"
```

Fill out:
- Services impacted: Web frontend only
- Database changes: None
- Rollback plan: Git revert, redeploy
- Post-deploy: Test login flow

### Example 2: Database Migration

```bash
./tools/deploy-checklists/new-checklist.sh "add-user-preferences-table"
```

Fill out:
- Services impacted: API, Web, Background workers
- Database changes: New table, migration scripts listed
- Rollback plan: Rollback migration, restore backup
- Post-deploy: Verify table exists, test preferences API

### Example 3: Major Feature Release

```bash
./tools/deploy-checklists/new-checklist.sh "launch-dark-mode"
```

Fill out:
- Services impacted: All frontend services
- Database changes: User settings schema update
- Rollback plan: Feature flag disable, migration rollback
- Post-deploy: Test theme switching, verify persistence

## Additional Resources

- **Template:** `tools/deploy-checklists/checklist-template.md`
- **Script:** `tools/deploy-checklists/new-checklist.sh`
- **History:** `docs/deploy-checklists/history/`
- **Deployment Guide:** `apps/web/DEPLOYMENT.md`

## Support

If you encounter issues or have suggestions for improving the checklist tool:

1. Review this documentation
2. Check existing checklists for examples
3. Discuss with your team
4. Update the template or documentation as needed

---

**Remember:** The checklist is a tool to help you deploy safely and confidently. Customize it to fit your team's workflow and keep improving it based on your experience.
