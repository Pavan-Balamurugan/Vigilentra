/**
 * Admin sidebar navigation component with smooth scroll to dashboard sections.
 * @module components/Sidebar
 */

/**
 * Create the admin sidebar navigation.
 * Each item scrolls smoothly to its corresponding section on the dashboard.
 * @param {object} [options={}]
 * @param {string} [options.activeSection] - Active section identifier.
 * @returns {HTMLElement} The sidebar element.
 */
export function createSidebar(options = {}) {
    const { activeSection = 'overview' } = options;

    const el = document.createElement('aside');
    el.className = 'w-52 bg-slate-900 text-white flex-shrink-0 min-h-screen';
    el.id = 'admin-sidebar';

    const items = [
        {
            id: 'overview',
            label: 'Overview',
            target: 'section-overview',
            icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`,
        },
        {
            id: 'threat-feed',
            label: 'Threat Feed',
            target: 'section-threat-feed',
            icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
        },
        {
            id: 'users',
            label: 'Users',
            target: 'section-users',
            icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
        },
        {
            id: 'alerts',
            label: 'Alerts',
            target: 'section-alerts',
            icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>`,
        },
    ];

    el.innerHTML = `
        <div class="px-4 py-5 border-b border-slate-700">
            <div class="text-xs font-semibold uppercase tracking-wider text-slate-400">Admin Panel</div>
            <div class="text-sm text-slate-300 mt-1">Threat Management</div>
        </div>
        <nav class="mt-2 px-2">
            ${items.map(item => {
                const isActive = activeSection === item.id;
                return `
                    <button
                        data-sidebar-target="${item.target}"
                        data-sidebar-id="${item.id}"
                        class="sidebar-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-left text-sm transition-colors ${
                            isActive
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }"
                    >
                        ${item.icon}
                        <span>${item.label}</span>
                    </button>
                `;
            }).join('')}
        </nav>
    `;

    // Attach click handlers for smooth scrolling
    el.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-sidebar-target]');
        if (!btn) return;

        const targetId = btn.dataset.sidebarTarget;
        const targetEl = document.getElementById(targetId);

        if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        // Update active state
        el.querySelectorAll('.sidebar-item').forEach(item => {
            item.className = item.className
                .replace('bg-blue-600 text-white', '')
                .replace('text-slate-300 hover:bg-slate-800 hover:text-white', '');

            if (item === btn) {
                item.classList.add('bg-blue-600', 'text-white');
            } else {
                item.classList.add('text-slate-300', 'hover:bg-slate-800', 'hover:text-white');
            }
        });
    });

    return el;
}