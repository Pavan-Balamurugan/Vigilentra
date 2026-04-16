/**
 * Top-of-page alert banner for admin notifications.
 * @module components/AlertBanner
 */

/**
 * Create an alert banner for the admin dashboard.
 * @param {object} options
 * @param {string} options.message - Alert message text.
 * @param {string} [options.severity='high'] - Alert severity (high, medium, low).
 * @param {Function} [options.onDismiss] - Callback when the banner is dismissed.
 * @returns {HTMLElement} The alert banner element.
 */
export function createAlertBanner({ message, severity = 'high', onDismiss }) {
    const el = document.createElement('div');

    const styles = {
        high: 'bg-red-50 border-red-200 text-red-800',
        medium: 'bg-amber-50 border-amber-200 text-amber-800',
        low: 'bg-blue-50 border-blue-200 text-blue-800',
    };

    const iconPaths = {
        high: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>',
        medium: '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>',
        low: '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>',
    };

    el.className = `flex items-center justify-between px-4 py-3 border rounded-lg ${styles[severity] || styles.high}`;
    el.innerHTML = `
        <div class="flex items-center gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                ${iconPaths[severity] || iconPaths.high}
            </svg>
            <span class="text-sm font-medium">${message}</span>
        </div>
        <button class="text-current opacity-60 hover:opacity-100 transition-opacity" data-dismiss>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
    `;

    el.querySelector('[data-dismiss]').addEventListener('click', () => {
        el.remove();
        if (onDismiss) onDismiss();
    });

    return el;
}
