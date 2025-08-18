"""
ShareTools Price Validator
Provides unified price validation logic
"""

from decimal import Decimal
from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _


class PriceValidator:
    """Price Validator"""
    
    # Price range configuration
    PRICE_LIMITS = {
        1: {'min': Decimal('0.50'), 'max': Decimal('1000.00')},    # 1天
        3: {'min': Decimal('1.00'), 'max': Decimal('3000.00')},    # 3天
        7: {'min': Decimal('2.00'), 'max': Decimal('7000.00')},    # 7天
        30: {'min': Decimal('5.00'), 'max': Decimal('20000.00')},  # 30天
    }
    
    # Item value range
    ITEM_VALUE_LIMITS = {
        'min': Decimal('1.00'),
        'max': Decimal('50000.00')
    }
    
    # Maximum daily rental ratio (cannot exceed 20% of item value)
    MAX_DAILY_RATIO = 0.20
    
    @classmethod
    def validate_item_value(cls, value):
        """Validate item value"""
        errors = []
        
        if not value:
            errors.append('Please enter the item value')
            return errors
            
        try:
            value = Decimal(str(value))
        except (ValueError, TypeError):
            errors.append('Item value must be a valid number')
            return errors
        
        if value < cls.ITEM_VALUE_LIMITS['min']:
            errors.append(f'Item value cannot be less than £{cls.ITEM_VALUE_LIMITS["min"]}')
        elif value > cls.ITEM_VALUE_LIMITS['max']:
            errors.append(f'Item value cannot exceed £{cls.ITEM_VALUE_LIMITS["max"]:,}')
            
        return errors
    
    @classmethod
    def validate_single_price(cls, duration_days, price):
        """Validate single price"""
        errors = []
        
        if not price:
            if duration_days == 1:
                errors.append('1-day rental price is required')
            return errors
        
        try:
            price = Decimal(str(price))
        except (ValueError, TypeError):
            errors.append(f'{duration_days}-day price must be a valid number')
            return errors
        
        if price <= 0:
            errors.append(f'{duration_days}-day price must be greater than 0')
            return errors
        
        # Check price range
        if duration_days in cls.PRICE_LIMITS:
            limits = cls.PRICE_LIMITS[duration_days]
            if price < limits['min']:
                errors.append(f'{duration_days}-day price cannot be less than £{limits["min"]}')
            elif price > limits['max']:
                errors.append(f'{duration_days}-day price cannot exceed £{limits["max"]:,}')
        
        return errors
    
    @classmethod
    def validate_price_consistency(cls, prices):
        """Validate price consistency (long-term rentals should have discounts)"""
        errors = []
        
        # Get valid prices
        valid_prices = {}
        for duration, price in prices.items():
            if price:
                try:
                    valid_prices[duration] = Decimal(str(price))
                except (ValueError, TypeError):
                    continue
        
        if not valid_prices:
            return errors
        
        # Check if long-term rentals are cheaper than short-term rentals (average daily price)
        if 1 in valid_prices:
            daily_1 = valid_prices[1]
            
            if 3 in valid_prices:
                daily_3 = valid_prices[3] / 3
                if daily_3 > daily_1:
                    errors.append('3-day average daily price should be less than or equal to 1-day price')
            
            if 7 in valid_prices:
                daily_7 = valid_prices[7] / 7
                if daily_7 > daily_1:
                    errors.append('7-day average daily price should be less than or equal to 1-day price')
            
            if 30 in valid_prices:
                daily_30 = valid_prices[30] / 30
                if daily_30 > daily_1:
                    errors.append('30-day average daily price should be less than or equal to 1-day price')
        
        return errors
    
    @classmethod
    def validate_price_ratio(cls, daily_price, item_value):
        """Validate price ratio (rental should not be too high)"""
        errors = []
        
        if not daily_price or not item_value:
            return errors
        
        try:
            daily_price = Decimal(str(daily_price))
            item_value = Decimal(str(item_value))
        except (ValueError, TypeError):
            return errors
        
        if item_value <= 0:
            return errors
        
        ratio = float(daily_price / item_value)
        if ratio > cls.MAX_DAILY_RATIO:
            percentage = ratio * 100
            errors.append(f'Daily rental price is too high ({percentage:.1f}%), cannot exceed {cls.MAX_DAILY_RATIO*100:.0f}% of item value')
        
        return errors
    
    @classmethod
    def validate_all(cls, data):
        """Comprehensive validation of price data"""
        errors = []
        
        # Extract data
        item_value = data.get('item_value')
        prices = {
            1: data.get('price_1_day'),
            3: data.get('price_3_days'),
            7: data.get('price_7_days'),
            30: data.get('price_30_days'),
        }
        
        # Validate item value
        errors.extend(cls.validate_item_value(item_value))
        
        # Validate individual prices
        for duration, price in prices.items():
            errors.extend(cls.validate_single_price(duration, price))
        
        # Validate price consistency
        errors.extend(cls.validate_price_consistency(prices))
        
        # Validate price ratio
        if prices[1]:  # Only check ratio when 1-day price exists
            errors.extend(cls.validate_price_ratio(prices[1], item_value))
        
        return errors
    
    @classmethod
    def get_price_suggestions(cls, category=None):
        """Get price suggestions"""
        suggestions = {
            'tools': {1: '15.00', 3: '40.00', 7: '80.00', 30: '300.00'},
            'electronics': {1: '25.00', 3: '65.00', 7: '140.00', 30: '500.00'},
            'garden': {1: '20.00', 3: '50.00', 7: '100.00', 30: '380.00'},
            'sports': {1: '18.00', 3: '45.00', 7: '90.00', 30: '320.00'},
            'automotive': {1: '30.00', 3: '80.00', 7: '180.00', 30: '600.00'},
            'home': {1: '12.00', 3: '30.00', 7: '65.00', 30: '200.00'},
        }
        
        default = {1: '15.00', 3: '40.00', 7: '80.00', 30: '300.00'}
        return suggestions.get(category, default)


def validate_item_price(value):
    """Django model field validator"""
    if value <= 0:
        raise ValidationError(_('Price must be greater than 0'))
    
    if value > Decimal('50000.00'):
        raise ValidationError(_('Price cannot exceed £50,000'))


def validate_item_value(value):
    """Django model field validator"""
    validator = PriceValidator()
    errors = validator.validate_item_value(value)
    
    if errors:
        raise ValidationError(errors[0])