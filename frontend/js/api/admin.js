/**
 * Admin API calls: statistics, threats, users, and alerts.
 * @module api/admin
 */

import { apiRequest } from './client.js';

/**
 * Fetch aggregated dashboard statistics.
 * @returns {Promise<object>} Admin stats including totals, rates, and charts data.
 */
export async function getStats() {
    return apiRequest('/admin/stats');
}

/**
 * Fetch flagged threats (suspicious + malicious scans).
 * @param {object} [params={}] - Query parameters.
 * @param {number} [params.page=1]
 * @param {number} [params.page_size=20]
 * @returns {Promise<object>} Paginated threat list.
 */
export async function getThreats(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page);
    if (params.page_size) query.set('page_size', params.page_size);
    const qs = query.toString();
    return apiRequest(`/admin/threats${qs ? '?' + qs : ''}`);
}

/**
 * Fetch all registered users.
 * @returns {Promise<Array>} List of user profiles.
 */
export async function getUsers() {
    return apiRequest('/admin/users');
}

/**
 * Fetch system alerts.
 * @param {boolean} [acknowledged] - Filter by acknowledged state.
 * @returns {Promise<Array>} List of alerts.
 */
export async function getAlerts(acknowledged) {
    const query = new URLSearchParams();
    if (acknowledged !== undefined) query.set('acknowledged', acknowledged);
    const qs = query.toString();
    return apiRequest(`/admin/alerts${qs ? '?' + qs : ''}`);
}

/**
 * Mark an alert as acknowledged.
 * @param {string} alertId - The alert ID.
 * @returns {Promise<object>} Confirmation.
 */
export async function acknowledgeAlert(alertId) {
    return apiRequest(`/admin/alerts/${alertId}/acknowledge`, {
        method: 'POST',
    });
}
