from rest_framework import generics, permissions, status, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import Product, Like
from .serializers import ProductSerializer, ProductCreateSerializer, LikeSerializer
from django.db.models import Q
from rest_framework.exceptions import PermissionDenied, ValidationError

class ProductListView(generics.ListAPIView):
    """List all products with filtering and sorting"""
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter] 
    search_fields = ['name', 'description', 'category']
    
    def get_queryset(self):
        queryset = Product.objects.all()
        
        store = self.request.query_params.get('store')
        if store:
            queryset = queryset.filter(store__store_id=store)
        
        # Filter by category manually
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        
        # Filter by price range
        min_price = self.request.query_params.get('min_price')
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        
        max_price = self.request.query_params.get('max_price')
        if max_price:
            queryset = queryset.filter(price__lte=max_price)
        
        # Sort products
        sort = self.request.query_params.get('sort', 'newest')
        if sort == 'price_low':
            queryset = queryset.order_by('price')
        elif sort == 'price_high':
            queryset = queryset.order_by('-price')
        elif sort == 'name':
            queryset = queryset.order_by('name')
        elif sort == 'popularity':
            queryset = queryset.order_by('-like__count')
        else:  # Default to newest
            queryset = queryset.order_by('-created_at')
        
        return queryset

class ProductDetailView(generics.RetrieveAPIView):
    """Get details of a specific product"""
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'product_id'

class ProductCreateView(generics.CreateAPIView):
    """Create a new product (requires seller role)"""
    serializer_class = ProductCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        # Verify user is a seller and has a store
        user = self.request.user
        if user.role != 'SELLER':
            raise PermissionDenied('You need to be a seller to create products.')
        
        if not hasattr(user, 'store'):
            raise ValidationError('You need to create a store first.')
            
        product = serializer.save(store=user.store)
        return product
    
    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except (PermissionDenied, ValidationError) as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class ProductUpdateView(generics.UpdateAPIView):
    """Update product details if owner"""
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'product_id'
    
    def get_queryset(self):
        return Product.objects.filter(store__user=self.request.user)

class ProductLikeView(APIView):
    """Toggle like status for a product"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, product_id):
        product = get_object_or_404(Product, product_id=product_id)
        
        try:
            like = Like.objects.get(user=request.user, product=product)
            like.delete()
            return Response({'liked': False}, status=status.HTTP_200_OK)
        except Like.DoesNotExist:
            # Create new like
            like = Like(
                user=request.user,
                product=product,
                like_id=f"like_{request.user.id}_{product.product_id}"
            )
            like.save()
            return Response({'liked': True}, status=status.HTTP_201_CREATED)

class CategoryProductsView(generics.ListAPIView):
    """List all products in a specific category"""
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        category = self.kwargs['category']
        return Product.objects.filter(category=category)
