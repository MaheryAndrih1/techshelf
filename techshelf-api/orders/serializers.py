from rest_framework import serializers
from .models import Cart, CartItem, ShippingInfo, Order, OrderItem, Payment, Promotion

class CartItemSerializer(serializers.ModelSerializer):
    product_name = serializers.SerializerMethodField()
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = CartItem
        fields = ['product_id', 'product_name', 'quantity', 'total_price']
    
    def get_product_name(self, obj):
        return obj.product.name if obj.product else f"Unknown Product ({obj.product_id})"

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.SerializerMethodField()
    
    class Meta:
        model = Cart
        fields = ['cart_id', 'user', 'items', 'total', 'created_at', 'updated_at']
        read_only_fields = ['cart_id', 'user', 'created_at', 'updated_at']
    
    def get_total(self, obj):
        return sum(item.total_price for item in obj.items.all())

class ShippingInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShippingInfo
        fields = ['id', 'shipping_address', 'city', 'country', 'postal_code']

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['product_id', 'quantity', 'price']

class OrderSerializer(serializers.ModelSerializer):
    shipping_info = ShippingInfoSerializer(read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Order
        fields = ['order_id', 'user', 'total_amount', 'tax_rate', 'shipping_cost', 
                 'payment_status', 'order_status', 'shipping_info', 'items', 
                 'created_at', 'updated_at']
        read_only_fields = ['order_id', 'user', 'created_at', 'updated_at']

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ('payment_id', 'order', 'amount', 'payment_status', 'transaction_id',
                  'created_at', 'updated_at')
        read_only_fields = ('payment_id', 'created_at', 'updated_at')

class PromotionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Promotion
        fields = ['promotion_id', 'discount_code', 'discount_percentage', 'expiry_date']
        read_only_fields = ['promotion_id']
