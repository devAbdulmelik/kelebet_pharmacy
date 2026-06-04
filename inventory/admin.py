from django.contrib import admin
from .models import Category, Supplier, Medicine

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'description']

@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ['name', 'phone', 'email']
    search_fields = ['name', 'contact_person']

@admin.register(Medicine)
class MedicineAdmin(admin.ModelAdmin):
    list_display = ['name', 'batch_number', 'expiry_date', 'quantity', 'selling_price', 'is_low_stock']
    list_filter = ['category', 'expiry_date']
    search_fields = ['name', 'generic_name', 'batch_number']
    readonly_fields = ['created_at', 'updated_at']
    
    def is_low_stock(self, obj):
        return obj.is_low_stock()
    is_low_stock.boolean = True