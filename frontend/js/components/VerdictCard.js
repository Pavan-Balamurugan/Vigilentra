/**
 * Scan result verdict display component.
 * @module components/VerdictCard
 */

import { formatDate, formatSeverity, formatCategory } from '../utils/format.js';
import { VERDICT_COLORS } from '../utils/constants.js';

/**
 * Create a verdict card displaying detailed scan results.
 * @param {object} result - The scan result object from the API.
 * @returns {HTMLElement} The verdict card element.
 */
export function createVerdictCard(result) {
    const el = document.createElement('div');
    const colors = VERDICT_COLORS[result.verdict] || VERDICT_COLORS.safe;

    el.className = 'card mt-6';
    el.style.borderLeft = `4px solid ${colors.border}`;

    const engineHtml = result.engine_results
        ? Object.entries(result.engine_results).map(([engine, data]) => {
            const status = data.status || 'analyzed';
            return `
                <div class="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <span class="text-sm font-medium text-slate-700">${engine.replace(/_/g, ' ')}</span>
                    <span class="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">${status}</span>
                </div>
            `;
        }).join('')
        : '<p class="text-sm text-slate-500">No engine details available</p>';

    const explanationHtml = result.explanation && result.explanation.length > 0
        ? result.explanation.map(reason => `
            <li class="flex items-start gap-2 text-sm text-slate-600">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mt-0.5 flex-shrink-0 text-slate-400">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                ${reason}
            </li>
        `).join('')
        : '<li class="text-sm text-slate-500">No concerns identified</li>';

    el.innerHTML = `
        <div class="flex items-start justify-between mb-4">
            <div>
                <div class="flex items-center gap-3 mb-1">
                    <span class="badge badge-${result.verdict}">${result.verdict.toUpperCase()}</span>
                    <span class="text-sm text-slate-500">${formatCategory(result.category)}</span>
                </div>
                <p class="text-sm text-slate-600 font-mono break-all">${result.target}</p>
            </div>
            <div class="text-right">
                <div class="text-2xl font-bold" style="color: ${colors.text}">${Math.round(result.severity)}</div>
                <div class="text-xs text-slate-500">${formatSeverity(result.severity)}</div>
            </div>
        </div>

        <div class="mb-4">
            <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all duration-500" style="width: ${Math.min(result.severity, 100)}%; background-color: ${colors.border}"></div>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h4 class="text-sm font-semibold text-slate-900 mb-2">Analysis Details</h4>
                <ul class="space-y-2">${explanationHtml}</ul>
            </div>
            <div>
                <h4 class="text-sm font-semibold text-slate-900 mb-2">Engine Results</h4>
                <div>${engineHtml}</div>
            </div>
        </div>

        <div class="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400">
            Scanned at ${formatDate(result.created_at)} | Type: ${result.scan_type}
        </div>
    `;

    return el;
}

/**
 * Update a verdict card with new scan result data.
 * @param {HTMLElement} container - The container holding the verdict card.
 * @param {object} result - New scan result object.
 */
export function updateVerdictCard(container, result) {
    container.innerHTML = '';
    container.appendChild(createVerdictCard(result));
}
