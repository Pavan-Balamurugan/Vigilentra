/**
 * Admin dashboard page orchestrator.
 * @module pages/adminPage
 */

import { requireAdmin } from '../utils/router.js';
import { createNavbar } from '../components/Navbar.js';
import { createSidebar } from '../components/Sidebar.js';
import { createStatCard, updateStatCard } from '../components/StatCard.js';
import { createCategoryChart, createTimelineChart } from '../components/ChartPanel.js';
import { createThreatTable } from '../components/ThreatTable.js';
import { createAlertBanner } from '../components/AlertBanner.js';
import { createVerdictCard } from '../components/VerdictCard.js';
import { showModal } from '../components/Modal.js';
import { getStats, getThreats, getAlerts } from '../api/admin.js';
import { showToast } from '../components/Toast.js';

let threatPage = 1;
const THREAT_PAGE_SIZE = 10;
let lastAlertCount = 0;
let pollInterval = null;

/**
 * Initialize the admin dashboard page.
 */
export function initAdminPage() {
    requireAdmin();

    const app = document.getElementById('app');
    if (!app) return;

    // Navbar
    app.appendChild(createNavbar({ activePage: 'admin' }));

    // Layout with sidebar
    const layout = document.createElement('div');
    layout.className = 'layout-with-sidebar';

    const sidebar = createSidebar({ activeSection: 'overview' });
    layout.appendChild(sidebar);

    const mainContent = document.createElement('div');
    mainContent.className = 'layout-main';

    const main = document.createElement('main');
    main.className = 'p-6 max-w-7xl';

    // Alert banner container
    const alertContainer = document.createElement('div');
    alertContainer.id = 'admin-alert-container';
    alertContainer.className = 'mb-4 space-y-2';
    main.appendChild(alertContainer);

    // Header
    const header = document.createElement('div');
    header.className = 'mb-6';
    header.innerHTML = `
        <h1 class="text-2xl font-bold text-slate-900">Security Dashboard</h1>
        <p class="text-sm text-slate-500 mt-1">Real-time threat monitoring and analytics</p>
    `;
    main.appendChild(header);

    // Stat cards row
    const statsRow = document.createElement('div');
    statsRow.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6';
    statsRow.id = 'admin-stats-row';
    main.appendChild(statsRow);

    // Charts row
    const chartsRow = document.createElement('div');
    chartsRow.className = 'grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6';
    chartsRow.id = 'admin-charts-row';
    main.appendChild(chartsRow);

    // Threat feed header
    const threatHeader = document.createElement('div');
    threatHeader.className = 'flex items-center justify-between mb-4';
    threatHeader.innerHTML = `
        <h2 class="text-lg font-semibold text-slate-900">Live Threat Feed</h2>
        <span class="text-xs text-slate-400" id="threat-feed-status">Auto-refreshing every 10s</span>
    `;
    main.appendChild(threatHeader);

    // Threat table container
    const threatContainer = document.createElement('div');
    threatContainer.id = 'admin-threat-container';
    main.appendChild(threatContainer);

    mainContent.appendChild(main);
    layout.appendChild(mainContent);
    app.appendChild(layout);

    // Sidebar navigation
    sidebar.querySelectorAll('[data-section]').forEach(btn => {
        btn.addEventListener('click', () => {
            sidebar.querySelectorAll('[data-section]').forEach(b => b.classList.remove('bg-slate-800'));
            btn.classList.add('bg-slate-800');
        });
    });

    // Load data
    loadDashboard();

    // Auto-refresh threat feed every 10 seconds
    pollInterval = setInterval(() => {
        loadThreats();
        checkNewAlerts();
    }, 10000);
}

/**
 * Load all dashboard data: stats, charts, threats, alerts.
 */
async function loadDashboard() {
    try {
        const [stats, threats, alerts] = await Promise.all([
            getStats(),
            getThreats({ page: 1, page_size: THREAT_PAGE_SIZE }),
            getAlerts(false),
        ]);

        renderStats(stats);
        renderCharts(stats);
        renderThreats(threats);
        renderAlerts(alerts);

        lastAlertCount = alerts.length;
    } catch (err) {
        showToast({ message: 'Failed to load dashboard: ' + err.message, type: 'error' });
    }
}

/**
 * Render the four stat cards.
 * @param {object} stats - Admin stats response.
 */
function renderStats(stats) {
    const row = document.getElementById('admin-stats-row');
    if (!row) return;
    row.innerHTML = '';

    const detectionRate = typeof stats.detection_rate === 'number'
        ? stats.detection_rate.toFixed(1) + '%'
        : '0%';

    const cards = [
        {
            title: 'Total Scans Today',
            value: stats.total_scans_today,
            variant: 'default',
            icon: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>',
        },
        {
            title: 'Threats Blocked',
            value: stats.threats_blocked,
            variant: 'danger',
            icon: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>',
        },
        {
            title: 'Active Users',
            value: stats.active_users,
            subtitle: 'Last 7 days',
            variant: 'safe',
            icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle>',
        },
        {
            title: 'Detection Rate',
            value: detectionRate,
            variant: 'warning',
            icon: '<line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line>',
        },
    ];

    cards.forEach(config => row.appendChild(createStatCard(config)));
}

/**
 * Render the category doughnut chart and timeline chart.
 * @param {object} stats - Admin stats response.
 */
function renderCharts(stats) {
    const row = document.getElementById('admin-charts-row');
    if (!row) return;
    row.innerHTML = '';

    const categoryData = stats.threats_by_category || {};
    if (Object.keys(categoryData).length > 0) {
        row.appendChild(createCategoryChart({ data: categoryData }));
    } else {
        const empty = document.createElement('div');
        empty.className = 'card flex items-center justify-center text-slate-400 text-sm';
        empty.style.minHeight = '300px';
        empty.textContent = 'No threat data available for chart';
        row.appendChild(empty);
    }

    const timelineData = stats.scans_over_7_days || [];
    row.appendChild(createTimelineChart({ data: timelineData }));
}

/**
 * Load and render the threat feed table.
 */
async function loadThreats() {
    try {
        const data = await getThreats({ page: threatPage, page_size: THREAT_PAGE_SIZE });
        renderThreats(data);
    } catch {
        // Silently fail on polling errors
    }
}

/**
 * Render the threat table.
 * @param {object} data - Paginated threat data.
 */
function renderThreats(data) {
    const container = document.getElementById('admin-threat-container');
    if (!container) return;
    container.innerHTML = '';

    container.appendChild(createThreatTable({
        items: data.items,
        total: data.total,
        page: data.page,
        pageSize: THREAT_PAGE_SIZE,
        onPageChange: (newPage) => {
            threatPage = newPage;
            loadThreats();
        },
        onRowClick: (scan) => {
            const card = createVerdictCard(scan);
            showModal({ title: 'Threat Details', content: card });
        },
    }));
}

/**
 * Render unacknowledged alert banners.
 * @param {Array} alerts - List of alert objects.
 */
function renderAlerts(alerts) {
    const container = document.getElementById('admin-alert-container');
    if (!container) return;
    container.innerHTML = '';

    alerts.slice(0, 3).forEach(alert => {
        container.appendChild(createAlertBanner({
            message: alert.message,
            severity: alert.severity,
        }));
    });
}

/**
 * Check for new alerts and show banner if count increased.
 */
async function checkNewAlerts() {
    try {
        const alerts = await getAlerts(false);
        if (alerts.length > lastAlertCount) {
            renderAlerts(alerts);
            showToast({ message: 'New threat alert received', type: 'warning' });
        }
        lastAlertCount = alerts.length;
    } catch {
        // Silently fail
    }
}
