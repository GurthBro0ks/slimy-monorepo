# AI Prompt Usage Guide for Slimy.ai

This guide explains how to safely and effectively use AI agents on the Slimy.ai monorepo. It complements the [AI Prompt Library](./ai-prompt-library.md) with best practices, tool selection, and safety guidelines.

## Table of Contents

- [Choosing the Right AI Tool](#choosing-the-right-ai-tool)
- [Safety Guidelines](#safety-guidelines)
- [Workflow Best Practices](#workflow-best-practices)
- [Repository Conventions](#repository-conventions)
- [Common Pitfalls](#common-pitfalls)
- [Emergency Procedures](#emergency-procedures)

---

## Choosing the Right AI Tool

### ChatGPT / GitHub Copilot Agent Mode

**Best for:**
- Long-form documentation and planning
- Complex architectural analysis
- Multi-step research tasks
- Writing comprehensive specs and ADRs

**Strengths:**
- Excellent at structured documentation
- Good for iterative refinement
- Strong at understanding context from multiple files
- Great for brainstorming and design discussions

**Limitations:**
- Cannot execute commands directly
- Requires manual file operations
- Best used for planning, not execution

**When to choose:**
```
Use ChatGPT/Copilot when you need to:
- Design system architecture
- Write comprehensive documentation
- Plan large features before implementation
- Analyze trade-offs and alternatives
```

---

### Claude Code / Claude Projects

**Best for:**
- File reading and analysis
- Code exploration and understanding
- Creating documentation from existing code
- Planning with direct code inspection

**Strengths:**
- Direct file system access (read-only in our usage)
- Excellent code understanding
- Can analyze multiple files in context
- Great for architectural reviews

**Limitations:**
- We constrain it to documentation-only tasks
- Better for analysis than execution in our workflow

**When to choose:**
```
Use Claude Code when you need to:
- Explore unfamiliar codebases
- Understand existing implementations
- Create documentation from code
- Perform architectural analysis
- Trace dependencies and relationships
```

---

### Blackbox CLI / Quick Agents

**Best for:**
- Quick documentation updates
- Simple, focused tasks
- Rapid prototyping of docs
- Time-sensitive documentation

**Strengths:**
- Fast and concise
- Good for simple, well-defined tasks
- Minimal overhead

**Limitations:**
- Less context awareness
- Not ideal for complex planning
- May need more specific instructions

**When to choose:**
```
Use Blackbox when you need to:
- Quick README updates
- Simple API documentation
- Fast incident notes
- Brief diagnostic reports
```

---

## Safety Guidelines

### The Golden Rule: Documentation First, Code Later

**Always create documentation before modifying code:**

1. **Research Phase** (AI-assisted)
   - Explore existing code
   - Understand patterns and conventions
   - Identify dependencies and impacts

2. **Planning Phase** (AI-assisted)
   - Create specs in `docs/`
   - Design architecture
   - Document alternatives and trade-offs

3. **Review Phase** (Human)
   - Review AI-generated documentation
   - Validate assumptions
   - Approve or iterate on plan

4. **Implementation Phase** (Human or careful AI-assisted)
   - Only proceed after documentation is approved
   - Implement on feature branch
   - Follow the documented plan

### Branch Safety Protocol

**NEVER work on main/master branch with AI agents:**

```bash
# Always create a feature branch first
git checkout -b feature/ai-documented-[feature-name]

# Or for documentation-only work
git checkout -b docs/[documentation-topic]
```

**Branch naming conventions:**
- `docs/*` - Documentation-only changes
- `feature/*` - New features (with docs)
- `fix/*` - Bug fixes (with investigation docs)
- `refactor/*` - Refactoring (with ADRs)
- `test/*` - Test additions (with test plans)

### Backup Strategy

**Before starting AI-assisted work:**

1. **Check for uncommitted changes:**
   ```bash
   git status
   # If dirty, commit or stash first
   ```

2. **Create a backup tag:**
   ```bash
   git tag backup-before-ai-$(date +%Y%m%d-%H%M%S)
   git push origin --tags
   ```

3. **Work on feature branch:**
   ```bash
   git checkout -b docs/ai-[task-name]
   ```

4. **Commit frequently:**
   ```bash
   # After each AI session or logical unit
   git add docs/
   git commit -m "docs: [what was documented]"
   ```

### Read-Only vs Write Operations

**Default mode: Read-Only Documentation**

AI agents should primarily operate in read-only mode:

✅ **Allowed:**
- Reading any file in the repository
- Analyzing code structure and patterns
- Creating NEW documentation files in `docs/`
- Creating NEW scripts in `infra/scripts/` (non-destructive)
- Running read-only commands (`ls`, `cat`, `grep`, `git log`)

❌ **Restricted (requires explicit approval):**
- Modifying existing source code
- Changing configuration files
- Running build or deployment commands
- Restarting services
- Deleting files
- Modifying git history

### Production Environment Safety

**NEVER run AI agents against production without safeguards:**

1. **Read-only access:** Ensure AI has no write access to production
2. **Document first:** Create runbooks before any production change
3. **Human verification:** All production changes require human review
4. **Rollback plan:** Document rollback before making changes
5. **Change windows:** Schedule production changes, don't do them ad-hoc

---

## Workflow Best Practices

### 1. Investigation & Documentation Workflow

```
┌─────────────────────────────────────────┐
│ 1. Define the Question/Problem          │
│    - What do you need to understand?    │
│    - What decision needs documentation? │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│ 2. Choose AI Tool                        │
│    - Complex analysis → Claude Code      │
│    - Planning → ChatGPT                  │
│    - Quick docs → Blackbox               │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│ 3. Create Feature Branch                 │
│    git checkout -b docs/[topic]          │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│ 4. Use Prompt from Library               │
│    - Paste prompt from ai-prompt-library │
│    - Customize with specific details     │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│ 5. Review AI Output                      │
│    - Validate accuracy                   │
│    - Check for hallucinations            │
│    - Verify file paths and references    │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│ 6. Commit Documentation                  │
│    git add docs/ && git commit           │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│ 7. Create PR for Review                  │
│    - Documentation changes only          │
│    - Tag reviewers                       │
└─────────────────────────────────────────┘
```

### 2. Feature Planning Workflow

When planning a new feature with AI:

**Phase 1: Research (AI-assisted)**
```bash
# Use Claude Code or ChatGPT to:
# 1. Understand existing patterns
# 2. Identify similar features
# 3. Map dependencies

# Output: docs/research/[feature]-analysis.md
```

**Phase 2: Specification (AI-assisted)**
```bash
# Use ChatGPT for comprehensive specs:
# 1. Feature requirements
# 2. API contracts
# 3. UI/UX flows
# 4. Data models

# Output: docs/features/[feature]-spec.md
```

**Phase 3: Architecture (AI-assisted)**
```bash
# Use ChatGPT or Claude Code for:
# 1. Architecture design
# 2. Component breakdown
# 3. Integration points
# 4. Migration strategy

# Output: docs/adr/NNNN-[feature]-architecture.md
```

**Phase 4: Implementation Plan (AI-assisted)**
```bash
# Use ChatGPT for detailed plan:
# 1. File structure
# 2. Implementation phases
# 3. Testing strategy
# 4. Rollout plan

# Output: docs/pr-plans/[feature]-implementation.md
```

**Phase 5: Human Review**
```bash
# Review all AI-generated docs
# Validate assumptions
# Approve or iterate
```

**Phase 6: Implementation (Human or carefully supervised AI)**
```bash
# Only proceed after Phase 5 approval
# Follow documented plan
# Create separate PRs per phase
```

### 3. Incident Investigation Workflow

When investigating production issues with AI assistance:

**Step 1: Create Incident Branch**
```bash
git checkout -b docs/incident-YYYY-MM-DD-[brief-description]
```

**Step 2: Gather Information (AI-assisted)**
```bash
# Use prompts from "Infra & Server Health" section
# AI reads logs, checks status, identifies patterns
# DO NOT restart services or modify configs yet
```

**Step 3: Document Findings**
```bash
# AI creates: docs/incidents/YYYY-MM-DD-[issue].md
# Include: timeline, root cause, impact, evidence
```

**Step 4: Propose Solution (AI-assisted)**
```bash
# AI suggests fixes and creates:
# - docs/incidents/YYYY-MM-DD-[issue]-solution.md
# - Rollback plan
# - Testing steps
```

**Step 5: Human Review & Approval**
```bash
# Review incident docs
# Validate root cause
# Approve solution approach
```

**Step 6: Careful Implementation**
```bash
# Follow documented solution
# Test in staging first
# Have rollback ready
```

---

## Repository Conventions

### Documentation File Locations

Follow these conventions for AI-generated documentation:

```
docs/
├── adr/                           # Architecture Decision Records
│   └── NNNN-[decision-title].md   # Sequential numbering
│
├── api-specs/                     # API endpoint specifications
│   └── [endpoint-name].md
│
├── features/                      # Feature specifications
│   └── [feature-name]-spec.md
│
├── pr-plans/                      # Implementation plans
│   └── [feature-name]-implementation.md
│
├── enhancements/                  # Enhancement proposals
│   └── [system-name]-v2.md
│
├── monitoring/                    # Monitoring & observability
│   ├── dashboards/
│   │   └── [name].json
│   └── [name]-dashboard-guide.md
│
├── testing/                       # Test plans and coverage
│   ├── coverage-analysis.md
│   └── e2e-test-scenarios.md
│
├── incidents/                     # Incident reports
│   └── YYYY-MM-DD-[issue].md
│
├── deployments/                   # Deployment guides
│   └── [deployment-name]-YYYY-MM-DD.md
│
├── infra/                         # Infrastructure docs
│   └── [topic].md
│
├── analytics/                     # Analytics specs
│   └── [dashboard-name]-spec.md
│
├── dependencies/                  # Dependency audits
│   └── audit-YYYY-MM-DD.md
│
└── research/                      # Research and analysis
    └── [topic]-analysis.md
```

### File Naming Conventions

**Documentation files:**
- Use kebab-case: `user-timeline-spec.md`
- Include dates for time-sensitive docs: `audit-2025-11-19.md`
- Version significant updates: `codes-system-v2.md`
- Use descriptive names: `snail-timeline-implementation.md`

**ADR files:**
- Format: `NNNN-[decision-title].md`
- Sequential numbers: `0001-monorepo-structure.md`
- Keep titles short and descriptive

**Incident reports:**
- Format: `YYYY-MM-DD-[brief-issue-description].md`
- Example: `2025-11-19-admin-api-500-errors.md`

### Script Locations

AI-generated scripts (diagnostic, deployment helpers):

```
infra/
├── scripts/
│   ├── diagnostics/           # Diagnostic scripts
│   │   └── check-[service]-health.sh
│   │
│   ├── deployment/            # Deployment helpers
│   │   └── deploy-[app]-[env].sh
│   │
│   └── maintenance/           # Maintenance scripts
│       └── backup-[resource].sh
```

**Script naming:**
- Descriptive action: `check-admin-api-health.sh`
- Include target: `deploy-web-production.sh`
- Use `.sh` for bash, `.js` for Node scripts

### Configuration Conventions

AI should create NEW config files, not modify existing:

```
# Create versioned or timestamped configs
Caddyfile.new
Caddyfile.2025-11-19
admin-api.service.v2
prometheus.yml.optimized
```

**Include deployment instructions:**
```bash
# Always document the switch process
docs/deployments/config-update-YYYY-MM-DD.md
```

---

## Common Pitfalls

### 1. AI Hallucination of File Paths

**Problem:** AI invents file paths that don't exist.

**Solution:**
```bash
# Always verify file paths before using
ls -la [path]

# Search for actual files
find . -name "[pattern]"

# Grep for specific code patterns
grep -r "pattern" apps/
```

### 2. Outdated Context

**Problem:** AI references old code that has been refactored.

**Solution:**
- Always review the actual current code
- Verify timestamps on documentation
- Check git history for recent changes
- Update prompts with current file paths

### 3. Over-Engineering in Plans

**Problem:** AI suggests overly complex solutions.

**Solution:**
- Review for simplicity
- Check if existing patterns can be reused
- Question new dependencies or abstractions
- Prefer boring, proven solutions

### 4. Missing Error Handling in Specs

**Problem:** AI focuses on happy path, forgets error cases.

**Solution:**
- Always ask AI to include error scenarios
- Request failure mode analysis
- Demand fallback strategies
- Include recovery procedures

### 5. Ignoring Existing Conventions

**Problem:** AI suggests patterns that don't match codebase style.

**Solution:**
- Point AI to existing similar code
- Request consistency with current patterns
- Review for style consistency
- Update prompts to emphasize existing conventions

### 6. Security Oversights

**Problem:** AI specs miss security considerations.

**Solution:**
- Always explicitly ask about security
- Request auth/authz specifications
- Demand input validation requirements
- Include threat model in planning

---

## Emergency Procedures

### If AI Modifies Production Code Accidentally

```bash
# 1. Immediately stop the AI session

# 2. Check what was modified
git status
git diff

# 3. If changes are bad, revert
git checkout -- [files]
# or restore entire working directory
git reset --hard HEAD

# 4. Check if anything was committed
git log -n 5

# 5. If bad commit exists, revert it
git revert [commit-hash]
# or if not pushed yet
git reset --hard HEAD^

# 6. Document what happened
# Create incident report in docs/incidents/
```

### If AI Suggests Dangerous Operations

**Red flags to watch for:**
- `rm -rf` commands
- `DROP TABLE` SQL statements
- `--force` flags on critical operations
- Direct production database modifications
- Disabling security features
- Exposing secrets or credentials

**Response:**
1. **Stop immediately** - Don't execute
2. **Question the AI** - Ask for safer alternatives
3. **Consult team** - Get human review
4. **Document concern** - Note in incident log
5. **Revise prompt** - Add safety constraints

### If Documentation Contains Errors

```bash
# 1. Don't panic - documentation errors are low-risk

# 2. Fix the errors
# Edit the markdown files directly

# 3. Commit the correction
git add docs/
git commit -m "docs: fix errors in [file]"

# 4. Consider updating the AI prompt
# Add the correction to the prompt library
```

### Recovery Checklist

When things go wrong:

- [ ] Stop AI session immediately
- [ ] Check git status and diff
- [ ] Revert unwanted changes
- [ ] Verify production is unaffected
- [ ] Document what went wrong
- [ ] Update prompts to prevent recurrence
- [ ] Share learnings with team

---

## Tips for Success

### 1. Start Small

Begin with simple documentation tasks:
- README updates
- API documentation
- Configuration guides
- Investigation notes

**Avoid starting with:**
- Complex refactoring plans
- Critical production changes
- Large architectural redesigns

### 2. Iterate and Refine

AI works best with iteration:
```
1. First pass: Get rough draft
2. Review: Identify gaps and errors
3. Second pass: Ask AI to improve specific sections
4. Review: Verify improvements
5. Repeat: Until satisfactory
```

### 3. Be Specific in Prompts

**Vague prompt:**
> "Document the API"

**Better prompt:**
> "Document the /api/codes endpoint including query parameters, response format, caching behavior, and error codes. Follow the pattern in docs/api-specs/auth-me.md"

### 4. Verify Everything

Trust, but verify:
- Check file paths exist
- Verify code references are accurate
- Test commands in safe environment
- Review for logical consistency

### 5. Maintain Context

Help AI understand context:
- Reference existing docs in prompts
- Point to similar implementations
- Specify relevant constraints upfront
- Include recent changes or decisions

### 6. Document Your Workflows

As you develop effective AI-assisted workflows:
- Document what works
- Share successful prompts
- Update this guide
- Contribute to the prompt library

---

## Getting Help

### When to Ask Humans vs AI

**Ask AI for:**
- Documentation drafts
- Code exploration and analysis
- Planning and brainstorming
- Researching existing patterns
- Creating templates

**Ask humans for:**
- Critical decisions
- Production approvals
- Security reviews
- Performance trade-offs
- Business logic validation

### Resources

- **AI Prompt Library**: [ai-prompt-library.md](./ai-prompt-library.md)
- **Repository Structure**: [STRUCTURE.md](./STRUCTURE.md)
- **Onboarding Guide**: [ONBOARDING.md](./ONBOARDING.md) *(if exists)*
- **Architecture Decisions**: [adr/](./adr/) *(directory)*

### Feedback Loop

Help improve this guide:
1. Note what works and what doesn't
2. Document new effective prompts
3. Share learnings with the team
4. Update this guide and the prompt library

---

## Quick Reference Card

### Before Starting Any AI Session

```bash
# 1. Create feature branch
git checkout -b docs/[topic]

# 2. Optional: Create backup tag
git tag backup-$(date +%Y%m%d-%H%M%S)

# 3. Choose right AI tool (see "Choosing the Right AI Tool")

# 4. Select prompt from ai-prompt-library.md

# 5. Customize prompt with specific details

# 6. Review AI output carefully

# 7. Commit documentation frequently
git add docs/ && git commit -m "docs: [what you added]"
```

### During AI Session

- ✅ Read code and analyze
- ✅ Create new documentation
- ✅ Plan and design
- ✅ Research and investigate
- ❌ Modify existing code
- ❌ Run destructive commands
- ❌ Change production configs
- ❌ Delete files

### After AI Session

```bash
# 1. Review all changes
git diff

# 2. Verify documentation accuracy
# - Check file paths
# - Verify code references
# - Test any commands

# 3. Commit if satisfied
git add docs/
git commit -m "docs: [description]"

# 4. Push and create PR (for documentation review)
git push origin docs/[topic]
```

---

**Remember:** AI is a powerful assistant for documentation and planning. Use it to accelerate research and spec writing, but always maintain human oversight for critical decisions and code changes.

---

**Last Updated**: 2025-11-19
**Maintainer**: Slimy.ai Team
**Related Docs**: [ai-prompt-library.md](./ai-prompt-library.md), [STRUCTURE.md](./STRUCTURE.md)
