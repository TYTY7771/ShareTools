"""
ShareTools Core Application View Functions
"""
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from django.core.exceptions import ValidationError
from django.contrib.auth.password_validation import validate_password
import json
from .models import User
from .validators import PriceValidator


def home(request):
    """Render home page"""
    return render(request, 'index.html')


def login_view(request):
    """Render login page"""
    return render(request, 'login.html')


def register_view(request):
    """Render registration page"""
    return render(request, 'register.html')


def logout_view(request):
    """Handle user logout"""
    logout(request)
    messages.success(request, "You have successfully logged out")
    return redirect('home')


def list_item_view(request):
    """Render item listing page"""
    return render(request, 'list_item.html')


def profile_view(request):
    """Render profile page"""
    return render(request, 'profile.html')


def edit_profile_view(request):
    """Render edit profile page"""
    return render(request, 'edit_profile.html')


def browse_things_view(request):
    """Render items browsing page"""
    from .models import Item

    # Get all active items, preload related data for performance
    items = Item.objects.filter(status='active').select_related(
        'owner', 'category', 'location'
    ).prefetch_related(
        'images'  # Preload image relationships to ensure primary_image property works correctly
    ).order_by('-created_at')

    context = {
        'items': items,
    }

    return render(request, 'browse_things.html', context)


def locations_view(request):
    """Locations page"""
    from .models import Location
    
    # Get all active locations
    locations = Location.objects.filter(is_active=True).order_by('name')
    
    context = {
        'locations': locations,
    }
    
    return render(request, 'locations.html', context)


def about_view(request):
    """About page"""
    return render(request, 'about.html')


def view_orders(request):
    """View orders page"""
    return render(request, 'view_orders.html')


def product_detail_view(request, product_id=None):
    """Render product detail page"""
    from .models import Item
    from django.shortcuts import get_object_or_404
    import json
    from decimal import Decimal

    # Get product information from database based on product_id
    if product_id:
        try:
            # Preload related data for performance and to avoid query errors
            item = Item.objects.select_related(
                'owner', 'category', 'location'
            ).prefetch_related(
                'images', 'prices'
            ).get(id=product_id)

            # Increase view count (avoid incrementing when item owner views their own item)
            if request.user.is_authenticated and request.user != item.owner:
                Item.objects.filter(pk=item.pk).update(view_count=item.view_count + 1)
                # Reload data while maintaining preloaded relationships
                item = Item.objects.select_related(
                    'owner', 'category', 'location'
                ).prefetch_related(
                    'images', 'prices'
                ).get(id=product_id)

            # Prepare product data JSON, fix price display logic
            product_data = {
                'id': str(item.id),
                'title': item.title,
                'itemValue': float(item.item_value) if item.item_value else 500,
                'minDailyPrice': None,  # Will be calculated below
                'prices': []
            }

            # Add price information, ensure prices are sorted by rental period
            active_prices = item.prices.filter(is_active=True).order_by('duration_days')
            if active_prices.exists():
                for price in active_prices:
                    product_data['prices'].append({
                        'duration': price.duration_days,
                        'totalPrice': float(price.price),
                        'dailyPrice': float(price.daily_price)
                    })
                
                # Calculate minimum daily rental price
                min_daily_price = min(price.daily_price for price in active_prices)
                product_data['minDailyPrice'] = float(min_daily_price)
            else:
                # If no price data, use default prices
                product_data['prices'] = [
                    {'duration': 1, 'totalPrice': 20, 'dailyPrice': 20},
                    {'duration': 3, 'totalPrice': 54, 'dailyPrice': 18},
                    {'duration': 7, 'totalPrice': 105, 'dailyPrice': 15},
                    {'duration': 30, 'totalPrice': 360, 'dailyPrice': 12}
                ]
                product_data['minDailyPrice'] = 12.0  # Daily price for 30-day rental

            context = {
                'item': item,
                'product_id': product_id,
                'product_data_json': product_data,
            }
        except Item.DoesNotExist:
            # If product doesn't exist, return 404 page or redirect to product list
            context = {
                'error': 'Product not found',
                'product_id': product_id,
                'item': None,
                'product_data_json': {
                    'id': None,
                    'title': 'Product Not Found',
                    'itemValue': 500,
                    'minDailyPrice': 20,
                    'prices': [
                        {'duration': 1, 'totalPrice': 20, 'dailyPrice': 20}
                    ]
                },
            }
    else:
        # If no product_id provided, show demo page
        context = {
            'product_id': None,
            'demo_mode': True,
            'item': None,
            'product_data_json': {
                'id': None,
                'title': 'Demo Product',
                'itemValue': 500,
                'minDailyPrice': 12,
                'prices': [
                    {'duration': 1, 'totalPrice': 20, 'dailyPrice': 20},
                    {'duration': 3, 'totalPrice': 54, 'dailyPrice': 18},
                    {'duration': 7, 'totalPrice': 105, 'dailyPrice': 15},
                    {'duration': 30, 'totalPrice': 360, 'dailyPrice': 12}
                ]
            },
        }

    return render(request, 'product_detail.html', context)


def test_api_view(request):
    """API test page"""
    return render(request, 'test_api.html')


def test_images_view(request):
    """Image test page"""
    from .models import Item

    # Get test Item
    item = None
    try:
        item = Item.objects.get(id='c4b06a35-426c-4b40-acf5-e8d7849eb6d8')
    except Item.DoesNotExist:
        # If specified Item doesn't exist, get the first Item with images
        item = Item.objects.filter(images__isnull=False).first()

    context = {
        'item': item,
    }

    return render(request, 'test_images.html', context)


def test_image_display_view(request):
    """Render image display test page"""
    from .models import Item, ItemImage

    # Get items with images
    items = Item.objects.filter(status='active').prefetch_related('images').order_by('-created_at')[:10]

    # Get some test images
    test_images = ItemImage.objects.select_related('item').all()[:8]

    context = {
        'items': items,
        'test_images': test_images,
    }

    return render(request, 'test_image_display.html', context)


def test_image_upload_view(request):
    """Render image upload test page"""
    return render(request, 'test_image_upload.html')


def new_image_upload_view(request):
    """Render new image upload page"""
    return render(request, 'new_image_upload.html')


def upload_navigation_view(request):
    """Render image upload navigation page"""
    return render(request, 'upload_navigation.html')


# ==================== Authentication Related APIs ==================== #

@csrf_exempt
@require_http_methods(["POST"])
def register_api(request):
    """User registration API"""
    try:
        data = json.loads(request.body)
        username = data.get('username', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '')
        password_confirm = data.get('password_confirm', '')

        # Validate required fields
        if not all([username, email, password, password_confirm]):
            return JsonResponse({
                'success': False,
                'message': 'All fields are required'
            }, status=400)

        # Validate password confirmation
        if password != password_confirm:
            return JsonResponse({
                'success': False,
                'message': 'Password confirmation does not match'
            }, status=400)

        # Check if username already exists
        if User.objects.filter(username=username).exists():
            return JsonResponse({
                'success': False,
                'message': 'Username already exists'
            }, status=400)

        # Check if email already exists
        if User.objects.filter(email=email).exists():
            return JsonResponse({
                'success': False,
                'message': 'Email already registered'
            }, status=400)

        # Validate password strength
        try:
            validate_password(password)
        except ValidationError as e:
            return JsonResponse({
                'success': False,
                'message': 'Password does not meet requirements: ' + ', '.join(e.messages)
            }, status=400)

        # Create user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )

        # Auto login
        login(request, user)

        return JsonResponse({
            'success': True,
            'message': 'Registration successful',
            'user': {
                'id': str(user.id),
                'username': user.username,
                'email': user.email
            }
        })

    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'message': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Registration failed: {str(e)}'
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def login_api(request):
    """User login API"""
    try:
        data = json.loads(request.body)
        username = data.get('username', '').strip()
        password = data.get('password', '')

        # Validate required fields
        if not all([username, password]):
            return JsonResponse({
                'success': False,
                'message': 'Username and password are required'
            }, status=400)

        # Attempt username login
        user = authenticate(request, username=username, password=password)

        # If username login fails, try email login
        if user is None:
            try:
                user_obj = User.objects.get(email=username)
                user = authenticate(request, username=user_obj.username, password=password)
            except User.DoesNotExist:
                pass

        if user is not None:
            if user.is_active:
                login(request, user)
                return JsonResponse({
                    'success': True,
                    'message': 'Login successful',
                    'user': {
                        'id': str(user.id),
                        'username': user.username,
                        'email': user.email,
                        'is_verified': user.is_verified
                    }
                })
            else:
                return JsonResponse({
                    'success': False,
                    'message': 'Account has been disabled'
                }, status=403)
        else:
            return JsonResponse({
                'success': False,
                'message': 'Invalid username/email or password'
            }, status=401)

    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'message': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Login failed: {str(e)}'
        }, status=500)


@require_http_methods(["POST"])
def logout_api(request):
    """User logout API"""
    try:
        if request.user.is_authenticated:
            logout(request)
            return JsonResponse({
                'success': True,
                'message': 'Logout successful'
            })
        else:
            return JsonResponse({
                'success': False,
                'message': 'User not logged in'
            }, status=401)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Logout failed: {str(e)}'
        }, status=500)


@require_http_methods(["GET"])
def user_info_api(request):
    """Get current user info API"""
    try:
        if request.user.is_authenticated:
            user = request.user
            return JsonResponse({
                'success': True,
                'user': {
                    'id': str(user.id),
                    'username': user.username,
                    'email': user.email,
                    'phone': user.phone,
                    'bio': user.bio,
                    'address': user.address,
                    'is_verified': user.is_verified,
                    'created_at': user.created_at.isoformat(),
                    'avatar': user.avatar.url if user.avatar else None
                }
            })
        else:
            return JsonResponse({
                'success': False,
                'message': 'User not logged in'
            }, status=401)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Failed to get user info: {str(e)}'
        }, status=500)


@login_required
@csrf_exempt
@require_http_methods(["POST"])
def update_profile_api(request):
    """Update user profile API"""
    try:
        data = json.loads(request.body)
        user = request.user

        # Updatable fields
        updatable_fields = ['phone', 'bio', 'address']

        for field in updatable_fields:
            if field in data:
                setattr(user, field, data[field])

        user.save()

        return JsonResponse({
            'success': True,
            'message': 'Profile updated successfully',
            'user': {
                'id': str(user.id),
                'username': user.username,
                'email': user.email,
                'phone': user.phone,
                'bio': user.bio,
                'address': user.address,
                'is_verified': user.is_verified
            }
        })

    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'message': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Failed to update profile: {str(e)}'
        }, status=500)


@login_required
@csrf_exempt
@require_http_methods(["POST"])
def change_password_api(request):
    """Change password API"""
    try:
        data = json.loads(request.body)
        current_password = data.get('current_password', '')
        new_password = data.get('new_password', '')
        new_password_confirm = data.get('new_password_confirm', '')

        # Validate required fields
        if not all([current_password, new_password, new_password_confirm]):
            return JsonResponse({
                'success': False,
                'message': 'All fields are required'
            }, status=400)

        # Validate new password confirmation
        if new_password != new_password_confirm:
            return JsonResponse({
                'success': False,
                'message': 'New password confirmation does not match'
            }, status=400)

        # Validate current password
        user = request.user
        if not user.check_password(current_password):
            return JsonResponse({
                'success': False,
                'message': 'Current password is incorrect'
            }, status=400)

        # Validate new password strength
        try:
            validate_password(new_password, user)
        except ValidationError as e:
            return JsonResponse({
                'success': False,
                'message': 'New password does not meet requirements: ' + ', '.join(e.messages)
            }, status=400)

        # Update password
        user.set_password(new_password)
        user.save()

        # Re-login
        login(request, user)

        return JsonResponse({
            'success': True,
            'message': 'Password changed successfully'
        })

    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'message': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Failed to change password: {str(e)}'
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def validate_prices(request):
    """Price validation API endpoint"""
    try:
        # Parse request data
        data = json.loads(request.body)

        # Execute validation
        errors = PriceValidator.validate_all(data)

        # Return result
        if errors:
            return JsonResponse({
                'valid': False,
                'errors': errors,
                'message': f'Found {len(errors)} issues'
            }, status=400)
        else:
            return JsonResponse({
                'valid': True,
                'message': 'Price validation passed',
                'errors': []
            })

    except json.JSONDecodeError:
        return JsonResponse({
            'valid': False,
            'errors': ['Invalid JSON data'],
            'message': 'Request data format error'
        }, status=400)

    except Exception as e:
        return JsonResponse({
            'valid': False,
            'errors': [f'Server error: {str(e)}'],
            'message': 'Error occurred during validation'
        }, status=500)


@csrf_exempt
@require_http_methods(["GET"])
def get_price_suggestions(request):
    """Get price suggestions API endpoint"""
    try:
        category = request.GET.get('category', None)
        suggestions = PriceValidator.get_price_suggestions(category)

        # Ensure keys are string type
        suggestions_str_keys = {str(k): v for k, v in suggestions.items()}

        return JsonResponse({
            'success': True,
            'suggestions': suggestions_str_keys,
            'category': category or 'default'
        })

    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def validate_form_data(request):
    """Complete form data validation API endpoint"""
    try:
        data = json.loads(request.body)
        errors = []

        # Basic information validation
        title = data.get('title', '').strip()
        description = data.get('description', '').strip()
        category_id = data.get('category_id', '')

        if not title or len(title) < 2:
            errors.append('Please enter a title with at least 2 characters')
        elif len(title) > 200:
            errors.append('Title cannot exceed 200 characters')

        if not description or len(description) < 10:
            errors.append('Please enter a description with at least 10 characters')
        elif len(description) > 2000:
            errors.append('Description cannot exceed 2000 characters')

        if not category_id:
            errors.append('Please select a category')

        # Price validation
        price_errors = PriceValidator.validate_all(data)
        errors.extend(price_errors)

        # Return result
        if errors:
            return JsonResponse({
                'valid': False,
                'errors': errors,
                'message': f'Form validation failed, found {len(errors)} issues'
            }, status=400)
        else:
            return JsonResponse({
                'valid': True,
                'message': 'Form validation passed',
                'errors': []
            })

    except json.JSONDecodeError:
        return JsonResponse({
            'valid': False,
            'errors': ['Invalid JSON data'],
            'message': 'Request data format error'
        }, status=400)

    except Exception as e:
        return JsonResponse({
            'valid': False,
            'errors': [f'Server error: {str(e)}'],
            'message': 'Error occurred during validation'
        }, status=500)
