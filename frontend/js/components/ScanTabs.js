/**
 * Tab switcher component for Link / QR / Document scan modes.
 * @module components/ScanTabs
 */

/**
 * Create a tab switcher with three panels.
 * @param {object} options
 * @param {HTMLElement} options.linkPanel - Content for the Link tab.
 * @param {HTMLElement} options.qrPanel - Content for the QR tab.
 * @param {HTMLElement} options.docPanel - Content for the Document tab.
 * @returns {HTMLElement} The tab container element.
 */
export function createScanTabs({ linkPanel, qrPanel, docPanel }) {
    const el = document.createElement('div');

    const tabs = [
        { id: 'link', label: 'Link Scanner', icon: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>' },
        { id: 'qr', label: 'QR Scanner', icon: '<rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect>' },
        { id: 'doc', label: 'Document Scanner', icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline>' },
    ];

    const tabButtons = tabs.map((tab, i) => `
        <button class="tab-button flex items-center gap-2 ${i === 0 ? 'active' : ''}" data-tab="${tab.id}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                ${tab.icon}
            </svg>
            ${tab.label}
        </button>
    `).join('');

    el.innerHTML = `
        <div class="tab-list">${tabButtons}</div>
        <div class="tab-panels">
            <div class="tab-panel active" data-panel="link"></div>
            <div class="tab-panel" data-panel="qr"></div>
            <div class="tab-panel" data-panel="doc"></div>
        </div>
    `;

    // Mount panels
    el.querySelector('[data-panel="link"]').appendChild(linkPanel);
    el.querySelector('[data-panel="qr"]').appendChild(qrPanel);
    el.querySelector('[data-panel="doc"]').appendChild(docPanel);

    // Tab switching logic
    el.querySelectorAll('.tab-button').forEach(btn => {
        btn.addEventListener('click', () => {
            el.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
            el.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            el.querySelector(`[data-panel="${btn.dataset.tab}"]`).classList.add('active');
        });
    });

    return el;
}
