/**
 * Minimal client-side routing and redirect guards.
 * @module router
 */

import { isAuthenticated, getRole } from './auth.js';

/**
 * Redirect unauthenticated users to the login page.
 * Call this at the top of any protected page's init function.
 */
export function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'index.html';
    }
}

/**
 * Redirect non-admin users away from admin pages.
 * Also enforces authentication.
 */
export function requireAdmin() {
    requireAuth();
    if (getRole() !== 'admin') {
        window.location.href = 'scan.html';
    }
}

/**
 * Redirect already-authenticated users away from login/register pages.
 */
export function redirectIfAuthenticated() {
    if (isAuthenticated()) {
        const role = getRole();
        window.location.href = role === 'admin' ? 'admin.html' : 'scan.html';
    }
}
