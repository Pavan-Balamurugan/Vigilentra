/**
 * Scan history page orchestrator.
 * @module pages/historyPage
 */

import { requireAuth } from '../utils/router.js';
import { createNavbar } from '../components/Navbar.js';
import { createThreatTable } from '../components/ThreatTable.js';
import { createVerdictCard } from '../components/VerdictCard.js';
import { showModal } from '../components/Modal.js';
import { getHistory } from '../api/scan.js';
import { showToast } from '../components/Toast.js';

let currentPage = 1;
let currentVerdict = '';
let currentSearch = '';
const PAGE_SIZE = 15;

/**
 * Initialize the history page.
 * Mounts navbar, filter controls, and the scan history table.
 */
export function initHistoryPage() {
    requireAuth();

    const app = document.getElementById('app');
    if (!app) return;

    app.appendChild(createNavbar({ activePage: 'history' }));

    const main = document.createElement('main');
    main.className = 'max-w-6xl mx-auto px-4 py-8';

    // Header
    const header = document.createElement('div');
    header.className = 'mb-6';
    header.innerHTML = `
        <h1 class="text-2xl font-bold text-slate-900">Scan History</h1>
        <p class="text-sm text-slate-500 mt-1">Review your past scan results</p>
    `;
    main.appendChild(header);

    // Filters
    const filters = document.createElement('div');
    filters.className = 'flex flex-wrap items-center gap-3 mb-4';
    filters.innerHTML = `
        <input type="text" id="history-search" class="form-input max-w-xs" placeholder="Search by URL or filename..." />
        <select id="history-verdict-filter" class="form-input max-w-[160px]">
            <option value="">All Verdicts</option>
            <option value="safe">Safe</option>
            <option value="suspicious">Suspicious</option>
            <option value="malicious">Malicious</option>
        </select>
    `;
    main.appendChild(filters);

    // Table container
    const tableContainer = document.createElement('div');
    tableContainer.id = 'history-table-container';
    main.appendChild(tableContainer);

    app.appendChild(main);

    // Bind filter events
    let searchTimeout = null;
    document.getElementById('history-search').addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            currentSearch = e.target.value.trim();
            currentPage = 1;
            loadHistory(tableContainer);
        }, 300);
    });

    document.getElementById('history-verdict-filter').addEventListener('change', (e) => {
        currentVerdict = e.target.value;
        currentPage = 1;
        loadHistory(tableContainer);
    });

    // Initial load
    loadHistory(tableContainer);
}

/**
 * Load and render the scan history table.
 * @param {HTMLElement} container - The table mount point.
 */
async function loadHistory(container) {
    try {
        const data = await getHistory({
            page: currentPage,
            page_size: PAGE_SIZE,
            verdict: currentVerdict || undefined,
            search: currentSearch || undefined,
        });

        container.innerHTML = '';
        container.appendChild(createThreatTable({
            items: data.items,
            total: data.total,
            page: data.page,
            pageSize: PAGE_SIZE,
            onPageChange: (newPage) => {
                currentPage = newPage;
                loadHistory(container);
            },
            onRowClick: (scan) => {
                const card = createVerdictCard(scan);
                showModal({ title: 'Scan Details', content: card });
            },
        }));
    } catch (err) {
        showToast({ message: err.message, type: 'error' });
    }
}
