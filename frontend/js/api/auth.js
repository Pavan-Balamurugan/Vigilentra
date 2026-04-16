/**
 * Authentication API calls: login, register, logout, get current user.
 * @module api/auth
 */

import { apiRequest } from './client.js';
import { setToken, setRole, logout as clearAuth } from '../utils/auth.js';

/**
 * Register a new user account.
 * @param {object} data - Registration data.
 * @param {string} data.email
 * @param {string} data.full_name
 * @param {string} data.password
 * @param {string} [data.institution]
 * @returns {Promise<object>} Created user profile.
 */
export async function register(data) {
    return apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

/**
 * Log in with email and password.
 * Stores the returned token and role.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<object>} Token response including role.
 */
export async function login(email, password) {
    const result = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
    setToken(result.access_token);
    setRole(result.role);
    return result;
}

/**
 * Fetch the current authenticated user's profile.
 * @returns {Promise<object>} User profile.
 */
export async function getMe() {
    return apiRequest('/auth/me');
}

/**
 * Log out the current user and redirect to login.
 */
export function logoutUser() {
    clearAuth();
}
