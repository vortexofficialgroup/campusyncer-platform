# CampuSyncer

CampuSyncer is the university onboarding, campus preview, and payment demo for Vortex Group. It includes a React/Vite website, a FastAPI API, SQLite for local development, and PostgreSQL for Compose deployments.

## Run locally

Requirements: Python 3.11+, Node.js 20+, and npm.

1. Copy `.env.example` to `.env` and set `ADMIN_PIN` to a private value.
2. Start the API:

   ```powershell
   cd backend
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   uvicorn app.main:app --reload --port 8000 --env-file ..\\.env
   ```

3. In a second terminal, start the website:

   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

Open `http://localhost:5173`. The API uses `http://localhost:8000` and creates `backend/campusync.db` automatically.
In local Vite development, `/api` requests are proxied to `http://localhost:8000`.

## Run with Docker Compose

From the repository root:

```powershell
docker compose up --build
```

The website is at `http://localhost:5173`, the API at `http://localhost:8000`, and PostgreSQL at port `5432`. Compose uses the PostgreSQL settings in `docker-compose.yml`.

## Demo flow

- Use the onboarding wizard to reserve a campus slug and select a plan.
- With no `STRIPE_SECRET_KEY`, card checkout uses Demo Sandbox Mode and returns to a confirmation screen that activates the tenant.
- To accept real payments, configure `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`; point a Stripe webhook at `POST /api/payments/webhook` and subscribe to `checkout.session.completed`.
- Invoice / PO requests immediately provision a 14-day sandbox and create a printable pro-forma invoice.
- Visit `/admin` and enter `ADMIN_PIN` to review requests and approve invoice tenants. The default PIN is intended only for local demos; change it before deployment.

## API

- `GET /api/health`
- `GET /api/tenants/check-slug/{slug}`
- `POST /api/onboarding/submit`
- `POST /api/payments/create-checkout-session`
- `POST /api/payments/demo-confirm/{request_id}`
- `GET /api/payments/checkout-status/{session_id}`
- `POST /api/payments/webhook`
- `GET /api/admin/requests` (`X-Admin-Pin` header)
- `POST /api/admin/requests/{request_id}/activate` (`X-Admin-Pin` header)

Interactive API documentation is available at `http://localhost:8000/docs`.

## Deploy with Vercel Services

Import the repository as one Vercel project with the repository root as the project root. Vercel builds the `backend` and `frontend` services independently using the root `vercel.json`.

- `/api/*` is routed to the FastAPI backend; the frontend receives all other paths.
- Leave `VITE_API_URL` unset in Vercel so browser requests use the same-origin `/api` rewrite. It is only set by Docker Compose for local containers.
- Configure `DATABASE_URL` to a persistent PostgreSQL database; Vercel's local filesystem is not a persistent SQLite database. Also set `ADMIN_PIN` and, for live payments, `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`.
- Set `FRONTEND_URL=https://campusyncer.com` (or your chosen public frontend origin) in Vercel so payment returns land on the frontend. If omitted on Vercel, the API uses `VERCEL_URL`; locally it falls back to `http://localhost:5173`.
- Point the Stripe webhook at `https://<your-domain>/api/payments/webhook`.

There are no internal service bindings: frontend requests run in the visitor's browser and use the public same-origin `/api` route; the backend does not call the frontend service.
