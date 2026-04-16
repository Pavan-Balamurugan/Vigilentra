/**
 * HTTP client wrapper with JWT injection and error handling.
 * @module api/client
 */

import { API_BASE_URL } from '../utils/constants.js';
import { getToken, logout } from '../utils/auth.js';

/**
 * Make an authenticated API request.
 * Automatically attaches the Bearer token and handles common errors.
 *
 * @param {string} endpoint - API path (e.g., '/auth/me').
 * @param {object} [options={}] - Fetch options.
 * @returns {Promise<any>} Parsed JSON response.
 * @throws {Error} On non-2xx responses.
 */
export async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = getToken();

    const headers = {
        ...(options.headers || {}),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Only set Content-Type for JSON bodies (not for FormData/file uploads)
    if (options.body && !(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        // Only redirect if already authenticated (i.e. a token exists).
        // On the login page there is no token yet, so just surface the error.
        if (getToken()) {
            logout();
            throw new Error('Session expired. Please log in again.');
        }
        throw new Error('Invalid email or password');
    }

    if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment before trying again.');
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const detail = errorData.detail;
        const message =
            typeof detail === 'string'
                ? detail
                : Array.isArray(detail)
                    ? detail.map(e => e.msg || JSON.stringify(e)).join(', ')
                    : `Request failed (${response.status})`;
        throw new Error(message);
    }

    return response.json();
}