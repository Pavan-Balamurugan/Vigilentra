/**
 * Transient notification component for success/error/warning messages.
 * @module components/Toast
 */

let _container = null;

/**
 * Ensure the toast container exists in the DOM.
 * @returns {HTMLElement} The toast container element.
 */
function getContainer() {
    if (!_container) {
        _container = document.createElement('div');
        _container.className = 'toast-container';
        document.body.appendChild(_container);
    }
    return _container;
}

/**
 * Show a toast notification.
 * @param {object} options
 * @param {string} options.message - The notification text.
 * @param {string} [options.type='success'] - One of 'success', 'error', 'warning'.
 * @param {number} [options.duration=3000] - Auto-dismiss time in milliseconds.
 * @returns {HTMLElement} The toast element.
 */
export function showToast({ message, type = 'success', duration = 3000 }) {
    const container = getContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.2s ease';
        setTimeout(() => toast.remove(), 200);
    }, duration);

    return toast;
}
