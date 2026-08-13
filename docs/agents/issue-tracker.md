# Issue tracker: GitHub

Issues and specs for this repository live in GitHub Issues. Use the `gh` CLI for all operations.

## Conventions

- Use Conventional Commit-style English titles for Issues, such as `feat: add Popup controls`, `fix: restore sidebar synchronization`, or `docs: clarify manual acceptance`.
- Create an issue with `gh issue create`.
- Read an issue and its comments with `gh issue view <number> --comments`.
- List issues with `gh issue list`, narrowing by state and label as needed.
- Comment with `gh issue comment <number> --body "..."`.
- Apply or remove labels with `gh issue edit <number> --add-label "..."` or `--remove-label "..."`.
- Close an issue with `gh issue close <number> --comment "..."`.

Infer the repository from its Git remote. Pull requests are not a triage surface.

## Publishing

When an engineering skill says to publish a spec or create an issue, create a GitHub Issue.
