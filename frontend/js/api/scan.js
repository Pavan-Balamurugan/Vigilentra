/**
 * Scan API calls: link, QR, document scanning and history retrieval.
 * @module api/scan
 */

import { apiRequest } from './client.js';

/**
 * Scan a URL for threats.
 * @param {string} url - The URL to scan.
 * @returns {Promise<object>} Scan result.
 */
export async function scanLink(url) {
    return apiRequest('/scan/link', {
        method: 'POST',
        body: JSON.stringify({ url }),
    });
}

/**
 * Scan an uploaded QR code image.
 * @param {File} file - The image file containing a QR code.
 * @returns {Promise<object>} Scan result.
 */
export async function scanQR(file) {
    const formData = new FormData();
    formData.append('file', file);
    return apiRequest('/scan/qr', {
        method: 'POST',
        body: formData,
    });
}

/**
 * Scan an uploaded document file.
 * @param {File} file - The document file (PDF, DOCX, XLSX).
 * @returns {Promise<object>} Scan result.
 */
export async function scanDocument(file) {
    const formData = new FormData();
    formData.append('file', file);
    return apiRequest('/scan/document', {
        method: 'POST',
        body: formData,
    });
}

/**
 * Fetch the current user's scan history.
 * @param {object} [params={}] - Query parameters.
 * @param {number} [params.page=1]
 * @param {number} [params.page_size=20]
 * @param {string} [params.verdict]
 * @param {string} [params.search]
 * @returns {Promise<object>} Paginated scan history.
 */
export async function getHistory(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page);
    if (params.page_size) query.set('page_size', params.page_size);
    if (params.verdict) query.set('verdict', params.verdict);
    if (params.search) query.set('search', params.search);
    const qs = query.toString();
    return apiRequest(`/scan/history${qs ? '?' + qs : ''}`);
}
