/**
 * 商品详情页面交互功能
 * 处理图片切换、日期选择、价格计算、标签页切换等功能
 */

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('Product detail page initialization started');
    
    // 初始化各个功能模块
    initImageGallery();
    initDatePicker();
    initTabs();
    initButtons();
    initTooltips();
    
    // 初始化价格显示
    initPriceDisplay();
    
    console.log('Product detail page initialization completed');
});

/**
 * 图片画廊功能
 */
function initImageGallery() {
    const mainImage = document.getElementById('mainImage');
    const thumbnails = document.querySelectorAll('.thumbnail-btn');
    
    if (!mainImage) {
        console.warn('Main image element not found');
        return;
    }
    
    // 添加主图加载错误处理
    mainImage.addEventListener('error', function() {
        console.warn('Failed to load main image:', this.src);
        this.src = '/static/images/pressure_washer.png'; // 设置备用图片
    });
    
    if (thumbnails.length === 0) {
        console.warn('No thumbnail images found');
        return;
    }
    
    thumbnails.forEach((thumbnail, index) => {
        const thumbnailImg = thumbnail.querySelector('.thumbnail-image');
        
        // 添加缩略图加载错误处理
        if (thumbnailImg) {
            thumbnailImg.addEventListener('error', function() {
                console.warn('Failed to load thumbnail image:', this.src);
                this.src = '/static/images/pressure_washer.png';
            });
        }
        
        thumbnail.addEventListener('click', function() {
            const newImageSrc = this.dataset.image;
            
            if (newImageSrc) {
                // 预加载新图片以确保能正常显示
                const img = new Image();
                img.onload = function() {
                    // 更新主图
                    mainImage.src = newImageSrc;
                    if (thumbnailImg) {
                        mainImage.alt = thumbnailImg.alt || 'Product Image';
                    }
                    
                    // 更新活动状态
                    thumbnails.forEach(btn => btn.classList.remove('active'));
                    thumbnail.classList.add('active');
                    
                    // 添加切换动画
                    mainImage.style.opacity = '0.8';
                    setTimeout(() => {
                        mainImage.style.opacity = '1';
                    }, 150);
                    
                    console.log('Image switched successfully:', newImageSrc);
                };
                
                img.onerror = function() {
                    console.error('Failed to preload image:', newImageSrc);
                    // 仍然尝试更新，可能是缓存问题
                    mainImage.src = newImageSrc;
                };
                
                img.src = newImageSrc;
            }
        });
        
        // 添加键盘支持
        thumbnail.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    });
    
    console.log('Image gallery functionality initialized with', thumbnails.length, 'thumbnails');
}

/**
 * 日期选择和价格计算功能
 */
function initDatePicker() {
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const rentalSummary = document.getElementById('rentalSummary');
    const totalDaysSpan = document.getElementById('totalDays');
    const totalPriceSpan = document.getElementById('totalPrice');
    
    if (!startDateInput || !endDateInput) {
        console.warn('Date picker elements not found');
        return;
    }
    
    // 设置最小日期为今天
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    startDateInput.min = todayString;
    endDateInput.min = todayString;
    
    // 监听开始日期变化
    startDateInput.addEventListener('change', function() {
        const startDate = new Date(this.value);
        const minEndDate = new Date(startDate);
        minEndDate.setDate(minEndDate.getDate() + 1);
        
        endDateInput.min = minEndDate.toISOString().split('T')[0];
        
        // 如果结束日期早于开始日期，清空结束日期
        if (endDateInput.value && new Date(endDateInput.value) <= startDate) {
            endDateInput.value = '';
        }
        
        calculatePrice();
    });
    
    // 监听结束日期变化
    endDateInput.addEventListener('change', function() {
        calculatePrice();
    });
    
    /**
     * 计算租金
     */
    function calculatePrice() {
        try {
            const startDate = startDateInput.value;
            const endDate = endDateInput.value;
            
            if (!startDate || !endDate) {
                if (rentalSummary) {
                    rentalSummary.style.display = 'none';
                }
                // 重置主要价格显示为最低价格
                updateMainPriceDisplay();
                return;
            }
            
            const start = new Date(startDate);
            const end = new Date(endDate);
            
            // 验证日期有效性
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                console.error('Invalid date values provided');
                if (rentalSummary) {
                    rentalSummary.style.display = 'none';
                }
                updateMainPriceDisplay();
                return;
            }
            
            const diffTime = end - start;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays <= 0) {
                if (rentalSummary) {
                    rentalSummary.style.display = 'none';
                }
                console.warn('End date must be after start date');
                updateMainPriceDisplay();
                return;
            }
            
            // 使用数据库中的价格数据进行计算
            const priceData = calculatePriceFromDatabase(diffDays);
            
            // 更新主要价格显示
            updateMainPriceDisplay(priceData.dailyRate, diffDays);
            
            // 安全地更新显示
            if (totalDaysSpan) {
                totalDaysSpan.textContent = diffDays + ' day' + (diffDays > 1 ? 's' : '');
            }
            if (totalPriceSpan) {
                totalPriceSpan.textContent = '£' + priceData.totalPrice.toFixed(0) + priceData.discountMessage;
            }
            if (rentalSummary) {
                rentalSummary.style.display = 'block';
                rentalSummary.classList.add('fade-in');
            }
            
            // 更新每日费率显示
            const dailyRateDisplay = document.getElementById('dailyRateDisplay');
            if (dailyRateDisplay) {
                dailyRateDisplay.textContent = '£' + priceData.dailyRate.toFixed(0) + ' / day';
            }
            
            console.log('Price calculated successfully:', {
                days: diffDays,
                dailyRate: priceData.dailyRate,
                totalPrice: priceData.totalPrice.toFixed(0),
                discount: priceData.discountMessage,
                priceBreakdown: priceData.breakdown
            });
            
        } catch (error) {
            console.error('Error in price calculation:', error);
            if (rentalSummary) {
                rentalSummary.style.display = 'none';
            }
            updateMainPriceDisplay();
        }
    }
    
    /**
     * 使用数据库价格数据计算租金
     */
    function calculatePriceFromDatabase(days) {
        // 获取产品数据
        const productData = window.productData || {
            minDailyPrice: 20,
            prices: [
                { duration: 1, totalPrice: 20, dailyPrice: 20 },
                { duration: 3, totalPrice: 54, dailyPrice: 18 },
                { duration: 7, totalPrice: 119, dailyPrice: 17 }
            ]
        };
        
        console.log('Using product data for calculation:', productData);
        
        // 如果没有价格数据，使用默认计算
        if (!productData.prices || productData.prices.length === 0) {
            const dailyRate = productData.minDailyPrice || 20;
            return {
                totalPrice: dailyRate * days,
                dailyRate: dailyRate,
                discountMessage: '',
                breakdown: [{ duration: 1, segments: days, days: days, dailyRate: dailyRate, total: dailyRate * days }],
                bestPrice: { duration: 1, dailyPrice: dailyRate, totalPrice: dailyRate }
            };
        }
        
        // 按持续时间升序排序价格，找到最适合的价格层级
        const sortedPrices = [...productData.prices].sort((a, b) => a.duration - b.duration);
        
        // 找到最适合的价格层级（小于等于租赁天数的最大层级）
        let bestPrice = sortedPrices[0]; // 默认使用最小层级
        for (const price of sortedPrices) {
            if (price.duration <= days) {
                bestPrice = price;
            } else {
                break;
            }
        }
        
        // 计算总价格
        let totalPrice;
        let dailyRate = bestPrice.dailyPrice;
        let discountMessage = '';
        
        if (bestPrice.duration === 1) {
            // 使用日租价格
            totalPrice = dailyRate * days;
        } else {
            // 使用套餐价格计算
            const fullPackages = Math.floor(days / bestPrice.duration);
            const remainingDays = days % bestPrice.duration;
            
            totalPrice = fullPackages * bestPrice.totalPrice;
            
            // 剩余天数使用日租价格
            if (remainingDays > 0) {
                totalPrice += remainingDays * dailyRate;
            }
        }
        
        // 设置折扣信息
        if (bestPrice.duration >= 7) {
            discountMessage = ' (Weekly rate applied)';
        } else if (bestPrice.duration >= 3) {
            discountMessage = ' (Multi-day discount)';
        }
        
        const breakdown = [{
            duration: bestPrice.duration,
            segments: Math.floor(days / bestPrice.duration),
            days: days,
            dailyRate: dailyRate,
            total: totalPrice
        }];
        
        return {
            totalPrice: totalPrice,
            dailyRate: dailyRate,
            discountMessage: discountMessage,
            breakdown: breakdown,
            bestPrice: bestPrice
        };
    }
    

    
    console.log('Date picker functionality initialized');
}

/**
 * 更新主要价格显示
 */
function updateMainPriceDisplay(dailyRate = null, days = null) {
    const mainPriceDisplay = document.getElementById('mainPriceDisplay');
    const discountNote = document.getElementById('discountNote');
    
    if (!mainPriceDisplay) return;
    
    const productData = window.productData || { minDailyPrice: 20 };
    
    if (dailyRate && days) {
        // 显示当前选择期间的价格
        mainPriceDisplay.textContent = '£' + dailyRate.toFixed(0);
        
        if (discountNote) {
            if (days >= 7) {
                discountNote.textContent = 'Weekly rate - Best value for 7+ days';
            } else if (days >= 3) {
                discountNote.textContent = '10% discount for 3+ day rentals';
            } else {
                discountNote.textContent = 'Daily rate';
            }
        }
    } else {
        // 显示最低价格
        const minPrice = productData.minDailyPrice || 20;
        mainPriceDisplay.textContent = '£' + minPrice.toFixed(0);
        
        if (discountNote) {
            discountNote.textContent = '10% discount for 3+ day rentals';
        }
    }
}

/**
 * 初始化价格显示
 */
function initPriceDisplay() {
    const productData = window.productData || { minDailyPrice: 20, itemValue: 500 };
    
    // 设置初始价格显示
    updateMainPriceDisplay();
    
    // 设置押金显示
    const depositDisplay = document.getElementById('depositDisplay');
    if (depositDisplay) {
        depositDisplay.textContent = 'Deposit: £' + (productData.itemValue || 500).toFixed(0);
    }
    
    console.log('Price display initialized with product data:', productData);
}

/**
 * 标签页切换功能
 */
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');
    
    if (tabButtons.length === 0 || tabPanels.length === 0) {
        console.warn('Tab elements not found');
        return;
    }
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = this.dataset.tab;
            
            // 移除所有活动状态
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanels.forEach(panel => panel.classList.remove('active'));
            
            // 设置当前活动状态
            this.classList.add('active');
            const targetPanel = document.getElementById(targetTab);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
            
            console.log('Tab switched to:', targetTab);
        });
    });
    
    console.log('Tab functionality initialized');
}

/**
 * 按钮交互功能
 */
function initButtons() {
    // 收藏按钮
    const favoriteBtn = document.getElementById('favoriteBtn');
    if (favoriteBtn) {
        favoriteBtn.addEventListener('click', function() {
            this.classList.toggle('active');
            const icon = this.querySelector('i');
                            if (this.classList.contains('active')) {
                    icon.className = 'fas fa-heart';
                    showToast('Added to favorites');
                } else {
                    icon.className = 'far fa-heart';
                    showToast('Removed from favorites');
                }
        });
    }
    
    // 加入购物车按钮
    const addToCartBtn = document.getElementById('addToCartBtn');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', function() {
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;
            
            if (!startDate || !endDate) {
                showToast('Please select rental period first', 'warning');
                return;
            }
            
            // 添加加载状态
            this.classList.add('loading');
            this.disabled = true;
            const originalText = this.innerHTML;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
            
            // 模拟添加到购物车
            setTimeout(() => {
                this.classList.remove('loading');
                this.disabled = false;
                this.innerHTML = originalText;
                showToast('Added to cart successfully', 'success');
            }, 1500);
        });
    }
    
    // 立即预订按钮
    const rentNowBtn = document.getElementById('rentNowBtn');
    if (rentNowBtn) {
        rentNowBtn.addEventListener('click', function() {
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;
            
            if (!startDate || !endDate) {
                showToast('Please select rental period first', 'warning');
                return;
            }
            
            // 添加加载状态
            this.classList.add('loading');
            this.disabled = true;
            const originalText = this.innerHTML;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Booking...';
            
            // 模拟预订流程
            setTimeout(() => {
                this.classList.remove('loading');
                this.disabled = false;
                this.innerHTML = originalText;
                showToast('Booking successful! Please check order details', 'success');
            }, 2000);
        });
    }
    
    // 查看地图按钮
    const viewMapBtn = document.querySelector('.view-map-btn');
    if (viewMapBtn) {
        viewMapBtn.addEventListener('click', function() {
            // 获取地址信息
            const locationInfo = document.querySelector('.location-info');
            const addressText = locationInfo ? locationInfo.textContent.trim() : '';
            
            // 获取地址标签
            const locationTag = document.querySelector('.location-tag');
            const areaTag = document.querySelector('.area-tag');
            
            // 构建搜索查询
            let searchQuery = addressText;
            if (locationTag && locationTag.textContent) {
                searchQuery = locationTag.textContent.trim();
            }
            if (areaTag && areaTag.textContent) {
                searchQuery += ', ' + areaTag.textContent.trim();
            }
            
            // 如果有地址信息，打开Google地图
            if (searchQuery) {
                const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery)}`;
                window.open(mapUrl, '_blank');
                console.log('Opening map for location:', searchQuery);
            } else {
                showToast('Location information not available');
            }
        });
    }
    
    console.log('Button functionality initialized');
}

/**
 * 工具提示功能
 */
function initTooltips() {
    const elementsWithTooltips = document.querySelectorAll('[title]');
    
    elementsWithTooltips.forEach(element => {
        element.addEventListener('mouseenter', function() {
            const tooltipText = this.title;
            if (tooltipText) {
                showTooltip(this, tooltipText);
                this.title = ''; // 临时移除title避免浏览器默认提示
            }
        });
        
        element.addEventListener('mouseleave', function() {
            hideTooltip();
            // 恢复title属性
            const tooltip = document.querySelector('.custom-tooltip');
            if (tooltip) {
                this.title = tooltip.textContent;
            }
        });
    });
}

/**
 * 显示自定义工具提示
 */
function showTooltip(element, text) {
    hideTooltip(); // 先隐藏现有的
    
    const tooltip = document.createElement('div');
    tooltip.className = 'custom-tooltip';
    tooltip.textContent = text;
    tooltip.style.cssText = `
        position: absolute;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 1000;
        pointer-events: none;
        white-space: nowrap;
    `;
    
    document.body.appendChild(tooltip);
    
    const rect = element.getBoundingClientRect();
    tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
    tooltip.style.top = rect.top - tooltip.offsetHeight - 8 + 'px';
}

/**
 * 隐藏工具提示
 */
function hideTooltip() {
    const tooltip = document.querySelector('.custom-tooltip');
    if (tooltip) {
        tooltip.remove();
    }
}

/**
 * 显示Toast消息
 */
function showToast(message, type = 'info') {
    // 移除现有的toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // 根据类型设置图标和颜色
    let icon = 'fas fa-info-circle';
    let color = '#2d7efe';
    
    switch (type) {
        case 'success':
            icon = 'fas fa-check-circle';
            color = '#28a745';
            break;
        case 'warning':
            icon = 'fas fa-exclamation-triangle';
            color = '#ffc107';
            break;
        case 'error':
            icon = 'fas fa-times-circle';
            color = '#dc3545';
            break;
    }
    
    toast.innerHTML = `
        <i class="${icon}" style="color: ${color}; margin-right: 8px;"></i>
        ${message}
    `;
    
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        color: #333;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        display: flex;
        align-items: center;
        font-weight: 500;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        border-left: 4px solid ${color};
    `;
    
    document.body.appendChild(toast);
    
    // 显示动画
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 10);
    
    // 自动隐藏
    setTimeout(() => {
        toast.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }, 3000);
}

/**
 * 页面滚动优化
 */
function initScrollOptimization() {
    let ticking = false;
    
    function updateScrollEffects() {
        const scrollY = window.scrollY;
        
        // 商品图片视差效果
        const gallery = document.querySelector('.gallery-main-image');
        if (gallery) {
            const rect = gallery.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                const parallax = (window.innerHeight - rect.top) * 0.1;
                gallery.style.transform = `translateY(${parallax}px)`;
            }
        }
        
        ticking = false;
    }
    
    function requestScrollUpdate() {
        if (!ticking) {
            requestAnimationFrame(updateScrollEffects);
            ticking = true;
        }
    }
    
    window.addEventListener('scroll', requestScrollUpdate);
}

/**
 * 性能监控
 */
function initPerformanceMonitoring() {
    // 监控页面加载性能
    window.addEventListener('load', () => {
        if ('performance' in window) {
            const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
            console.log(`Product detail page load time: ${loadTime}ms`);
        }
    });
    
    // 监控交互性能
    let interactionCount = 0;
    document.addEventListener('click', () => {
        interactionCount++;
        if (interactionCount % 10 === 0) {
            console.log(`User interaction count: ${interactionCount}`);
        }
    });
}

/**
 * 错误处理
 */
function initErrorHandling() {
    window.addEventListener('error', (e) => {
        console.error('Page error:', e.error);
        // 可以在这里添加错误上报逻辑
    });
    
    window.addEventListener('unhandledrejection', (e) => {
        console.error('Unhandled Promise error:', e.reason);
        // 可以在这里添加错误上报逻辑
    });
}

/**
 * 响应式图片加载
 */
function initLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    observer.unobserve(img);
                }
            });
        });
        
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
}

// 初始化所有功能
document.addEventListener('DOMContentLoaded', () => {
    initScrollOptimization();
    initPerformanceMonitoring();
    initErrorHandling();
    initLazyLoading();
});

// 页面可见性API - 优化性能
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        // 页面不可见时暂停一些动画或定时器
        console.log('Page hidden, pausing non-essential features');
    } else {
        // 页面可见时恢复功能
        console.log('Page visible, resuming features');
    }
});

// 导出一些方法供其他脚本使用
window.ProductDetail = {
    showToast,
    calculatePrice: () => {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        if (startDate && endDate) {
            // 触发价格计算
            document.getElementById('endDate').dispatchEvent(new Event('change'));
        }
    }
};