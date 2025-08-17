"""
Rental Application Admin Configuration for ShareTools
"""
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import RentalOrder, RentalSettings


@admin.register(RentalOrder)
class RentalOrderAdmin(admin.ModelAdmin):
    """Rental Order Management"""
    list_display = [
        'id_short', 'item_title', 'renter_name', 'owner_name', 
        'start_date', 'end_date', 'duration_days', 'total_amount',
        'status', 'payment_method', 'created_at'
    ]
    list_filter = [
        'status', 'payment_method', 'start_date', 'end_date',
        'created_at'
    ]
    search_fields = [
        'id', 'item__title', 'renter__username', 'owner__username'
    ]
    readonly_fields = [
        'id', 'created_at', 'updated_at', 'payment_date', 'completed_at'
    ]
    date_hierarchy = 'created_at'
    ordering = ['-created_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'item', 'renter', 'owner')
        }),
        ('Rental Information', {
            'fields': ('start_date', 'end_date', 'duration_days')
        }),
        ('Price Information', {
            'fields': ('daily_rate', 'total_amount', 'security_deposit', 'service_fee')
        }),
        ('Payment Information', {
            'fields': ('payment_method', 'payment_date', 'transaction_id')
        }),
        ('Status Information', {
            'fields': ('status',)
        }),
        ('Notes', {
            'fields': ('renter_notes', 'owner_notes', 'admin_notes'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'completed_at'),
            'classes': ('collapse',)
        }),
    )
    
    def id_short(self, obj):
        """Display short ID"""
        return str(obj.id)[:8]
    id_short.short_description = 'Order ID'
    
    def item_title(self, obj):
        """Display item title"""
        return obj.item.title if obj.item else '-'
    item_title.short_description = 'Item Title'
    
    def renter_name(self, obj):
        """Display renter name"""
        return obj.renter.username if obj.renter else '-'
    renter_name.short_description = 'Renter'
    
    def owner_name(self, obj):
        """Display owner name"""
        return obj.owner.username if obj.owner else '-'
    owner_name.short_description = 'Owner'
    
    def category(self, obj):
        """Display item category"""
        return obj.item.category.name if obj.item and obj.item.category else '-'
    category.short_description = 'Category'
    
    actions = ['mark_as_completed']
    
    def mark_as_completed(self, request, queryset):
        """Mark as completed"""
        updated = queryset.update(status='completed')
        self.message_user(request, f'Successfully marked {updated} orders as completed')
    mark_as_completed.short_description = 'Mark as Completed'


@admin.register(RentalSettings)
class RentalSettingsAdmin(admin.ModelAdmin):
    """Rental Settings Management"""
    list_display = [
        'setting_key', 'setting_value', 'setting_type', 'updated_at'
    ]
    list_filter = [
        'setting_type', 'updated_at'
    ]
    search_fields = [
        'setting_key', 'description'
    ]
    readonly_fields = [
        'id', 'created_at', 'updated_at'
    ]
    ordering = ['setting_key']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'setting_key', 'setting_value', 'setting_type')
        }),
        ('Description', {
            'fields': ('description',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def has_add_permission(self, request):
        """Allow adding new settings"""
        return True
    
    def has_delete_permission(self, request, obj=None):
        """Allow deleting settings"""
        return True


# 自定义管理站点标题
admin.site.site_header = "ShareTools 租赁管理系统"
admin.site.site_title = "ShareTools 租赁管理"
admin.site.index_title = "租赁管理控制台"
