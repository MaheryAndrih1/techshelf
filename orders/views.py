from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .models import Cart, CartItem, ShippingInfo, Order, Promotion
from products.models import Product
from decimal import Decimal

def get_or_create_cart(request):
    if request.user.is_authenticated:
        cart, created = Cart.objects.get_or_create(user=request.user)
    else:
        cart_id = request.session.get('cart_id')
        if cart_id:
            try:
                cart = Cart.objects.get(cart_id=cart_id)
            except Cart.DoesNotExist:
                cart = Cart.objects.create()
                request.session['cart_id'] = cart.cart_id
        else:
            cart = Cart.objects.create()
            request.session['cart_id'] = cart.cart_id
    return cart

def cart_view(request):
    cart = get_or_create_cart(request)
    
    # Calculate subtotal
    subtotal = Decimal('0.00')
    for item in cart.items.all():
        try:
            product = Product.objects.get(product_id=item.product_id)
            subtotal += product.price * item.quantity
        except Product.DoesNotExist:
            continue
    
    # Apply fixed shipping cost for demo
    shipping = Decimal('5.00') if subtotal > 0 else Decimal('0.00')
    
    # Apply tax
    tax = subtotal * Decimal('0.08')  # 8% tax
    
    # Total
    total = subtotal + shipping + tax
    
    context = {
        'cart': cart,
        'subtotal': subtotal,
        'shipping': shipping,
        'tax': tax,
        'total': total,
    }
    return render(request, 'orders/cart.html', context)

def add_to_cart_view(request, product_id):
    product = get_object_or_404(Product, product_id=product_id)
    quantity = int(request.GET.get('quantity', 1))
    
    # Check stock
    if product.stock < quantity:
        messages.error(request, f'Sorry, only {product.stock} units available.')
        return redirect('products:detail', product_id=product_id)
    
    # Get or create cart
    cart = get_or_create_cart(request)
    
    # Add item to cart
    cart.add_item(product, quantity)
    
    messages.success(request, f'{quantity} x {product.name} added to your cart.')
    return redirect('orders:cart')

def remove_from_cart_view(request, product_id):
    cart = get_or_create_cart(request)
    cart.remove_item(product_id)
    return redirect('orders:cart')

@login_required
def checkout_view(request):
    cart = get_or_create_cart(request)
    
    # Ensure there are items in the cart
    if not cart.items.exists():
        messages.error(request, 'Your cart is empty.')
        return redirect('orders:cart')
    
    if request.method == 'POST':
        # Create shipping info
        shipping_address = request.POST.get('shipping_address')
        city = request.POST.get('city')
        country = request.POST.get('country')
        postal_code = request.POST.get('postal_code')
        
        shipping_info = ShippingInfo.objects.create(
            shipping_address=shipping_address,
            city=city,
            country=country,
            postal_code=postal_code
        )
        
        # Create order
        try:
            order = cart.checkout()
            
            # Add shipping info to order
            order.shipping_info = shipping_info
            order.save()
            
            # Process payment
            if 'use_saved_card' in request.POST and request.user.billing_info:
                # Use saved card for payment
                payment_info = {
                    'card_number': request.user.billing_info.card_number,
                    'expiry_date': request.user.billing_info.expiry_date,
                    'cvv': request.user.billing_info.cvv,
                }
            else:
                # Use new card for payment
                payment_info = {
                    'card_number': request.POST.get('card_number'),
                    'expiry_date': request.POST.get('expiry_date'),
                    'cvv': request.POST.get('cvv'),
                    'name_on_card': request.POST.get('name_on_card'),
                }
                
                # Save card if requested
                if 'save_card' in request.POST:
                    from users.models import BillingInfo
                    BillingInfo.objects.update_or_create(
                        user=request.user,
                        defaults={
                            'card_number': payment_info['card_number'],
                            'expiry_date': payment_info['expiry_date'],
                            'cvv': payment_info['cvv'],
                            'billing_address': shipping_address  # Use shipping address for billing
                        }
                    )
            
            # Process the payment
            order.process_payment(payment_info)
            
            messages.success(request, 'Order placed successfully!')
            return redirect('orders:detail', order_id=order.order_id)
            
        except ValueError as e:
            messages.error(request, str(e))
            return redirect('orders:cart')
    
    # Calculate order totals
    subtotal = Decimal('0.00')
    for item in cart.items.all():
        try:
            product = Product.objects.get(product_id=item.product_id)
            subtotal += product.price * item.quantity
        except Product.DoesNotExist:
            continue
    
    # Apply fixed shipping cost for demo
    shipping = Decimal('5.00') if subtotal > 0 else Decimal('0.00')
    
    # Apply tax
    tax = subtotal * Decimal('0.08')  # 8% tax
    
    # Total
    total = subtotal + shipping + tax
    
    context = {
        'cart': cart,
        'subtotal': subtotal,
        'shipping': shipping,
        'tax': tax,
        'total': total,
    }
    return render(request, 'orders/checkout.html', context)

@login_required
def shipping_info_view(request):
    # This could be used for a multi-step checkout process
    pass

@login_required
def payment_view(request):
    # This could be used for a multi-step checkout process
    pass

@login_required
def order_list_view(request):
    orders = Order.objects.filter(user=request.user).order_by('-created_at')
    return render(request, 'orders/order_list.html', {'orders': orders})

@login_required
def order_detail_view(request, order_id):
    order = get_object_or_404(Order, order_id=order_id, user=request.user)
    
    # If cancelling the order
    if request.method == 'POST' and request.POST.get('action') == 'cancel':
        if order.payment_status == 'PAID' and order.order_status != 'DELIVERED' and order.order_status != 'CANCELLED':
            # Refund payment
            order.payment.refund_payment()
            messages.success(request, 'Your order has been cancelled and payment refunded.')
            
            # Restore stock
            for item in order.items.all():
                try:
                    product = Product.objects.get(product_id=item.product_id)
                    product.stock += item.quantity
                    product.save()
                except Product.DoesNotExist:
                    continue
        else:
            messages.error(request, 'This order cannot be cancelled.')
        
        return redirect('orders:detail', order_id=order.order_id)
    
    # Calculate subtotal for display
    subtotal = sum(item.price * item.quantity for item in order.items.all())
    tax = subtotal * (order.tax_rate / 100)
    
    context = {
        'order': order,
        'subtotal': subtotal,
        'tax': tax,
    }
    return render(request, 'orders/order_detail.html', context)

@login_required
def apply_promotion_view(request):
    if request.method == 'POST':
        discount_code = request.POST.get('discount_code')
        try:
            promotion = Promotion.objects.get(discount_code=discount_code)
        except Promotion.DoesNotExist:
            messages.error(request, 'Invalid discount code.')
            return redirect('orders:cart')
        
        # Store the promotion in the session
        request.session['promotion_id'] = promotion.promotion_id
        messages.success(request, f'Discount code {discount_code} applied!')
    
    return redirect('orders:cart')
