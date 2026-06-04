import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Creates a superuser from environment variables if one does not already exist.'

    def handle(self, *args, **options):
        username = os.getenv('DJANGO_SUPERUSER_USERNAME')
        email = os.getenv('DJANGO_SUPERUSER_EMAIL')
        password = os.getenv('DJANGO_SUPERUSER_PASSWORD')

        if not username or not email or not password:
            self.stdout.write('Skipping superuser creation: required environment variables are not set.')
            return

        User = get_user_model()

        if User.objects.filter(username=username).exists():
            self.stdout.write(f'Superuser "{username}" already exists.')
            return

        User.objects.create_superuser(
            username=username,
            email=email,
            password=password,
            role='admin',
        )
        self.stdout.write(self.style.SUCCESS(f'Superuser "{username}" created successfully.'))
