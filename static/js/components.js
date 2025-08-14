/* ShareTools 组件JavaScript文件 */
/* 实现组件的交互功能和动态行为 */

// 组件工厂类
class ComponentFactory {
  constructor() {
    this.components = new Map();
  }

  // 注册组件
  register(name, component) {
    this.components.set(name, component);
  }

  // 创建组件实例
  create(name, ...args) {
    const Component = this.components.get(name);
    if (!Component) {
      throw new Error(`组件 ${name} 未注册`);
    }
    return new Component(...args);
  }
}

// 全局组件工厂实例
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

  // 初始化组件
  init() {
    this.render();
    this.bindEvents();
  }

  // 渲染组件HTML
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

  // 渲染星级评分
  renderStars(rating) {
    const maxStars = 5;
    let starsHtml = '';
    
    for (let i = 1; i <= maxStars; i++) {
      const isFilled = i <= rating;
      starsHtml += `<div class="star ${isFilled ? 'filled' : ''}"></div>`;
    }
    
    return starsHtml;
  }

  // 绑定事件
  bindEvents() {
    if (!this.element) return;

    // 收藏按钮点击事件
    const favoriteBtn = this.element.querySelector('.favorite-btn');
    favoriteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleFavorite();
    });

    // 卡片点击事件
    this.element.addEventListener('click', () => {
      this.onClick();
    });

    // 卡片悬停事件
    this.element.addEventListener('mouseenter', () => {
      this.onHover();
    });

    this.element.addEventListener('mouseleave', () => {
      this.onLeave();
    });
  }

  // 切换收藏状态
  toggleFavorite() {
    this.isFavorited = !this.isFavorited;
    const favoriteBtn = this.element.querySelector('.favorite-btn');
    
    favoriteBtn.innerHTML = this.isFavorited ? '❤️' : '🤍';
    favoriteBtn.className = `favorite-btn ${this.isFavorited ? 'active' : ''}`;
    favoriteBtn.setAttribute('aria-label', this.isFavorited ? '取消收藏' : '添加收藏');

    // 触发自定义事件
    this.element.dispatchEvent(new CustomEvent('favoriteToggle', {
      detail: { 
        productId: this.data.id, 
        isFavorited: this.isFavorited,
        product: this.data
      }
    }));

    // 添加动画效果
    favoriteBtn.style.transform = 'scale(1.2)';
    setTimeout(() => {
      favoriteBtn.style.transform = 'scale(1)';
    }, 150);
  }

  // 卡片点击处理
  onClick() {
    this.element.dispatchEvent(new CustomEvent('productClick', {
      detail: { 
        productId: this.data.id,
        product: this.data
      }
    }));
  }

  // 卡片悬停处理
  onHover() {
    this.element.dispatchEvent(new CustomEvent('productHover', {
      detail: { 
        productId: this.data.id,
        product: this.data
      }
    }));
  }

  // 卡片离开处理
  onLeave() {
    this.element.dispatchEvent(new CustomEvent('productLeave', {
      detail: { 
        productId: this.data.id,
        product: this.data
      }
    }));
  }

  // 更新数据
  updateData(newData) {
    this.data = { ...this.data, ...newData };
    this.render();
    this.bindEvents();
  }

  // 销毁组件
  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
  }
}

// ===== FeatureCard 组件 =====
class FeatureCard {
  constructor(data, container) {
    this.data = data;
    this.container = container;
    this.element = null;
    
    this.init();
  }

  // 初始化组件
  init() {
    this.render();
    this.bindEvents();
  }

  // 渲染组件HTML
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

  // 绑定事件
  bindEvents() {
    if (!this.element) return;

    // 卡片点击事件
    this.element.addEventListener('click', () => {
      this.onClick();
    });

    // 添加悬停动画
    this.element.addEventListener('mouseenter', () => {
      const icon = this.element.querySelector('.feature-icon');
      icon.style.transform = 'scale(1.1) rotate(5deg)';
    });

    this.element.addEventListener('mouseleave', () => {
      const icon = this.element.querySelector('.feature-icon');
      icon.style.transform = 'scale(1) rotate(0deg)';
    });
  }

  // 卡片点击处理
  onClick() {
    this.element.dispatchEvent(new CustomEvent('featureClick', {
      detail: { 
        featureId: this.data.id,
        feature: this.data
      }
    }));
  }

  // 更新数据
  updateData(newData) {
    this.data = { ...this.data, ...newData };
    this.render();
    this.bindEvents();
  }

  // 销毁组件
  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
  }
}

// ===== DropdownMenu 组件 =====
class DropdownMenu {
  constructor(element) {
    this.element = element;
    this.dropdownMenu = element.querySelector('.dropdown-menu');
    this.navLink = element.querySelector('.nav-link');
    
    this.init();
  }

  // 初始化组件
  init() {
    this.setupAccessibility();
    this.bindKeyboardEvents();
  }

  // 设置无障碍属性
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

  // 绑定键盘事件（保留无障碍功能）
  bindKeyboardEvents() {
    // 键盘导航支持
    this.navLink.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        // 键盘触发时手动切换显示状态
        this.element.classList.toggle('keyboard-active');
      } else if (e.key === 'Escape') {
        this.element.classList.remove('keyboard-active');
        this.navLink.blur();
      }
    });

    // 下拉链接键盘导航
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

// ===== 组件管理器 =====
class ComponentManager {
  constructor() {
    this.instances = new Map();
  }

  // 创建产品卡片
  createProductCard(data, container) {
    const card = new ProductCard(data, container);
    this.instances.set(`product-${data.id}`, card);
    return card;
  }

  // 创建特色功能卡片
  createFeatureCard(data, container) {
    const card = new FeatureCard(data, container);
    this.instances.set(`feature-${data.id}`, card);
    return card;
  }

  // 批量创建产品卡片
  createProductCards(dataArray, container) {
    const cards = [];
    dataArray.forEach(data => {
      const card = this.createProductCard(data, container);
      cards.push(card);
    });
    return cards;
  }

  // 批量创建特色功能卡片
  createFeatureCards(dataArray, container) {
    const cards = [];
    dataArray.forEach(data => {
      const card = this.createFeatureCard(data, container);
      cards.push(card);
    });
    return cards;
  }

  // 获取组件实例
  getInstance(id) {
    return this.instances.get(id);
  }

  // 销毁组件
  destroyComponent(id) {
    const instance = this.instances.get(id);
    if (instance) {
      instance.destroy();
      this.instances.delete(id);
    }
  }

  // 销毁所有组件
  destroyAll() {
    this.instances.forEach((instance, id) => {
      instance.destroy();
    });
    this.instances.clear();
  }
}

// 注册组件到工厂
componentFactory.register('ProductCard', ProductCard);
componentFactory.register('FeatureCard', FeatureCard);
componentFactory.register('DropdownMenu', DropdownMenu);

// 全局组件管理器实例
const componentManager = new ComponentManager();

// 导出到全局作用域
window.ComponentFactory = ComponentFactory;
window.ProductCard = ProductCard;
window.FeatureCard = FeatureCard;
window.DropdownMenu = DropdownMenu;
window.ComponentManager = ComponentManager;
window.componentFactory = componentFactory;
window.componentManager = componentManager;

// 工具函数
const ComponentUtils = {
  // 延迟加载动画
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

  // 防抖函数
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

  // 节流函数
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

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  // 初始化滚动动画
  ComponentUtils.animateOnScroll();
  
  // 暂时禁用下拉菜单JS，纯CSS测试
  // const dropdownElements = document.querySelectorAll('.nav-dropdown');
  // dropdownElements.forEach(element => {
  //   new DropdownMenu(element);
  // });
  
  console.log('ShareTools 组件系统已初始化');
});