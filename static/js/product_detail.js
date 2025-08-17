/**
 * Product detail page interactive functionality
 * Handles image switching, date selection, price calculation, tab switching and other features
 */

// Initialize after page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Product detail page initialization started');
    
    // Initialize various functional modules
    initImageGallery();
    initDatePicker();
    initTabs();
    initButtons();
    initTooltips();
    
    // Initialize price display
    initPriceDisplay();
    
    console.log('Product detail page initialization completed');
});

/**
 * Image gallery functionality
 */
function initImageGallery() {
    const mainImage = document.getElementById('mainImage');
    const thumbnails = document.querySelectorAll('.thumbnail-btn');
    
    if (!mainImage) {
        console.warn('Main image element not found');
        return;
    }
    
    // Add main image loading error handling
    mainImage.addEventListener('error', function() {
        console.warn('Failed to load main image:', this.src);
        this.src = '/static/images/pressure_washer.png'; // Set fallback image
    });
    
    if (thumbnails.length === 0) {
        console.warn('No thumbnail images found');
        return;
    }
    
    thumbnails.forEach((thumbnail, index) => {
        const thumbnailImg = thumbnail.querySelector('.thumbnail-image');
        
        // Add thumbnail loading error handling
        if (thumbnailImg) {
            thumbnailImg.addEventListener('error', function() {
                console.warn('Failed to load thumbnail image:', this.src);
                this.src = '/static/images/pressure_washer.png';
            });
        }
        
        thumbnail.addEventListener('click', function() {
            const newImageSrc = this.dataset.image;
            
            if (newImageSrc) {
                // Preload new image to ensure proper display
                const img = new Image();
                img.onload = function() {
                    // Update main image
                    mainImage.src = newImageSrc;
                    if (thumbnailImg) {
                        mainImage.alt = thumbnailImg.alt || 'Product Image';
                    }
                    
                    // Update active state
                    thumbnails.forEach(btn => btn.classList.remove('active'));
                    thumbnail.classList.add('active');
                    
                    // Add switching animation
                    mainImage.style.opacity = '0.8';
                    setTimeout(() => {
                        mainImage.style.opacity = '1';
                    }, 150);
                    
                    console.log('Image switched successfully:', newImageSrc);
                };
                
                img.onerror = function() {
                    console.error('Failed to preload image:', newImageSrc);
                    // Still try to update, might be a cache issue
                    mainImage.src = newImageSrc;
                };
                
                img.src = newImageSrc;
            }
        });
        
        // Add keyboard support
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
 * Date selection and price calculation functionality
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
    
    // Set minimum date to today
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    startDateInput.min = todayString;
    endDateInput.min = todayString;
    
    // Listen for start date changes
    startDateInput.addEventListener('change', function() {
        const startDate = new Date(this.value);
        const minEndDate = new Date(startDate);
        minEndDate.setDate(minEndDate.getDate() + 1);
        
        endDateInput.min = minEndDate.toISOString().split('T')[0];
        
        // If end date is earlier than start date, clear end date
        if (endDateInput.value && new Date(endDateInput.value) <= startDate) {
            endDateInput.value = '';
        }
        
        calculatePrice();
    });
    
    // Listen for end date changes
    endDateInput.addEventListener('change', function() {
        calculatePrice();
    });
    
    /**
     * Calculate rental price
     */
    function calculatePrice() {
        try {
            const startDate = startDateInput.value;
            const endDate = endDateInput.value;
            
            if (!startDate || !endDate) {
                if (rentalSummary) {
                    rentalSummary.style.display = 'none';
                }
                // Reset main price display to minimum price
                updateMainPriceDisplay();
                return;
            }
            
            const start = new Date(startDate);
            const end = new Date(endDate);
            
            // Validate date validity
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
            
            // Calculate using price data from database
            const priceData = calculatePriceFromDatabase(diffDays);
            
            // Update main price display
            updateMainPriceDisplay(priceData.dailyRate, diffDays);
            
            // Safely update display
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
            
            // Update daily rate display
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
     * Calculate rental price using database price data
     */
    function calculatePriceFromDatabase(days) {
        // Get product data
        const productData = window.productData || {
            minDailyPrice: 20,
            prices: [
                { duration: 1, totalPrice: 20, dailyPrice: 20 },
                { duration: 3, totalPrice: 54, dailyPrice: 18 },
                { duration: 7, totalPrice: 119, dailyPrice: 17 }
            ]
        };
        
        console.log('Using product data for calculation:', productData);
        
        // If no price data available, use default calculation
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
        
        // Sort prices by duration in ascending order, find the most suitable price tier
        const sortedPrices = [...productData.prices].sort((a, b) => a.duration - b.duration);
        
        // Find the most suitable price tier (maximum tier less than or equal to rental days)
        let bestPrice = sortedPrices[0]; // Default to minimum tier
        for (const price of sortedPrices) {
            if (price.duration <= days) {
                bestPrice = price;
            } else {
                break;
            }
        }
        
        // Calculate total price
        let totalPrice;
        let dailyRate = bestPrice.dailyPrice;
        let discountMessage = '';
        
        if (bestPrice.duration === 1) {
            // Use daily rental price
            totalPrice = dailyRate * days;
        } else {
            // Calculate using package price
            const fullPackages = Math.floor(days / bestPrice.duration);
            const remainingDays = days % bestPrice.duration;
            
            totalPrice = fullPackages * bestPrice.totalPrice;
            
            // Use daily rate for remaining days
            if (remainingDays > 0) {
                totalPrice += remainingDays * dailyRate;
            }
        }
        
        // Set discount information
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
 * Update main price display
 */
function updateMainPriceDisplay(dailyRate = null, days = null) {
    const mainPriceDisplay = document.getElementById('mainPriceDisplay');
    const discountNote = document.getElementById('discountNote');
    
    if (!mainPriceDisplay) return;
    
    const productData = window.productData || { minDailyPrice: 20 };
    
    if (dailyRate && days) {
        // Display price for currently selected period
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
        // Display minimum price
        const minPrice = productData.minDailyPrice || 20;
        mainPriceDisplay.textContent = '£' + minPrice.toFixed(0);
        
        if (discountNote) {
            discountNote.textContent = '10% discount for 3+ day rentals';
        }
    }
}

/**
 * Initialize price display
 */
function initPriceDisplay() {
    const productData = window.productData || { minDailyPrice: 20, itemValue: 500 };
    
    // Set initial price display
    updateMainPriceDisplay();
    
    // Set deposit display
    const depositDisplay = document.getElementById('depositDisplay');
    if (depositDisplay) {
        depositDisplay.textContent = 'Deposit: £' + (productData.itemValue || 500).toFixed(0);
    }
    
    console.log('Price display initialized with product data:', productData);
}

/**
 * Tab switching functionality
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
            
            // Remove all active states
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanels.forEach(panel => panel.classList.remove('active'));
            
            // Set current active state
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
 * Button interaction functionality
 */
function initButtons() {
    // Favorite button
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
    
    // Add to cart button
    const addToCartBtn = document.getElementById('addToCartBtn');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', function() {
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;
            
            if (!startDate || !endDate) {
                showToast('Please select rental period first', 'warning');
                return;
            }
            
            // Add loading state
            this.classList.add('loading');
            this.disabled = true;
            const originalText = this.innerHTML;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
            
            // Simulate adding to cart
            setTimeout(() => {
                this.classList.remove('loading');
                this.disabled = false;
                this.innerHTML = originalText;
                showToast('Added to cart successfully', 'success');
            }, 1500);
        });
    }
    
    // Book now button
    const rentNowBtn = document.getElementById('rentNowBtn');
    if (rentNowBtn) {
        rentNowBtn.addEventListener('click', function() {
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;
            
            if (!startDate || !endDate) {
                showToast('Please select rental period first', 'warning');
                return;
            }
            
            // Add loading state
            this.classList.add('loading');
            this.disabled = true;
            const originalText = this.innerHTML;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Booking...';
            
            // Simulate booking process
            setTimeout(() => {
                this.classList.remove('loading');
                this.disabled = false;
                this.innerHTML = originalText;
                showToast('Booking successful! Please check order details', 'success');
            }, 2000);
        });
    }
    
    // View map button
    const viewMapBtn = document.querySelector('.view-map-btn');
    if (viewMapBtn) {
        viewMapBtn.addEventListener('click', function() {
            // Get address information
            const locationInfo = document.querySelector('.location-info');
            const addressText = locationInfo ? locationInfo.textContent.trim() : '';
            
            // Get address tags
            const locationTag = document.querySelector('.location-tag');
            const areaTag = document.querySelector('.area-tag');
            
            // Build search query
            let searchQuery = addressText;
            if (locationTag && locationTag.textContent) {
                searchQuery = locationTag.textContent.trim();
            }
            if (areaTag && areaTag.textContent) {
                searchQuery += ', ' + areaTag.textContent.trim();
            }
            
            // If address information is available, open Google Maps
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
 * Tooltip functionality
 */
function initTooltips() {
    const elementsWithTooltips = document.querySelectorAll('[title]');
    
    elementsWithTooltips.forEach(element => {
        element.addEventListener('mouseenter', function() {
            const tooltipText = this.title;
            if (tooltipText) {
                showTooltip(this, tooltipText);
                this.title = ''; // Temporarily remove title to avoid browser default tooltip
            }
        });
        
        element.addEventListener('mouseleave', function() {
            hideTooltip();
            // Restore title attribute
            const tooltip = document.querySelector('.custom-tooltip');
            if (tooltip) {
                this.title = tooltip.textContent;
            }
        });
    });
}

/**
 * Show custom tooltip
 */
function showTooltip(element, text) {
    hideTooltip(); // Hide existing tooltip first
    
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
 * Hide tooltip
 */
function hideTooltip() {
    const tooltip = document.querySelector('.custom-tooltip');
    if (tooltip) {
        tooltip.remove();
    }
}

/**
 * Show toast message
 */
function showToast(message, type = 'info') {
    // Remove existing toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Set icon and color based on type
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
    
    // Show animation
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 10);
    
    // Auto hide
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
 * Page scroll optimization
 */
function initScrollOptimization() {
    let ticking = false;
    
    function updateScrollEffects() {
        const scrollY = window.scrollY;
        
        // Product image parallax effect
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
 * Performance monitoring
 */
function initPerformanceMonitoring() {
    // Monitor page load performance
    window.addEventListener('load', () => {
        if ('performance' in window) {
            const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
            console.log(`Product detail page load time: ${loadTime}ms`);
        }
    });
    
    // Monitor interaction performance
    let interactionCount = 0;
    document.addEventListener('click', () => {
        interactionCount++;
        if (interactionCount % 10 === 0) {
            console.log(`User interaction count: ${interactionCount}`);
        }
    });
}

/**
 * Error handling
 */
function initErrorHandling() {
    window.addEventListener('error', (e) => {
        console.error('Page error:', e.error);
        // Error reporting logic can be added here
    });
    
    window.addEventListener('unhandledrejection', (e) => {
        console.error('Unhandled Promise error:', e.reason);
        // Error reporting logic can be added here
    });
}

/**
 * Responsive image loading
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

// Initialize all features
document.addEventListener('DOMContentLoaded', () => {
    initScrollOptimization();
    initPerformanceMonitoring();
    initErrorHandling();
    initLazyLoading();
});

// Page Visibility API - Performance optimization
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        // Pause animations or timers when page is hidden
        console.log('Page hidden, pausing non-essential features');
    } else {
        // Resume features when page is visible
        console.log('Page visible, resuming features');
    }
});

// Export methods for use by other scripts
window.ProductDetail = {
    showToast,
    calculatePrice: () => {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        if (startDate && endDate) {
            // Trigger price calculation
            document.getElementById('endDate').dispatchEvent(new Event('change'));
        }
    }
};