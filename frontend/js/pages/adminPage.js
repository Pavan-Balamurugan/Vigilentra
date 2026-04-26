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
import { getStats, getThreats, getAlerts, getUsers, acknowledgeAlert } from '../api/admin.js';
import { showToast } from '../components/Toast.js';
import { formatDate } from '../utils/format.js';

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

    // ===== SECTION: Overview =====
    const overviewSection = document.createElement('div');
    overviewSection.id = 'section-overview';
    overviewSection.className = 'mb-8';

    // Alert banner container (top of overview)
    const alertContainer = document.createElement('div');
    alertContainer.id = 'admin-alert-container';
    alertContainer.className = 'mb-4 space-y-2';
    overviewSection.appendChild(alertContainer);

    // Header
    const header = document.createElement('div');
    header.className = 'mb-6';
    header.innerHTML = `
        <h1 class="text-2xl font-bold text-slate-900">Security Dashboard</h1>
        <p class="text-sm text-slate-500 mt-1">Real-time threat monitoring and analytics</p>
    `;
    overviewSection.appendChild(header);

    // Stat cards row
    const statsRow = document.createElement('div');
    statsRow.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6';
    statsRow.id = 'admin-stats-row';
    overviewSection.appendChild(statsRow);

    // Charts row
    const chartsRow = document.createElement('div');
    chartsRow.className = 'grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6';
    chartsRow.id = 'admin-charts-row';
    overviewSection.appendChild(chartsRow);

    main.appendChild(overviewSection);

    // ===== SECTION: Threat Feed =====
    const threatSection = document.createElement('div');
    threatSection.id = 'section-threat-feed';
    threatSection.className = 'mb-8';

    const threatHeader = document.createElement('div');
    threatHeader.className = 'flex items-center justify-between mb-4';
    threatHeader.innerHTML = `
        <h2 class="text-xl font-bold text-slate-900">Live Threat Feed</h2>
        <span class="text-xs text-slate-400" id="threat-feed-status">Auto-refreshing every 10s</span>
    `;
    threatSection.appendChild(threatHeader);

    const threatContainer = document.createElement('div');
    threatContainer.id = 'admin-threat-container';
    threatSection.appendChild(threatContainer);

    main.appendChild(threatSection);

    // ===== SECTION: Users =====
    const usersSection = document.createElement('div');
    usersSection.id = 'section-users';
    usersSection.className = 'mb-8';

    const usersHeader = document.createElement('div');
    usersHeader.className = 'mb-4';
    usersHeader.innerHTML = `
        <h2 class="text-xl font-bold text-slate-900">Registered Users</h2>
        <p class="text-sm text-slate-500 mt-1">All users registered on the platform</p>
    `;
    usersSection.appendChild(usersHeader);

    const usersContainer = document.createElement('div');
    usersContainer.id = 'admin-users-container';
    usersContainer.innerHTML = '<p class="text-sm text-slate-400">Loading users...</p>';
    usersSection.appendChild(usersContainer);

    main.appendChild(usersSection);

    // ===== SECTION: Alerts =====
    const alertsSection = document.createElement('div');
    alertsSection.id = 'section-alerts';
    alertsSection.className = 'mb-8';

    const alertsHeader = document.createElement('div');
    alertsHeader.className = 'mb-4';
    alertsHeader.innerHTML = `
        <h2 class="text-xl font-bold text-slate-900">System Alerts</h2>
        <p class="text-sm text-slate-500 mt-1">Alerts generated when malicious content is detected</p>
    `;
    alertsSection.appendChild(alertsHeader);

    const alertsContainer = document.createElement('div');
    alertsContainer.id = 'admin-alerts-container';
    alertsContainer.innerHTML = '<p class="text-sm text-slate-400">Loading alerts...</p>';
    alertsSection.appendChild(alertsContainer);

    main.appendChild(alertsSection);

    // Assemble layout
    mainContent.appendChild(main);
    layout.appendChild(mainContent);
    app.appendChild(layout);

    // Load data
    loadDashboard();

    // Auto-refresh threat feed every 10 seconds
    pollInterval = setInterval(() => {
        loadThreats();
        checkNewAlerts();
    }, 10000);
}

/**
 * Load all dashboard data: stats, charts, threats, alerts, users.
 */
async function loadDashboard() {
    try {
        const [stats, threats, alerts, users] = await Promise.all([
            getStats(),
            getThreats({ page: 1, page_size: THREAT_PAGE_SIZE }),
            getAlerts(false),
            getUsers(),
        ]);

        renderStats(stats);
        renderCharts(stats);
        renderThreats(threats);
        renderAlertBanners(alerts);
        renderUsers(users);
        renderAlertsTable(alerts);

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
 * Render unacknowledged alert banners at top of dashboard.
 * @param {Array} alerts - List of alert objects.
 */
function renderAlertBanners(alerts) {
    const container = document.getElementById('admin-alert-container');
    if (!container) return;
    container.innerHTML = '';

    const unacked = alerts.filter(a => !a.acknowledged);
    unacked.slice(0, 3).forEach(alert => {
        container.appendChild(createAlertBanner({
            message: alert.message,
            severity: alert.severity,
            onDismiss: () => {
                acknowledgeAlert(alert.id).catch(() => {});
            },
        }));
    });
}

/**
 * Render the users table.
 * @param {Array} users - List of user objects.
 */
function renderUsers(users) {
    const container = document.getElementById('admin-users-container');
    if (!container) return;

    if (!users || users.length === 0) {
        container.innerHTML = '<p class="text-sm text-slate-500">No users found.</p>';
        return;
    }

    const rowsHtml = users.map(user => {
        const roleBadge = user.role === 'admin'
            ? '<span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">Admin</span>'
            : '<span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">User</span>';

        return `
            <tr class="border-b border-slate-200 hover:bg-slate-50">
                <td class="py-3 px-4 text-sm font-medium text-slate-900">${user.full_name}</td>
                <td class="py-3 px-4 text-sm text-slate-600">${user.email}</td>
                <td class="py-3 px-4 text-sm text-slate-500">${user.institution || '-'}</td>
                <td class="py-3 px-4">${roleBadge}</td>
                <td class="py-3 px-4 text-sm text-slate-400">${formatDate(user.created_at)}</td>
            </tr>
        `;
    }).join('');

    container.innerHTML = `
        <div class="card p-0 overflow-hidden">
            <table class="w-full text-left">
                <thead>
                    <tr class="bg-slate-50 border-b border-slate-200">
                        <th class="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                        <th class="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                        <th class="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Institution</th>
                        <th class="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                        <th class="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined</th>
                    </tr>
                </thead>
                <tbody>${rowsHtml}</tbody>
            </table>
            <div class="px-4 py-3 bg-slate-50 border-t border-slate-200 text-sm text-slate-500">
                ${users.length} registered user${users.length !== 1 ? 's' : ''}
            </div>
        </div>
    `;
}

/**
 * Render the alerts table in the Alerts section.
 * @param {Array} alerts - List of alert objects.
 */
function renderAlertsTable(alerts) {
    const container = document.getElementById('admin-alerts-container');
    if (!container) return;

    if (!alerts || alerts.length === 0) {
        container.innerHTML = '<p class="text-sm text-slate-500">No alerts generated yet.</p>';
        return;
    }

    const rowsHtml = alerts.map(alert => {
        const severityBadge = alert.severity === 'high'
            ? '<span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">High</span>'
            : '<span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Medium</span>';

        const statusBadge = alert.acknowledged
            ? '<span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Acknowledged</span>'
            : '<span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600">Unread</span>';

        const ackButton = !alert.acknowledged
            ? `<button class="text-xs text-blue-700 hover:underline font-medium" data-ack-id="${alert.id}">Mark read</button>`
            : '';

        return `
            <tr class="border-b border-slate-200 hover:bg-slate-50">
                <td class="py-3 px-4">${severityBadge}</td>
                <td class="py-3 px-4 text-sm text-slate-700 max-w-md truncate" title="${alert.message}">${alert.message}</td>
                <td class="py-3 px-4">${statusBadge}</td>
                <td class="py-3 px-4 text-sm text-slate-400">${formatDate(alert.created_at)}</td>
                <td class="py-3 px-4">${ackButton}</td>
            </tr>
        `;
    }).join('');

    container.innerHTML = `
        <div class="card p-0 overflow-hidden">
            <table class="w-full text-left">
                <thead>
                    <tr class="bg-slate-50 border-b border-slate-200">
                        <th class="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Severity</th>
                        <th class="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Message</th>
                        <th class="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                        <th class="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Time</th>
                        <th class="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                    </tr>
                </thead>
                <tbody>${rowsHtml}</tbody>
            </table>
            <div class="px-4 py-3 bg-slate-50 border-t border-slate-200 text-sm text-slate-500">
                ${alerts.length} alert${alerts.length !== 1 ? 's' : ''} | ${alerts.filter(a => !a.acknowledged).length} unread
            </div>
        </div>
    `;

    // Bind acknowledge buttons
    container.querySelectorAll('[data-ack-id]').forEach(btn => {
        btn.addEventListener('click', async () => {
            try {
                await acknowledgeAlert(btn.dataset.ackId);
                showToast({ message: 'Alert acknowledged', type: 'success' });
                // Reload alerts
                const updatedAlerts = await getAlerts();
                renderAlertsTable(updatedAlerts);
                renderAlertBanners(updatedAlerts);
            } catch (err) {
                showToast({ message: err.message, type: 'error' });
            }
        });
    });
}

/**
 * Check for new alerts and show banner if count increased.
 */
async function checkNewAlerts() {
    try {
        const alerts = await getAlerts(false);
        if (alerts.length > lastAlertCount) {
            renderAlertBanners(alerts);
            renderAlertsTable(alerts);
            showToast({ message: 'New threat alert received', type: 'warning' });
        }
        lastAlertCount = alerts.length;
    } catch {
        // Silently fail
    }
}