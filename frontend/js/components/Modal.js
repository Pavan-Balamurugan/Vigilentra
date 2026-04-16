/**
 * Reusable modal dialog component.
 * @module components/Modal
 */

/**
 * Create a modal overlay with content.
 * @param {object} options
 * @param {string} options.title - Modal title.
 * @param {string|HTMLElement} options.content - HTML string or DOM element for the body.
 * @param {Function} [options.onClose] - Callback when the modal is dismissed.
 * @returns {HTMLElement} The modal overlay element.
 */
export function createModal({ title, content, onClose }) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'modal-content';

    const header = document.createElement('div');
    header.className = 'flex items-center justify-between mb-4';
    header.innerHTML = `
        <h3 class="text-lg font-semibold text-slate-900">${title}</h3>
        <button class="text-slate-400 hover:text-slate-600 transition-colors" data-close>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
    `;

    const body = document.createElement('div');
    if (typeof content === 'string') {
        body.innerHTML = content;
    } else if (content instanceof HTMLElement) {
        body.appendChild(content);
    }

    modal.appendChild(header);
    modal.appendChild(body);
    overlay.appendChild(modal);

    function close() {
        overlay.remove();
        if (onClose) onClose();
    }

    header.querySelector('[data-close]').addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close();
    });

    return overlay;
}

/**
 * Show a modal by appending it to the document body.
 * @param {object} options - Same options as createModal.
 * @returns {HTMLElement} The modal overlay.
 */
export function showModal(options) {
    const modal = createModal(options);
    document.body.appendChild(modal);
    return modal;
}
