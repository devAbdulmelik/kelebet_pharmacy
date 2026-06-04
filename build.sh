#!/usr/bin/env bash
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --noinput
python manage.py migrate
python manage.py create_render_superuser

if [ "${SEED_DEMO_DATA:-false}" = "true" ]; then
  python manage.py seed_demo_data
fi
