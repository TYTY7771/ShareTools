"""
Rental Application Models for ShareTools
"""
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator
from django.utils import timezone
from decimal import Decimal
import uuid

User = get_user_model()


class RentalOrder(models.Model):
    """Rental Order Model"""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
    ]

    PAYMENT_METHOD_CHOICES = [
        ('credit_card', 'Credit Card'),
        ('debit_card', 'Debit Card'),
        ('paypal', 'PayPal'),
        ('bank_transfer', 'Bank Transfer'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Related Information
    item = models.ForeignKey('core.Item', on_delete=models.CASCADE, related_name='rental_orders',
                             verbose_name="Rental Item")
    renter = models.ForeignKey(User, on_delete=models.CASCADE, related_name='rental_orders_new', verbose_name="Renter")
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_rentals_new',
                              verbose_name="Item Owner")

    # Rental Information
    start_date = models.DateField(verbose_name="Start Date")
    end_date = models.DateField(verbose_name="End Date")
    duration_days = models.PositiveSmallIntegerField(verbose_name="Rental Days")

    # Price Information
    daily_rate = models.DecimalField(max_digits=8, decimal_places=2, verbose_name="Daily Rate")
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Total Amount")
    security_deposit = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'),
                                           verbose_name="Security Deposit")
    service_fee = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('0.00'),
                                      verbose_name="Service Fee")

    # Payment Information
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, blank=True, null=True,
                                      verbose_name="Payment Method")
    payment_date = models.DateTimeField(blank=True, null=True, verbose_name="Payment Date")
    transaction_id = models.CharField(max_length=255, blank=True, verbose_name="Transaction ID")

    # Status Information
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active', verbose_name="Order Status")

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created At")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Updated At")
    completed_at = models.DateTimeField(blank=True, null=True, verbose_name="Completed At")

    # Notes
    renter_notes = models.TextField(blank=True, verbose_name="Renter Notes")
    owner_notes = models.TextField(blank=True, verbose_name="Owner Notes")
    admin_notes = models.TextField(blank=True, verbose_name="Admin Notes")

    class Meta:
        verbose_name = "Rental Order"
        verbose_name_plural = "Rental Orders"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'start_date']),
            models.Index(fields=['renter', 'status']),
            models.Index(fields=['owner', 'status']),
            models.Index(fields=['payment_method']),
        ]

    def __str__(self):
        return f"{self.renter.username} rents {self.item.title} - {self.get_status_display()}"

    def calculate_total_amount(self):
        """Calculate total amount"""
        self.total_amount = self.daily_rate * self.duration_days + self.service_fee
        return self.total_amount

    def is_active(self):
        """Check if currently active"""
        today = timezone.now().date()
        return (self.status == 'active' and
                self.start_date <= today <= self.end_date)

    def get_total_with_deposit(self):
        """Get total amount including deposit"""
        return self.total_amount + self.security_deposit

    def mark_as_completed(self):
        """Mark rental as completed"""
        self.status = 'completed'
        self.completed_at = timezone.now()
        self.save()

    def can_be_cancelled(self):
        """Check if rental can be cancelled"""
        # Can only cancel active rentals before they start
        today = timezone.now().date()
        return (self.status == 'active' and
                self.start_date > today)

    def save(self, *args, **kwargs):
        # Auto-calculate rental days
        if self.start_date and self.end_date:
            self.duration_days = (self.end_date - self.start_date).days + 1

        # Auto-calculate total amount
        if self.daily_rate and self.duration_days:
            self.calculate_total_amount()

        super().save(*args, **kwargs)


class RentalSettings(models.Model):
    """Rental Settings Model"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Setting name and value
    setting_key = models.CharField(max_length=100, unique=True, verbose_name="Setting Key")
    setting_value = models.TextField(verbose_name="Setting Value")
    setting_type = models.CharField(max_length=20, default='string', verbose_name="Setting Type")

    # Description
    description = models.TextField(blank=True, verbose_name="Description")

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created At")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Updated At")

    class Meta:
        verbose_name = "Rental Setting"
        verbose_name_plural = "Rental Settings"
        ordering = ['setting_key']

    def __str__(self):
        return f"{self.setting_key}: {self.setting_value}"

    @classmethod
    def get_setting(cls, key, default=None):
        """Get setting value"""
        try:
            setting = cls.objects.get(setting_key=key)
            return setting.setting_value
        except cls.DoesNotExist:
            return default

    @classmethod
    def set_setting(cls, key, value, description=""):
        """Set setting value"""
        setting, created = cls.objects.get_or_create(
            setting_key=key,
            defaults={'setting_value': str(value), 'description': description}
        )
        if not created:
            setting.setting_value = str(value)
            setting.description = description
            setting.save()
        return setting
