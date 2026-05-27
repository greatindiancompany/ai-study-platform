# inspir AI Study Platform

An auth-enabled branch of the inspir AI study platform with student workflows, memory, tools, and parent controls.

## Mission

This repo pushes the inspir learning prototype toward a safer student product: authenticated learners, parent-controlled age filters, persistent memory, and tools that help students study in more than one way.

## What This Repository Contains

Public branch of the inspir study platform with React/Vite frontend, Express backend, Supabase/Postgres, auth controllers, parent/student routes, memory migrations, blog/SEO scripts, Sentry, UptimeRobot, OAuth, and monitoring documentation.

## Highlights

- Student login and protected learning flows.
- Parent controls, memory views, sessions, tracking, billing, and personalization.
- AI chat plus 15 study tools.
- Database migrations and verification scripts for memory and personalization tables.

## Tech Stack

- React and Vite
- Node.js and Express
- Supabase/Postgres
- Claude API
- JWT auth
- Stripe, Resend/Nodemailer, Sentry, and monitoring docs

## Getting Started

```bash
cd frontend && npm install
cd ../backend && npm install
npm run dev
```

## Quality Checks

```bash
cd frontend && npm run build
```

## Repository Notes

- Default branch is auth-implementation.
- Never commit OAuth, JWT, Supabase, payment, or email provider secrets.

## Contributing

Contributions are welcome. The best contributions are specific, tested, and grounded in the product mission. Good places to help include documentation, accessibility, tests, bug reports, UI polish, data validation, and safer AI behavior.

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

## Security

Please do not open public issues for secrets, auth bypasses, data exposure, provider key leaks, or abuse vectors. Follow [SECURITY.md](SECURITY.md).

## Code of Conduct

This project follows [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Be direct, kind, and useful.

## License

MIT. See [LICENSE](LICENSE).
