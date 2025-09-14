/**
 * Helper Functions for Evaluation System
 */

// Utility functions for common operations
const Helpers = {
    
    /**
     * Format date to readable string
     */
    formatDate: function(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    /**
     * Format date to short format
     */
    formatDateShort: function(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },
    
    /**
     * Calculate days between dates
     */
    daysBetween: function(date1, date2) {
        const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
        const firstDate = new Date(date1);
        const secondDate = new Date(date2);
        return Math.round(Math.abs((firstDate - secondDate) / oneDay));
    },
    
    /**
     * Get status badge HTML
     */
    getStatusBadge: function(status, type = 'default') {
        const badges = {
            'active': 'badge bg-success',
            'inactive': 'badge bg-secondary',
            'pending': 'badge bg-warning',
            'completed': 'badge bg-success',
            'overdue': 'badge bg-danger',
            'missed': 'badge bg-danger',
            'draft': 'badge bg-secondary',
            'published': 'badge bg-primary'
        };
        
        const badgeClass = badges[status] || 'badge bg-secondary';
        return `<span class="${badgeClass}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>`;
    },
    
    /**
     * Truncate text
     */
    truncateText: function(text, maxLength = 100) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    },
    
    /**
     * Show loading spinner
     */
    showLoading: function(element) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        if (element) {
            element.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';
        }
    },
    
    /**
     * Hide loading spinner
     */
    hideLoading: function(element) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        if (element) {
            element.innerHTML = '';
        }
    },
    
    /**
     * Show toast notification
     */
    showToast: function(message, type = 'info') {
        if (typeof toastr !== 'undefined') {
            toastr[type](message);
        } else if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: type,
                title: message,
                showConfirmButton: false,
                timer: 3000
            });
        } else {
            alert(message);
        }
    },
    
    /**
     * Confirm dialog
     */
    confirm: function(message, callback) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: 'Are you sure?',
                text: message,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Yes',
                cancelButtonText: 'Cancel'
            }).then((result) => {
                if (result.isConfirmed && callback) {
                    callback();
                }
            });
        } else {
            if (confirm(message) && callback) {
                callback();
            }
        }
    },
    
    /**
     * Validate email
     */
    isValidEmail: function(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },
    
    /**
     * Validate required fields
     */
    validateRequired: function(fields) {
        let isValid = true;
        fields.forEach(field => {
            const element = document.getElementById(field);
            if (element && !element.value.trim()) {
                element.classList.add('is-invalid');
                isValid = false;
            } else if (element) {
                element.classList.remove('is-invalid');
                element.classList.add('is-valid');
            }
        });
        return isValid;
    },
    
    /**
     * Clear form validation
     */
    clearValidation: function(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.querySelectorAll('.is-valid, .is-invalid').forEach(el => {
                el.classList.remove('is-valid', 'is-invalid');
            });
            form.querySelectorAll('.form-text').forEach(el => {
                el.remove();
            });
        }
    },
    
    /**
     * Reset form
     */
    resetForm: function(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.reset();
            this.clearValidation(formId);
        }
    },
    
    /**
     * Make AJAX request
     */
    ajax: function(url, options = {}) {
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        };
        
        const config = { ...defaultOptions, ...options };
        
        return fetch(url, config)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .catch(error => {
                console.error('AJAX Error:', error);
                throw error;
            });
    },
    
    /**
     * Debounce function
     */
    debounce: function(func, wait, immediate) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    },
    
    /**
     * Throttle function
     */
    throttle: function(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

// Make Helpers available globally
window.Helpers = Helpers;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Helpers;
}
