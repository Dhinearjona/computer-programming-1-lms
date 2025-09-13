/**
 * Common DataTables Utilities
 * 
 * This file provides centralized utilities and configurations for DataTables
 * operations across the application. It includes:
 * 
 * - Standard DataTable configurations (standard, compact)
 * - Common render functions for consistent data display
 * - AJAX error and success handlers
 * - Form utilities for validation and data handling
 * - Numeric input validation utilities
 * - DataTable instance management
 * - Debounce utility for search inputs
 * 
 * Usage:
 * - Import this file before any specific DataTable implementations
 * - Use DataTableDefaults for consistent table configurations
 * - Use DataTableRenderers for consistent data rendering
 * - Use FormUtils for form operations
 * - Use NumericValidation for input validation
 * 
 * Dependencies:
 * - jQuery
 * - DataTables library
 * - Bootstrap
 * - Toastr for notifications
 */

// Common DataTable configuration
const DataTableDefaults = {
    // Standard configuration
    standard: {
        columnDefs: [{ orderable: false, targets: [-1] }],
        order: [[0, 'asc']],
        dom: "<'row'<'col-12 mb-3'tr>>" +
             "<'row'<'col-12 d-flex flex-column flex-md-row justify-content-between align-items-center gap-2'ip>>",
        processing: true,
        language: {
            emptyTable: "No data found",
            info: "Showing _START_ to _END_ of _TOTAL_ entries",
            infoEmpty: "Showing 0 to 0 of 0 entries",
            infoFiltered: "(filtered from _MAX_ total entries)",
            lengthMenu: "Show _MENU_ entries per page",
            loadingRecords: "Loading...",
            processing: "Processing...",
            search: "Search:",
            zeroRecords: "No matching records found"
        }
    },
    
    // Compact configuration for modals
    compact: {
        columnDefs: [{ orderable: false, targets: [-1] }],
        order: [[0, 'asc']],
        dom: "<'row'<'col-12'tr>>" +
             "<'row'<'col-12'ip>>",
        processing: true,
        pageLength: 10,
        language: {
            emptyTable: "No data found",
            info: "Showing _START_ to _END_ of _TOTAL_ entries",
            infoEmpty: "Showing 0 to 0 of 0 entries",
            infoFiltered: "(filtered from _MAX_ total entries)",
            lengthMenu: "Show _MENU_ entries",
            loadingRecords: "Loading...",
            processing: "Processing...",
            search: "Search:",
            zeroRecords: "No matching records found"
        }
    }
};

// Common render functions
const DataTableRenderers = {
    // Text alignment renderers
    textStart: (data) => `<div class="text-start">${data || '—'}</div>`,
    textEnd: (data) => `<div class="text-end">${data || '0'}</div>`,
    textCenter: (data) => `<div class="text-center">${data || '—'}</div>`,
    
    // Status badge renderer
    statusBadge: (data, activeValue = 1) => {
        const isActive = data == activeValue;
        return `<span class="badge bg-${isActive ? 'success' : 'danger'}">${isActive ? 'Active' : 'Inactive'}</span>`;
    },
    
    // Action button renderer
    actionButton: (iconClass, title, dataAttribute = '', additionalClasses = '', actionClass = '') => {
        return (data, type, row) => {
            const attr = dataAttribute ? `data-${dataAttribute}="${row[dataAttribute]}"` : '';
            const actionAttr = actionClass ? `data-action="${actionClass}"` : '';
            return `<i class="${iconClass} ${additionalClasses} ${actionClass}" style="cursor:pointer;" title="${title}" ${attr} ${actionAttr}></i>`;
        };
    },
    
    // Date renderer
    date: (data) => {
        if (!data) return '—';
        try {
            // Use moment.js to format date in YYYY-MM-DD HH:MM:SS format
            return moment(data).format('YYYY-MM-DD HH:mm:ss');
        } catch (e) {
            return data;
        }
    },
    
    // Number renderer with formatting
    number: (data, decimals = 0) => {
        const num = parseFloat(data) || 0;
        return num.toFixed(decimals);
    }
};

// Common AJAX error handler
const handleAjaxError = (error, customMessage = 'Error loading data') => {
    toastr.error(customMessage);
    return [];
};

// Common AJAX success handler
const handleAjaxSuccess = (json, customMessage = 'Error loading data') => {
    if (json.status === 1) {
        return json.data?.data || [];
    } else {
        toastr.error(json.message || customMessage);
        return [];
    }
};

// Debounce utility for search inputs
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// DataTable instance manager
class DataTableManager {
    constructor() {
        this.instances = new Map();
        this.searchTimeouts = new Map();
    }
    
    // Create and register a DataTable instance
    create(selector, config, instanceName) {
        // Destroy existing instance if it exists
        this.destroy(instanceName);
        
        // Create new instance
        const instance = new DataTable(selector, config);
        this.instances.set(instanceName, instance);
        
        return instance;
    }
    
    // Get a DataTable instance
    get(instanceName) {
        return this.instances.get(instanceName);
    }
    
    // Destroy a DataTable instance
    destroy(instanceName) {
        const instance = this.instances.get(instanceName);
        if (instance) {
            instance.destroy();
            this.instances.delete(instanceName);
        }
    }
    
    // Reload a DataTable instance
    reload(instanceName, callback) {
        const instance = this.instances.get(instanceName);
        if (instance) {
            instance.ajax.reload(callback);
        }
    }
    
    // Clear search timeout for an instance
    clearSearchTimeout(instanceName) {
        const timeout = this.searchTimeouts.get(instanceName);
        if (timeout) {
            clearTimeout(timeout);
            this.searchTimeouts.delete(instanceName);
        }
    }
    
    // Set search timeout for an instance
    setSearchTimeout(instanceName, timeout) {
        this.searchTimeouts.set(instanceName, timeout);
    }
    
    // Destroy all instances
    destroyAll() {
        this.instances.forEach((instance, name) => {
            instance.destroy();
        });
        this.instances.clear();
        this.searchTimeouts.clear();
    }
}

// Global DataTable manager instance
window.dataTableManager = new DataTableManager();

// Common form utilities
const FormUtils = {
    // Reset form and clear validation
    resetForm: (formSelector, additionalSelectors = []) => {
        const form = $(formSelector);
        form[0].reset();
        form.find('.is-invalid').removeClass('is-invalid');
        form.find('.invalid-feedback').remove();
        
        // Reset additional elements
        additionalSelectors.forEach(selector => {
            $(selector).val('').removeClass('is-invalid');
        });
    },
    
    // Validate required fields
    validateRequired: (data, requiredFields) => {
        const errors = [];
        requiredFields.forEach(field => {
            if (!data[field] && data[field] !== 0) {
                const fieldName = field.replace(/([A-Z])/g, ' $1').trim();
                errors.push(`${fieldName} is required`);
            }
        });
        return errors;
    },
    
    // Get form data as object
    getFormData: (formSelector) => {
        const form = $(formSelector)[0];
        const formData = new FormData(form);
        return Object.fromEntries(formData.entries());
    }
};

// Numeric input validation
const NumericValidation = {
    // Initialize numeric validation for input fields
    init: (selectors, options = {}) => {
        const {
            allowNegative = false,
            allowDecimals = true,
            minValue = null,
            maxValue = null
        } = options;
        
        selectors.forEach(selector => {
            $(selector).on('input', function() {
                let value = $(this).val();
                
                // Remove non-numeric characters based on options
                if (allowNegative && allowDecimals) {
                    value = value.replace(/[^0-9.-]/g, '');
                } else if (allowDecimals) {
                    value = value.replace(/[^0-9.]/g, '');
                } else if (allowNegative) {
                    value = value.replace(/[^0-9-]/g, '');
                } else {
                    value = value.replace(/[^0-9]/g, '');
                }
                
                // Handle decimal points
                if (allowDecimals) {
                    const parts = value.split('.');
                    if (parts.length > 2) {
                        value = parts[0] + '.' + parts.slice(1).join('');
                    }
                }
                
                // Handle negative signs
                if (allowNegative) {
                    if (value.startsWith('-')) {
                        value = '-' + value.substring(1).replace(/-/g, '');
                    } else {
                        value = value.replace(/-/g, '');
                    }
                }
                
                // Apply min/max constraints
                const numValue = parseFloat(value);
                if (!isNaN(numValue)) {
                    if (minValue !== null && numValue < minValue) {
                        value = minValue.toString();
                    }
                    if (maxValue !== null && numValue > maxValue) {
                        value = maxValue.toString();
                    }
                }
                
                $(this).val(value);
            });
            
            // Prevent paste of invalid content
            $(selector).on('paste', function(e) {
                e.preventDefault();
                const pastedText = (e.originalEvent || e).clipboardData.getData('text/plain');
                let numericOnly = pastedText;
                
                if (allowNegative && allowDecimals) {
                    numericOnly = pastedText.replace(/[^0-9.-]/g, '');
                } else if (allowDecimals) {
                    numericOnly = pastedText.replace(/[^0-9.]/g, '');
                } else if (allowNegative) {
                    numericOnly = pastedText.replace(/[^0-9-]/g, '');
                } else {
                    numericOnly = pastedText.replace(/[^0-9]/g, '');
                }
                
                $(this).val(numericOnly);
            });
        });
    }
};

// Export utilities for use in other modules
window.DataTableDefaults = DataTableDefaults;
window.DataTableRenderers = DataTableRenderers;
window.FormUtils = FormUtils;
window.NumericValidation = NumericValidation; 