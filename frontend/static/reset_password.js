/**
 * Password Reset Functionality
 * Handles password reset form with validation and strength checking
 */

document.addEventListener('DOMContentLoaded', function() {
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const resetForm = document.getElementById('reset-form');
    const submitBtn = document.getElementById('submit-btn');

    // Monitor password strength
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', function() {
            checkPasswordStrength(this.value);
            checkPasswordMatch();
        });
    }

    // Check password match on confirm password input
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', function() {
            checkPasswordMatch();
        });
    }

    // Handle form submission
    if (resetForm) {
        resetForm.addEventListener('submit', function(e) {
            e.preventDefault();
            resetPassword();
        });
    }
});

/**
 * Check password strength and update UI with requirements
 */
function checkPasswordStrength(password) {
    let strength = 0;
    let strengthText = 'Weak';
    let strengthColor = '#F44336'; // Red
    const requirements = {
        length: false,
        upper: false,
        lower: false,
        digit: false,
        special: false
    };

    // Check length (6 characters minimum)
    if (password.length >= 6) {
        strength += 1;
        requirements.length = true;
    }

    // Check uppercase
    if (/[A-Z]/.test(password)) {
        strength += 1;
        requirements.upper = true;
    }

    // Check lowercase
    if (/[a-z]/.test(password)) {
        strength += 1;
        requirements.lower = true;
    }

    // Check digit
    if (/\d/.test(password)) {
        strength += 1;
        requirements.digit = true;
    }

    // Check special character
    if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
        strength += 1;
        requirements.special = true;
    }

    // Determine strength level
    if (strength <= 1) {
        strengthText = 'Very Weak';
        strengthColor = '#F44336'; // Red
    } else if (strength <= 2) {
        strengthText = 'Weak';
        strengthColor = '#FF9800'; // Orange
    } else if (strength <= 3) {
        strengthText = 'Fair';
        strengthColor = '#FFC107'; // Yellow
    } else if (strength <= 4) {
        strengthText = 'Good';
        strengthColor = '#8BC34A'; // Light Green
    } else {
        strengthText = 'Strong';
        strengthColor = '#4CAF50'; // Green
    }

    // Update UI
    const strengthFill = document.getElementById('strength-fill');
    const strengthTextEl = document.getElementById('strength-text');
    
    if (strengthFill) {
        strengthFill.style.width = (strength * 20) + '%';
        strengthFill.style.backgroundColor = strengthColor;
    }
    
    if (strengthTextEl) {
        strengthTextEl.textContent = `Password strength: ${strengthText}`;
        strengthTextEl.style.color = strengthColor;
    }

    // Update requirement indicators
    updateRequirement('req-length', requirements.length);
    updateRequirement('req-upper', requirements.upper);
    updateRequirement('req-lower', requirements.lower);
    updateRequirement('req-digit', requirements.digit);
    updateRequirement('req-special', requirements.special);
}

/**
 * Update requirement indicator styling
 */
function updateRequirement(elementId, met) {
    const element = document.getElementById(elementId);
    if (element) {
        if (met) {
            element.style.color = '#4CAF50';
            const icon = element.querySelector('i');
            if (!icon) {
                element.innerHTML = '<i class="fas fa-check"></i> ' + element.textContent.trim();
            }
        } else {
            element.style.color = '#666';
        }
    }
}

/**
 * Check if passwords match
 */
function checkPasswordMatch() {
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const submitBtn = document.getElementById('submit-btn');

    if (newPassword && confirmPassword) {
        if (newPassword !== confirmPassword) {
            if (!document.getElementById('match-error')) {
                const error = document.createElement('div');
                error.id = 'match-error';
                error.className = 'alert alert-error';
                error.textContent = 'Passwords do not match';
                document.getElementById('confirm-password').parentElement.appendChild(error);
            }
            if (submitBtn) submitBtn.disabled = true;
        } else {
            const error = document.getElementById('match-error');
            if (error) error.remove();
            if (submitBtn) submitBtn.disabled = false;
        }
    }
}

/**
 * Submit password reset request
 */
async function resetPassword() {
    const token = document.getElementById('token').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const alertContainer = document.getElementById('alert-container');

    // Client-side validation
    if (!token) {
        showAlert(alertContainer, 'Invalid reset token', 'error');
        return;
    }

    if (!newPassword || !confirmPassword) {
        showAlert(alertContainer, 'Please enter and confirm your password', 'error');
        return;
    }

    if (newPassword !== confirmPassword) {
        showAlert(alertContainer, 'Passwords do not match', 'error');
        return;
    }

    // Validate password requirements
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{}|;:,.<>?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{}|;:,.<>?]{6,}$/;
    if (!passwordRegex.test(newPassword)) {
        showAlert(alertContainer, 'Password does not meet requirements', 'error');
        return;
    }

    try {
        const submitBtn = document.getElementById('submit-btn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Resetting...';

        const response = await fetch('/api/auth/reset-password-with-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                token: token,
                new_password: newPassword
            })
        });

        const data = await response.json();

        if (data.success) {
            // Show success message
            document.getElementById('reset-form').style.display = 'none';
            document.getElementById('success-form').style.display = 'block';
            
            // Redirect to login after 3 seconds
            setTimeout(() => {
                window.location.href = '/login';
            }, 3000);
        } else {
            showAlert(alertContainer, data.error || 'Password reset failed', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Reset Password';
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert(alertContainer, 'An error occurred. Please try again.', 'error');
        const submitBtn = document.getElementById('submit-btn');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Reset Password';
    }
}

/**
 * Display alert message
 */
function showAlert(container, message, type) {
    // Clear existing alerts
    container.innerHTML = '';

    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `<i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i> ${message}`;
    container.appendChild(alert);

    // Scroll to alert
    alert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
