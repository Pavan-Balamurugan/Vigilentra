/**
 * Admin sidebar navigation component.
 * @module components/Sidebar
 */

/**
 * Create the admin sidebar navigation.
 * @param {object} [options={}]
 * @param {string} [options.activeSection] - Active section identifier.
 * @returns {HTMLElement} The sidebar element.
 */
export function createSidebar({ activeSection } = {}) {
    const sidebar = document.createElement('aside');
    sidebar.className = 'layout-sidebar bg-slate-900 text-white';

    const items = [
        { id: 'overview', label: 'Overview', icon: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>' },
        { id: 'threats', label: 'Threat Feed', icon: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>' },
        { id: 'users', label: 'Users', icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>' },
        { id: 'alerts', label: 'Alerts', icon: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path>' },
    ];

    const itemsHtml = items.map(item => {
        const isActive = activeSection === item.id;
        const bgClass = isActive ? 'bg-slate-800' : 'hover:bg-slate-800';
        return `
            <button data-section="${item.id}" class="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg ${bgClass} transition-colors text-left">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    ${item.icon}
                </svg>
                ${item.label}
            </button>
        `;
    }).join('');

    sidebar.innerHTML = `
        <div class="p-4 border-b border-slate-700">
            <div class="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Admin Panel</div>
            <div class="text-sm text-slate-300">Threat Management</div>
        </div>
        <div class="p-3 flex flex-col gap-1">
            ${itemsHtml}
        </div>
    `;

    return sidebar;
}
