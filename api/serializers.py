from rest_framework import serializers
from .models import CustomUser
from inventory.models import Category, Supplier, Medicine
from sales.models import Customer, Sale, SaleItem


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'role', 'first_name', 'last_name', 'phone']


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'role', 'first_name', 'last_name', 'phone', 'password']
        read_only_fields = ['id']

    def validate_role(self, value):
        normalized = str(value).strip().lower()
        if normalized not in ['pharmacist', 'cashier']:
            raise serializers.ValidationError('Only pharmacist and cashier accounts can be created here.')
        return normalized

    def create(self, validated_data):
        password = validated_data.pop('password')
        return CustomUser.objects.create_user(password=password, **validated_data)


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = '__all__'


class MedicineSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    is_expired = serializers.SerializerMethodField()
    is_low_stock = serializers.SerializerMethodField()

    class Meta:
        model = Medicine
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'created_by']

    def get_is_expired(self, obj):
        return obj.is_expired()

    def get_is_low_stock(self, obj):
        return obj.is_low_stock()


class CustomerSerializer(serializers.ModelSerializer):
    purchase_history = serializers.SerializerMethodField()

    class Meta:
        model = Customer
        fields = ['id', 'name', 'phone', 'email', 'address', 'created_at', 'purchase_history']
        read_only_fields = ['created_at', 'purchase_history']

    def get_purchase_history(self, obj):
        sales = obj.sale_set.all().select_related('cashier', 'customer').prefetch_related('items__medicine').order_by('-sale_date')
        return SaleSerializer(sales, many=True).data


class SaleItemSerializer(serializers.ModelSerializer):
    medicine_name = serializers.CharField(source='medicine.name', read_only=True)

    class Meta:
        model = SaleItem
        fields = ['id', 'medicine', 'medicine_name', 'quantity', 'unit_price', 'subtotal']


class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True, read_only=True)
    cashier_name = serializers.CharField(source='cashier.username', read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    total_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    invoice_number = serializers.CharField(read_only=True)

    class Meta:
        model = Sale
        fields = ['id', 'invoice_number', 'cashier', 'cashier_name', 'customer', 'customer_name',
                  'total_amount', 'payment_method', 'sale_date', 'items']
        read_only_fields = ['invoice_number', 'total_amount', 'cashier']
