# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records (ADRs) for the slimy-monorepo project.

## What is an ADR?

An Architecture Decision Record (ADR) is a document that captures an important architectural decision made along with its context and consequences. ADRs help teams:

- Understand why certain decisions were made
- Onboard new team members by providing historical context
- Avoid revisiting settled decisions
- Track the evolution of the architecture over time

## Structure

Each ADR is stored as a markdown file with a sequential number prefix:

```
docs/adr/
├── 0000-template.md              # Template for creating new ADRs
├── 0001-monorepo-structure.md    # Example: Decision to use monorepo
├── 0002-nucs-as-deploy-targets.md # Example: NUC deployment strategy
└── README.md                      # This file
```

## Creating a New ADR

1. **Copy the template**:
   ```bash
   cp docs/adr/0000-template.md docs/adr/NNNN-short-title.md
   ```
   Replace `NNNN` with the next sequential number (e.g., 0003, 0004, etc.)

2. **Fill in the template**:
   - **Title**: Brief, descriptive title (50 chars or less)
   - **Status**: Start with "Proposed", update to "Accepted" when decided
   - **Date**: Date of decision (YYYY-MM-DD)
   - **Context**: What forces are at play? What problem are we solving?
   - **Decision**: What are we doing about it? (Use active voice: "We will...")
   - **Consequences**: What are the positive, negative, and neutral impacts?
   - **Alternatives**: What else did we consider and why didn't we choose it?
   - **References**: Links to related docs, discussions, or other ADRs

3. **Commit the ADR**:
   ```bash
   git add docs/adr/NNNN-short-title.md
   git commit -m "docs: add ADR-NNNN for [short title]"
   ```

## ADR Statuses

- **Proposed**: Decision is under discussion, not yet finalized
- **Accepted**: Decision has been agreed upon and is in effect
- **Deprecated**: Decision is no longer relevant but kept for historical context
- **Superseded**: Decision has been replaced by a newer ADR (reference the new ADR number)

## Numbering

- ADRs are numbered sequentially starting from 0001
- 0000 is reserved for the template
- Numbers are zero-padded to 4 digits (0001, 0002, etc.)
- Once an ADR number is assigned, it is never reused, even if the ADR is deleted

## When to Create an ADR

Create an ADR when:
- Making a decision that has significant impact on the project structure
- Choosing between multiple viable technical approaches
- Establishing patterns or standards for the project
- Making a decision that affects multiple teams or components
- Deciding to use or not use a particular technology or framework
- Making trade-offs that others might question later

Don't create an ADR for:
- Minor implementation details
- Decisions that are easily reversible
- Standard best practices with no alternatives considered
- Temporary workarounds or experiments

## Tips for Writing Good ADRs

- **Be concise**: ADRs should be readable in 5-10 minutes
- **Be honest**: Document negative consequences and trade-offs
- **Be specific**: Include enough detail that future readers understand the decision
- **Be value-neutral**: Describe the context objectively
- **Be forward-looking**: Consider long-term implications
- **Link liberally**: Reference related ADRs, docs, and discussions

## References

- [Architecture Decision Records (ADR) by Michael Nygard](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- [ADR GitHub Organization](https://adr.github.io/)
