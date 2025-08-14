/* ShareTools 主JavaScript文件 */
/* 页面初始化和数据管理 */

// 应用程序主类
class ShareToolsApp {
  constructor() {
    this.productCards = [];
    this.featureCards = [];
    this.favoriteProducts = new Set();

    this.init();
  }

  // 初始化应用
  async init() {
    this.bindGlobalEvents();
    this.initNavigation();
    await this.loadData();
    this.initializeComponents();
  }

  // 初始化导航栏功能
  initNavigation() {
    console.log('初始化导航栏...');

    // 处理下拉菜单导航（只有Locations）
    const navDropdowns = document.querySelectorAll('.nav-dropdown');
    navDropdowns.forEach(dropdown => {
      const navLink = dropdown.querySelector('.nav-link');
      const dropdownMenu = dropdown.querySelector('.dropdown-menu');

      if (navLink && dropdownMenu) {
        // 下拉菜单链接 - 阻止默认行为，显示菜单
        navLink.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();

          // 关闭其他所有下拉菜单
          navDropdowns.forEach(otherDropdown => {
            if (otherDropdown !== dropdown) {
              const otherMenu = otherDropdown.querySelector('.dropdown-menu');
              if (otherMenu) {
                otherMenu.classList.remove('dropdown-active');
              }
            }
          });

          // 切换当前下拉菜单
          dropdownMenu.classList.toggle('dropdown-active');
        });

        // 移动设备支持
        navLink.addEventListener('touchstart', (e) => {
          e.preventDefault();
          dropdownMenu.classList.toggle('dropdown-active');
        });
      }
    });

    // 处理普通导航链接（The Things, About, List an Item）
    const regularNavLinks = document.querySelectorAll('.nav-item:not(.nav-dropdown) .nav-link');
    console.log(`Found ${regularNavLinks.length} regular navigation links`);

    regularNavLinks.forEach(link => {
      console.log(`Regular nav link: ${link.textContent.trim()} -> ${link.href}`);

      // 确保链接可以正常工作
      link.addEventListener('click', (e) => {
        console.log(`🔗 Clicking: ${link.textContent.trim()} -> ${link.href}`);

        // 不阻止默认行为，让链接正常跳转
        if (link.href && link.href !== '#') {
          console.log(`✅ Allowing navigation to: ${link.href}`);
          // 可以添加一个小延迟来确保日志可以看到
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

      // 添加视觉反馈
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

    // 点击页面其他地方关闭下拉菜单
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

    // ESC键关闭下拉菜单
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

    console.log('导航栏初始化完成');
  }

  // 加载数据（从API获取真实数据）
  async loadData() {
    try {
      // 显示加载状态
      this.showLoadingState();

      // 并行加载产品数据和特色功能数据
      const [productsResponse, featuresResponse] = await Promise.all([
        this.loadProductsData(),
        this.loadFeaturesData()
      ]);

      this.productsData = productsResponse;
      this.featuresData = featuresResponse;

      // 隐藏加载状态
      this.hideLoadingState();

    } catch (error) {
      console.error('加载数据失败:', error);
      // 如果API调用失败，使用备用数据
      this.loadFallbackData();
      this.hideLoadingState();
    }
  }

  // 从API加载产品数据
  async loadProductsData() {
    try {
      console.log('开始加载产品数据...');
      if (typeof ItemsAPI !== 'undefined') {
        console.log('ItemsAPI 可用，调用API...');
        const response = await ItemsAPI.getItems({ limit: 6, status: 'active' });
        console.log('API响应:', response);

        // 转换API数据格式为组件所需格式
        const transformedData = response.results.map(item => {
          console.log('Processing item:', item);

          // 获取图片URL
          let imageUrl = null;
          if (item.primary_image && item.primary_image.image) {
            imageUrl = item.primary_image.image;
          } else if (item.images && item.images.length > 0) {
            imageUrl = item.images[0].image;
          }

          // 获取最低价格
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
            image: imageUrl, // 添加真实图片
            badge: this.getItemBadge(item),
            isFavorited: false,
            originalData: item // 保存原始数据以备后用
          };
        });
        console.log('转换后的产品数据:', transformedData);
        return transformedData;
      } else {
        console.warn('ItemsAPI 未定义，将使用备用数据');
        throw new Error('ItemsAPI 未定义');
      }
    } catch (error) {
      console.error('从API加载产品数据失败:', error);
      throw error;
    }
  }

  // 加载备用数据（静态数据）
  loadFallbackData() {
    console.log('使用备用数据');

    // 产品数据
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

    // 特色功能数据
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

  // 从API加载特色功能数据
  async loadFeaturesData() {
    // 特色功能数据通常是静态的，但也可以从API获取
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

  // 根据分类获取物品图标
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

  // 根据物品属性获取徽章
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

  // 显示加载状态
  showLoadingState() {
    const productsContainer = document.getElementById('products-container');
    const featuresContainer = document.getElementById('features-container');

    if (productsContainer) {
      productsContainer.innerHTML = '<div class="loading-spinner">加载中...</div>';
    }

    if (featuresContainer) {
      featuresContainer.innerHTML = '<div class="loading-spinner">加载中...</div>';
    }
  }

  // 隐藏加载状态
  hideLoadingState() {
    // 加载状态会在渲染组件时被替换，这里可以添加额外的清理逻辑
    console.log('数据加载完成');
  }

  // 初始化组件
  initializeComponents() {
    this.renderProductCards();
    this.renderFeatureCards();
  }

  // 渲染产品卡片
  renderProductCards() {
    console.log('开始渲染产品卡片...');
    const container = document.getElementById('products-container');
    if (!container) {
      console.warn('产品容器未找到');
      return;
    }

    // 检查数据是否存在
    if (!this.productsData || this.productsData.length === 0) {
      console.warn('产品数据为空，显示占位符');
      container.innerHTML = `
        <div class="no-products-message">
          <h3>暂无物品展示</h3>
          <p>目前还没有活跃的物品，请稍后再来查看或 <a href="/list-item/">发布您的物品</a>。</p>
        </div>
      `;
      return;
    }

    console.log('产品数据:', this.productsData);

    // 检查componentManager是否存在
    if (typeof componentManager === 'undefined') {
      console.error('componentManager 未定义，尝试等待加载...');
      setTimeout(() => {
        if (typeof componentManager !== 'undefined') {
          this.renderProductCards();
        } else {
          this.renderProductCardsFallback(container);
        }
      }, 500);
      return;
    }

    // 清空容器
    container.innerHTML = '';

    // 创建产品卡片
    try {
      this.productCards = componentManager.createProductCards(this.productsData, container);
      console.log('产品卡片创建成功:', this.productCards);
    } catch (error) {
      console.error('创建产品卡片失败:', error);
      this.renderProductCardsFallback(container);
      return;
    }

    // 绑定产品卡片事件
    this.bindProductEvents();
  }

  // 备用的产品卡片渲染方法
  renderProductCardsFallback(container) {
    console.log('使用备用渲染方法...');
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

  // 备用的星级评分渲染
  renderStarsFallback(rating) {
    const maxStars = 5;
    let starsHtml = '';
    for (let i = 1; i <= maxStars; i++) {
      const isFilled = i <= rating;
      starsHtml += `<div class="star ${isFilled ? 'filled' : ''}"></div>`;
    }
    return starsHtml;
  }

  // 渲染特色功能卡片
  renderFeatureCards() {
    console.log('开始渲染特色功能卡片...');
    const container = document.getElementById('features-container');
    if (!container) {
      console.warn('特色功能容器未找到');
      return;
    }

    // 检查数据是否存在
    if (!this.featuresData || this.featuresData.length === 0) {
      console.warn('特色功能数据为空');
      container.innerHTML = '<div class="no-features-message"><p>暂无特色功能展示</p></div>';
      return;
    }

    console.log('特色功能数据:', this.featuresData);

    // 检查componentManager是否存在
    if (typeof componentManager === 'undefined') {
      console.error('componentManager 未定义，使用备用渲染方法...');
      this.renderFeatureCardsFallback(container);
      return;
    }

    // 清空容器
    container.innerHTML = '';

    // 创建特色功能卡片
    try {
      this.featureCards = componentManager.createFeatureCards(this.featuresData, container);
      console.log('特色功能卡片创建成功:', this.featureCards);
    } catch (error) {
      console.error('创建特色功能卡片失败:', error);
      this.renderFeatureCardsFallback(container);
      return;
    }

    // 绑定特色功能事件
    this.bindFeatureEvents();
  }

  // 备用的特色功能卡片渲染方法
  renderFeatureCardsFallback(container) {
    console.log('使用备用特色功能渲染方法...');
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

  // 绑定产品卡片事件
  bindProductEvents() {
    const container = document.getElementById('products-container');
    if (!container) return;

    // 收藏切换事件
    container.addEventListener('favoriteToggle', (e) => {
      const { productId, isFavorited } = e.detail;

      if (isFavorited) {
        this.favoriteProducts.add(productId);
      } else {
        this.favoriteProducts.delete(productId);
      }

      console.log(`产品 ${productId} ${isFavorited ? '已添加到' : '已从'}收藏夹${isFavorited ? '' : '移除'}`);

      // 更新收藏数量显示
      this.updateFavoriteCount();
    });

    // 产品点击事件
    container.addEventListener('productClick', (e) => {
      const { productId, product } = e.detail;
      console.log(`点击了产品: ${product.title}`);

      // 这里可以添加跳转到产品详情页的逻辑
      this.showProductDetails(product);
    });

    // 产品悬停事件
    container.addEventListener('productHover', (e) => {
      const { product } = e.detail;
      // 可以在这里添加悬停时的额外效果
    });
  }

  // 绑定特色功能事件
  bindFeatureEvents() {
    const container = document.getElementById('features-container');
    if (!container) return;

    // 特色功能点击事件
    container.addEventListener('featureClick', (e) => {
      const { feature } = e.detail;
      console.log(`点击了特色功能: ${feature.title}`);

      // 这里可以添加显示功能详情的逻辑
      this.showFeatureDetails(feature);
    });
  }

  // 绑定全局事件
  bindGlobalEvents() {
    // 购物车点击事件
    const cartIcon = document.querySelector('.cart-icon');
    if (cartIcon) {
      cartIcon.addEventListener('click', () => {
        this.toggleCart();
      });
    }

    // 导航链接点击事件
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const href = link.getAttribute('href');
        this.navigateTo(href);
      });
    });

    // 响应式菜单切换
    window.addEventListener('resize', ComponentUtils.debounce(() => {
      this.handleResize();
    }, 250));

    // 滚动事件
    window.addEventListener('scroll', ComponentUtils.throttle(() => {
      this.handleScroll();
    }, 100));
  }

  // 显示产品详情
  showProductDetails(product) {
    // 简单的模态框显示产品信息
    const modal = this.createModal({
      title: product.title,
      content: `
        <div class="product-details">
          <div class="product-icon-large">${product.icon}</div>
          <p><strong>评分:</strong> ${product.rating}/5 星</p>
          <p><strong>价格:</strong> ${product.currency}${product.price}/${product.period}</p>
          <p><strong>状态:</strong> ${product.badge ? product.badge.text : '普通'}</p>
          <p>这是一个优秀的工具，可以帮助您提高工作效率。</p>
        </div>
      `,
      actions: [
        { text: '立即租用', class: 'btn-primary', action: () => this.rentProduct(product) },
        { text: '关闭', class: 'btn-secondary', action: () => this.closeModal() }
      ]
    });
  }

  // 显示特色功能详情
  showFeatureDetails(feature) {
    const modal = this.createModal({
      title: feature.title,
      content: `
        <div class="feature-details">
          <div class="feature-icon-large" style="background-color: ${feature.iconColor}">
            ${feature.icon}
          </div>
          <p>${feature.description}</p>
          <p>了解更多关于这个特色功能的详细信息。</p>
        </div>
      `,
      actions: [
        { text: '了解更多', class: 'btn-primary', action: () => this.learnMore(feature) },
        { text: '关闭', class: 'btn-secondary', action: () => this.closeModal() }
      ]
    });
  }

  // 创建模态框
  createModal({ title, content, actions }) {
    // 移除现有模态框
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

    // 绑定事件
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

  // 关闭模态框
  closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
      modal.remove();
      document.body.style.overflow = '';
    }
  }

  // 切换购物车
  toggleCart() {
    console.log('切换购物车显示');
    // 这里可以实现购物车的显示/隐藏逻辑
  }

  // 导航处理
  navigateTo(href) {
    console.log(`导航到: ${href}`);
    // 这里可以实现单页应用的路由逻辑
  }

  // 租用产品
  rentProduct(product) {
    console.log(`租用产品: ${product.title}`);
    this.closeModal();
    // 这里可以实现租用逻辑
  }

  // 了解更多
  learnMore(feature) {
    console.log(`了解更多: ${feature.title}`);
    this.closeModal();
    // 这里可以实现跳转到详情页的逻辑
  }

  // 更新收藏数量
  updateFavoriteCount() {
    const count = this.favoriteProducts.size;
    const cartIcon = document.querySelector('.cart-icon');
    if (cartIcon && count > 0) {
      cartIcon.setAttribute('data-count', count);
    } else if (cartIcon) {
      cartIcon.removeAttribute('data-count');
    }
  }

  // 处理窗口大小变化
  handleResize() {
    // 响应式处理逻辑
    const width = window.innerWidth;
    if (width < 768) {
      document.body.classList.add('mobile');
    } else {
      document.body.classList.remove('mobile');
    }
  }

  // 处理滚动事件
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

// 模态框和加载状态样式（动态添加到页面）
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

// 添加模态框样式到页面
const styleSheet = document.createElement('style');
styleSheet.textContent = modalStyles;
document.head.appendChild(styleSheet);

// 全局应用实例
let app;

// DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', async () => {
  try {
    app = new ShareToolsApp();
    window.shareToolsApp = app;

    console.log('ShareTools 应用已初始化');
  } catch (error) {
    console.error('应用初始化失败:', error);
  }
});

// 导出到全局作用域
window.ShareToolsApp = ShareToolsApp;