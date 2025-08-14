/* ShareTools 物品上传页面JavaScript */

document.addEventListener('DOMContentLoaded', function() {
    console.log('物品上传页面初始化...');
    
    // 初始化表单处理
    initFormHandling();
    
    // 初始化图片上传预览
    initImageUploadPreviews();
    
    // 初始化价格建议功能
    initPriceSuggestions();
    
    // 检查用户登录状态
    checkUserLoginStatus();
    
    // 初始化加载和成功/错误消息UI
    initMessageUI();
});

// 初始化表单处理
function initFormHandling() {
    const form = document.getElementById('list-item-form');
    if (!form) return;
    
    // 初始化地址标签显示
    initLocationTagDisplay();
    
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        
        // 验证表单
        if (!validateForm()) {
            return;
        }
        
        // 收集表单数据
        const formData = collectFormData();
        
        // 提交表单数据
        submitItemData(formData);
    });
}

// 初始化地址标签显示
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
    
    // 监听位置选择变化
    locationSelect.addEventListener('change', function() {
        updateLocationTagDisplay();
    });
}

// 更新地址标签显示
function updateLocationTagDisplay() {
    const locationSelect = document.getElementById('location');
    const tagDisplay = document.querySelector('.location-tag-display');
    
    if (!locationSelect || !tagDisplay) return;
    
    // 清空现有标签
    tagDisplay.innerHTML = '';
    
    // 如果选择了位置，显示标签
    if (locationSelect.value) {
        const selectedOption = locationSelect.options[locationSelect.selectedIndex];
        const locationText = selectedOption.text;
        
        // 创建位置标签
        const locationTag = document.createElement('span');
        locationTag.className = 'location-tag';
        locationTag.textContent = locationText;
        tagDisplay.appendChild(locationTag);
        
        // 创建区域标签
        const optgroup = selectedOption.parentNode;
        if (optgroup && optgroup.tagName === 'OPTGROUP') {
            const areaTag = document.createElement('span');
            areaTag.className = 'area-tag';
            areaTag.textContent = optgroup.label;
            tagDisplay.appendChild(areaTag);
        }
    }
}

// 验证表单 - 简化版本，主要验证在模板内完成
function validateForm() {
    console.log('validateForm called from list_item.js - delegating to template validation');
    
    // 检查必要的字段是否存在
    const category = document.getElementById('category');
    const hasCategory = category && category.value;
    
    // 检查是否有图片
    let hasImages = false;
    for (let i = 1; i <= 8; i++) {
        const fileInput = document.getElementById(`file-input-${i}`);
        if (fileInput && fileInput.files && fileInput.files.length > 0) {
            hasImages = true;
            break;
        }
    }
    
    console.log('Quick validation - Category:', hasCategory, 'Images:', hasImages);
    
    // 返回true让模板中的详细验证处理
    return true;
}

// 显示错误信息
function showError(element, message) {
    // 清除可能存在的旧错误信息
    clearError(element);
    
    // 创建错误信息元素
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    
    // 将错误信息添加到元素后面
    element.parentNode.appendChild(errorElement);
    
    // 添加错误样式
    element.classList.add('error');
}

// 清除错误信息
function clearError(element) {
    // 移除错误样式
    element.classList.remove('error');
    
    // 查找并移除错误信息元素
    const parent = element.parentNode;
    const errorElement = parent.querySelector('.error-message');
    if (errorElement) {
        parent.removeChild(errorElement);
    }
}

// 收集表单数据
function collectFormData() {
    const formData = new FormData();
    
    // 基本信息
    formData.append('category', document.getElementById('category').value);
    formData.append('title', document.getElementById('title').value);
    formData.append('description', document.getElementById('description').value);
    
    // 价格信息
    formData.append('price_1day', document.getElementById('price-1day').value);
    
    // 如果有3天和7天的价格，也添加
    const price3days = document.getElementById('price-3days').value;
    if (price3days) {
        formData.append('price_3days', price3days);
    }
    
    const price7days = document.getElementById('price-7days').value;
    if (price7days) {
        formData.append('price_7days', price7days);
    }
    
    // 地址信息
    const locationSelect = document.getElementById('location');
    const locationValue = locationSelect.value;
    formData.append('location', locationValue);
    formData.append('address', document.getElementById('address').value);
    
    // 添加地址标签信息
    if (locationValue) {
        const selectedOption = locationSelect.options[locationSelect.selectedIndex];
        // 位置标签（具体地点名称）
        const locationText = selectedOption.text;
        formData.append('location_tag', locationText);
        
        // 区域标签（如NORTH GLASGOW）
        const optgroup = selectedOption.parentNode;
        if (optgroup && optgroup.tagName === 'OPTGROUP') {
            formData.append('area_tag', optgroup.label);
        }
    }
    
    // 物品价值
    formData.append('item_value', document.getElementById('item-value').value);
    
    // 图片文件
    for (let i = 1; i <= 8; i++) {
        const fileInput = document.getElementById(`file-input-${i}`);
        if (fileInput.files.length > 0) {
            formData.append(`image_${i}`, fileInput.files[0]);
        }
    }
    
    return formData;
}

// 提交物品数据
async function submitItemData(formData) {
    try {
        // 显示加载状态
        showLoadingState();
        
        // 打印表单数据（调试用）
        console.log('提交的表单数据:');
        for (let [key, value] of formData.entries()) {
            console.log(`${key}: ${value}`);
        }
        
        // 发送API请求
        const response = await fetch('/api/items/', {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': document.querySelector('[name=csrf-token]').content
            }
        });
        
        // 处理响应
        if (response.ok) {
            const data = await response.json();
            console.log('API响应成功:', data);
            
            // 显示成功消息
            showSuccessMessage('物品发布成功！');
            // 重定向到物品详情页
            setTimeout(() => {
                window.location.href = `/product/${data.id}/`;
            }, 2000);
        } else {
            // 显示错误消息
            const errorData = await response.json();
            console.error('API响应错误:', errorData);
            showApiError(errorData);
        }
    } catch (error) {
        console.error('提交物品数据失败:', error);
        showApiError({ detail: '提交失败，请稍后重试' });
    } finally {
        // 隐藏加载状态
        hideLoadingState();
    }
}

// 获取选中的图片
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

// 初始化图片上传预览
function initImageUploadPreviews() {
    // 为每个文件输入添加change事件监听器
    for (let i = 1; i <= 8; i++) {
        const fileInput = document.getElementById(`file-input-${i}`);
        if (!fileInput) continue;
        
        fileInput.addEventListener('change', function(event) {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                const uploadSlot = this.parentNode;
                
                reader.onload = function(e) {
                    // 移除上传图标
                    const uploadIcon = uploadSlot.querySelector('.upload-icon');
                    if (uploadIcon) {
                        uploadIcon.style.display = 'none';
                    }
                    
                    // 创建或更新图片预览
                    let imgPreview = uploadSlot.querySelector('.img-preview');
                    if (!imgPreview) {
                        imgPreview = document.createElement('img');
                        imgPreview.className = 'img-preview';
                        // 设置图片样式以保持容器比例
                        imgPreview.style.cssText = `
                            width: 100%;
                            height: 100%;
                            object-fit: cover;
                            object-position: center;
                            border-radius: 10px;
                        `;
                        uploadSlot.appendChild(imgPreview);
                    }
                    
                    // 设置图片源
                    imgPreview.src = e.target.result;
                    
                    // 添加删除按钮
                    let deleteBtn = uploadSlot.querySelector('.delete-btn');
                    if (!deleteBtn) {
                        deleteBtn = document.createElement('button');
                        deleteBtn.className = 'delete-btn';
                        deleteBtn.innerHTML = '×';
                        deleteBtn.title = '删除图片';
                        deleteBtn.type = 'button'; // 防止触发表单提交
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
                            e.stopPropagation(); // 阻止事件冒泡
                            e.preventDefault(); // 阻止默认行为
                            resetImageSlot(uploadSlot, fileInput);
                        };
                        uploadSlot.appendChild(deleteBtn);
                    }
                    
                    // 设置upload-slot为相对定位以支持绝对定位的删除按钮
                    uploadSlot.style.position = 'relative';
                };
                
                reader.readAsDataURL(this.files[0]);
            }
        });
    }
}

// 重置图片槽
function resetImageSlot(uploadSlot, fileInput) {
    // 重置文件输入
    fileInput.value = '';
    
    // 移除图片预览和删除按钮
    const imgPreview = uploadSlot.querySelector('.img-preview');
    const deleteBtn = uploadSlot.querySelector('.delete-btn');
    
    if (imgPreview) {
        uploadSlot.removeChild(imgPreview);
    }
    if (deleteBtn) {
        uploadSlot.removeChild(deleteBtn);
    }
    
    // 重新显示上传图标
    const uploadIcon = uploadSlot.querySelector('.upload-icon');
    if (uploadIcon) {
        uploadIcon.style.display = 'block';
    } else {
        // 如果图标被删除了，重新创建
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
    
    // 重置容器样式
    uploadSlot.style.position = 'static';
}

// 初始化价格建议功能
function initPriceSuggestions() {
    const categorySelect = document.getElementById('category');
    if (!categorySelect) return;
    
    // 当类别改变时更新价格建议
    categorySelect.addEventListener('change', function() {
        updatePriceSuggestions(this.value);
    });
}

// 更新价格建议
function updatePriceSuggestions(category) {
    // 更新类别名称显示
    const categoryNameElement = document.getElementById('category-name');
    if (categoryNameElement) {
        categoryNameElement.textContent = category || 'selected category';
    }
    
    // 根据类别获取价格建议
    let suggestions = getPriceSuggestionsByCategory(category);
    
    // 更新建议显示
    document.getElementById('suggest-1day').textContent = suggestions.day1.toFixed(2);
    document.getElementById('suggest-3days').textContent = suggestions.day3.toFixed(2);
    document.getElementById('suggest-7days').textContent = suggestions.day7.toFixed(2);
}

// 根据类别获取价格建议
function getPriceSuggestionsByCategory(category) {
    // 默认建议
    const defaultSuggestions = {
        day1: 5.00,
        day3: 12.00,
        day7: 25.00
    };
    
    // 根据类别返回不同的建议
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

// 使用价格建议
function usePriceSuggestions() {
    const category = document.getElementById('category').value;
    if (!category) return;
    
    const suggestions = getPriceSuggestionsByCategory(category);
    
    // 填充价格输入框
    document.getElementById('price-1day').value = suggestions.day1.toFixed(2);
    document.getElementById('price-3days').value = suggestions.day3.toFixed(2);
    document.getElementById('price-7days').value = suggestions.day7.toFixed(2);
}

// 初始化消息UI
function initMessageUI() {
    // 创建消息容器（如果不存在）
    if (!document.getElementById('message-container')) {
        const messageContainer = document.createElement('div');
        messageContainer.id = 'message-container';
        messageContainer.className = 'message-container';
        document.body.appendChild(messageContainer);
    }
    
    // 创建加载指示器（如果不存在）
    if (!document.getElementById('loading-indicator')) {
        const loadingIndicator = document.createElement('div');
        loadingIndicator.id = 'loading-indicator';
        loadingIndicator.className = 'loading-indicator';
        loadingIndicator.innerHTML = `
            <div class="spinner"></div>
            <div class="loading-text">处理中...</div>
        `;
        loadingIndicator.style.display = 'none';
        document.body.appendChild(loadingIndicator);
    }
}

// 显示加载状态
function showLoadingState() {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'flex';
    }
}

// 隐藏加载状态
function hideLoadingState() {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
}

// 显示成功消息
function showSuccessMessage(message) {
    showMessage(message, 'success');
}

// 显示错误消息
function showApiError(errorData) {
    let errorMessage = '提交失败';
    
    if (errorData.detail) {
        errorMessage = errorData.detail;
    } else if (typeof errorData === 'object') {
        // 处理字段错误
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

// 显示消息
function showMessage(message, type = 'info') {
    const messageContainer = document.getElementById('message-container');
    if (!messageContainer) return;
    
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}-message`;
    messageElement.innerHTML = message;
    
    // 添加关闭按钮
    const closeButton = document.createElement('button');
    closeButton.className = 'message-close';
    closeButton.innerHTML = '×';
    closeButton.onclick = function() {
        messageContainer.removeChild(messageElement);
    };
    
    messageElement.appendChild(closeButton);
    messageContainer.appendChild(messageElement);
    
    // 自动关闭（成功和信息消息）
    if (type !== 'error') {
        setTimeout(() => {
            if (messageElement.parentNode === messageContainer) {
                messageContainer.removeChild(messageElement);
            }
        }, 5000);
    }
}

// 检查用户登录状态
function checkUserLoginStatus() {
    // 获取用户状态元素
    const guestActions = document.getElementById('guest-actions');
    const loggedInActions = document.getElementById('logged-in-actions');
    
    // 检查是否有登录Cookie或本地存储的令牌
    const isLoggedIn = document.cookie.includes('sessionid=') || localStorage.getItem('auth_token');
    
    // 根据登录状态显示相应的操作
    if (isLoggedIn) {
        if (guestActions) guestActions.style.display = 'none';
        if (loggedInActions) loggedInActions.style.display = 'flex';
    } else {
        if (guestActions) guestActions.style.display = 'flex';
        if (loggedInActions) loggedInActions.style.display = 'none';
    }
}

