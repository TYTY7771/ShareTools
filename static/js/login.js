/* ShareTools Login Page JavaScript */

// ===== Initialize after page load =====
document.addEventListener('DOMContentLoaded', () => {
    // Initialize login functionality
    initLoginForms();
    initFormValidation();
    initURLHandling();
    
    console.log('ShareTools login page initialized');
});

// ===== Form switching functionality =====
function initLoginForms() {
    const signinForm = document.getElementById('signin-form');
    const signupForm = document.getElementById('signup-form');
    const showSignupBtn = document.getElementById('show-signup');
    const showSigninBtn = document.getElementById('show-signin');
    
    if (!signinForm || !signupForm || !showSignupBtn || !showSigninBtn) {
        console.error('Login form elements not found');
        return;
    }
    
    // Switch to signup form
    showSignupBtn.addEventListener('click', (e) => {
        e.preventDefault();
        switchToForm('signup');
    });
    
    // Switch to signin form
    showSigninBtn.addEventListener('click', (e) => {
        e.preventDefault();
        switchToForm('signin');
    });
    
    // Form switching function
    function switchToForm(formType) {
        const signinForm = document.getElementById('signin-form');
        const signupForm = document.getElementById('signup-form');
        
        if (formType === 'signup') {
            // Show signup form, hide signin form
            signinForm.classList.add('hidden');
            signupForm.classList.remove('hidden');
            signupForm.classList.add('slide-in');
            
            // Update page title
            document.title = 'Sign Up - ShareTools';
            
            // Update URL hash
            window.history.pushState(null, '', '#signup');
            
            // Focus on first input field
            setTimeout(() => {
                const firstInput = signupForm.querySelector('.form-input');
                if (firstInput) firstInput.focus();
            }, 100);
            
        } else {
            // Show signin form, hide signup form
            signupForm.classList.add('hidden');
            signinForm.classList.remove('hidden');
            signinForm.classList.add('slide-in');
            
            // Update page title
            document.title = 'Sign In - ShareTools';
            
            // Clear URL hash
            window.history.pushState(null, '', window.location.pathname);
            
            // Focus on first input field
            setTimeout(() => {
                const firstInput = signinForm.querySelector('.form-input');
                if (firstInput) firstInput.focus();
            }, 100);
        }
        
        // Clear animation classes
        setTimeout(() => {
            signinForm.classList.remove('slide-in');
            signupForm.classList.remove('slide-in');
        }, 500);
    }
    
    // Expose to global
    window.switchToForm = switchToForm;
}

// ===== Form validation =====
function initFormValidation() {
    const forms = document.querySelectorAll('.auth-form');
    
    forms.forEach(form => {
        const inputs = form.querySelectorAll('.form-input');
        const submitBtn = form.querySelector('.auth-button');
        
        // Real-time validation
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                validateInput(input);
                updateSubmitButton(form);
            });
            
            input.addEventListener('blur', () => {
                validateInput(input);
            });
        });
        
        // Form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            if (validateForm(form)) {
                handleFormSubmit(form);
            }
        });
    });
}

// Validate individual input
function validateInput(input) {
    const inputBox = input.closest('.input-box');
    const value = input.value.trim();
    const type = input.type;
    const placeholder = input.placeholder;
    
    // Remove previous error state
    removeError(inputBox);
    
    // Basic validation
    if (!value) {
        showError(inputBox, `${placeholder} cannot be empty`);
        return false;
    }
    
    // Email validation
    if (type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            showError(inputBox, 'Please enter a valid email address');
            return false;
        }
    }
    
    // Password validation
    if (type === 'password' && placeholder.includes('Password') && !placeholder.includes('Confirm')) {
        if (value.length < 6) {
            showError(inputBox, 'Password must be at least 6 characters');
            return false;
        }
    }
    
    // Confirm password validation
    if (placeholder.includes('Confirm Password')) {
        const passwordInput = input.form.querySelector('input[placeholder="Password"]');
        if (passwordInput && value !== passwordInput.value) {
            showError(inputBox, 'Passwords do not match');
            return false;
        }
    }
    
    // Username validation
    if (placeholder.includes('Username')) {
        if (value.length < 3) {
            showError(inputBox, 'Username must be at least 3 characters');
            return false;
        }
    }
    
    return true;
}

// Validate entire form
function validateForm(form) {
    const inputs = form.querySelectorAll('.form-input');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!validateInput(input)) {
            isValid = false;
        }
    });
    
    // Validate required checkboxes
    const requiredCheckboxes = form.querySelectorAll('.checkbox[required]');
    requiredCheckboxes.forEach(checkbox => {
        if (!checkbox.checked) {
            showError(checkbox.closest('.form-options'), 'Please agree to the terms of service and privacy policy');
            isValid = false;
        }
    });
    
    return isValid;
}

// Show error message
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
    
    // Input box border turns red
    const inputBox = container.querySelector('.input-box');
    if (inputBox) {
        inputBox.style.borderColor = 'var(--color-error)';
    }
}

// Remove error message
function removeError(container) {
    const errorMessage = container.querySelector('.error-message');
    if (errorMessage) {
        errorMessage.remove();
    }
    
    container.classList.remove('error');
    
    // Restore input box border
    const inputBox = container.querySelector('.input-box');
    if (inputBox) {
        inputBox.style.borderColor = '';
    }
}

// Update submit button state
function updateSubmitButton(form) {
    const submitBtn = form.querySelector('.auth-button');
    const inputs = form.querySelectorAll('.form-input');
    const requiredCheckboxes = form.querySelectorAll('.checkbox[required]');
    
    let allValid = true;
    
    // Check all input fields
    inputs.forEach(input => {
        if (!input.value.trim()) {
            allValid = false;
        }
    });
    
    // Check required checkboxes
    requiredCheckboxes.forEach(checkbox => {
        if (!checkbox.checked) {
            allValid = false;
        }
    });
    
    // Update button state
    if (allValid) {
        submitBtn.removeAttribute('disabled');
        submitBtn.style.opacity = '1';
    } else {
        submitBtn.setAttribute('disabled', 'true');
        submitBtn.style.opacity = '0.6';
    }
}

// Handle form submission
function handleFormSubmit(form) {
    const submitBtn = form.querySelector('.auth-button');
    const formId = form.id;
    
    // Show loading state
    submitBtn.classList.add('loading');
    submitBtn.textContent = formId === 'signin-form' ? 'Signing in...' : 'Signing up...';
    
    // Collect form data
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Manually collect input data (because there are no name attributes)
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
    
    console.log('Form data:', collectData);
    
    // Call API
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
                const usernameInput = document.querySelector('#signin-form input[placeholder*="Username"]');
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

// Get CSRF token
function getCsrfToken() {
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]');
    if (csrfToken) {
        return csrfToken.value;
    }
    
    // Get CSRF token from cookie
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'csrftoken') {
            return value;
        }
    }
    
    return '';
}

// Show error message
function showErrorMessage(message) {
    // Remove previous message
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
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        messageDiv.style.animation = 'slideInRight 0.5s ease reverse';
        setTimeout(() => messageDiv.remove(), 500);
    }, 4000);
}

// Show success message
function showSuccessMessage(message) {
    // Remove previous message
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
    
    // Add slide-in animation
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
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        messageDiv.style.animation = 'slideInRight 0.5s ease reverse';
        setTimeout(() => messageDiv.remove(), 500);
    }, 3000);
}

// ===== URL handling =====
function initURLHandling() {
    // Check URL hash
    const hash = window.location.hash;
    if (hash === '#signup') {
        setTimeout(() => {
            window.switchToForm('signup');
        }, 100);
    }
    
    // Listen for browser back/forward
    window.addEventListener('popstate', () => {
        const hash = window.location.hash;
        if (hash === '#signup') {
            window.switchToForm('signup');
        } else {
            window.switchToForm('signin');
        }
    });
}

// ===== Password show/hide functionality =====
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

// Add password toggle functionality after page load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initPasswordToggle, 100);
});

// ===== Social login handling =====
document.addEventListener('DOMContentLoaded', () => {
    const socialButtons = document.querySelectorAll('.social-button');
    
    socialButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            
            const provider = button.classList.contains('google') ? 'Google' : 'GitHub';
            showSuccessMessage(`Redirecting to ${provider} login...`);
            
            // Actual social login logic should be implemented here
            console.log(`${provider} login clicked`);
        });
    });
});

// ===== Keyboard navigation optimization =====
document.addEventListener('DOMContentLoaded', () => {
    const forms = document.querySelectorAll('.auth-form');
    
    forms.forEach(form => {
        const inputs = form.querySelectorAll('.form-input, .auth-button');
        
        inputs.forEach((input, index) => {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    
                    if (input.classList.contains('auth-button')) {
                        // If it's submit button, submit form
                        form.dispatchEvent(new Event('submit'));
                    } else {
                        // Jump to next input field
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

// ===== Error handling =====
window.addEventListener('error', (e) => {
    console.error('Login page JavaScript error:', e.error);
});

// ===== Export functions for other modules =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        switchToForm: window.switchToForm,
        showSuccessMessage
    };
}