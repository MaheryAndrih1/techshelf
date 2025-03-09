from django.urls import path
from .api_views import (
    StoreListView, StoreDetailView, StoreCreateView, StoreUpdateView,
    StoreThemeView, StoreRatingListView, StoreRatingCreateView
)

urlpatterns = [
    path('', StoreListView.as_view(), name='api_store_list'),
    path('create/', StoreCreateView.as_view(), name='api_store_create'),  # Now using APIView
    path('<slug:subdomain>/', StoreDetailView.as_view(), name='api_store_detail'),
    path('<slug:subdomain>/update/', StoreUpdateView.as_view(), name='api_store_update'),
    path('<slug:subdomain>/theme/', StoreThemeView.as_view(), name='api_store_theme'),
    path('<slug:subdomain>/ratings/', StoreRatingListView.as_view(), name='api_store_ratings'),
    path('<slug:subdomain>/rate/', StoreRatingCreateView.as_view(), name='api_store_rate'),
]
