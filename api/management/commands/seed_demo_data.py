import random
from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from inventory.models import Category, Medicine, Supplier
from sales.models import Customer, Sale, SaleItem


class Command(BaseCommand):
    help = 'Seed demo medicines, sales, customers, and suppliers for class demos.'

    medicine_catalog = [
        ('Amoxicillin 500mg', 'Amoxicillin'),
        ('Paracetamol 500mg', 'Acetaminophen'),
        ('Ibuprofen 400mg', 'Ibuprofen'),
        ('Metformin 850mg', 'Metformin'),
        ('Losartan 50mg', 'Losartan'),
        ('Ciprofloxacin 500mg', 'Ciprofloxacin'),
        ('Omeprazole 20mg', 'Omeprazole'),
        ('Azithromycin 250mg', 'Azithromycin'),
        ('Ceftriaxone 1g', 'Ceftriaxone'),
        ('Vitamin C 500mg', 'Ascorbic Acid'),
        ('Diclofenac 50mg', 'Diclofenac'),
        ('ORS Sachet', 'Oral Rehydration Salts'),
        ('Salbutamol Inhaler', 'Salbutamol'),
        ('Amlodipine 5mg', 'Amlodipine'),
        ('Hydrochlorothiazide 25mg', 'Hydrochlorothiazide'),
        ('Insulin Regular', 'Insulin Human'),
        ('Atorvastatin 20mg', 'Atorvastatin'),
        ('Folic Acid 5mg', 'Folic Acid'),
        ('Zinc Sulfate 20mg', 'Zinc Sulfate'),
        ('Albendazole 400mg', 'Albendazole'),
        ('Artemether/Lumefantrine', 'Artemether-Lumefantrine'),
        ('Iron Tablet', 'Ferrous Sulfate'),
        ('Calcium Tablet', 'Calcium Carbonate'),
        ('Gentamicin Injection', 'Gentamicin'),
        ('Dextrose Saline 500ml', 'Dextrose Saline'),
        ('Ringer Lactate 500ml', 'Ringer Lactate'),
        ('Glibenclamide 5mg', 'Glibenclamide'),
        ('Prednisolone 5mg', 'Prednisolone'),
        ('Cetirizine 10mg', 'Cetirizine'),
        ('Loratadine 10mg', 'Loratadine'),
    ]

    supplier_names = [
        'Addis Med Supply',
        'Ethio Pharma Hub',
        'Blue Nile Pharmaceuticals',
        'Abay Healthcare Trading',
        'Selam Medical Import',
    ]

    customer_names = [
        'Hana Tesfaye',
        'Abel Bekele',
        'Mekdes Alemu',
        'Samuel Tadesse',
        'Rahel Kebede',
    ]

    categories = [
        ('Antibiotics', 'Prescription anti-infective medicines'),
        ('Analgesics', 'Pain and fever relief products'),
        ('Antihypertensives', 'Blood pressure control medicines'),
        ('Antidiabetics', 'Glucose management medicines'),
        ('Vitamins', 'Supplement and nutrition products'),
        ('Gastrointestinal', 'Digestive system medicines'),
        ('Respiratory', 'Respiratory support medicines'),
        ('Injectables', 'Injection and infusion products'),
    ]

    def handle(self, *args, **options):
        with transaction.atomic():
            admin_user = self._get_or_create_admin_user()
            cashier_user = self._get_or_create_cashier_user()
            categories = self._create_categories()
            suppliers = self._create_suppliers()
            medicines = self._create_medicines(categories, suppliers, admin_user)
            customers = self._create_customers()
            self._create_sales(medicines, customers, cashier_user)

        self.stdout.write(self.style.SUCCESS('Demo data seeded successfully.'))

    def _get_or_create_admin_user(self):
        User = get_user_model()
        user, created = User.objects.get_or_create(
            username='demo_admin',
            defaults={
                'email': 'demo-admin@kelebet.local',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True,
            },
        )
        if created:
            user.set_password('admin123')
            user.save()
        return user

    def _get_or_create_cashier_user(self):
        User = get_user_model()
        user, created = User.objects.get_or_create(
            username='demo_cashier',
            defaults={
                'email': 'demo-cashier@kelebet.local',
                'role': 'cashier',
                'is_staff': False,
                'is_superuser': False,
            },
        )
        if created:
            user.set_password('cashier123')
            user.save()
        return user

    def _create_categories(self):
        categories = []
        for name, description in self.categories:
            category, _ = Category.objects.get_or_create(name=name, defaults={'description': description})
            categories.append(category)
        return categories

    def _create_suppliers(self):
        suppliers = []
        for index, name in enumerate(self.supplier_names, start=1):
            supplier, _ = Supplier.objects.get_or_create(
                name=name,
                defaults={
                    'contact_person': f'Contact {index}',
                    'phone': f'09110000{index:02d}',
                    'email': f'supplier{index}@kelebet.local',
                    'address': f'Bole Sub City, Addis Ababa, Warehouse {index}',
                },
            )
            suppliers.append(supplier)
        return suppliers

    def _create_medicines(self, categories, suppliers, admin_user):
        medicines = []
        for index, (name, generic_name) in enumerate(self.medicine_catalog, start=1):
            purchase_price = Decimal(random.randint(20, 220))
            selling_price = purchase_price + Decimal(random.randint(5, 40))
            medicine, _ = Medicine.objects.get_or_create(
                batch_number=f'DEMO-{index:03d}',
                defaults={
                    'name': name,
                    'generic_name': generic_name,
                    'category': categories[index % len(categories)],
                    'expiry_date': timezone.now().date() + timedelta(days=180 + index * 9),
                    'purchase_price': purchase_price,
                    'selling_price': selling_price,
                    'quantity': 40 + (index * 3),
                    'reorder_level': 10 + (index % 5) * 2,
                    'supplier': suppliers[index % len(suppliers)],
                    'created_by': admin_user,
                },
            )
            medicines.append(medicine)
        return medicines

    def _create_customers(self):
        customers = []
        for index, name in enumerate(self.customer_names, start=1):
            customer, _ = Customer.objects.get_or_create(
                name=name,
                defaults={
                    'phone': f'09220000{index:02d}',
                    'email': f'customer{index}@kelebet.local',
                    'address': f'Addis Ababa, Kebele {index}',
                },
            )
            customers.append(customer)
        return customers

    def _create_sales(self, medicines, customers, cashier_user):
        if Sale.objects.filter(invoice_number__startswith='DEMO-SALE-').count() >= 20:
            return

        available_medicines = list(medicines)
        for index in range(1, 21):
            sale_date = timezone.now() - timedelta(days=index % 7, hours=index)
            sale = Sale.objects.create(
                invoice_number=f'DEMO-SALE-{index:03d}',
                cashier=cashier_user,
                customer=customers[index % len(customers)],
                total_amount=Decimal('0.00'),
                payment_method=random.choice(['cash', 'card', 'mobile_money']),
                sale_date=sale_date,
            )

            line_count = random.randint(1, 3)
            chosen_medicines = random.sample(available_medicines, line_count)
            total_amount = Decimal('0.00')

            for medicine in chosen_medicines:
                quantity = random.randint(1, 3)
                subtotal = medicine.selling_price * quantity
                SaleItem.objects.create(
                    sale=sale,
                    medicine=medicine,
                    quantity=quantity,
                    unit_price=medicine.selling_price,
                    subtotal=subtotal,
                )
                total_amount += subtotal

            sale.total_amount = total_amount
            sale.save(update_fields=['total_amount'])
