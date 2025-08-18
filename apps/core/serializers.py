"""ShareTools Core Application Serializers"""

from rest_framework import serializers
from .models import Item, ItemImage, ItemPrice, Category, Location, User


class UserSerializer(serializers.ModelSerializer):
    """User Serializer"""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'phone', 'avatar', 'is_verified']
        read_only_fields = ['id', 'is_verified']


class CategorySerializer(serializers.ModelSerializer):
    """Category Serializer"""
    class Meta:
        model = Category
        fields = ['id', 'name', 'display_name', 'description', 'icon', 'is_active']
        read_only_fields = ['id']


class LocationSerializer(serializers.ModelSerializer):
    """Location Serializer"""
    class Meta:
        model = Location
        fields = ['id', 'name', 'slug', 'description', 'is_active']
        read_only_fields = ['id']


class ItemImageSerializer(serializers.ModelSerializer):
    """Item Image Serializer"""
    class Meta:
        model = ItemImage
        fields = ['id', 'item', 'image', 'alt_text', 'order', 'is_primary']
        read_only_fields = ['id']
    
    def validate_image(self, value):
        """Validate image file"""
        if not value:
            raise serializers.ValidationError("Please select an image file")
        
        # Check file size (max 10MB)
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("Image file size cannot exceed 10MB")
        
        # Check file format
        allowed_formats = ['JPEG', 'JPG', 'PNG', 'WEBP']
        try:
            from PIL import Image
            img = Image.open(value)
            if img.format not in allowed_formats:
                raise serializers.ValidationError(f"Unsupported image format. Please use: {', '.join(allowed_formats)}")
            
            # Reset file pointer
            value.seek(0)
        except Exception as e:
            raise serializers.ValidationError(f"Invalid image file: {str(e)}")
        
        return value
    
    def create(self, validated_data):
        """Automatically handle primary image logic when creating image"""
        item = validated_data['item']
        
        # If the item doesn't have a primary image yet, set this image as primary
        if not item.images.filter(is_primary=True).exists():
            validated_data['is_primary'] = True
        
        return super().create(validated_data)
    
    def to_representation(self, instance):
        """Custom serialization output"""
        data = super().to_representation(instance)
        if instance.image:
            # Return relative URL path for frontend to handle correctly
            data['image'] = instance.image.url
        return data


class ItemPriceSerializer(serializers.ModelSerializer):
    """Item Price Serializer"""
    daily_price = serializers.ReadOnlyField()
    
    class Meta:
        model = ItemPrice
        fields = ['id', 'item', 'duration_days', 'price', 'daily_price', 'is_active']
        read_only_fields = ['id', 'daily_price']


class ItemSerializer(serializers.ModelSerializer):
    """Item Serializer"""
    owner = UserSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    location = LocationSerializer(read_only=True)
    images = ItemImageSerializer(many=True, read_only=True)
    prices = ItemPriceSerializer(many=True, read_only=True)
    
    # Foreign key fields for create/update operations
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.filter(is_active=True),
        source='category',
        write_only=True
    )
    location_id = serializers.PrimaryKeyRelatedField(
        queryset=Location.objects.filter(is_active=True),
        source='location',
        write_only=True
    )
    
    # Computed fields
    min_daily_price = serializers.SerializerMethodField()
    is_available = serializers.SerializerMethodField()
    primary_image = serializers.SerializerMethodField()
    
    class Meta:
        model = Item
        fields = [
            'id', 'title', 'description', 'category', 'category_id', 
            'owner', 'location', 'location_id', 'status', 'condition',
            'item_value', 'address', 'location_tag', 'area_tag', 'latitude', 'longitude',
            'created_at', 'updated_at', 'published_at',
            'view_count', 'booking_count', 'images', 'prices',
            'min_daily_price', 'is_available', 'primary_image'
        ]
        read_only_fields = [
            'id', 'owner', 'created_at', 'updated_at', 'published_at',
            'view_count', 'booking_count', 'min_daily_price', 
            'is_available', 'primary_image'
        ]
    
    def get_min_daily_price(self, obj):
        """Get minimum daily rental price"""
        return obj.get_min_daily_price()
    
    def get_is_available(self, obj):
        """Check if item is available"""
        return obj.is_available()
    
    def get_primary_image(self, obj):
        """Get primary image"""
        primary_image = obj.images.filter(is_primary=True).first()
        if primary_image:
            return ItemImageSerializer(primary_image).data
        # If no primary image, return the first image
        first_image = obj.images.first()
        if first_image:
            return ItemImageSerializer(first_image).data
        return None
    
    def create(self, validated_data):
        """Create item"""
        # Temporary test: don't set owner in serializer, handled by viewset
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """Update item"""
        # Ensure only item owner can update
        if instance.owner != self.context['request'].user:
            raise serializers.ValidationError("You can only edit your own items")
        return super().update(instance, validated_data)


class ItemListSerializer(serializers.ModelSerializer):
    """Item List Serializer (Simplified Version)"""
    owner = UserSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    location = LocationSerializer(read_only=True)
    min_daily_price = serializers.SerializerMethodField()
    primary_image = serializers.SerializerMethodField()
    
    class Meta:
        model = Item
        fields = [
            'id', 'title', 'category', 'owner', 'location',
            'status', 'condition', 'item_value', 'address',
            'location_tag', 'area_tag',
            'created_at', 'view_count', 'booking_count',
            'min_daily_price', 'primary_image'
        ]
    
    def get_min_daily_price(self, obj):
        """Get minimum daily rental price"""
        return obj.get_min_daily_price()
    
    def get_primary_image(self, obj):
        """Get primary image"""
        primary_image = obj.images.filter(is_primary=True).first()
        if primary_image:
            return {
                'id': primary_image.id,
                'image': primary_image.image.url if primary_image.image else None,
                'alt_text': primary_image.alt_text
            }
        # If no primary image, return the first image
        first_image = obj.images.first()
        if first_image:
            return {
                'id': first_image.id,
                'image': first_image.image.url if first_image.image else None,
                'alt_text': first_image.alt_text
            }
        return None


class ItemCreateUpdateSerializer(serializers.ModelSerializer):
    """Item Create/Update Serializer"""
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.filter(is_active=True),
        source='category'
    )
    location_id = serializers.PrimaryKeyRelatedField(
        queryset=Location.objects.filter(is_active=True),
        source='location'
    )
    
    class Meta:
        model = Item
        fields = [
            'title', 'description', 'category_id', 'location_id',
            'status', 'condition', 'item_value', 'address',
            'location_tag', 'area_tag', 'latitude', 'longitude'
        ]
    
    def create(self, validated_data):
        """Create item"""
        # Temporary test: don't set owner in serializer, handled by viewset
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """Update item"""
        if instance.owner != self.context['request'].user:
            raise serializers.ValidationError("You can only edit your own items")
        return super().update(instance, validated_data)