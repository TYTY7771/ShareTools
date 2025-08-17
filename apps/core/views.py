"""
ShareTools核心应用的视图函数
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
    """渲染主页"""
    return render(request, 'index.html')


def login_view(request):
    """渲染登录页面"""
    return render(request, 'login.html')


def register_view(request):
    """渲染注册页面"""
    return render(request, 'register.html')


def logout_view(request):
    """处理用户登出"""
    logout(request)
    messages.success(request, "您已成功登出")
    return redirect('home')


def list_item_view(request):
    """渲染物品发布页面"""
    return render(request, 'list_item.html')


def profile_view(request):
    """渲染个人主页"""
    return render(request, 'profile.html')


def edit_profile_view(request):
    """渲染编辑个人资料页面"""
    return render(request, 'edit_profile.html')


def browse_things_view(request):
    """渲染物品浏览页面"""
    from .models import Item

    # 获取所有active状态的商品，预加载相关数据以提高性能
    items = Item.objects.filter(status='active').select_related(
        'owner', 'category', 'location'
    ).prefetch_related(
        'images'  # 预加载图片关系，确保primary_image属性能正确工作
    ).order_by('-created_at')

    context = {
        'items': items,
    }

    return render(request, 'browse_things.html', context)


def locations_view(request):
    """位置页面"""
    from .models import Location
    
    # 获取所有活跃的位置
    locations = Location.objects.filter(is_active=True).order_by('name')
    
    context = {
        'locations': locations,
    }
    
    return render(request, 'locations.html', context)


def about_view(request):
    """关于页面"""
    return render(request, 'about.html')


def view_orders(request):
    """查看订单页面"""
    return render(request, 'view_orders.html')


def product_detail_view(request, product_id=None):
    """渲染商品详情页面"""
    from .models import Item
    from django.shortcuts import get_object_or_404
    import json
    from decimal import Decimal

    # 根据product_id从数据库获取商品信息
    if product_id:
        try:
            # 预加载相关数据以提高性能并避免查询错误
            item = Item.objects.select_related(
                'owner', 'category', 'location'
            ).prefetch_related(
                'images', 'prices'
            ).get(id=product_id)

            # 增加浏览次数（避免物品所有者浏览自己的物品时增加次数）
            if request.user.is_authenticated and request.user != item.owner:
                Item.objects.filter(pk=item.pk).update(view_count=item.view_count + 1)
                # 重新加载数据但保持预加载的关系
                item = Item.objects.select_related(
                    'owner', 'category', 'location'
                ).prefetch_related(
                    'images', 'prices'
                ).get(id=product_id)

            # 准备商品数据JSON，修正价格显示逻辑
            product_data = {
                'id': str(item.id),
                'title': item.title,
                'itemValue': float(item.item_value) if item.item_value else 500,
                'minDailyPrice': None,  # 将在下面计算
                'prices': []
            }

            # 添加价格信息，确保价格按租期排序
            active_prices = item.prices.filter(is_active=True).order_by('duration_days')
            if active_prices.exists():
                for price in active_prices:
                    product_data['prices'].append({
                        'duration': price.duration_days,
                        'totalPrice': float(price.price),
                        'dailyPrice': float(price.daily_price)
                    })
                
                # 计算最低日租金
                min_daily_price = min(price.daily_price for price in active_prices)
                product_data['minDailyPrice'] = float(min_daily_price)
            else:
                # 如果没有价格数据，使用默认价格
                product_data['prices'] = [
                    {'duration': 1, 'totalPrice': 20, 'dailyPrice': 20},
                    {'duration': 3, 'totalPrice': 54, 'dailyPrice': 18},
                    {'duration': 7, 'totalPrice': 105, 'dailyPrice': 15},
                    {'duration': 30, 'totalPrice': 360, 'dailyPrice': 12}
                ]
                product_data['minDailyPrice'] = 12.0  # 30天租期的日租金

            context = {
                'item': item,
                'product_id': product_id,
                'product_data_json': product_data,
            }
        except Item.DoesNotExist:
            # 如果商品不存在，返回404页面或重定向到商品列表
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
        # 如果没有提供product_id，显示演示页面
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
    """API测试页面"""
    return render(request, 'test_api.html')


def test_images_view(request):
    """图片测试页面"""
    from .models import Item

    # 获取测试Item
    item = None
    try:
        item = Item.objects.get(id='c4b06a35-426c-4b40-acf5-e8d7849eb6d8')
    except Item.DoesNotExist:
        # 如果指定的Item不存在，获取第一个有图片的Item
        item = Item.objects.filter(images__isnull=False).first()

    context = {
        'item': item,
    }

    return render(request, 'test_images.html', context)


def test_image_display_view(request):
    """渲染图片显示测试页面"""
    from .models import Item, ItemImage

    # 获取有图片的物品
    items = Item.objects.filter(status='active').prefetch_related('images').order_by('-created_at')[:10]

    # 获取一些测试图片
    test_images = ItemImage.objects.select_related('item').all()[:8]

    context = {
        'items': items,
        'test_images': test_images,
    }

    return render(request, 'test_image_display.html', context)


def test_image_upload_view(request):
    """渲染图片上传测试页面"""
    return render(request, 'test_image_upload.html')


def new_image_upload_view(request):
    """渲染新的图片上传页面"""
    return render(request, 'new_image_upload.html')


def upload_navigation_view(request):
    """渲染图片上传导航页面"""
    return render(request, 'upload_navigation.html')


# ==================== 认证相关API ==================== #

@csrf_exempt
@require_http_methods(["POST"])
def register_api(request):
    """用户注册API"""
    try:
        data = json.loads(request.body)
        username = data.get('username', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '')
        password_confirm = data.get('password_confirm', '')

        # 验证必填字段
        if not all([username, email, password, password_confirm]):
            return JsonResponse({
                'success': False,
                'message': '所有字段都是必填的'
            }, status=400)

        # 验证密码确认
        if password != password_confirm:
            return JsonResponse({
                'success': False,
                'message': '两次输入的密码不一致'
            }, status=400)

        # 验证用户名是否已存在
        if User.objects.filter(username=username).exists():
            return JsonResponse({
                'success': False,
                'message': '用户名已存在'
            }, status=400)

        # 验证邮箱是否已存在
        if User.objects.filter(email=email).exists():
            return JsonResponse({
                'success': False,
                'message': '邮箱已被注册'
            }, status=400)

        # 验证密码强度
        try:
            validate_password(password)
        except ValidationError as e:
            return JsonResponse({
                'success': False,
                'message': '密码不符合要求：' + ', '.join(e.messages)
            }, status=400)

        # 创建用户
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )

        # 自动登录
        login(request, user)

        return JsonResponse({
            'success': True,
            'message': '注册成功',
            'user': {
                'id': str(user.id),
                'username': user.username,
                'email': user.email
            }
        })

    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'message': '无效的JSON数据'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'注册失败：{str(e)}'
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def login_api(request):
    """用户登录API"""
    try:
        data = json.loads(request.body)
        username = data.get('username', '').strip()
        password = data.get('password', '')

        # 验证必填字段
        if not all([username, password]):
            return JsonResponse({
                'success': False,
                'message': '用户名和密码都是必填的'
            }, status=400)

        # 尝试用户名登录
        user = authenticate(request, username=username, password=password)

        # 如果用户名登录失败，尝试邮箱登录
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
                    'message': '登录成功',
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
                    'message': '账户已被禁用'
                }, status=403)
        else:
            return JsonResponse({
                'success': False,
                'message': '用户名/邮箱或密码错误'
            }, status=401)

    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'message': '无效的JSON数据'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'登录失败：{str(e)}'
        }, status=500)


@require_http_methods(["POST"])
def logout_api(request):
    """用户登出API"""
    try:
        if request.user.is_authenticated:
            logout(request)
            return JsonResponse({
                'success': True,
                'message': '登出成功'
            })
        else:
            return JsonResponse({
                'success': False,
                'message': '用户未登录'
            }, status=401)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'登出失败：{str(e)}'
        }, status=500)


@require_http_methods(["GET"])
def user_info_api(request):
    """获取当前用户信息API"""
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
                'message': '用户未登录'
            }, status=401)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'获取用户信息失败：{str(e)}'
        }, status=500)


@login_required
@csrf_exempt
@require_http_methods(["POST"])
def update_profile_api(request):
    """更新用户资料API"""
    try:
        data = json.loads(request.body)
        user = request.user

        # 可更新的字段
        updatable_fields = ['phone', 'bio', 'address']

        for field in updatable_fields:
            if field in data:
                setattr(user, field, data[field])

        user.save()

        return JsonResponse({
            'success': True,
            'message': '资料更新成功',
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
            'message': '无效的JSON数据'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'更新资料失败：{str(e)}'
        }, status=500)


@login_required
@csrf_exempt
@require_http_methods(["POST"])
def change_password_api(request):
    """修改密码API"""
    try:
        data = json.loads(request.body)
        current_password = data.get('current_password', '')
        new_password = data.get('new_password', '')
        new_password_confirm = data.get('new_password_confirm', '')

        # 验证必填字段
        if not all([current_password, new_password, new_password_confirm]):
            return JsonResponse({
                'success': False,
                'message': '所有字段都是必填的'
            }, status=400)

        # 验证新密码确认
        if new_password != new_password_confirm:
            return JsonResponse({
                'success': False,
                'message': '两次输入的新密码不一致'
            }, status=400)

        # 验证当前密码
        user = request.user
        if not user.check_password(current_password):
            return JsonResponse({
                'success': False,
                'message': '当前密码错误'
            }, status=400)

        # 验证新密码强度
        try:
            validate_password(new_password, user)
        except ValidationError as e:
            return JsonResponse({
                'success': False,
                'message': '新密码不符合要求：' + ', '.join(e.messages)
            }, status=400)

        # 更新密码
        user.set_password(new_password)
        user.save()

        # 重新登录
        login(request, user)

        return JsonResponse({
            'success': True,
            'message': '密码修改成功'
        })

    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'message': '无效的JSON数据'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'修改密码失败：{str(e)}'
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def validate_prices(request):
    """价格验证API端点"""
    try:
        # 解析请求数据
        data = json.loads(request.body)

        # 执行验证
        errors = PriceValidator.validate_all(data)

        # 返回结果
        if errors:
            return JsonResponse({
                'valid': False,
                'errors': errors,
                'message': f'发现 {len(errors)} 个问题'
            }, status=400)
        else:
            return JsonResponse({
                'valid': True,
                'message': '价格验证通过',
                'errors': []
            })

    except json.JSONDecodeError:
        return JsonResponse({
            'valid': False,
            'errors': ['无效的JSON数据'],
            'message': '请求数据格式错误'
        }, status=400)

    except Exception as e:
        return JsonResponse({
            'valid': False,
            'errors': [f'服务器错误: {str(e)}'],
            'message': '验证过程中发生错误'
        }, status=500)


@csrf_exempt
@require_http_methods(["GET"])
def get_price_suggestions(request):
    """获取价格建议API端点"""
    try:
        category = request.GET.get('category', None)
        suggestions = PriceValidator.get_price_suggestions(category)

        # 确保键是字符串类型
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
    """完整表单数据验证API端点"""
    try:
        data = json.loads(request.body)
        errors = []

        # 基本信息验证
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

        # 价格验证
        price_errors = PriceValidator.validate_all(data)
        errors.extend(price_errors)

        # 返回结果
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
            'errors': ['无效的JSON数据'],
            'message': '请求数据格式错误'
        }, status=400)

    except Exception as e:
        return JsonResponse({
            'valid': False,
            'errors': [f'服务器错误: {str(e)}'],
            'message': '验证过程中发生错误'
        }, status=500)
