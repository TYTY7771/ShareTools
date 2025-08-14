/**
 * Browse Things page interaction script
 * Implements search, category filtering, product display and other functions
 */

document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const categoriesToggle = document.getElementById('categoriesToggle');
    const categoriesNav = document.getElementById('categoriesNav');
    const categoryItems = document.querySelectorAll('.category-item');
    const productsGrid = document.getElementById('productsGrid');
    const productCards = document.querySelectorAll('.product-card');
    const makeWishBtn = document.getElementById('makeWishBtn');

    // State management
    let currentCategory = 'all';
    let currentFilterType = 'category';
    let searchQuery = '';
    let isCategoriesVisible = true;

    // ===== Initialization =====
    function init() {
        setupEventListeners();
        updateProductDisplay();
        
        // Add page loading animation
        document.body.classList.add('loaded');
        
        console.log('Browse Things page initialized');
    }

    // ===== Event listeners setup =====
    function setupEventListeners() {
        // Search functionality
        searchInput.addEventListener('input', handleSearch);
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleSearchSubmit();
            }
        });
        searchBtn.addEventListener('click', handleSearchSubmit);

        // Category toggle functionality
        categoriesToggle.addEventListener('click', toggleCategories);
        
        // Category filtering functionality
        categoryItems.forEach(item => {
            item.addEventListener('click', function() {
                // Skip if this is a section title or divider
                if (this.classList.contains('category-section-title') || this.classList.contains('category-divider')) {
                    return;
                }
                
                // Update current filter
                currentFilterType = this.dataset.filterType || 'category';
                handleCategoryChange(this.dataset.category);
            });
        });

        // Product card interactions
        productCards.forEach(card => {
            card.addEventListener('click', function() {
                handleProductClick(this);
            });
            
            // Add hover effect sound (optional)
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-4px)';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
            });
        });

        // CTA button functionality
        makeWishBtn.addEventListener('click', handleMakeWish);

        // Responsive handling
        window.addEventListener('resize', handleResize);
        
        // Keyboard shortcuts
        document.addEventListener('keydown', handleKeyboardShortcuts);
    }

    // ===== Search functionality =====
    function handleSearch() {
        searchQuery = searchInput.value.toLowerCase().trim();
        updateProductDisplay();
        
        // Real-time search suggestions
        if (searchQuery.length > 2) {
            showSearchSuggestions();
        }
    }

    function handleSearchSubmit() {
        searchQuery = searchInput.value.toLowerCase().trim();
        updateProductDisplay();
        
        // Record search behavior
        console.log('Search query:', searchQuery);
        
        // Search animation effect
        searchBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            searchBtn.style.transform = 'scale(1)';
        }, 150);
    }

    function showSearchSuggestions() {
        // Here you can add search suggestion functionality
        // Currently only displayed in console
        console.log('Search suggestion functionality to be implemented');
    }

    // ===== Category functionality =====
    function toggleCategories() {
        isCategoriesVisible = !isCategoriesVisible;
        categoriesToggle.classList.toggle('active');
        
        if (isCategoriesVisible) {
            categoriesNav.style.maxHeight = categoriesNav.scrollHeight + 'px';
            categoriesNav.style.opacity = '1';
        } else {
            categoriesNav.style.maxHeight = '0';
            categoriesNav.style.opacity = '0';
        }
    }

    function handleCategoryChange(category) {
        // Update current category
        currentCategory = category;
        
        // Update active status
        categoryItems.forEach(item => {
            item.classList.remove('active');
        });
        
        const activeItem = document.querySelector(`[data-category="${category}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
        
        // Update product display
        updateProductDisplay();
        
        // Scroll to product area (mobile optimization)
        if (window.innerWidth <= 768) {
            document.querySelector('.products-section').scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
        
        console.log('Switch to category:', category);
    }

    // ===== Product display update =====
    function updateProductDisplay() {
        let visibleCount = 0;
        
        productCards.forEach(card => {
            const cardCategory = card.dataset.category;
            const cardLocation = card.dataset.location;
            const cardTitle = card.querySelector('.product-title').textContent.toLowerCase();
            
            // Filter logic based on filter type
            let filterMatch = false;
            if (currentCategory === 'all') {
                filterMatch = true;
            } else if (currentFilterType === 'category') {
                filterMatch = cardCategory === currentCategory;
            } else if (currentFilterType === 'location') {
                filterMatch = cardLocation === currentCategory;
            }
            
            // Search filter logic
            const searchMatch = searchQuery === '' || cardTitle.includes(searchQuery);
            
            // Show/hide product cards
            if (filterMatch && searchMatch) {
                card.classList.remove('hidden');
                card.classList.add('filtered');
                visibleCount++;
                
                // Add delayed animation effect
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, visibleCount * 100);
            } else {
                card.classList.add('hidden');
                card.classList.remove('filtered');
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
            }
        });
        
        // Show no results message
        showNoResultsMessage(visibleCount === 0);
        
        console.log(`Showing ${visibleCount} products`);
    }

    function showNoResultsMessage(show) {
        let noResultsEl = document.querySelector('.no-results');
        
        if (show && !noResultsEl) {
            noResultsEl = document.createElement('div');
            noResultsEl.className = 'no-results';
            noResultsEl.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #808080;">
                    <i class="fas fa-search" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                    <h3 style="margin-bottom: 8px;">No matching products found</h3>
                    <p>Try adjusting search criteria or selecting a different category</p>
                </div>
            `;
            productsGrid.appendChild(noResultsEl);
        } else if (!show && noResultsEl) {
            noResultsEl.remove();
        }
    }

    // ===== Product interactions =====
    function handleProductClick(card) {
        const productTitle = card.querySelector('.product-title').textContent;
        const productPrice = card.querySelector('.product-price').textContent;
        
        // Show product details (can open modal or navigate to details page)
        showProductDetails(productTitle, productPrice);
        
        // Add click animation effect
        card.style.transform = 'scale(0.98)';
        setTimeout(() => {
            card.style.transform = 'scale(1)';
        }, 150);
        
        console.log('Product clicked:', productTitle);
    }

    function showProductDetails(title, price) {
        // Simple product details prompt
        alert(`Product: ${title}\nPrice: ${price}\n\nThis feature will navigate to product details page`);
        
        // In actual projects, this should:
        // 1. Open product details modal
        // 2. Navigate to product details page
        // 3. Load more product information
    }

    // ===== CTA button functionality =====
    function handleMakeWish() {
        // Show wish form or navigate to wish page
        showWishForm();
        
        // Button animation effect
        makeWishBtn.style.transform = 'translateY(-2px) scale(0.98)';
        setTimeout(() => {
            makeWishBtn.style.transform = 'translateY(-2px) scale(1)';
        }, 150);
        
        console.log('User clicked "Make a wish" button');
    }

    function showWishForm() {
        // Simple wish form
        const wishText = prompt('Please tell us what item you would like to borrow:');
        
        if (wishText && wishText.trim()) {
            alert(`Thank you for your suggestion! We will consider adding: ${wishText}`);
            
            // In actual projects, this should:
            // 1. Send to backend API
            // 2. Save user wish records
            // 3. Show thank you message
            console.log('User wish:', wishText);
        }
    }

    // ===== Responsive handling =====
    function handleResize() {
        // Adjust layout based on screen size
        if (window.innerWidth <= 768) {
            // Mobile optimization
            if (isCategoriesVisible) {
                categoriesNav.style.maxHeight = 'none';
            }
        } else {
            // Desktop restoration
            categoriesNav.style.maxHeight = 'none';
            categoriesNav.style.opacity = '1';
        }
    }

    // ===== Keyboard shortcuts =====
    function handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + K focus search box
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            searchInput.focus();
            searchInput.select();
        }
        
        // ESC key clears search
        if (e.key === 'Escape') {
            searchInput.value = '';
            searchQuery = '';
            updateProductDisplay();
            searchInput.blur();
        }
        
        // Number keys for quick category switching
        const categoryMap = {
            '1': 'tools',
            '2': 'electronics', 
            '3': 'garden',
            '4': 'sports',
            '5': 'automotive',
            '6': 'diy',
            '0': 'all'
        };
        
        if (categoryMap[e.key]) {
            handleCategoryChange(categoryMap[e.key]);
        }
    }

    // ===== Utility functions =====
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Debounced search
    const debouncedSearch = debounce(handleSearch, 300);
    
    // Replace original search event listener
    if (searchInput) {
        searchInput.removeEventListener('input', handleSearch);
        searchInput.addEventListener('input', debouncedSearch);
    }

    // ===== Animations and visual effects =====
    function addLoadingAnimation() {
        productCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    // ===== Performance optimization =====
    function optimizeImages() {
        const productImages = document.querySelectorAll('.product-image');
        const decorationImages = document.querySelectorAll('.decoration-image');
        
        // Lazy load product images
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.style.opacity = '1';
                        observer.unobserve(img);
                    }
                });
            });
            
            productImages.forEach(img => {
                imageObserver.observe(img);
            });
        }
        
        // Decoration image loading handling
        decorationImages.forEach((img, index) => {
            img.addEventListener('load', () => {
                // Add loaded class to trigger CSS animation
                img.classList.add('loaded');
                img.style.transform = img.classList.contains('decoration-image-1') 
                    ? 'rotate(-5deg)' 
                    : 'rotate(8deg)';
                console.log(`Decoration image ${index + 1} loaded`);
            });
            
            img.addEventListener('error', () => {
                console.warn(`Decoration image ${index + 1} failed to load`);
                // Hide failed images
                img.style.display = 'none';
            });
            
            // If image is already loaded (from cache)
            if (img.complete && img.naturalWidth > 0) {
                img.classList.add('loaded');
                img.style.transform = img.classList.contains('decoration-image-1') 
                    ? 'rotate(-5deg)' 
                    : 'rotate(8deg)';
            }
        });
    }

    // ===== Start application =====
    init();
    addLoadingAnimation();
    optimizeImages();
    
    // Globally expose some methods for debugging
    window.BrowseThings = {
        updateDisplay: updateProductDisplay,
        setCategory: handleCategoryChange,
        search: function(query) {
            searchInput.value = query;
            handleSearch();
        }
    };
    
    console.log('Browse Things page script loaded');
});

// ===== Page unload cleanup =====
window.addEventListener('beforeunload', function() {
    // Clean up event listeners and timers
    console.log('Browse Things page about to unload');
});