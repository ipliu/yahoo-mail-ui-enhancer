## Language & Style

Create GitHub Issues, pull requests, and related tracker content in English.

## Agent skills

### Issue tracker

Issues and specs are tracked in GitHub Issues. See `docs/agents/issue-tracker.md`.

Run every authenticated `gh` command with full host permissions (outside the sandbox; in Codex, use `sandbox_permissions: require_escalated`) so it can access the user's valid GitHub CLI credentials. Never print, copy, or otherwise expose authentication tokens.

### Domain docs

This is a single-context repository. See `docs/agents/domain.md`.

## Development workflow

Follow these gates for every product change:

1. Confirm the requirement before implementation. Use `/grill-me` or `/grill-with-docs` when deeper requirement validation is needed.
2. Create a dedicated `codex/`-prefixed branch before making changes.
3. Implement the change using `/implement` when available, run relevant checks, and update the version when the change is releasable.
4. Record durable, significant decisions in the appropriate documentation: use `docs/adr/` for architectural decisions, and `docs/specs/` for feature behavior, product rules, and implementation constraints.
5. Align `README.md`, `CHANGELOG.md`, applicable specifications, and manual-acceptance guidance with the change.
6. Commit the work, then wait for the user to complete manual verification. Do not claim manual verification has passed on the user's behalf.
7. Push and create a non-draft pull request only after the user confirms manual verification has passed.

## Documentation navigation

Before changing the project, read the documents relevant to the task:

- `CONTEXT.md` for the product context and canonical terminology.
- `docs/adr/` for applicable architectural decisions.
- `docs/specs/` for feature requirements and behavior.
- `docs/manual-acceptance.md` when a change affects user-visible behavior or release verification.
- `docs/agents/` for repository-specific agent procedures.
