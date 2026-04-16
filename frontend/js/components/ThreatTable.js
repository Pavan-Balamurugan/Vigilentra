/**
 * Paginated threat/scan data table with color-coded severity indicators.
 * @module components/ThreatTable
 */

import { formatDate, formatSeverity, formatCategory } from '../utils/format.js';

/**
 * Create a paginated data table for scan results.
 * @param {object} options
 * @param {Array} options.items - Array of scan result objects.
 * @param {number} options.total - Total number of items (for pagination).
 * @param {number} options.page - Current page number.
 * @param {number} options.pageSize - Items per page.
 * @param {Function} [options.onPageChange] - Callback when page changes.
 * @param {Function} [options.onRowClick] - Callback when a row is clicked.
 * @returns {HTMLElement} The table container element.
 */
export function createThreatTable({ items, total, page, pageSize, onPageChange, onRowClick }) {
    const el = document.createElement('div');
    el.className = 'card p-0 overflow-hidden';

    const totalPages = Math.ceil(total / pageSize) || 1;

    const rowsHtml = items.length > 0
        ? items.map(scan => {
            const borderClass = `severity-border-${scan.verdict}`;
            return `
                <tr class="${borderClass} cursor-pointer hover:bg-slate-50" data-scan-id="${scan.id}">
                    <td class="font-mono text-xs max-w-[200px] truncate" title="${scan.target}">${scan.target}</td>
                    <td><span class="badge badge-${scan.verdict}">${scan.verdict}</span></td>
                    <td class="text-sm">${Math.round(scan.severity)}</td>
                    <td class="text-sm">${formatCategory(scan.category)}</td>
                    <td class="text-sm capitalize">${scan.scan_type}</td>
                    <td class="text-sm text-slate-500">${formatDate(scan.created_at)}</td>
                </tr>
            `;
        }).join('')
        : `<tr><td colspan="6" class="text-center text-slate-500 py-8">No scans found</td></tr>`;

    el.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Target</th>
                    <th>Verdict</th>
                    <th>Severity</th>
                    <th>Category</th>
                    <th>Type</th>
                    <th>Date</th>
                </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
        </table>
        <div class="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200">
            <span class="text-sm text-slate-500">${total} total results | Page ${page} of ${totalPages}</span>
            <div class="flex gap-2">
                <button class="btn btn-secondary text-sm py-1 px-3" data-page="prev" ${page <= 1 ? 'disabled' : ''}>Previous</button>
                <button class="btn btn-secondary text-sm py-1 px-3" data-page="next" ${page >= totalPages ? 'disabled' : ''}>Next</button>
            </div>
        </div>
    `;

    // Pagination handlers
    if (onPageChange) {
        el.querySelector('[data-page="prev"]')?.addEventListener('click', () => {
            if (page > 1) onPageChange(page - 1);
        });
        el.querySelector('[data-page="next"]')?.addEventListener('click', () => {
            if (page < totalPages) onPageChange(page + 1);
        });
    }

    // Row click handlers
    if (onRowClick) {
        el.querySelectorAll('[data-scan-id]').forEach(row => {
            row.addEventListener('click', () => {
                const scanId = row.dataset.scanId;
                const scan = items.find(s => s.id === scanId);
                if (scan) onRowClick(scan);
            });
        });
    }

    return el;
}

/**
 * Replace the table content in a container with updated data.
 * @param {HTMLElement} container - The container holding the table.
 * @param {object} data - New table data (same shape as createThreatTable options).
 */
export function updateThreatTable(container, data) {
    container.innerHTML = '';
    container.appendChild(createThreatTable(data));
}
