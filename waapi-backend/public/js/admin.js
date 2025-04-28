// Admin Panel JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const loginScreen = document.getElementById('loginScreen');
    const adminDashboard = document.getElementById('adminDashboard');
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    
    const logsTab = document.getElementById('logsTab');
    const statsTab = document.getElementById('statsTab');
    const accountTab = document.getElementById('accountTab');
    
    const navItems = document.querySelectorAll('.sidebar nav ul li');
    
    const logoutBtn = document.getElementById('logoutBtn');
    const userName = document.getElementById('userName');
    
    const logsTableBody = document.getElementById('logsTableBody');
    const logsLoading = document.getElementById('logsLoading');
    const noLogsData = document.getElementById('noLogsData');
    
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const paginationInfo = document.getElementById('paginationInfo');
    
    const cityFilter = document.getElementById('cityFilter');
    const serviceFilter = document.getElementById('serviceFilter');
    const startDateFilter = document.getElementById('startDate');
    const endDateFilter = document.getElementById('endDate');
    const applyFiltersBtn = document.getElementById('applyFilters');
    
    const periodBtns = document.querySelectorAll('.period-btn');
    
    const accountNameEl = document.getElementById('accountName');
    const accountEmailEl = document.getElementById('accountEmail');
    const accountRoleEl = document.getElementById('accountRole');
    
    // State
    let token = localStorage.getItem('token');
    let userData = JSON.parse(localStorage.getItem('userData'));
    let currentPage = 1;
    let totalPages = 1;
    let currentFilters = {};
    let currentPeriod = 'month';
    let charts = {};
    let logsUnsubscribe = null; // For real-time subscription
    
    // Initialize
    initApp();
    
    // Functions
    function initApp() {
        if (token) {
            // Verify token validity
            verifyToken();
        } else {
            showLoginScreen();
        }
        
        // Set up event listeners
        setupEventListeners();
    }
    
    function setupEventListeners() {
        // Login form
        loginForm.addEventListener('submit', handleLogin);
        
        // Navigation
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const tab = item.getAttribute('data-tab');
                switchTab(tab, item);
            });
        });
        
        // Logout
        logoutBtn.addEventListener('click', handleLogout);
        
        // Pagination
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                getLogs();
            }
        });
        
        nextPageBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                getLogs();
            }
        });
        
        // Filters
        applyFiltersBtn.addEventListener('click', () => {
            currentPage = 1;
            currentFilters = {
                city: cityFilter.value,
                service: serviceFilter.value,
                startDate: startDateFilter.value,
                endDate: endDateFilter.value
            };
            getLogs();
        });
        
        // Period selection for stats
        periodBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const period = btn.getAttribute('data-period');
                currentPeriod = period;
                
                // Update UI
                periodBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Refresh stats
                getStats();
            });
        });
    }
    
    function showLoginScreen() {
        loginScreen.style.display = 'flex';
        adminDashboard.style.display = 'none';
    }
    
    function showDashboard() {
        loginScreen.style.display = 'none';
        adminDashboard.style.display = 'block';
        
        // Set user info
        userName.textContent = userData.name;
        
        // Load initial data
        getLogs();
        getStats();
        updateAccountInfo();
    }
    
    function switchTab(tabId, navItem) {
        // Update navigation
        navItems.forEach(item => item.classList.remove('active'));
        navItem.classList.add('active');
        
        // Update content
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        document.getElementById(tabId + 'Tab').classList.add('active');
        
        // Load data if needed
        if (tabId === 'logs') {
            getLogs();
        } else if (tabId === 'stats') {
            getStats();
        }
    }
    
    async function handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        if (!email || !password) {
            loginError.textContent = 'Email and password are required';
            return;
        }
        
        loginError.textContent = '';
        
        try {
            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Save token and user data
                token = data.token;
                userData = data.user;
                
                localStorage.setItem('token', token);
                localStorage.setItem('userData', JSON.stringify(userData));
                
                // Show dashboard
                showDashboard();
            } else {
                loginError.textContent = data.message || 'Login failed';
            }
        } catch (error) {
            console.error('Login error:', error);
            loginError.textContent = 'Error connecting to server';
        }
    }
    
    function handleLogout() {
        // Clear token and user data
        token = null;
        userData = null;
        
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        
        // Show login screen
        showLoginScreen();
    }
    
    async function verifyToken() {
        try {
            const response = await fetch('/auth/verify', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                showDashboard();
            } else {
                // Token invalid
                handleLogout();
            }
        } catch (error) {
            console.error('Token verification error:', error);
            handleLogout();
        }
    }
    
    async function getLogs() {
        // Show loading
        logsTableBody.innerHTML = '';
        logsLoading.style.display = 'block';
        noLogsData.style.display = 'none';
        
        // Clean up any existing subscription
        if (logsUnsubscribe) {
            logsUnsubscribe();
            logsUnsubscribe = null;
        }
        
        try {
            // Set up a real-time connection to get logs
            const response = await fetch('/admin/real-time-logs', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to start real-time connection');
            }
            
            // Start EventSource for real-time updates
            setupRealTimeUpdates();
        } catch (error) {
            console.error('Error setting up real-time logs:', error);
            
            // Fall back to regular ajax if real-time fails
            fallbackToRegularLogs();
        }
    }
    
    // Set up real-time updates using Server-Sent Events
    function setupRealTimeUpdates() {
        const queryParams = new URLSearchParams({
            page: currentPage,
            limit: 10,
            ...currentFilters
        });
        
        // Create EventSource for real-time updates
        const eventSource = new EventSource(`/admin/sse-logs?${queryParams}&token=${token}`);
        
        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                
                if (data.status === 'success') {
                    const { logs, pagination } = data.data;
                    
                    // Update pagination
                    currentPage = pagination.page;
                    totalPages = pagination.totalPages;
                    paginationInfo.textContent = `Page ${currentPage} of ${totalPages}`;
                    
                    // Enable/disable pagination buttons
                    prevPageBtn.disabled = currentPage <= 1;
                    nextPageBtn.disabled = currentPage >= totalPages;
                    
                    // Render logs
                    if (logs.length === 0) {
                        logsLoading.style.display = 'none';
                        noLogsData.style.display = 'block';
                    } else {
                        renderLogs(logs);
                        logsLoading.style.display = 'none';
                    }
                }
            } catch (error) {
                console.error('Error parsing real-time data:', error);
                fallbackToRegularLogs();
            }
        };
        
        eventSource.onerror = () => {
            console.error('EventSource error, falling back to regular AJAX');
            eventSource.close();
            fallbackToRegularLogs();
        };
        
        // Store unsubscribe function
        logsUnsubscribe = () => {
            eventSource.close();
        };
    }
    
    // Fallback to regular AJAX if real-time fails
    async function fallbackToRegularLogs() {
        console.log('Using regular AJAX fallback for logs');
        
        // Build query string
        const queryParams = new URLSearchParams({
            page: currentPage,
            limit: 10,
            ...currentFilters
        });
        
        try {
            const response = await fetch(`/admin/logs?${queryParams}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            
            if (response.ok) {
                const { logs, pagination } = data.data;
                
                // Update pagination
                currentPage = pagination.page;
                totalPages = pagination.totalPages;
                paginationInfo.textContent = `Page ${currentPage} of ${totalPages}`;
                
                // Enable/disable pagination buttons
                prevPageBtn.disabled = currentPage <= 1;
                nextPageBtn.disabled = currentPage >= totalPages;
                
                // Render logs
                if (logs.length === 0) {
                    logsLoading.style.display = 'none';
                    noLogsData.style.display = 'block';
                } else {
                    renderLogs(logs);
                    logsLoading.style.display = 'none';
                }
            } else {
                throw new Error(data.message || 'Failed to get logs');
            }
        } catch (error) {
            console.error('Error getting logs:', error);
            logsLoading.style.display = 'none';
            noLogsData.style.display = 'block';
            noLogsData.textContent = 'Error loading logs';
        }
    }
    
    function renderLogs(logs) {
        logsTableBody.innerHTML = '';
        
        logs.forEach(log => {
            try {
                const row = document.createElement('tr');
                
                // Format date (with error handling)
                let formattedDate = '-';
                try {
                    const date = new Date(log.timestamp);
                    if (!isNaN(date.getTime())) {
                        formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
                    }
                } catch (err) {
                    console.error('Error formatting date:', err);
                }
                
                // Add customer name if available
                const customerInfo = log.customerName ? 
                    `<div><strong>${log.customerName}</strong></div>` : '';
                
                // Add company name if available
                const companyInfo = log.companyName ? 
                    `<div><em>${log.companyName}</em></div>` : '';
                
                // Add details if available
                const detailsInfo = log.inquiryDetails ? 
                    `<div class="details-text">${log.inquiryDetails}</div>` : '';
                
                // Add budget info if available
                const budgetInfo = log.budgetRange ? 
                    `<div class="budget-text">Budget: ${log.budgetRange}</div>` : '';
                
                // Combine phone with other info
                const phoneWithInfo = `
                    <div>${log.phone || '-'}</div>
                    ${customerInfo}
                    ${companyInfo}
                    ${detailsInfo}
                    ${budgetInfo}
                `;
                
                // Add lead quality indicator if available
                let qualityClass = '';
                let qualityLabel = '';
                if (log.leadQuality) {
                    qualityClass = `lead-${log.leadQuality.toLowerCase()}`;
                    qualityLabel = `<span class="lead-quality ${qualityClass}">${log.leadQuality}</span>`;
                }
                
                row.innerHTML = `
                    <td>${formattedDate}</td>
                    <td>${phoneWithInfo}</td>
                    <td>${log.selectedCity || '-'}</td>
                    <td>${log.selectedService || '-'} ${qualityLabel}</td>
                    <td>${log.supportNumber || '-'}</td>
                `;
                
                logsTableBody.appendChild(row);
            } catch (err) {
                console.error('Error rendering log row:', err, log);
            }
        });
    }
    
    async function getStats() {
        try {
            const response = await fetch(`/admin/stats?period=${currentPeriod}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            
            if (response.ok) {
                renderStats(data.data);
            } else {
                throw new Error(data.message || 'Failed to get stats');
            }
        } catch (error) {
            console.error('Error getting stats:', error);
        }
    }
    
    function renderStats(stats) {
        // Update total interactions
        document.getElementById('totalInteractions').textContent = stats.totalInteractions;
        
        // Render charts
        renderCityChart(stats.byCityCount);
        renderServiceChart(stats.byServiceCount);
        renderTimeChart(stats.byDayCount);
    }
    
    function renderCityChart(cityData) {
        const ctx = document.getElementById('cityChart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (charts.cityChart) {
            charts.cityChart.destroy();
        }
        
        const labels = Object.keys(cityData);
        const data = Object.values(cityData);
        
        charts.cityChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data,
                    backgroundColor: [
                        '#26447E',
                        '#5D89DD',
                        '#A8C5FF',
                        '#0F2559'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
    
    function renderServiceChart(serviceData) {
        const ctx = document.getElementById('serviceChart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (charts.serviceChart) {
            charts.serviceChart.destroy();
        }
        
        const labels = Object.keys(serviceData);
        const data = Object.values(serviceData);
        
        charts.serviceChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data,
                    backgroundColor: [
                        '#26447E',
                        '#5D89DD',
                        '#A8C5FF',
                        '#0F2559'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
    
    function renderTimeChart(timeData) {
        const ctx = document.getElementById('timeChart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (charts.timeChart) {
            charts.timeChart.destroy();
        }
        
        // Sort dates
        const sortedDates = Object.keys(timeData).sort();
        const data = sortedDates.map(date => timeData[date]);
        
        charts.timeChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: sortedDates,
                datasets: [{
                    label: 'Interactions',
                    data,
                    backgroundColor: 'rgba(93, 137, 221, 0.2)',
                    borderColor: '#5D89DD',
                    borderWidth: 2,
                    tension: 0.2,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });
    }
    
    function updateAccountInfo() {
        if (userData) {
            accountNameEl.textContent = userData.name || '-';
            accountEmailEl.textContent = userData.email || '-';
            accountRoleEl.textContent = userData.role || 'Admin';
        }
    }
}); 