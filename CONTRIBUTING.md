# Contributing To inspir AI Study Platform

Thanks for helping improve inspir. This project is most useful when it is clear, safe, fast, and genuinely helpful for learners.

## Before You Start

- Read the README and run the app locally.
- Check existing issues and recent PRs.
- Keep your change focused on one problem or feature.
- Do not commit secrets, local env files, production data, screenshots with private content, or generated dependency folders.

## Local Setup

Backend:

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Frontend:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Quality Checks

Run the checks that match your change:

```bash
cd frontend
npm run build
npm run lint
```

For backend work, start the API and confirm the health endpoint:

```bash
cd backend
npm start
curl http://localhost:3000/api/health
```

## Pull Request Checklist

Include:

- What changed.
- Why it changed.
- How it was tested.
- Screenshots or a short recording for UI changes.
- Any schema, environment, deployment, or data notes.
- Any known limitations or follow-up work.

## Product Standards

- Make tools feel complete: loading, empty, error, success, and unauthenticated states all matter.
- Keep the student workflow obvious. A user should know what to do next without reading docs.
- Prefer accessible components: semantic markup, visible focus states, keyboard support, and readable contrast.
- Keep AI outputs explainable and recoverable. Show helpful failure messages when provider calls fail.
- Avoid adding dependencies unless they remove real complexity.

## Security Expectations

- Keep Anthropic, Supabase, JWT, OAuth, and deployment credentials out of git.
- Do not expose service-role keys to the frontend.
- Do not log private student content, raw tokens, or provider secrets.
- Treat uploaded study material as private user content.

## Coding Style

- Follow existing file and route patterns.
- Keep changes scoped to the relevant tool or workflow.
- Prefer small helpers over broad rewrites.
- Add comments only where they clarify non-obvious behavior.
- If a tool needs persistent data, include the matching SQL schema update.

## Community

Be practical, kind, and specific. Good reviews explain risks and tradeoffs without making the work feel mysterious.
