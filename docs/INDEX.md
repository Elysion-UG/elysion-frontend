# Documentation Index

This index maps each topic to its primary documentation source.

## Documentation Files

| File                                              | Purpose                                                                              |
| ------------------------------------------------- | ------------------------------------------------------------------------------------ |
| [`README.md`](../README.md)                       | Project overview, tech stack, module status, setup instructions, project structure   |
| [`CONTRIBUTING.md`](../CONTRIBUTING.md)           | Contributor guide: branching strategy, commit format, PR process, CI overview        |
| [`docs/api-integration.md`](./api-integration.md) | API reference: HTTP client, all endpoints, error handling, service pattern (SSOT)    |
| [`docs/BACKEND_QUIRKS.md`](./BACKEND_QUIRKS.md)   | Known response discrepancies: field names, missing wrappers, unimplemented endpoints |
| [`docs/CODE_STANDARDS.md`](./CODE_STANDARDS.md)   | Code conventions: naming, patterns, testing requirements                             |
| [`docs/CICD_PIPELINE.md`](./CICD_PIPELINE.md)     | GitHub Actions workflows, quality gates, pre-commit hooks                            |
| [`docs/ROADMAP.md`](./ROADMAP.md)                 | Development roadmap, phase status, open items                                        |
| [`docs/archive/`](./archive/)                     | Superseded and planning-phase documents                                              |

## Topic → SSOT

| Topic                                | Primary Source                                    |
| ------------------------------------ | ------------------------------------------------- |
| API base URL & environment variables | [`README.md`](../README.md)                       |
| API client service pattern           | [`docs/api-integration.md`](./api-integration.md) |
| Authentication flow                  | [`README.md`](../README.md) (overview)            |
| TypeScript types                     | [`src/types/index.ts`](../src/types/index.ts)     |
| Known backend API quirks             | [`docs/BACKEND_QUIRKS.md`](./BACKEND_QUIRKS.md)   |
| Project directory structure          | [`README.md`](../README.md)                       |
| Code naming conventions              | [`docs/CODE_STANDARDS.md`](./CODE_STANDARDS.md)   |
| CI/CD pipeline details               | [`docs/CICD_PIPELINE.md`](./CICD_PIPELINE.md)     |
| Feature roadmap & status             | [`docs/ROADMAP.md`](./ROADMAP.md)                 |
| Branching & PR process               | [`CONTRIBUTING.md`](../CONTRIBUTING.md)           |
