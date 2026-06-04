from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'role', 'is_staff', 'is_active')
    list_filter = ('role', 'is_staff', 'is_active')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('username',)
    fieldsets = UserAdmin.fieldsets + (
        ('Pharmacy Profile', {'fields': ('role', 'phone', 'address', 'date_of_birth')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Pharmacy Profile', {'fields': ('role', 'email', 'phone')}),
    )


admin.site.site_header = 'Kelebet Pharmacy Admin'
admin.site.site_title = 'Kelebet Pharmacy Admin'
admin.site.index_title = 'Administration Console'



# // 9092dd4d18656307cdb77107ab4f7d7fa55c4150//;
