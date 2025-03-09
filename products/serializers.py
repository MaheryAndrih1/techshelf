from rest_framework import serializers
from .models import Product, Like

class ProductSerializer(serializers.ModelSerializer):
    store = serializers.StringRelatedField()
    store_name = serializers.SerializerMethodField()
    likes = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Product
        fields = ['product_id', 'name', 'price', 'stock', 'category', 'description', 
                 'image', 'store', 'store_name', 'likes', 'created_at', 'updated_at']
        read_only_fields = ['product_id', 'store', 'likes', 'created_at', 'updated_at']
    
    def get_store_name(self, obj):
        return obj.store.store_name if obj.store else None

class ProductCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['name', 'price', 'stock', 'category', 'description', 'image']
    
    def create(self, validated_data):
        store = self.context['request'].user.store
        product = Product.objects.create(store=store, **validated_data)
        return product

class LikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Like
        fields = ['like_id', 'user', 'product', 'timestamp']
        read_only_fields = ['like_id', 'user', 'timestamp']
