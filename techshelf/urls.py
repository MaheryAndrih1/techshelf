"""
URL configuration for techshelf project.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
# Comment out imports for drf_yasg
# from rest_framework import permissions
# from drf_yasg.views import get_schema_view
# from drf_yasg import openapi
from .views import health_check, api_debug_view

# Comment out schema_view definition
# schema_view = get_schema_view(...)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API endpoints
    path('api/users/', include('users.api_urls')),
    path('api/stores/', include('stores.api_urls')),
    path('api/products/', include('products.api_urls')),
    path('api/orders/', include('orders.api_urls')),
    path('api/notifications/', include('notifications.api_urls')),
    
    # API health check and debug
    path('api/health/', health_check, name='health_check'),
    path('api/debug/', api_debug_view, name='api_debug'),
    
    # Comment out API Documentation URLs
    # path('api/swagger<format>/', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    # path('api/swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    # path('api/redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    
    # Standard template-based views (will be replaced by React front-end)
    path('users/', include('users.urls')),
    path('stores/', include('stores.urls')),
    path('products/', include('products.urls')),
    path('orders/', include('orders.urls')),
    path('notifications/', include('notifications.urls')),
    path('', include('stores.landing_urls')),  # Landing page
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
