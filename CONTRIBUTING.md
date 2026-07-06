# Contributing to RandevuAI

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready |
| `feat/*` | New features |
| `fix/*` | Bug fixes |
| `docs/*` | Documentation |

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add multi-staff calendar support
fix: resolve WhatsApp webhook signature validation
docs: update architecture diagram
refactor: extract Gemini function calling tools
test: add appointment slot calculation unit tests
```

## Pull Request Process

1. Fork and create a feature branch from `main`.
2. Ensure `npm run build` and `npm run check:env` pass.
3. Update README and `.env.example` if env vars or architecture change.
4. Open PR with description, motivation, and test steps.

## Security

Never commit `.env.local`. Report vulnerabilities via [SECURITY.md](./SECURITY.md).
