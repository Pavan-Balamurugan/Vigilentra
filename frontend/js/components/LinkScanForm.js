/**
 * URL input form for link scanning.
 * @module components/LinkScanForm
 */

import { scanLink } from '../api/scan.js';
import { showToast } from './Toast.js';

/**
 * Create the link scan form.
 * @param {object} options
 * @param {Function} options.onResult - Callback with the scan result object.
 * @returns {HTMLElement} The form element.
 */
export function createLinkScanForm({ onResult }) {
    const el = document.createElement('div');

    el.innerHTML = `
        <form id="link-scan-form" class="space-y-4">
            <div>
                <label for="url-input" class="block text-sm font-medium text-slate-700 mb-1">URL to Scan</label>
                <input type="url" id="url-input" class="form-input" placeholder="https://example.com/suspicious-link" required />
            </div>
            <div class="flex items-center gap-3">
                <button type="submit" class="btn btn-primary" id="link-scan-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    Scan URL
                </button>
                <span id="link-scan-status" class="text-sm text-slate-500"></span>
            </div>
        </form>
    `;

    const form = el.querySelector('#link-scan-form');
    const btn = el.querySelector('#link-scan-btn');
    const statusEl = el.querySelector('#link-scan-status');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const url = el.querySelector('#url-input').value.trim();
        if (!url) return;

        btn.disabled = true;
        statusEl.innerHTML = '<span class="spinner"></span> Scanning...';

        try {
            const result = await scanLink(url);
            onResult(result);
            showToast({ message: 'Scan complete', type: 'success' });
        } catch (err) {
            showToast({ message: err.message, type: 'error' });
        } finally {
            btn.disabled = false;
            statusEl.textContent = '';
        }
    });

    return el;
}
