"""Rental application URL configuration"""
from django.urls import path
from . import views

app_name = 'rental'

urlpatterns = [
    # 页面路由
    path('', views.rental_home, name='rental_home'),
    path('my-rentals/', views.my_rentals, name='my_rentals'),
    path('rental/<uuid:rental_id>/', views.rental_detail, name='rental_detail'),
    path('create/<uuid:item_id>/', views.create_rental, name='create_rental'),

    path('owner-rentals/', views.owner_rentals, name='owner_rentals'),

    # API 路由
    path('api/create/', views.create_rental_api, name='create_rental_api'),
    path('api/summary/', views.rental_summary_api, name='rental_summary_api'),
    path('api/availability/<uuid:item_id>/', views.item_availability_api, name='item_availability_api'),
]
