/**
 * API Configuration for ShareTools
 * Centralized configuration for all API endpoints
 */

// API Base Configuration
const API_CONFIG = {
    // Base URL for the backend API
    BASE_URL: 'http://127.0.0.1:8000',
    
    // API endpoints
    ENDPOINTS: {
        // Authentication endpoints
        AUTH: {
            REGISTER: '/api/auth/register/',
            LOGIN: '/api/auth/login/',
            LOGOUT: '/api/auth/logout/',
            USER_INFO: '/api/auth/user/',
            UPDATE_PROFILE: '/api/auth/profile/',
            CHANGE_PASSWORD: '/api/auth/change-password/'
        },
        
        // DRF API endpoints
        API: {
            ITEMS: '/api/items/',
            CATEGORIES: '/api/categories/',
            LOCATIONS: '/api/locations/',
            ITEM_IMAGES: '/api/item-images/',
            ITEM_PRICES: '/api/item-prices/'
        }
    },
    
    // Default request headers
    DEFAULT_HEADERS: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
    },
    
    // Request timeout (in milliseconds)
    TIMEOUT: 10000
};

/**
 * Get full URL for an endpoint
 * @param {string} endpoint - The endpoint path
 * @returns {string} Full URL
 */
function getApiUrl(endpoint) {
    return API_CONFIG.BASE_URL + endpoint;
}

/**
 * Get CSRF token from meta tag or cookie
 * @returns {string} CSRF token
 */
function getCSRFToken() {
    // Try to get from meta tag first
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (metaTag) {
        return metaTag.getAttribute('content');
    }
    
    // Fallback to cookie
    const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];
    
    return cookieValue || '';
}

/**
 * Create a fetch request with default configuration
 * @param {string} endpoint - The endpoint path
 * @param {object} options - Fetch options
 * @returns {Promise} Fetch promise
 */
async function apiRequest(endpoint, options = {}) {
    const url = getApiUrl(endpoint);
    
    // Get CSRF token for non-GET requests
    const csrfToken = getCSRFToken();
    const headers = {
        ...API_CONFIG.DEFAULT_HEADERS,
        ...options.headers
    };
    
    // Add CSRF token for non-GET requests
    if (options.method && options.method.toUpperCase() !== 'GET' && csrfToken) {
        headers['X-CSRFToken'] = csrfToken;
    }
    
    // Remove Content-Type for FormData to let browser set multipart/form-data with boundary
    if (options.body instanceof FormData) {
        delete headers['Content-Type'];
    }
    
    const defaultOptions = {
        headers,
        credentials: 'include', // Include cookies for session management
        ...options
    };
    
    try {
        const response = await fetch(url, defaultOptions);
        
        // Try to parse JSON response
        const data = await response.json();
        
        // Check if response is ok
        if (!response.ok) {
            // If the response contains error information, use it
            const errorMessage = data.message || `HTTP error! status: ${response.status}`;
            const error = new Error(errorMessage);
            error.status = response.status;
            error.data = data;
            throw error;
        }
        
        return data;
    } catch (error) {
        // If it's already our custom error, re-throw it
        if (error.status) {
            throw error;
        }
        
        // For other errors (network, JSON parsing, etc.)
        console.error('API request failed:', error);
        throw new Error('网络请求失败，请检查网络连接');
    }
}

/**
 * Authentication API functions
 */
const AuthAPI = {
    /**
     * User login
     * @param {string} username - Username or email
     * @param {string} password - Password
     * @returns {Promise} API response
     */
    async login(username, password) {
        return await apiRequest(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
            method: 'POST',
            body: JSON.stringify({
                username,
                password
            })
        });
    },
    
    /**
     * User registration
     * @param {string} username - Username
     * @param {string} email - Email address
     * @param {string} password - Password
     * @param {string} passwordConfirm - Password confirmation
     * @returns {Promise} API response
     */
    async register(username, email, password, passwordConfirm) {
        return await apiRequest(API_CONFIG.ENDPOINTS.AUTH.REGISTER, {
            method: 'POST',
            body: JSON.stringify({
                username,
                email,
                password,
                password_confirm: passwordConfirm
            })
        });
    },
    
    /**
     * User logout
     * @returns {Promise} API response
     */
    async logout() {
        return await apiRequest(API_CONFIG.ENDPOINTS.AUTH.LOGOUT, {
            method: 'POST'
        });
    },
    
    /**
     * Get current user info
     * @returns {Promise} API response
     */
    async getUserInfo() {
        return await apiRequest(API_CONFIG.ENDPOINTS.AUTH.USER_INFO, {
            method: 'GET'
        });
    },
    
    /**
     * Update user profile
     * @param {object} profileData - Profile data to update
     * @returns {Promise} API response
     */
    async updateProfile(profileData) {
        return await apiRequest(API_CONFIG.ENDPOINTS.AUTH.UPDATE_PROFILE, {
            method: 'POST',
            body: JSON.stringify(profileData)
        });
    },
    
    /**
     * Change password
     * @param {string} currentPassword - Current password
     * @param {string} newPassword - New password
     * @param {string} newPasswordConfirm - New password confirmation
     * @returns {Promise} API response
     */
    async changePassword(currentPassword, newPassword, newPasswordConfirm) {
        return await apiRequest(API_CONFIG.ENDPOINTS.AUTH.CHANGE_PASSWORD, {
            method: 'POST',
            body: JSON.stringify({
                current_password: currentPassword,
                new_password: newPassword,
                new_password_confirm: newPasswordConfirm
            })
        });
    }
};

/**
 * Items API functions
 */
const ItemsAPI = {
    /**
     * Get all items
     * @param {object} params - Query parameters
     * @returns {Promise} API response
     */
    async getItems(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = API_CONFIG.ENDPOINTS.API.ITEMS + (queryString ? `?${queryString}` : '');
        return await apiRequest(endpoint, {
            method: 'GET'
        });
    },
    
    /**
     * Get single item
     * @param {number} itemId - Item ID
     * @returns {Promise} API response
     */
    async getItem(itemId) {
        return await apiRequest(`${API_CONFIG.ENDPOINTS.API.ITEMS}${itemId}/`, {
            method: 'GET'
        });
    },
    
    /**
     * Create new item
     * @param {object} itemData - Item data
     * @returns {Promise} API response
     */
    async createItem(itemData) {
        return await apiRequest(API_CONFIG.ENDPOINTS.API.ITEMS, {
            method: 'POST',
            body: JSON.stringify(itemData)
        });
    },
    
    /**
     * Update item
     * @param {number} itemId - Item ID
     * @param {object} itemData - Updated item data
     * @returns {Promise} API response
     */
    async updateItem(itemId, itemData) {
        return await apiRequest(`${API_CONFIG.ENDPOINTS.API.ITEMS}${itemId}/`, {
            method: 'PUT',
            body: JSON.stringify(itemData)
        });
    },
    
    /**
     * Delete item
     * @param {number} itemId - Item ID
     * @returns {Promise} API response
     */
    async deleteItem(itemId) {
        return await apiRequest(`${API_CONFIG.ENDPOINTS.API.ITEMS}${itemId}/`, {
            method: 'DELETE'
        });
    }
};

/**
 * Item Images API functions
 */
const ItemImagesAPI = {
    /**
     * Upload image for an item
     * @param {string} itemId - Item ID
     * @param {File} imageFile - Image file
     * @param {boolean} isPrimary - Whether this is the primary image
     * @param {string} altText - Alt text for the image
     * @param {number} order - Order of the image
     * @returns {Promise} API response
     */
    async uploadImage(itemId, imageFile, isPrimary = false, altText = '', order = 0) {
        const formData = new FormData();
        formData.append('item', itemId);
        formData.append('image', imageFile);
        formData.append('is_primary', isPrimary);
        formData.append('alt_text', altText);
        formData.append('order', order);
        
        // 直接使用fetch，避免apiRequest添加默认的Content-Type头部
        const url = getApiUrl(API_CONFIG.ENDPOINTS.API.ITEM_IMAGES);
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                // 不设置Content-Type，让浏览器自动设置multipart/form-data
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: formData,
            credentials: 'include'
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Image upload failed: ${response.status} ${errorText}`);
        }
        
        return await response.json();
    },
    
    /**
     * Get images for an item
     * @param {string} itemId - Item ID
     * @returns {Promise} API response
     */
    async getItemImages(itemId) {
        return await apiRequest(`${API_CONFIG.ENDPOINTS.API.ITEM_IMAGES}?item=${itemId}`, {
            method: 'GET'
        });
    },
    
    /**
     * Delete an image
     * @param {number} imageId - Image ID
     * @returns {Promise} API response
     */
    async deleteImage(imageId) {
        return await apiRequest(`${API_CONFIG.ENDPOINTS.API.ITEM_IMAGES}${imageId}/`, {
            method: 'DELETE'
        });
    }
};

/**
 * Item Prices API functions
 */
const ItemPricesAPI = {
    /**
     * Create price for an item
     * @param {string} itemId - Item ID
     * @param {number} durationDays - Duration in days
     * @param {number} price - Price amount
     * @returns {Promise} API response
     */
    async createPrice(itemId, durationDays, price) {
        return await apiRequest(API_CONFIG.ENDPOINTS.API.ITEM_PRICES, {
            method: 'POST',
            body: JSON.stringify({
                item: itemId,
                duration_days: durationDays,
                price: price,
                is_active: true
            })
        });
    },
    
    /**
     * Get prices for an item
     * @param {string} itemId - Item ID
     * @returns {Promise} API response
     */
    async getItemPrices(itemId) {
        return await apiRequest(`${API_CONFIG.ENDPOINTS.API.ITEM_PRICES}?item=${itemId}`, {
            method: 'GET'
        });
    },
    
    /**
     * Update price
     * @param {number} priceId - Price ID
     * @param {object} priceData - Updated price data
     * @returns {Promise} API response
     */
    async updatePrice(priceId, priceData) {
        return await apiRequest(`${API_CONFIG.ENDPOINTS.API.ITEM_PRICES}${priceId}/`, {
            method: 'PUT',
            body: JSON.stringify(priceData)
        });
    },
    
    /**
     * Delete price
     * @param {number} priceId - Price ID
     * @returns {Promise} API response
     */
    async deletePrice(priceId) {
        return await apiRequest(`${API_CONFIG.ENDPOINTS.API.ITEM_PRICES}${priceId}/`, {
            method: 'DELETE'
        });
    }
};

/**
 * Categories API functions
 */
const CategoriesAPI = {
    /**
     * Get all categories
     * @returns {Promise} API response
     */
    async getCategories() {
        return await apiRequest(API_CONFIG.ENDPOINTS.API.CATEGORIES, {
            method: 'GET'
        });
    }
};

/**
 * Locations API functions
 */
const LocationsAPI = {
    /**
     * Get all locations
     * @returns {Promise} API response
     */
    async getLocations() {
        return await apiRequest(API_CONFIG.ENDPOINTS.API.LOCATIONS, {
            method: 'GET'
        });
    }
};

// Export to global scope
window.API_CONFIG = API_CONFIG;
window.getApiUrl = getApiUrl;
window.apiRequest = apiRequest;
window.AuthAPI = AuthAPI;
window.ItemsAPI = ItemsAPI;
window.ItemImagesAPI = ItemImagesAPI;
window.ItemPricesAPI = ItemPricesAPI;
window.CategoriesAPI = CategoriesAPI;
window.LocationsAPI = LocationsAPI;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        API_CONFIG,
        getApiUrl,
        apiRequest,
        AuthAPI,
        ItemsAPI,
        ItemImagesAPI,
        ItemPricesAPI,
        CategoriesAPI,
        LocationsAPI
    };
}

console.log('ShareTools API Configuration loaded');