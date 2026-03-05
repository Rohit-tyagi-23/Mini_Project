// Dashboard JavaScript for real-time interactivity

let trendChart = null;
let topIngredientsChart = null;

/**
 * Toast notification system
 */
function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-${getToastIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    if (duration > 0) {
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
}

function getToastIcon(type) {
    const icons = {
        'success': 'check-circle',
        'error': 'exclamation-circle',
        'warning': 'exclamation-triangle',
        'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 10px;';
    document.body.appendChild(container);
    return container;
}

function setButtonLoading(button, isLoading) {
    if (!button) return;
    
    if (isLoading) {
        button.disabled = true;
        button.dataset.originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        button.style.opacity = '0.7';
    } else {
        button.disabled = false;
        button.innerHTML = button.dataset.originalText || button.innerHTML;
        button.style.opacity = '1';
    }
}

/**
 * Make select elements searchable by typing
 */
function initSearchableSelects() {
    const selects = document.querySelectorAll('.searchable-select');
    
    selects.forEach(select => {
        let searchTimeout;
        let searchString = '';
        
        select.addEventListener('keydown', function(e) {
            const char = String.fromCharCode(e.which).toLowerCase();
            
            // Only process alphanumeric characters
            if (/[a-z0-9]/i.test(char)) {
                e.preventDefault();
                
                // Reset search string after 500ms of inactivity
                clearTimeout(searchTimeout);
                searchString += char;
                
                // Find matching option
                const options = Array.from(this.options);
                for (let option of options) {
                    if (option.value === '') continue; // Skip empty option
                    if (option.textContent.toLowerCase().startsWith(searchString)) {
                        this.value = option.value;
                        break;
                    }
                }
                
                // Reset search string after timeout
                searchTimeout = setTimeout(() => {
                    searchString = '';
                }, 500);
            }
            // Allow arrow keys and enter to work normally
            else if ([13, 27, 38, 40].includes(e.which)) {
                searchString = '';
            }
        });
    });
}

// Load dashboard on page load
document.addEventListener('DOMContentLoaded', function() {
    loadDashboard();
    loadIngredients();
    setDefaultDate();
    initSearchableSelects();
    
    // Attach form event listeners after DOM is ready
    const addSaleForm = document.getElementById('addSaleForm');
    if (addSaleForm) {
        addSaleForm.addEventListener('submit', handleAddSaleSubmit);
    }

    const addItemForm = document.getElementById('addItemForm');
    if (addItemForm) {
        addItemForm.addEventListener('submit', handleAddItemSubmit);
    }
    
    // Close modal when clicking outside
    window.onclick = function(event) {
        const addSaleModal = document.getElementById('addSaleModal');
        const addItemModal = document.getElementById('addItemModal');

        if (event.target === addSaleModal) {
            closeAddSaleModal();
        }

        if (event.target === addItemModal) {
            closeAddItemModal();
        }
    }
});

// Load dashboard statistics
async function loadDashboard() {
    try {
        showLoading(true);
        const response = await fetch('/api/dashboard-stats');
        const data = await response.json();

        if (data.success) {
            console.log('Dashboard data received:', data.stats);
            updateStats(data.stats);
            renderCharts(data.stats);
            showLoading(false);
        } else {
            console.error('API returned error:', data.error);
            showError('Failed to load dashboard: ' + data.error);
        }
    } catch (error) {
        console.error('JavaScript error in loadDashboard:', error);
        showError('Error loading dashboard: ' + error.message);
    }
}

// Update statistics cards
function updateStats(stats) {
    try {
        const totalIngredientsEl = document.getElementById('total-ingredients');
        const totalSalesEl = document.getElementById('total-sales');
        const avgDailySalesEl = document.getElementById('avg-daily-sales');
        const dateRangeEl = document.getElementById('date-range');
        
        if (!totalIngredientsEl || !totalSalesEl || !avgDailySalesEl || !dateRangeEl) {
            console.error('One or more stat card elements not found');
            return;
        }
        
        totalIngredientsEl.textContent = stats.total_ingredients;
        totalSalesEl.textContent = stats.total_sales.toFixed(0);
        avgDailySalesEl.textContent = stats.avg_daily_sales.toFixed(1);

        const dateRange = `${stats.date_range.start} to ${stats.date_range.end}`;
        dateRangeEl.textContent = dateRange;
        
        console.log('Stats updated successfully');
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

// Render charts
function renderCharts(stats) {
    try {
        console.log('Starting to render charts...');
        
        // Check if Chart library is loaded
        if (typeof Chart === 'undefined') {
            console.error('Chart.js library not loaded');
            showError('Chart library failed to load');
            return;
        }
        
        // Trend Chart
        const trendCtx = document.getElementById('trendChart');
        if (!trendCtx) {
            console.error('Canvas element trendChart not found');
            return;
        }
        
        if (trendChart) {
            trendChart.destroy();
        }
        
        trendChart = new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: stats.recent_trend.labels,
                datasets: [{
                    label: 'Daily Sales',
                    data: stats.recent_trend.values,
                    borderColor: '#2196F3',
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Units Sold'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    }
                }
            }
        });
        
        console.log('Trend chart rendered successfully');

        // Top Ingredients Chart
        const topCtx = document.getElementById('topIngredientsChart');
        if (!topCtx) {
            console.error('Canvas element topIngredientsChart not found');
            return;
        }
        
        if (topIngredientsChart) {
            topIngredientsChart.destroy();
        }

        const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'];
        
        topIngredientsChart = new Chart(topCtx, {
            type: 'bar',
            data: {
                labels: stats.top_ingredients.map(item => item.name),
                datasets: [{
                    label: 'Total Sales',
                    data: stats.top_ingredients.map(item => item.sales),
                    backgroundColor: colors,
                    borderColor: colors.map(color => color),
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Units Sold'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Ingredient'
                        }
                    }
                }
            }
        });
        
        console.log('Top ingredients chart rendered successfully');
    } catch (error) {
        console.error('Error rendering charts:', error);
        showError('Error rendering charts: ' + error.message);
    }
}

// Load ingredients for the modal
async function loadIngredients() {
    try {
        const response = await fetch('/api/ingredients');
        const data = await response.json();

        if (data.success) {
            const select = document.getElementById('sale-ingredient');
            if (select) {
                // Clear existing options except the first one
                while (select.options.length > 1) {
                    select.remove(1);
                }
                // Add new options
                data.ingredients.forEach(ingredient => {
                    const option = document.createElement('option');
                    option.value = ingredient;
                    option.textContent = ingredient;
                    select.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error loading ingredients:', error);
    }
}

async function handleAddItemSubmit(e) {
    e.preventDefault();

    const input = document.getElementById('item-name');
    const ingredientName = (input?.value || '').trim();
    const submitBtn = e.target.querySelector('button[type="submit"]');

    if (!ingredientName) {
        showToast('Please enter an item name', 'warning');
        input?.focus();
        return;
    }

    setButtonLoading(submitBtn, true);

    try {
        const response = await fetch('/api/inventory/items', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ingredient: ingredientName })
        });

        const data = await response.json();
        if (!data.success) {
            showToast('Error: ' + (data.error || 'Failed to add item'), 'error');
            return;
        }

        showToast(`"${ingredientName}" added to inventory!`, 'success', 2500);
        
        // Clear input and close modal smoothly
        input.value = '';
        await loadIngredients();
        
        setTimeout(() => {
            closeAddItemModal();
        }, 500);
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
        console.error('Add item error:', error);
    } finally {
        setButtonLoading(submitBtn, false);
    }
}

// Set default date to today
function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('sale-date').value = today;
}


// Show/hide loading indicator
function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'flex' : 'none';
    document.getElementById('dashboard-content').style.display = show ? 'none' : 'block';
}

// Show error message
function showError(message) {
    showLoading(false);
    showToast(message, 'error');
}

// Refresh dashboard
function refreshDashboard() {
    loadDashboard();
}

// Modal functions
function showAddSaleModal() {
    loadIngredients(); // Ensure ingredients are loaded when modal opens
    document.getElementById('addSaleModal').style.display = 'flex';
    // Focus on the select element to enable dropdown
    setTimeout(() => {
        document.getElementById('sale-ingredient').focus();
    }, 100);
}

function closeAddSaleModal() {
    document.getElementById('addSaleModal').style.display = 'none';
    document.getElementById('addSaleForm').reset();
}

function showAddItemModal() {
    document.getElementById('addItemModal').style.display = 'flex';
    setTimeout(() => {
        document.getElementById('item-name').focus();
    }, 100);
}

function closeAddItemModal() {
    document.getElementById('addItemModal').style.display = 'none';
    document.getElementById('addItemForm').reset();
}

// Handle add sale form submission
async function handleAddSaleSubmit(e) {
    e.preventDefault();

    const ingredient = document.getElementById('sale-ingredient').value;
    const date = document.getElementById('sale-date').value;
    const quantity = document.getElementById('sale-quantity').value;

    if (!ingredient.trim()) {
        showToast('Please select an ingredient', 'warning');
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true);

    try {
        const response = await fetch('/api/add-sale', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ingredient: ingredient,
                date: date,
                quantity: parseFloat(quantity)
            })
        });

        const data = await response.json();

        if (data.success) {
            showToast('Sale recorded successfully!', 'success', 2500);
            closeAddSaleModal();
            refreshDashboard();
        } else {
            showToast('Error: ' + (data.error || 'Failed to add sale'), 'error');
        }
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    } finally {
        setButtonLoading(submitBtn, false);
    }
}
