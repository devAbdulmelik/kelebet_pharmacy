# Render Deployment Guide

This project is now prepared for deployment on Render as:

- `kelebet-pharmacy-api`: Django backend
- `kelebet-pharmacy-web`: Vite/React frontend
- `kelebet-pharmacy-db`: PostgreSQL database

The repo includes a Render blueprint file at [render.yaml](./render.yaml).

## Free-tier note

Render's Blueprint spec defaults new services to paid instance types if `plan` is omitted. This repo now explicitly sets `plan: free` for:

- the Django web service
- the static frontend
- the Postgres database

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

Frontend:

- `VITE_API_BASE_URL`

## 7. After deployment

Run these once if needed:

```bash
python manage.py createsuperuser
```

You can do that from the Render shell for the backend service.

## 8. What this repo already supports

- Django production env settings
- `DATABASE_URL` parsing for Postgres
- frontend API base URL through Vite env
- frontend SPA rewrites through Render static routing
- automatic `collectstatic` and `migrate` during backend build
