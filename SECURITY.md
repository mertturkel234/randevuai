# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| MVP 1.0 | ✅ Active development |

## Reporting a Vulnerability

Email **turkelmert96@gmail.com** with reproduction steps and impact assessment. Do not open public issues.

Response target: **48 hours**. Remediation timeline: **7 days**.

## Security Architecture

### Authentication & Authorization
- Supabase Auth (email/password) with secure session tokens
- Row Level Security (RLS) — each business accesses only its own data
- Service role key used exclusively in server-side webhook handlers

### API Security
- WhatsApp webhook: `x-hub-signature-256` HMAC verification (Meta)
- Cron endpoints: `CRON_SECRET` Bearer token authentication
- Rate limiting: per-business daily message cap (trial: 50/day)

### Data Protection
- All credentials in environment variables (`.env.local`, never committed)
- Google Calendar OAuth2 with scoped permissions
- Customer PII (phone, name) stored in Supabase with RLS isolation
- HTTPS enforced in production (Vercel)

### AI Safety
- Gemini function calling with server-side tool execution only
- No direct database access from AI model — all operations via validated server actions
- Conversation history scoped per business-customer pair

## Environment Variables

See [.env.example](./.env.example) for the complete template. Never commit real values.
