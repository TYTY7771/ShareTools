/* ShareTools Item Upload Page JavaScript */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Item upload page initialization...');
    
    // Initialize form handling
    initFormHandling();
    
    // Initialize image upload preview
    initImageUploadPreviews();
    
    // Initialize price suggestion feature
    initPriceSuggestions();
    
    // Check user login status
    checkUserLoginStatus();
    
    // Initialize loading and success/error message UI
    initMessageUI();
});

// Initialize form handling
function initFormHandling() {
    const form = document.getElementById('list-item-form');
    if (!form) return;
    
    // Initialize location tag display
    initLocationTagDisplay();
    
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        
        // Validate form
        if (!validateForm()) {
            return;
        }
        
        // Collect form data
        const formData = collectFormData();
        
        // Submit form data
        submitItemData(formData);
    });
}

// Initialize location tag display
function initLocationTagDisplay() {
    const locationSelect = document.getElementById('location');
    if (!locationSelect) return;
    
    // 创建标签显示区域（如果不存在）
    let tagDisplay = document.querySelector('.location-tag-display');
    if (!tagDisplay) {
        tagDisplay = document.createElement('div');
        tagDisplay.className = 'location-tag-display';
        // 将标签显示区域插入到地址输入框之后
        const addressInput = document.getElementById('address');
        if (addressInput && addressInput.parentNode) {
            addressInput.parentNode.appendChild(tagDisplay);
        }
    }
    
    // Listen for location selection changes
    locationSelect.addEventListener('change', function() {
        updateLocationTagDisplay();
    });
}

// Update location tag display
function updateLocationTagDisplay() {
    const locationSelect = document.getElementById('location');
    const tagDisplay = document.querySelector('.location-tag-display');
    
    if (!locationSelect || !tagDisplay) return;
    
    // Clear existing tags
    tagDisplay.innerHTML = '';
    
    // If location is selected, display tags
    if (locationSelect.value) {
        const selectedOption = locationSelect.options[locationSelect.selectedIndex];
        const locationText = selectedOption.text;
        
        // Create location tag
        const locationTag = document.createElement('span');
        locationTag.className = 'location-tag';
        locationTag.textContent = locationText;
        tagDisplay.appendChild(locationTag);
        
        // Create area tag
        const optgroup = selectedOption.parentNode;
        if (optgroup && optgroup.tagName === 'OPTGROUP') {
            const areaTag = document.createElement('span');
            areaTag.className = 'area-tag';
            areaTag.textContent = optgroup.label;
            tagDisplay.appendChild(areaTag);
        }
    }
}

// Validate form - simplified version, main validation completed in template
function validateForm() {
    console.log('validateForm called from list_item.js - delegating to template validation');
    
    // Check if required fields exist
    const category = document.getElementById('category');
    const hasCategory = category && category.value;
    
    // Check if there are images
    let hasImages = false;
    for (let i = 1; i <= 8; i++) {
        const fileInput = document.getElementById(`file-input-${i}`);
        if (fileInput && fileInput.files && fileInput.files.length > 0) {
            hasImages = true;
            break;
        }
    }
    
    console.log('Quick validation - Category:', hasCategory, 'Images:', hasImages);
    
    // Return true to let detailed validation in template handle
    return true;
}

// Show error message
function showError(element, message) {
    // Clear possible existing old error messages
    clearError(element);
    
    // Create error message element
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    
    // Add error message after the element
    element.parentNode.appendChild(errorElement);
    
    // Add error style
    element.classList.add('error');
}

// Clear error message
function clearError(element) {
    // Remove error style
    element.classList.remove('error');
    
    // Find and remove error message element
    const parent = element.parentNode;
    const errorElement = parent.querySelector('.error-message');
    if (errorElement) {
        parent.removeChild(errorElement);
    }
}

// Collect form data
function collectFormData() {
    const formData = new FormData();
    
    // Basic information
    formData.append('category', document.getElementById('category').value);
    formData.append('title', document.getElementById('title').value);
    formData.append('description', document.getElementById('description').value);
    
    // Price information
    formData.append('price_1day', document.getElementById('price-1day').value);
    
    // If there are 3-day and 7-day prices, add them too
    const price3days = document.getElementById('price-3days').value;
    if (price3days) {
        formData.append('price_3days', price3days);
    }
    
    const price7days = document.getElementById('price-7days').value;
    if (price7days) {
        formData.append('price_7days', price7days);
    }
    
    // Address information
    const locationSelect = document.getElementById('location');
    const locationValue = locationSelect.value;
    formData.append('location', locationValue);
    formData.append('address', document.getElementById('address').value);
    
    // Add address tag information
    if (locationValue) {
        const selectedOption = locationSelect.options[locationSelect.selectedIndex];
        // Location tag (specific location name)
        const locationText = selectedOption.text;
        formData.append('location_tag', locationText);
        
        // Area tag (e.g. NORTH GLASGOW)
        const optgroup = selectedOption.parentNode;
        if (optgroup && optgroup.tagName === 'OPTGROUP') {
            formData.append('area_tag', optgroup.label);
        }
    }
    
    // Item value
    formData.append('item_value', document.getElementById('item-value').value);
    
    // Image files
    for (let i = 1; i <= 8; i++) {
        const fileInput = document.getElementById(`file-input-${i}`);
        if (fileInput.files.length > 0) {
            formData.append(`image_${i}`, fileInput.files[0]);
        }
    }
    
    return formData;
}

// Submit item data
async function submitItemData(formData) {
    try {
        // Show loading state
        showLoadingState();
        
        // Print form data (for debugging)
        console.log('Submitted form data:');
        for (let [key, value] of formData.entries()) {
            console.log(`${key}: ${value}`);
        }
        
        // Send API request
        const response = await fetch('/api/items/', {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': document.querySelector('[name=csrf-token]').content
            }
        });
        
        // Handle response
        if (response.ok) {
            const data = await response.json();
            console.log('API response successful:', data);
            
            // Show success message
            showSuccessMessage('Item published successfully!');
            // Redirect to item detail page
            setTimeout(() => {
                window.location.href = `/product/${data.id}/`;
            }, 2000);
        } else {
            // Show error message
            const errorData = await response.json();
            console.error('API response error:', errorData);
            showApiError(errorData);
        }
    } catch (error) {
        console.error('Failed to submit item data:', error);
        showApiError({ detail: 'Submission failed, please try again later' });
    } finally {
        // Hide loading state
        hideLoadingState();
    }
}

// Get selected images
function getSelectedImages() {
    const selectedImages = [];
    for (let i = 1; i <= 8; i++) {
        const fileInput = document.getElementById(`file-input-${i}`);
        if (fileInput && fileInput.files && fileInput.files.length > 0) {
            selectedImages.push({
                index: i,
                file: fileInput.files[0],
                input: fileInput
            });
        }
    }
    return selectedImages;
}

// Initialize image upload preview
function initImageUploadPreviews() {
    // Add change event listener for each file input
    for (let i = 1; i <= 8; i++) {
        const fileInput = document.getElementById(`file-input-${i}`);
        if (!fileInput) continue;
        
        fileInput.addEventListener('change', function(event) {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                const uploadSlot = this.parentNode;
                
                reader.onload = function(e) {
                    // Remove upload icon
                    const uploadIcon = uploadSlot.querySelector('.upload-icon');
                    if (uploadIcon) {
                        uploadIcon.style.display = 'none';
                    }
                    
                    // Create or update image preview
                    let imgPreview = uploadSlot.querySelector('.img-preview');
                    if (!imgPreview) {
                        imgPreview = document.createElement('img');
                        imgPreview.className = 'img-preview';
                        // Set image styles to maintain container ratio
                        imgPreview.style.cssText = `
                            width: 100%;
                            height: 100%;
                            object-fit: cover;
                            object-position: center;
                            border-radius: 10px;
                        `;
                        uploadSlot.appendChild(imgPreview);
                    }
                    
                    // Set image source
                    imgPreview.src = e.target.result;
                    
                    // Add delete button
                    let deleteBtn = uploadSlot.querySelector('.delete-btn');
                    if (!deleteBtn) {
                        deleteBtn = document.createElement('button');
                        deleteBtn.className = 'delete-btn';
                        deleteBtn.innerHTML = '×';
                        deleteBtn.title = 'Delete image';
                        deleteBtn.type = 'button'; // Prevent form submission
                        deleteBtn.style.cssText = `
                            position: absolute;
                            top: 5px;
                            right: 5px;
                            width: 24px;
                            height: 24px;
                            border-radius: 50%;
                            background: rgba(255, 255, 255, 0.9);
                            border: none;
                            color: #666;
                            font-size: 16px;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        `;
                        deleteBtn.onclick = function(e) {
                            e.stopPropagation(); // Prevent event bubbling
                            e.preventDefault(); // Prevent default behavior
                            resetImageSlot(uploadSlot, fileInput);
                        };
                        uploadSlot.appendChild(deleteBtn);
                    }
                    
                    // Set upload-slot to relative positioning to support absolutely positioned delete button
                    uploadSlot.style.position = 'relative';
                };
                
                reader.readAsDataURL(this.files[0]);
            }
        });
    }
}

// Reset image slot
function resetImageSlot(uploadSlot, fileInput) {
    // Reset file input
    fileInput.value = '';
    
    // Remove image preview and delete button
    const imgPreview = uploadSlot.querySelector('.img-preview');
    const deleteBtn = uploadSlot.querySelector('.delete-btn');
    
    if (imgPreview) {
        uploadSlot.removeChild(imgPreview);
    }
    if (deleteBtn) {
        uploadSlot.removeChild(deleteBtn);
    }
    
    // Re-display upload icon
    const uploadIcon = uploadSlot.querySelector('.upload-icon');
    if (uploadIcon) {
        uploadIcon.style.display = 'block';
    } else {
        // If icon was deleted, recreate it
        const newUploadIcon = document.createElement('svg');
        newUploadIcon.className = 'upload-icon';
        newUploadIcon.setAttribute('viewBox', '0 0 24 24');
        newUploadIcon.setAttribute('fill', 'none');
        newUploadIcon.innerHTML = `
            <path d="M21 15V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V15" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M7 10L12 15L17 10" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 15V3" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
        `;
        uploadSlot.appendChild(newUploadIcon);
    }
    
    // Reset container styles
    uploadSlot.style.position = 'static';
}

// Initialize price suggestion feature
function initPriceSuggestions() {
    const categorySelect = document.getElementById('category');
    if (!categorySelect) return;
    
    // Update price suggestions when category changes
    categorySelect.addEventListener('change', function() {
        updatePriceSuggestions(this.value);
    });
}

// Update price suggestions
function updatePriceSuggestions(category) {
    // Update category name display
    const categoryNameElement = document.getElementById('category-name');
    if (categoryNameElement) {
        categoryNameElement.textContent = category || 'selected category';
    }
    
    // Get price suggestions based on category
    let suggestions = getPriceSuggestionsByCategory(category);
    
    // Update suggestion display
    document.getElementById('suggest-1day').textContent = suggestions.day1.toFixed(2);
    document.getElementById('suggest-3days').textContent = suggestions.day3.toFixed(2);
    document.getElementById('suggest-7days').textContent = suggestions.day7.toFixed(2);
}

// Get price suggestions by category
function getPriceSuggestionsByCategory(category) {
    // Default suggestions
    const defaultSuggestions = {
        day1: 5.00,
        day3: 12.00,
        day7: 25.00
    };
    
    // Return different suggestions based on category
    const suggestions = {
        'tools': {
            day1: 8.00,
            day3: 20.00,
            day7: 40.00
        },
        'electronics': {
            day1: 15.00,
            day3: 35.00,
            day7: 70.00
        },
        'garden': {
            day1: 10.00,
            day3: 25.00,
            day7: 50.00
        },
        'sports': {
            day1: 7.00,
            day3: 18.00,
            day7: 35.00
        },
        'automotive': {
            day1: 12.00,
            day3: 30.00,
            day7: 60.00
        },
        'home': {
            day1: 6.00,
            day3: 15.00,
            day7: 30.00
        }
    };
    
    return suggestions[category] || defaultSuggestions;
}

// Use price suggestions
function usePriceSuggestions() {
    const category = document.getElementById('category').value;
    if (!category) return;
    
    const suggestions = getPriceSuggestionsByCategory(category);
    
    // Fill price input fields
    document.getElementById('price-1day').value = suggestions.day1.toFixed(2);
    document.getElementById('price-3days').value = suggestions.day3.toFixed(2);
    document.getElementById('price-7days').value = suggestions.day7.toFixed(2);
}

// Initialize message UI
function initMessageUI() {
    // Create message container (if not exists)
    if (!document.getElementById('message-container')) {
        const messageContainer = document.createElement('div');
        messageContainer.id = 'message-container';
        messageContainer.className = 'message-container';
        document.body.appendChild(messageContainer);
    }
    
    // Create loading indicator (if not exists)
    if (!document.getElementById('loading-indicator')) {
        const loadingIndicator = document.createElement('div');
        loadingIndicator.id = 'loading-indicator';
        loadingIndicator.className = 'loading-indicator';
        loadingIndicator.innerHTML = `
            <div class="spinner"></div>
            <div class="loading-text">Processing...</div>
        `;
        loadingIndicator.style.display = 'none';
        document.body.appendChild(loadingIndicator);
    }
}

// Show loading state
function showLoadingState() {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'flex';
    }
}

// Hide loading state
function hideLoadingState() {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
}

// Show success message
function showSuccessMessage(message) {
    showMessage(message, 'success');
}

// Show error message
function showApiError(errorData) {
    let errorMessage = 'Submission failed';
    
    if (errorData.detail) {
        errorMessage = errorData.detail;
    } else if (typeof errorData === 'object') {
        // Handle field errors
        const errors = [];
        for (const field in errorData) {
            if (Array.isArray(errorData[field])) {
                errors.push(`${field}: ${errorData[field].join(', ')}`);
            } else {
                errors.push(`${field}: ${errorData[field]}`);
            }
        }
        
        if (errors.length > 0) {
            errorMessage = errors.join('<br>');
        }
    }
    
    showMessage(errorMessage, 'error');
}

// Show message
function showMessage(message, type = 'info') {
    const messageContainer = document.getElementById('message-container');
    if (!messageContainer) return;
    
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}-message`;
    messageElement.innerHTML = message;
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.className = 'message-close';
    closeButton.innerHTML = '×';
    closeButton.onclick = function() {
        messageContainer.removeChild(messageElement);
    };
    
    messageElement.appendChild(closeButton);
    messageContainer.appendChild(messageElement);
    
    // Auto close (success and info messages)
    if (type !== 'error') {
        setTimeout(() => {
            if (messageElement.parentNode === messageContainer) {
                messageContainer.removeChild(messageElement);
            }
        }, 5000);
    }
}

// Check user login status
function checkUserLoginStatus() {
    // Get user status elements
    const guestActions = document.getElementById('guest-actions');
    const loggedInActions = document.getElementById('logged-in-actions');
    
    // Check if there are login cookies or locally stored tokens
    const isLoggedIn = document.cookie.includes('sessionid=') || localStorage.getItem('auth_token');
    
    // Show corresponding actions based on login status
    if (isLoggedIn) {
        if (guestActions) guestActions.style.display = 'none';
        if (loggedInActions) loggedInActions.style.display = 'flex';
    } else {
        if (guestActions) guestActions.style.display = 'flex';
        if (loggedInActions) loggedInActions.style.display = 'none';
    }
}

