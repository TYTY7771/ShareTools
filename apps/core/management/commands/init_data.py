"""
Management command to initialize ShareTools base data
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from apps.core.models import Category, Location


class Command(BaseCommand):
    help = 'Initialize ShareTools base data (categories and locations)'

    def handle(self, *args, **options):
        self.stdout.write('🚀 Starting ShareTools base data initialization...')
        
        with transaction.atomic():
            # Create category data
            self.create_categories()
            
            # Create location data
            self.create_locations()
            
        self.stdout.write(
            self.style.SUCCESS('✅ Base data initialization completed!')
        )

    def create_categories(self):
        """Create item categories"""
        categories_data = [
            {
                'name': 'tools',
                'display_name': 'Tools',
                'description': 'Various hand tools, power tools, etc.',
                'icon': '🔧'
            },
            {
                'name': 'electronics',
                'display_name': 'Electronics',
                'description': 'Electronic devices, digital products, etc.',
                'icon': '📱'
            },
            {
                'name': 'garden',
                'display_name': 'Garden Equipment',
                'description': 'Gardening tools, lawn care equipment, etc.',
                'icon': '🌱'
            },
            {
                'name': 'sports',
                'display_name': 'Sports Equipment',
                'description': 'Sports gear, fitness equipment, etc.',
                'icon': '⚽'
            },
            {
                'name': 'automotive',
                'display_name': 'Automotive',
                'description': 'Car repair tools, cleaning supplies, etc.',
                'icon': '🚗'
            },
            {
                'name': 'home',
                'display_name': 'Home & DIY',
                'description': 'Home improvement, DIY tools, etc.',
                'icon': '🏠'
            },
        ]

        for cat_data in categories_data:
            category, created = Category.objects.get_or_create(
                name=cat_data['name'],
                defaults={
                    'display_name': cat_data['display_name'],
                    'description': cat_data['description'],
                    'icon': cat_data['icon'],
                }
            )
            if created:
                self.stdout.write(f'  ✓ Created category: {category.display_name}')
            else:
                self.stdout.write(f'  - Category already exists: {category.display_name}')

    def create_locations(self):
        """Create geographic locations"""
        locations_data = [
            # North Glasgow
            {
                'name': 'Maryhill',
                'slug': 'maryhill',
                'description': 'North Glasgow - Maryhill area'
            },
            {
                'name': 'Hillhead',
                'slug': 'hillhead',
                'description': 'North Glasgow - Hillhead area'
            },
            {
                'name': 'Partick',
                'slug': 'partick',
                'description': 'North Glasgow - Partick area'
            },
            {
                'name': 'Springburn',
                'slug': 'springburn',
                'description': 'North Glasgow - Springburn area'
            },
            
            # South Glasgow
            {
                'name': 'Gorbals',
                'slug': 'gorbals',
                'description': 'South Glasgow - Gorbals area'
            },
            {
                'name': 'Pollokshields',
                'slug': 'pollokshields',
                'description': 'South Glasgow - Pollokshields area'
            },
            {
                'name': 'Shawlands',
                'slug': 'shawlands',
                'description': 'South Glasgow - Shawlands area'
            },
            {
                'name': 'Giffnock',
                'slug': 'giffnock',
                'description': 'South Glasgow - Giffnock area'
            },
            
            # East Glasgow
            {
                'name': 'Dennistoun',
                'slug': 'dennistoun',
                'description': 'East Glasgow - Dennistoun area'
            },
            {
                'name': 'Bridgeton',
                'slug': 'bridgeton',
                'description': 'East Glasgow - Bridgeton area'
            },
            {
                'name': 'Calton',
                'slug': 'calton',
                'description': 'East Glasgow - Calton area'
            },
            {
                'name': 'Parkhead',
                'slug': 'parkhead',
                'description': 'East Glasgow - Parkhead area'
            },
            
            # West Glasgow
            {
                'name': 'Finnieston',
                'slug': 'finnieston',
                'description': 'West Glasgow - Finnieston area'
            },
            {
                'name': 'Kelvingrove',
                'slug': 'kelvingrove',
                'description': 'West Glasgow - Kelvingrove area'
            },
            {
                'name': 'Byres Road',
                'slug': 'byres-road',
                'description': 'West Glasgow - Byres Road area'
            },
        ]

        for loc_data in locations_data:
            location, created = Location.objects.get_or_create(
                slug=loc_data['slug'],
                defaults={
                    'name': loc_data['name'],
                    'description': loc_data['description'],
                }
            )
            if created:
                self.stdout.write(f'  ✓ Created location: {location.name}')
            else:
                self.stdout.write(f'  - Location already exists: {location.name}') 