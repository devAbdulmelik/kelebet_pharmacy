from django.contrib import admin
from .models import Customer, Sale, SaleItem

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['name', 'phone', 'email']
    search_fields = ['name', 'phone']

@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ['invoice_number', 'cashier', 'total_amount', 'sale_date', 'payment_method']
    list_filter = ['payment_method', 'sale_date']
    search_fields = ['invoice_number']

@admin.register(SaleItem)
class SaleItemAdmin(admin.ModelAdmin):
    list_display = ['sale', 'medicine', 'quantity', 'unit_price', 'subtotal']