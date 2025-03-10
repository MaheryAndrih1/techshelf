from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import Cart, CartItem, ShippingInfo, Order, Promotion
from products.models import Product
from notifications.models import Notification
from .serializers import CartSerializer, OrderSerializer, ShippingInfoSerializer, PromotionSerializer, OrderItemSerializer, CartItemSerializer
from decimal import Decimal

class CartView(generics.RetrieveAPIView):
    """View the current user's cart"""
    serializer_class = CartSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        cart, _ = Cart.objects.get_or_create(user=self.request.user)
        return cart

class CartAddItemView(APIView):
    """Add a product to the cart"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        product_id = request.data.get('product_id')
        quantity = int(request.data.get('quantity', 1))
        
        if not product_id:
            return Response({'error': 'Product ID is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Get product
        try:
            product = Product.objects.get(product_id=product_id)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check stock
        if product.stock < quantity:
            return Response({'error': f'Only {product.stock} units available'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get or create cart
        cart, _ = Cart.objects.get_or_create(user=request.user)
        
        # Add item to cart
        cart_item = cart.add_item(product, quantity)
        
        # Return updated cart
        serializer = CartSerializer(cart)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class CartRemoveItemView(APIView):
    """Remove a product from the cart"""
    permission_classes = [permissions.IsAuthenticated]
    
    def delete(self, request, product_id):
        # Get cart
        cart, _ = Cart.objects.get_or_create(user=request.user)
        
        # Remove item from cart
        cart.remove_item(product_id)
        
        # Return updated cart
        serializer = CartSerializer(cart)
        return Response(serializer.data)

class CartUpdateItemView(APIView):
    """Update the quantity of a product in the cart"""
    permission_classes = [permissions.IsAuthenticated]
    
    def put(self, request, product_id):
        quantity = int(request.data.get('quantity', 1))
        
        # Get cart
        cart, _ = Cart.objects.get_or_create(user=request.user)
        
        # Find the cart item
        try:
            cart_item = cart.items.get(product_id=product_id)
            
            # Check if product has enough stock
            product = Product.objects.get(product_id=product_id)
            if quantity > product.stock:
                return Response({'error': f'Only {product.stock} units available'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Update quantity or remove if zero
            if quantity > 0:
                cart_item.quantity = quantity
                cart_item.save()
            else:
                cart_item.delete()
                
            # Return updated cart
            serializer = CartSerializer(cart)
            return Response(serializer.data)
        except CartItem.DoesNotExist:
            return Response({'error': 'Item not found in cart'}, status=status.HTTP_404_NOT_FOUND)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

class CheckoutView(APIView):
    """Process checkout and create an order"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        
        # Ensure there are items in the cart
        if not cart.items.exists():
            return Response({'error': 'Your cart is empty'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Extract shipping info - with default data if not provided (for testing)
        shipping_data = {
            'shipping_address': request.data.get('shipping_address', '123 Default St'),
            'city': request.data.get('city', 'Default City'),
            'country': request.data.get('country', 'US'),
            'postal_code': request.data.get('postal_code', '12345'),
        }
        
        # Validate shipping info
        shipping_serializer = ShippingInfoSerializer(data=shipping_data)
        if not shipping_serializer.is_valid():
            return Response(shipping_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Create shipping info
        shipping_info = shipping_serializer.save()
        
        # Create order
        try:
            order = cart.checkout()
            
            # Add shipping info to order
            order.shipping_info = shipping_info
            order.save()
            
            # Process payment
            payment_info = request.data.get('payment_info', {})
            if not payment_info:
                # For testing purposes, use default payment info if none provided
                payment_info = {
                    'card_number': '4111111111111111',
                    'expiry_date': '12/2025',
                    'cvv': '123',
                    'name_on_card': 'Test User'
                }
            
            # Save card if requested
            if request.data.get('save_card'):
                from users.models import BillingInfo
                BillingInfo.objects.update_or_create(
                    user=request.user,
                    defaults={
                        'card_number': payment_info.get('card_number'),
                        'expiry_date': payment_info.get('expiry_date'),
                        'cvv': payment_info.get('cvv'),
                        'billing_address': shipping_data['shipping_address']
                    }
                )
            
            # Process the payment
            order.process_payment(payment_info)
            
            # Create notification for buyer
            Notification.objects.create(
                user=request.user,
                message=f"Your order #{order.order_id} has been placed successfully. Total amount: ${order.total_amount}."
            )
            
            # Create notification for sellers
            for item in order.items.all():
                try:
                    product = Product.objects.get(product_id=item.product_id)
                    seller = product.store.user
                    
                    # Create notification for each unique seller
                    Notification.objects.get_or_create(
                        user=seller,
                        message=f"New order #{order.order_id} received from {request.user.username}. Please check your orders.",
                        defaults={'is_read': False}
                    )
                except Product.DoesNotExist:
                    pass
            
            # Return created order
            serializer = OrderSerializer(order)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            import traceback
            traceback.print_exc()  # Print detailed error for debugging
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class OrderListView(generics.ListAPIView):
    """List all orders for the authenticated user"""
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).order_by('-created_at')

class OrderDetailView(generics.RetrieveAPIView):
    """Get details of a specific order"""
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'order_id'
    
    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)

class OrderCancelView(APIView):
    """Cancel an order and initiate a refund"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, order_id):
        order = get_object_or_404(Order, order_id=order_id, user=request.user)
        
        if order.payment_status == 'PAID' and order.order_status != 'DELIVERED' and order.order_status != 'CANCELLED':
            # Refund payment
            order.payment.refund_payment()
            
            # Create notification for the order cancellation
            Notification.objects.create(
                user=request.user,
                message=f"Your order #{order.order_id} has been cancelled and payment refunded."
            )
            
            # Notify sellers about the cancellation
            for item in order.items.all():
                try:
                    product = Product.objects.get(product_id=item.product_id)
                    seller = product.store.user
                    Notification.objects.create(
                        user=seller,
                        message=f"Order #{order.order_id} from {order.user.username} has been cancelled."
                    )
                    
                    # Restore stock
                    product.stock += item.quantity
                    product.save()
                except Product.DoesNotExist:
                    pass
                    
            # Return updated order
            serializer = OrderSerializer(order)
            return Response(serializer.data)
        else:
            return Response({'error': 'This order cannot be cancelled.'}, status=status.HTTP_400_BAD_REQUEST)

class ApplyPromotionView(APIView):
    """Apply a promotion code to the current cart"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        discount_code = request.data.get('discount_code')
        if not discount_code:
            return Response({'error': 'Discount code is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            promotion = Promotion.objects.get(discount_code=discount_code)
        except Promotion.DoesNotExist:
            return Response({'error': 'Invalid discount code'}, status=status.HTTP_404_NOT_FOUND)
        
        # Return promotion details
        serializer = PromotionSerializer(promotion)
        return Response(serializer.data)
