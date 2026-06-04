# Render Deployment Guide

This project is now prepared for deployment on Render as:

- `kelebet-pharmacy-api`: Django backend
- `kelebet-pharmacy-web`: Vite/React frontend
- `kelebet-pharmacy-db`: PostgreSQL database

The repo includes a Render blueprint file at [render.yaml](./render.yaml).

## Free-tier note

Render's Blueprint spec defaults new services to paid instance types if `plan` is omitted. This repo now explicitly sets `plan: free` for:

- the Django web service
- the Postgres database

The static frontend is deployed as a Render static site (`runtime: static`) and uses Render's normal free static-site behavior without a `plan` field.

If Render still shows a paid option during setup, double-check that it is reading the latest version of `render.yaml` from GitHub.

## 1. Push the project to GitHub

Render works best when connected to a GitHub repo.

## 2. Create a new Blueprint on Render

In Render:

1. Open the dashboard
2. Click `New`
3. Choose `Blueprint`
4. Select this repository

Render will read `render.yaml` and create:

- a Python web service
- a static frontend site
- a Postgres database

## 3. Update service URLs after first deploy

The default `render.yaml` values use placeholder Render names:

- `https://kelebet-pharmacy-api.onrender.com`
- `https://kelebet-pharmacy-web.onrender.com`

If Render gives your services slightly different names, update these environment variables in the Render dashboard:

Backend:

- `DJANGO_ALLOWED_HOSTS`
- `CORS_ALLOWED_ORIGINS`
- `CSRF_TRUSTED_ORIGINS`

Frontend:

- `VITE_API_BASE_URL`

## 4. Important notes for free-tier student deployment

- Render free backend services can sleep after inactivity
- the first request after sleeping may be slow
- this is usually acceptable for student demos

## 5. Manual fallback setup

If you do not want to use Blueprint deployment, use:

### Backend service

- Runtime: `Python`
- Build command:

```bash
./build.sh
```

- Start command:

```bash
gunicorn kelebet_pharmacy.wsgi:application
```

### Frontend service

- Type: `Static Site`
- Root directory: `frontend`
- Build command:

```bash
npm install && npm run build
```

- Publish directory:

```bash
dist
```

- Environment variable:

```bash
VITE_API_BASE_URL=https://your-backend-service.onrender.com/api
```

## 6. Environment variables

Backend:

- `DJANGO_SECRET_KEY`
- `DJANGO_DEBUG=False`
- `DJANGO_ALLOWED_HOSTS`
- `CORS_ALLOW_ALL_ORIGINS=False`
- `CORS_ALLOWED_ORIGINS`
- `CSRF_TRUSTED_ORIGINS`
- `DATABASE_URL`
- `DJANGO_SUPERUSER_USERNAME`
- `DJANGO_SUPERUSER_PASSWORD`
- `SEED_DEMO_DATA`

Frontend:

- `VITE_API_BASE_URL`

## 7. After deployment

For Render free instances, shell access is not available. This project supports automatic admin creation during deploy with these backend environment variables:

```bash
DJANGO_SUPERUSER_USERNAME=admin
DJANGO_SUPERUSER_PASSWORD=admin123
```

During deployment, `build.sh` runs:

```bash
python manage.py create_render_superuser
```

If the admin already exists, the command updates its password and keeps it as a superadmin account.

## 8. Optional demo data on Render

If you want Render to seed class-demo data during deployment, set:

```bash
SEED_DEMO_DATA=true
```

That will run:

```bash
python manage.py seed_demo_data
```

It creates:

- 30 medicines
- 20 sales
- 5 customers
- 5 suppliers

Recommended use:

1. set `SEED_DEMO_DATA=true`
2. redeploy the backend once
3. after data is created, set it back to `false`

This keeps later deploys from re-running demo setup unnecessarily.

## 9. What this repo already supports

- Django production env settings
- `DATABASE_URL` parsing for Postgres
- frontend API base URL through Vite env
- frontend SPA rewrites through Render static routing
- automatic `collectstatic` and `migrate` during backend build
