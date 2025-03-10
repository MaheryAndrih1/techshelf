from rest_framework import generics, permissions, status, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import Store, StoreTheme, Rating
from .serializers import StoreSerializer, StoreCreateSerializer, StoreThemeSerializer, RatingSerializer
import logging
import traceback

# Configure logger
logger = logging.getLogger(__name__)

class StoreListView(generics.ListAPIView):
    """List all stores with optional filtering"""
    queryset = Store.objects.all()
    serializer_class = StoreSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ['store_name', 'subdomain_name']

class StoreDetailView(generics.RetrieveAPIView):
    """Get details of a specific store by subdomain"""
    serializer_class = StoreSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'subdomain_name'
    lookup_url_kwarg = 'subdomain'
    queryset = Store.objects.all()

class StoreCreateView(APIView):
    """Create a new store (requires seller role)"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            # Check if user already has a store
            user = request.user
            if hasattr(user, 'store'):
                return Response(
                    {'error': 'You already have a store. You cannot create multiple stores.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Extract data from request
            store_name = request.data.get('store_name')
            subdomain_name = request.data.get('subdomain_name')
            
            if not store_name:
                return Response(
                    {'error': 'Store name is required.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Update user to seller if not already
            if user.role != 'SELLER':
                user.role = 'SELLER'
                user.save()
                
            # Create store manually instead of using serializer
            store = Store(
                store_name=store_name,
                subdomain_name=subdomain_name if subdomain_name else None,
                user=user
            )
            store.save()  # This will trigger the save method in the model which creates the store_id and subdomain if necessary
            
            # Create theme manually and link it to the store
            theme = StoreTheme(
                theme_id=f"theme_{store.store_id}",
                primary_color='#3498db',
                secondary_color='#2ecc71',
                font='Roboto'
            )
            theme.save()
            
            # Link theme to store
            store.theme = theme
            store.save()
            
            # Return serialized store
            serializer = StoreSerializer(store)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Store creation failed: {str(e)}")
            logger.error(traceback.format_exc())  # Log full traceback for debugging
            
            return Response(
                {'error': f'Failed to create store: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class StoreUpdateView(generics.UpdateAPIView):
    """Update store details if owner"""
    serializer_class = StoreSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'subdomain_name'
    lookup_url_kwarg = 'subdomain'
    
    def get_queryset(self):
        return Store.objects.filter(user=self.request.user)

class StoreThemeView(generics.RetrieveUpdateAPIView):
    """Get or update a store theme if owner"""
    serializer_class = StoreThemeSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        store = get_object_or_404(Store, 
                                 subdomain_name=self.kwargs['subdomain'],
                                 user=self.request.user)
        
        theme, created = StoreTheme.objects.get_or_create(
            id=store.theme.id if store.theme else None,
            defaults={
                'theme_id': f"theme_{store.store_id}",
                'primary_color': '#3498db',
                'secondary_color': '#2ecc71',
                'font': 'Roboto'
            }
        )
        
        if created:
            store.theme = theme
            store.save()
            
        return theme

class StoreRatingListView(generics.ListAPIView):
    """List all ratings for a specific store"""
    serializer_class = RatingSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        store = get_object_or_404(Store, subdomain_name=self.kwargs['subdomain'])
        return Rating.objects.filter(store=store).order_by('-timestamp')

class StoreRatingCreateView(generics.CreateAPIView):
    """Create a rating for a store"""
    serializer_class = RatingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        store = get_object_or_404(Store, subdomain_name=self.kwargs['subdomain'])
        
        # Check if user is not the store owner
        if store.user == self.request.user:
            return Response(
                {'detail': 'You cannot rate your own store.'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Check if the user already rated this store
        existing_rating = Rating.objects.filter(user=self.request.user, store=store).first()
        if existing_rating:
            existing_rating.score = serializer.validated_data['score']
            existing_rating.comment = serializer.validated_data.get('comment', '')
            existing_rating.save()
            return existing_rating
        else:
            return serializer.save(
                user=self.request.user,
                store=store,
                rating_id=f"rating_{self.request.user.id}_{store.store_id}"
            )
