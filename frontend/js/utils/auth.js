/**
 * Token storage and authentication state management.
 * Uses localStorage with an in-memory fallback.
 * @module auth
 */

let _memoryToken = null;
let _memoryRole = null;

/**
 * Store the JWT access token.
 * @param {string} token - The JWT token string.
 */
export function setToken(token) {
    _memoryToken = token;
    try {
        localStorage.setItem('vigilentra_token', token);
    } catch {
        // localStorage unavailable (e.g., file:// in some browsers)
    }
}

/**
 * Retrieve the stored JWT token.
 * @returns {string|null} The token or null if not authenticated.
 */
export function getToken() {
    if (_memoryToken) return _memoryToken;
    try {
        const stored = localStorage.getItem('vigilentra_token');
        if (stored) _memoryToken = stored;
        return stored;
    } catch {
        return null;
    }
}

/**
 * Store the user's role.
 * @param {string} role - 'user' or 'admin'.
 */
export function setRole(role) {
    _memoryRole = role;
    try {
        localStorage.setItem('vigilentra_role', role);
    } catch {
        // fallback to memory only
    }
}

/**
 * Retrieve the user's role.
 * @returns {string|null} The role or null.
 */
export function getRole() {
    if (_memoryRole) return _memoryRole;
    try {
        const stored = localStorage.getItem('vigilentra_role');
        if (stored) _memoryRole = stored;
        return stored;
    } catch {
        return null;
    }
}

/**
 * Clear all authentication state and redirect to login.
 */
export function logout() {
    _memoryToken = null;
    _memoryRole = null;
    try {
        localStorage.removeItem('vigilentra_token');
        localStorage.removeItem('vigilentra_role');
    } catch {
        // ignore
    }
    window.location.href = 'index.html';
}

/**
 * Check whether a valid token is stored.
 * @returns {boolean}
 */
export function isAuthenticated() {
    return !!getToken();
}
