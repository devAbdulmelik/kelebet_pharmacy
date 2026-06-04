from datetime import date, timedelta

from django.urls import reverse
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from api.models import CustomUser
from inventory.models import Medicine
from sales.models import Sale


class SalePermissionsTests(APITestCase):
    def setUp(self):
        self.pharmacist = CustomUser.objects.create_user(
            username='pharmacist_user',
            password='testpass123',
            role='pharmacist',
        )
        self.cashier = CustomUser.objects.create_user(
            username='cashier_user',
            password='testpass123',
            role='cashier',
        )
        self.medicine = Medicine.objects.create(
            name='Amoxicillin 500mg',
            batch_number='AMX-001',
            expiry_date=date.today() + timedelta(days=180),
            purchase_price='10.00',
            selling_price='15.00',
            quantity=25,
            reorder_level=5,
            created_by=self.pharmacist,
        )

    def authenticate(self, user):
        token, _ = Token.objects.get_or_create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')

    def test_pharmacist_cannot_create_sale(self):
        self.authenticate(self.pharmacist)

        response = self.client.post(
            reverse('sale-create'),
            {
                'payment_method': 'cash',
                'items': [
                    {
                        'medicine': self.medicine.id,
                        'quantity': 2,
                    }
                ],
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Sale.objects.count(), 0)
        self.medicine.refresh_from_db()
        self.assertEqual(self.medicine.quantity, 25)

    def test_cashier_can_create_sale(self):
        self.authenticate(self.cashier)

        response = self.client.post(
            reverse('sale-create'),
            {
                'payment_method': 'cash',
                'items': [
                    {
                        'medicine': self.medicine.id,
                        'quantity': 1,
                    }
                ],
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_pharmacist_cannot_access_customers(self):
        self.authenticate(self.pharmacist)

        response = self.client.get(reverse('customer-list'))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_cashier_can_access_customers(self):
        self.authenticate(self.cashier)

        response = self.client.get(reverse('customer-list'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)


class UserManagementTests(APITestCase):
    def setUp(self):
        self.admin = CustomUser.objects.create_user(
            username='admin_user',
            password='testpass123',
            role='admin',
        )
        self.pharmacist = CustomUser.objects.create_user(
            username='pharmacist_user_2',
            password='testpass123',
            role='pharmacist',
        )
        self.cashier = CustomUser.objects.create_user(
            username='cashier_user_2',
            password='testpass123',
            role='cashier',
        )

    def authenticate(self, user):
        token, _ = Token.objects.get_or_create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')

    def test_admin_can_create_staff_account(self):
        self.authenticate(self.admin)

        response = self.client.post(
            reverse('user-list'),
            {
                'username': 'new_cashier',
                'password': 'cashierpass123',
                'role': 'cashier',
                'first_name': 'New',
                'last_name': 'Cashier',
                'phone': '0911223344',
                'email': 'cashier@example.com',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(CustomUser.objects.filter(username='new_cashier', role='cashier').exists())

    def test_admin_cannot_create_admin_account_from_user_management(self):
        self.authenticate(self.admin)

        response = self.client.post(
            reverse('user-list'),
            {
                'username': 'another_admin',
                'password': 'adminpass123',
                'role': 'admin',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_non_admin_cannot_access_user_management(self):
        self.authenticate(self.pharmacist)
        response = self.client.get(reverse('user-list'))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        self.authenticate(self.cashier)
        response = self.client.post(
            reverse('user-list'),
            {
                'username': 'blocked_user',
                'password': 'blockedpass123',
                'role': 'cashier',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
