"""
Rental Application Views for ShareTools
"""
from datetime import datetime, timedelta
from decimal import Decimal
import uuid

from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.shortcuts import render, get_object_or_404, redirect
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.models import Item, User
from .models import RentalOrder
from .serializers import (
    RentalOrderSerializer, RentalOrderCreateSerializer,
    RentalSummarySerializer,
    ItemAvailabilitySerializer
)


def rental_home(request):
    """Rental Home Page"""
    return render(request, 'rental/rental_home.html')


@login_required
def my_rentals(request):
    """My Rental Orders"""
    # Get user's rental orders
    user_rentals = RentalOrder.objects.filter(
        renter=request.user
    ).select_related('item', 'owner').prefetch_related('item__images').order_by('-created_at')

    # Group by status
    active_rentals = user_rentals.filter(status='active')
    completed_rentals = user_rentals.filter(status='completed')

    context = {
        'active_rentals': active_rentals,
        'completed_rentals': completed_rentals,
        'total_rentals': user_rentals.count(),
    }

    return render(request, 'rental/my_rentals.html', context)


@login_required
def rental_detail(request, rental_id):
    """Rental Order Details"""
    rental = get_object_or_404(
        RentalOrder.objects.select_related('item', 'owner', 'renter'),
        id=rental_id
    )

    # Check permissions
    if rental.renter != request.user and rental.owner != request.user:
        messages.error(request, "You don't have permission to view this order")
        return redirect('my_rentals')

    context = {
        'rental': rental,
        'is_owner': rental.owner == request.user,
        'is_renter': rental.renter == request.user,
    }

    return render(request, 'rental/rental_detail.html', context)


@login_required
def create_rental(request, item_id):
    """Create Rental Order - Complete flow including payment and confirmation"""
    item = get_object_or_404(Item, id=item_id)

    # Check if item is available
    if not item.is_available():
        messages.error(request, "This item is currently unavailable")
        return redirect('product_detail', product_id=item_id)

    # Check if it's user's own item
    if item.owner == request.user:
        messages.error(request, "You cannot rent your own item")
        return redirect('product_detail', product_id=item_id)

    if request.method == 'POST':
        try:
            data = request.POST.copy()

            # Parse dates
            start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
            end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()
            payment_method = data.get('payment_method')

            if not payment_method:
                messages.error(request, "Please select a payment method")
                return redirect('rental:create_rental', item_id=item_id)

            # Calculate rental days
            duration_days = (end_date - start_date).days + 1

            # Get daily rate (choose best price based on duration)
            daily_rate = get_daily_rate_for_duration(item, duration_days)

            # Calculate total amount with two decimal places
            total_amount = daily_rate * duration_days
            service_fee = calculate_service_fee(total_amount)
            security_deposit = item.item_value or Decimal('0.00')
            total_with_deposit = total_amount + service_fee + security_deposit

            # Simulate payment processing
            if simulate_payment_processing(payment_method):
                # Payment successful, create the rental order
                with transaction.atomic():
                    rental = RentalOrder.objects.create(
                        item=item,
                        renter=request.user,
                        owner=item.owner,
                        start_date=start_date,
                        end_date=end_date,
                        duration_days=duration_days,
                        daily_rate=daily_rate,
                        total_amount=total_amount,
                        security_deposit=security_deposit,
                        service_fee=service_fee,
                        renter_notes=data.get('renter_notes', ''),
                        status='active',  # Order is active since payment is complete
                        payment_method=payment_method,
                        payment_date=timezone.now(),
                        transaction_id=f"TXN_{uuid.uuid4().hex[:8].upper()}"
                    )

                messages.success(request,
                                 f"Rental order created and payment completed successfully! Total amount: £{total_with_deposit:.2f}")
                return redirect('rental:rental_detail', rental_id=rental.id)
            else:
                # Payment failed
                messages.error(request, "Payment failed, please try again or choose another payment method")

        except Exception as e:
            messages.error(request, f"Failed to process rental order: {str(e)}")

    # Get item pricing information
    prices = item.prices.filter(is_active=True).order_by('duration_days')

    context = {
        'item': item,
        'prices': prices,
    }

    return render(request, 'rental/create_rental.html', context)


@login_required
def owner_rentals(request):
    """Owner's Rental Management"""
    # Get rental orders for items owned by the user
    owned_rentals = RentalOrder.objects.filter(
        owner=request.user
    ).select_related('item', 'renter').prefetch_related('item__images').order_by('-created_at')

    # Group by status
    active_rentals = owned_rentals.filter(status='active')
    completed_rentals = owned_rentals.filter(status='completed')

    context = {
        'active_rentals': active_rentals,
        'completed_rentals': completed_rentals,
        'total_rentals': owned_rentals.count(),
    }

    return render(request, 'rental/owner_rentals.html', context)


# API Views
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_rental_api(request):
    """Create Rental Order API"""
    try:
        serializer = RentalOrderCreateSerializer(data=request.data)
        if serializer.is_valid():
            # Get item
            item = serializer.validated_data['item']

            # Check if item is available
            if not item.is_available():
                return Response(
                    {'error': 'This item is currently unavailable'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Calculate rental information
            start_date = serializer.validated_data['start_date']
            end_date = serializer.validated_data['end_date']
            duration_days = (end_date - start_date).days + 1
            daily_rate = get_daily_rate_for_duration(item, duration_days)
            total_amount = daily_rate * duration_days

            # Create rental order
            with transaction.atomic():
                rental = RentalOrder.objects.create(
                    item=item,
                    renter=request.user,
                    owner=item.owner,
                    start_date=start_date,
                    end_date=end_date,
                    duration_days=duration_days,
                    daily_rate=daily_rate,
                    total_amount=total_amount,
                    security_deposit=serializer.validated_data.get('security_deposit',
                                                                   item.item_value or Decimal('0.00')),
                    service_fee=calculate_service_fee(total_amount),
                    renter_notes=serializer.validated_data.get('renter_notes', ''),
                    status='active',
                    payment_method=serializer.validated_data.get('payment_method', 'credit_card'),
                    payment_date=timezone.now(),
                    transaction_id=f"TXN_{uuid.uuid4().hex[:8].upper()}"
                )

            # Return created order
            rental_serializer = RentalOrderSerializer(rental)
            return Response(rental_serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def rental_summary_api(request):
    """Get Rental Summary API"""
    try:
        # Get user's rental statistics
        user_rentals = RentalOrder.objects.filter(renter=request.user)

        summary = {
            'total_orders': user_rentals.count(),
            'active_orders': user_rentals.filter(status='active').count(),
            'completed_orders': user_rentals.filter(status='completed').count(),
            'total_revenue': sum(rental.total_amount for rental in user_rentals.filter(status='completed')),
            'recent_orders': user_rentals.order_by('-created_at')[:5]
        }

        serializer = RentalSummarySerializer(summary)
        return Response(serializer.data, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def item_availability_api(request, item_id):
    """Get Item Availability API"""
    try:
        item = get_object_or_404(Item, id=item_id)

        # Check if item is available
        is_available = item.is_available()

        # Get conflicting rental dates
        conflicting_rentals = []
        if not is_available:
            active_rentals = RentalOrder.objects.filter(
                item=item,
                status='active'
            )
            for rental in active_rentals:
                current_date = rental.start_date
                while current_date <= rental.end_date:
                    conflicting_rentals.append(current_date)
                    current_date += timedelta(days=1)

        # Calculate next available date
        next_available_date = None
        if conflicting_rentals:
            # Simple logic: find the first date without conflicts
            today = timezone.now().date()
            for i in range(30):  # Check for the next 30 days
                check_date = today + timedelta(days=i)
                if check_date not in conflicting_rentals:
                    next_available_date = check_date
                    break

        availability_data = {
            'item_id': item_id,
            'is_available': is_available,
            'next_available_date': next_available_date,
            'conflicting_rentals': conflicting_rentals
        }

        serializer = ItemAvailabilitySerializer(availability_data)
        return Response(serializer.data, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Helper functions
def get_daily_rate_for_duration(item, duration_days):
    """Get daily rate based on duration"""
    # Find the most matching rental period price
    prices = item.prices.filter(is_active=True).order_by('duration_days')

    if prices.exists():
        # Find the closest rental period price
        best_price = None
        for price in prices:
            if price.duration_days >= duration_days:
                best_price = price
                break

        if best_price:
            return best_price.daily_price
        else:
            # If no suitable price found, use the price for the longest rental period
            return prices.last().daily_price

    # Default price
    return Decimal('20.00')


def calculate_service_fee(total_amount):
    """Calculate service fee"""
    # Simple service fee calculation: 5% of total amount, minimum £2
    service_fee = total_amount * Decimal('0.05')
    return max(service_fee, Decimal('2.00'))


def simulate_payment_processing(payment_method):
    """Simulate payment processing (in a real application, this would call a payment gateway)"""
    # Simulate 90% success rate
    import random
    return random.random() > 0.1
