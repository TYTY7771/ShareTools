"""ShareTools 核心应用的序列化器"""

from rest_framework import serializers
from .models import Item, ItemImage, ItemPrice, Category, Location, User


class UserSerializer(serializers.ModelSerializer):
    """用户序列化器"""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'phone', 'avatar', 'is_verified']
        read_only_fields = ['id', 'is_verified']


class CategorySerializer(serializers.ModelSerializer):
    """分类序列化器"""
    class Meta:
        model = Category
        fields = ['id', 'name', 'display_name', 'description', 'icon', 'is_active']
        read_only_fields = ['id']


class LocationSerializer(serializers.ModelSerializer):
    """位置序列化器"""
    class Meta:
        model = Location
        fields = ['id', 'name', 'slug', 'description', 'is_active']
        read_only_fields = ['id']


class ItemImageSerializer(serializers.ModelSerializer):
    """物品图片序列化器"""
    class Meta:
        model = ItemImage
        fields = ['id', 'item', 'image', 'alt_text', 'order', 'is_primary']
        read_only_fields = ['id']
    
    def validate_image(self, value):
        """验证图片文件"""
        if not value:
            raise serializers.ValidationError("Please select an image file")
        
        # 检查文件大小 (最大 10MB)
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("Image file size cannot exceed 10MB")
        
        # 检查文件格式
        allowed_formats = ['JPEG', 'JPG', 'PNG', 'WEBP']
        try:
            from PIL import Image
            img = Image.open(value)
            if img.format not in allowed_formats:
                raise serializers.ValidationError(f"Unsupported image format. Please use: {', '.join(allowed_formats)}")
            
            # 重置文件指针
            value.seek(0)
        except Exception as e:
            raise serializers.ValidationError(f"Invalid image file: {str(e)}")
        
        return value
    
    def create(self, validated_data):
        """创建图片时自动处理主图片逻辑"""
        item = validated_data['item']
        
        # 如果该物品还没有主图片，将这张图片设为主图片
        if not item.images.filter(is_primary=True).exists():
            validated_data['is_primary'] = True
        
        return super().create(validated_data)
    
    def to_representation(self, instance):
        """自定义序列化输出"""
        data = super().to_representation(instance)
        if instance.image:
            # 返回相对URL路径，前端可以正确处理
            data['image'] = instance.image.url
        return data


class ItemPriceSerializer(serializers.ModelSerializer):
    """物品价格序列化器"""
    daily_price = serializers.ReadOnlyField()
    
    class Meta:
        model = ItemPrice
        fields = ['id', 'item', 'duration_days', 'price', 'daily_price', 'is_active']
        read_only_fields = ['id', 'daily_price']


class ItemSerializer(serializers.ModelSerializer):
    """物品序列化器"""
    owner = UserSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    location = LocationSerializer(read_only=True)
    images = ItemImageSerializer(many=True, read_only=True)
    prices = ItemPriceSerializer(many=True, read_only=True)
    
    # 用于创建/更新时的外键字段
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
    
    # 计算字段
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
        """获取最低日租价格"""
        return obj.get_min_daily_price()
    
    def get_is_available(self, obj):
        """检查物品是否可用"""
        return obj.is_available()
    
    def get_primary_image(self, obj):
        """获取主图片"""
        primary_image = obj.images.filter(is_primary=True).first()
        if primary_image:
            return ItemImageSerializer(primary_image).data
        # 如果没有主图片，返回第一张图片
        first_image = obj.images.first()
        if first_image:
            return ItemImageSerializer(first_image).data
        return None
    
    def create(self, validated_data):
        """创建物品"""
        # 临时测试：不在序列化器中设置 owner，由视图集处理
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """更新物品"""
        # 确保只有物品所有者可以更新
        if instance.owner != self.context['request'].user:
            raise serializers.ValidationError("您只能编辑自己的物品")
        return super().update(instance, validated_data)


class ItemListSerializer(serializers.ModelSerializer):
    """物品列表序列化器（简化版）"""
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
        """获取最低日租价格"""
        return obj.get_min_daily_price()
    
    def get_primary_image(self, obj):
        """获取主图片"""
        primary_image = obj.images.filter(is_primary=True).first()
        if primary_image:
            return {
                'id': primary_image.id,
                'image': primary_image.image.url if primary_image.image else None,
                'alt_text': primary_image.alt_text
            }
        # 如果没有主图片，返回第一张图片
        first_image = obj.images.first()
        if first_image:
            return {
                'id': first_image.id,
                'image': first_image.image.url if first_image.image else None,
                'alt_text': first_image.alt_text
            }
        return None


class ItemCreateUpdateSerializer(serializers.ModelSerializer):
    """物品创建/更新序列化器"""
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
        """创建物品"""
        # 临时测试：不在序列化器中设置 owner，由视图集处理
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """更新物品"""
        if instance.owner != self.context['request'].user:
            raise serializers.ValidationError("您只能编辑自己的物品")
        return super().update(instance, validated_data)