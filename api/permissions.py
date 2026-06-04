from rest_framework import permissions

def normalize_role(user):
    role = getattr(user, 'role', '')
    return str(role).strip().lower()

class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and normalize_role(request.user) == 'admin'

class IsPharmacistOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and normalize_role(request.user) in ['admin', 'pharmacist']

class IsCashierOrHigher(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and normalize_role(request.user) in ['admin', 'cashier']
