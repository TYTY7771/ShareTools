"""Core application URL configuration"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .viewsets import ItemViewSet, CategoryViewSet, LocationViewSet, ItemImageViewSet, ItemPriceViewSet

# Create DRF router for API endpoints
router = DefaultRouter()

# Register viewsets with the router
router.register(r'items', ItemViewSet, basename='item')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'locations', LocationViewSet, basename='location')
router.register(r'item-images', ItemImageViewSet, basename='itemimage')
router.register(r'item-prices', ItemPriceViewSet, basename='itemprice')

urlpatterns = [
    # ==================== Page Routes ==================== #
    path('', views.home, name='home'),  # Home page
    path('sharetools/', views.home, name='sharetools'),  # Alternative home path
    path('login/', views.login_view, name='login'),  # Login page
    path('login.html', views.login_view, name='login_html'),  # Direct .html access compatibility
    path('register/', views.register_view, name='register'),  # Register page
    path('register.html', views.register_view, name='register_html'),  # Direct .html access compatibility
    path('logout/', views.logout_view, name='logout'),  # Logout page
    path('list-item/', views.list_item_view, name='list_item'),  # Item listing page
    path('list-item.html', views.list_item_view, name='list_item_html'),  # Direct .html access compatibility
    path('profile/', views.profile_view, name='profile'),  # User profile page
    path('profile.html', views.profile_view, name='profile_html'),  # Direct .html access compatibility
    path('edit-profile/', views.edit_profile_view, name='edit_profile'),  # Edit profile page
    path('edit-profile.html', views.edit_profile_view, name='edit_profile_html'),  # Direct .html access compatibility
    path('browse-things/', views.browse_things_view, name='browse_things'),  # Browse items page
    path('browse-things.html', views.browse_things_view, name='browse_things_html'),  # Direct .html access compatibility
    path('locations/', views.locations_view, name='locations'),  # Locations page
    path('locations.html', views.locations_view, name='locations_html'),  # Direct .html access compatibility
    path('about/', views.about_view, name='about'),  # About page
    path('about.html', views.about_view, name='about_html'),  # Direct .html access compatibility
    path('view-orders/', views.view_orders, name='view_orders'),  # View orders page
    path('view-orders.html', views.view_orders, name='view_orders_html'),  # Direct .html access compatibility
    path('product/<uuid:product_id>/', views.product_detail_view, name='product_detail'),  # Product detail page
    path('product-detail/', views.product_detail_view, name='product_detail_demo'),  # Product detail demo page
    path('product-detail.html', views.product_detail_view, name='product_detail_html'),  # Direct .html access compatibility
    path('test-api/', views.test_api_view, name='test_api'),  # API test page
    path('test-images/', views.test_images_view, name='test_images'),  # Image test page
    path('test-image-display/', views.test_image_display_view, name='test_image_display'),  # Image display test page
    path('test-image-upload/', views.test_image_upload_view, name='test_image_upload'),  # Image upload test page
    path('new-image-upload/', views.new_image_upload_view, name='new_image_upload'),  # New image upload page
    path('upload-navigation/', views.upload_navigation_view, name='upload_navigation'),
    path('location/<str:location_name>/', views.browse_things_view, name='location_things'),  # Upload navigation page
    
    # ==================== Authentication API Routes ==================== #
    path('api/auth/register/', views.register_api, name='register_api'),  # User registration API
    path('api/auth/login/', views.login_api, name='login_api'),  # User login API
    path('api/auth/logout/', views.logout_api, name='logout_api'),  # User logout API
    path('api/auth/user/', views.user_info_api, name='user_info_api'),  # Get user info API
    path('api/auth/profile/', views.update_profile_api, name='update_profile_api'),  # Update user profile API
    path('api/auth/change-password/', views.change_password_api, name='change_password_api'),  # Change password API
    
    # ==================== Validation API Routes ==================== #
    path('api/validate/prices/', views.validate_prices, name='validate_prices'),  # Price validation API
    path('api/validate/form/', views.validate_form_data, name='validate_form_data'),  # Form validation API
    path('api/suggestions/prices/', views.get_price_suggestions, name='get_price_suggestions'),  # Price suggestions API
    
    # ==================== DRF API Routes ==================== #
    path('api/', include(router.urls)),  # Django REST Framework API routes
]