"""ViewSets for ShareTools core application"""

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
    """Category ViewSet (Read-only)"""
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


@method_decorator(csrf_exempt, name='dispatch')
class LocationViewSet(viewsets.ReadOnlyModelViewSet):
    """Location ViewSet (Read-only)"""
    queryset = Location.objects.filter(is_active=True)
    serializer_class = LocationSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


@method_decorator(csrf_exempt, name='dispatch')
class ItemViewSet(viewsets.ModelViewSet):
    """Item ViewSet"""
    queryset = Item.objects.select_related('owner', 'category', 'location').prefetch_related('images', 'prices')
    permission_classes = []  # Temporarily remove permission restrictions for testing
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'location', 'status', 'condition']
    search_fields = ['title', 'description', 'address']
    ordering_fields = ['created_at', 'updated_at', 'item_value', 'view_count', 'booking_count']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """Select serializer based on action"""
        if self.action == 'list':
            return ItemListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ItemCreateUpdateSerializer
        return ItemSerializer
    
    def get_queryset(self):
        """Get queryset"""
        queryset = self.queryset
        
        # If it's list view, only show published items
        if self.action == 'list':
            # Non-owners can only see published items
            if not self.request.user.is_authenticated:
                queryset = queryset.filter(status='active')
            else:
                # Authenticated users can see all published items + their own items
                queryset = queryset.filter(
                    Q(status='active') | Q(owner=self.request.user)
                )
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        """Create item and return complete information"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Temporary test: get or create test user
        from django.contrib.auth import get_user_model
        from .models import ItemPrice
        User = get_user_model()
        
        # Try to get existing test user
        owner = User.objects.filter(username='testuser').first()
        if not owner:
            # If no test user exists, create one
            owner = User.objects.create_user(
                username='testuser',
                email='test@example.com',
                password='testpass123'
            )
        
        # Save item
        item = serializer.save(owner=owner)
        
        # Handle price information
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
        
        # Automatically publish newly created item
        item.publish()
        
        # Return data using complete serializer
        response_serializer = ItemSerializer(item, context={'request': request})
        headers = self.get_success_headers(response_serializer.data)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def perform_update(self, serializer):
        """Check permissions when updating item"""
        if serializer.instance.owner != self.request.user:
            raise PermissionError("You can only edit your own items")
        serializer.save()
    
    def perform_destroy(self, instance):
        """Check permissions when deleting item"""
        if instance.owner != self.request.user:
            raise PermissionError("You can only delete your own items")
        instance.delete()
    
    def retrieve(self, request, *args, **kwargs):
        """Increase view count when retrieving item details"""
        instance = self.get_object()
        # Increase view count (avoid counting when owner views their own item)
        if request.user != instance.owner:
            Item.objects.filter(pk=instance.pk).update(view_count=instance.view_count + 1)
            instance.refresh_from_db()
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def publish(self, request, pk=None):
        """Publish item"""
        item = self.get_object()
        
        if item.owner != request.user:
            return Response(
                {'error': 'You can only publish your own items'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if item.status != 'draft':
            return Response(
                {'error': 'Only draft items can be published'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        item.publish()
        serializer = self.get_serializer(item)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_items(self, request):
        """Get all items of current user"""
        queryset = self.get_queryset().filter(owner=request.user)
        
        # Apply filtering and search
        queryset = self.filter_queryset(queryset)
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = ItemListSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        
        serializer = ItemListSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Get featured items"""
        # Get items with high views and good ratings
        queryset = self.get_queryset().filter(
            status='active'
        ).order_by('-view_count', '-booking_count')[:10]
        
        serializer = ItemListSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Advanced search"""
        queryset = self.get_queryset().filter(status='active')
        
        # Keyword search
        q = request.query_params.get('q')
        if q:
            queryset = queryset.filter(
                Q(title__icontains=q) | 
                Q(description__icontains=q) |
                Q(address__icontains=q)
            )
        
        # Price range
        min_price = request.query_params.get('min_price')
        max_price = request.query_params.get('max_price')
        if min_price:
            queryset = queryset.filter(item_value__gte=min_price)
        if max_price:
            queryset = queryset.filter(item_value__lte=max_price)
        
        # Category filter
        category = request.query_params.get('category')
        if category:
            queryset = queryset.filter(category_id=category)
        
        # Location filter
        location = request.query_params.get('location')
        if location:
            queryset = queryset.filter(location_id=location)
        
        # Condition filter
        condition = request.query_params.get('condition')
        if condition:
            queryset = queryset.filter(condition=condition)
        
        # Sorting
        sort_by = request.query_params.get('sort', '-created_at')
        if sort_by in ['created_at', '-created_at', 'item_value', '-item_value', 'view_count', '-view_count']:
            queryset = queryset.order_by(sort_by)
        
        # Pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = ItemListSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        
        serializer = ItemListSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)


@method_decorator(csrf_exempt, name='dispatch')
class ItemImageViewSet(viewsets.ModelViewSet):
    """Item Image ViewSet"""
    serializer_class = ItemImageSerializer
    permission_classes = []  # Temporarily remove permission restrictions for testing
    
    def get_queryset(self):
        """Get all item images (temporary test)"""
        return ItemImage.objects.all()
    
    def perform_create(self, serializer):
        """Handle image creation (temporary test version)"""
        # Temporary test: allow anyone to add images to any item
        serializer.save()
    
    def perform_update(self, serializer):
        """Check permissions when updating image"""
        if serializer.instance.item.owner != self.request.user:
            raise PermissionError("You can only edit images of your own items")
        serializer.save()
    
    def perform_destroy(self, instance):
        """Check permissions when deleting image"""
        if instance.item.owner != self.request.user:
            raise PermissionError("You can only delete images of your own items")
        instance.delete()
    
    @action(detail=False, methods=['post'], permission_classes=[])
    def bulk_upload(self, request):
        """Bulk upload images"""
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
            
            # Process multiple image files
            for key, file in request.FILES.items():
                if key.startswith('image_'):
                    try:
                        # Create image record
                        order = len(uploaded_images) + 1
                        is_primary = order == 1  # Set first image as primary
                        
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
    """Item Price ViewSet"""
    serializer_class = ItemPriceSerializer
    permission_classes = []  # Temporarily remove permission restrictions for testing
    
    def get_queryset(self):
        """Get all item prices (temporary test)"""
        return ItemPrice.objects.all()
    
    def perform_create(self, serializer):
        """Handle price creation (temporary test version)"""
        # Temporary test: allow anyone to set prices for any item
        serializer.save()
    
    def perform_update(self, serializer):
        """Check permissions when updating price"""
        if serializer.instance.item.owner != self.request.user:
            raise PermissionError("You can only edit prices of your own items")
        serializer.save()
    
    def perform_destroy(self, instance):
        """Check permissions when deleting price"""
        if instance.item.owner != self.request.user:
            raise PermissionError("You can only delete prices of your own items")
        instance.delete()