# ShareTools - Tool Sharing Platform

## Project Overview
ShareTools is a comprehensive tool sharing platform built with Django backend and modern frontend technologies. The platform enables users to rent and share tools with each other, featuring a complete booking system, user management, and responsive web interface. The project adopts component-based design principles to provide a clean user interface and excellent user experience.

## Project Structure
```
ShareTools/
├── apps/                    # Django Applications
│   └── core/               # Core application
│       ├── models.py       # Data models (User, Item, Booking, etc.)
│       ├── views.py        # View functions
│       ├── viewsets.py     # DRF ViewSets for API
│       ├── serializers.py  # DRF Serializers
│       ├── validators.py   # Custom validators
│       ├── urls.py         # URL routing
│       ├── admin.py        # Django admin configuration
│       └── migrations/     # Database migrations
├── config/                  # Django Configuration
│   ├── settings.py         # Django settings
│   ├── urls.py             # Main URL configuration
│   ├── wsgi.py             # WSGI configuration
│   └── asgi.py             # ASGI configuration
├── templates/               # HTML Templates
│   ├── index.html          # Homepage
│   ├── login.html          # Login/Register page
│   ├── list_item.html      # Item listing page
│   ├── profile.html        # User profile page
│   ├── edit_profile.html   # Profile editing page
│   ├── browse_things.html  # Item browsing page
│   ├── about.html          # About page
│   └── upload_navigation.html # Upload navigation
├── static/                  # Static Assets
│   ├── css/                # Stylesheets
│   │   ├── main.css        # Main styles
│   │   ├── components.css  # Component styles
│   │   ├── login.css       # Login page styles
│   │   ├── list_item.css   # Item listing styles
│   │   └── browse_things.css # Browse page styles
│   ├── js/                 # JavaScript Files
│   │   ├── main.js         # Main JavaScript
│   │   ├── components.js   # Component logic
│   │   ├── login.js        # Login functionality
│   │   └── browse_things.js # Browse page logic
│   └── images/             # Image Assets
│       └── ShareTools Web Logo.png # Website logo
├── media/                   # User uploaded files
├── .venv/                   # Python virtual environment
├── requirements.txt         # Python dependencies
├── env.example             # Environment variables template
├── db.sqlite3              # SQLite database
├── manage.py               # Django management script
└── README.md               # Project documentation
```

## Core Features

### Backend Features (Django)
- **User Management**: Extended user model with profile information, avatar, and verification status
- **Item Management**: Complete CRUD operations for tool listings with categories, pricing, and images
- **Booking System**: Full rental booking workflow with status tracking and date management
- **Review System**: User rating and review system for completed bookings
- **Cart Functionality**: Shopping cart for multiple item bookings
- **Location Management**: Geographic location support for item availability
- **API Endpoints**: RESTful API using Django REST Framework
- **Admin Interface**: Comprehensive Django admin for content management

### Frontend Pages

#### Homepage (index.html)
- **Navigation Bar**: Logo, navigation menu, cart, and user action buttons (Profile, List an Item)
- **Tool Browse Section**: Interface for browsing available tools
- **Tool Cards Display**: Showcase of recently active tool listings
- **Feature Highlights**: Platform core advantages and features

#### Login Page (login.html)
- **Login Form**: Username/password authentication
- **Registration Form**: New user registration functionality
- **Form Validation**: Real-time input validation and error handling
- **Responsive Design**: Optimized for all device screen sizes
- **Authentication Management**: Session and local storage login state management

#### Item Listing Page (list_item.html)
- **6-Step Publishing Process**:
  1. Category Selection - Dropdown with protection information
  2. Item Description - Title and detailed description input
  3. Image Upload - 8 image slots supporting 4:3 landscape format
  4. Price Setting - 1/3/7 day pricing with price suggestion system
  5. Location Addition - Geographic location selection with map integration
  6. Item Value - Item valuation input
- **Sidebar Design**: ShareTools branding and community promotion
- **Responsive Layout**: 2-column desktop layout, single-column mobile layout

#### Profile Page (profile.html)
- **Login Protection**: Automatic login state detection, unauthorized access prevention
- **Profile Management**:
  - Edit profile - Personal information and contact details editing
  - My favorites - User's favorited items collection
  - Vouchers - Coupon and account balance management
  - Sign out - Secure logout with complete state clearing
- **Help & Support**:
  - Start chat - Customer service chat functionality
  - FAQ - Frequently asked questions
  - Terms and Conditions - Platform terms and conditions
- **Account Management**:
  - Delete account - Account deletion functionality
  - Appearance settings - Light/dark theme switching
- **Beta Features**: Experimental features and settings options
- **Responsive Design**: Mobile-friendly card layout, fully restored from Figma designs

#### Edit Profile Page (edit_profile.html)
- **Avatar Settings**: Avatar image upload with real-time preview
- **Basic Information Editing**:
  - Username modification - 3-20 character support
  - Display name setting - letters, numbers and special characters
  - Email address modification - real-time format validation
- **Contact Information Management**:
  - Phone number setting - optional emergency contact
  - Location setting - nearby tool sharing opportunity matching
- **Bio Editing**:
  - Up to 500 character personal bio support
  - Public profile page display
- **Form Validation**:
  - Real-time input validation and error prompts
  - Required field validation (username, email)
  - Local storage data synchronization
- **User Experience Optimization**:
  - Auto-save to local storage
  - Unsaved changes warning
  - Visual save feedback
  - Keyboard shortcuts (Ctrl+S to save)
- **Responsive Design**: Desktop, tablet, and mobile optimization

#### Browse Items Page (browse_things.html)
- **Page Header**: "Browse the Things" main title and description
- **Smart Search Functionality**:
  - Real-time search input for product names
  - Search suggestions and auto-completion (extensible)
  - Real-time result filtering and highlighting
  - Keyboard shortcuts (Ctrl+K focus search, ESC clear)
- **Category Filter System**:
  - 6 main categories: Tools, Electronics, Garden Equipment, Sports Equipment, Automotive, DIY & Home
  - Collapsible category menu (mobile-friendly)
  - Category icons and active state display
  - Number key category switching (1-6 for categories, 0 for all)
- **Product Display Grid**:
  - Responsive product card layout (desktop 2-column, tablet 2-column, mobile 1-column)
  - 6 real product showcases: pressure washer, steam cleaner, hedge trimmer, vacuum cleaner, extendable ladder, speaker system
  - Product images, names, daily rental prices
  - Hover animations and click interactions
  - Image lazy loading optimization
- **Bottom CTA Section**:
  - Orange "Still scrolling?" engagement area
  - "Make a wish" feature for user item requests
  - Decorative animation elements
- **Interactive Features**:
  - Smooth page loading animations
  - Product card click detail preview
  - No search results messaging
  - Category switching animations
  - Debounced search optimization
- **Responsive Design**: Perfect adaptation for desktop, tablet, and mobile screens
- **Performance Optimization**: Image lazy loading, event debouncing, animation performance

### User Authentication System
- **Smart Navigation Bar**: Dynamic navigation buttons based on login status
  - Not logged in: Sign in + Join buttons
  - Logged in: Profile + List an Item buttons
- **Login Functionality**: Complete login and registration form handling
  - Form validation (email format, password strength, etc.)
  - Remember login state option
  - Automatic redirect functionality
- **State Management**: 
  - localStorage (persistent login) and sessionStorage (session login) support
  - Cross-tab login state synchronization
  - Custom event system for state change notifications
- **Secure Logout**: Clear all login-related data and redirect to login page

### Component Design

#### ProductCard Component
- **Purpose**: Card component for displaying tool information
- **Structure**: 
  - Tool image/icon
  - Tool name
  - Rating display (5-star system)
  - Price information
  - Favorite button
  - Status labels (e.g., "HOT POPULAR", "POPULAR")
- **Styling**: Card-based design with hover effects
- **Responsive**: Adaptive layout for different screen sizes

#### FeatureCard Component
- **Purpose**: Card for showcasing platform features
- **Structure**:
  - Icon area
  - Title
  - Description text
- **Styling**: Circular icon background with clean text layout

## Design System

### Color Scheme
- Primary: #2879FF (Blue)
- Secondary: #4A4A4A (Dark Gray)
- Background: #FFFFFF (White)
- Surface: #F9F9F9 (Light Gray)

### Typography
- Font Family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto
- Heading Sizes: 24px (h1), 20px (h2), 18px (h3)
- Body Text: 16px
- Small Text: 14px (caption), 12px (small)

### Layout Guidelines
- Max Width: 1200px
- Grid System: 12 columns
- Spacing Units: 4px, 8px, 16px, 24px, 32px, 48px, 64px
- Border Radius: 4px (small), 8px (default)

## Technical Features

### Backend (Django)
- **Framework**: Django 5.2.4 with Python
- **Database**: SQLite (development) with MySQL support
- **API**: Django REST Framework for RESTful APIs
- **Authentication**: Extended Django User model with UUID primary keys
- **File Handling**: Media file management for user uploads
- **Admin Interface**: Comprehensive Django admin for content management
- **CORS Support**: Cross-origin request handling

### Frontend
- **HTML5**: Semantic markup and modern web standards
- **CSS**: Flexbox and Grid layouts with responsive design
- **JavaScript**: Component-based architecture without framework dependencies
- **Performance**: Image lazy loading, event debouncing, animation optimization
- **Accessibility**: WCAG guidelines compliance and screen reader support
- **Cross-browser**: Modern browser compatibility

### Data Models
- **User**: Extended user model with profile information, avatar, and verification
- **Item**: Tool listings with categories, pricing, images, and location data
- **Booking**: Complete rental booking system with status tracking
- **Review**: User rating and review system
- **Cart**: Shopping cart functionality for multiple bookings
- **Location**: Geographic location management
- **Category**: Tool categorization system

## Browser Compatibility
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Project Status

✅ **Completed Features**:
- **Backend Development**:
  - Complete Django project structure
  - Extended User model with profile features
  - Item management system with categories and pricing
  - Booking system with status tracking
  - Review and rating system
  - Shopping cart functionality
  - Django REST Framework API endpoints
  - Admin interface for content management
  - Database models and migrations

- **Frontend Development**:
  - Responsive web layout for all pages
  - ProductCard component (product cards)
  - FeatureCard component (feature highlight cards)
  - Component-based JavaScript architecture
  - Interactive features (favorites, clicks, hover effects)
  - Modal system implementation
  - Complete design system implementation
  - Accessibility support
  - Performance optimization
  - User authentication system
  - 6-step item listing workflow
  - Complete profile management
  - Cross-page navigation system

## Installation & Usage

### Prerequisites
- Python 3.8+
- pip (Python package manager)
- Virtual environment (recommended)

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ShareTools
   ```

2. **Create and activate virtual environment**
   ```bash
   python -m venv .venv
   # Windows
   .venv\Scripts\activate
   # macOS/Linux
   source .venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment setup**
   ```bash
   cp env.example .env
   # Edit .env file with your configuration
   ```

5. **Database setup**
   ```bash
   python manage.py migrate
   python manage.py createsuperuser  # Optional: create admin user
   ```

6. **Run the development server**
   ```bash
   python manage.py runserver
   ```

### Access the Application
- **Homepage**: `http://localhost:8000/`
- **Login Page**: `http://localhost:8000/login/`
- **List Item**: `http://localhost:8000/list-item/`
- **Profile**: `http://localhost:8000/profile/`
- **Edit Profile**: `http://localhost:8000/edit-profile/`
- **Browse Items**: `http://localhost:8000/browse-things/`
- **Admin Interface**: `http://localhost:8000/admin/`

### User Authentication Guide

#### Development Testing
1. Visit the homepage and notice "Sign in" and "Join" buttons in the navigation
2. In development mode, test controls appear in the top-right corner:
   - Click "Simulate Login" for quick login
   - Click "Simulate Logout" to logout
   - Click "Check Status" to view current login state

#### Normal Login Flow
1. Click "Sign in" button in the navigation bar
2. Fill in username/email and password (any content works for simulation)
3. Choose "Remember me" option if desired
4. Click "Sign In" button
5. Successful login redirects to homepage with "Profile" and "List an Item" buttons

#### Registration Flow
1. On login page, click "Sign Up" to switch to registration form
2. Fill in username, email, password, and confirm password
3. Check the terms agreement checkbox
4. Click "Sign Up" button
5. Successful registration automatically logs in and redirects to homepage

#### Logout Process
1. Click "Profile" button in navigation bar
2. Click "Sign out" option
3. Confirm logout action
4. Login state is cleared and redirected to login page

### Alternative: Static File Server
1. Open terminal in project root directory
2. Run command: `python -m http.server 8000`
3. Access in browser: `http://localhost:8000/templates/index.html`

*Note: This method only serves static files and doesn't include Django backend functionality.*

## Development Guide

### Component Usage Examples

#### Creating Product Cards
```javascript
// Create single product card
const productData = {
  id: 'tool-1',
  title: 'TOOL ONE',
  rating: 5,
  price: '1day',
  currency: '£',
  period: 'day',
  icon: '🔧',
  badge: { type: 'popular', text: 'HOT POPULAR' },
  isFavorited: false
};

const container = document.getElementById('products-container');
const productCard = componentManager.createProductCard(productData, container);
```

#### Creating Feature Cards
```javascript
// Create feature card
const featureData = {
  id: 'feature-1',
  title: 'Everything is guaranteed',
  description: 'A protection for both the person who rents and the person who rents out',
  icon: '🛡️',
  iconColor: '#2879FF'
};

const container = document.getElementById('features-container');
const featureCard = componentManager.createFeatureCard(featureData, container);
```

#### Batch Component Creation
```javascript
// Batch create product cards
const productsArray = [/* product data array */];
const productCards = componentManager.createProductCards(productsArray, container);

// Batch create feature cards
const featuresArray = [/* feature data array */];
const featureCards = componentManager.createFeatureCards(featuresArray, container);
```

### Event Handling
Components support the following custom events:
- `favoriteToggle`: Favorite status toggle
- `productClick`: Product card click
- `productHover`: Product card hover
- `featureClick`: Feature card click

### Code Architecture
- **Component-based Design**: Each UI element is abstracted as reusable components
- **Event-driven**: Custom events for inter-component communication
- **Responsive Layout**: Mobile and desktop support
- **Accessibility**: WCAG guidelines compliance with screen reader support
- **Performance Optimization**: CSS variables, debouncing, throttling techniques
- **Progressive Enhancement**: Ensures functionality across different environments

### API Endpoints
The Django backend provides RESTful API endpoints for:
- User authentication and profile management
- Item CRUD operations
- Booking management
- Review and rating system
- Cart functionality

### Database Schema
The application uses a well-structured database schema with:
- UUID primary keys for security
- Proper foreign key relationships
- Indexed fields for performance
- Validation constraints

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request