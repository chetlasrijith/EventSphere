# 🎉 EventSphere

EventSphere is a full-stack event management platform.  
It allows users to create, manage, and register for events with secure authentication and role-based access control.

---

## Deployment

Recommended topology: Cloudflare Pages hosts the React build and proxies
`/api/*` to a Dockerized FastAPI service. The browser sees one origin, so its
JWT cookie remains readable by the React role navigation without relying on
third-party cookies. PostgreSQL remains a separate managed service.

### Cloudflare Pages

- Root directory: `frontend`
- Build command: `npm run build`
- Build output directory: `dist`
- Pages Function runtime variable `BACKEND_API_URL`: the FastAPI origin, for
	example `https://eventsphere-api.example.com` (no `/api` suffix)
- Leave `VITE_BACKEND_SERVER` unset in Cloudflare so production requests use
	relative `/api/...` URLs and pass through `frontend/functions/api/[[path]].js`.

Set `BACKEND_API_URL` for both Production and Preview, then redeploy. The
Function forwards API requests and responses, including the session cookie.
Use `COOKIE_SAMESITE=lax` for this same-origin browser setup.

### FastAPI and PostgreSQL

Build the API with `backend/Dockerfile` on a container host such as Render,
Railway, or Fly. Its startup command runs Alembic migrations before Uvicorn.
Set these variables on the API service:

```env
DATABASE_URL=postgresql+asyncpg://USER:PASSWORD@HOST:5432/DATABASE
JWT_SECRET=<generate-a-long-random-value>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_DAYS=15
ENVIRONMENT=production
DEBUG=false
CORS_ORIGINS=https://your-pages-domain.example
COOKIE_SAMESITE=lax
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

`JWT_SECRET` must not be the example value. Keep all backend secrets in the API
host's encrypted environment settings. The Cloudinary variables are required
for image uploads; without them, upload endpoints intentionally return an error.

### Local Docker

Copy `backend/.env.example` to `backend/.env`, replace `JWT_SECRET`, then run:

```bash
docker compose up --build
```

Compose starts PostgreSQL and the API on ports 5432 and 8000. Run the React dev
server separately with `cd frontend && npm run dev`. Local Vite requests go
directly to `http://localhost:8000`.

Cloudflare Containers can run Docker images, but they are not a drop-in target
for this Compose file: Cloudflare requires a Worker to manage and route to each
container, and PostgreSQL should still be hosted separately. The Pages + API
container topology above is the simpler deployment path. For direct browser
calls to a separately hosted API, `COOKIE_SAMESITE=none` alone is insufficient
for this app because the frontend also needs to read the JWT cookie; use the
same-origin Pages proxy or add shared-domain cookie support first.
- 🎟️ Event Registration & Ticket Management
- 📂 Image Upload Support (Cloudinary)
- 📊 Organizer Dashboard
- 🔒 Ownership checks on every mutating route
- 🔍 Full-text event search

