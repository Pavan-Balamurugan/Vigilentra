/**
 * Top navigation bar component with user info and navigation links.
 * @module components/Navbar
 */

import { getRole, logout } from '../utils/auth.js';
import { getMe } from '../api/auth.js';

/**
 * Create the top navigation bar.
 * @param {object} [options={}]
 * @param {string} [options.activePage] - Current page identifier for highlighting.
 * @returns {HTMLElement} The navbar element.
 */
export function createNavbar({ activePage } = {}) {
    const role = getRole();
    const nav = document.createElement('nav');
    nav.className = 'bg-white border-b border-slate-200 shadow-sm';

    const navLinks = [
        { href: 'scan.html', label: 'Scan', page: 'scan' },
        { href: 'history.html', label: 'History', page: 'history' },
    ];

    if (role === 'admin') {
        navLinks.push({ href: 'admin.html', label: 'Dashboard', page: 'admin' });
    }

    const linksHtml = navLinks.map(link => {
        const isActive = activePage === link.page;
        const activeClass = isActive
            ? 'text-blue-800 border-b-2 border-blue-800'
            : 'text-slate-600 hover:text-slate-900';
        return `<a href="${link.href}" class="px-3 py-4 text-sm font-medium ${activeClass} transition-colors">${link.label}</a>`;
    }).join('');

    nav.innerHTML = `
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-14">
                <div class="flex items-center gap-6">
                    <a href="${role === 'admin' ? 'admin.html' : 'scan.html'}" class="flex items-center gap-2 text-slate-900 font-bold text-lg">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-800">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                        </svg>
                        Vigilentra
                    </a>
                    <div class="flex items-center">
                        ${linksHtml}
                    </div>
                </div>
                <div class="flex items-center gap-4">
                    <span class="text-sm text-slate-500" id="navbar-user-name"></span>
                    <button id="navbar-logout-btn" class="btn btn-secondary text-sm py-1.5 px-3">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16 17 21 12 16 7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                        Logout
                    </button>
                </div>
            </div>
        </div>
    `;

    // Bind logout
    nav.querySelector('#navbar-logout-btn').addEventListener('click', () => {
        logout();
    });

    // Load user name
    getMe().then(user => {
        const nameEl = nav.querySelector('#navbar-user-name');
        if (nameEl) nameEl.textContent = user.full_name;
    }).catch(() => {
        // Silently fail -- user might not be loaded yet
    });

    return nav;
}
