from django.urls import path
from . import views

urlpatterns = [
    # Authentication
    path('login/', views.LoginView.as_view(), name='login'),
    path('users/', views.UserListCreateView.as_view(), name='user-list'),
    
    # Inventory
    path('categories/', views.CategoryListCreate.as_view(), name='category-list'),
    path('medicines/', views.MedicineListCreate.as_view(), name='medicine-list'),
    path('medicines/<int:pk>/', views.MedicineDetail.as_view(), name='medicine-detail'),
    
    # Suppliers & Customers
    path('suppliers/', views.SupplierListCreate.as_view(), name='supplier-list'),
    path('customers/', views.CustomerListCreate.as_view(), name='customer-list'),
    path('customers/<int:pk>/', views.CustomerDetail.as_view(), name='customer-detail'),
    
    # Sales
    path('sales/', views.SaleListCreate.as_view(), name='sale-list'),
    path('sales/<int:pk>/', views.SaleDetail.as_view(), name='sale-detail'),
    path('sales/create/', views.SaleCreateView.as_view(), name='sale-create'),
    
    # Dashboard & Reports
    path('dashboard/stats/', views.DashboardStatsView.as_view(), name='dashboard-stats'),
    path('reports/low-stock/', views.LowStockReportView.as_view(), name='low-stock-report'),
    path('reports/near-expiry/', views.NearExpiryReportView.as_view(), name='near-expiry-report'),
]
