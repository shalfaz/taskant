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

## MongoDB Atlas

The API uses MongoDB through the existing Mongoose models. Copy `.env.example` to `.env`, set `MONGODB_URI` to the Atlas Node.js connection string, and set `JWT_SECRET` to a unique random value of at least 32 characters before production deployment. Keep `.env` private; it is ignored by Git.

On API initialization, the app connects to MongoDB before serving requests. `/api/health` and `/api/health/mongodb` report whether the application database connection is ready. If MongoDB is unavailable or not configured, API initialization fails with a 503 instead of falling back to volatile storage.

If `server/data/store.json` exists and all nine application collections in MongoDB are empty, the app imports its records once using new MongoDB ObjectIds and remapped references. This import does not overwrite existing Atlas documents or delete/change the JSON file. If Atlas already contains records, the import is skipped. Do not run the seed command against a production database unless you intend this guarded import behavior.

Profile and task image uploads are available through the authenticated `/api/uploads` endpoint. Configure `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, and `CLOUDINARY_CLOUD_NAME` (or the existing public cloud-name variable) to enable them. JPEG, PNG, and WebP images are checked by content signature and limited to 5 MB. This project currently has no verification-document upload field; private verification documents are not uploaded. Report attachments do not yet have a private upload/access flow.

The browser calls the same-origin API at `/api`. To use a different API URL, create a root `.env.local` file and set:

```env
NEXT_PUBLIC_API_URL=https://your-api.example.com/api
```

The backend-only settings, including `JWT_SECRET` and `CLIENT_URL`, remain server-side environment variables. Do not prefix secrets with `NEXT_PUBLIC_`.

## Existing functionality and current gaps

The existing frontend includes the landing page with featured tasks, About, How It Works, login, registration, and dashboard screens, plus shared UI components, API services, types, and styles. The backend already provides task, bid, messaging, notification, payment, review, verification, reporting, and admin endpoints.

Several frontend screens linked from the navigation are not implemented yet, including task browsing/details and most task-management and admin pages. Those URLs show an explicit “not available yet” message instead of pretending the feature works. The admin demo login can open the admin area, but the admin management UI remains incomplete.

Socket.IO source and dependencies are retained, but Vercel Route Handlers do not host the existing long-lived Socket.IO server. There are no current frontend call sites for the socket client; real-time messaging/notifications would need a compatible external real-time service or a host that supports persistent WebSocket servers.

## Build

```bash
npm run build
```

This builds the single Next.js application. Run `npm run typecheck` and `npm run lint` for standalone checks.
