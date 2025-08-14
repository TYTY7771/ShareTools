"""
Django Admin Configuration for ShareTools
"""
from django.contrib import admin
from django.utils.html import format_html
from .models import (
    User, Category, Location, Item, ItemImage, ItemPrice, 
    Booking, Review, Cart, CartItem
)


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['username', 'email', 'is_verified', 'created_at']
    list_filter = ['is_verified', 'is_staff', 'created_at']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('username', 'email', 'first_name', 'last_name')
        }),
        ('Contact Information', {
            'fields': ('phone', 'address', 'bio')
        }),
        ('Profile', {
            'fields': ('avatar', 'is_verified')
        }),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
            'classes': ('collapse',)
        }),
        ('Important dates', {
            'fields': ('last_login', 'date_joined', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['display_name', 'name', 'icon', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'display_name', 'description']
    readonly_fields = ['created_at']
    
    fieldsets = (
        ('Category Information', {
            'fields': ('name', 'display_name', 'description', 'icon')
        }),
        ('Settings', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'slug', 'description']
    readonly_fields = ['created_at']
    prepopulated_fields = {'slug': ('name',)}
    
    fieldsets = (
        ('Location Information', {
            'fields': ('name', 'slug', 'description')
        }),
        ('Settings', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )


class ItemImageInline(admin.TabularInline):
    model = ItemImage
    extra = 1
    fields = ['image', 'alt_text', 'order', 'is_primary']
    readonly_fields = ['created_at']


class ItemPriceInline(admin.TabularInline):
    model = ItemPrice
    extra = 1
    fields = ['duration_days', 'price', 'is_active']
    readonly_fields = ['created_at']


@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'owner', 'status', 'condition', 'location', 'created_at']
    list_filter = ['status', 'condition', 'category', 'location', 'created_at']
    search_fields = ['title', 'description', 'owner__username', 'owner__email']
    readonly_fields = ['id', 'view_count', 'booking_count', 'created_at', 'updated_at', 'published_at']
    inlines = [ItemImageInline, ItemPriceInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description', 'category', 'owner', 'location')
        }),
        ('Status & Condition', {
            'fields': ('status', 'condition', 'item_value')
        }),
        ('Location Details', {
            'fields': ('address', 'latitude', 'longitude'),
            'classes': ('collapse',)
        }),
        ('Statistics', {
            'fields': ('view_count', 'booking_count'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'published_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['publish_items', 'unpublish_items']
    
    def publish_items(self, request, queryset):
        updated = queryset.update(status='active')
        self.message_user(request, f'{updated} items were successfully published.')
    publish_items.short_description = "Publish selected items"
    
    def unpublish_items(self, request, queryset):
        updated = queryset.update(status='draft')
        self.message_user(request, f'{updated} items were successfully unpublished.')
    unpublish_items.short_description = "Unpublish selected items"


@admin.register(ItemImage)
class ItemImageAdmin(admin.ModelAdmin):
    list_display = ['item', 'alt_text', 'order', 'is_primary', 'created_at']
    list_filter = ['is_primary', 'created_at']
    search_fields = ['item__title', 'alt_text']
    readonly_fields = ['created_at']


@admin.register(ItemPrice)
class ItemPriceAdmin(admin.ModelAdmin):
    list_display = ['item', 'duration_days', 'price', 'daily_price', 'is_active']
    list_filter = ['duration_days', 'is_active', 'created_at']
    search_fields = ['item__title']
    readonly_fields = ['created_at']
    
    def daily_price(self, obj):
        return f"£{obj.daily_price:.2f}"
    daily_price.short_description = "Daily Price"


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ['item', 'renter', 'owner', 'status', 'start_date', 'end_date', 'total_price', 'created_at']
    list_filter = ['status', 'start_date', 'end_date', 'created_at']
    search_fields = ['item__title', 'renter__username', 'owner__username']
    readonly_fields = ['id', 'duration_days', 'created_at', 'updated_at', 'confirmed_at']
    
    fieldsets = (
        ('Booking Details', {
            'fields': ('item', 'renter', 'owner', 'status')
        }),
        ('Rental Period', {
            'fields': ('start_date', 'end_date', 'duration_days')
        }),
        ('Pricing', {
            'fields': ('daily_price', 'total_price', 'security_deposit')
        }),
        ('Notes', {
            'fields': ('renter_notes', 'owner_notes'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'confirmed_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['confirm_bookings', 'cancel_bookings']
    
    def confirm_bookings(self, request, queryset):
        updated = queryset.filter(status='pending').update(status='confirmed')
        self.message_user(request, f'{updated} bookings were confirmed.')
    confirm_bookings.short_description = "Confirm selected bookings"
    
    def cancel_bookings(self, request, queryset):
        updated = queryset.exclude(status__in=['completed', 'active']).update(status='cancelled')
        self.message_user(request, f'{updated} bookings were cancelled.')
    cancel_bookings.short_description = "Cancel selected bookings"


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['item', 'reviewer', 'reviewee', 'rating', 'title', 'created_at']
    list_filter = ['rating', 'created_at']
    search_fields = ['item__title', 'reviewer__username', 'reviewee__username', 'title', 'content']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Review Details', {
            'fields': ('booking', 'reviewer', 'reviewee', 'item')
        }),
        ('Review Content', {
            'fields': ('rating', 'title', 'content')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ['user', 'get_items_count', 'get_total_price', 'created_at', 'updated_at']
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['created_at', 'updated_at']

    def get_items_count(self, obj):
        return obj.get_items_count()
    get_items_count.short_description = 'Items Count'
    
    def get_total_price(self, obj):
        return f"£{obj.get_total_price():.2f}"
    get_total_price.short_description = 'Total Price'


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ['cart_user', 'item', 'start_date', 'end_date', 'duration_days', 'get_total_price', 'added_at']
    list_filter = ['start_date', 'end_date', 'added_at']
    search_fields = ['cart__user__username', 'item__title']
    readonly_fields = ['duration_days', 'added_at']
    
    def cart_user(self, obj):
        return obj.cart.user.username
    cart_user.short_description = 'User'
    
    def get_total_price(self, obj):
        return f"£{obj.get_total_price():.2f}"
    get_total_price.short_description = 'Total Price'


# Customize admin site header and titles
admin.site.site_header = "ShareTools Administration"
admin.site.site_title = "ShareTools Admin"
admin.site.index_title = "Welcome to ShareTools Administration Panel" 