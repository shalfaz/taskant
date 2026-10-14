# TaskAnt

TaskAnt is a university System Design & Analysis project: a local task marketplace for Bangladesh.

**Small Tasks. Big Impact.**

## Run the project

Install the project dependencies from the repository root:

```bash
npm install
```

Start the application:

```bash
npm run dev
```

- Application: http://localhost:3000
- API health check: http://localhost:3000/api/health

`npm run dev` starts only the Next.js development server. Stop it with `Ctrl+C`.

## Frontend and API

The Next.js App Router serves the home, About, How It Works, login, registration, dashboard, and admin routes. Existing React components, styles, authentication, and API services in `client/src` are reused by those routes. All existing API endpoints are available under `/api/*` through a Next.js Route Handler that forwards requests to the existing Express routers, preserving their validation, authentication, and response behavior without starting a separate server.

The browser calls the same-origin API at `/api`. To use a different API URL, create a root `.env.local` file and set:

```env
NEXT_PUBLIC_API_URL=https://your-api.example.com/api
```

The backend-only settings, including `JWT_SECRET` and `CLIENT_URL`, remain server-side environment variables. Do not prefix secrets with `NEXT_PUBLIC_`.

## Existing functionality and current gaps

The existing frontend includes the landing page with featured tasks, About, How It Works, login, registration, and dashboard screens, plus shared UI components, API services, types, and styles. The backend already provides task, bid, messaging, notification, payment, review, verification, reporting, and admin endpoints.

Several frontend screens linked from the navigation are not implemented yet, including task browsing/details and most task-management and admin pages. Those URLs show an explicit “not available yet” message instead of pretending the feature works. The admin demo login can open the admin area, but the admin management UI remains incomplete.

The API still uses the existing JSON-based store at `server/data/store.json` and seeds demo data only when the store has no users. Do not delete or replace that file if you want to keep the current local demo records. The existing demo login forms show the seed accounts.

The JSON store is suitable for local development and demos, but it is not reliable production storage on Vercel: function instances are temporary and may run concurrently, and deployment files are not a durable writable database. Vercel deployments need a shared persistent database (or another durable store) before production writes can be relied upon. The existing file is included in the API route's output trace for reading; this does not make writes persistent.

Socket.IO source and dependencies are retained, but Vercel Route Handlers do not host the existing long-lived Socket.IO server. There are no current frontend call sites for the socket client; real-time messaging/notifications would need a compatible external real-time service or a host that supports persistent WebSocket servers.

## Build

```bash
npm run build
```

This builds the single Next.js application. Run `npm run typecheck` and `npm run lint` for standalone checks.
