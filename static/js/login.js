/* ShareTools 登录页面 JavaScript */

// ===== 页面加载完成后初始化 =====
document.addEventListener('DOMContentLoaded', () => {
    // 初始化登录功能
    initLoginForms();
    initFormValidation();
    initURLHandling();
    
    console.log('ShareTools login page initialized');
});

// ===== 表单切换功能 =====
function initLoginForms() {
    const signinForm = document.getElementById('signin-form');
    const signupForm = document.getElementById('signup-form');
    const showSignupBtn = document.getElementById('show-signup');
    const showSigninBtn = document.getElementById('show-signin');
    
    if (!signinForm || !signupForm || !showSignupBtn || !showSigninBtn) {
        console.error('Login form elements not found');
        return;
    }
    
    // 切换到注册表单
    showSignupBtn.addEventListener('click', (e) => {
        e.preventDefault();
        switchToForm('signup');
    });
    
    // 切换到登录表单
    showSigninBtn.addEventListener('click', (e) => {
        e.preventDefault();
        switchToForm('signin');
    });
    
    // 表单切换函数
    function switchToForm(formType) {
        const signinForm = document.getElementById('signin-form');
        const signupForm = document.getElementById('signup-form');
        
        if (formType === 'signup') {
            // 显示注册表单，隐藏登录表单
            signinForm.classList.add('hidden');
            signupForm.classList.remove('hidden');
            signupForm.classList.add('slide-in');
            
            // 更新页面标题
            document.title = 'Sign Up - ShareTools';
            
            // 更新URL hash
            window.history.pushState(null, '', '#signup');
            
            // 焦点到第一个输入框
            setTimeout(() => {
                const firstInput = signupForm.querySelector('.form-input');
                if (firstInput) firstInput.focus();
            }, 100);
            
        } else {
            // 显示登录表单，隐藏注册表单
            signupForm.classList.add('hidden');
            signinForm.classList.remove('hidden');
            signinForm.classList.add('slide-in');
            
            // 更新页面标题
            document.title = '登录 - ShareTools';
            
            // 清除URL hash
            window.history.pushState(null, '', window.location.pathname);
            
            // 焦点到第一个输入框
            setTimeout(() => {
                const firstInput = signinForm.querySelector('.form-input');
                if (firstInput) firstInput.focus();
            }, 100);
        }
        
        // 清除动画类
        setTimeout(() => {
            signinForm.classList.remove('slide-in');
            signupForm.classList.remove('slide-in');
        }, 500);
    }
    
    // 暴露给全局
    window.switchToForm = switchToForm;
}

// ===== 表单验证 =====
function initFormValidation() {
    const forms = document.querySelectorAll('.auth-form');
    
    forms.forEach(form => {
        const inputs = form.querySelectorAll('.form-input');
        const submitBtn = form.querySelector('.auth-button');
        
        // 实时验证
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                validateInput(input);
                updateSubmitButton(form);
            });
            
            input.addEventListener('blur', () => {
                validateInput(input);
            });
        });
        
        // 表单提交
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            if (validateForm(form)) {
                handleFormSubmit(form);
            }
        });
    });
}

// 验证单个输入框
function validateInput(input) {
    const inputBox = input.closest('.input-box');
    const value = input.value.trim();
    const type = input.type;
    const placeholder = input.placeholder;
    
    // 移除之前的错误状态
    removeError(inputBox);
    
    // 基础验证
    if (!value) {
        showError(inputBox, `${placeholder}不能为空`);
        return false;
    }
    
    // 邮箱验证
    if (type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            showError(inputBox, '请输入有效的邮箱地址');
            return false;
        }
    }
    
    // 密码验证
    if (type === 'password' && placeholder.includes('密码') && !placeholder.includes('确认')) {
        if (value.length < 6) {
            showError(inputBox, '密码至少需要6个字符');
            return false;
        }
    }
    
    // 确认密码验证
    if (placeholder.includes('确认密码')) {
        const passwordInput = input.form.querySelector('input[placeholder="密码"]');
        if (passwordInput && value !== passwordInput.value) {
            showError(inputBox, '两次输入的密码不一致');
            return false;
        }
    }
    
    // 用户名验证
    if (placeholder.includes('用户名')) {
        if (value.length < 3) {
            showError(inputBox, '用户名至少需要3个字符');
            return false;
        }
    }
    
    return true;
}

// 验证整个表单
function validateForm(form) {
    const inputs = form.querySelectorAll('.form-input');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!validateInput(input)) {
            isValid = false;
        }
    });
    
    // 验证必选复选框
    const requiredCheckboxes = form.querySelectorAll('.checkbox[required]');
    requiredCheckboxes.forEach(checkbox => {
        if (!checkbox.checked) {
            showError(checkbox.closest('.form-options'), '请同意服务条款和隐私政策');
            isValid = false;
        }
    });
    
    return isValid;
}

// 显示错误信息
function showError(container, message) {
    removeError(container);
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
        color: var(--color-error);
        font-size: var(--font-size-small);
        margin-top: var(--spacing-xs);
        animation: fadeInUp 0.3s ease;
    `;
    
    container.appendChild(errorDiv);
    container.classList.add('error');
    
    // 输入框边框变红
    const inputBox = container.querySelector('.input-box');
    if (inputBox) {
        inputBox.style.borderColor = 'var(--color-error)';
    }
}

// 移除错误信息
function removeError(container) {
    const errorMessage = container.querySelector('.error-message');
    if (errorMessage) {
        errorMessage.remove();
    }
    
    container.classList.remove('error');
    
    // 恢复输入框边框
    const inputBox = container.querySelector('.input-box');
    if (inputBox) {
        inputBox.style.borderColor = '';
    }
}

// 更新提交按钮状态
function updateSubmitButton(form) {
    const submitBtn = form.querySelector('.auth-button');
    const inputs = form.querySelectorAll('.form-input');
    const requiredCheckboxes = form.querySelectorAll('.checkbox[required]');
    
    let allValid = true;
    
    // 检查所有输入框
    inputs.forEach(input => {
        if (!input.value.trim()) {
            allValid = false;
        }
    });
    
    // 检查必选复选框
    requiredCheckboxes.forEach(checkbox => {
        if (!checkbox.checked) {
            allValid = false;
        }
    });
    
    // 更新按钮状态
    if (allValid) {
        submitBtn.removeAttribute('disabled');
        submitBtn.style.opacity = '1';
    } else {
        submitBtn.setAttribute('disabled', 'true');
        submitBtn.style.opacity = '0.6';
    }
}

// 处理表单提交
function handleFormSubmit(form) {
    const submitBtn = form.querySelector('.auth-button');
    const formId = form.id;
    
    // 显示加载状态
    submitBtn.classList.add('loading');
    submitBtn.textContent = formId === 'signin-form' ? '登录中...' : '注册中...';
    
    // 收集表单数据
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // 手动收集输入框数据（因为没有name属性）
    const inputs = form.querySelectorAll('.form-input');
    const collectData = {};
    
    inputs.forEach((input, index) => {
        const name = input.name;
        const placeholder = input.placeholder;
        let key = '';
        
        if (name === 'username') key = 'username';
        else if (name === 'email') key = 'email'; 
        else if (name === 'password_confirm') key = 'confirmPassword';
        else if (name === 'password') key = 'password';
        else if (placeholder.includes('Username') || placeholder.includes('Email')) key = 'username';
        else if (placeholder.includes('Password') && !placeholder.includes('Confirm')) key = 'password';
        
        if (key) collectData[key] = input.value.trim();
    });
    
    console.log('表单数据:', collectData);
    
    // 调用API
    if (formId === 'signin-form') {
        handleSignin(collectData, submitBtn);
    } else {
        handleSignup(collectData, submitBtn);
    }
}

// Handle login
async function handleSignin(data, submitBtn) {
    try {
        const response = await fetch('/api/auth/login/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            },
            body: JSON.stringify({
                username: data.username || data.email,
                password: data.password
            })
        });
        
        // Check if response is ok before parsing JSON
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            // Login successful
            submitBtn.classList.remove('loading');
            submitBtn.textContent = 'Login Successful!';
            submitBtn.style.background = 'var(--color-success)';
            
            // Show success message
            showSuccessMessage('Login successful! Redirecting...');
            
            // Save user info to localStorage
            localStorage.setItem('user', JSON.stringify(result.user));
            
            // Redirect to homepage
            setTimeout(() => {
                window.location.href = '/';
            }, 1500);
        } else {
            // Login failed - show specific error message
            throw new Error(result.message || 'Invalid username or password');
        }
    } catch (error) {
        console.error('Login error:', error);
        
        // Restore button state
        submitBtn.classList.remove('loading');
        submitBtn.textContent = 'Login';
        submitBtn.style.background = '';
        
        // Show appropriate error message
        let errorMessage = 'Login failed, please try again';
        if (error.message.includes('HTTP error')) {
            errorMessage = 'Server error, please try again later';
        } else if (error.message.includes('Invalid') || error.message.includes('password') || error.message.includes('username')) {
            errorMessage = error.message;
        } else if (error.message.includes('Failed to fetch')) {
            errorMessage = 'Network error, please check your connection';
        }
        
        showErrorMessage(errorMessage);
    }
}

// Handle registration
async function handleSignup(data, submitBtn) {
    try {
        // Validate password confirmation
        if (data.password !== data.confirmPassword) {
            throw new Error('Passwords do not match');
        }
        
        const response = await fetch('/api/auth/register/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            },
            body: JSON.stringify({
                username: data.username,
                email: data.email,
                password: data.password,
                password_confirm: data.confirmPassword
            })
        });
        
        // Check if response is ok before parsing JSON
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            // Registration successful
            submitBtn.classList.remove('loading');
            submitBtn.textContent = 'Registration Successful!';
            submitBtn.style.background = 'var(--color-success)';
            
            // Show success message
            showSuccessMessage('Registration successful! You can now login');
            
            // Switch to login form
            setTimeout(() => {
                window.switchToForm('signin');
                // Pre-fill username
                const usernameInput = document.querySelector('#signin-form input[placeholder*="用户名"]');
                if (usernameInput) {
                    usernameInput.value = data.username;
                }
            }, 2000);
        } else {
            // Registration failed - show specific error message
            throw new Error(result.message || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        
        // Restore button state
        submitBtn.classList.remove('loading');
        submitBtn.textContent = 'Register';
        submitBtn.style.background = '';
        
        // Show appropriate error message
        let errorMessage = 'Registration failed, please try again';
        if (error.message.includes('HTTP error')) {
            errorMessage = 'Server error, please try again later';
        } else if (error.message.includes('Passwords do not match')) {
            errorMessage = error.message;
        } else if (error.message.includes('Failed to fetch')) {
            errorMessage = 'Network error, please check your connection';
        } else if (error.message.includes('already exists') || error.message.includes('taken')) {
            errorMessage = 'Username or email already exists';
        }
        
        showErrorMessage(errorMessage);
    }
}

// 获取CSRF令牌
function getCsrfToken() {
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]');
    if (csrfToken) {
        return csrfToken.value;
    }
    
    // 从cookie中获取CSRF令牌
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'csrftoken') {
            return value;
        }
    }
    
    return '';
}

// 显示错误消息
function showErrorMessage(message) {
    // 移除之前的消息
    const existingMessage = document.querySelector('.error-message-toast');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'error-message-toast';
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--color-error);
        color: white;
        padding: var(--spacing-md) var(--spacing-lg);
        border-radius: var(--radius-default);
        box-shadow: var(--shadow-high);
        z-index: 9999;
        animation: slideInRight 0.5s ease;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    document.body.appendChild(messageDiv);
    
    // 3秒后自动移除
    setTimeout(() => {
        messageDiv.style.animation = 'slideInRight 0.5s ease reverse';
        setTimeout(() => messageDiv.remove(), 500);
    }, 4000);
}

// 显示成功消息
function showSuccessMessage(message) {
    // 移除之前的消息
    const existingMessage = document.querySelector('.success-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'success-message';
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--color-success);
        color: white;
        padding: var(--spacing-md) var(--spacing-lg);
        border-radius: var(--radius-default);
        box-shadow: var(--shadow-high);
        z-index: 9999;
        animation: slideInRight 0.5s ease;
    `;
    
    // 添加滑入动画
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            0% {
                transform: translateX(100%);
                opacity: 0;
            }
            100% {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(messageDiv);
    
    // 3秒后自动移除
    setTimeout(() => {
        messageDiv.style.animation = 'slideInRight 0.5s ease reverse';
        setTimeout(() => messageDiv.remove(), 500);
    }, 3000);
}

// ===== URL处理 =====
function initURLHandling() {
    // 检查URL hash
    const hash = window.location.hash;
    if (hash === '#signup') {
        setTimeout(() => {
            window.switchToForm('signup');
        }, 100);
    }
    
    // 监听浏览器后退/前进
    window.addEventListener('popstate', () => {
        const hash = window.location.hash;
        if (hash === '#signup') {
            window.switchToForm('signup');
        } else {
            window.switchToForm('signin');
        }
    });
}

// ===== 密码显示/隐藏功能 =====
function initPasswordToggle() {
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    
    passwordInputs.forEach(input => {
        const inputBox = input.closest('.input-box');
        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'password-toggle';
        toggleBtn.innerHTML = '<i class="bx bx-hide"></i>';
        toggleBtn.style.cssText = `
            background: none;
            border: none;
            color: var(--color-text-secondary);
            cursor: pointer;
            font-size: 1.25rem;
            padding: 0;
            margin-left: var(--spacing-xs);
        `;
        
        toggleBtn.addEventListener('click', () => {
            if (input.type === 'password') {
                input.type = 'text';
                toggleBtn.innerHTML = '<i class="bx bx-show"></i>';
            } else {
                input.type = 'password';
                toggleBtn.innerHTML = '<i class="bx bx-hide"></i>';
            }
        });
        
        inputBox.appendChild(toggleBtn);
    });
}

// 页面加载完成后添加密码切换功能
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initPasswordToggle, 100);
});

// ===== 社交登录处理 =====
document.addEventListener('DOMContentLoaded', () => {
    const socialButtons = document.querySelectorAll('.social-button');
    
    socialButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            
            const provider = button.classList.contains('google') ? 'Google' : 'GitHub';
            showSuccessMessage(`正在跳转到${provider}登录...`);
            
            // 这里应该实现实际的社交登录逻辑
            console.log(`${provider}登录被点击`);
        });
    });
});

// ===== 键盘导航优化 =====
document.addEventListener('DOMContentLoaded', () => {
    const forms = document.querySelectorAll('.auth-form');
    
    forms.forEach(form => {
        const inputs = form.querySelectorAll('.form-input, .auth-button');
        
        inputs.forEach((input, index) => {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    
                    if (input.classList.contains('auth-button')) {
                        // 如果是提交按钮，提交表单
                        form.dispatchEvent(new Event('submit'));
                    } else {
                        // 跳转到下一个输入框
                        const nextInput = inputs[index + 1];
                        if (nextInput) {
                            nextInput.focus();
                        }
                    }
                }
            });
        });
    });
});

// ===== 错误处理 =====
window.addEventListener('error', (e) => {
    console.error('登录页面JavaScript错误:', e.error);
});

// ===== 导出函数供其他模块使用 =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        switchToForm: window.switchToForm,
        showSuccessMessage
    };
}