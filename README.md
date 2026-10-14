# TaskAnt

TaskAnt is a university System Design & Analysis project: a local task marketplace for Bangladesh.

**Small Tasks. Big Impact.**

## Run the project

Install each existing project’s dependencies:

```bash
npm install
npm install --prefix client
npm install --prefix server
```

Start the Next.js frontend and Express API together:

```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend health check: http://localhost:5000/api/health

The root `dev` command starts Next.js and Express concurrently. The client can also be run by itself with `npm run dev:client`; the legacy Vite fallback remains available with `npm run dev --prefix client` at http://localhost:5173.

## Frontend and API

The Next.js App Router serves the application, while the existing React pages and components in `client/src` are reused through a shared React Router shell. This is an incremental migration: it keeps the existing client-side navigation and browser-based authentication instead of rewriting the screens all at once.

The browser calls the existing Express API directly. Its default URL is `http://localhost:5000/api`. To use a different API URL, create a root `.env.local` file and set:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

The API and Socket.IO server allow the Next.js origin (`http://localhost:3000`) and the Vite fallback origin (`http://localhost:5173`) for local development. Set `CLIENT_URL` in the server environment when deploying to a different frontend origin.

## Existing functionality and current gaps

The reusable frontend currently includes the landing, About, How It Works, login, registration, and dashboard screens, plus shared UI components, API services, types, and styles. The backend already provides task, bid, messaging, notification, payment, review, verification, reporting, and admin endpoints.

Several frontend screens linked from the navigation are not implemented yet, including task browsing/details and most task-management and admin pages. Those URLs show an explicit “not available yet” message instead of pretending the feature works. The admin demo login can open the admin area, but the admin management UI remains incomplete.

The Express backend and its JSON-based demo store are unchanged. The server loads `server/data/store.json` and seeds demo data only when no users exist; do not delete that file if you want to keep the current local demo records. The existing demo login forms show the seed accounts.

## Build

```bash
npm run build
```

This builds the Next.js frontend and type-checks/builds the Express backend. To build the retained Vite fallback separately:

```bash
npm run build --prefix client
```
