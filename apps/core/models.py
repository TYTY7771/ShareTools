"""
ShareTools Core Application Data Models
"""
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from decimal import Decimal
import uuid


class User(AbstractUser):
    """Extended User Model"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, verbose_name="Email Address")
    phone = models.CharField(max_length=20, blank=True, null=True, verbose_name="Phone Number")
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True, verbose_name="Avatar")
    bio = models.TextField(max_length=500, blank=True, verbose_name="Bio")
    address = models.CharField(max_length=255, blank=True, verbose_name="Address")
    is_verified = models.BooleanField(default=False, verbose_name="Is Verified")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created At")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Updated At")

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"
        db_table = 'sharetools_user'

    def __str__(self):
        return self.username


class Location(models.Model):
    """Geographic Location Model"""
    name = models.CharField(max_length=100, unique=True, verbose_name="Location Name")
    slug = models.SlugField(max_length=100, unique=True, verbose_name="URL Slug")
    description = models.TextField(blank=True, verbose_name="Description")
    is_active = models.BooleanField(default=True, verbose_name="Is Active")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created At")

    class Meta:
        verbose_name = "Location"
        verbose_name_plural = "Locations"
        ordering = ['name']

    def __str__(self):
        return self.name


class Category(models.Model):
    """Item Category Model"""
    CATEGORY_CHOICES = [
        ('tools', 'Tools'),
        ('electronics', 'Electronics'),
        ('garden', 'Garden Equipment'),
        ('sports', 'Sports Equipment'),
        ('automotive', 'Automotive'),
        ('home', 'Home & DIY'),
    ]
    
    name = models.CharField(max_length=50, choices=CATEGORY_CHOICES, unique=True, verbose_name="Category Name")
    display_name = models.CharField(max_length=100, verbose_name="Display Name")
    description = models.TextField(blank=True, verbose_name="Description")
    icon = models.CharField(max_length=50, blank=True, verbose_name="Icon")
    is_active = models.BooleanField(default=True, verbose_name="Is Active")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created At")

    class Meta:
        verbose_name = "Category"
        verbose_name_plural = "Categories"
        ordering = ['display_name']

    def __str__(self):
        return self.display_name


class Item(models.Model):
    """Item Model"""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('active', 'Available'),
        ('rented', 'Rented'),
        ('maintenance', 'Under Maintenance'),
        ('inactive', 'Inactive'),
    ]

    CONDITION_CHOICES = [
        ('new', 'New'),
        ('excellent', 'Excellent'),
        ('good', 'Good'),
        ('fair', 'Fair'),
        ('poor', 'Poor'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200, verbose_name="Title")
    description = models.TextField(verbose_name="Description")
    category = models.ForeignKey(Category, on_delete=models.CASCADE, verbose_name="Category")
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_items', verbose_name="Owner")
    location = models.ForeignKey(Location, on_delete=models.CASCADE, verbose_name="Location")
    
    # Item status and condition
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft', verbose_name="Status")
    condition = models.CharField(max_length=20, choices=CONDITION_CHOICES, default='good', verbose_name="Condition")
    
    # Value and pricing
    item_value = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))], verbose_name="Item Value")
    
    # Location information
    address = models.CharField(max_length=255, blank=True, verbose_name="Address")
    location_tag = models.CharField(max_length=100, blank=True, verbose_name="Location Tag")
    area_tag = models.CharField(max_length=100, blank=True, verbose_name="Area Tag")
    latitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True, verbose_name="Latitude")
    longitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True, verbose_name="Longitude")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created At")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Updated At")
    published_at = models.DateTimeField(blank=True, null=True, verbose_name="Published At")

    # Statistics
    view_count = models.PositiveIntegerField(default=0, verbose_name="View Count")
    booking_count = models.PositiveIntegerField(default=0, verbose_name="Booking Count")

    class Meta:
        verbose_name = "Item"
        verbose_name_plural = "Items"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'category']),
            models.Index(fields=['location', 'status']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return self.title

    def publish(self):
        """Publish the item"""
        self.status = 'active'
        self.published_at = timezone.now()
        self.save()

    def is_available(self):
        """Check if the item is available for rent"""
        return self.status == 'active'

    def get_min_daily_price(self):
        """Get the minimum daily price"""
        prices = self.prices.filter(is_active=True)
        if prices.exists():
            return min(price.daily_price for price in prices)
        return None
    
    @property
    def min_daily_price(self):
        """Property to get minimum daily price"""
        return self.get_min_daily_price()
    
    @property
    def primary_image(self):
        """Get the primary image for this item"""
        # First try to get the primary image
        primary = self.images.filter(is_primary=True).first()
        if primary:
            return primary
        # If no primary image, return the first image
        return self.images.first()


class ItemImage(models.Model):
    """Item Image Model"""
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='images', verbose_name="Item")
    image = models.ImageField(upload_to='items/%Y/%m/', verbose_name="Image")
    alt_text = models.CharField(max_length=200, blank=True, verbose_name="Alt Text")
    order = models.PositiveSmallIntegerField(default=0, verbose_name="Order")
    is_primary = models.BooleanField(default=False, verbose_name="Is Primary")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created At")

    class Meta:
        verbose_name = "Item Image"
        verbose_name_plural = "Item Images"
        ordering = ['order', '-is_primary']
        unique_together = ['item', 'order']

    def __str__(self):
        return f"{self.item.title} - Image {self.order}"

    def save(self, *args, **kwargs):
        # If set as primary, unset other primary images
        if self.is_primary:
            ItemImage.objects.filter(item=self.item, is_primary=True).update(is_primary=False)
        super().save(*args, **kwargs)


class ItemPrice(models.Model):
    """Item Price Model"""
    DURATION_CHOICES = [
        (1, '1 Day'),
        (3, '3 Days'),
        (7, '7 Days'),
        (30, '30 Days'),
    ]

    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='prices', verbose_name="Item")
    duration_days = models.PositiveSmallIntegerField(choices=DURATION_CHOICES, verbose_name="Duration (Days)")
    price = models.DecimalField(max_digits=8, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))], verbose_name="Price")
    is_active = models.BooleanField(default=True, verbose_name="Is Active")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created At")

    class Meta:
        verbose_name = "Item Price"
        verbose_name_plural = "Item Prices"
        unique_together = ['item', 'duration_days']
        ordering = ['duration_days']

    def __str__(self):
        return f"{self.item.title} - {self.duration_days} days - £{self.price}"

    @property
    def daily_price(self):
        """Calculate daily average price"""
        return self.price / self.duration_days


class Booking(models.Model):
    """Booking Model"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('disputed', 'Disputed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='bookings', verbose_name="Item")
    renter = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookings', verbose_name="Renter")
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='rental_orders', verbose_name="Owner")
    
    # Rental period information
    start_date = models.DateField(verbose_name="Start Date")
    end_date = models.DateField(verbose_name="End Date")
    duration_days = models.PositiveSmallIntegerField(verbose_name="Duration (Days)")
    
    # Price information
    daily_price = models.DecimalField(max_digits=8, decimal_places=2, verbose_name="Daily Price")
    total_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Total Price")
    security_deposit = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'), verbose_name="Security Deposit")
    
    # Status and timestamps
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name="Status")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created At")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Updated At")
    confirmed_at = models.DateTimeField(blank=True, null=True, verbose_name="Confirmed At")
    
    # Notes
    renter_notes = models.TextField(blank=True, verbose_name="Renter Notes")
    owner_notes = models.TextField(blank=True, verbose_name="Owner Notes")

    class Meta:
        verbose_name = "Booking"
        verbose_name_plural = "Bookings"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'start_date']),
            models.Index(fields=['renter', 'status']),
            models.Index(fields=['owner', 'status']),
        ]

    def __str__(self):
        return f"{self.renter.username} renting {self.item.title}"

    def calculate_total_price(self):
        """Calculate total price"""
        self.total_price = self.daily_price * self.duration_days
        return self.total_price

    def can_be_cancelled(self):
        """Check if booking can be cancelled"""
        return self.status in ['pending', 'confirmed']

    def is_active(self):
        """Check if booking is currently active"""
        today = timezone.now().date()
        return (self.status == 'active' and 
                self.start_date <= today <= self.end_date)


class Review(models.Model):
    """Review Model"""
    RATING_CHOICES = [
        (1, '1 Star'),
        (2, '2 Stars'),
        (3, '3 Stars'),
        (4, '4 Stars'),
        (5, '5 Stars'),
    ]

    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='review', verbose_name="Booking")
    reviewer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='given_reviews', verbose_name="Reviewer")
    reviewee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_reviews', verbose_name="Reviewee")
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='reviews', verbose_name="Item")
    
    # Review content
    rating = models.PositiveSmallIntegerField(choices=RATING_CHOICES, verbose_name="Rating")
    title = models.CharField(max_length=200, blank=True, verbose_name="Title")
    content = models.TextField(verbose_name="Content")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created At")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Updated At")

    class Meta:
        verbose_name = "Review"
        verbose_name_plural = "Reviews"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.reviewer.username} reviewed {self.item.title} - {self.rating} stars"


class Cart(models.Model):
    """Shopping Cart Model"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='cart', verbose_name="User")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created At")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Updated At")

    class Meta:
        verbose_name = "Cart"
        verbose_name_plural = "Carts"

    def __str__(self):
        return f"{self.user.username}'s Cart"

    def get_total_price(self):
        """Get total price of cart"""
        return sum(item.get_total_price() for item in self.items.all())

    def get_items_count(self):
        """Get number of items in cart"""
        return self.items.count()


class CartItem(models.Model):
    """Cart Item Model"""
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items', verbose_name="Cart")
    item = models.ForeignKey(Item, on_delete=models.CASCADE, verbose_name="Item")
    start_date = models.DateField(verbose_name="Start Date")
    end_date = models.DateField(verbose_name="End Date")
    duration_days = models.PositiveSmallIntegerField(verbose_name="Duration (Days)")
    daily_price = models.DecimalField(max_digits=8, decimal_places=2, verbose_name="Daily Price")
    added_at = models.DateTimeField(auto_now_add=True, verbose_name="Added At")

    class Meta:
        verbose_name = "Cart Item"
        verbose_name_plural = "Cart Items"
        unique_together = ['cart', 'item']

    def __str__(self):
        return f"{self.cart.user.username} - {self.item.title}"

    def get_total_price(self):
        """Get total price for this item"""
        return self.daily_price * self.duration_days

    def save(self, *args, **kwargs):
        # Automatically calculate duration in days
        if self.start_date and self.end_date:
            self.duration_days = (self.end_date - self.start_date).days + 1
        super().save(*args, **kwargs)