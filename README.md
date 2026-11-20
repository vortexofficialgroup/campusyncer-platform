# CampuSync

CampuSync is the university onboarding, campus preview, and payment demo for Vortex Group. It includes a React/Vite website, a FastAPI API, SQLite for local development, and PostgreSQL for Compose deployments.

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
