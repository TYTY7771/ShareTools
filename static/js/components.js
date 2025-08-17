/* ShareTools Component JavaScript File */
/* Implements component interaction functionality and dynamic behavior */

// Component Factory Class
class ComponentFactory {
  constructor() {
    this.components = new Map();
  }

  // Register component
  register(name, component) {
    this.components.set(name, component);
  }

  // Create component instance
  create(name, ...args) {
    const Component = this.components.get(name);
    if (!Component) {
      throw new Error(`Component ${name} not registered`);
    }
    return new Component(...args);
  }
}

// Global component factory instance
const componentFactory = new ComponentFactory();

// ===== ProductCard 组件 =====
class ProductCard {
  constructor(data, container) {
    this.data = data;
    this.container = container;
    this.element = null;
    this.isFavorited = data.isFavorited || false;
    
    this.init();
  }

  // Initialize component
  init() {
    this.render();
    this.bindEvents();
  }

  // Render component HTML
  render() {
    const { title, rating, price, currency, period, badge, icon, image } = this.data;
    
    this.element = document.createElement('div');
    this.element.className = 'product-card fade-in';
    
    // 构建图片/图标内容
    let imageContent = '';
    if (image) {
      // 如果有真实图片，使用图片
      imageContent = `<img src="${image}" alt="${title}" class="product-image" 
                        onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
                      <div class="product-icon-fallback" style="display: none;">${icon || '🔧'}</div>`;
    } else {
      // 没有图片时使用图标
      imageContent = `<div class="product-icon-fallback">${icon || '🔧'}</div>`;
    }
    
    this.element.innerHTML = `
      <div class="product-card-header">
        <div class="product-icon">
          ${imageContent}
        </div>
        ${badge ? `<div class="product-badge ${badge.type}">${badge.text}</div>` : ''}
      </div>
      <div class="product-card-body">
        <h3 class="product-title">${title}</h3>
        <div class="product-rating">
          <div class="rating-stars">
            ${this.renderStars(rating)}
          </div>
        </div>
      </div>
      <div class="product-card-footer">
        <div class="product-price">
          <span class="currency">${currency}</span>
          <span class="amount">${price}</span>
          <span class="period">/${period}</span>
        </div>
        <button class="favorite-btn ${this.isFavorited ? 'active' : ''}" 
                aria-label="${this.isFavorited ? '取消收藏' : '添加收藏'}">
          ${this.isFavorited ? '❤️' : '🤍'}
        </button>
      </div>
    `;

    if (this.container) {
      this.container.appendChild(this.element);
    }
  }

  // Render star rating
  renderStars(rating) {
    const maxStars = 5;
    let starsHtml = '';
    
    for (let i = 1; i <= maxStars; i++) {
      const isFilled = i <= rating;
      starsHtml += `<div class="star ${isFilled ? 'filled' : ''}"></div>`;
    }
    
    return starsHtml;
  }

  // Bind events
  bindEvents() {
    if (!this.element) return;

    // Favorite button click event
    const favoriteBtn = this.element.querySelector('.favorite-btn');
    favoriteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleFavorite();
    });

    // Card click event
    this.element.addEventListener('click', () => {
      this.onClick();
    });

    // Card hover event
    this.element.addEventListener('mouseenter', () => {
      this.onHover();
    });

    this.element.addEventListener('mouseleave', () => {
      this.onLeave();
    });
  }

  // Toggle favorite status
  toggleFavorite() {
    this.isFavorited = !this.isFavorited;
    const favoriteBtn = this.element.querySelector('.favorite-btn');
    
    favoriteBtn.innerHTML = this.isFavorited ? '❤️' : '🤍';
    favoriteBtn.className = `favorite-btn ${this.isFavorited ? 'active' : ''}`;
    favoriteBtn.setAttribute('aria-label', this.isFavorited ? 'Remove from favorites' : 'Add to favorites');

    // Trigger custom event
    this.element.dispatchEvent(new CustomEvent('favoriteToggle', {
      detail: { 
        productId: this.data.id, 
        isFavorited: this.isFavorited,
        product: this.data
      }
    }));

    // Add animation effect
    favoriteBtn.style.transform = 'scale(1.2)';
    setTimeout(() => {
      favoriteBtn.style.transform = 'scale(1)';
    }, 150);
  }

  // Card click handler
  onClick() {
    this.element.dispatchEvent(new CustomEvent('productClick', {
      detail: { 
        productId: this.data.id,
        product: this.data
      }
    }));
  }

  // Card hover handler
  onHover() {
    this.element.dispatchEvent(new CustomEvent('productHover', {
      detail: { 
        productId: this.data.id,
        product: this.data
      }
    }));
  }

  // Card leave handler
  onLeave() {
    this.element.dispatchEvent(new CustomEvent('productLeave', {
      detail: { 
        productId: this.data.id,
        product: this.data
      }
    }));
  }

  // Update data
  updateData(newData) {
    this.data = { ...this.data, ...newData };
    this.render();
    this.bindEvents();
  }

  // Destroy component
  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
  }
}

// ===== FeatureCard Component =====
class FeatureCard {
  constructor(data, container) {
    this.data = data;
    this.container = container;
    this.element = null;
    
    this.init();
  }

  // Initialize component
  init() {
    this.render();
    this.bindEvents();
  }

  // Render component HTML
  render() {
    const { title, description, icon, iconColor } = this.data;
    
    this.element = document.createElement('div');
    this.element.className = 'feature-card fade-in';
    this.element.innerHTML = `
      <div class="feature-icon" style="${iconColor ? `background-color: ${iconColor}` : ''}">
        ${icon || '⭐'}
      </div>
      <h3 class="feature-title">${title}</h3>
      <p class="feature-description">${description}</p>
    `;

    if (this.container) {
      this.container.appendChild(this.element);
    }
  }

  // Bind events
  bindEvents() {
    if (!this.element) return;

    // Card click event
    this.element.addEventListener('click', () => {
      this.onClick();
    });

    // Add hover animation
    this.element.addEventListener('mouseenter', () => {
      const icon = this.element.querySelector('.feature-icon');
      icon.style.transform = 'scale(1.1) rotate(5deg)';
    });

    this.element.addEventListener('mouseleave', () => {
      const icon = this.element.querySelector('.feature-icon');
      icon.style.transform = 'scale(1) rotate(0deg)';
    });
  }

  // Card click handler
  onClick() {
    this.element.dispatchEvent(new CustomEvent('featureClick', {
      detail: { 
        featureId: this.data.id,
        feature: this.data
      }
    }));
  }

  // Update data
  updateData(newData) {
    this.data = { ...this.data, ...newData };
    this.render();
    this.bindEvents();
  }

  // Destroy component
  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
  }
}

// ===== DropdownMenu Component =====
class DropdownMenu {
  constructor(element) {
    this.element = element;
    this.dropdownMenu = element.querySelector('.dropdown-menu');
    this.navLink = element.querySelector('.nav-link');
    
    this.init();
  }

  // Initialize component
  init() {
    this.setupAccessibility();
    this.bindKeyboardEvents();
  }

  // Setup accessibility attributes
  setupAccessibility() {
    this.navLink.setAttribute('aria-haspopup', 'true');
    this.navLink.setAttribute('aria-expanded', 'false');
    this.dropdownMenu.setAttribute('role', 'menu');
    
    const dropdownLinks = this.dropdownMenu.querySelectorAll('.dropdown-link');
    dropdownLinks.forEach(link => {
      link.setAttribute('role', 'menuitem');
      link.setAttribute('tabindex', '-1');
    });
  }

  // Bind keyboard events (preserve accessibility features)
  bindKeyboardEvents() {
    // Keyboard navigation support
    this.navLink.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        // Manually toggle display state when triggered by keyboard
        this.element.classList.toggle('keyboard-active');
      } else if (e.key === 'Escape') {
        this.element.classList.remove('keyboard-active');
        this.navLink.blur();
      }
    });

    // Dropdown link keyboard navigation
    const dropdownLinks = this.dropdownMenu.querySelectorAll('.dropdown-link');
    dropdownLinks.forEach((link, index) => {
      link.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          const nextIndex = (index + 1) % dropdownLinks.length;
          dropdownLinks[nextIndex].focus();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          const prevIndex = (index - 1 + dropdownLinks.length) % dropdownLinks.length;
          dropdownLinks[prevIndex].focus();
        } else if (e.key === 'Escape') {
          this.element.classList.remove('keyboard-active');
          this.navLink.focus();
        }
      });
    });
  }
}

// ===== Component Manager =====
class ComponentManager {
  constructor() {
    this.instances = new Map();
  }

  // Create product card
  createProductCard(data, container) {
    const card = new ProductCard(data, container);
    this.instances.set(`product-${data.id}`, card);
    return card;
  }

  // Create feature card
  createFeatureCard(data, container) {
    const card = new FeatureCard(data, container);
    this.instances.set(`feature-${data.id}`, card);
    return card;
  }

  // Batch create product cards
  createProductCards(dataArray, container) {
    const cards = [];
    dataArray.forEach(data => {
      const card = this.createProductCard(data, container);
      cards.push(card);
    });
    return cards;
  }

  // Batch create feature cards
  createFeatureCards(dataArray, container) {
    const cards = [];
    dataArray.forEach(data => {
      const card = this.createFeatureCard(data, container);
      cards.push(card);
    });
    return cards;
  }

  // Get component instance
  getInstance(id) {
    return this.instances.get(id);
  }

  // Destroy component
  destroyComponent(id) {
    const instance = this.instances.get(id);
    if (instance) {
      instance.destroy();
      this.instances.delete(id);
    }
  }

  // Destroy all components
  destroyAll() {
    this.instances.forEach((instance, id) => {
      instance.destroy();
    });
    this.instances.clear();
  }
}

// Register components to factory
componentFactory.register('ProductCard', ProductCard);
componentFactory.register('FeatureCard', FeatureCard);
componentFactory.register('DropdownMenu', DropdownMenu);

// Global component manager instance
const componentManager = new ComponentManager();

// Export to global scope
window.ComponentFactory = ComponentFactory;
window.ProductCard = ProductCard;
window.FeatureCard = FeatureCard;
window.DropdownMenu = DropdownMenu;
window.ComponentManager = ComponentManager;
window.componentFactory = componentFactory;
window.componentManager = componentManager;

// Utility functions
const ComponentUtils = {
  // Lazy loading animation
  animateOnScroll() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    document.querySelectorAll('.product-card, .feature-card').forEach(el => {
      observer.observe(el);
    });
  },

  // Debounce function
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Throttle function
  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
};

window.ComponentUtils = ComponentUtils;

// Initialize after DOM loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize scroll animation
  ComponentUtils.animateOnScroll();
  
  // Temporarily disable dropdown menu JS, pure CSS test
  // const dropdownElements = document.querySelectorAll('.nav-dropdown');
  // dropdownElements.forEach(element => {
  //   new DropdownMenu(element);
  // });
  
  console.log('ShareTools component system initialized');
});