"""
Rental Application Serializers for ShareTools
"""
from rest_framework import serializers
from .models import RentalOrder, RentalSettings
from apps.core.models import Item, User


class RentalOrderSerializer(serializers.ModelSerializer):
    """Rental Order Serializer"""
    item_title = serializers.CharField(source='item.title', read_only=True)
    item_image = serializers.SerializerMethodField()
    renter_name = serializers.CharField(source='renter.username', read_only=True)
    owner_name = serializers.CharField(source='owner.username', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    total_with_deposit = serializers.SerializerMethodField()

    class Meta:
        model = RentalOrder
        fields = [
            'id', 'item', 'item_title', 'item_image', 'renter', 'renter_name',
            'owner', 'owner_name', 'start_date', 'end_date', 'duration_days',
            'daily_rate', 'total_amount', 'security_deposit', 'service_fee',
            'status', 'status_display', 'payment_method', 'payment_method_display',
            'total_with_deposit', 'renter_notes', 'owner_notes',
            'created_at', 'updated_at', 'payment_date', 'completed_at'
        ]
        read_only_fields = [
            'id', 'item_title', 'item_image', 'renter_name', 'owner_name',
            'status_display', 'payment_method_display', 'total_with_deposit',
            'created_at', 'updated_at', 'payment_date', 'completed_at'
        ]

    def get_item_image(self, obj):
        """Get item primary image"""
        if obj.item.primary_image:
            return obj.item.primary_image.image.url
        elif obj.item.images.exists():
            return obj.item.images.first().image.url
        return None

    def get_total_with_deposit(self, obj):
        """Get total amount including deposit"""
        return obj.get_total_with_deposit()

    def validate(self, data):
        """Validate data"""
        # Check dates
        if data.get('start_date') and data.get('end_date'):
            if data['start_date'] >= data['end_date']:
                raise serializers.ValidationError("Start date must be earlier than end date")

            # Check if date is in the past
            from django.utils import timezone
            today = timezone.now().date()
            if data['start_date'] < today:
                raise serializers.ValidationError("Start date cannot be in the past")

        # Check if item is available
        if data.get('item'):
            if not data['item'].is_available():
                raise serializers.ValidationError("This item is currently unavailable")

        return data


class RentalOrderCreateSerializer(serializers.ModelSerializer):
    """Create Rental Order Serializer"""

    class Meta:
        model = RentalOrder
        fields = [
            'item', 'start_date', 'end_date', 'daily_rate',
            'security_deposit', 'renter_notes', 'payment_method'
        ]

    def validate(self, data):
        """Validate data"""
        # Check if item is available
        item = data.get('item')
        if item and not item.is_available():
            raise serializers.ValidationError("This item is currently unavailable")

        # Check dates
        start_date = data.get('start_date')
        end_date = data.get('end_date')

        if start_date and end_date:
            if start_date >= end_date:
                raise serializers.ValidationError("Start date must be earlier than end date")

            # Check if date is in the past
            from django.utils import timezone
            today = timezone.now().date()
            if start_date < today:
                raise serializers.ValidationError("Start date cannot be in the past")

            # Check for conflicting rentals
            if item:
                conflicting_rentals = RentalOrder.objects.filter(
                    item=item,
                    status__in=['active'],
                    start_date__lt=end_date,
                    end_date__gt=start_date
                )
                if conflicting_rentals.exists():
                    raise serializers.ValidationError("Selected dates conflict with existing rentals")

        return data


class RentalSettingsSerializer(serializers.ModelSerializer):
    """Rental Settings Serializer"""

    class Meta:
        model = RentalSettings
        fields = [
            'id', 'setting_key', 'setting_value', 'setting_type',
            'description', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class RentalSummarySerializer(serializers.Serializer):
    """Rental Summary Serializer"""
    total_orders = serializers.IntegerField()
    active_orders = serializers.IntegerField()
    completed_orders = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=10, decimal_places=2)
    recent_orders = RentalOrderSerializer(many=True)


class ItemAvailabilitySerializer(serializers.Serializer):
    """Item Availability Serializer"""
    item_id = serializers.UUIDField()
    is_available = serializers.BooleanField()
    next_available_date = serializers.DateField(allow_null=True)
    conflicting_rentals = serializers.ListField(child=serializers.DateField(), allow_empty=True)
