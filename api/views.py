from rest_framework import generics, permissions, status, filters, serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction
from django.db.models import Sum, Count, F
from django.utils import timezone
from datetime import timedelta
import uuid

from .models import CustomUser
from .serializers import (
    UserSerializer, UserCreateSerializer, CategorySerializer, SupplierSerializer,
    MedicineSerializer, CustomerSerializer, SaleSerializer
)
from .permissions import IsAdmin, IsPharmacistOrAdmin, IsCashierOrHigher
from inventory.models import Category, Supplier, Medicine
from sales.models import Customer, Sale, SaleItem


# ====================== AUTH ======================
class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response({'error': 'Please provide both username and password'}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(username=username, password=password)
        if user:
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user': UserSerializer(user).data
            })
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)


# ====================== INVENTORY ======================
class UserListCreateView(generics.ListCreateAPIView):
    queryset = CustomUser.objects.all().order_by('role', 'username')
    permission_classes = [IsAdmin]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return UserCreateSerializer
        return UserSerializer


class MedicineListCreate(generics.ListCreateAPIView):
    queryset = Medicine.objects.all()
    serializer_class = MedicineSerializer
    permission_classes = [IsPharmacistOrAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'generic_name', 'batch_number']
    filterset_fields = ['category', 'supplier']

    def get_permissions(self):
        # Allow cashiers to view medicines (read-only for POS)
        if self.request.method == 'GET':
            return [permissions.IsAuthenticated()]
        return [IsPharmacistOrAdmin()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class MedicineDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Medicine.objects.all()
    serializer_class = MedicineSerializer
    permission_classes = [IsPharmacistOrAdmin]


# ====================== BASIC CRUD ======================
class CategoryListCreate(generics.ListCreateAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

class SupplierListCreate(generics.ListCreateAPIView):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [permissions.IsAuthenticated]

class CustomerListCreate(generics.ListCreateAPIView):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsCashierOrHigher]


# ====================== SALES (POS) ======================
class SaleListCreate(generics.ListCreateAPIView):
    queryset = Sale.objects.all()
    serializer_class = SaleSerializer
    permission_classes = [permissions.IsAuthenticated]

class SaleDetail(generics.RetrieveAPIView):
    queryset = Sale.objects.all()
    serializer_class = SaleSerializer
    permission_classes = [permissions.IsAuthenticated]


class SaleCreateView(generics.CreateAPIView):
    queryset = Sale.objects.all()
    serializer_class = SaleSerializer
    permission_classes = [IsCashierOrHigher]

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        items_data = request.data.get('items', [])
        payment_method = request.data.get('payment_method', 'cash')
        customer_id = request.data.get('customer')
        
        if not items_data:
            return Response(
                {"error": "At least one item is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            invoice_number = f"INV-{timezone.now().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6].upper()}"
            
            total_amount = 0
            sale_items = []
            
            # Validate all items first
            for item in items_data:
                try:
                    medicine = Medicine.objects.get(id=item['medicine'])
                except Medicine.DoesNotExist:
                    return Response(
                        {"error": f"Medicine with id {item['medicine']} not found."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                if medicine.is_expired():
                    return Response(
                        {"error": f"Medicine '{medicine.name}' is expired."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                quantity = int(item['quantity'])
                if medicine.quantity < quantity:
                    return Response(
                        {"error": f"Insufficient stock for '{medicine.name}'. Available: {medicine.quantity}"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                sale_items.append({
                    'medicine': medicine,
                    'quantity': quantity,
                    'unit_price': medicine.selling_price
                })
                total_amount += medicine.selling_price * quantity
            
            # Create sale
            sale = Sale.objects.create(
                invoice_number=invoice_number,
                cashier=request.user,
                customer_id=customer_id if customer_id else None,
                total_amount=total_amount,
                payment_method=payment_method
            )
            
            # Create sale items and update medicine stock
            for item_data in sale_items:
                medicine = item_data['medicine']
                SaleItem.objects.create(
                    sale=sale,
                    medicine=medicine,
                    quantity=item_data['quantity'],
                    unit_price=item_data['unit_price']
                )
                medicine.quantity -= item_data['quantity']
                medicine.save()
            
            serializer = self.get_serializer(sale)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print(f"Sale creation error: {str(e)}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ====================== DASHBOARD & REPORTS ======================
class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        
        today_sales = Sale.objects.filter(sale_date__date=today).aggregate(
            total=Sum('total_amount'),
            count=Count('id')
        )

        low_stock = Medicine.objects.filter(quantity__lte=F('reorder_level')).count()

        near_expiry = Medicine.objects.filter(
            expiry_date__lte=today + timedelta(days=30),
            expiry_date__gte=today
        ).count()

        return Response({
            "today_sales_amount": today_sales['total'] or 0,
            "today_transactions": today_sales['count'] or 0,
            "low_stock_count": low_stock,
            "near_expiry_count": near_expiry,
            "total_medicines": Medicine.objects.count(),
            "date": str(today)
        })


class LowStockReportView(generics.ListAPIView):
    serializer_class = MedicineSerializer
    permission_classes = [IsPharmacistOrAdmin]

    def get_queryset(self):
        return Medicine.objects.filter(quantity__lte=F('reorder_level')).order_by('quantity')


class NearExpiryReportView(generics.ListAPIView):
    serializer_class = MedicineSerializer
    permission_classes = [IsPharmacistOrAdmin]

    def get_queryset(self):
        today = timezone.now().date()
        return Medicine.objects.filter(
            expiry_date__lte=today + timedelta(days=30),
            expiry_date__gte=today
        ).order_by('expiry_date')
