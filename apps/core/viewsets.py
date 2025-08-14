"""ShareTools 核心应用的视图集"""

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from .models import Item, ItemImage, ItemPrice, Category, Location
from .serializers import (
    ItemSerializer, ItemListSerializer, ItemCreateUpdateSerializer,
    ItemImageSerializer, ItemPriceSerializer, CategorySerializer, LocationSerializer
)


@method_decorator(csrf_exempt, name='dispatch')
class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """分类视图集（只读）"""
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


@method_decorator(csrf_exempt, name='dispatch')
class LocationViewSet(viewsets.ReadOnlyModelViewSet):
    """位置视图集（只读）"""
    queryset = Location.objects.filter(is_active=True)
    serializer_class = LocationSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


@method_decorator(csrf_exempt, name='dispatch')
class ItemViewSet(viewsets.ModelViewSet):
    """物品视图集"""
    queryset = Item.objects.select_related('owner', 'category', 'location').prefetch_related('images', 'prices')
    permission_classes = []  # 临时移除权限限制用于测试
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'location', 'status', 'condition']
    search_fields = ['title', 'description', 'address']
    ordering_fields = ['created_at', 'updated_at', 'item_value', 'view_count', 'booking_count']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """根据动作选择序列化器"""
        if self.action == 'list':
            return ItemListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ItemCreateUpdateSerializer
        return ItemSerializer
    
    def get_queryset(self):
        """获取查询集"""
        queryset = self.queryset
        
        # 如果是列表视图，只显示已发布的物品
        if self.action == 'list':
            # 非物品所有者只能看到已发布的物品
            if not self.request.user.is_authenticated:
                queryset = queryset.filter(status='active')
            else:
                # 已登录用户可以看到所有已发布的物品 + 自己的所有物品
                queryset = queryset.filter(
                    Q(status='active') | Q(owner=self.request.user)
                )
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        """创建物品并返回完整信息"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # 临时测试：获取或创建测试用户
        from django.contrib.auth import get_user_model
        from .models import ItemPrice
        User = get_user_model()
        
        # 尝试获取现有的测试用户
        owner = User.objects.filter(username='testuser').first()
        if not owner:
            # 如果没有测试用户，创建一个
            owner = User.objects.create_user(
                username='testuser',
                email='test@example.com',
                password='testpass123'
            )
        
        # 保存物品
        item = serializer.save(owner=owner)
        
        # 处理价格信息
        price_data = request.data
        if 'price_1_day' in price_data and price_data['price_1_day']:
            try:
                price_1_day = float(price_data['price_1_day'])
                ItemPrice.objects.create(item=item, duration_days=1, price=price_1_day)
            except (ValueError, TypeError):
                pass
        
        if 'price_3_days' in price_data and price_data['price_3_days']:
            try:
                price_3_days = float(price_data['price_3_days'])
                ItemPrice.objects.create(item=item, duration_days=3, price=price_3_days)
            except (ValueError, TypeError):
                pass
        
        if 'price_7_days' in price_data and price_data['price_7_days']:
            try:
                price_7_days = float(price_data['price_7_days'])
                ItemPrice.objects.create(item=item, duration_days=7, price=price_7_days)
            except (ValueError, TypeError):
                pass
        
        # 自动发布新创建的物品
        item.publish()
        
        # 使用完整的序列化器返回数据
        response_serializer = ItemSerializer(item, context={'request': request})
        headers = self.get_success_headers(response_serializer.data)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def perform_update(self, serializer):
        """更新物品时检查权限"""
        if serializer.instance.owner != self.request.user:
            raise PermissionError("您只能编辑自己的物品")
        serializer.save()
    
    def perform_destroy(self, instance):
        """删除物品时检查权限"""
        if instance.owner != self.request.user:
            raise PermissionError("您只能删除自己的物品")
        instance.delete()
    
    def retrieve(self, request, *args, **kwargs):
        """获取单个物品详情时增加浏览次数"""
        instance = self.get_object()
        # 增加浏览次数（避免物品所有者浏览自己的物品时增加次数）
        if request.user != instance.owner:
            Item.objects.filter(pk=instance.pk).update(view_count=instance.view_count + 1)
            instance.refresh_from_db()
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def publish(self, request, pk=None):
        """发布物品"""
        item = self.get_object()
        
        if item.owner != request.user:
            return Response(
                {'error': '您只能发布自己的物品'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if item.status != 'draft':
            return Response(
                {'error': '只能发布草稿状态的物品'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        item.publish()
        serializer = self.get_serializer(item)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_items(self, request):
        """获取当前用户的所有物品"""
        queryset = self.get_queryset().filter(owner=request.user)
        
        # 应用过滤和搜索
        queryset = self.filter_queryset(queryset)
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = ItemListSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        
        serializer = ItemListSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        """获取推荐物品"""
        # 获取浏览量高、评分好的物品
        queryset = self.get_queryset().filter(
            status='active'
        ).order_by('-view_count', '-booking_count')[:10]
        
        serializer = ItemListSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """高级搜索"""
        queryset = self.get_queryset().filter(status='active')
        
        # 关键词搜索
        q = request.query_params.get('q')
        if q:
            queryset = queryset.filter(
                Q(title__icontains=q) | 
                Q(description__icontains=q) |
                Q(address__icontains=q)
            )
        
        # 价格范围
        min_price = request.query_params.get('min_price')
        max_price = request.query_params.get('max_price')
        if min_price:
            queryset = queryset.filter(item_value__gte=min_price)
        if max_price:
            queryset = queryset.filter(item_value__lte=max_price)
        
        # 分类过滤
        category = request.query_params.get('category')
        if category:
            queryset = queryset.filter(category_id=category)
        
        # 位置过滤
        location = request.query_params.get('location')
        if location:
            queryset = queryset.filter(location_id=location)
        
        # 状况过滤
        condition = request.query_params.get('condition')
        if condition:
            queryset = queryset.filter(condition=condition)
        
        # 排序
        sort_by = request.query_params.get('sort', '-created_at')
        if sort_by in ['created_at', '-created_at', 'item_value', '-item_value', 'view_count', '-view_count']:
            queryset = queryset.order_by(sort_by)
        
        # 分页
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = ItemListSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        
        serializer = ItemListSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)


@method_decorator(csrf_exempt, name='dispatch')
class ItemImageViewSet(viewsets.ModelViewSet):
    """物品图片视图集"""
    serializer_class = ItemImageSerializer
    permission_classes = []  # 临时移除权限限制用于测试
    
    def get_queryset(self):
        """获取所有物品图片（临时测试）"""
        return ItemImage.objects.all()
    
    def perform_create(self, serializer):
        """创建图片时的处理（临时测试版本）"""
        # 临时测试：允许任何人为任何物品添加图片
        serializer.save()
    
    def perform_update(self, serializer):
        """更新图片时检查权限"""
        if serializer.instance.item.owner != self.request.user:
            raise PermissionError("您只能编辑自己物品的图片")
        serializer.save()
    
    def perform_destroy(self, instance):
        """删除图片时检查权限"""
        if instance.item.owner != self.request.user:
            raise PermissionError("您只能删除自己物品的图片")
        instance.delete()
    
    @action(detail=False, methods=['post'], permission_classes=[])
    def bulk_upload(self, request):
        """批量上传图片"""
        try:
            item_id = request.data.get('item_id')
            if not item_id:
                return Response({'error': 'item_id is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            # 获取物品
            try:
                item = Item.objects.get(id=item_id)
            except Item.DoesNotExist:
                return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)
            
            uploaded_images = []
            errors = []
            
            # 处理多个图片文件
            for key, file in request.FILES.items():
                if key.startswith('image_'):
                    try:
                        # 创建图片记录
                        order = len(uploaded_images) + 1
                        is_primary = order == 1  # 第一张图片设为主图
                        
                        image_data = {
                            'item': item.id,
                            'image': file,
                            'alt_text': f'{item.title} - Image {order}',
                            'order': order,
                            'is_primary': is_primary
                        }
                        
                        serializer = ItemImageSerializer(data=image_data)
                        if serializer.is_valid():
                            image = serializer.save()
                            uploaded_images.append(serializer.data)
                        else:
                            errors.append(f'{key}: {serializer.errors}')
                    except Exception as e:
                        errors.append(f'{key}: {str(e)}')
            
            if uploaded_images:
                return Response({
                    'success': True,
                    'uploaded_images': uploaded_images,
                    'count': len(uploaded_images),
                    'errors': errors
                }, status=status.HTTP_201_CREATED)
            else:
                return Response({
                    'success': False,
                    'message': 'No images were uploaded successfully',
                    'errors': errors
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response({
                'success': False,
                'error': f'Bulk upload failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@method_decorator(csrf_exempt, name='dispatch')
class ItemPriceViewSet(viewsets.ModelViewSet):
    """物品价格视图集"""
    serializer_class = ItemPriceSerializer
    permission_classes = []  # 临时移除权限限制用于测试
    
    def get_queryset(self):
        """获取所有物品价格（临时测试）"""
        return ItemPrice.objects.all()
    
    def perform_create(self, serializer):
        """创建价格时的处理（临时测试版本）"""
        # 临时测试：允许任何人为任何物品设置价格
        serializer.save()
    
    def perform_update(self, serializer):
        """更新价格时检查权限"""
        if serializer.instance.item.owner != self.request.user:
            raise PermissionError("您只能编辑自己物品的价格")
        serializer.save()
    
    def perform_destroy(self, instance):
        """删除价格时检查权限"""
        if instance.item.owner != self.request.user:
            raise PermissionError("您只能删除自己物品的价格")
        instance.delete()