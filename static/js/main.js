/* ShareTools Main JavaScript File */
/* Page initialization and data management */

// Main application class
class ShareToolsApp {
  constructor() {
    this.productCards = [];
    this.featureCards = [];
    this.favoriteProducts = new Set();

    this.init();
  }

  // Initialize application
  async init() {
    this.bindGlobalEvents();
    this.initNavigation();
    await this.loadData();
    this.initializeComponents();
  }

  // Initialize navigation functionality
  initNavigation() {
    console.log('Initializing navigation...');

    // Handle dropdown menu navigation (Locations only)
    const navDropdowns = document.querySelectorAll('.nav-dropdown');
    navDropdowns.forEach(dropdown => {
      const navLink = dropdown.querySelector('.nav-link');
      const dropdownMenu = dropdown.querySelector('.dropdown-menu');

      if (navLink && dropdownMenu) {
        // Dropdown menu link - prevent default behavior, show menu
        navLink.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();

          // Close all other dropdown menus
          navDropdowns.forEach(otherDropdown => {
            if (otherDropdown !== dropdown) {
              const otherMenu = otherDropdown.querySelector('.dropdown-menu');
              if (otherMenu) {
                otherMenu.classList.remove('dropdown-active');
              }
            }
          });

          // Toggle current dropdown menu
          dropdownMenu.classList.toggle('dropdown-active');
        });

        // Mobile device support
        navLink.addEventListener('touchstart', (e) => {
          e.preventDefault();
          dropdownMenu.classList.toggle('dropdown-active');
        });
      }
    });

    // Handle regular navigation links (The Things, About, List an Item)
    const regularNavLinks = document.querySelectorAll('.nav-item:not(.nav-dropdown) .nav-link');
    console.log(`Found ${regularNavLinks.length} regular navigation links`);

    regularNavLinks.forEach(link => {
      console.log(`Regular nav link: ${link.textContent.trim()} -> ${link.href}`);

      // Ensure links work properly
      link.addEventListener('click', (e) => {
        console.log(`🔗 Clicking: ${link.textContent.trim()} -> ${link.href}`);

        // Don't prevent default behavior, let links navigate normally
        if (link.href && link.href !== '#') {
          console.log(`✅ Allowing navigation to: ${link.href}`);
          // Add small delay to ensure logs are visible
          setTimeout(() => {
            if (e.defaultPrevented) {
              console.log('⚠️ Navigation was prevented by another handler');
              window.location.href = link.href;
            }
          }, 10);
        } else {
          console.log('❌ Invalid href, preventing navigation');
          e.preventDefault();
        }
      });

      // Add visual feedback
      link.addEventListener('mousedown', () => {
        link.style.opacity = '0.7';
      });

      link.addEventListener('mouseup', () => {
        link.style.opacity = '1';
      });

      link.addEventListener('mouseleave', () => {
        link.style.opacity = '1';
      });
    });

    // Click elsewhere on page to close dropdown menus
    document.addEventListener('click', (e) => {
      const clickedDropdown = e.target.closest('.nav-dropdown');
      if (!clickedDropdown) {
        navDropdowns.forEach(dropdown => {
          const dropdownMenu = dropdown.querySelector('.dropdown-menu');
          if (dropdownMenu) {
            dropdownMenu.classList.remove('dropdown-active');
          }
        });
      }
    });

    // ESC key to close dropdown menus
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        navDropdowns.forEach(dropdown => {
          const dropdownMenu = dropdown.querySelector('.dropdown-menu');
          if (dropdownMenu) {
            dropdownMenu.classList.remove('dropdown-active');
          }
        });
      }
    });

    console.log('Navigation initialization completed');
  }

  // Load data (get real data from API)
  async loadData() {
    try {
      // Show loading state
      this.showLoadingState();

      // Load product data and feature data in parallel
      const [productsResponse, featuresResponse] = await Promise.all([
        this.loadProductsData(),
        this.loadFeaturesData()
      ]);

      this.productsData = productsResponse;
      this.featuresData = featuresResponse;

      // Hide loading state
      this.hideLoadingState();

    } catch (error) {
      console.error('Failed to load data:', error);
      // If API call fails, use fallback data
      this.loadFallbackData();
      this.hideLoadingState();
    }
  }

  // Load product data from API
  async loadProductsData() {
    try {
      console.log('Starting to load product data...');
      if (typeof ItemsAPI !== 'undefined') {
        console.log('ItemsAPI available, calling API...');
        const response = await ItemsAPI.getItems({ limit: 6, status: 'active' });
        console.log('API response:', response);

        // Transform API data format to component required format
        const transformedData = response.results.map(item => {
          console.log('Processing item:', item);

          // Get image URL
          let imageUrl = null;
          if (item.primary_image && item.primary_image.image) {
            imageUrl = item.primary_image.image;
          } else if (item.images && item.images.length > 0) {
            imageUrl = item.images[0].image;
          }

          // Get minimum price
          let minPrice = '1';
          if (item.min_daily_price) {
            minPrice = item.min_daily_price.toString();
          } else if (item.prices && item.prices.length > 0) {
            const prices = item.prices.map(p => parseFloat(p.price)).filter(p => !isNaN(p));
            if (prices.length > 0) {
              minPrice = Math.min(...prices).toString();
            }
          }

          console.log(`Item ${item.title}: imageUrl=${imageUrl}, minPrice=${minPrice}`);

          return {
            id: `item-${item.id}`,
            title: item.title || item.name,
            rating: item.rating || 5,
            price: minPrice,
            currency: '£',
            period: 'day',
            icon: this.getItemIcon(item.category),
            image: imageUrl, // Add real image
            badge: this.getItemBadge(item),
            isFavorited: false,
            originalData: item // Save original data for later use
          };
        });
        console.log('Transformed product data:', transformedData);
        return transformedData;
      } else {
        console.warn('ItemsAPI not defined, will use fallback data');
        throw new Error('ItemsAPI not defined');
      }
    } catch (error) {
      console.error('Failed to load product data from API:', error);
      throw error;
    }
  }

  // Load fallback data (static data)
  loadFallbackData() {
    console.log('Using fallback data');

    // Product data
    this.productsData = [
      {
        id: 'tool-1',
        title: 'TOOL ONE',
        rating: 5,
        price: '1',
        currency: '£',
        period: 'day',
        icon: '🔧',
        badge: null,
        isFavorited: false
      },
      {
        id: 'tool-2',
        title: 'TOOL NO.2',
        rating: 5,
        price: '1',
        currency: '£',
        period: 'day',
        icon: '⚙️',
        badge: { type: 'popular', text: 'HOT POPULAR' },
        isFavorited: false
      },
      {
        id: 'tool-3',
        title: 'TOOL NO.3',
        rating: 5,
        price: '1',
        currency: '£',
        period: 'day',
        icon: '🛠️',
        badge: { type: 'popular', text: 'POPULAR' },
        isFavorited: true
      },
      {
        id: 'tool-4',
        title: 'TOOL NO.4',
        rating: 5,
        price: '1',
        currency: '£',
        period: 'day',
        icon: '🔨',
        badge: null,
        isFavorited: false
      },
      {
        id: 'tool-5',
        title: 'TOOL NO.5',
        rating: 5,
        price: '1',
        currency: '£',
        period: 'day',
        icon: '⚡',
        badge: { type: 'hot', text: 'HOT POPULAR' },
        isFavorited: false
      }
    ];

    // Feature data
    this.featuresData = [
      {
        id: 'feature-1',
        title: 'Everything is guaranteed',
        description: 'A protection for both the person who rents and the person who rents out',
        icon: '🛡️',
        iconColor: '#2879FF'
      },
      {
        id: 'feature-2',
        title: 'Everyone is verified',
        description: 'Everyone is verified.',
        icon: '✅',
        iconColor: '#2879FF'
      },
      {
        id: 'feature-3',
        title: 'Cheaper than buying',
        description: 'It is often 50% cheaper to rent through Fat Llama than a company.',
        icon: '💰',
        iconColor: '#2879FF'
      },
      {
        id: 'feature-4',
        title: 'Rent in your area',
        description: 'You can usually rent something closer to you than the nearest store.',
        icon: '🚴',
        iconColor: '#2879FF'
      },
      {
        id: 'feature-5',
        title: 'Hours that suit you',
        description: 'Before and after work and weekends work best - just as it should be.',
        icon: '⏰',
        iconColor: '#2879FF'
      },
      {
        id: 'feature-6',
        title: 'Good for the Environment',
        description: 'The more things get used - the better.',
        icon: '🌱',
        iconColor: '#27AE60'
      }
    ];
  }

  // Load feature data from API
  async loadFeaturesData() {
    // Feature data is usually static, but can also be fetched from API
    return [
      {
        id: 'feature-1',
        title: 'Everything is guaranteed',
        description: 'A protection for both the person who rents and the person who rents out',
        icon: '🛡️',
        iconColor: '#2879FF'
      },
      {
        id: 'feature-2',
        title: 'Everyone is verified',
        description: 'Everyone is verified.',
        icon: '✅',
        iconColor: '#2879FF'
      },
      {
        id: 'feature-3',
        title: 'Cheaper than buying',
        description: 'It is often 50% cheaper to rent through ShareTools than buying new.',
        icon: '💰',
        iconColor: '#2879FF'
      },
      {
        id: 'feature-4',
        title: 'Rent in your area',
        description: 'You can usually rent something closer to you than the nearest store.',
        icon: '🚴',
        iconColor: '#2879FF'
      },
      {
        id: 'feature-5',
        title: 'Hours that suit you',
        description: 'Before and after work and weekends work best - just as it should be.',
        icon: '⏰',
        iconColor: '#2879FF'
      },
      {
        id: 'feature-6',
        title: 'Good for the Environment',
        description: 'The more things get used - the better.',
        icon: '🌱',
        iconColor: '#27AE60'
      }
    ];
  }

  // Get item icon based on category
  getItemIcon(category) {
    const iconMap = {
      'tools': '🔧',
      'power_tools': '⚡',
      'hand_tools': '🔨',
      'garden_tools': '🌱',
      'automotive': '🚗',
      'electronics': '📱',
      'sports': '⚽',
      'home': '🏠',
      'kitchen': '🍳',
      'cleaning': '🧽',
      'construction': '🏗️',
      'diy': '🛠️'
    };

    return iconMap[category] || '🔧';
  }

  // Get badge based on item properties
  getItemBadge(item) {
    if (item.is_featured) {
      return { type: 'hot', text: 'FEATURED' };
    }
    if (item.rating && item.rating >= 4.5) {
      return { type: 'popular', text: 'POPULAR' };
    }
    if (item.created_at) {
      const createdDate = new Date(item.created_at);
      const now = new Date();
      const daysDiff = (now - createdDate) / (1000 * 60 * 60 * 24);
      if (daysDiff <= 7) {
        return { type: 'new', text: 'NEW' };
      }
    }
    return null;
  }

  // Show loading state
  showLoadingState() {
    const productsContainer = document.getElementById('products-container');
    const featuresContainer = document.getElementById('features-container');

    if (productsContainer) {
      productsContainer.innerHTML = '<div class="loading-spinner">Loading...</div>';
    }

    if (featuresContainer) {
      featuresContainer.innerHTML = '<div class="loading-spinner">Loading...</div>';
    }
  }

  // Hide loading state
  hideLoadingState() {
    // Loading state will be replaced when rendering components, additional cleanup logic can be added here
    console.log('Data loading completed');
  }

  // Initialize components
  initializeComponents() {
    this.renderProductCards();
    this.renderFeatureCards();
  }

  // Render product cards
  renderProductCards() {
    console.log('Starting to render product cards...');
    const container = document.getElementById('products-container');
    if (!container) {
      console.warn('Product container not found');
      return;
    }

    // Check if data exists
    if (!this.productsData || this.productsData.length === 0) {
      console.warn('Product data is empty, showing placeholder');
      container.innerHTML = `
        <div class="no-products-message">
          <h3>No items to display</h3>
          <p>There are currently no active items. Please check back later or <a href="/list-item/">list your item</a>.</p>
        </div>
      `;
      return;
    }

    console.log('Product data:', this.productsData);

    // Check if componentManager exists
    if (typeof componentManager === 'undefined') {
      console.error('componentManager not defined, trying to wait for loading...');
      setTimeout(() => {
        if (typeof componentManager !== 'undefined') {
          this.renderProductCards();
        } else {
          this.renderProductCardsFallback(container);
        }
      }, 500);
      return;
    }

    // Clear container
    container.innerHTML = '';

    // Create product cards
    try {
      this.productCards = componentManager.createProductCards(this.productsData, container);
      console.log('Product cards created successfully:', this.productCards);
    } catch (error) {
      console.error('Failed to create product cards:', error);
      this.renderProductCardsFallback(container);
      return;
    }

    // Bind product card events
    this.bindProductEvents();
  }

  // Fallback product card rendering method
  renderProductCardsFallback(container) {
    console.log('Using fallback rendering method...');
    container.innerHTML = '';

    this.productsData.forEach(product => {
      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        <div class="product-card-header">
          <div class="product-icon">${product.icon || '🔧'}</div>
          ${product.badge ? `<div class="product-badge ${product.badge.type}">${product.badge.text}</div>` : ''}
        </div>
        <div class="product-card-body">
          <h3 class="product-title">${product.title}</h3>
          <div class="product-rating">
            <div class="rating-stars">
              ${this.renderStarsFallback(product.rating)}
            </div>
          </div>
        </div>
        <div class="product-card-footer">
          <div class="product-price">
            <span class="currency">${product.currency}</span>
            <span class="amount">${product.price}</span>
            <span class="period">/${product.period}</span>
          </div>
          <button class="favorite-btn" onclick="this.classList.toggle('active')">🤍</button>
        </div>
      `;
      container.appendChild(card);
    });
  }

  // Fallback star rating rendering
  renderStarsFallback(rating) {
    const maxStars = 5;
    let starsHtml = '';
    for (let i = 1; i <= maxStars; i++) {
      const isFilled = i <= rating;
      starsHtml += `<div class="star ${isFilled ? 'filled' : ''}"></div>`;
    }
    return starsHtml;
  }

  // Render feature cards
  renderFeatureCards() {
    console.log('Starting to render feature cards...');
    const container = document.getElementById('features-container');
    if (!container) {
      console.warn('Feature container not found');
      return;
    }

    // Check if data exists
    if (!this.featuresData || this.featuresData.length === 0) {
      console.warn('Feature data is empty');
      container.innerHTML = '<div class="no-features-message"><p>No features to display</p></div>';
      return;
    }

    console.log('Feature data:', this.featuresData);

    // Check if componentManager exists
    if (typeof componentManager === 'undefined') {
      console.error('componentManager not defined, using fallback rendering method...');
      this.renderFeatureCardsFallback(container);
      return;
    }

    // Clear container
    container.innerHTML = '';

    // Create feature cards
    try {
      this.featureCards = componentManager.createFeatureCards(this.featuresData, container);
      console.log('Feature cards created successfully:', this.featureCards);
    } catch (error) {
      console.error('Failed to create feature cards:', error);
      this.renderFeatureCardsFallback(container);
      return;
    }

    // Bind feature events
    this.bindFeatureEvents();
  }

  // Fallback feature card rendering method
  renderFeatureCardsFallback(container) {
    console.log('Using fallback feature rendering method...');
    container.innerHTML = '';

    this.featuresData.forEach(feature => {
      const card = document.createElement('div');
      card.className = 'feature-card';
      card.innerHTML = `
        <div class="feature-icon" style="color: ${feature.iconColor || '#2879FF'}">
          ${feature.icon}
        </div>
        <h3 class="feature-title">${feature.title}</h3>
        <p class="feature-description">${feature.description}</p>
      `;
      container.appendChild(card);
    });
  }

  // Bind product card events
  bindProductEvents() {
    const container = document.getElementById('products-container');
    if (!container) return;

    // Favorite toggle event
    container.addEventListener('favoriteToggle', (e) => {
      const { productId, isFavorited } = e.detail;

      if (isFavorited) {
        this.favoriteProducts.add(productId);
      } else {
        this.favoriteProducts.delete(productId);
      }

      console.log(`Product ${productId} ${isFavorited ? 'added to' : 'removed from'} favorites`);

      // Update favorite count display
      this.updateFavoriteCount();
    });

    // Product click event
    container.addEventListener('productClick', (e) => {
      const { productId, product } = e.detail;
      console.log(`Clicked product: ${product.title}`);

      // Logic for navigating to product details page can be added here
      this.showProductDetails(product);
    });

    // Product hover event
    container.addEventListener('productHover', (e) => {
      const { product } = e.detail;
      // Additional hover effects can be added here
    });
  }

  // Bind feature events
  bindFeatureEvents() {
    const container = document.getElementById('features-container');
    if (!container) return;

    // Feature click event
    container.addEventListener('featureClick', (e) => {
      const { feature } = e.detail;
      console.log(`Clicked feature: ${feature.title}`);

      // Logic for displaying feature details can be added here
      this.showFeatureDetails(feature);
    });
  }

  // Bind global events
  bindGlobalEvents() {
    // Cart click event
    const cartIcon = document.querySelector('.cart-icon');
    if (cartIcon) {
      cartIcon.addEventListener('click', () => {
        this.toggleCart();
      });
    }

    // Navigation link click event
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const href = link.getAttribute('href');
        this.navigateTo(href);
      });
    });

    // Responsive menu toggle
    window.addEventListener('resize', ComponentUtils.debounce(() => {
      this.handleResize();
    }, 250));

    // Scroll event
    window.addEventListener('scroll', ComponentUtils.throttle(() => {
      this.handleScroll();
    }, 100));
  }

  // Show product details
  showProductDetails(product) {
    // Simple modal to display product information
    const modal = this.createModal({
      title: product.title,
      content: `
        <div class="product-details">
          <div class="product-icon-large">${product.icon}</div>
          <p><strong>Rating:</strong> ${product.rating}/5 stars</p>
          <p><strong>Price:</strong> ${product.currency}${product.price}/${product.period}</p>
          <p><strong>Status:</strong> ${product.badge ? product.badge.text : 'Normal'}</p>
          <p>This is an excellent tool that can help you improve your work efficiency.</p>
        </div>
      `,
      actions: [
        { text: 'Rent Now', class: 'btn-primary', action: () => this.rentProduct(product) },
        { text: 'Close', class: 'btn-secondary', action: () => this.closeModal() }
      ]
    });
  }

  // Show feature details
  showFeatureDetails(feature) {
    const modal = this.createModal({
      title: feature.title,
      content: `
        <div class="feature-details">
          <div class="feature-icon-large" style="background-color: ${feature.iconColor}">
            ${feature.icon}
          </div>
          <p>${feature.description}</p>
          <p>Learn more about the detailed information of this feature.</p>
        </div>
      `,
      actions: [
        { text: 'Learn More', class: 'btn-primary', action: () => this.learnMore(feature) },
        { text: 'Close', class: 'btn-secondary', action: () => this.closeModal() }
      ]
    });
  }

  // Create modal
  createModal({ title, content, actions }) {
    // Remove existing modal
    this.closeModal();

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h2>${title}</h2>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          ${content}
        </div>
        <div class="modal-footer">
          ${actions.map(action => 
            `<button class="btn ${action.class}" data-action="${action.text}">${action.text}</button>`
          ).join('')}
        </div>
      </div>
    `;

    // Bind events
    modal.querySelector('.modal-close').addEventListener('click', () => this.closeModal());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) this.closeModal();
    });

    actions.forEach(action => {
      const btn = modal.querySelector(`[data-action="${action.text}"]`);
      btn.addEventListener('click', action.action);
    });

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    return modal;
  }

  // Close modal
  closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
      modal.remove();
      document.body.style.overflow = '';
    }
  }

  // Toggle cart
  toggleCart() {
    console.log('Toggle cart display');
    // Logic for showing/hiding cart can be implemented here
  }

  // Navigation handling
  navigateTo(href) {
    console.log(`Navigate to: ${href}`);
    // Single page application routing logic can be implemented here
  }

  // Rent product
  rentProduct(product) {
    console.log(`Rent product: ${product.title}`);
    this.closeModal();
    // Rental logic can be implemented here
  }

  // Learn more
  learnMore(feature) {
    console.log(`Learn more: ${feature.title}`);
    this.closeModal();
    // Logic for navigating to details page can be implemented here
  }

  // Update favorite count
  updateFavoriteCount() {
    const count = this.favoriteProducts.size;
    const cartIcon = document.querySelector('.cart-icon');
    if (cartIcon && count > 0) {
      cartIcon.setAttribute('data-count', count);
    } else if (cartIcon) {
      cartIcon.removeAttribute('data-count');
    }
  }

  // Handle window resize
  handleResize() {
    // Responsive handling logic
    const width = window.innerWidth;
    if (width < 768) {
      document.body.classList.add('mobile');
    } else {
      document.body.classList.remove('mobile');
    }
  }

  // Handle scroll event
  handleScroll() {
    const scrollY = window.scrollY;
    const header = document.querySelector('.header');

    if (scrollY > 100) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }
  }
}

// Modal and loading state styles (dynamically added to page)
const modalStyles = `
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    animation: fadeIn 150ms ease-out;
  }
  
  .loading-spinner {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-xl);
    font-size: var(--font-size-body);
    color: var(--color-text-secondary);
    min-height: 200px;
  }
  
  .loading-spinner::before {
    content: '';
    width: 20px;
    height: 20px;
    border: 2px solid var(--color-surface);
    border-top: 2px solid var(--color-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-right: var(--spacing-sm);
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .modal {
    background: var(--color-background);
    border-radius: var(--radius-default);
    box-shadow: var(--shadow-high);
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow: hidden;
    animation: slideIn 150ms ease-out;
  }
  
  .modal-header {
    padding: var(--spacing-lg);
    border-bottom: 1px solid var(--color-surface);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  .modal-header h2 {
    margin: 0;
    font-size: var(--font-size-h2);
  }
  
  .modal-close {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: var(--color-text-secondary);
    padding: var(--spacing-xs);
  }
  
  .modal-body {
    padding: var(--spacing-lg);
    max-height: 60vh;
    overflow-y: auto;
  }
  
  .modal-footer {
    padding: var(--spacing-lg);
    border-top: 1px solid var(--color-surface);
    display: flex;
    gap: var(--spacing-md);
    justify-content: flex-end;
  }
  
  .product-details, .feature-details {
    text-align: center;
  }
  
  .product-icon-large, .feature-icon-large {
    width: 80px;
    height: 80px;
    font-size: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto var(--spacing-lg);
    border-radius: var(--radius-default);
    background: var(--color-surface);
  }
  
  .cart-icon[data-count]::after {
    content: attr(data-count);
    position: absolute;
    top: -8px;
    right: -8px;
    background: var(--color-error);
    color: white;
    border-radius: 50%;
    width: 18px;
    height: 18px;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .header.scrolled {
    box-shadow: var(--shadow-medium);
  }
  
  @keyframes slideIn {
    from {
      transform: translateY(-20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

// Add modal styles to page
const styleSheet = document.createElement('style');
styleSheet.textContent = modalStyles;
document.head.appendChild(styleSheet);

// Global application instance
let app;

// Initialize application after DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  try {
    app = new ShareToolsApp();
    window.shareToolsApp = app;

    console.log('ShareTools application initialized');
  } catch (error) {
    console.error('Application initialization failed:', error);
  }
});

// Export to global scope
window.ShareToolsApp = ShareToolsApp;