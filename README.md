# TaskAnt

TaskAnt is a university System Design & Analysis project: a local task marketplace for Bangladesh.

**Small Tasks. Big Impact.**

## Run the project

Install the frontend and backend dependencies:

```bash
npm install
npm install --prefix server
```

Start the Next.js frontend and Express API together:

```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend health check: http://localhost:5000/api/health

The Express backend is an API, not a website. Its root URL (`http://localhost:5000/`) has no page route and returns 404; use `/api/health` to check that it is running.

The root `dev` command starts Next.js and Express concurrently. If either service fails to start, the other is stopped as well. The frontend explicitly uses port 3000 and will report a port conflict rather than silently switching ports.

Stop both services with `Ctrl+C` in the terminal running `npm run dev`.

## Frontend and API

The Next.js App Router serves the home, About, How It Works, login, registration, dashboard, and admin routes. Existing React components, styles, authentication, and API services in `client/src` are reused by those routes. Navigation uses Next.js links and routing; there is no separate Vite or React Router frontend.

The browser calls the existing Express API directly. Its default URL is `http://localhost:5000/api`, and the backend allows the Next.js origin at `http://localhost:3000`. To use a different API URL, create a root `.env.local` file and set:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Set `CLIENT_URL` in the server environment when deploying to a different frontend origin.

## Existing functionality and current gaps

The existing frontend includes the landing page with featured tasks, About, How It Works, login, registration, and dashboard screens, plus shared UI components, API services, types, and styles. The backend already provides task, bid, messaging, notification, payment, review, verification, reporting, and admin endpoints.

Several frontend screens linked from the navigation are not implemented yet, including task browsing/details and most task-management and admin pages. Those URLs show an explicit “not available yet” message instead of pretending the feature works. The admin demo login can open the admin area, but the admin management UI remains incomplete.

The Express backend and its JSON-based demo store are unchanged. The server loads `server/data/store.json` and seeds demo data only when no users exist; do not delete that file if you want to keep the current local demo records. The existing demo login forms show the seed accounts.

## Build

```bash
npm run build
```

This builds the Next.js frontend and type-checks/builds the Express backend.
