# inspir AI Study Platform

inspir is a full-stack AI study toolkit for students, teachers, and lifelong learners. It began as a quiz generator and has grown into a broad learning workspace with 50 live study tools, 16 planned tools, AI-assisted content generation, progress tracking, and focused study workflows.

The production app is built for `https://quiz.inspir.uk`. This repository is now the source of truth for the quiz-first, 50-tool study platform.

## Why This Exists

Most study apps solve one narrow problem. inspir is designed as a connected learning workspace: generate a quiz from notes, explain the weak spots, turn ideas into flashcards, organize a study plan, stay focused with timers, and track progress in one product loop.

The product goal is simple: help learners move from passive reading to active recall, practice, reflection, and consistency.

## Product Snapshot

- 50 live tools across active learning, AI help, focus, organization, visual learning, social learning, analytics, and gamification.
- AI quiz generation from uploaded PDFs, DOCX files, text, or topics.
- Doubt solving, text summarization, study-guide generation, math solving, citation generation, and worksheet creation.
- Flashcards, practice tests, mind maps, concept maps, Cornell notes, study timers, custom timers, focus mode, goals, streaks, XP, badges, reports, and study groups.
- Supabase-backed authentication, saved work, history, progress, and student activity.
- SEO-ready Vite frontend with static assets, sitemap, RSS, robots, and prerender support.

The canonical tool registry lives in [frontend/src/config/tools.js](frontend/src/config/tools.js).

## Architecture

```text
.
├── backend/          Express API, Supabase clients, auth, AI controllers, migrations
├── frontend/         React/Vite app, routes, pages, components, SEO assets
├── deploy/           Nginx and deployment support
├── docs/             Supporting documentation
├── SETUP.md          Original detailed local setup notes
└── README.md         Project overview and operating guide
```

## Tech Stack

- Frontend: React 19, Vite 7, React Router, Tailwind CSS, Framer Motion, Lucide, KaTeX, React Flow.
- Backend: Node.js, Express 5, Supabase, Anthropic SDK, JWT auth, bcrypt, Multer, Mammoth.
- Data: Supabase/Postgres with schema files in `backend/`.
- AI: Anthropic Claude via `ANTHROPIC_API_KEY`.
- Deployment: Static frontend build plus Node API, with Nginx examples in `deploy/`.

## Local Development

You need Node.js 20 or newer, npm, a Supabase project, and an Anthropic API key.

### 1. Configure the backend

```bash
cd backend
cp .env.example .env
npm install
```

Set these values in `backend/.env`:

```bash
PORT=3000
HOST=0.0.0.0
FRONTEND_URL=http://localhost:5173

ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-5-20250929

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

JWT_SECRET=a-long-random-secret-at-least-32-characters
```

Start the API:

```bash
npm run dev
```

Health check:

```bash
curl http://localhost:3000/api/health
```

### 2. Configure the frontend

```bash
cd ../frontend
cp .env.example .env
npm install
```

Set these values in `frontend/.env`:

```bash
VITE_API_URL=http://localhost:3000/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Start the UI:

```bash
npm run dev
```

Open `http://localhost:5173`.

## Build And Checks

Frontend production build:

```bash
cd frontend
npm run build
```

Frontend lint:

```bash
cd frontend
npm run lint
```

Backend smoke test:

```bash
cd backend
npm start
curl http://localhost:3000/api/health
```

## Database Setup

Apply the schema files that match the features you are enabling. The main setup files are:

- `backend/database-complete-setup.sql`
- `backend/database-schema.sql`
- `backend/database-schema-local-auth.sql`
- `backend/database-focus-tools.sql`
- `backend/database-next-15-tools.sql`
- `backend/database-new-features.sql`
- `backend/database-doubt-solver.sql`
- `backend/database-flashcards.sql`
- `backend/database-practice-tests.sql`

Run the SQL in the Supabase SQL editor or through your deployment workflow. Some newer tools require the focus and next-tool schema files before they can persist user data.

## Working On Tools

Each tool usually has four touchpoints:

- Tool metadata in `frontend/src/config/tools.js`.
- A route and page in `frontend/src/App.jsx` and `frontend/src/pages/`.
- API routes in `backend/routes/`.
- Controller logic in `backend/controllers/`.

When adding a tool, make the empty, loading, error, success, and unauthenticated states feel complete. If it persists data, include the Supabase schema update and document it in the PR.

## Security Notes

- Never commit `.env` files, API keys, Supabase tokens, JWT secrets, database dumps, or production user data.
- Keep provider keys on the server. Anything prefixed with `VITE_` is bundled into the browser.
- Use `SUPABASE_SERVICE_ROLE_KEY` only in backend code paths.
- Avoid logging raw prompts, private student content, tokens, or personally identifying data.
- Report vulnerabilities privately. See [SECURITY.md](SECURITY.md).

## Contributing

Pull requests are welcome when they are focused, tested, and easy to review. Good areas to improve:

- Tool UX, empty states, and accessibility.
- AI prompt robustness and safer failure states.
- Supabase schema clarity and migration hygiene.
- Documentation, onboarding, and deployment notes.
- Performance, code splitting, and bundle-size reduction.

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a PR.

## Deployment Notes

The historical deploy script expects the production domain `quiz.inspir.uk`:

```bash
./deploy.sh
```

For other hosts, update the environment variables, CORS origins, static build destination, and Nginx config before deploying.

## License

MIT. See [LICENSE](LICENSE).
